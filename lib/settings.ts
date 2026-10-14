// Pure helpers for the Settings modal.

export function isValidTimezone(timezone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

// Every IANA timezone the browser knows, with the user's current one first if it is not listed
export function timezoneOptions(current: string): string[] {
  const all = Intl.supportedValuesOf("timeZone");
  return all.includes(current) ? all : [current, ...all];
}

export const DELETE_PHRASE = "delete my account";

// Deleting an account is permanent, so the user has to type the phrase; case and outer spaces do not matter
export function isDeleteConfirmed(input: string) {
  return input.trim().toLowerCase() === DELETE_PHRASE;
}
