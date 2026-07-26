## ADDED Requirements

### Requirement: HR can send a custom notification to a student (P1)
The system SHALL allow a logged-in HR user to compose and send a
notification (title + body) to a single student via their phone, which
then appears in the student's `/status` page under the "📨 HR 通知"
section.

#### Scenario: HR sends a notification from HRList
- **WHEN** the HR user clicks the "通知" button on a row in HRList
- **THEN** a modal opens with a title input, body textarea, and type
  selector (面试邀请 / 测评邀请 / 状态更新)
- **AND** submitting inserts a `notifications` row with that
  `resume.phone` as the recipient, the chosen title/body/type, and
  `read = false`
- **AND** the row in HRList briefly shows a "已发送 ✓" indicator

#### Scenario: Default group cannot send
- **WHEN** a user in the `default` group is logged in
- **THEN** the "通知" button is not rendered on HRList rows

#### Scenario: Student sees the notification
- **WHEN** a student opens `/status` and enters the recipient phone
- **THEN** the new notification appears at the top of the "📨 HR 通知"
  list with a 🔔 未读 badge
- **AND** the notification title + body + timestamp are rendered
  correctly

### Requirement: Positions can have an optional close date (P2)
The system SHALL allow `positions.closes_at` to be set; the upload
form SHALL reject submissions past that time.

#### Scenario: HR sets a close date
- **WHEN** HR adds or edits a position in the `positions` table and
  sets `closes_at = '2026-08-15 23:59:59+08'`
- **THEN** the position is shown on the company detail page with a
  "X 天后截止" badge when within 14 days of the deadline
- **AND** the upload form at `/upload?company=X&position=Y` displays
  "该岗位已于 YYYY-MM-DD 截止" instead of the form fields when the
  current time is past the deadline

#### Scenario: No close date set
- **WHEN** `positions.closes_at` is NULL
- **THEN** the position has no badge and accepts submissions at any
  time (current behavior preserved)

#### Scenario: Position already past deadline
- **WHEN** a student clicks on a position whose `closes_at` is in the
  past
- **THEN** the company detail page still shows the position but
  without a "投递" button — only a "已截止" label

### Requirement: HR can export the filtered list to CSV (P3)
The system SHALL allow a logged-in HR user to download the currently
filtered rows of HRList as a UTF-8-encoded CSV file.

#### Scenario: Export respects active filters
- **WHEN** the HR user has set filters (company, position, status,
  duplicate-only, search text) and clicks "导出 CSV"
- **THEN** a CSV file is downloaded containing only the rows that
  match those filters
- **AND** the file name includes the active filter summary, e.g.
  `投递简历_2026-07-19_changlian_metal_已约面.csv`

#### Scenario: CSV opens cleanly in Excel/WPS
- **WHEN** the HR user opens the downloaded file in Excel
- **THEN** Chinese characters render correctly (UTF-8 with BOM)
- **AND** the columns are in the same order as the on-screen table
- **AND** the duplicate-context column for cross-company repeats is
  present and readable

#### Scenario: Cross-company context preserved
- **WHEN** a row is a duplicate (its phone appears 2+ times in the
  table data)
- **THEN** the CSV includes a "其它投递" column listing the
  other companies + positions for that phone, semicolon-separated

### Requirement: All pages are usable on a 360px-wide phone screen (P4)
The system SHALL make every page usable on a 360px-wide viewport
without horizontal page-body scroll and without requiring zoom.

#### Scenario: HRList on mobile
- **WHEN** a phone-width HR user opens `/hr/list`
- **THEN** the 11-column table is replaced by a stacked card list (one
  card per submission row), where each card shows: 姓名 / 手机 /
  重复投递 badge / 应聘公司 / 职位 / 状态 / 投递时间
- **AND** the card list is filterable with the same filters as the
  desktop table
- **AND** horizontal scroll is only allowed inside the filter row,
  not the page body

#### Scenario: HRDashboard on mobile
- **WHEN** a phone-width HR user opens `/hr/dashboard`
- **THEN** the 4 stat cards stack vertically (1 column instead of 4)
- **AND** the 5 charts stack vertically (1 column instead of 3)
- **AND** chart heights are reduced to ~240px so all 5 fit on one
  phone screen scroll

#### Scenario: Home / CompanyDetail on mobile
- **WHEN** a phone-width user opens `/` or `/companies/:id`
- **THEN** the company-cards grid becomes 1-column on phones
  (currently 2-column on `md:`)
- **AND** all CTAs are reachable with thumb on a 360px screen

#### Scenario: Upload / Personality / SkillTest on mobile
- **WHEN** a phone-width user opens any of those pages
- **THEN** the form is full-width with 16px side padding (already
  mostly the case)
- **AND** radio options for MBTI / skill test are stacked full-width
  (currently 4-column grid; becomes 1-column on `< sm`)
- **AND** the question text never overflows the viewport

### Requirement: HR can view and download a candidate's resume (P5)
The system SHALL let an HR user view the original resume file in a
new tab AND trigger a local download of the same file from HRList.

