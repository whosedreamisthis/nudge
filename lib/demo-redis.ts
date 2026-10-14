import { Redis } from "@upstash/redis";
import { DEMO_LIFETIME_MS } from "@/lib/demo";

// The Upstash database is shared with other projects, so every key starts with "nudge:" and this app
// only touches exact keys it built here: never KEYS, SCAN, FLUSHDB or FLUSHALL.
const KEY_PREFIX = "nudge:";

// While a demo is being created its slot holds this, briefly, so a second press can wait for it
export const PENDING = "pending";
export const PENDING_TTL_SECONDS = 60;
export const DEMO_TTL_SECONDS = DEMO_LIFETIME_MS / 1000;

// New demos allowed per UTC day, across all visitors. One IP gets one demo, but many IPs could still
// use up the Clerk user quota, so this is the overall brake.
export const DEMO_DAILY_LIMIT = 100;
const DAILY_KEY_TTL_SECONDS = 2 * 24 * 60 * 60;

export function demoIpKey(ipHash: string): string {
  return `${KEY_PREFIX}demo:ip:${ipHash}`;
}

export function demoDailyKey(now: Date): string {
  return `${KEY_PREFIX}demo:daily:${now.toISOString().slice(0, 10)}`;
}

// What the slot helpers need from Redis, so tests can pass a plain mock
export interface SlotStore {
  get(key: string): Promise<unknown>;
  set(key: string, value: string, options: { nx?: boolean; ex: number }): Promise<unknown>;
  del(key: string): Promise<unknown>;
  incr(key: string): Promise<number>;
  decr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<unknown>;
}

let client: Redis | null = null;

// Created on first use, so builds and tests don't need the env vars
export function getRedis(): SlotStore {
  client ??= Redis.fromEnv();
  return client as unknown as SlotStore;
}

export async function readSlot(store: SlotStore, key: string): Promise<string | null> {
  const value = await store.get(key);
  return typeof value === "string" && value ? value : null;
}

// Atomic claim (SET NX): true for exactly one of several simultaneous presses
export async function claimSlot(store: SlotStore, key: string): Promise<boolean> {
  const result = await store.set(key, PENDING, { nx: true, ex: PENDING_TTL_SECONDS });
  return result === "OK";
}

// Records the demo in the slot and gives it the demo's remaining lifetime, so it frees itself
export async function fillSlot(store: SlotStore, key: string, clerkId: string, expiresAt: Date, now: Date) {
  const seconds = Math.max(1, Math.ceil((expiresAt.getTime() - now.getTime()) / 1000));
  await store.set(key, clerkId, { ex: seconds });
}

// Counts one more new demo today. False when today's limit is already used up; the count is given
// back then, so refused presses don't keep the counter climbing.
export async function reserveDailyDemo(store: SlotStore, now: Date, limit = DEMO_DAILY_LIMIT): Promise<boolean> {
  const key = demoDailyKey(now);
  const count = await store.incr(key);
  // The first demo of the day sets the counter's expiry, so old days clean themselves up
  if (count === 1) await store.expire(key, DAILY_KEY_TTL_SECONDS);
  if (count > limit) {
    await store.decr(key);
    return false;
  }
  return true;
}

// Gives back a reserved demo that was never created
export async function refundDailyDemo(store: SlotStore, now: Date) {
  await store.decr(demoDailyKey(now));
}

export async function releaseSlot(store: SlotStore, key: string) {
  await store.del(key);
}
