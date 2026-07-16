# Security notes — known MVP trade-offs

This MVP is designed for **personal, low-stakes campus recruitment** (one HR user, dozens of students, no payment, no PII beyond phone + resume). The schema makes conscious simplifications that should be re-evaluated before any production rollout.

## What's intentionally open today

| Surface | Decision | Why |
|---|---|---|
| `resumes` / `submissions` / `personality_results` / `skill_results` RLS | **Disabled** | Students are anonymous; SPA uses anon key. No auth yet. |
| `storage.objects` write on `resumes` bucket | **Open to anon** | Same reason. |
| `storage.objects` read on `resumes` bucket | **Open to anon** | Lets HR open preview links without auth. |
| `service_role key` | Lives in **`.env.local` only** (gitignored); not used by frontend. | Reserved for future admin tasks. |

## What to do before production

1. **Enable RLS** on all tables and write per-role policies.
2. **Add Supabase Auth** (email magic link is easiest). HR signs in to get a real JWT; students either authenticate or you keep anon insert but rate-limit by IP.
3. **Move HR backend (`/dashboard`, `/stats`) behind an auth gate** — either Supabase session check on every load, or a one-line "is HR" boolean in a `hr_users` table.
4. **Lock the storage bucket** to authenticated users; serve previews via signed URLs.
5. **Rotate** any keys that ever appeared in chat / screenshots / log dumps.
6. **Set up backups**: Supabase has daily backups on Pro; on free tier, schedule `pg_dump` yourself.

## What the schema doesn't track today

- No soft-delete / audit log on submissions.
- No multi-tenancy — single HR user assumed.
- No rate limiting on public form submits.

These are fine for the demo. Log them as Phase 2 issues if scope grows.