#### Scenario: HR opens resume in new tab
- **WHEN** the HR user clicks the "查看" link in the 操作 column
- **THEN** the resume file (PDF or Word) opens in a new browser tab

#### Scenario: HR downloads resume
- **WHEN** the HR user clicks the "下载" link in the 操作 column
- **THEN** the browser saves the resume file locally with the
  original `resumes.file_name` as the suggested file name

#### Scenario: Resume link is hidden when missing
- **WHEN** the row's resume has no `file_url` (edge case, e.g. data
  before file upload bug)
- **THEN** neither "查看" nor "下载" links are rendered for that
  row; the cell stays blank

### Requirement: Admin can edit existing users' username and password (P6)
The system SHALL allow a `group_admin` user to edit an existing
user's username, display name, and/or password from
`/hr/admin/users`.

#### Scenario: Admin opens edit modal
- **WHEN** admin clicks the "编辑" button on a user's row
- **THEN** a modal opens with three fields: username, display name,
  new password (leave blank to keep current)
- **AND** username and display name are pre-filled

#### Scenario: Admin saves username change
- **WHEN** admin changes the username field and clicks "保存"
- **THEN** the `hr_users.username` column is updated
- **AND** the row in the user list reflects the new username
- **AND** no other field is changed

#### Scenario: Admin resets password
- **WHEN** admin types a new password (≥ 6 chars) and clicks "保存"
- **THEN** the `hr_users.password_hash` column is updated to
  `sha256(salt + newPassword)` where salt is `campus_recruit_v1_<username>`
- **AND** the row is updated

#### Scenario: Admin cannot edit self
- **WHEN** admin views their own row
- **THEN** the "编辑" button is disabled and shows a tooltip
  "不能编辑自己（避免自锁）"
- **AND** there is no way to change their own username or password
  from this UI (forced to use SQL template in operations-manual.md)

#### Scenario: Default group cannot access admin page
- **WHEN** a user in the `default` group is logged in
- **THEN** `/hr/admin/users` immediately redirects to `/hr`
- **AND** a flash message "仅集团管理员可访问" is shown

### Requirement: HR login page does not display default credentials (P7)
The system SHALL NOT render the default admin credentials (or any
plaintext credentials) in the rendered HTML of the HR login page.

#### Scenario: Login form is rendered
- **WHEN** an unauthenticated user visits `/hr`
- **THEN** the login form shows username and password input fields
- **AND** does NOT contain the line "默认管理员账号：admin / Admin@2026"
  or any other plaintext credentials

#### Scenario: Credentials are documented elsewhere
- **WHEN** an admin needs to onboard a new administrator
- **THEN** they can read the default credentials from
  `docs/operations-manual.md` §3.1.1 (HR 用户与权限组)

### Requirement: Company-group dashboard shows ONLY own company data (P8)
The system SHALL restrict a `company_<id>` HR user's data view to
ONLY submissions and positions belonging to that company.

#### Scenario: Company-group stat cards
- **WHEN** `changlian_metal` HR logs in and opens `/hr/dashboard`
- **THEN** the 4 stat cards (总投递数 / 已约面 / 已 offer / 公司) only
  count 昶联's submissions
- **AND** the "公司" stat always shows "1" (the user's own company)

#### Scenario: Company-group chart x-axis
- **WHEN** `changlian_metal` HR opens `/hr/dashboard`
- **THEN** the position bar chart x-axis lists ONLY 昶联's positions
  (currently 2: 人力行政专员, 采购专员)
- **AND** no positions from 中南机诚 / 中南智诚 / 英硕激光 /
  中南雅园 appear in the chart

#### Scenario: Company-group stacked bar
- **WHEN** `changlian_metal` HR opens `/hr/dashboard`
- **THEN** the stacked bar chart "各公司各岗位投递分布" shows ONLY one
  segment bar (昶联); no other companies' bars are rendered
- **AND** each segment only has 昶联's 2 positions (人力行政专员,
  采购专员)

#### Scenario: Company-group pies
- **WHEN** `changlian_metal` HR opens `/hr/dashboard`
- **THEN** the "按公司" pie chart shows 100% 昶联 (one slice)
- **AND** the "按学历" pie shows ONLY 昶联 candidates' degrees
- **AND** the "专业 Top 10" pie shows ONLY 昶联 candidates' majors

#### Scenario: Admin / default sees everything (no scope)
- **WHEN** an admin or default-group user opens `/hr/dashboard`
- **THEN** the dashboard shows data from ALL 5 companies (no
  filtering), as before

#### Scenario: Company-group repeat marking still works
- **WHEN** a 昶联 candidate (phone X) has also applied to 中南机诚
- **THEN** 昶联's HR sees the 昶联 row with the "重复投递" badge
  AND cross-company context "其它投递：<其它公司> - <其它岗位>" (no
  leakage of other companies' data INTO 昶联's stats; just
  identification context for HR)
