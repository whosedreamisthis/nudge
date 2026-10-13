// What every Server Action returns: data on success, a message the UI can show on failure
export type ActionResult<T> = { success: true; data: T } | { success: false; error: string };
