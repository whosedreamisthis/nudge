import { describe, expect, it, vi } from "vitest";
import {
  DEMO_TTL_SECONDS,
  PENDING,
  PENDING_TTL_SECONDS,
  claimSlot,
  demoDailyKey,
  demoIpKey,
  fillSlot,
  readSlot,
  refundDailyDemo,
  releaseSlot,
  reserveDailyDemo,
  type SlotStore,
} from "@/lib/demo-redis";

function fakeStore(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  const set = vi.fn(async (key: string, value: string, options: { nx?: boolean; ex: number }) => {
    if (options.nx && data.has(key)) return null;
    data.set(key, value);
    return "OK";
  });
  const counters = new Map<string, number>();
  const expire = vi.fn(async () => 1);
  const store: SlotStore = {
    get: async (key) => data.get(key) ?? null,
    set,
    incr: async (key) => {
      counters.set(key, (counters.get(key) ?? 0) + 1);
      return counters.get(key)!;
    },
    decr: async (key) => {
      counters.set(key, (counters.get(key) ?? 0) - 1);
      return counters.get(key)!;
    },
    expire,
    del: vi.fn(async (key: string) => {
      data.delete(key);
    }),
  };
  return { store, data, set, counters, expire };
}

describe("demoIpKey", () => {
  it("is namespaced, because the Redis database is shared with other projects", () => {
    expect(demoIpKey("abc")).toBe("nudge:demo:ip:abc");
  });
});

describe("DEMO_TTL_SECONDS", () => {
  it("is the demo's 12 hours", () => {
    expect(DEMO_TTL_SECONDS).toBe(43_200);
  });
});

describe("claimSlot", () => {
  it("lets exactly one of two claims win, with a short pending lifetime", async () => {
    const { store, set } = fakeStore();

    expect(await claimSlot(store, "k")).toBe(true);
    expect(await claimSlot(store, "k")).toBe(false);
    expect(set).toHaveBeenCalledWith("k", PENDING, { nx: true, ex: PENDING_TTL_SECONDS });
    expect(PENDING_TTL_SECONDS).toBeLessThanOrEqual(60);
  });

  it("does not claim a slot that already holds a demo", async () => {
    const { store } = fakeStore({ k: "user_1" });

    expect(await claimSlot(store, "k")).toBe(false);
  });
});

describe("fillSlot", () => {
  it("stores the demo with its remaining lifetime", async () => {
    const { store, data, set } = fakeStore({ k: PENDING });
    const now = new Date("2026-10-14T12:00:00Z");

    await fillSlot(store, "k", "user_1", new Date("2026-10-15T00:00:00Z"), now);

    expect(data.get("k")).toBe("user_1");
    expect(set).toHaveBeenLastCalledWith("k", "user_1", { ex: 43_200 });
  });

  it("never sets a lifetime below one second", async () => {
    const { store, set } = fakeStore();
    const now = new Date("2026-10-14T12:00:00Z");

    await fillSlot(store, "k", "user_1", now, now);

    expect(set).toHaveBeenLastCalledWith("k", "user_1", { ex: 1 });
  });
});

describe("readSlot and releaseSlot", () => {
  it("reads a held slot and nothing for a free one", async () => {
    const { store } = fakeStore({ k: "user_1" });

    expect(await readSlot(store, "k")).toBe("user_1");
    expect(await readSlot(store, "other")).toBeNull();
  });

  it("deletes only the key it is given", async () => {
    const { store, data } = fakeStore({ k: "user_1", other: "x" });

    await releaseSlot(store, "k");

    expect([...data.keys()]).toEqual(["other"]);
  });
});

describe("demoDailyKey", () => {
  it("is namespaced and per UTC day", () => {
    expect(demoDailyKey(new Date("2026-10-14T23:59:00Z"))).toBe("nudge:demo:daily:2026-10-14");
    expect(demoDailyKey(new Date("2026-10-15T00:00:00Z"))).toBe("nudge:demo:daily:2026-10-15");
  });
});

describe("reserveDailyDemo and refundDailyDemo", () => {
  const NOW = new Date("2026-10-14T12:00:00Z");

  it("allows demos up to the limit and refuses the next, without letting the count climb", async () => {
    const { store, counters } = fakeStore();

    expect(await reserveDailyDemo(store, NOW, 2)).toBe(true);
    expect(await reserveDailyDemo(store, NOW, 2)).toBe(true);
    expect(await reserveDailyDemo(store, NOW, 2)).toBe(false);
    expect(await reserveDailyDemo(store, NOW, 2)).toBe(false);
    expect(counters.get(demoDailyKey(NOW))).toBe(2);
  });

  it("sets the expiry once, on the first demo of the day", async () => {
    const { store, expire } = fakeStore();

    await reserveDailyDemo(store, NOW, 5);
    await reserveDailyDemo(store, NOW, 5);

    expect(expire).toHaveBeenCalledTimes(1);
    expect(expire).toHaveBeenCalledWith(demoDailyKey(NOW), 172_800);
  });

  it("counts each day separately", async () => {
    const { store } = fakeStore();

    expect(await reserveDailyDemo(store, NOW, 1)).toBe(true);
    expect(await reserveDailyDemo(store, NOW, 1)).toBe(false);
    expect(await reserveDailyDemo(store, new Date("2026-10-15T00:00:01Z"), 1)).toBe(true);
  });

  it("gives back a reserved demo that was never created", async () => {
    const { store } = fakeStore();

    await reserveDailyDemo(store, NOW, 1);
    await refundDailyDemo(store, NOW);

    expect(await reserveDailyDemo(store, NOW, 1)).toBe(true);
  });
});
