import { DEMO_EMAIL_DOMAIN, ORPHAN_GRACE_MS, parseDemoMetadata } from "@/lib/demo";
import type { prisma } from "@/lib/db";

const BATCH_SIZE = 50;
const CLERK_PAGE_SIZE = 100;
const MAX_CLERK_PAGES = 10;


// Just what the job uses, so tests can pass plain mocks
export type CleanupDb = Pick<typeof prisma, "user">;

export interface CleanupClerk {
  users: {
    getUserList: (args: Record<string, unknown>) => Promise<{
      data: { id: string; publicMetadata: unknown }[];
    }>;
    deleteUser: (id: string) => Promise<unknown>;
  };
}

export interface CleanupResult {
  expiredDeleted: number;
  orphansDeleted: number;
  failed: number;
}

function isNotFound(error: unknown) {
  return typeof error === "object" && error !== null && "status" in error && error.status === 404;
}

// Deleting a Clerk user that is already gone counts as success, so a retry never gets stuck
async function deleteClerkUser(clerk: CleanupClerk, id: string): Promise<boolean> {
  try {
    await clerk.users.deleteUser(id);
    return true;
  } catch (error) {
    if (isNotFound(error)) return true;
    console.error("Demo cleanup: could not delete Clerk user", id, error);
    return false;
  }
}

// Deletes expired demos and sweeps up Clerk demo users whose database row never got created.
// Safe to run twice. Clerk goes first: a DB row is only removed once its Clerk user is gone, so a
// failed Clerk delete leaves the row for the next run.
export async function cleanupDemos({
  db,
  clerk,
  now,
}: {
  db: CleanupDb;
  clerk: CleanupClerk;
  now: Date;
}): Promise<CleanupResult> {
  const result: CleanupResult = { expiredDeleted: 0, orphansDeleted: 0, failed: 0 };

  // 1. Expired demos, a batch at a time (the next run picks up the rest)
  const expired = await db.user.findMany({
    where: { isDemo: true, OR: [{ demoExpiresAt: null }, { demoExpiresAt: { lte: now } }] },
    select: { id: true, clerkId: true },
    take: BATCH_SIZE,
  });
  for (const user of expired) {
    if (!(await deleteClerkUser(clerk, user.clerkId))) {
      result.failed++;
      continue;
    }
    // Habits, completions and journal entries cascade
    await db.user.deleteMany({ where: { id: user.id } });
    result.expiredDeleted++;
  }

  // 2. Orphans: Clerk demo users with no database row. Collect them all first, because deleting
  // while paging would shift the pages.
  const candidates: string[] = [];
  for (let page = 0; page < MAX_CLERK_PAGES; page++) {
    const { data } = await clerk.users.getUserList({
      query: DEMO_EMAIL_DOMAIN,
      limit: CLERK_PAGE_SIZE,
      offset: page * CLERK_PAGE_SIZE,
      orderBy: "+created_at",
      // Anything newer may still be mid-creation
      createdAtBefore: now.getTime() - ORPHAN_GRACE_MS,
    });
    for (const clerkUser of data) {
      if (parseDemoMetadata(clerkUser.publicMetadata).isDemo) candidates.push(clerkUser.id);
    }
    if (data.length < CLERK_PAGE_SIZE) break;
  }

  if (candidates.length > 0) {
    const rows = await db.user.findMany({
      where: { clerkId: { in: candidates } },
      select: { id: true, clerkId: true },
    });
    const withRow = new Set(rows.map((row) => row.clerkId));
    for (const clerkId of candidates.filter((id) => !withRow.has(id))) {
      if (await deleteClerkUser(clerk, clerkId)) result.orphansDeleted++;
      else result.failed++;
    }
  }

  return result;
}
