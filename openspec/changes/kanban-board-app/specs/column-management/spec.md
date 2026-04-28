## ADDED Requirements

### Requirement: System seeds three default columns on first run
The system SHALL automatically create the three default columns — **Open** (position 0), **In Progress** (position 1), and **Completed** (position 2) — when the database is first initialised and the columns table is empty.

#### Scenario: First-time application start
- **WHEN** the application starts and the `columns` table is empty
- **THEN** the system SHALL insert the three default columns in order and return them in all subsequent list responses

#### Scenario: Subsequent application starts
- **WHEN** the application starts and the `columns` table already has rows
- **THEN** the system SHALL NOT insert duplicate columns

### Requirement: User can list columns
The system SHALL provide an endpoint to retrieve all columns ordered by `position` ascending.

#### Scenario: List all columns
- **WHEN** a GET request is made to `/api/columns`
- **THEN** the system SHALL return `200 OK` with a JSON array of all column objects sorted by `position`

### Requirement: User can rename a column
The system SHALL allow a user to rename any column by providing a new non-empty name. The column's `position` and associated tasks SHALL remain unchanged.

#### Scenario: Rename a column with a valid name
- **WHEN** a PATCH request is made to `/api/columns/:id` with a non-empty `name`
- **THEN** the system SHALL update the column's name and return `200 OK` with the updated column object

#### Scenario: Attempt to rename column with empty name
- **WHEN** a PATCH request is made to `/api/columns/:id` with an empty or whitespace-only `name`
- **THEN** the system SHALL return `400 Bad Request` and SHALL NOT persist the change

#### Scenario: Rename a non-existent column
- **WHEN** a PATCH request is made to `/api/columns/:id` where the ID does not exist
- **THEN** the system SHALL return `404 Not Found`

### Requirement: Default columns cannot be deleted
The system SHALL reject DELETE requests for any column, as the three columns are fixed. This prevents accidental data loss of all tasks within a column.

#### Scenario: Attempt to delete a column
- **WHEN** a DELETE request is made to `/api/columns/:id`
- **THEN** the system SHALL return `405 Method Not Allowed` with a message explaining that columns cannot be deleted

### Requirement: Column task count is included in the list response
Each column object returned by the API SHALL include a `taskCount` field reflecting the number of tasks currently in that column.

#### Scenario: Column with tasks returns correct count
- **WHEN** a GET request is made to `/api/columns` and a column contains 3 tasks
- **THEN** the response for that column SHALL include `"taskCount": 3`

#### Scenario: Empty column returns count of zero
- **WHEN** a GET request is made to `/api/columns` and a column has no tasks
- **THEN** the response for that column SHALL include `"taskCount": 0`
