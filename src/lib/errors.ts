// Error message extraction utility.
// Supabase errors (PostgrestError, storage errors, etc.) come back as plain objects
// with .message / .details / .hint / .code. Naively stringifying them produces
// "[object Object]" which is useless to users. This helper walks known fields.

export function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>
    return (
      (typeof e.message === 'string' && e.message) ||
      (typeof e.msg === 'string' && e.msg) ||
      (typeof e.error === 'string' && e.error) ||
      (typeof e.details === 'string' && e.details) ||
      JSON.stringify(err, Object.getOwnPropertyNames(err))
    )
  }
  return String(err)
}