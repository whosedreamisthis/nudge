import { describe, expect, it } from "vitest";
import { clientIp, hashIp, normalizeIp } from "@/lib/demo-ip";

const headers = (values: Record<string, string>) => ({ get: (name: string) => values[name] ?? null });

describe("clientIp", () => {
  it("takes the first address in x-forwarded-for", () => {
    expect(clientIp(headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1, 10.0.0.2" }))).toBe("203.0.113.7");
    expect(clientIp(headers({ "x-forwarded-for": " 203.0.113.7 " }))).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip", () => {
    expect(clientIp(headers({ "x-real-ip": "198.51.100.4" }))).toBe("198.51.100.4");
  });

  it("is null when the proxy sent nothing", () => {
    expect(clientIp(headers({}))).toBeNull();
    expect(clientIp(headers({ "x-forwarded-for": "" }))).toBeNull();
  });
});

describe("hashIp", () => {
  it("is stable for the same IP and secret", () => {
    expect(hashIp("203.0.113.7", "s")).toBe(hashIp("203.0.113.7", "s"));
  });

  it("differs by IP and by secret", () => {
    expect(hashIp("203.0.113.7", "s")).not.toBe(hashIp("203.0.113.8", "s"));
    expect(hashIp("203.0.113.7", "s")).not.toBe(hashIp("203.0.113.7", "t"));
  });

  it("never contains the raw address", () => {
    expect(hashIp("203.0.113.7", "s")).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("normalizeIp", () => {
  it("leaves an IPv4 address alone", () => {
    expect(normalizeIp("203.0.113.7")).toBe("203.0.113.7");
  });

  it("reduces IPv6 addresses to their /64 network", () => {
    expect(normalizeIp("2001:db8:abcd:12:aaaa:bbbb:cccc:dddd")).toBe("2001:db8:abcd:12::/64");
    expect(normalizeIp("2001:DB8:ABCD:0012:1:2:3:4")).toBe("2001:db8:abcd:12::/64");
  });

  it("expands :: before taking the network", () => {
    expect(normalizeIp("2001:db8::1")).toBe("2001:db8:0:0::/64");
    expect(normalizeIp("2001:db8:1:2::5")).toBe("2001:db8:1:2::/64");
    expect(normalizeIp("::1")).toBe("0:0:0:0::/64");
  });

  it("treats an IPv4-mapped IPv6 address as the IPv4 address", () => {
    expect(normalizeIp("::ffff:203.0.113.7")).toBe("203.0.113.7");
  });

  it("drops a zone id", () => {
    expect(normalizeIp("fe80::1%eth0")).toBe("fe80:0:0:0::/64");
  });
});

describe("hashIp and IPv6 privacy addresses", () => {
  it("gives every address in one /64 the same hash, and another network a different one", () => {
    const a = hashIp("2001:db8:abcd:12:1111:2222:3333:4444", "s");
    const b = hashIp("2001:db8:abcd:12:9999:8888:7777:6666", "s");
    const other = hashIp("2001:db8:abcd:13:1111:2222:3333:4444", "s");

    expect(a).toBe(b);
    expect(a).not.toBe(other);
  });

  it("hashes a mapped address like the plain IPv4 one", () => {
    expect(hashIp("::ffff:203.0.113.7", "s")).toBe(hashIp("203.0.113.7", "s"));
  });
});
