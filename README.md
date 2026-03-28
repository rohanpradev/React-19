# Bun + React Lab

This project is a Bun-powered React 19 playground with two main goals:

- demonstrate React 19 features in focused pages
- showcase a full-stack Bun + Drizzle + SQLite table with server-side pagination, sorting, filtering, and search
- keep the shell and build pipeline aligned with current shadcn/ui and Bun full-stack patterns

## Stack

- Bun
- React 19
- React Router
- TanStack Table
- Drizzle ORM
- SQLite via Bun
- shadcn-style UI components
- Temporal via `@js-temporal/polyfill`

## Pages

- `/react-19` - React 19 overview
- `/form-actions` - `useActionState` and `useFormStatus`
- `/actions` - async actions with `startTransition`
- `/optimistic` - `useOptimistic`
- `/react-use` - `use` with Suspense and context
- `/dom-interop` - document metadata, refs, and custom elements
- `/search-debounce` - debounced customer autocomplete with `useDeferredValue`
- `/revenue-ops` - server-side TanStack Table backed by Bun + Drizzle + SQLite

The app shell includes a command palette on `Ctrl/Cmd+K` for navigating demos, docs, and theme actions.

## Prerequisites

- Bun installed locally

## Install

```bash
bun install
```

## Run

```bash
bun dev
```

The app serves the frontend and API from Bun. The default landing page is `/react-19`.

Notable API routes:

- `/api/customers` for the full server-side table payload
- `/api/customers/autocomplete` for lightweight customer search suggestions

## Database Behavior

The app uses a local SQLite database file:

- `mydb.sqlite`
- `mydb.sqlite-shm`
- `mydb.sqlite-wal`

On startup, Bun will:

1. run Drizzle migrations from `./drizzle`
2. seed demo customer data if the database is empty

You do not need to run a separate database process.

## Reset Local State

If you want a clean local run, stop Bun and delete these files from the project root:

- `mydb.sqlite`
- `mydb.sqlite-shm`
- `mydb.sqlite-wal`

The next `bun dev` will recreate the database and seed it again.

## Useful Scripts

```bash
bun dev
bun start
bun run build
bun run db:generate
bun run db:seed
```

## Notes

- The local development path is `bun dev`.
- `bun run build` now bundles the Bun server entrypoint (`src/index.ts`) so the HTML-import frontend and API routes are packaged together.
- Time handling in app code uses `Temporal` through `src/lib/temporal.ts`, which falls back to `@js-temporal/polyfill` when the runtime does not expose `globalThis.Temporal`.
