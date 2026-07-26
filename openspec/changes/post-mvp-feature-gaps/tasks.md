# Tasks — post-mvp-feature-gaps

Priority: 1 > 2 > 3 > 4 > 5 > 6 > 7 > 8

## 1. P1 — HR send-notification button

- [ ] 1.1 Add `insertNotification({phone, title, content, type})` to `src/lib/loaders.ts`.
- [ ] 1.2 In `HRList.tsx`: add a "通知" button per row (visible only when `scope.kind !== 'default'`). Click opens a modal with title / body / type selector (default: "面试通知" + type=interview_invite).
- [ ] 1.3 Modal submit calls `insertNotification` and shows "已发送 ✓" briefly.
- [ ] 1.4 Verify the new notification appears at top of `Status.tsx` "📨 HR 通知" list with 🔔 badge.

## 2. P2 — closes_at column + UI

- [ ] 2.1 Add `supabase/migrations/0010_closes_at.sql` with `ALTER TABLE positions ADD COLUMN closes_at TIMESTAMPTZ` + index.
- [ ] 2.2 Update `src/lib/types.ts` `Position` interface to include `closes_at?: string | null`.
- [ ] 2.3 Update `src/lib/loaders.ts` `PositionRow` and `fetchPosition` / `fetchPositionsForCompany` / `fetchAllPositions` to include `closes_at` in the select.
- [ ] 2.4 Add `ClosesAtBadge` helper in `src/components/ClosesAtBadge.tsx` (returns "X 天后截止" within 14d, "已截止" if past, null otherwise).
- [ ] 2.5 Render the badge in `Home.tsx` / `CompanyDetail.tsx` / `SkillTest.tsx` position cards.
- [ ] 2.6 In `Upload.tsx`: when `pos.closes_at` is past, render "已截止" page instead of form.
- [ ] 2.7 After deploy: `NOTIFY pgrst, 'reload schema';`

## 3. P3 — CSV export

- [ ] 3.1 Create `src/lib/csv.ts` with `escapeCsvCell`, `rowsToCsv` (UTF-8 BOM), `downloadCsv` helpers.
- [ ] 3.2 In `HRList.tsx`: add "导出 CSV" button next to refresh button.
- [ ] 3.3 Build CSV from currently filtered rows: same 11 columns + "其它投递" column with `;`-separated `{company} - {position}` for duplicate phones.
- [ ] 3.4 Filename: `投递简历_YYYY-MM-DD_<filters>.csv` (omit empty filter buckets).
- [ ] 3.5 Cap: if filtered rows > 1000, show toast "筛选结果过大，请缩小范围" instead of downloading.

## 4. P4 — Mobile responsive

- [ ] 4.1 `HRList.tsx`: replace the `<table>` with two parallel render branches using `sm:hidden` (mobile cards) / `hidden sm:table-row` (desktop table).
- [ ] 4.2 `HRDashboard.tsx`: stat cards `grid-cols-2 md:grid-cols-4`; chart grid `grid-cols-1 lg:grid-cols-3`; chart heights `h-60 sm:h-80`.
- [ ] 4.3 `Home.tsx`: company cards `grid-cols-1 sm:grid-cols-2`.
- [ ] 4.4 `Upload.tsx`: form padding `px-4 sm:px-6`; verify file input doesn't overflow.
- [ ] 4.5 `Personality.tsx` + `SkillTest.tsx`: option buttons stack 1-col on mobile; verify.
- [ ] 4.6 Manual test at 360px viewport: open every page, verify no horizontal page-body scroll.

## 5. P5 — HR resume view + download

- [ ] 5.1 `HRList.tsx`: in the 操作 column, the existing "简历" link (open in new tab) gets a sibling "下载" link.
- [ ] 5.2 The "下载" link uses the `download` attribute set to `r.resume.file_name`.
- [ ] 5.3 Verify both links hide when `r.resume.file_url` is missing (existing pattern).

## 6. P6 — Admin can edit user credentials

- [ ] 6.1 Add `updateHrUser(id, {username?, displayName?, passwordHash?})` to `src/lib/loaders.ts`.
- [ ] 6.2 `HRAdminUsers.tsx`: replace inline "delete" action with "编辑" + "删除" buttons. Click "编辑" opens a modal.
- [ ] 6.3 Modal has 3 fields: username (text, prefilled), display name (text, prefilled), new password (text, leave blank to keep).
- [ ] 6.4 Save calls `updateHrUser`. New password is hashed via `hashPassword` if non-empty.
- [ ] 6.5 Cannot edit self: "编辑" button on own row is disabled with title "不能编辑自己（避免自锁）".
- [ ] 6.6 Already-shown "（自己）" label stays for clarity.
- [ ] 6.7 If a user types a new username that already exists in the DB, show inline error "用户名已存在".

## 7. P7 — Hide default-credentials hint

- [ ] 7.1 `HR.tsx`: remove the `<p>默认管理员账号：admin / Admin@2026</p>` line from the login form.
- [ ] 7.2 Verify the admin / Admin@2026 credentials still work (they're still seeded in `hr_users`).
- [ ] 7.3 Verify `docs/operations-manual.md` §3.1.1 still documents the credentials for onboarding.

## 8. P8 — Dashboard strict company scope

- [ ] 8.1 `HRDashboard.tsx`: when `scope.kind === 'company'`, replace `fetchAllPositions()` with `fetchPositionsForCompany(scope.companyId)`.
- [ ] 8.2 Verify that:
  - Stat cards only count the user's own company.
  - Bar chart x-axis lists ONLY that company's positions.
  - Stacked bar chart shows only one segment (the user's own company).
  - Pie charts reflect only that company's data.
- [ ] 8.3 Verify repeat-submission marking still shows 重复投递 badge + cross-company context for company groups (should already work since `fetchCrossCompanyContext` takes `excludeCompanyId`).
- [ ] 8.4 Admin / default-group users see no change in dashboard behavior (full data).

## 9. Docs + build + push

- [ ] 9.1 Update `docs/operations-manual.md` §3 with new feature notes (P1 send notifications, P3 CSV export, P5 view+download, P6 edit user, P7 default creds removed from UI, P8 strict scope).
- [ ] 9.2 Run `npm run build` locally; fix any TS / lint errors.
- [ ] 9.3 Commit + push; Vercel auto-deploys.
- [ ] 9.4 Manually test the 8 capabilities on production URL.
- [ ] 9.5 Run `openspec archive post-mvp-feature-gaps` to archive this change.
