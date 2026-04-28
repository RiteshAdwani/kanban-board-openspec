## ADDED Requirements

### Requirement: User can create a task
The system SHALL allow a user to create a new task by providing a title (required) and an optional description. The task SHALL be created in a specified column (defaulting to **Open** if not specified) and appended to the bottom of that column.

#### Scenario: Create task with title and description
- **WHEN** a user submits the "Add Task" form with a non-empty title and a description
- **THEN** the system SHALL persist the task to storage, assign it to the target column, set its `position` to the last index in that column, and return `201 Created` with the new task object

#### Scenario: Create task with title only
- **WHEN** a user submits the "Add Task" form with a non-empty title and no description
- **THEN** the system SHALL create the task with `description` set to `null` and return `201 Created`

#### Scenario: Attempt to create task with empty title
- **WHEN** a user submits the "Add Task" form with an empty or whitespace-only title
- **THEN** the system SHALL return `400 Bad Request` with an error message and SHALL NOT persist any data

### Requirement: User can read / list tasks
The system SHALL provide an endpoint to retrieve all tasks for a given column, ordered by `position` ascending. A separate endpoint SHALL retrieve a single task by ID.


#### Scenario: List tasks for a column
- **WHEN** a GET request is made to `/api/tasks?columnId=<id>`
- **THEN** the system SHALL return `200 OK` with a JSON array of task objects for that column, sorted by `position`

#### Scenario: Get single task by ID
- **WHEN** a GET request is made to `/api/tasks/:id` with a valid task ID
- **THEN** the system SHALL return `200 OK` with the full task object

#### Scenario: Get task with non-existent ID
- **WHEN** a GET request is made to `/api/tasks/:id` with an ID that does not exist
- **THEN** the system SHALL return `404 Not Found`

### Requirement: User can update a task
The system SHALL allow partial updates to a task's `title`, `description`, and `column_id`. Updating `column_id` SHALL also update `position` to append the task at the bottom of the destination column.

#### Scenario: Edit task title
- **WHEN** a PATCH request is made to `/api/tasks/:id` with a new non-empty `title`
- **THEN** the system SHALL update the task's title, set `updated_at` to the current timestamp, and return `200 OK` with the updated task object

#### Scenario: Move task to a different column via API
- **WHEN** a PATCH request is made to `/api/tasks/:id` with a valid `column_id` different from the current one
- **THEN** the system SHALL update the task's `column_id`, set its `position` to the last index in the target column, and return `200 OK`

#### Scenario: Attempt to update task title to empty
- **WHEN** a PATCH request is made to `/api/tasks/:id` with an empty or whitespace-only `title`
- **THEN** the system SHALL return `400 Bad Request` and SHALL NOT persist the change

### Requirement: User can delete a task
The system SHALL allow a user to delete a task by ID. After deletion, the `position` values of remaining tasks in the same column SHALL be recomputed to be contiguous starting from 0.

#### Scenario: Delete an existing task
- **WHEN** a DELETE request is made to `/api/tasks/:id` with a valid task ID
- **THEN** the system SHALL remove the task from storage, recompute positions of remaining tasks in the column, and return `204 No Content`

#### Scenario: Attempt to delete non-existent task
- **WHEN** a DELETE request is made to `/api/tasks/:id` with an ID that does not exist
- **THEN** the system SHALL return `404 Not Found`

### Requirement: Task creation is accessible from the UI
The board UI SHALL provide an inline "Add Task" button or form within each column that allows the user to quickly create a task in that column without navigating away.

#### Scenario: Add task from column UI
- **WHEN** a user clicks the "Add Task" button in a column and submits the form with a valid title
- **THEN** a new task card SHALL appear at the bottom of that column immediately after the API responds successfully
