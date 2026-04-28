## Context

This is a greenfield project: a Kanban board web application built with a Next.js full-stack framework, React + TypeScript frontend, and a hosted Postgres database via Neon. There is no existing codebase to migrate. The app targets individuals and small teams who want a clean, deployable task tracker with a modern UI.

The three default columns — **Open**, **In Progress**, **Completed** — are seeded on first run and are not user-deletable (though they can be renamed). The column set is fixed; add/delete column functionality is out of scope for this iteration.

## Goals / Non-Goals

**Goals:**
- Deliver a fully functional Kanban board with CRUD for tasks and columns
- Provide a sleek, responsive UI that works on desktop and mobile
- Deploy to Vercel with Neon (hosted Postgres) as the database
- Use Prisma as the ORM for type-safe database access
- Expose a clean REST API via Next.js API routes
- Support drag-and-drop for moving tasks between columns on the frontend

**Non-Goals:**
- User authentication / multi-user support
- Real-time collaboration (WebSockets/SSE)
- Custom column add/delete (column set is fixed: Open, In Progress, Completed)
- File attachments, comments, or rich-text descriptions
- Pagination (assumed small dataset)

## Decisions

### 1. Storage: Neon (hosted Postgres) via Prisma

**Decision**: Use Neon as the hosted Postgres database, accessed through Prisma ORM.

**Rationale**:
- Vercel's serverless functions have an ephemeral filesystem — SQLite and JSON file storage are not viable for deployment
- Neon provides a free-tier hosted Postgres that connects seamlessly to Vercel via environment variables
- Prisma generates TypeScript types from the schema, eliminating manual type casting and providing compile-time safety
- Prisma Migrate handles schema evolution cleanly

**Alternative considered**: SQLite via `better-sqlite3`
- Works great locally but incompatible with Vercel's serverless runtime (ephemeral filesystem)
- Ruled out due to deployment target

**Alternative considered**: Plain JSON file via `fs`
- Same ephemeral filesystem problem on Vercel
- Not atomic; risk of data corruption

### 2. Backend: Next.js API Routes over Express

**Decision**: Use Next.js API routes (`/app/api/...`) as the backend layer.

**Rationale**:
- Single project, single `npm run dev` — no separate server process
- TypeScript is shared end-to-end between frontend and API routes
- Deploys natively to Vercel with zero additional configuration
- No CORS configuration needed (same origin)

**Alternative considered**: Express
- Requires a separate server project and CORS setup
- Adds friction for a small two-model API surface
- Not necessary when Next.js API routes cover the same ground

### 3. Frontend: React + TypeScript + Ant Design v5 + CSS Modules

**Decision**: React with TypeScript, Ant Design v5 for UI components, and CSS Modules for custom layout styling.

**Rationale**:
- React + TypeScript is a well-supported, type-safe combination with strong Next.js integration
- Ant Design v5 provides production-quality components (cards, modals, buttons, inputs) out of the box
- AntD v5 uses its own CSS-in-JS engine (`@ant-design/cssinjs`); using styled-components alongside it creates two competing CSS-in-JS runtimes with specificity conflicts — CSS Modules avoids this entirely
- AntD's `ConfigProvider` with design tokens handles global theming (colours, border radius, font) without additional libraries
- CSS Modules are natively supported by Next.js — no extra configuration required

**Alternative considered**: styled-components
- Conflicts with AntD v5's internal CSS-in-JS engine
- Adds ~12kb bundle overhead
- Not necessary given AntD's built-in theming capabilities

### 4. Drag-and-Drop: `@dnd-kit` over `react-beautiful-dnd`

**Decision**: Use `@dnd-kit` for drag-and-drop interactions.

**Rationale**:
- Actively maintained; fully compatible with React 18 Strict Mode
- `react-beautiful-dnd` is in maintenance mode and has known issues with React 18's double-invocation of effects in Strict Mode, breaking drag state
- `@dnd-kit` is modular and tree-shakeable; smaller bundle impact
- Provides accessible drag-and-drop out of the box

**Alternative considered**: `react-beautiful-dnd`
- Familiar API but unmaintained and React 18 incompatible without workarounds

