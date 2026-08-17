# Agent Instructions — Floci Dash

## MANDATORY: Use the Makefile

**Every build, run, stop, and Docker operation MUST use `make` commands.** Never call `docker compose` or `pnpm run` directly for project operations.

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

## MANDATORY: Tests & Codecov Coverage

**Every implementation or fix — new feature, bug fix, or refactor — MUST include tests and MUST keep the repo at 100% coverage on ALL four metrics (statements, branches, functions, lines) before committing.** No change is "done" unless it is fully covered. The gates enforce this: `vitest.config.ts` thresholds are at 100, `codecov.yml` patch target is at 100, and CI runs `make test-cov` + `make test-all-cov`. Never lower a threshold to make a failing run pass — add the missing tests instead.

### Required steps for ANY implementation or fix:

1. **Write backend route tests** (`src/backend/routes/aws/{service}.test.ts`)
   - Mock the AWS SDK client and all command constructors using the `vi.hoisted` + `createCmd` pattern (see `kms.test.ts` or `ecs.test.ts` for reference)
   - Test every endpoint: happy path, empty results, error/400 validation cases
   - Target: **100% coverage on all metrics** for new route files

2. **Write frontend hook tests** (`src/frontend/hooks/use{Service}.test.ts`)
   - Mock `api()` from `../lib/client`
   - Test every query hook: correct URL called, `enabled` gate when param is null
   - Test every mutation hook: correct method/URL/body, invalidation on success
   - Target: **100% coverage on all metrics** for new hook files

3. **Write component/page tests** for non-trivial UI components
   - Use happy-dom environment (`// @vitest-environment happy-dom`)
   - Use `createWrapper()` from test helpers for React Query context
   - Test user flows: render, click, fill forms, verify API calls

4. **Make env-dependent code deterministic** — any `process.env.X` read (especially import-time captures like `const X = process.env.Y || "default"`, and render-time reads in JSX) must be covered in BOTH arms regardless of the ambient shell environment:
   - Use `vi.stubEnv` + `vi.resetModules()` + a dynamic `import()` to re-import the module under each env state (see `src/backend/clients/config.test.ts`, `src/backend/routes/aws/s3.test.ts`, `src/frontend/components/S3BucketConfig.test.tsx`)
   - Always `vi.unstubAllEnvs()` (and `vi.resetModules()`) in `afterEach` so stubs never leak into other tests
   - Never rely on ambient env or cross-test leaks to cover an env branch — `make test-all-cov` sets `FLOCI_URL`, which starves `|| "default"` fallbacks and flakes the 100% gate

5. **Run coverage verification before committing — the full gate:**
   ```bash
   make test-cov      # CI gate: unit suite + coverage, no Floci needed
   make test-all-cov  # full suite + coverage incl. integration (Floci up) — the definitive gate
   ```
   - Verify the run exits 0 and the report shows **100% statements / 100% branches / 100% functions / 100% lines** on **all files**
   - If any file drops below 100% on any metric, add tests or remove dead branches — do not lower thresholds
   - `make typecheck` must also pass

6. **Codecov best practices:**
   - `codecov.yml` enforces a **100% patch target** — new/modified code must be fully covered
   - Test both success AND error branches (e.g., empty arrays, missing params → 400)
   - Cover edge cases: URL encoding, optional params, default values, key-absent data (`|| []`/`|| "—"` falsy arms)
   - Dead code that mirrors a `disabled` prop or a guaranteed-value option list should be removed (with `!` assertions), not tested around
   - Never skip tests to save time — incomplete test coverage is technical debt
   - Prefer many small focused tests over one large test
   - Each test should verify one behavior (`it("does X when Y")`)

### Existing test patterns to follow:

| Pattern | Reference file |
|---------|---------------|
| Backend route mock | `src/backend/routes/aws/kms.test.ts` |
| ECS backend mock (`create()` factory) | `src/backend/routes/aws/ecs.test.ts` |
| Frontend hook test | `src/frontend/hooks/useKMS.test.ts` |
| ServicePage component test | `src/frontend/pages/ServicePage.test.tsx` |

## Project

Floci Dash is a Dockerized, full-stack web app providing an AWS Console-style UI for the Floci local AWS emulator. This project is open source — write code and docs accordingly.

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
| `make test` | Unit tests only (fast, no Floci needed) |
| `make test-cov` | Unit tests + coverage — CI gate, must stay at 100% |
| `make test-all-cov` | Full suite + coverage incl. integration (Floci up) — definitive 100% gate |

