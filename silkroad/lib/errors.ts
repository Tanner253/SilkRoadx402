/** Human-readable message from an unknown thrown value. */
export function errorMessage(error: unknown, fallback = 'Something went wrong'): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

/** MongoDB duplicate-key error (unique index violation). */
export function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 11000;
}
