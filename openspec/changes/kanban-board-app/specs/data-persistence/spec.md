## ADDED Requirements

### Requirement: Application uses SQLite for persistent local storage
The system SHALL use a SQLite database file located at `data/kanban.db` (relative to the project root) as its sole data store. The `data/` directory SHALL be created automatically if it does not exist.

#### Scenario: Application starts for the first time
- **WHEN** the server starts and `data/kanban.db` does not exist
- **THEN** the system SHALL create the file, run `CREATE TABLE IF NOT EXISTS` migrations for `columns` and `tasks`, and proceed to seed default columns

#### Scenario: Application restarts with existing database
- **WHEN** the server starts and `data/kanban.db` already exists with data
- **THEN** the system SHALL connect to the existing file and serve its data without overwriting or re-seeding

### Requirement: All writes are atomic
The system SHALL wrap multi-statement write operations (e.g., move task + recompute positions) in a SQLite transaction so that partial failures leave the database in a consistent state.

#### Scenario: Delete task and recompute positions atomically
- **WHEN** a task is deleted and position recomputation is triggered for the remaining tasks
- **THEN** both the delete and all position UPDATE statements SHALL execute inside a single transaction; if any statement fails the entire operation SHALL be rolled back

#### Scenario: Move task atomically
- **WHEN** a task is moved to a different column (column_id update + position append)
- **THEN** the update SHALL be performed in a single transaction

### Requirement: Database schema is initialised on startup via migrations
The system SHALL define the schema with `CREATE TABLE IF NOT EXISTS` statements executed on every startup, ensuring the schema exists before any request is handled.

#### Scenario: Schema tables are created on first start
- **WHEN** the server starts against an empty SQLite file
- **THEN** the `columns` and `tasks` tables SHALL exist before any API route is reachable

#### Scenario: Schema migration is idempotent
- **WHEN** the server restarts against an already-initialised database
- **THEN** the `CREATE TABLE IF NOT EXISTS` statements SHALL complete without error and without modifying existing data

### Requirement: Storage layer is encapsulated behind a repository interface
All direct SQLite interactions SHALL live in `server/db.js` and dedicated route files; no raw SQL SHALL appear in the Express route handlers themselves beyond the repository layer.

#### Scenario: Route handler delegates to repository
- **WHEN** a POST request to `/api/tasks` is processed
- **THEN** the route handler SHALL call a repository function (e.g., `createTask`) rather than executing SQL inline
