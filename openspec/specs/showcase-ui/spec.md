# showcase-ui Specification

## Purpose
Defines user-facing interactive controls, keyboard navigation shortcuts, and responsive layout contracts for the DocHarvest documentation showcase interface.

## Requirements

### Requirement: IndexSheet search filter supports Escape-to-clear and blur
The IndexSheet search filter SHALL support the Escape key to clear query text or blur the input field.

#### Scenario: User presses Escape with search text present
- **WHEN** the filter input is focused and contains query text, and the user presses Escape
- **THEN** the filter query SHALL be cleared to empty string, and focus SHALL remain on the input field

#### Scenario: User presses Escape with search text empty
- **WHEN** the filter input is focused and the query is already empty, and the user presses Escape
- **THEN** the filter input SHALL blur and release focus

### Requirement: Global forward-slash shortcut focuses the IndexSheet search filter
The application SHALL provide a global `/` keyboard accelerator to focus the primary documentation index search filter.

#### Scenario: User presses forward slash outside editable fields
- **WHEN** the user presses `/` while active focus is NOT on an input, textarea, select, or contenteditable element
- **THEN** the event default SHALL be prevented and focus SHALL immediately move to the IndexSheet search filter input

#### Scenario: User presses forward slash inside an existing input
- **WHEN** the user presses `/` while typing inside any text input or editable element
- **THEN** the slash character SHALL be typed normally into that field without triggering focus redirection

### Requirement: IndexSheet live region announcements are throttled
The application SHALL debounce or throttle screen-reader live region count announcements during continuous search filter input.

#### Scenario: User types multiple search characters rapidly
- **WHEN** the user inputs a multi-character query with keystrokes under 250ms apart
- **THEN** the `aria-live` announcement for matching row count SHALL update only after typing pauses for at least 300ms

### Requirement: Hero specimen maintains consistent border and scroll frame
The Hero component container SHALL not clip the internal scroll viewport or borders of the IndexSheet specimen.

#### Scenario: Specimen is rendered inside the Hero on standard and mobile viewports
- **WHEN** the Hero specimen is displayed across viewport widths (390px to 1440px)
- **THEN** the specimen frame SHALL display all four exterior borders cleanly and scroll internally without nested parent clipping

### Requirement: Sticky mobile navigation indicates horizontal scroll overflow
The compact mobile navigation bar SHALL provide a visual indicator when navigation links extend beyond the viewport edge.

#### Scenario: Viewport width is under 375px
- **WHEN** the compact header navigation contains more links than fit horizontally on the screen
- **THEN** the right edge of the navigation container SHALL present a subtle trailing mask or visual fade indicating additional scrollable items
