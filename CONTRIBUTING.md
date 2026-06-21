# Contributing

Thanks for your interest in improving Floci Dash.

## Setup

```bash
pnpm install
pnpm dev          # backend (tsx watch) + frontend (vite) concurrently
```

You need a running [Floci](https://github.com/hectorvent/floci) instance. Point the dashboard at it via the **Settings** page or the `FLOCI_ENDPOINT` env var.

## Before opening a PR

```bash
pnpm typecheck    # frontend + backend tsc --noEmit
pnpm test         # vitest
pnpm build        # must succeed
```

- Keep PRs focused — one concern per PR.
- Match the surrounding code style; the repo uses Cloudscape components, TanStack Query for server state, and Zustand for client state.
- Add or update tests for behavior changes. Coverage thresholds are enforced in `vitest.config.ts`.
- Integration tests (`src/backend/integration.test.ts`) need a live Floci container and are excluded from the default run.

## Commits

Conventional-commit prefixes (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`) keep history readable.

## Adding a service

Frontend service pages live under `src/frontend/pages/services/` and register in the service registry. Backend routes live under `src/backend/routes/aws/`. See an existing small service (e.g. `kms`) as a template.

## Reporting bugs

Open an issue with steps to reproduce, expected vs actual behavior, and your Floci version.