### 5. API design: REST with JSON over GraphQL / tRPC

**Decision**: REST with `Content-Type: application/json` via Next.js API routes.

**Rationale**:
- Predictable and easy to test with `curl` or Postman
- No client-side query language needed; data model is flat and simple
- tRPC would require additional setup and learning curve for a small API surface

### 6. Data model (Prisma schema)

```prisma
model Column {
  id        Int      @id @default(autoincrement())
  name      String
  position  Int                     // display order (0, 1, 2)
  createdAt DateTime @default(now())
  tasks     Task[]
}

model Task {
  id          Int      @id @default(autoincrement())
  columnId    Int
  column      Column   @relation(fields: [columnId], references: [id])
  title       String
  description String?
  position    Int                   // order within the column
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

On first run a seed script inserts the three default columns if the `Column` table is empty.

### 7. Data fetching: Server Components + targeted `"use client"`

**Decision**: `app/page.tsx` is an async Server Component. The `"use client"` directive is applied only at the `Board` component and below. No `useEffect` is used for initial data loading.

**Rationale**:
- Next.js App Router makes `page.tsx` an async Server Component by default — using `useEffect` for initial data fetches works against the framework
- Server-side fetching eliminates the client-visible loading waterfall (fetch columns → fetch tasks ×3 = 4 sequential round-trips before the board renders)
- DB calls on the server run close to the database; on a cold Neon connection this is 200–500 ms faster than a client-initiated fetch
- `page.tsx` calls the shared service layer directly (same functions the API routes use), so there is no duplicated data-access logic
- `export const dynamic = 'force-dynamic'` on `page.tsx` ensures the board always reflects the latest data — no stale cache served

**`"use client"` boundary**:

```
app/page.tsx                 ← Server Component (async, no directive)
  └── <Board />              ← "use client" — owns DndContext, local state, all mutations
        └── <Column />       ← "use client" — SortableContext, Add Task button
              └── <TaskCard />  ← "use client" — useSortable, dropdown, popconfirm
              └── <TaskModal /> ← "use client" — Modal, Form, controlled inputs

app/layout.tsx               ← Server Component
  └── <AntdRegistryWrapper /> ← "use client" thin wrapper (required by @ant-design/nextjs-registry)
```

**Data flow**:
```
page.tsx (server)
  columnService.getAll()     → columns[]
  taskService.getByColumns() → Record<columnId, Task[]>
        │
        ▼  (plain serializable props)
  <Board initialColumns={...} initialTasksByColumn={...} />
        │
        ▼  (client — hydrates local state from initialData)
  useBoard({ initialColumns, initialTasksByColumn })
        │
        ├── mutations: fetch('/api/tasks', ...) — client-side only
        └── optimistic updates → rollback on error
