# post-mvp-feature-gaps

## Why

MVP is live, RBAC + dark theme + dup-submission marking all shipped. The
end-to-end flow works for the happy path, but a real on-the-ground HR
team would hit several missing capabilities within the first week. This
change enumerates the highest-value functional gaps, ranks them by
priority (1 = highest), and proposes the next iteration.

Priority is set by the user (2026-07-19 review):

| P | Capability | Status |
|---|---|---|
| 1 | `hr-send-notification`           | new in this change |
| 2 | `position-closes-at`             | new in this change |
| 3 | `csv-export`                    | new in this change |
| 4 | `mobile-responsive`              | new in this change |
| 5 | `hr-resume-view-download`        | new in this change |
| 6 | `user-edit-credentials`          | new in this change (admin can edit username + password) |
| 7 | `hide-default-credentials-hint`  | new in this change (remove "默认管理员账号：admin / Admin@2026" from login) |
| 8 | `dashboard-strict-company-scope` | new in this change (company-group dashboards show ONLY own company) |

The remaining 6+ candidates (interview scheduling, soft delete, two-way
messaging, i18n, real-time updates, etc.) are tracked here for future
changes but are NOT in scope for this iteration.

## What Changes

8 candidate capabilities surfaced by full-codebase review + user
feedback. All 8 are selected for this change. All are net-new — no
MODIFIED/REMOVED requirements, no breaking changes to the existing
MVP. Priorities 1-4 are functionally independent of 5-8; 6-8 are
additive refinements to existing RBAC + dashboard.

## Capabilities

### New Capabilities (this change)

- `hr-send-notification`           (P1) — HR can write a custom message
  to one student from HRList and have it appear in the student's
  /status page.
- `position-closes-at`             (P2) — Positions have an optional
  close date; the student upload form rejects submissions past that
  time.
- `csv-export`                    (P3) — HR can export the currently
  filtered HR list to a CSV file for offline reporting.
- `mobile-responsive`              (P4) — The 11-col HR table, 5-chart
  dashboard, and company-cards grid become usable on phone screens
  (≤ 640px).
- `hr-resume-view-download`        (P5) — From HRList, a per-row button
  opens the original resume file (PDF / Word) in a new tab and
  triggers a browser download. The existing "简历" link in 操作
  column already does the new-tab open; the new feature ADDS a
  download button next to it.
- `user-edit-credentials`          (P6) — On `/hr/admin/users`, admin
  can edit an existing user's `username` and `password` (separate
  flows). Cannot edit your own credentials while logged in.
- `hide-default-credentials-hint`  (P7) — The HR login page no longer
  displays the "默认管理员账号：admin / Admin@2026" hint. The
  credentials remain valid; the hint is removed for security
  hygiene (no real secret should be printed in any rendered HTML).
- `dashboard-strict-company-scope` (P8) — For a `company_<id>` group
  user, the dashboard's position list (chart x-axis) is filtered to
  ONLY that company's positions, not the union of all 5 companies'
  positions. The 4 stat cards and 5 charts only count that company's
  submissions. Repeat-submission marking still applies.

### New Capabilities (deferred — not in scope)

- `interview-scheduling`   — Per-application interview date/time/place,
  calendar view, reminder, accept/decline. Big feature.
- `logo-upload`            — Per-company logo upload from HR admin.
- `soft-delete-audit`      — `deleted_at` columns + audit log table.
- `student-qa`             — Student questions on job posting, HR replies.
- `realtime-subscription`  — Supabase Realtime channels for HRList +
  Status auto-refresh.
- `fulltext-resume-search` — Index resume file contents, search across.

## Scope of selected (this change)

### 1. hr-send-notification (P1)

- Backend: `notifications` table already exists; no schema change.
- `HRList.tsx`: add a per-row "通知" button that opens a modal with
  title / body / type selector. Saves to `notifications` row keyed by
  `resume.phone`. The current "改状态 → 已约面" inline change is
  preserved; the new button is additive.
- `Status.tsx`: already shows notifications; no change.

### 2. position-closes-at (P2)

- Migration 0010: `ALTER TABLE positions ADD COLUMN closes_at TIMESTAMPTZ`.
- `Upload.tsx`: if `pos.closes_at` is set and in the past, show "已截止"
  message instead of form.
- `Home` / `CompanyDetail` / `SkillTest`: surface "X 天后截止" badge
  on the position card when within 14 days.
- IT: no automatic closing — it's a soft signal, students still see
  closed positions but can't submit. A nightly cleanup job (out of
  scope) would actually flip status to "closed".

### 3. csv-export (P3)

- `HRList.tsx`: add a "导出 CSV" button next to the refresh button.
  Builds a CSV from the currently filtered rows (respects the same
  filters as the table). Triggers a browser download.
- Columns: all 11 displayed columns plus the cross-company context
  string for duplicate rows (so the offline report preserves the
  duplicate context).
- No backend change — pure client-side serialization.

### 4. mobile-responsive (P4)

