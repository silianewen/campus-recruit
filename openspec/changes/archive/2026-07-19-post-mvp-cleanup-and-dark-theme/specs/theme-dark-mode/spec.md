## ADDED Requirements

### Requirement: Dark theme toggle

The system SHALL provide a user-visible toggle that switches the entire app between light and dark themes.

#### Scenario: Toggle visible on every page

- **WHEN** a user navigates to any route (`/`, `/upload`, `/success/:id`, `/dashboard`, `/stats`, `/status`, `/personality`, `/skill-test`)
- **THEN** a theme toggle control is rendered in the global header

#### Scenario: Toggle switches theme immediately

- **WHEN** the user clicks the toggle
- **THEN** the `dark` class on `<html>` is flipped, and every page repaints with the new theme within one frame (no reload required)

#### Scenario: Theme persists across reloads

- **WHEN** the user has selected a theme and reloads the page
- **THEN** the same theme is applied on initial render (no flash of the wrong theme)

#### Scenario: First-visit default follows system preference

- **WHEN** a user visits the app for the first time (no stored preference)
- **THEN** the app uses `prefers-color-scheme: dark` from the OS if available, otherwise light

### Requirement: No flash-of-wrong-theme on initial load

The system SHALL apply the persisted theme BEFORE the React tree mounts, so that the first paint shows the correct theme.

#### Scenario: Inline boot script runs before React

- **WHEN** `index.html` is parsed by the browser
- **THEN** a small inline script reads `localStorage.theme` (or `prefers-color-scheme`) and sets the `dark` class on `<html>` before the React bundle loads

#### Scenario: localStorage value is "light" or "dark" only

- **WHEN** the user toggles theme
- **THEN** `localStorage.theme` is set to exactly `"light"` or `"dark"` (no other values written)

### Requirement: Theme preference is per-device

The system SHALL store the theme preference only in the user's browser (`localStorage`). No server-side persistence; no account-level sync.

#### Scenario: Different devices see independent themes

- **WHEN** user A on device 1 selects dark mode
- **THEN** user A on device 2 still sees whatever theme they previously chose (or system default), unaffected by device 1

### Requirement: Theme respects existing accessibility preferences

The system SHALL keep the theme toggle accessible (keyboard-navigable, labeled for screen readers).

#### Scenario: Toggle reachable by keyboard

- **WHEN** a user tabs through the header
- **THEN** the toggle button receives focus and is operable via Space/Enter

#### Scenario: Toggle has an accessible name

- **WHEN** a screen reader user navigates to the toggle
- **THEN** the toggle announces its purpose (e.g., "Switch to dark mode" / "Switch to light mode")