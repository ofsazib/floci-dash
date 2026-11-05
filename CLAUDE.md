# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

The canonical agent rules live in `AGENTS.md`. They are mandatory: use `make`, update `README.md` and the `PLAN.md` tracker, write tests that keep 100% coverage, and only push when explicitly asked. This file adds only what `AGENTS.md` does not cover.

@AGENTS.md

## Commands

- Run a single test file: `pnpm exec vitest run src/backend/routes/aws/kms.test.ts`
- Run tests matching a name: `pnpm exec vitest run -t "lists keys"`
- Run the fast local gate (typecheck and unit coverage in parallel): `make verify`
- Run integration tests only (starts Floci if needed): `make integration-test`. This targets `http://localhost:$FLOCI_PORT`, which defaults to **9878**, not 4566. Pass `FLOCI_PORT=<port>` if Floci runs elsewhere.
- The Makefile uses `SHELL := /bin/bash`. On Windows, run `make` from Git Bash or WSL.

## Architecture

### Request path

Browser (HashRouter SPA) → `api()` in `src/frontend/lib/client.ts`, which prefixes `/api` and reports errors to a global toast reporter → Hono backend (`src/backend/index.ts`) → Floci.

In dev, Vite (`:5173`) proxies `/api` to the backend on `:3000`. In production, the backend serves `dist/frontend` itself and sets a CSP.

The backend mounts four route groups:

| Mount | File | What it does |
|-------|------|--------------|
| `/api/system` | `routes/system.ts` | Talks to Floci's `/_floci/*` HTTP endpoints through `flociFetch`: health, info, state reset/nuke, endpoint get/set/discover |
| `/api/inspect` | `routes/inspection.ts` | SQS/SES/SNS inspection |
| `/api/active` | `routes/active.ts` | Probes a few services with the SDK to detect which ones have resources |
| `/api/aws/*` | `routes/aws/index.ts` | Aggregates the per-service SDK route files. A service can be split across several files, e.g. `s3.ts`, `s3-config.ts`, `s3-objects.ts` |

The EC2 terminal uses a WebSocket attached to the raw Node HTTP server (`routes/aws/ec2-terminal.ts`), not a Hono route.

### Floci endpoint is mutable runtime state

`src/backend/clients/config.ts` holds the current endpoint as a module-level variable. It starts from `FLOCI_URL`, which is read **at import time**, with `http://localhost:4566` as the fallback. Settings can change it through `PUT /api/system/floci-endpoint`, and `discoverFlociEndpoint()` can probe Docker hostnames to find it.

Because of this, every SDK client must be constructed **per request**:

- Use `create(Ctor, extra?)` or `getAwsConfig()` from `clients/aws.ts`. Credentials are always `test`/`test`.
- S3 clients also need `forcePathStyle: true`.
- Never cache a client at module scope, or endpoint changes made in Settings will not apply.

User-supplied names, keys and JSON go through the helpers in `clients/sanitize.ts`.

### Frontend routing and service keys

- `App.tsx` declares a few hand-built pages (S3, EC2, SQS, SNS, Events, Lambda, CloudWatch, IAM, Secrets Manager, CloudFormation, KMS). Everything else falls through to `/services/:service` → `ServicePage`.
- `ServicePage` looks up `SERVICE_DASHBOARDS[service]` in `pages/serviceRegistry.tsx`, with components in `pages/services/*Dashboard.tsx`. Without an entry, the page shows a "Coming soon" state.
- The `:service` key must be **Floci's service key**, as returned in `/_floci/health` `services`. Examples: `email` for SES, `logs`, `monitoring`, `states`, `elasticloadbalancing`, `es`, `cognito-idp`. It is not a friendly name.
- The same key must be consistent across `SERVICE_DASHBOARDS`, `SERVICE_CATEGORIES`, `SERVICE_CATEGORY_MAP` and `SERVICE_LABELS` in `types/services.ts`. A mismatch silently hides the dashboard or its status badge. Commit 9db8d0e fixed exactly this bug.
- Data access goes through TanStack Query hooks in `hooks/use{Service}.ts`. Client state such as settings and favorites lives in Zustand stores in `stores/`.

### Testing infrastructure

- Vitest uses `globals: true`, the `forks` pool capped at `maxWorkers: 4`, and the `node` environment by default. Frontend tests opt into DOM with `// @vitest-environment happy-dom`.
- `src/test/helpers.tsx` provides:
  - `createWrapper()`: a QueryClient with retry off
  - `clickButton()`: needed because Cloudscape buttons render nested spans that break `getByRole`
  - `createFrontendMocks()`
  - `createCommandMock()`
  - `createRouteHelpers(router)`: calls a Hono router directly with `router.request`, no server
- `src/backend/integration.test.ts` is the only test that needs a live Floci. `make test` and `make test-cov` exclude it.
- **Thresholds differ from the docs.** `AGENTS.md` and `README.md` say 100%, but `vitest.config.ts` actually enforces 99.9% for statements, functions and lines, and 99% for branches. It also excludes a list of JSX-heavy dashboards in `pages/services/` from coverage. The real target is still 100% on what you touch, and `codecov.yml` enforces 100% on patches. Do not add files to the exclude list or lower thresholds to get a run passing.
