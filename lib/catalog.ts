export interface CatalogFilters {
  q: string;
  category: string;
}

type Param = string | string[] | undefined;

const first = (value: Param) => (Array.isArray(value) ? value[0] : value) ?? "";

// Reads the Browse filters from the URL; a repeated or missing param falls back to the first or ""
export function parseCatalogParams(params: { q?: Param; category?: Param }): CatalogFilters {
  return { q: first(params.q).trim().slice(0, 60), category: first(params.category).trim() };
}

export function frequencyLabel(frequency: "DAILY" | "WEEKLY", days: number) {
  return frequency === "DAILY" || days === 7 ? "Daily" : `${days}x / week`;
}
