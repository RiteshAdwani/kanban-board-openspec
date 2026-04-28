## Why

Teams and individuals need a simple, intuitive way to track tasks through their workflow. A Kanban board provides a visual, drag-and-drop-friendly interface that makes task status clear at a glance — deployable to the web with no infrastructure overhead.

## What Changes

- Introduce a full-stack Kanban board web application from scratch
- A responsive, modern UI with three fixed columns: **Open**, **In Progress**, and **Completed**
- Task cards with a sleek, minimal design displaying task title, description, and metadata
- Full CRUD operations for tasks (create, read, update, delete)
- Column rename support — columns cannot be added or deleted; the three default columns are fixed
- Hosted Postgres database via Neon — deployable to Vercel
- Next.js full-stack framework with React + TypeScript frontend and API routes as the backend
- Prisma ORM for type-safe database access and schema management

## Capabilities

### New Capabilities

- `kanban-board`: Main board view rendering the three columns and their task cards, with drag-and-drop support for moving tasks between columns (powered by `@dnd-kit`)
- `task-management`: CRUD operations for tasks — create a task with title/description, move it to a different column, edit its details, and delete it
- `column-management`: Read column list, rename a column; the three default columns (Open, In Progress, Completed) are seeded on first run
- `data-persistence`: Hosted Postgres via Neon, accessed through Prisma ORM; schema managed via Prisma Migrate

### Modified Capabilities

<!-- No existing capabilities — this is a greenfield project -->

## Impact

- **New project** — no existing code is affected
- **Dependencies introduced**: Next.js, React, TypeScript, Ant Design v5, CSS Modules, @dnd-kit, Prisma, Neon (hosted Postgres)
- **APIs introduced**: REST endpoints for `/api/tasks` and `/api/columns` via Next.js API routes
- **Storage**: Neon hosted Postgres database connected via `DATABASE_URL` environment variable
- **Deployment**: Vercel (frontend + API routes); Neon (database)
