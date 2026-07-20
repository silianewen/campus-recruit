## ADDED Requirements

### Requirement: Frontend loads companies from Supabase

The system SHALL fetch the list of companies from the `companies` table at runtime, rather than reading a hardcoded registry in `src/lib/`.

#### Scenario: Home page renders companies from DB

- **WHEN** a user opens `/` and Supabase returns at least one row from `companies`
- **THEN** every row is rendered as a company card on the home page

#### Scenario: Company name change in Supabase is reflected on refresh

- **WHEN** an operator edits a company name in Supabase `companies` table
- **THEN** a refresh of `/` shows the updated name (proves the registry is the DB, not source code)

#### Scenario: Empty companies list shows a friendly state

- **WHEN** `companies` table is empty
- **THEN** home page shows a message indicating companies are not configured yet

### Requirement: Frontend loads positions per company from Supabase

The system SHALL fetch the positions for a given company by joining `positions` (filtered by `id LIKE '<companyId>-%'`), replacing the hardcoded `companyPositions.ts` registry.

#### Scenario: Tier-2 page renders positions for selected company

- **WHEN** a user selects a company on `/`
- **THEN** the position grid below shows only positions whose `id` starts with `<companyId>-`

#### Scenario: New position added in Supabase appears without redeploy

- **WHEN** an operator adds a row to `positions` with id `changlian_metal-new-role`
- **THEN** a refresh of `/` → click "昶联金属" shows the new position card

### Requirement: Frontend loads skill questions from Supabase

The system SHALL fetch skill-test questions for the chosen position from the `questions_skill` table, replacing the hardcoded `questions-skill.ts` registry.

#### Scenario: SkillTest shows DB-seeded questions

- **WHEN** a user picks a position and starts the skill test
- **THEN** the 5 questions displayed come from `questions_skill` rows where `position_id` matches

#### Scenario: Question added in Supabase appears on next test

- **WHEN** an operator adds a row to `questions_skill` for an existing position
- **THEN** the next user who takes that skill test sees the new question (proves DB-first loading)

### Requirement: Loader pattern enforces loading and empty states

The system SHALL provide a shared pattern for components that consume async loaders: show a spinner while loading, render an empty state when the result is empty, and render the data when present.

#### Scenario: Loading state on first paint

- **WHEN** a page mounts and the loader is in flight
- **THEN** a centered spinner is displayed (no flash of empty state)

#### Scenario: Error state when loader fails

- **WHEN** a loader throws (network error, Supabase down)
- **THEN** an error message is shown with a retry button

#### Scenario: Empty state when DB returns 0 rows

- **WHEN** a loader returns an empty array (e.g., no questions for that position)
- **THEN** the page shows a friendly empty-state message, not a blank screen

### Requirement: Data loading does not regress upload flow

The loader refactor MUST NOT change the upload insertion behavior. Uploads still write to `resumes` and `submissions` with the same shape as before, including `company_id` and `position_id`.

#### Scenario: Upload still completes after loader refactor

- **WHEN** a student fills the upload form and submits
- **THEN** a row is created in `resumes` AND a row is created in `submissions`, and the success page renders