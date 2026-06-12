# Floci Dashboard — Implementation Plan

## Overview

An AWS Console-style web dashboard for Floci, the local AWS emulator. **Everything runs inside Docker containers.** No host machine dependencies beyond Docker itself — no Node.js, no npm, no node_modules on the host.

---

## Docker-First Workflow

**Principle:** The host machine only needs Docker. All development, building, typechecking, and testing happens inside containers.

| Operation | Command | Where it runs |
|-----------|---------|---------------|
| Start dev environment | `npm run docker:dev` | Docker (Floci + Dashboard with hot reload) |
| Typecheck | `npm run docker:typecheck` | Docker (one-off container) |
| Build for production | `npm run docker:build` | Docker (builder stage) |
| Start production | `npm run docker:prod` | Docker (Floci + built Dashboard) |
| Stop everything | `npm run docker:down` | — |

**The host machine never runs `npm install`, `npx tsc`, or `vite` directly.** The `node_modules/` directory does not exist on the host. Everything is containerized.

### Dev Container Architecture

```
docker-compose.dev.yml:
  floci:
    image: ghcr.io/hectorvent/floci:latest
    port 4566 → host:4566
    healthcheck: curl /_floci/health

  dashboard:
    build: { target: dev }
    ports:
      3000 → host:3000  (Hono backend API)
      5173 → host:5173  (Vite dev server + HMR)
    volumes:
      ./src → /app/src           (hot reload source)
      ./vite.config.ts → /app/   (hot reload config)
      /app/node_modules           (anonymous - preserve container deps)
    depends_on: floci (healthy)
```

### Dockerfile Multi-Stage

```
Stage 1: dev    → npm install (all deps), starts npm run dev
Stage 2: builder → npm install, npm run build (frontend + backend)
Stage 3: prod   → npm ci --omit=dev, copies dist/, starts node
```

---

## Why a Backend?

| # | Reason | Detail |
|---|--------|--------|
| 1 | **AWS SDK must live somewhere** | `@aws-sdk/client-*` are Node.js libraries. The backend holds them and calls Floci's emulated AWS APIs. |
| 2 | **Containerizes everything** | AWS SDK, build toolchain, dev server — all in Docker. Host machine stays clean. |
| 3 | **Single API surface for the frontend** | React only calls `fetch("/api/...")`. Backend handles all Floci communication. |

---

## Tech Stack

| Layer | Choice | Runs In |
|-------|--------|---------|
| Language | TypeScript 5.x | Docker |
| UI Framework | React 19 | Docker (dev) / Static (prod) |
| Build Tool | Vite 6 | Docker |
| Design System | Cloudscape Design System 3.x | Docker |
| Routing | React Router 7 (HashRouter) | Docker |
| Data Fetching | TanStack Query 5 | Docker |
| State | Zustand 5 | Docker |
| Backend Runtime | Node.js 22 | Docker |
| Backend Framework | Hono 4 | Docker |
| AWS SDK | @aws-sdk/client-* 3.x | Docker |
| Dev runner | tsx | Docker |
| Container | Docker (multi-stage) | Host (engine) |
| Orchestration | docker-compose | Host (engine) |

---

## Key Packages

```bash
# All installed inside Docker — never on host
# Backend
npm install hono @hono/node-server
# Frontend
npm install react react-dom react-router-dom @tanstack/react-query zustand
npm install @cloudscape-design/components @cloudscape-design/global-styles @cloudscape-design/collection-hooks
# Dev
npm install -D typescript vite @vitejs/plugin-react tsx @types/react @types/react-dom @types/node concurrently
```

---

## Project Structure

```
floci-dashboard/
├── src/
│   ├── frontend/                  ← React SPA
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── index.html
│   │   ├── api/client.ts
│   │   ├── hooks/{useSystem.ts,useService.ts}
│   │   ├── pages/{DashboardHome.tsx,ServicePage.tsx,Settings.tsx}
│   │   ├── components/{AppLayoutShell,ServiceCard,ServiceGrid,ResourceTable,CreateModal,DeleteButton,StatusBadge}
│   │   ├── stores/settings.ts
│   │   └── types/{api.ts,services.ts}
│   └── backend/
│       ├── index.ts
│       ├── clients/{floci.ts,aws.ts}
│       ├── routes/{system.ts,inspection.ts,aws/index.ts}
│       └── types.ts
├── public/favicon.svg
├── Dockerfile          ← Multi-stage: dev, builder, prod
├── docker-compose.dev.yml  ← Dev: Floci + Dashboard with HMR
├── docker-compose.yml      ← Prod: Floci + built Dashboard
├── .dockerignore
├── .gitignore
├── vite.config.ts
├── tsconfig.json
├── tsconfig.backend.json
├── package.json
├── AGENTS.md
└── PLAN.md
```

---

## Configuration Files (all created)

### Dockerfile (multi-stage)
```dockerfile
FROM node:22-alpine AS dev
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]

FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "dist/backend/index.js"]
```

