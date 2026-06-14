<p align="center">
  <img src="public/favicon.svg" width="80" height="80" alt="Floci Dashboard logo" />
</p>

<h1 align="center">Floci Dashboard</h1>

<p align="center">
  <strong>AWS Console-style web UI for <a href="https://github.com/hectorvent/floci">Floci</a> — the local AWS emulator.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Cloudscape_Design-3.x-ff9900?logo=amazon-aws&logoColor=white" alt="Cloudscape" />
  <img src="https://img.shields.io/badge/Hono-4.x-e36002?logo=hono&logoColor=white" alt="Hono" />
  <img src="https://img.shields.io/badge/Docker-ready-2496ed?logo=docker&logoColor=white" alt="Docker" />
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#usage">Usage</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#supported-services">Services</a> •
  <a href="#development">Development</a> •
  <a href="#contributing">Contributing</a>
</p>

---

## Features

- **AWS Console look and feel** — Built with [Cloudscape Design System](https://cloudscape.design/), the same component library used by the real AWS Management Console
- **55+ AWS services** — Full navigation and status for every service Floci supports
- **Deep resource management** — Browse, create, and delete resources for implemented services (S3, DynamoDB, EC2, RDS, SQS, SNS, EventBridge, CloudWatch Logs, CloudWatch Metrics, Lambda, IAM, Secrets Manager)
- **EC2 web terminal** — Interactive bash shell inside running EC2 instances directly from the browser (xterm.js + Docker Engine API with PTY)
- **Dark mode** — Toggle between light and dark themes
- **Real-time health** — Dashboard shows live Floci service status (running/available counts)
- **Zero host dependencies** — Everything runs in Docker, no Node.js or AWS CLI needed locally
- **Single container** — One Docker image for the entire dashboard (React SPA + Node.js API)

## Quick Start

> **Prerequisites:** [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) (or Docker Desktop)

```bash
git clone https://github.com/hectorvent/floci-dashboard.git
cd floci-dashboard
make up-bg
```

Open [http://localhost:9877](http://localhost:9877) — the dashboard connects to Floci automatically.

Floci runs on [http://localhost:9878](http://localhost:9878) (standard LocalStack-compatible endpoint).

That's it. No `npm install`, no `.env` files, no AWS credentials.

## Usage

### Common commands

| Command | Description |
|---------|-------------|
| `make up` | Start Floci + Dashboard (foreground, see logs) |
| `make up-bg` | Start in background |
| `make down` | Stop all containers |
| `make logs` | Tail all logs |
| `make logs-dashboard` | Tail dashboard logs only |
| `make rebuild` | Rebuild dashboard image (after code changes) |
| `make ps` | Show container status |
| `make help` | List all available commands |

### Configurable ports

Override with environment variables:

```bash
FLOCI_PORT=4566 DASHBOARD_PORT=3000 make up-bg
```

| Variable | Default | Description |
|----------|---------|-------------|
| `FLOCI_PORT` | `9878` | Host port for Floci |
| `DASHBOARD_PORT` | `9877` | Host port for Dashboard |

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Browser                        │
│         Floci Dashboard (React SPA)              │
│      Cloudscape Design + TanStack Query          │
└──────────────────┬──────────────────────────────┘
                   │ /api/*
┌──────────────────▼──────────────────────────────┐
│              Dashboard Backend                    │
│           Node.js 22 + Hono (port 3000)          │
│                                                  │
│  /api/system/*   → Floci health/info (HTTP)      │
│  /api/inspect/*  → SQS/SES/SNS inspection        │
│  /api/active     → Resource detection             │
│  /api/aws/*      → AWS SDK calls → Floci         │
│                                                  │
│  Serves built React SPA in production            │
└──────────────────┬──────────────────────────────┘
                   │ AWS SDK / HTTP
┌──────────────────▼──────────────────────────────┐
│              Floci (port 4566)                    │
│          Local AWS services emulator              │
│        ghcr.io/hectorvent/floci:latest           │
└─────────────────────────────────────────────────┘
```

### Key design decisions

- **Backend proxies all AWS calls** — The browser never imports `@aws-sdk/client-*`. All AWS SDK calls go through the Hono backend, which forwards them to Floci.
- **Service-based vertical slices** — Each AWS service has its own backend route file (`src/backend/routes/aws/{service}.ts`) and frontend hooks (`src/frontend/hooks/use{Service}.ts`).
- **Shared components** — `ResourceTable`, `CreateModal`, `DeleteButton`, `ServiceCard`, etc. are reused across all services.
- **Dynamic navigation** — The sidebar is built from Floci's `/_floci/health` API, so it only shows services Floci actually supports.

### Project structure

```
src/
  frontend/                React 19 SPA (Vite)
    components/            Shared UI components
      AppLayoutShell.tsx   Main layout + navigation
      ServiceGrid.tsx      Dashboard home service cards
      ResourceTable.tsx    Generic table with pagination
      CreateModal.tsx      Generic create resource modal
      DeleteButton.tsx     Generic delete with confirmation
      StatCard.tsx         Dashboard stat cards
      StatusBadge.tsx      Service status badges
      DynamoDBTableDetail.tsx  DynamoDB item browser
      S3BucketConfig.tsx   S3 bucket configuration
      EC2Terminal.tsx       EC2 web terminal (xterm.js + WebSocket)
    pages/                 Route pages
      DashboardHome.tsx    Home with stats + service grid
      S3Page.tsx           Dedicated S3 browser
      EC2Page.tsx          EC2 resource manager + terminal
      SQSPage.tsx          SQS queue manager
      SNSPage.tsx          SNS topic manager
      EventsPage.tsx       EventBridge manager
      LambdaPage.tsx       Lambda functions, layers, invoke, versions/aliases
      CloudWatchPage.tsx   CloudWatch metrics, alarms, statistics
      IAMPage.tsx          IAM users, roles, policies, groups
      SecretsManagerPage.tsx  Secrets Manager secrets, values, versions
      ServicePage.tsx      Dynamic service pages
      Settings.tsx         Dark mode, refresh interval
    hooks/                 TanStack Query hooks
      useS3.ts             S3 operations
      useS3Config.ts       S3 bucket config
      useDynamoDB.ts       DynamoDB operations
      useDynamoDBAdvanced.ts  DynamoDB advanced ops
      useEC2.ts            EC2 operations
      useRDS.ts            RDS operations
      useSQS.ts            SQS operations
      useSNS.ts            SNS operations
      useEvents.ts         EventBridge operations
      useLambda.ts         Lambda operations
      useCloudWatch.ts     CloudWatch metrics + alarms operations
      useIAM.ts            IAM operations
      useSecrets.ts        Secrets Manager operations
      useService.ts        Generic service hook
      useSystem.ts         Health, active services
    lib/                   Utilities
      client.ts            Fetch wrapper
      utils.ts             Helpers
    stores/                Zustand stores
      settings.ts          UI settings
    types/                 TypeScript types
      api.ts               API response types
      services.ts          Service labels + categories

  backend/                 Node.js 22 + Hono
    clients/
      floci.ts             HTTP proxy to Floci
      aws.ts               AWS SDK client factory
    routes/
      system.ts            /api/system/health, /init
      inspection.ts        /api/inspect/sqs, /ses, /sns
      active.ts            /api/active
      aws/
        index.ts           Route aggregator
        s3.ts              S3 bucket CRUD
        s3-objects.ts      S3 object operations
        s3-config.ts       S3 bucket configuration
        dynamodb.ts        DynamoDB table/item CRUD
        dynamodb-advanced.ts  DynamoDB advanced ops
        rds.ts             RDS operations
        ec2.ts             EC2 operations (81 endpoints)
        ec2-terminal.ts    EC2 web terminal (WebSocket + Docker API)
        sqs.ts             SQS operations
        sns.ts             SNS operations
        events.ts          EventBridge operations
        lambda.ts          Lambda operations
        cloudwatch.ts      CloudWatch metrics + alarms operations
        iam.ts             IAM operations
        secretsmanager.ts  Secrets Manager operations
    index.ts               Hono app entry point
    types.ts               Shared backend types
```

## Supported Services

### Fully implemented

These services have full CRUD operations in both backend and frontend:

| Service | Operations |
|---------|------------|
| **S3** | List buckets, create/delete bucket, list objects, upload (multipart), download, delete objects, bucket configuration |
| **DynamoDB** | List tables, create/delete table, scan items, query, filter, put item, delete item |
| **RDS** | List/create/delete/modify/reboot DB instances, list/create/delete DB clusters, list/create/delete parameter groups & cluster parameter groups, view/modify parameters |
| **EC2** | 13 resource types: Instances (run/start/stop/reboot/terminate, **web terminal** via Docker Engine API with PTY), VPCs (CIDR association, endpoints), Subnets, Security Groups (ingress/egress rules), Key Pairs (import), AMIs, Tags, Internet Gateways (attach/detach), Route Tables (routes, subnet association), NAT Gateways, Elastic IPs (associate/disassociate), Launch Templates (versions), Volumes, Regions/AZs, Instance Types, Network Interfaces |
| **SQS** | List queues, create (standard/FIFO, attributes, tags), delete, view messages (via inspection API), send message (single/batch, FIFO group/dedup), delete message, purge queue, get/set attributes, tags CRUD, dead letter source queues |
| **SNS** | List topics, create (standard/FIFO, display name, tags), delete, get/set attributes, subscriptions (subscribe/unsubscribe, 7 protocols), publish message (single, FIFO group/dedup), tags CRUD, platform applications (list, create, delete), platform endpoints (list, create, delete), SMS inbox + push notification inspection viewers |
| **EventBridge** | Event buses (list, create, delete), rules (list, create with schedule/event pattern, delete, enable/disable toggle), targets (add/remove per rule), send events (PutEvents), archives (list, create, delete), replays (list) |
| **CloudWatch Logs** | Log groups (list, create, delete, retention policy), log streams (list, create, delete), log events (live viewer with auto-refresh/auto-scroll/limit selector, put events), subscription filters (list, create, delete), tags CRUD |
| **Lambda** | Functions (list, create with zip/S3 code, delete, get configuration, update config, update code), invoke (sync/async/dry-run with response viewer), versions (list, publish), aliases (list, create, delete), event source mappings (list, delete), layers (list versions, delete), function URL config, concurrency config, tags |
| **CloudWatch** | Metrics (list, put metric data, get statistics with sparkline charts), alarms (list, create with threshold/comparison/statistic, delete, set state OK/ALARM), tags |
| **IAM** | Users (list, create, delete, detail with groups/policies/access keys, create access keys), roles (list, create, delete, detail with trust policy/attached policies/tags), groups (list, create, delete), policies (list by scope, create, delete, detail with version document viewer), instance profiles (list) |
| **Secrets Manager** | Secrets (list, create with value, delete, restore, detail with value reveal/version history), put secret value (new versions), random password generator |

### Navigation + status (55 services)

All services reported by Floci appear in the sidebar with status indicators. Unsupported services show a "Coming soon" placeholder.

<details>
<summary>Full list of navigable services</summary>

**Compute:** EC2, ECS, EKS, Auto Scaling, Lambda
**Storage:** S3, ECR
**Database:** DynamoDB, ElastiCache, Neptune, RDS
**Networking:** API Gateway, API Gateway V2, AppSync, CloudFront, ELB, Route 53
**Messaging:** EventBridge (Events), EventBridge Pipes, EventBridge Scheduler, Kinesis, Kinesis Firehose, SES, SNS, SQS
**Security:** ACM, Cognito, IAM, KMS, Secrets Manager
**Management:** AppConfig, AppConfig Data, CloudFormation, CloudTrail, CloudWatch Logs, CloudWatch Metrics, Config, Service Discovery (Cloud Map), SSM (Systems Manager)
**Analytics:** Athena, Glue, MSK (Kafka), OpenSearch, Step Functions
**ML/AI:** Bedrock Runtime, Textract, Transcribe
**Billing:** BCM Data Exports, Cost Explorer, Cost & Usage Report, Pricing, Resource Groups Tagging
**Developer Tools:** CodeBuild, CodeDeploy
**Migration:** Backup, Transfer Family

</details>

## Development

### With Docker (recommended)

```bash
# Start the stack
make up-bg

# After making code changes, rebuild
make rebuild

# View logs
make logs-dashboard

# Stop
make down
```

### Native (requires Node.js 22+)

```bash
make setup          # install + typecheck
make dev            # start both frontend and backend
make typecheck      # check types
make build          # production build
```

You'll need Floci running separately (e.g., `docker run -p 4566:4566 ghcr.io/hectorvent/floci:latest`).

### Adding a new service

1. Check Floci source for supported operations: `../floci/src/main/java/io/github/hectorvent/floci/services/{service}/`
2. Create backend routes: `src/backend/routes/aws/{service}.ts`
3. Register in `src/backend/routes/aws/index.ts`
4. Create frontend hooks: `src/frontend/hooks/use{Service}.ts`
5. Add component to `src/frontend/pages/ServicePage.tsx`
6. Run `make typecheck` to verify
7. Update PLAN.md tracker

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript 5.x |
| Frontend | React 19, Vite 6 |
| UI Components | Cloudscape Design System 3.x |
| Data Fetching | TanStack Query 5 |
| State | Zustand 5 |
| Routing | React Router 7 (HashRouter) |
| Backend | Hono 4, Node.js 22 |
| AWS SDK | @aws-sdk/client-v3 |
| Infra | Docker, Docker Compose |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `FLOCI_URL` | `http://localhost:4566` | Floci endpoint URL (auto-set in Docker) |
| `AWS_REGION` | `us-east-1` | Default AWS region |
| `PORT` | `3000` | Dashboard backend port (inside container) |
| `NODE_ENV` | `production` | Node environment |
| `FLOCI_PORT` | `9878` | Host port for Floci (docker-compose) |
| `DASHBOARD_PORT` | `9877` | Host port for Dashboard (docker-compose) |

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## Related

- **[Floci](https://github.com/floci-io/floci)** — The local AWS emulator this dashboard manages
- **[Cloudscape Design System](https://cloudscape.design/)** — AWS open-source design system

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
