import { createHmac } from "node:crypto";

// The caller's IP from the proxy headers. On Vercel, x-forwarded-for is set by the platform and
// its first entry is the real client; x-real-ip is the fallback. Returns null when neither is there.
export function clientIp(headers: { get(name: string): string | null }): string | null {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;
  return headers.get("x-real-ip")?.trim() || null;
}

// What counts as "the same visitor". An IPv4 address is itself. An IPv6 address is reduced to its /64
// network, because one home connection hands out billions of addresses (and privacy extensions rotate
// them), so the exact address would let one visitor start a demo over and over. IPv4-mapped IPv6
// addresses count as the IPv4 address.
export function normalizeIp(ip: string): string {
  const address = ip.trim().toLowerCase().split("%")[0];
  if (!address.includes(":")) return address;

  const mapped = address.match(/^(?:0*:)*:?ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return mapped[1];

  // Expand "::" so the first four groups (the /64) can be read off
  const [head, tail] = address.split("::");
  const headGroups = head ? head.split(":") : [];
  const tailGroups = tail === undefined ? [] : tail ? tail.split(":") : [];
  const missing = Math.max(0, 8 - headGroups.length - tailGroups.length);
  const groups = tail === undefined ? headGroups : [...headGroups, ...Array(missing).fill("0"), ...tailGroups];

  const network = groups.slice(0, 4).map((group) => group.replace(/^0+(?=.)/, "") || "0");
  while (network.length < 4) network.push("0");
  return `${network.join(":")}::/64`;
}

// Keyed hash of the visitor's network, so the raw address is never stored and the small IPv4 space
// can't be reversed without the secret
export function hashIp(ip: string, secret: string): string {
  return createHmac("sha256", secret).update(normalizeIp(ip)).digest("hex");
}
