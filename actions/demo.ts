"use server";

import { randomBytes } from "node:crypto";
import { clerkClient } from "@clerk/nextjs/server";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { DEMO_EMAIL_DOMAIN, demoExpiryFrom, demoMetadata, isDemoExpired } from "@/lib/demo";
import { DEMO_COOKIE_NAME, signDemoCookie, verifyDemoCookie } from "@/lib/demo-cookie";
import { clientIp, hashIp } from "@/lib/demo-ip";
import {
  PENDING,
  claimSlot,
  demoIpKey,
  fillSlot,
  getRedis,
  readSlot,
  refundDailyDemo,
  releaseSlot,
  reserveDailyDemo,
  type SlotStore,
} from "@/lib/demo-redis";
import { seedDemoUser } from "@/lib/demo-seed";
import { getSessionUser } from "@/lib/session";
import { isValidTimezone } from "@/lib/settings";
import type { ActionResult } from "@/types/actions";

const inputSchema = z.object({ timezone: z.string().max(64).optional() });

const UNAVAILABLE = "Demos are temporarily unavailable, please try again shortly";
const FAILED = "Could not start the demo, please try again";
const BUSY = "The demo is very busy today, please try again tomorrow";

// The sign-in token only has to survive the trip back to the browser
const TICKET_SECONDS = 60;
// A second press while the first is still creating the demo waits this long for it
const WAIT_ATTEMPTS = 4;
const WAIT_MS = 750;

type Clerk = Awaited<ReturnType<typeof clerkClient>>;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function setResumeCookie(clerkId: string, expiresAt: Date, secret: string) {
  (await cookies()).set(DEMO_COOKIE_NAME, signDemoCookie(clerkId, expiresAt, secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

// Signs back into an existing demo: a one-time ticket the browser exchanges for a session.
// Null when the demo is gone or expired.
async function resumeDemo(clerk: Clerk, clerkId: string, secret: string, now: Date): Promise<string | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { isDemo: true, demoExpiresAt: true },
    });
    if (!user || !user.isDemo || !user.demoExpiresAt || isDemoExpired(user, now)) return null;

    const { token } = await clerk.signInTokens.createSignInToken({
      userId: clerkId,
      expiresInSeconds: TICKET_SECONDS,
    });
    await setResumeCookie(clerkId, user.demoExpiresAt, secret);
    return token;
  } catch (error) {
    console.error("Could not resume the demo:", error);
    return null;
  }
}

// A press that lost the race waits for the winner to finish creating its demo
async function waitForSlot(store: SlotStore, key: string): Promise<string | null> {
  let value: string | null = PENDING;
  for (let attempt = 0; attempt < WAIT_ATTEMPTS && value === PENDING; attempt++) {
    await sleep(WAIT_MS);
    value = await readSlot(store, key);
  }
  return value;
}

// Undoes whatever a failed creation managed to make; every step is best effort
async function cleanUpPartialDemo(
  clerk: Clerk,
  store: SlotStore,
  key: string,
  clerkId: string | null,
  now: Date,
) {
  if (clerkId) {
    await clerk.users.deleteUser(clerkId).catch((error: unknown) => console.error("Demo cleanup (Clerk):", error));
    await prisma.user.deleteMany({ where: { clerkId } }).catch((error: unknown) => console.error("Demo cleanup (DB):", error));
  }
  await releaseSlot(store, key).catch((error: unknown) => console.error("Demo cleanup (Redis):", error));
  // The demo was never made, so it should not count against today's limit
  await refundDailyDemo(store, now).catch((error: unknown) => console.error("Demo cleanup (Redis):", error));
}

async function createDemo(
  clerk: Clerk,
  store: SlotStore,
  key: string,
  secret: string,
  timezone: string,
  now: Date,
): Promise<ActionResult<{ ticket: string }>> {
  let clerkId: string | null = null;
  try {
    const expiresAt = demoExpiryFrom(now);
    const created = await clerk.users.createUser({
      emailAddress: [`demo-${randomBytes(8).toString("hex")}@${DEMO_EMAIL_DOMAIN}`],
      firstName: "Demo",
      lastName: "Visitor",
      skipPasswordRequirement: true,
      publicMetadata: demoMetadata(expiresAt),
    });
    clerkId = created.id;

    // The webhook or getSessionUser may have made a plain row already, so set the demo fields on update too
    const user = await prisma.user.upsert({
      where: { clerkId },
      update: { isDemo: true, demoExpiresAt: expiresAt, timezone },
      create: { clerkId, isDemo: true, demoExpiresAt: expiresAt, timezone },
    });
    await seedDemoUser({ userId: user.id, timezone, now });

    await fillSlot(store, key, clerkId, expiresAt, now);
    const { token } = await clerk.signInTokens.createSignInToken({
      userId: clerkId,
      expiresInSeconds: TICKET_SECONDS,
    });
    await setResumeCookie(clerkId, expiresAt, secret);
    return { success: true, data: { ticket: token } };
  } catch (error) {
    console.error("Could not create the demo:", error);
    await cleanUpPartialDemo(clerk, store, key, clerkId, now);
    return { success: false, error: FAILED };
  }
}

