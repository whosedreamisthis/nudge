import { vi } from "vitest";

// The cache directives only work inside Next.js; here they are no-ops so the data functions run
// as plain async functions. Tests that care about a tag mock "next/cache" themselves.
vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
  updateTag: vi.fn(),
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));
