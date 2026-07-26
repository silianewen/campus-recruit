## Context

The campus-recruitment MVP is a single-page React/Vite app deployed to Vercel, backed by Supabase (Postgres + Storage + Auth-ready). It's used by one HR user (you) and dozens of students. The app went through five iterations of feature work and now has five known issues — one blocking (uploads), four latent (question-bank drift, doc drift, dual source of truth, HR-password visibility) — plus a long-standing UX request for a dark theme.

The codebase is small (~3,200 lines across pages, components, and lib) but the data layer is split across two sources of truth: `src/lib/*.ts` (TS modules) AND Supabase tables. This has already drifted at least once (skill questions). HR-editable data must come from Supabase going forward.

The user is the only developer, MVP / internal-testing stage. They want consolidation now before more drift accumulates.

## Goals / Non-Goals

**Goals:**

- All HR-editable data (companies, positions, company→position mapping, skill questions) flows from Supabase at runtime.
- Theme is per-device, persisted in `localStorage`, with no flash-of-wrong-theme on first paint.
- Dark mode covers every page and component without inconsistency.
- No regression to existing functionality; the 9-step E2E smoke test must still pass.
- Change is small enough to ship in one PR, easy to roll back if needed.

**Non-Goals:**

- Supabase Auth / RLS / production hardening (covered by `docs/security.md` "Phase 2").
- Adding new pages or features beyond dark theme.
- Custom admin UI for editing companies/positions (HR uses Supabase dashboard directly).
- Per-user theme sync across devices (preference stays in `localStorage` only).
- Build-time optimization beyond Tailwind's natural purge.
- Replacing the `VITE_HR_PASSWORD` mechanism (still a client-side gate; known MVP trade-off).

## Decisions

### 1. Single data source: Supabase (chosen over code-first)

- **Decision**: Delete `src/lib/{companies.ts (registry part), positionRegistry.ts, companyPositions.ts, questions-skill.ts}`; add `src/lib/loaders.ts` with async fetchers; every consumer page becomes async.
- **Rationale**: Drift is already happening. Code-first requires redeploy for every company rename; DB-first lets HR edit in seconds.
- **Alternatives considered**:
  - Keep code-first, add CI drift detection → extra plumbing, doesn't fix the underlying fragility.
  - Hybrid (code for questions, DB for companies) → more moving parts, harder to reason about.
  - Static site generation at build time → wrong shape for an SPA with HR-driven content.

### 2. Company→position lookup: `LIKE 'companyId-%'` (chosen over a join table)

- **Decision**: Query `positions WHERE id LIKE '<companyId>-%'` to get a company's positions.
- **Rationale**: The position `id` already encodes company via the `{company}-{title-slug}` convention. No new table needed; SQL is simple.
- **Alternatives considered**:
  - New `company_positions` join table → cleaner long-term, but requires migration + UI to maintain. Defer to Phase 3 if needed.
  - Keep hardcoded `companyPositions.ts` → doesn't fix the drift problem.

### 3. Dark theme: Tailwind v4 class strategy (chosen over media query)

- **Decision**: Use `darkMode: 'class'` in Tailwind config. `<html>` gets `class="dark"` when the user has chosen dark. Inline boot script reads `localStorage` and sets the class before React mounts.
- **Rationale**: User-chosen theme (not OS-tied). Class strategy avoids the FOUC (flash-of-unstyled-content) on reload and lets us control the toggle freely.
- **Alternatives considered**:
  - `prefers-color-scheme` media query → no toggle, only follows OS. Rejected because users asked for a manual toggle.
  - Theme via CSS variables only (no Tailwind class) → more refactor; we already use Tailwind v4 throughout.

### 4. Loader pattern: shared hook + spinner component (chosen over per-page ad-hoc)

- **Decision**: A `useAsync<T>(loader)` hook handles loading/error/data states. A shared `<AsyncView>` component renders spinner / error+retry / empty / children.
- **Rationale**: 4 pages will load data (Home, SkillTest, Dashboard, Stats). A shared pattern keeps them consistent and DRY.
- **Alternatives considered**:
  - React Query / SWR → adds a dependency; overkill for 4 fetches.
  - Plain `useEffect` in each page → repeats logic; easy to skip error handling.

### 5. Dark-mode sweep: one pass, all files (chosen over incremental)

- **Decision**: Add `dark:` variants to every page + component in a single PR.
- **Rationale**: Half-applied dark mode looks worse than no dark mode. Bundling it ensures consistency.
- **Alternatives considered**:
  - Per-page incremental sweep → users would see mismatched themes for weeks.
  - Skip HR pages (Dashboard/Stats) → dark mode is more important there (long sessions).

### 6. PostgREST cache: document-only fix (chosen over code change)

- **Decision**: User runs `NOTIFY pgrst, 'reload schema';` in Supabase SQL Editor once. No code change needed.
- **Rationale**: The schema is correct; only PostgREST's in-memory schema cache is stale. The `NOTIFY` command is the standard fix.
- **Alternatives considered**:
  - Rename `company_id` → `company` and update everywhere → unnecessary churn.
  - Re-run migration → won't help (column already exists).

## Risks / Trade-offs

- **DB-first latency** (~200-500ms first paint on Home) → Mitigation: spinner; acceptable for MVP / internal use.
- **Dark-mode sweep inconsistency** if a class is missed → Mitigation: test each page in both modes before declaring done; lint rule for `bg-white` / `text-slate-900` without `dark:` companion is future work.
- **PostgREST cache fix is user-side** → if it doesn't work, fallback is to rename the column or add it via Supabase dashboard Table Editor (which forces a schema refresh).
- **Removing hardcoded registries** breaks anyone running the app without Supabase configured → Mitigation: keep `ConfigBanner` (already exists) showing the "Supabase 未配置" warning; the app will still render the empty state correctly.
- **HR password still in `VITE_`** → known trade-off; documented; out of scope this iteration.

## Migration Plan

### Deploy order

1. Merge PR with code changes (loaders, dark theme, deleted registries, doc fix).
2. Vercel auto-builds and deploys. User verifies dark theme + DB-first loading work.
3. User runs `NOTIFY pgrst, 'reload schema';` in Supabase SQL Editor (one-line, no risk).
4. User re-runs the 9-step E2E smoke test on production.

### Rollback

- All changes are in one PR. `git revert` + Vercel redeploy returns to previous state in ~1 minute.
- The `NOTIFY pgrst` SQL change is not destructive — cannot be undone but has no negative side effects.

## Open Questions

- Should HR's company description / position description be editable in Supabase `companies` / `positions` tables? (Currently yes — schema supports it; loaders will return whatever's there.) Worth confirming HR has Supabase dashboard access.
- For dark theme: do we want a system-default option (Auto / Light / Dark three-way toggle) or just Light / Dark two-way? Two-way is simpler and matches the spec.
- For SkillTest: should the loader also de-duplicate questions when the same title appears in multiple companies? Currently the SQL fans them out per-position, so each position has its own 5 rows — that's correct, no dedup needed.