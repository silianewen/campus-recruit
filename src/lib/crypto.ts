// Password hashing — sha256(salt + password) hex.
// MVP-grade: client-side hash, compared against hr_users.password_hash in
// Supabase (RLS is intentionally off for the MVP so anonymous read works).
// PRODUCTION WARNING: until Supabase Auth is wired up, the password hashes
// transit as plaintext over TLS to Supabase and are stored in clear in the DB.
// See docs/security.md.

const APP_SALT = 'campus_recruit_v1'

export async function hashPassword(username: string, password: string): Promise<string> {
  const salt = `${APP_SALT}_${username}`
  const buf = new TextEncoder().encode(salt + password)
  const hashBuf = await crypto.subtle.digest('SHA-256', buf)
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