- Audit: test all 11 pages at 360 / 768 / 1024 / 1440 widths.
- Apply `sm:` / `md:` Tailwind breakpoints. Most cards already have
  responsive grids; the big offenders are:
  - `HRList.tsx` 11-col table → horizontal scroll on mobile +
    collapse less-important columns to a stacked card on `< sm`.
  - `HRDashboard.tsx` 5-chart grid → switch from 3-col to 1-col on
    mobile; reduce chart heights.
  - `Home.tsx` 2-col grid already works; verify on 360.
  - `Upload.tsx` form: width 100% on mobile (already); verify field
    labels don't wrap awkwardly.
  - `Personality.tsx` / `SkillTest.tsx`: single column already works.
- Keep desktop layout unchanged; mobile gets simpler (table → card list).

### 5. hr-resume-view-download (P5)

- `HRList.tsx`: in the 操作 column, the existing "简历" link (new-tab
  open) gets a sibling "下载" link that triggers a download
  (`download` attribute set to the original file name). No schema
  change; resumes bucket is already public so direct download works.
- Use case: HR prints / archives / forwards resumes offline.

### 6. user-edit-credentials (P6)

- `HRAdminUsers.tsx`: replace the "create-only" model with a CRUD
  list. Each row gets "编辑" / "重置密码" actions (or combined
  "编辑" modal with username + new-password fields).
- Backend: add `updateHrUser(id, {username?, displayName?, passwordHash?})`
  loader that issues an UPDATE on the `hr_users` row.
- Constraint: cannot edit your own credentials while logged in (avoid
  self-lockout). The "（自己）" label is already shown; add a
  tooltip / disabled state on the edit button.
- No schema change.

### 7. hide-default-credentials-hint (P7)

- `HR.tsx`: remove the `<p>默认管理员账号：admin / Admin@2026</p>`
  hint from the login form.
- The default admin credentials remain valid; the hint was leaking
  them into the DOM. Move the credentials to `docs/operations-manual.md`
  (already there) only.
- No schema change, no backend change.

### 8. dashboard-strict-company-scope (P8)

- `HRDashboard.tsx`:
  - When `scope.kind === 'company'`, restrict the `fetchAllPositions`
    call to positions for that company only (use
    `fetchPositionsForCompany`).
  - The stat cards and all 5 charts then automatically reflect only
    that company's data.
  - Repeat-submission marking (橙色 badge / cross-company context) is
    unaffected — the loader `fetchCrossCompanyContext` already passes
    the company filter, so company groups see only their own rows
    flagged as duplicates (with cross-company context still
    available).
- No schema change.

## Impact

- **Schema**: 1 column added (`positions.closes_at`). No other schema
  changes.
- **Files**:
  - 1 migration: `supabase/migrations/0010_closes_at.sql`
  - 1 new util: `src/lib/csv.ts` (CSV escape + builder)
  - Modified: `Upload.tsx`, `HRList.tsx`, `HR.tsx`, `Home.tsx`,
    `CompanyDetail.tsx`, `SkillTest.tsx`, `HRDashboard.tsx`,
    `HRAdminUsers.tsx`, `Position` type, `loaders.ts`
- **Permissions**:
  - P1 (notifications): default group cannot send.
  - P6 (edit users): admin only.
  - P8 (dashboard): all groups; scope is the only thing that changes.
- **Backward compat**: all additions. Old positions get `closes_at =
  null` (always open). Old users unaffected by P6.
- **Performance**: CSV export is O(filtered rows). HRList table
  download is browser-native. No backend changes.
- **Security**: P7 removes a real-secret leak from the DOM — small but
  meaningful. (Credentials were hashed in DB, but printed in
  plaintext in the login page hint.)

## Success criteria

- HR can write a custom message to a student; student sees it in
  `/status` under "📨 HR 通知" with a 🔔 未读 badge. (P1)
- A position with `closes_at` set to yesterday rejects new submissions
  with a friendly "已截止" page; the same position is still visible
  on the company detail page. (P2)
- HR can hit "导出 CSV" and get a UTF-8 BOM CSV file that opens
  cleanly in Excel/WPS without mojibake. (P3)
- All 11 pages usable on a 360 px-wide phone: no horizontal scroll on
  the page body (table may scroll internally), all CTAs reachable, all
  text legible without zoom. (P4)
- HRList has both "查看" and "下载" buttons per row; 下载 triggers a
  browser save with the original file name. (P5)
- Admin can edit any non-self user's username + password via
  `/hr/admin/users`; cannot edit own credentials. (P6)
- HR login page no longer shows the "默认管理员账号：admin / Admin@2026"
  hint; credentials still work; documented in operations-manual.md. (P7)
- Logged in as `changlian_metal` user, `/hr/dashboard` shows ONLY
  昶联's 4 stat cards + 5 charts; no data from 中南机诚 / 中南智诚 /
  中南雅园 / 英硕激光 appears anywhere. (P8)
- 9-step E2E test still passes on desktop.
- 4-step mobile E2E: home → pick company → submit form → status query.
