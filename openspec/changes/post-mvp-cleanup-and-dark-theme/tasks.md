# Tasks — post-mvp-cleanup-and-dark-theme

## 1. Loader infrastructure

- [x] 1.1 Create `src/lib/loaders.ts` with `fetchCompanies()`, `fetchPositionsForCompany(id)`, `fetchAllPositions()`, `fetchQuestionsForPosition(positionId)`. All return Promises, all handle the no-supabase case.
- [x] 1.2 Create `src/hooks/useAsync.ts` returning `{ data, loading, error, refetch }` for any async loader.
- [x] 1.3 Create `src/components/AsyncView.tsx` rendering spinner / error-with-retry / empty / children based on async state.

## 2. Migrate pages to DB-first loading

- [ ] 2.1 Update `src/pages/Home.tsx` — replace `COMPANIES` import with `useAsync(fetchCompanies)`; replace `positionsForCompany` with `useAsync(() => fetchPositionsForCompany(viewingCompanyId))`; wrap both tiers in `<AsyncView>`.
- [ ] 2.2 Update `src/pages/SkillTest.tsx` — replace `SKILL_QUESTIONS.filter(...)` with `useAsync(() => fetchQuestionsForPosition(position))` for the question list.
- [ ] 2.3 Update `src/pages/Dashboard.tsx` — replace `POSITIONS` filter with `useAsync(fetchAllPositions)` for the position dropdown; verify company column still works.
- [ ] 2.4 Update `src/pages/Stats.tsx` — same loader pattern as Dashboard if it consumes position list.
- [ ] 2.5 Update `src/pages/Status.tsx` — should NOT need a loader (it queries by phone, not by company/position); verify it still works.

## 3. Delete hardcoded registries

- [ ] 3.1 Delete `src/lib/positionRegistry.ts` (replaced by `positions` table).
- [ ] 3.2 Delete `src/lib/companyPositions.ts` (replaced by `LIKE 'companyId-%'` query).
- [ ] 3.3 Delete `src/lib/questions-skill.ts` (replaced by `questions_skill` table).
- [ ] 3.4 Slim `src/lib/companies.ts` to keep ONLY `companyColor()` + `Company` type re-export. Remove the `COMPANIES` array constant.

## 4. Dark theme — infrastructure

- [ ] 4.1 Add `darkMode: 'class'` to Tailwind config (via `tailwind.config.js` or in v4's `@variant dark` directive in CSS).
- [ ] 4.2 Create `src/hooks/useTheme.ts` — reads `localStorage.theme` (or system preference), returns `{ theme, toggle }`; writes back to `localStorage` and toggles `<html>` class.
- [ ] 4.3 Create `src/components/ThemeToggle.tsx` — sun/moon icon button using `lucide-react`; calls `useTheme().toggle`. Accessible (aria-label, keyboard).
- [ ] 4.4 Add inline boot script in `index.html` (before `<script type="module">`): reads `localStorage.theme` or `matchMedia('(prefers-color-scheme: dark)')` and sets `<html class="dark">` immediately. Prevents flash.
- [ ] 4.5 Mount `<ThemeToggle />` in `src/components/Page.tsx` header so it appears on every page using `<Page>`.

## 5. Dark theme — visual sweep

- [ ] 5.1 `src/components/Page.tsx`: header + main bg → `dark:bg-slate-900` / `dark:bg-slate-800`.
- [ ] 5.2 `src/components/ConfigBanner.tsx`: yellow banner stays yellow in dark mode (warning colors); ensure text contrast.
- [ ] 5.3 `src/components/QrDownload.tsx`: card bg → dark variant.
- [ ] 5.4 `src/pages/Home.tsx`: gradient bg, cards, QR section → dark variants.
- [ ] 5.5 `src/pages/Upload.tsx`: form bg, fields, error banner → dark variants.
- [ ] 5.6 `src/pages/Success.tsx`: success card, links → dark variants.
- [ ] 5.7 `src/pages/Dashboard.tsx`: login card, table, filters, modal → dark variants.
- [ ] 5.8 `src/pages/Stats.tsx`: stat cards, ECharts container → dark variants (note: ECharts needs explicit dark theme passed via `option`).
- [ ] 5.9 `src/pages/Status.tsx`: query form, sections → dark variants.
- [ ] 5.10 `src/pages/Personality.tsx`: question card, options, result panel → dark variants.
- [ ] 5.11 `src/pages/SkillTest.tsx`: question card, position picker, result → dark variants.

## 6. Documentation + drift fix

- [ ] 6.1 Update `.env.local.example`: remove the line that mentions "demo password fallback" — replace with note that login is disabled if env var is missing.
- [ ] 6.2 Update `docs/security.md`: add a note that theme preference is `localStorage`-only (no PII, no server-side persistence).
- [ ] 6.3 Update `README.md`: add a one-line "Dark mode: click the toggle in the header" to the Features section.

## 7. Build + deploy

- [ ] 7.1 Run `npm run build` locally; fix any TS / lint errors.
- [ ] 7.2 Manually check each page in light AND dark mode via local `npm run dev`.
- [ ] 7.3 Commit + push to `main`. Vercel auto-deploys.
- [ ] 7.4 User runs `NOTIFY pgrst, 'reload schema';` in Supabase SQL Editor (one-time, fixes upload).
- [ ] 7.5 Verify on production: 9-step E2E smoke test (upload / status / personality / skill / HR dashboard / stats).
- [ ] 7.6 Verify dark theme toggle works on production; verify localStorage persists across reloads.