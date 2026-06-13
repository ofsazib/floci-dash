# Agent Instructions — Floci Dashboard

## MANDATORY: Use the Makefile

**Every build, run, stop, and Docker operation MUST use `make` commands.** Never call `docker compose` or `npm run` directly for project operations.

| Do | Don't |
|----|-------|
| `make up-bg` | ~~`docker compose up --build -d`~~ |
| `make down` | ~~`docker compose down`~~ |
| `make rebuild` | ~~`docker compose build ... && docker compose up -d`~~ |
| `make logs` | ~~`docker compose logs -f`~~ |
| `make typecheck` (native) | OK for local dev, but `make typecheck-docker` in Docker |
| `make help` | — |

Run `make help` to see all available commands.

## MANDATORY: Update README After Changes

**After implementing any feature, fixing a bug, or making structural changes, the agent MUST update `README.md`** to keep it accurate for open-source users. Specifically:

1. **Supported Services table** — Add new services when fully implemented
2. **Project Structure** — Add new directories/files when created
3. **Features** — Add new user-facing capabilities
4. **Commands** — If new make targets or scripts are added
5. **Environment Variables** — If new env vars are introduced

The README is the first thing users see. Keep it comprehensive, current, and well-formatted.

## MANDATORY: Plan & Tracker

**Every agent MUST follow the implementation plan in `PLAN.md`.**

1. **Read PLAN.md** before starting any work — it contains the full implementation plan with phase-by-phase task breakdown
2. **Check the PROGRESS TRACKER** in PLAN.md to see what's done, in progress, and pending
3. **Update the tracker** when you start a task (Pending -> In Progress) and when you complete it (In Progress -> Done + date)
4. **Never mark a task Done** without running `make typecheck` successfully first
5. **Never skip verification** — each service phase ends with a typecheck + build verification step

The tracker uses these status values: `Done`, `In Progress`, `Pending`, `Blocked`

## Project

Floci Dashboard is a Dockerized, full-stack web app providing an AWS Console-style UI for the Floci local AWS emulator. This project is open source — write code and docs accordingly.

- **Frontend:** React 19 + Cloudscape Design System + TanStack Query + React Router (HashRouter)
- **Backend:** Node.js 22 + Hono + @aws-sdk/client-* (all AWS SDK calls go through the backend, never the browser)
- **Infra:** Single Docker container, docker-compose pairs with Floci on port 4566

## Architecture Rules

1. **Zero Floci changes.** Dashboard uses only Floci's existing APIs. Never edit `../floci`.
2. **AWS SDK lives in the backend only.** The browser never imports @aws-sdk/client-*.
3. **Frontend calls /api/* routes on the dashboard backend.** Backend proxies to Floci or uses AWS SDK.
4. **Service-based vertical slices.** Each AWS service (S3, DynamoDB, etc.) gets its own backend route file.
5. **Shared frontend components.** ServicePage.tsx, ResourceTable, CreateModal, DeleteButton are reused across all services.
6. **Consult Floci source first.** Before implementing any service, check `../floci/src/main/java/io/github/hectorvent/floci/services/{service}/` for supported operations.

## Code Structure

```
src/
  frontend/          React SPA (Vite, port 5173 dev)
    components/      Shared UI (AppLayoutShell, ServiceCard, ResourceTable, etc.)
    pages/           Routes (DashboardHome, S3Page, ServicePage, Settings)
    hooks/           TanStack Query hooks (useS3, useDynamoDB, etc.)
    lib/             client.ts (fetch wrapper), utils.ts
    stores/          Zustand stores (settings)
    types/           api.ts, services.ts
  backend/           Node.js + Hono (port 3000)
    clients/         floci.ts (HTTP proxy), aws.ts (SDK factory)
    routes/          system.ts, inspection.ts, active.ts, aws/*.ts
```

## Commands

All commands use `make`. Run `make help` for the full list.

| Make target | Description |
|-------------|-------------|
| `make up` | Start Floci + Dashboard (foreground) |
| `make up-bg` | Start in background |
| `make down` | Stop all containers |
| `make rebuild` | Rebuild Dashboard image after code changes |
| `make logs` | Tail all logs |
| `make typecheck` | TypeScript check (native) |
| `make typecheck-docker` | TypeScript check (Docker) |
| `make dev` | Native dev (needs Node.js 22+) |
| `make build` | Native production build |

## Adding a New Service

1. Consult Floci source: `../floci/src/main/java/io/github/hectorvent/floci/services/{service}/`
2. Create `src/backend/routes/aws/{service}.ts` with List/Create/Delete routes
3. Register in `src/backend/routes/aws/index.ts`
4. Create `src/frontend/hooks/use{Service}.ts` with query/mutation hooks
5. Add service component to `src/frontend/pages/ServicePage.tsx`
6. Run `make typecheck` to verify
7. Update the tracker in PLAN.md
8. **Update README.md** — add the service to the "Fully implemented" table

## Conventions

- No Floci changes
- Backend routes first, test with curl, then frontend
- Conventional commits only
- Reuse existing components
- Every task in PLAN.md must be tracked and updated
- **Always use `make` commands** for Docker and build operations
- **Always update README.md** after making changes
