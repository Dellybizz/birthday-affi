export function assertNonEmpty(value: unknown, field: string): asserts value {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} must not be empty`);
  }
}
