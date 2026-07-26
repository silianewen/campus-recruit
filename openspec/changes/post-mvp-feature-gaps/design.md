# Design — post-mvp-feature-gaps

## Context

MVP has been live for ~2 weeks. The user has tested all happy paths
and on 2026-07-19 reviewed the change plan and reordered priorities
1 > 2 > 3, then added 4 more capabilities (P5-P8) to make the change
complete. This design now covers all 8 capabilities.

The remaining 6 gaps are documented in proposal.md as "deferred" and
will be proposed in future changes.

## Goals / Non-Goals

**Goals:**

- Close 8 functional gaps, prioritized as 1 > 2 > 3 > 4 > 5 > 6 > 7 > 8.
- Preserve existing RBAC, dark theme, and DB-first loading.
- Keep the change small (≤ 1 migration, ≤ 1 new util, ≤ 9 modified
  files).

**Non-Goals:**

- Interview scheduling / calendar (deferred — separate change).
- Logo upload (deferred).
- Soft delete / audit log (deferred).
- Student Q&A two-way messaging (deferred).
- Real-time subscription (deferred).
- i18n (deferred).
- Production hardening (RLS, Supabase Auth, signed URL — deferred
  per `docs/security.md`).

## Decisions

### Decision 1 (P2): `closes_at` is a soft deadline, not a hard lock
- `closes_at` is a TIMESTAMPTZ column, nullable.
- A nightly Edge Function (out of scope) would actually flip
  `positions.is_active = false` past the deadline. For now the
  student-side check is the only enforcement.
- Rationale: simple migration, no Edge Function needed.

### Decision 2 (P1): Notification send uses existing `notifications` table
- The `notifications` table already exists and the `/status` page
  already reads it. We just need the HR-side write path.
- No schema change. The `read` field stays default-false; we can
  later add a "mark as read on view" trigger.
- Rationale: no migration needed → minimal change.

### Decision 3 (P3): CSV export is client-side, not server-side
- Build the CSV string in the browser from the currently filtered
  rows, then trigger a download via a `Blob` + `<a download>`.
- Rationale: no backend, no new Edge Function. The filter is
  already computed in the React state — serializing to CSV is
  trivial. For 1k+ rows this is still instant.
- Caveat: a malicious user could trigger large exports; MVP scale
  doesn't justify server-side pagination + signed download URLs yet.

### Decision 4 (P4): Mobile responsive uses stacked-card pattern for HRList
- The 11-col table is too wide for phones. We use CSS to switch to a
  stacked card layout on `< sm` (640px) using Tailwind's responsive
  prefixes.
- The desktop table stays exactly as-is; the card layout is a
  parallel `display:` branch.
- Tradeoff: duplicates code (one table, one card list) — accepted
  because the card version is shorter and the duplication is
  bounded.

### Decision 5 (P5): Resume view + download use the existing public URL
- The `resumes` bucket is already public. The existing 操作 column
  "简历" link opens the file in a new tab. We add a sibling "下载"
  link that uses the `download` attribute on the same URL — the
  browser saves it locally with the original `file_name`.
- No schema change, no new Storage policies.
- Rationale: zero backend work; the user just gets an extra click
  target that does the obvious thing.

### Decision 6 (P6): Edit-user modal, no self-edit
- Add an "编辑" button per row on `/hr/admin/users` (replaces the
  inline "delete" action; a per-row menu is overkill for 7 groups).
- Clicking opens a modal with: username (text), display name (text),
  new password (text, leave blank to keep).
- Save calls `updateHrUser(id, {username, displayName, passwordHash?})`.
- The "（自己）" row shows the "编辑" button as disabled with a
  tooltip "不能编辑自己（避免自锁）".
- Rationale: keeps the list compact; modal is a familiar pattern.

### Decision 7 (P7): Remove the credentials hint, not the credentials
- The hint `默认管理员账号：admin / Admin@2026` is rendered as
  static HTML inside the login form. We delete that line.
- The credentials themselves remain in the `hr_users` table (and in
  `docs/operations-manual.md` for new admins).
- Rationale: prevents the DOM from carrying plaintext credentials
  even at MVP. (The page is no longer printed in screenshots by HR
  support, etc.)

### Decision 8 (P8): Dashboard scope filters at the position list level
- For a `company_<id>` group, the dashboard already filters
  `submissions` rows at the query level (`.eq('company_id', X)`).
  The bug is in the chart x-axis: `fetchAllPositions` returns ALL
  39 positions across all 5 companies, so 昶联's dashboard shows
  axes like "机械助理工程师 (其他公司), PD助理工程师 (其他公司), ..."
  with 0 submissions. Confusing.
- Fix: when `scope.kind === 'company'`, use
  `fetchPositionsForCompany(scope.companyId)` instead of
  `fetchAllPositions()`. The aggregations then naturally only see
  this company's positions.
- Repeat-submission marking is unaffected — the existing
  `fetchCrossCompanyContext` already takes `excludeCompanyId`.

