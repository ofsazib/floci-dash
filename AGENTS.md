# Agent Instructions — Floci Dashboard

## Project

Floci Dashboard is a Dockerized, full-stack web app providing an AWS Console-style UI for the Floci local AWS emulator.

- **Frontend:** React 19 + Cloudscape Design System + TanStack Query + React Router (HashRouter)
- **Backend:** Node.js 22 + Hono + @aws-sdk/client-* (all AWS SDK calls go through the backend, never the browser)
- **Infra:** Single Docker container, docker-compose pairs with Floci on port 4566

## Architecture Rules

1. **Zero Floci changes.** Dashboard uses only Floci's existing APIs.
2. **AWS SDK lives in the backend only.** The browser never imports @aws-sdk/client-*.
3. **Frontend calls /api/* routes on the dashboard backend.** Backend proxies to Floci or uses AWS SDK.
4. **Service-based vertical slices.** Each AWS service (S3, DynamoDB, etc.) gets its own backend route file.
5. **Shared frontend components.** ServicePage.tsx, ResourceTable, CreateModal, DeleteButton are reused across all 58 services.

## Code Structure

```
src/
  frontend/          React SPA (Vite, port 5173 dev)
    components/      Shared UI (AppLayoutShell, ServiceCard, ResourceTable, etc.)
    pages/           Routes (DashboardHome, ServicePage, Settings)
    hooks/           TanStack Query hooks
    api/client.ts    fetch wrapper to /api/*
  backend/           Node.js + Hono (port 3000)
    clients/         floci.ts (HTTP proxy), aws.ts (SDK factory)
    routes/          system.ts, inspection.ts, aws/*.ts
```

## Commands

- `npm run dev` — Start both frontend (Vite :5173) and backend (tsx :3000)
- `npm run build` — Build frontend (vite) + backend (tsc) into dist/
- `npm run typecheck` — TypeScript check both frontend and backend
- `npm start` — Production start (node dist/backend/index.js)

## Adding a New Service

1. Create `src/backend/routes/aws/{service}.ts` with List/Create/Delete routes
2. Register in `src/backend/routes/aws/index.ts`
3. The frontend ServicePage.tsx handles it automatically

## Conventions

- No Floci changes
- Backend routes first, test with curl, then frontend
- Conventional commits only
- Reuse existing components
