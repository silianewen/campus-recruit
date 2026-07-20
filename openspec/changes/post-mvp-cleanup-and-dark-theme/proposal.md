## Why

The MVP is live and working in production, but it has accumulated five known issues — one currently blocking (uploads fail), four latent (question-bank drift, doc drift, dual source of truth, HR-password visibility). Now that the app is in steady-state use, this is the right moment to consolidate data sources (Supabase as the single source of truth), close the drift, and add the only UX gap users have asked about: dark theme.

## What Changes

- **Fix upload failure caused by stale PostgREST schema cache.** Surface the underlying Supabase error instead of `[object Object]`. User runs `NOTIFY pgrst, 'reload schema';` in Supabase SQL Editor; verify upload works end-to-end.
- **Replace hardcoded `src/lib/{companies,positionRegistry,companyPositions,questions-skill}.ts` with runtime fetchers** so companies, positions, company→position mapping, and skill questions all come from Supabase tables. Frontend becomes a thin presentation layer over the DB.
- **Align `.env.local.example` HR-password comment with code** (no fallback exists in `Dashboard.tsx`).
- **Add dark theme mode** with class strategy (Tailwind v4), persisted in `localStorage`, applied via a header toggle. No flash-of-wrong-theme on initial load.

Marked **BREAKING**:

- `src/lib/questions-skill.ts` is removed; components that imported it must use the new fetcher.
- `src/lib/companies.ts`, `positionRegistry.ts`, `companyPositions.ts` are removed (a small `companies.ts` helper file remains only for `companyColor` / type utilities).
- Home, SkillTest, HR Dashboard, and Stats become async-load with spinner state — first paint is delayed by ~200-500ms.

## Capabilities

### New Capabilities

- `theme-dark-mode`: Toggle between light and dark themes. Persists across reloads and across pages. No flash on initial render.
- `data-loaders`: Typed async fetchers for `companies`, `positions`, `positions_for_company`, `questions_for_position`. Frontend pages consume these instead of hardcoded registries. Includes a shared loading/empty-state pattern.

### Modified Capabilities

- (none yet — this project has no prior `specs/` directory, so no existing capability REQUIREMENTS are being changed; everything is net-new behavior in code, not in a tracked spec)

## Impact

- **Schema**: no SQL migration required (all tables already exist from migrations 0001-0005).
- **Files removed**: `src/lib/{companies.ts (the registry part), positionRegistry.ts, companyPositions.ts, questions-skill.ts}`. A new tiny `src/lib/companies.ts` keeps `companyColor` and the `Company` type re-export.
- **Files added**: `src/lib/loaders.ts`, `src/components/ThemeToggle.tsx`, `src/hooks/useTheme.ts`, inline boot script in `index.html`.
- **Files modified** (touchpoints for `dark:` classes): every page (`Home`, `Upload`, `Success`, `Dashboard`, `Stats`, `Status`, `Personality`, `SkillTest`) and every component (`Page`, `ConfigBanner`, `EChart`, `QrDownload`).
- **Documentation**: `.env.local.example` HR-password comment updated; `docs/security.md` gains a note that theme preference is client-only localStorage.
- **Deploy**: Vercel auto-deploys on push to `main`. User must run the one-line SQL `NOTIFY pgrst, 'reload schema';` in Supabase SQL Editor for the upload fix to take effect.
- **Out of scope** (deferred per `docs/security.md`): Supabase Auth, RLS policies, signed storage URLs, rate limiting, audit log.

## Success criteria

- A fresh upload (student form → Storage upload → `resumes` row → `submissions` row → `/success` page) completes without error.
- HR Dashboard shows the new row, including the MBTI and skill-score columns (which require the upload + a personality + a skill test in sequence).
- Changing a company name in Supabase `companies` table and refreshing the home page shows the new name (proves DB-first loading).
- SkillTest renders 5 questions per position from the `questions_skill` table (proves DB-first question loading).
- Toggling dark mode switches all 7 pages; preference survives a hard refresh.
- All 9 steps of the original E2E smoke test still pass.