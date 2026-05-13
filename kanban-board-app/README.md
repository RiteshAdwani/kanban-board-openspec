# Kanban Board App

A full-stack Kanban board built with **Next.js 16**, **TypeScript**, **Ant Design 6**, **dnd-kit**, and **Prisma** backed by a **Neon (Postgres)** database.

## Features

- Three fixed columns: **Open**, **In Progress**, **Completed**
- Create, edit, and delete tasks
- Inline column rename
- Drag-and-drop task reordering within and between columns
- "Move to…" dropdown as a touch-friendly fallback for drag-and-drop
- Optimistic UI updates with automatic rollback on error
- Server-side initial data load via Next.js Server Components

## Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) Postgres database (free tier works)

## Environment Variables

Create a `.env.local` file in this directory with:

```
DATABASE_URL="postgresql://<user>:<password>@<host>/<database>?sslmode=require"
```

You can copy these details from your Neon project dashboard.

## Setup

```bash
# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev --name init

# Seed the three default columns
npx prisma db seed
```

## Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Building for Production

```bash
npm run build
npm start
```

> The build script automatically runs `prisma migrate deploy` before building.

## Deployment (Vercel + Neon)

1. Create a Neon project and copy the connection string.
2. In your Vercel project settings, add `DATABASE_URL` as an environment variable.
3. Push to GitHub and connect the repo to Vercel — it will build and deploy automatically.

## Tech Stack

| Layer      | Technology                          |
| ---------- | ----------------------------------- |
| Framework  | Next.js 16 (App Router, TypeScript) |
| UI         | Ant Design 6, CSS Modules           |
| DnD        | @dnd-kit                            |
| ORM        | Prisma 7                            |
| Database   | Neon (hosted Postgres)              |
| Deployment | Vercel                              |