```

### 8. Project structure

```
/
├── app/
│   ├── page.tsx              # Server Component — fetches columns + tasks, renders <Board />
│   ├── layout.tsx            # Server Component — root layout with AntdRegistryWrapper
│   └── api/
│       ├── columns/
│       │   ├── route.ts      # GET /api/columns
│       │   └── [id]/
│       │       └── route.ts  # PATCH /api/columns/:id, DELETE → 405
│       └── tasks/
│           ├── route.ts      # GET /api/tasks?columnId, POST /api/tasks
│           └── [id]/
│               └── route.ts  # GET, PATCH, DELETE /api/tasks/:id
├── components/
│   ├── Board/
│   │   ├── Board.tsx         # "use client" — DndContext, top-level state via useBoard()
│   │   └── Board.module.css
│   ├── Column/
│   │   ├── Column.tsx        # "use client" — SortableContext, Add Task button
│   │   └── Column.module.css
│   ├── TaskCard/
│   │   ├── TaskCard.tsx      # "use client" — useSortable, move dropdown, delete
│   │   └── TaskCard.module.css
│   └── TaskModal/
│       └── TaskModal.tsx     # "use client" — shared create/edit modal
├── hooks/
│   └── useBoard.ts           # "use client" — all board state + mutation logic
├── lib/
│   ├── prisma.ts             # Prisma client singleton
│   ├── types.ts              # Shared types re-exported from @prisma/client + custom shapes
│   ├── column-service.ts     # DB logic for columns (used by API routes + page.tsx)
│   └── task-service.ts       # DB logic for tasks (used by API routes + page.tsx)
├── prisma/
│   ├── schema.prisma
│   └── seed.ts               # Seeds three default columns
├── styles/
│   └── globals.css
├── .env.local                # DATABASE_URL for Neon
├── package.json
└── README.md
```

### 9. State management: `useBoard()` custom hook

**Decision**: A single `useBoard()` custom hook in `hooks/useBoard.ts` owns all board state and all mutation logic. Components are pure renderers — they receive data and callbacks as props and do not know about `fetch`.

**State shape**:
```ts
type BoardState = {
  columns: Column[]
  tasksByColumn: Record<number, Task[]>  // keyed by columnId — O(1) column lookup
}
```

`Record<number, Task[]>` is chosen over a flat `Task[]` because:
- Column renders do a direct key lookup (`tasksByColumn[column.id]`) instead of a `.filter()` on every render
- Optimistic updates are surgical — only the two affected column arrays are touched on a move

**Hook contract**:
```
useBoard({ initialColumns, initialTasksByColumn })
  returns:
    columns, tasksByColumn           — render data
    createTask(columnId, title, description?)
    updateTask(taskId, patch)
    moveTask(taskId, fromColumnId, toColumnId)
    deleteTask(taskId, columnId)
    modalState, openCreateModal(columnId), openEditModal(task), closeModal()
```

**Mutation pattern** — every mutation follows the same three steps:
1. Snapshot current state (for rollback)
2. Apply optimistic update to local state immediately (instant UI)
3. Await API call → on error: restore snapshot and notify user

**Modal state** is co-located in `useBoard()`. A single `<TaskModal>` instance sits at `Board` level, controlled by the hook. `Column` and `TaskCard` only call `openCreateModal` / `openEditModal` — they have no knowledge of modal internals. This avoids 3 separate modal instances and duplicate open/close logic.

**Prop drilling depth**: `Board → Column → TaskCard` (2 levels). React Context is not needed for this depth.

## Risks / Trade-offs

- **No input validation on API** → Mitigation: Manual checks in route handlers; reject empty titles and invalid column IDs with `400 Bad Request`.
- **Drag-and-drop on mobile** → HTML5 DnD has limited touch support. Mitigation: Provide a "Move to…" dropdown on each card as a fallback for touch devices.
- **Position re-ordering on delete** → Deleting a task in the middle of a column leaves gaps in `position`. Mitigation: After delete, recompute positions for remaining tasks in the same column in the same transaction (handled in `task-service.ts`).
- **Neon cold start latency** → Free-tier Neon databases suspend after inactivity. Mitigation: Server Component fetching keeps the cold-start latency server-side and invisible to the user; subsequent interactions use the warmed connection.
- **Schema changes after initial migration** → Use `npx prisma migrate dev` for any future schema changes; never edit `schema.prisma` without a corresponding migration file.

## Open Questions

- Should column renaming persist across a full DB reset, or should defaults always be restored? → Default: restore defaults on fresh DB.
- Should tasks retain their last `position` when moved to a new column, or always append to the bottom? → Append to bottom (simplest UX).

### 10. Column rename: inline edit, no modal

**Decision**: Column rename is a v1 UI feature implemented as an inline-editable heading inside `Column.tsx`. No modal is used.

**Interaction**:
- Click the column heading (or a pencil icon beside it) → heading becomes a borderless AntD `Input` pre-filled with the current name
- **Enter** or **blur** → confirm: call `renameColumn(columnId, newName)` from `useBoard()`
- **Escape** → cancel: revert to original name, no API call

**Rationale**:
- The spec says "user can rename a column" — a curl-only workflow does not satisfy that
- A modal for a single text field is over-engineered (KISS)
- Inline edit is the established pattern (Trello, Linear, Notion) — lower friction, no context switch
- The interaction stays entirely within `Column.tsx`; `renameColumn` in `useBoard()` follows the same optimistic update → API call → rollback pattern as all other mutations

### 11. Intra-column task reordering

**Decision**: Intra-column task reordering via drag-and-drop is in scope for v1.

**Rationale**:
- The `position` field in the `Task` schema exists precisely for this — without reordering, position is just an append counter and `createdAt` would suffice
- `@dnd-kit/sortable` ships `arrayMove` — the frontend optimistic update is a single utility call, no custom logic
- Backend cost is one new route (`PATCH /api/tasks/reorder`) and one service function (`taskService.reorder`) — a transaction that sets `position = index` for each task ID in the submitted array
- `onDragEnd` branches on whether source and target column are the same; no new DnD setup required

**Route note**: `app/api/tasks/reorder/route.ts` must be a named file (not `[id]`) so Next.js App Router matches it as a static segment before the dynamic `[id]` catch-all.

**Reorder API**:
```
PATCH /api/tasks/reorder
  body: { columnId: number, orderedIds: number[] }
  → taskService.reorder(columnId, orderedIds)
  → prisma.$transaction(orderedIds.map((id, i) =>
      prisma.task.update({ where: { id }, data: { position: i } })
    ))
  → 200 OK
