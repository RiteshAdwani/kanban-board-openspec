## 1. Project Scaffolding

- [x] 1.1 Bootstrap a Next.js app with TypeScript: `npx create-next-app@latest --typescript`
- [x] 1.2 Install runtime dependencies: `@ant-design/cssinjs`, `antd`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@prisma/client`
- [x] 1.3 Install dev dependencies: `prisma`
- [x] 1.4 Create directory structure: `app/api/`, `components/`, `lib/`, `styles/`, `prisma/`
- [x] 1.5 Add `.gitignore` excluding `.env.local`, `node_modules/`
- [x] 1.6 Create a root `README.md` with setup, environment variable, and run instructions

## 2. Database Layer (Prisma + Neon)

- [x] 2.1 Initialise Prisma: `npx prisma init` — creates `prisma/schema.prisma` and `.env`
- [x] 2.2 Set `provider = "postgresql"` in `schema.prisma` and configure `DATABASE_URL` pointing to Neon connection string
- [x] 2.3 Define `Column` model in `schema.prisma` (id, name, position, createdAt)
- [x] 2.4 Define `Task` model in `schema.prisma` (id, columnId FK, title, description, position, createdAt, updatedAt)
- [ ] 2.5 Run `npx prisma migrate dev --name init` to create the initial migration
- [x] 2.6 Create `prisma/seed.ts` — insert the three default columns (Open pos=0, In Progress pos=1, Completed pos=2) if `Column` table is empty
- [ ] 2.7 Add `prisma.seed` config to `package.json` and run `npx prisma db seed`
- [x] 2.8 Create `lib/prisma.ts` — export a Prisma client singleton (guards against multiple instances in Next.js dev hot-reload)

## 3. Service Layer

- [x] 3.1 Create `lib/types.ts` — re-export `Column` and `Task` from `@prisma/client`; define `ColumnWithTaskCount`, `TasksByColumn` as the single source of truth for shared types used across services, route handlers, `page.tsx`, and components
- [x] 3.2 Create `lib/column-service.ts` — implement `getAll(): Promise<ColumnWithTaskCount[]>` (ordered by position, includes task count) and `rename(id, name): Promise<Column | null>` (returns null if not found)
- [x] 3.3 Create `lib/task-service.ts` — implement:
  - `getByColumnId(columnId)` — tasks ordered by position
  - `getByColumns(columnIds)` — returns `TasksByColumn` (used by `page.tsx` for server-side initial load)
  - `getById(id)` — returns `Task | null`
  - `create(columnId, title, description?)` — appends at max position + 1
  - `update(id, patch: { title?, description?, columnId? })` — if columnId changes, appends to bottom of target column; returns `Task | null`
  - `deleteTask(id)` — deletes task and recomputes positions of remaining tasks in the same column inside a single Prisma transaction; returns `void`
  - `reorder(columnId, orderedIds)` — accepts the full new ordered array of task IDs for a column; sets `position = index` for each task in a single Prisma transaction; returns `void`

## 4. Columns API

- [ ] 4.1 Create `app/api/columns/route.ts` with `GET` handler — validate request, call `columnService.getAll()`, return JSON response
- [ ] 4.2 Create `app/api/columns/[id]/route.ts` with `PATCH` handler — validate non-empty `name`, call `columnService.rename(id, name)`, return 404 if null, else return updated column
- [ ] 4.3 Add `DELETE` handler in `app/api/columns/[id]/route.ts` — always return `405 Method Not Allowed`

## 5. Tasks API

- [ ] 5.1 Create `app/api/tasks/route.ts` with `GET` handler — parse `columnId` query param, call `taskService.getByColumnId(columnId)`, return JSON
- [ ] 5.2 Add `POST` handler in `app/api/tasks/route.ts` — validate non-empty `title` and valid `columnId`; call `taskService.create(columnId, title, description)`; return 201 with new task
- [ ] 5.3 Create `app/api/tasks/[id]/route.ts` with `GET` handler — call `taskService.getById(id)`, return 404 if null
- [ ] 5.4 Add `PATCH` handler in `app/api/tasks/[id]/route.ts` — validate non-empty title if provided; call `taskService.update(id, patch)`; return 404 if null, else return updated task
- [ ] 5.5 Add `DELETE` handler in `app/api/tasks/[id]/route.ts` — call `taskService.getById(id)` for existence check (404 if null), then `taskService.deleteTask(id)`; return 204
- [ ] 5.6 Create `app/api/tasks/reorder/route.ts` with `PATCH` handler — validate `columnId` and non-empty `orderedIds` array; call `taskService.reorder(columnId, orderedIds)`; return 200; note: this file must exist as a named route so Next.js does not match "reorder" as a dynamic `[id]`

## 6. App Layout & AntD Setup

- [x] 6.1 Wrap `app/layout.tsx` with AntD `ConfigProvider` — configure theme tokens (colour palette, border radius, font)
- [x] 6.2 Apply `AntdRegistry` from `@ant-design/nextjs-registry` in `layout.tsx` for correct SSR style injection

## 7. Board Page & State Hook

- [x] 7.1 Create `app/page.tsx` as an async Server Component — call `columnService.getAll()` and `taskService.getByColumns()` directly; add `export const dynamic = 'force-dynamic'`; pass `initialColumns` and `initialTasksByColumn` as props to `<Board />`
- [x] 7.2 Create `hooks/useBoard.ts` — owns all board state (`columns`, `tasksByColumn: Record<number, Task[]>`), modal state, and all mutation functions (`createTask`, `updateTask`, `moveTask`, `deleteTask`, `renameColumn`, `reorderTasks`); all mutations except `createTask` follow optimistic update → API call → rollback-on-error + `message.error()` pattern; `reorderTasks` uses `arrayMove` from `@dnd-kit/sortable` for the optimistic state update; include a private `notifyError(action: string)` helper that calls `message.error(`Failed to ${action}. Please try again.`)` — used by all mutation error handlers
- [x] 7.3 Create `components/Board/Board.tsx` — `"use client"`; call `useBoard({ initialColumns, initialTasksByColumn })`; render columns side-by-side in a horizontally scrollable flex container; wrap with `DndContext`; render a single `<TaskModal>` instance controlled by the hook
- [x] 7.4 Create `components/Board/Board.module.css` — flex row layout, `overflow-x: auto`, `min-width` per column, responsive stacking below 768 px

## 8. Column Component

- [ ] 8.1 Create `components/Column/Column.tsx` — render inline-editable column heading (click heading or pencil icon to activate an AntD `Input`; confirm on Enter or blur; cancel on Escape; call `renameColumn` from `useBoard()` on confirm); render task list via `SortableContext`; render "Add Task" button
- [ ] 8.2 Create `components/Column/Column.module.css` — column card styling, header accent, min-width (280 px), full height; heading input styled borderless to match heading size

## 9. Task Card Component

- [ ] 9.1 Create `components/TaskCard/TaskCard.tsx` — render AntD `Card` with title, truncated description (2 lines), edit and delete action icons; wrap with `useSortable` from `@dnd-kit/sortable`
- [ ] 9.2 Create `components/TaskCard/TaskCard.module.css` — card hover elevation transition, description line-clamp
- [ ] 9.3 Add a "Move to…" AntD `Select` dropdown on each card listing the other two columns as a touch-friendly fallback for drag-and-drop

## 10. Task Create / Edit Modal

- [ ] 10.1 Create a shared `TaskModal` component using AntD `Modal` + `Form` — fields: title (required), description (optional textarea)
- [ ] 10.2 Wire "Add Task" button per column to open the modal in create mode with `columnId` preset
- [ ] 10.3 Wire edit icon on task card to open the modal in edit mode pre-filled with existing task data
- [ ] 10.4 On modal submit in **edit mode**: call `updateTask` from `useBoard()` — optimistic update, close modal immediately, rollback + `message.error()` on failure
- [ ] 10.5 On modal submit in **create mode**: call `createTask` from `useBoard()` — keep modal open with a loading state until API responds; on success close modal and add card; on failure show inline AntD `Form` error message without closing the modal

## 11. Drag-and-Drop

- [ ] 11.1 Configure `DndContext` in `Board.tsx` with `onDragEnd` handler
- [ ] 11.2 On `onDragEnd`, branch on source vs. target column:
  - Different columns → call `moveTask(taskId, fromColumnId, toColumnId)` from `useBoard()`
  - Same column → call `reorderTasks(columnId, newOrderedIds)` from `useBoard()`; compute `newOrderedIds` using `arrayMove` from `@dnd-kit/sortable`
- [ ] 11.3 Add `DragOverlay` to render a ghost card while dragging
- [ ] 11.4 Wire up the "Move to…" dropdown fallback: on `Select` change call the same `moveTask()` function from `useBoard()` — no duplicate API logic

## 12. Delete Task

- [ ] 12.1 Wire delete icon on task card to show AntD `Popconfirm` ("Delete this task?")
- [ ] 12.2 On confirm, call `deleteTask(taskId, columnId)` from `useBoard()` — the hook handles the API call and removes the card from local state

## 13. Deployment

- [ ] 13.1 Create a Neon project and database; copy the connection string to Vercel environment variables as `DATABASE_URL`
- [ ] 13.2 Run `npx prisma migrate deploy` as part of the Vercel build step (add to `package.json` build script)
- [ ] 13.3 Push to GitHub and connect the repo to Vercel; verify build and deployment succeed

## 14. Manual Testing & Polish

- [ ] 14.1 Test full CRUD flow for tasks via the UI (create, read, edit, delete)
- [ ] 14.2 Test column inline rename — click heading, type new name, confirm with Enter; verify optimistic update and persistence
- [ ] 14.3 Test column inline rename cancel — press Escape; verify heading reverts to original name without API call
- [ ] 14.4 Test drag-and-drop between all three column combinations
- [ ] 14.5 Test intra-column reorder — drag a task to a new position within the same column; verify order updates immediately and persists after page refresh
- [ ] 14.6 Test "Move to…" dropdown on a simulated touch viewport in browser dev tools
- [ ] 14.7 Test responsive layout at 375 px, 768 px, and 1280 px viewports
- [ ] 14.8 Verify data persists across page refreshes (Neon DB)
- [ ] 14.9 Verify empty-title validation returns 400 for both POST and PATCH task endpoints
- [ ] 14.10 Verify empty-name validation returns 400 for PATCH column endpoint