## Adding a New Service

1. Consult Floci source: `../floci/src/main/java/io/github/hectorvent/floci/services/{service}/`
2. Create `src/backend/routes/aws/{service}.ts` with List/Create/Delete routes
3. Register in `src/backend/routes/aws/index.ts`
4. Create `src/frontend/hooks/use{Service}.ts` with query/mutation hooks
5. Register the dashboard component in `src/frontend/pages/serviceRegistry.tsx`
6. **Write tests** — backend route tests + frontend hook tests + component tests (see MANDATORY section above)
7. Run `make typecheck` to verify
8. Run `make test-cov` (and `make test-all-cov` with Floci up) — verify **100% coverage on all metrics**
9. Update the tracker in PLAN.md
10. **Update README.md** — add the service to the "Fully implemented" table

## Conventions

- No Floci changes
- Backend routes first, test with curl, then frontend
- Conventional commits only
- Reuse existing components
- Every task in PLAN.md must be tracked and updated
- **Always use `make` commands** for Docker and build operations
- **Always update README.md** after making changes
- **Never push to GitHub unless explicitly instructed** — the agent may commit changes locally (e.g., `git add` + `git commit`) but MUST NOT run `git push` unless the user says "push" or "commit and push"

## MANDATORY: Release Process

When the user asks to release a new version, the agent MUST follow this checklist in order.

### Step 1: Pre-release Verification

Run and verify ALL of these before proceeding:

```bash
# 1. Full test suite (must pass)
npx vitest run
# Verify: all test files pass, 0 failures (integration tests may be skipped if Floci isn't running — that's OK)

# 2. TypeScript typecheck
make typecheck
# Verify: exits with 0, no errors

# 3. Check git status is clean
# All changes must be committed. If there are uncommitted changes, commit them first with an appropriate conventional commit message.
```

### Step 2: Determine Version Bump

**First, check the actual latest published release on GitHub** — do NOT rely on local tags which may be stale:

```bash
# Check the latest release on GitHub
curl -s https://api.github.com/repos/ofsazib/floci-dash/releases/latest | grep '"tag_name"'
```

Then read the commit log since that tag to decide the bump:

```bash
git fetch --tags origin
git log $(git describe --tags --abbrev=0)..HEAD --no-merges --oneline
```

**IMPORTANT:** If local tags don't match GitHub releases, delete stale local tags:
```bash
git tag -d <stale-tag>
```

Version bump rules (semver):
- **Major (X.0.0):** Breaking changes, major UI overhaul, dropping service support
- **Minor (0.X.0):** New features, new services, significant enhancements
- **Patch (0.0.X):** Bug fixes, test improvements, docs, refactors

If the user specifies a version, use it. Otherwise, decide based on the commit log.

### Step 3: Update CHANGELOG.md

Create or update `CHANGELOG.md` with the new version entry. Format:

```markdown
## [VERSION] — YYYY-MM-DD

### Added
- New features and services

### Changed
- Breaking changes and significant modifications

### Fixed
- Bug fixes

### Improved
- Test coverage improvements, refactors, performance
```

Categorize commits by conventional commit prefix:
- `feat:` → Added
- `fix:` → Fixed
- `test:`, `refactor:`, `perf:` → Improved
- `docs:`, `chore:` → Improved (unless significant, then skip)

### Step 4: Bump Version

1. Update `version` in `package.json`:
   ```bash
   # Use node to bump version
   node -e "const p=require('./package.json'); p.version='NEW_VERSION'; require('fs').writeFileSync('package.json', JSON.stringify(p, null, 2) + '\\n')"
   ```
2. Run `pnpm install --no-frozen-lockfile` to update the lockfile
3. Commit: `chore: bump version to NEW_VERSION`

### Step 5: Create and Push Tag

```bash
git tag -a vNEW_VERSION -m "vNEW_VERSION"
git push origin main
git push origin vNEW_VERSION
```

Pushing the `v*` tag triggers the GitHub Actions release workflow (`.github/workflows/release.yml`) which:
1. Runs full test suite with Floci
2. Builds multi-arch Docker images (amd64 + arm64)
3. Pushes to GHCR with semver tags

**IMPORTANT: Only push if the user explicitly says "push" or "release." Always confirm before pushing.**

### Quick Reference

| When user says | Agent does |
|---|---|
| "release a new version" | Steps 1-5 (full release) |
| "prepare a release" | Steps 1-4 (stop before pushing) |
| "what version should we release" | Steps 1-2 (analyze only) |