### Decision 9: No new icons / icon library
- Use Unicode emoji + the existing lucide-react (already in deps) for
  any new icons (e.g. bell, csv, edit, download). No new dependencies.

## Risks / Trade-offs

- **P2 closes_at soft deadline** → student could in theory still
  submit via direct API call → Mitigation: note in docs that RLS
  policies (out of scope) would close this when added.
- **P3 client-side CSV export on huge tables** → could freeze the
  tab on > 10k rows → Mitigation: 1k row cap with a "filtered set too
  large, narrow filters and try again" toast.
- **P4 mobile card layout duplicates desktop table logic** → divergence
  risk → Mitigation: factor the cell-rendering into shared helpers
  if a 3rd layout is added later.
- **P5 download is direct-from-public-URL** → anyone with the URL
  can download → Mitigation: a future change can switch to signed
  URLs (deferred per security.md).
- **P6 self-edit prevented** → admin can't reset own password via
  this UI → Mitigation: SQL template in operations-manual.md for
  emergency password reset (the `resetHrUser` script already exists).
- **P8 chart cache invalidation** → switching from fetchAllPositions
  to fetchPositionsForCompany changes the chart shape; if HR toggles
  groups in one session the chart will refetch → acceptable, scoped
  to company groups (admin always sees the full set).
- **closes_at doesn't auto-flip `is_active`** → students see
  "closed" positions in search → Mitigation: add badge in the UI
  + consider Edge Function in a follow-up.

## Migration Plan

### New migration: `0010_closes_at.sql`

```sql
ALTER TABLE positions
  ADD COLUMN IF NOT EXISTS closes_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_positions_closes_at ON positions(closes_at);
```

Idempotent. Re-run safely.

### Frontend

#### `src/lib/csv.ts` (new — P3)

```ts
export function escapeCsvCell(v: unknown): string {
  const s = v == null ? '' : String(v)
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function rowsToCsv(headers: string[], rows: unknown[][]): string {
  return '﻿' +
    [headers, ...rows].map(r => r.map(escapeCsvCell).join(',')).join('\r\n')
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
```

#### `src/lib/loaders.ts` (extend — P1 + P6)

Add:
- `insertNotification({phone, title, content, type})`
- `updateHrUser(id, {username?, displayName?, passwordHash?})`

#### `src/lib/types.ts` (extend — P2)

Add `closes_at?: string | null` to `Position` and `PositionRow`.

#### `src/components/ClosesAtBadge.tsx` (new — P2)

```ts
export function ClosesAtBadge({ closesAt }: { closesAt: string | null | undefined }) {
  if (!closesAt) return null
  const d = new Date(closesAt)
  const ms = d.getTime() - Date.now()
  const days = Math.ceil(ms / 86400000)
  if (ms < 0) return <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-500 px-1.5 py-0.5 rounded">已截止</span>
  if (days <= 14) return <span className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded">{days} 天后截止</span>
  return null
}
```

#### `src/pages/HR.tsx` (modify — P7)

Delete the `<p>默认管理员账号：admin / Admin@2026</p>` line.

#### `src/pages/HRList.tsx` (modify — P1, P3, P4, P5)

- Per-row 操作 column: existing "简历" link + new "下载" link (P5).
- Filter row: add "导出 CSV" button (P3).
- Add per-row "通知" button (visible only when scope.kind !==
  'default') that opens a modal (P1).
- Replace the `<table>` with `sm:hidden` mobile card list +
  `hidden sm:table-row` desktop table (P4).

#### `src/pages/HRAdminUsers.tsx` (modify — P6)

Replace the "create-only" model. Each row gets "编辑" + "删除"
(or a single "编辑" button opening a modal). Modal has
username / display name / new password fields; new password is
optional (leave blank to keep current). Cannot edit self (button
disabled with tooltip).

#### `src/pages/HRDashboard.tsx` (modify — P8)

- Replace `fetchAllPositions()` with
  `fetchPositionsForCompany(scope.companyId)` when
  `scope.kind === 'company'`.
- No other changes — the existing aggregations and the repeat KPI
  will automatically become company-scoped.

#### `src/pages/Upload.tsx` (modify — P2)

After `posAsync` resolves, if `pos?.closes_at` is past, render a
"已截止" page (with a back-to-company link) instead of the form.

#### `src/pages/Home.tsx` + `src/pages/CompanyDetail.tsx` + `src/pages/SkillTest.tsx` (modify — P2)

Render `<ClosesAtBadge closesAt={p.closes_at} />` on each position
card.

### Rollout

1. PR this change → Vercel auto-deploy.
2. Manually verify in `localhost:5173` and on a real phone (or
   Chrome DevTools mobile emulation at 360px).
3. After the change is merged + deployed, archive this change
   following standard OpenSpec archive flow.

## Open Questions

- None for this change. The 8 capabilities are well-scoped and
  additive. The 6 deferred capabilities are tracked in proposal.md
  "deferred" section and will each become their own change when
  picked up.