### docker-compose.dev.yml
```yaml
services:
  floci:
    image: ghcr.io/hectorvent/floci:latest
    ports: ["4566:4566"]
    environment:
      - FLOCI_SERVICES=... (all 58)
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4566/_floci/health"]
  dashboard:
    build: { context: ., target: dev }
    ports: ["3000:3000", "5173:5173"]
    environment:
      - FLOCI_URL=http://floci:4566
      - AWS_REGION=us-east-1
    volumes:
      - ./src:/app/src
      - /app/node_modules
    depends_on: { floci: { condition: service_healthy } }
```

### package.json scripts
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "tsx watch src/backend/index.ts",
    "dev:frontend": "vite --host 0.0.0.0",
    "build": "npm run build:frontend && npm run build:backend",
    "build:frontend": "vite build",
    "build:backend": "tsc -p tsconfig.backend.json",
    "typecheck": "tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.backend.json",
    "docker:dev": "docker compose -f docker-compose.dev.yml up --build",
    "docker:dev:bg": "docker compose -f docker-compose.dev.yml up --build -d",
    "docker:down": "docker compose -f docker-compose.dev.yml down",
    "docker:typecheck": "docker compose -f docker-compose.dev.yml run --rm dashboard npm run typecheck",
    "docker:build": "docker compose -f docker-compose.dev.yml run --rm dashboard npm run build",
    "docker:prod": "docker compose up --build",
    "docker:prod:bg": "docker compose up --build -d"
  }
}
```

---

## Backend: Routes

### System Routes (proxy to Floci `/_floci/*`)
| Method | Route | Floci Source |
|--------|-------|-------------|
| GET | `/api/system/health` | `/_floci/health` + `/_floci/info` |
| GET | `/api/system/init` | `/_floci/init` |

### Inspection Routes (proxy to Floci `/_aws/*`)
| Method | Route | Floci Source |
|--------|-------|-------------|
| GET | `/api/inspect/sqs/messages?queueUrl=...` | `/_aws/sqs/messages` |
| GET/DELETE | `/api/inspect/ses` | `/_aws/ses` |
| GET/DELETE | `/api/inspect/sns` | `/_aws/sns` |

### AWS CRUD Routes (per service — standard pattern)
```
GET    /api/aws/{svc}/{resources}        → ListCommand
POST   /api/aws/{svc}/{resources}        → CreateCommand
DELETE /api/aws/{svc}/{resources}/:id    → DeleteCommand
GET    /api/aws/{svc}/{resources}/:id    → DescribeCommand
```

---

## Service Categories

```typescript
export const SERVICE_CATEGORIES: Record<string, string[]> = {
  "Compute":        ["ec2", "lambda", "ecs", "eks", "autoscaling", "codebuild"],
  "Storage":        ["s3", "ecr"],
  "Database":       ["dynamodb", "rds", "neptune", "elasticache"],
  "Networking":     ["elasticloadbalancing", "route53", "cloudfront", "apigateway", "apigatewayv2", "appsync"],
  "Messaging":      ["sqs", "sns", "events", "kinesis", "pipes", "scheduler", "email"],
  "Security":       ["iam", "sts", "cognito-idp", "kms", "secretsmanager", "acm"],
  "Management":     ["cloudformation", "monitoring", "logs", "ssm", "config", "appconfig", "appconfigdata", "cloudtrail", "servicediscovery"],
  "Analytics":      ["athena", "glue", "firehose", "states", "kafka", "es"],
  "ML/AI":          ["bedrock-runtime", "textract", "transcribe"],
  "Billing":        ["ce", "cur", "bcm-data-exports", "pricing", "tagging"],
  "Developer Tools":["codedeploy", "codebuild"],
  "Migration":      ["backup", "transfer"],
};
```

---

## ═══════════════════════════════════════════════════════════
## PROGRESS TRACKER
## ═══════════════════════════════════════════════════════════

### Phase 0: Foundation (shared infrastructure)

| # | Task | Status |
|---|------|--------|
| 0.1 | Create repo + git init | ✅ Done |
| 0.2 | Write PLAN.md | ✅ Done |
| 0.3 | Create package.json with all scripts + dependencies | ✅ Done |
| 0.4 | Create tsconfig.json (frontend) | ✅ Done |
| 0.5 | Create tsconfig.backend.json | ✅ Done |
| 0.6 | Create vite.config.ts | ✅ Done |
| 0.7 | Create .gitignore | ✅ Done |
| 0.8 | Create .dockerignore | ✅ Done |
| 0.9 | Create Dockerfile (multi-stage: dev, builder, prod) | ✅ Done |
| 0.10 | Create docker-compose.yml (production) | ✅ Done |
| 0.11 | Create docker-compose.dev.yml (dev with HMR + volumes) | ✅ Done |
| 0.12 | Create src/backend/clients/floci.ts | ✅ Done |
| 0.13 | Create src/backend/clients/aws.ts (SDK factory) | ✅ Done |
| 0.14 | Create src/backend/index.ts (Hono + CORS + serve-static + serve()) | ✅ Done |
| 0.15 | Create src/backend/types.ts | ✅ Done |
| 0.16 | Implement /api/system/health + /init routes | ✅ Done |
| 0.17 | Implement /api/inspect/* routes (sqs, ses, sns) | ✅ Done |
| 0.18 | Create routes/aws/index.ts (aggregator) | ✅ Done |
| 0.19 | Create src/frontend/main.tsx + index.html | ✅ Done |
| 0.20 | Create src/frontend/App.tsx (HashRouter + QueryClientProvider) | ✅ Done |
| 0.21 | Create AppLayoutShell (Cloudscape SideNavigation) | ✅ Done |
| 0.22 | Create DashboardHome page (service grid) | ✅ Done |
| 0.23 | Create ServicePage.tsx (dynamic per-service page) | ✅ Done |
| 0.24 | Create shared components (ResourceTable, CreateModal, DeleteButton, ServiceCard, ServiceGrid, StatusBadge) | ✅ Done |
| 0.25 | Create frontend api/client.ts + hooks | ✅ Done |
| 0.26 | Create types/services.ts (categories + labels) | ✅ Done |
| 0.27 | Create types/api.ts (API response types) | ✅ Done |
| 0.28 | Create AGENTS.md | ✅ Done |
| 0.29 | Verify: docker build --target dev succeeds | ✅ Done |
| 0.30 | Verify: docker run typecheck PASSES inside container | ✅ Done |
| 0.31 | Verify: docker run build PASSES inside container | ✅ Done |
| 0.32 | Verify: docker build --target builder (production) succeeds | ✅ Done |

### Phase 1: Core Services (6 services — vertical slice each)

#### 1A — S3
| # | Task | Status |
|---|------|--------|
| 1.1 | Backend: GET /api/aws/s3/buckets | ⬜ Todo |
| 1.2 | Backend: POST /api/aws/s3/buckets | ⬜ Todo |
| 1.3 | Backend: DELETE /api/aws/s3/buckets/:name | ⬜ Todo |
| 1.4 | Backend: GET /api/aws/s3/buckets/:name/objects | ⬜ Todo |
| 1.5 | Frontend: S3 buckets show in ServicePage table | ⬜ Todo |
| 1.6 | Frontend: Create bucket modal works | ⬜ Todo |
| 1.7 | Frontend: Delete bucket works | ⬜ Todo |
| 1.8 | Frontend: Object browser | ⬜ Todo |
| 1.9 | Verify: docker:typecheck + docker:build pass | ⬜ Todo |

#### 1B — DynamoDB
| # | Task | Status |
|---|------|--------|
| 2.1-2.10 | Backend + Frontend + Verify | ⬜ Todo |

#### 1C — SQS
| # | Task | Status |
|---|------|--------|
| 3.1-3.10 | Backend + Frontend + Verify | ⬜ Todo |

#### 1D — SNS
| # | Task | Status |
|---|------|--------|
| 4.1-4.9 | Backend + Frontend + Verify | ⬜ Todo |

#### 1E — Lambda
| # | Task | Status |
|---|------|--------|
| 5.1-5.10 | Backend + Frontend + Verify | ⬜ Todo |

#### 1F — IAM
| # | Task | Status |
|---|------|--------|
| 6.1-6.11 | Backend + Frontend + Verify | ⬜ Todo |

### Phase 2-9: Remaining Services

| Phase | Services | Status |
|-------|----------|--------|
| 2 | EC2, ECS, EKS, ECR | ⬜ Todo |
| 3 | RDS, ElastiCache, Neptune | ⬜ Todo |
| 4 | KMS, Secrets Manager, Cognito, ACM | ⬜ Todo |
| 5 | EventBridge, Kinesis, Scheduler/Pipes | ⬜ Todo |
| 6 | CloudFormation, SSM, CloudWatch, Config | ⬜ Todo |
| 7 | Route53, CloudFront, ELB, APIGW, APIGWV2 | ⬜ Todo |
| 8 | Athena, Glue, Firehose, StepFn, MSK, OpenSearch | ⬜ Todo |
| 9 | 19 remaining services (list-only/minimal CRUD) | ⬜ Todo |

### Phase 10: Polish

| # | Task | Status |
|---|------|--------|
| 10.1-10.9 | Dark mode, skeletons, errors, responsive, final docker:prod test | ⬜ Todo |

---

## Conventions

- **Docker-first.** Every operation runs inside a container. Host machine only needs Docker.
- **No Floci changes.** Dashboard uses existing endpoints only.
- **One service at a time.** S3 → DynamoDB → SQS → ...
- **Backend first, verify, then frontend.** Write routes, run docker:typecheck, then build UI.
- **Commits:** Conventional commits.
- **Verify after each service:** `docker:typecheck` must pass before moving to next service.

---

## Development Workflow

```bash
# Start development (Floci + Dashboard with hot reload)
npm run docker:dev

# Run typecheck inside Docker
npm run docker:typecheck

# Build for production inside Docker
npm run docker:build

# Start production
npm run docker:prod

# Stop everything
npm run docker:down
```

No host machine dependencies. No node_modules on host. No npm install on host.
