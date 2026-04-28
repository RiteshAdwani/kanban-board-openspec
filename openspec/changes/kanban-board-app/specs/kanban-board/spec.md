## ADDED Requirements

### Requirement: Board displays all columns and their tasks
The system SHALL render the Kanban board as a horizontal layout of three fixed columns — **Open**, **In Progress**, and **Completed** — each displaying all tasks belonging to that column as cards, ordered by their `position` value.

#### Scenario: Board loads with populated columns
- **WHEN** a user opens the application in a browser
- **THEN** the board SHALL display three columns side by side, each with its name as a heading, and all tasks in that column rendered as cards below the heading

#### Scenario: Board loads with empty columns
- **WHEN** a column has no tasks
- **THEN** the column SHALL still be rendered with its heading and an empty state message (e.g., "No tasks yet")

### Requirement: Board is responsive across device sizes
The system SHALL adapt the board layout for mobile, tablet, and desktop viewports.

#### Scenario: Viewing on a small screen (< 768 px wide)
- **WHEN** the board is rendered on a viewport narrower than 768 px
- **THEN** each column SHALL stack vertically and occupy the full width of the viewport

#### Scenario: Viewing on a desktop screen (≥ 1024 px wide)
- **WHEN** the board is rendered on a viewport at least 1024 px wide
- **THEN** all three columns SHALL be displayed side by side in a row with equal width

### Requirement: Task card displays task information
Each task card SHALL display at minimum the task **title**. If a description is present it SHALL also be shown, truncated to two lines with a visual indicator if overflow exists.

#### Scenario: Card with title and description
- **WHEN** a task has both a title and a description
- **THEN** the card SHALL show the title prominently and the description below it, truncated to two lines

#### Scenario: Card with title only
- **WHEN** a task has no description
- **THEN** the card SHALL show only the title without any empty space reserved for description

### Requirement: Task can be moved between columns via drag-and-drop
The system SHALL allow a user to drag a task card from one column and drop it into another column, updating the task's `column_id` and appending it to the bottom of the destination column.

#### Scenario: Drag a task to a different column
- **WHEN** a user drags a task card and drops it onto a different column
- **THEN** the task SHALL be removed from the source column, appended to the destination column, and the change SHALL be persisted to the backend via a PATCH request

#### Scenario: Drop task back onto its own column
- **WHEN** a user drags a task card and drops it back into the same column
- **THEN** no API call SHALL be made and the board state SHALL remain unchanged

### Requirement: Task can be moved between columns via a dropdown (touch fallback)
Each task card SHALL include a "Move to…" action that opens a dropdown listing the other two columns, allowing the user to move the task without drag-and-drop.

#### Scenario: Move task using dropdown on touch device
- **WHEN** a user selects a target column from the "Move to…" dropdown on a task card
- **THEN** the task SHALL be moved to the selected column and the board SHALL re-render to reflect the change

### Requirement: Board applies a modern, classy visual style
The board UI SHALL use a cohesive visual design: a neutral or dark background, subtle card shadows, rounded corners, smooth hover transitions, and a clean sans-serif typeface.

#### Scenario: Hover state on a task card
- **WHEN** a user hovers the mouse over a task card
- **THEN** the card SHALL display a visible but subtle elevation or shadow increase to indicate interactivity