// The Try demo button. Returns a one-time sign-in ticket for the browser to exchange for a session:
// the visitor's own demo if their IP (or resume cookie) already has one, otherwise a new one.
// Each IP gets one live demo; if Redis is down, new demos are blocked to protect the Clerk user quota.
export async function startDemo(input: z.input<typeof inputSchema>): Promise<ActionResult<{ ticket: string }>> {
  const parsed = inputSchema.safeParse(input);
  const requested = parsed.success ? parsed.data.timezone : undefined;
  const timezone = requested && isValidTimezone(requested) ? requested : "UTC";

  // Someone already signed in has no use for a demo (and the sign-in pages redirect them anyway)
  if (await getSessionUser()) return { success: false, error: "You are already signed in" };

  const secret = process.env.DEMO_COOKIE_SECRET;
  if (!secret) {
    console.error("DEMO_COOKIE_SECRET is not set");
    return { success: false, error: UNAVAILABLE };
  }

  const now = new Date();
  const [headerList, cookieStore, clerk] = await Promise.all([headers(), cookies(), clerkClient()]);
  const ip = clientIp(headerList);
  // Without an address the one-per-IP rule can't be kept, so fail closed
  if (!ip) return { success: false, error: UNAVAILABLE };

  const store = getRedis();
  const key = demoIpKey(hashIp(ip, secret));

  // 1. This IP already has a demo?
  let redisUp = true;
  let slot: string | null = null;
  try {
    slot = await readSlot(store, key);
    if (slot === PENDING) slot = await waitForSlot(store, key);
  } catch (error) {
    console.error("Redis is unreachable:", error);
    redisUp = false;
  }
  if (slot && slot !== PENDING) {
    const ticket = await resumeDemo(clerk, slot, secret, now);
    if (ticket) return { success: true, data: { ticket } };
    // The demo is gone but its slot is still held: free it so this IP can start a new one
    await releaseSlot(store, key).catch((error: unknown) => console.error("Could not free the slot:", error));
  }

  // 2. Or this browser does (the IP may have changed). Works even when Redis is down.
  const cookieValue = cookieStore.get(DEMO_COOKIE_NAME)?.value;
  const resume = verifyDemoCookie(cookieValue, secret, now);
  if (resume) {
    const ticket = await resumeDemo(clerk, resume.clerkId, secret, now);
    if (ticket) return { success: true, data: { ticket } };
  }
  if (cookieValue) cookieStore.delete(DEMO_COOKIE_NAME);

  if (!redisUp) return { success: false, error: UNAVAILABLE };

  // 3. Claim the slot, then create the demo
  let claimed = false;
  try {
    claimed = await claimSlot(store, key);
  } catch (error) {
    console.error("Redis is unreachable:", error);
    return { success: false, error: UNAVAILABLE };
  }

  if (!claimed) {
    // Another press from this IP got there first: join its demo
    const winner = await waitForSlot(store, key).catch(() => null);
    if (winner && winner !== PENDING) {
      const ticket = await resumeDemo(clerk, winner, secret, now);
      if (ticket) return { success: true, data: { ticket } };
    }
    return { success: false, error: FAILED };
  }

  // Only a brand-new demo uses up the daily allowance (resuming one never does)
  try {
    if (!(await reserveDailyDemo(store, now))) {
      await releaseSlot(store, key).catch((error: unknown) => console.error("Could not free the slot:", error));
      return { success: false, error: BUSY };
    }
  } catch (error) {
    console.error("Redis is unreachable:", error);
    await releaseSlot(store, key).catch((releaseError: unknown) => console.error("Could not free the slot:", releaseError));
    return { success: false, error: UNAVAILABLE };
  }

  return createDemo(clerk, store, key, secret, timezone, now);
}