```

### 12. Optimistic updates and error handling

**Decision**: All mutations use optimistic updates with rollback on failure and an AntD `message.error()` toast notification. `createTask` is the single exception — the modal stays open until the API confirms.

**Standard mutation pattern** (move, update, delete, rename, reorder):
1. Snapshot current state
2. Apply optimistic update to local state immediately (instant UI)
3. Await API call → on error: restore snapshot + call `notifyError(action)`

**`notifyError` helper** (private to `useBoard.ts`):
```ts
function notifyError(action: string) {
  message.error(`Failed to ${action}. Please try again.`)
}
// notifyError('move task') → "Failed to move task. Please try again."
// notifyError('rename column') → "Failed to rename column. Please try again."
```
One helper, consistent UX across all mutation error paths. Not exported — internal to the hook.

**`createTask` exception**:
- Modal stays open with a loading state while the API call is in flight (~150–300 ms)
- On success: close modal, card appears at bottom of column
- On failure: show inline AntD `Form` error message inside the modal — user can correct and retry without reopening

**Rationale for the exception**: Create is the only mutation where the user has typed content that would be lost if the modal closes. Keeping it open on failure gives a natural retry path. All other mutations act on existing data that is trivially recoverable.

**No retry buttons, no inline error states on cards** — AntD toast is sufficient for move/delete/rename/reorder failures.

### 13. Service layer: thin route handlers + shared DB logic

**Decision**: All database logic lives in `lib/column-service.ts` and `lib/task-service.ts`. Route handlers only parse requests, validate input, call a service function, and return a response. `page.tsx` calls the same service functions directly.

**Rationale**:
- Without a service layer, `page.tsx` (Thread 1) has no way to call the same data-access logic that route handlers use — it would either duplicate Prisma calls or make loopback HTTP requests to its own API
- Complex operations (delete + reorder positions, create at max position + 1, move + reposition) are DB orchestrations that belong in a testable service function, not inside an HTTP handler
- Route handlers become 4-line shells: parse → validate → call service → respond

**`lib/column-service.ts` public API**:
```
getAll()                     → ColumnWithTaskCount[]
rename(id, name)             → Column | null  (null = not found)
```

**`lib/task-service.ts` public API**:
```
getByColumnId(columnId)      → Task[]
getByColumns(columnIds)      → Record<number, Task[]>  ← used by page.tsx
getById(id)                  → Task | null
create(columnId, title, description?) → Task
update(id, patch)            → Task | null
delete(id)                   → void  (runs delete + reorder in a Prisma transaction)
```

**Error signalling**: Services return `null` for not-found cases (Option B — KISS). Route handlers do a null check and return 404. No custom error classes needed for a two-model API.

**`lib/types.ts`** re-exports Prisma-generated types and defines custom shapes used across all layers:
```ts
export type { Column, Task } from '@prisma/client'
export type ColumnWithTaskCount = Column & { taskCount: number }
export type TasksByColumn = Record<number, Task[]>
```
One definition, imported by services, route handlers, `page.tsx`, `useBoard.ts`, and component prop types.
