# Floci Dashboard — Implementation Plan

## Overview

An AWS Console-style web dashboard for Floci, the local AWS emulator. Runs as a **Docker container** with:
- **Node.js backend** (Hono) — holds the AWS SDK, talks to Floci
- **React frontend** (Cloudscape Design System) — the UI the user sees

**Core principle:** Zero changes to Floci. Uses only Floci's existing endpoints: AWS wire protocol on `:4566` and `/_floci/*` inspection endpoints.

---

## Why a Backend?

| # | Reason | Detail |
|---|--------|--------|
| 1 | **AWS SDK must live somewhere** | `@aws-sdk/client-*` packages are Node.js libraries. They cannot run in a browser. The backend holds them and calls Floci's emulated AWS APIs. |
| 2 | **Containerizes the SDK** | The AWS SDK runs in Docker, not on the host machine. Backend + SDK packaged into the Docker image. |
| 3 | **Single API surface for the frontend** | React only calls `fetch("/api/...")`. The backend handles all Floci communication. The frontend never knows Floci exists. |

```
Browser (React)
   │  fetch("/api/aws/s3/buckets")
   ▼
Dashboard Backend (Node.js + Hono)
   │  s3Client.send(new ListBucketsCommand({}))
   ▼
Floci (port 4566) — emulated AWS S3 API
```

---

## Tech Stack

| Layer | Choice | Purpose |
|-------|--------|---------|
| Language | TypeScript 5.x | Both frontend and backend |
| UI Framework | React 19 | Frontend SPA |
| Build Tool | Vite 6 | Frontend bundling + dev server |
| Design System | Cloudscape Design System 3.x | AWS Console look and feel |
| Routing | React Router 7 (HashRouter) | SPA routing inside Docker |
| Data Fetching | TanStack Query 5 | Auto-refetching, caching, mutations |
| State | Zustand 5 | Dark mode, refresh settings |
| Backend Runtime | Node.js 22 | Server |
| Backend Framework | Hono 4 | Lightweight HTTP server + routing |
| AWS SDK | @aws-sdk/client-* 3.x | AWS API calls to Floci |
| Dev runner | tsx | TypeScript execution for backend |
| Container | Docker | Single image |
| Orchestration | docker-compose | Floci + Dashboard |

---

## Key Packages

```bash
# Backend
npm install hono @aws-sdk/client-s3 @aws-sdk/client-sqs @aws-sdk/client-sns \
  @aws-sdk/client-lambda @aws-sdk/client-dynamodb @aws-sdk/client-iam \
  @aws-sdk/client-sts @aws-sdk/client-kms @aws-sdk/client-secrets-manager \
  @aws-sdk/client-cloudformation @aws-sdk/client-eventbridge @aws-sdk/client-ssm \
  @aws-sdk/client-kinesis @aws-sdk/client-cloudwatch @aws-sdk/client-cloudwatch-logs \
  @aws-sdk/client-ec2 @aws-sdk/client-ecs @aws-sdk/client-ecr \
  @aws-sdk/client-rds @aws-sdk/client-elasticache @aws-sdk/client-neptune \
  @aws-sdk/client-cognito-identity-provider @aws-sdk/client-acm \
  @aws-sdk/client-route53 @aws-sdk/client-cloudfront @aws-sdk/client-apigateway \
  @aws-sdk/client-apigatewayv2 @aws-sdk/client-athena @aws-sdk/client-glue \
  @aws-sdk/client-firehose @aws-sdk/client-sfn @aws-sdk/client-kafka \
  @aws-sdk/client-opensearch @aws-sdk/client-eks @aws-sdk/client-service-discovery \
  @aws-sdk/client-scheduler @aws-sdk/client-pipes @aws-sdk/client-sesv2 \
  @aws-sdk/client-backup @aws-sdk/client-transfer @aws-sdk/client-cloudtrail \
  @aws-sdk/client-appconfig @aws-sdk/client-appconfigdata \
  @aws-sdk/client-bedrock-runtime @aws-sdk/client-textract \
  @aws-sdk/client-transcribe @aws-sdk/client-pricing \
  @aws-sdk/client-cost-explorer @aws-sdk/client-cost-and-usage-report-service \
  @aws-sdk/client-resource-groups-tagging @aws-sdk/client-auto-scaling \
  @aws-sdk/client-codebuild @aws-sdk/client-codedeploy \
  @aws-sdk/client-appsync @aws-sdk/client-config-service

# Frontend
npm install react react-dom react-router-dom @tanstack/react-query zustand
npm install @cloudscape-design/components @cloudscape-design/global-styles \
  @cloudscape-design/collection-hooks

# Dev
npm install -D typescript vite @vitejs/plugin-react tsx @types/react @types/react-dom
```

---

## Project Structure

```
floci-dashboard/
├── src/
│   ├── frontend/                  ← React SPA
│   │   ├── main.tsx               ← Entry: global styles, React render
│   │   ├── App.tsx                ← QueryClientProvider + HashRouter
│   │   ├── api/
│   │   │   └── client.ts          ← fetch wrapper to /api/*
│   │   ├── hooks/
│   │   │   ├── useSystem.ts       ← /api/system/* queries
│   │   │   └── useService.ts      ← /api/aws/{svc}/* queries + mutations
│   │   ├── pages/
│   │   │   ├── DashboardHome.tsx  ← Service grid + stats
│   │   │   ├── ServicePage.tsx    ← Dynamic: renders any service
│   │   │   └── Settings.tsx       ← Config + preferences
│   │   ├── components/
│   │   │   ├── AppLayoutShell.tsx ← Cloudscape AppLayout + SideNavigation
│   │   │   ├── ServiceCard.tsx    ← Single service status card
│   │   │   ├── ServiceGrid.tsx    ← Category-grouped card grid
│   │   │   ├── ResourceTable.tsx  ← Cloudscape Table for resources
│   │   │   ├── CreateModal.tsx    ← Create resource modal form
│   │   │   ├── DeleteButton.tsx   ← Delete with confirmation modal
│   │   │   └── StatusBadge.tsx    ← Version/connection status
│   │   ├── stores/
│   │   │   └── settings.ts        ← Zustand: dark mode, refresh
│   │   └── types/
│   │       ├── api.ts             ← Backend API response types
│   │       └── services.ts        ← Service metadata (categories, labels)
│   │
│   └── backend/                   ← Node.js + Hono
│       ├── index.ts               ← Server entry + serve-static + CORS
│       ├── clients/
│       │   ├── floci.ts           ← fetch("http://floci:4566/...")
│       │   └── aws.ts             ← AWS SDK client factory
│       ├── routes/
│       │   ├── system.ts          ← /api/system/*
│       │   ├── inspection.ts      ← /api/inspect/*
│       │   └── aws/               ← Per-service AWS CRUD routes
│       │       ├── index.ts       ← Route aggregator
│       │       ├── s3.ts
│       │       ├── dynamodb.ts
│       │       ├── sqs.ts
│       │       ├── sns.ts
│       │       ├── lambda.ts
│       │       ├── iam.ts
│       │       ├── ec2.ts
│       │       ├── ecs.ts
│       │       ├── eks.ts
│       │       ├── ecr.ts
│       │       ├── rds.ts
│       │       ├── elasticache.ts
│       │       ├── neptune.ts
│       │       ├── kms.ts
│       │       ├── secretsmanager.ts
│       │       ├── cognito.ts
│       │       ├── acm.ts
│       │       ├── cloudformation.ts
│       │       ├── eventbridge.ts
│       │       ├── ssm.ts
│       │       ├── kinesis.ts
│       │       ├── cloudwatch.ts
│       │       ├── route53.ts
│       │       ├── cloudfront.ts
│       │       ├── elb.ts
│       │       ├── apigateway.ts
│       │       ├── apigatewayv2.ts
│       │       ├── athena.ts
│       │       ├── glue.ts
│       │       ├── firehose.ts
│       │       ├── stepfn.ts
│       │       ├── msk.ts
│       │       ├── opensearch.ts
│       │       ├── ses.ts
│       │       ├── cloudmap.ts
│       │       ├── scheduler.ts
│       │       ├── pipes.ts
│       │       ├── backup.ts
│       │       ├── transfer.ts
│       │       ├── cloudtrail.ts
│       │       ├── appconfig.ts
│       │       ├── bedrock.ts
│       │       ├── textract.ts
│       │       ├── transcribe.ts
│       │       ├── pricing.ts
│       │       ├── ce.ts
│       │       ├── cur.ts
│       │       ├── tagging.ts
│       │       ├── autoscaling.ts
│       │       ├── codebuild.ts
│       │       ├── codedeploy.ts
│       │       ├── appsync.ts
│       │       ├── configservice.ts
│       │       └── sts.ts
│       └── types.ts
│
├── public/
│   └── favicon.svg
├── Dockerfile
├── docker-compose.yml
├── vite.config.ts
├── tsconfig.json
├── tsconfig.backend.json
├── package.json
├── .gitignore
├── AGENTS.md
└── PLAN.md
```

---

## Configuration Files (ready to create)

### package.json

```json
{
  "name": "floci-dashboard",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "tsx watch src/backend/index.ts",
    "dev:frontend": "vite",
    "build": "npm run build:frontend && npm run build:backend",
    "build:frontend": "vite build",
    "build:backend": "tsc -p tsconfig.backend.json",
    "start": "node dist/backend/index.js",
    "typecheck": "tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.backend.json"
  }
}
```

### tsconfig.json (frontend)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src/frontend"]
}
```

### tsconfig.backend.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "dist/backend",
    "rootDir": "src/backend",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/backend"]
}
```

### vite.config.ts

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: "src/frontend",
  build: {
    outDir: "../../dist/frontend",
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
```

### .gitignore

```
node_modules/
dist/
.env
.env.local
*.log
.DS_Store
```

### Dockerfile

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
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

### docker-compose.yml

```yaml
services:
  floci:
    image: ghcr.io/hectorvent/floci:latest
    ports:
      - "4566:4566"
    environment:
      - SERVICES=s3,dynamodb,sqs,sns,lambda,iam,ec2,ecs,eks,ecr,rds,elasticache,neptune,kms,secretsmanager,cloudformation,eventbridge,ssm,kinesis,cloudwatch,cognito,acm,route53,cloudfront,apigateway,apigatewayv2,athena,glue,firehose,stepfunctions,msk,opensearch,ses,cloudmap,scheduler,pipes,backup,transfer,cloudtrail,appconfig,bedrock-runtime,textract,transcribe,pricing,ce,cur,bcm-data-exports,resource-groups-tagging,autoscaling,codebuild,codedeploy,appsync,config,sts

  dashboard:
    build: .
    ports:
      - "3000:3000"
    environment:
      - FLOCI_URL=http://floci:4566
      - AWS_REGION=us-east-1
    depends_on:
      - floci
```

---

## Backend: Server Entry Point

```typescript
// src/backend/index.ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "@hono/node-server/serve-static";
import { readFile } from "node:fs/promises";
import systemRoutes from "./routes/system";
import inspectionRoutes from "./routes/inspection";
import awsRoutes from "./routes/aws/index";

const app = new Hono();

// CORS (dev: Vite on :5173 calls :3000)
app.use("*", cors({ origin: ["http://localhost:5173", "http://localhost:3000"] }));

// Error handling
app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json({ error: err.message || "Internal server error" }, 500);
});

// API routes
app.route("/api/system", systemRoutes);
app.route("/api/inspect", inspectionRoutes);
app.route("/api/aws", awsRoutes);

// Health check for dashboard itself
app.get("/api/healthz", (c) => c.json({ status: "ok" }));

// Production: serve built React SPA
const isProd = process.env.NODE_ENV === "production";
if (isProd) {
  app.use("/*", serveStatic({ root: "./dist/frontend" }));
  // SPA fallback: serve index.html for all non-API routes
  app.get("/*", async (c) => {
    const html = await readFile("./dist/frontend/index.html", "utf-8");
    return c.html(html);
  });
}

export default { port: 3000, fetch: app.fetch };
```

---

## Backend: Clients

### Floci HTTP Client

```typescript
// src/backend/clients/floci.ts
const FLOCI_URL = process.env.FLOCI_URL || "http://localhost:4566";

export async function flociFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${FLOCI_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) throw new Error(`Floci ${res.status}: ${res.statusText}`);
  return res.json();
}
```

### AWS SDK Client Factory

```typescript
// src/backend/clients/aws.ts
import { S3Client } from "@aws-sdk/client-s3";
import { SQSClient } from "@aws-sdk/client-sqs";
import { SNSClient } from "@aws-sdk/client-sns";
import { LambdaClient } from "@aws-sdk/client-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { IAMClient } from "@aws-sdk/client-iam";
import { STSClient } from "@aws-sdk/client-sts";
import { KMSClient } from "@aws-sdk/client-kms";
import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { CloudFormationClient } from "@aws-sdk/client-cloudformation";
import { EventBridgeClient } from "@aws-sdk/client-eventbridge";
import { SSMClient } from "@aws-sdk/client-ssm";
import { KinesisClient } from "@aws-sdk/client-kinesis";
import { CloudWatchClient } from "@aws-sdk/client-cloudwatch";
import { CloudWatchLogsClient } from "@aws-sdk/client-cloudwatch-logs";
import { EC2Client } from "@aws-sdk/client-ec2";
import { ECSClient } from "@aws-sdk/client-ecs";
import { ECRClient } from "@aws-sdk/client-ecr";
import { RDSClient } from "@aws-sdk/client-rds";
import { ElastiCacheClient } from "@aws-sdk/client-elasticache";
import { NeptuneClient } from "@aws-sdk/client-neptune";
import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";
import { ACMClient } from "@aws-sdk/client-acm";
import { Route53Client } from "@aws-sdk/client-route53";
import { CloudFrontClient } from "@aws-sdk/client-cloudfront";
import { APIGatewayClient } from "@aws-sdk/client-apigateway";
import { ApiGatewayV2Client } from "@aws-sdk/client-apigatewayv2";
import { AthenaClient } from "@aws-sdk/client-athena";
import { GlueClient } from "@aws-sdk/client-glue";
import { FirehoseClient } from "@aws-sdk/client-firehose";
import { SFNClient } from "@aws-sdk/client-sfn";
import { KafkaClient } from "@aws-sdk/client-kafka";
import { OpenSearchClient } from "@aws-sdk/client-opensearch";
import { EKSClient } from "@aws-sdk/client-eks";
import { ServiceDiscoveryClient } from "@aws-sdk/client-service-discovery";
import { SchedulerClient } from "@aws-sdk/client-scheduler";
import { PipesClient } from "@aws-sdk/client-pipes";
import { SESv2Client } from "@aws-sdk/client-sesv2";
import { BackupClient } from "@aws-sdk/client-backup";
import { TransferClient } from "@aws-sdk/client-transfer";
import { CloudTrailClient } from "@aws-sdk/client-cloudtrail";
import { AppConfigClient } from "@aws-sdk/client-appconfig";
import { AppConfigDataClient } from "@aws-sdk/client-appconfigdata";
import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { TextractClient } from "@aws-sdk/client-textract";
import { TranscribeClient } from "@aws-sdk/client-transcribe";
import { PricingClient } from "@aws-sdk/client-pricing";
import { CostExplorerClient } from "@aws-sdk/client-cost-explorer";
import { CostAndUsageReportServiceClient } from "@aws-sdk/client-cost-and-usage-report-service";
import { ResourceGroupsTaggingAPIClient } from "@aws-sdk/client-resource-groups-tagging";
import { AutoScalingClient } from "@aws-sdk/client-auto-scaling";
import { CodeBuildClient } from "@aws-sdk/client-codebuild";
import { CodeDeployClient } from "@aws-sdk/client-codedeploy";
import { AppSyncClient } from "@aws-sdk/client-appsync";
import { ConfigServiceClient } from "@aws-sdk/client-config-service";
import { ElasticLoadBalancingV2Client } from "@aws-sdk/client-elastic-load-balancing-v2";

const FLOCI_URL = process.env.FLOCI_URL || "http://localhost:4566";
const REGION = process.env.AWS_REGION || "us-east-1";
const CREDS = { accessKeyId: "test", secretAccessKey: "test" };

function create<T>(Ctor: new (c: any) => T, extra?: any): T {
  return new Ctor({ endpoint: FLOCI_URL, region: REGION, credentials: CREDS, ...extra });
}

export const s3 = create(S3Client, { forcePathStyle: true });
export const sqs = create(SQSClient);
export const sns = create(SNSClient);
export const lambda = create(LambdaClient);
export const dynamodb = create(DynamoDBClient);
export const iam = create(IAMClient);
export const sts = create(STSClient);
export const kms = create(KMSClient);
export const secretsmanager = create(SecretsManagerClient);
export const cloudformation = create(CloudFormationClient);
export const eventbridge = create(EventBridgeClient);
export const ssm = create(SSMClient);
export const kinesis = create(KinesisClient);
export const cloudwatch = create(CloudWatchClient);
export const cloudwatchlogs = create(CloudWatchLogsClient);
export const ec2 = create(EC2Client);
export const ecs = create(ECSClient);
export const ecr = create(ECRClient);
export const rds = create(RDSClient);
export const elasticache = create(ElastiCacheClient);
export const neptune = create(NeptuneClient);
export const cognito = create(CognitoIdentityProviderClient);
export const acm = create(ACMClient);
export const route53 = create(Route53Client);
export const cloudfront = create(CloudFrontClient);
export const apigateway = create(APIGatewayClient);
export const apigatewayv2 = create(ApiGatewayV2Client);
export const athena = create(AthenaClient);
export const glue = create(GlueClient);
export const firehose = create(FirehoseClient);
export const stepfn = create(SFNClient);
export const msk = create(KafkaClient);
export const opensearch = create(OpenSearchClient);
export const eks = create(EKSClient);
export const cloudmap = create(ServiceDiscoveryClient);
export const scheduler = create(SchedulerClient);
export const pipes = create(PipesClient);
export const ses = create(SESv2Client);
export const backup = create(BackupClient);
export const transfer = create(TransferClient);
export const cloudtrail = create(CloudTrailClient);
export const appconfig = create(AppConfigClient);
export const appconfigdata = create(AppConfigDataClient);
export const bedrock = create(BedrockRuntimeClient);
export const textract = create(TextractClient);
export const transcribe = create(TranscribeClient);
export const pricing = create(PricingClient);
export const ce = create(CostExplorerClient);
export const cur = create(CostAndUsageReportServiceClient);
export const tagging = create(ResourceGroupsTaggingAPIClient);
export const autoscaling = create(AutoScalingClient);
export const codebuild = create(CodeBuildClient);
export const codedeploy = create(CodeDeployClient);
export const appsync = create(AppSyncClient);
export const configservice = create(ConfigServiceClient);
export const elb = create(ElasticLoadBalancingV2Client);
```

---

## Backend: API Routes

### System Routes (GET from Floci inspection endpoints)

| Method | Route | Floci Source | Purpose |
|--------|-------|-------------|---------|
| GET | `/api/system/health` | `/_floci/health` + `/_floci/info` | All services + version + running/available count |
| GET | `/api/system/init` | `/_floci/init` | Lifecycle state |

### Inspection Routes (proxy to Floci `/_aws/*`)

| Method | Route | Floci Source |
|--------|-------|-------------|
| GET | `/api/inspect/sqs/messages?queueUrl=...` | `/_aws/sqs/messages` |
| GET | `/api/inspect/ses` | `/_aws/ses` |
| DELETE | `/api/inspect/ses` | `/_aws/ses` |
| GET | `/api/inspect/sns` | `/_aws/sns` |
| DELETE | `/api/inspect/sns` | `/_aws/sns` |

### AWS Resource CRUD — Standard Pattern Per Service

Each service route module follows this pattern:

```
GET    /api/aws/{svc}/{resources}        → ListCommand
POST   /api/aws/{svc}/{resources}        → CreateCommand
DELETE /api/aws/{svc}/{resources}/:id    → DeleteCommand
GET    /api/aws/{svc}/{resources}/:id    → DescribeCommand
```

---

## Backend: Route Example — S3

```typescript
// src/backend/routes/aws/s3.ts
import { Hono } from "hono";
import { s3 } from "../../clients/aws";
import { ListBucketsCommand, CreateBucketCommand, DeleteBucketCommand, ListObjectsCommand } from "@aws-sdk/client-s3";

const router = new Hono();

router.get("/buckets", async (c) => {
  const result = await s3.send(new ListBucketsCommand({}));
  return c.json({ buckets: result.Buckets ?? [] });
});

router.post("/buckets", async (c) => {
  const { name, region } = await c.req.json();
  await s3.send(new CreateBucketCommand({
    Bucket: name,
    ...(region && region !== "us-east-1" ? { CreateBucketConfiguration: { LocationConstraint: region } } : {}),
  }));
  return c.json({ created: true, name }, 201);
});

router.delete("/buckets/:name", async (c) => {
  const name = c.req.param("name");
  await s3.send(new DeleteBucketCommand({ Bucket: name }));
  return c.json({ deleted: true, name });
});

router.get("/buckets/:name/objects", async (c) => {
  const name = c.req.param("name");
  const result = await s3.send(new ListObjectsCommand({ Bucket: name }));
  return c.json({ objects: result.Contents ?? [] });
});

export default router;
```

---

## Backend: Route Aggregator

```typescript
// src/backend/routes/aws/index.ts
import { Hono } from "hono";
import s3Routes from "./s3";
import dynamodbRoutes from "./dynamodb";
// ... import all service routes

const router = new Hono();
router.route("/s3", s3Routes);
router.route("/dynamodb", dynamodbRoutes);
// ... register all services

export default router;
```

---

## Frontend: Key Components

### App.tsx

```typescript
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import AppLayoutShell from "./components/AppLayoutShell";
import DashboardHome from "./pages/DashboardHome";
import ServicePage from "./pages/ServicePage";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <AppLayoutShell>
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/services/:service" element={<ServicePage />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </AppLayoutShell>
      </HashRouter>
    </QueryClientProvider>
  );
}
```

### main.tsx

```typescript
import React from "react";
import ReactDOM from "react-dom/client";
import "@cloudscape-design/global-styles/index.css";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

## Frontend: API Client + Hooks

```typescript
// src/frontend/api/client.ts
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `API ${res.status}`);
  }
  return res.json();
}
```

```typescript
// src/frontend/hooks/useSystem.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";

interface HealthResponse {
  services: Record<string, "running" | "available">;
  edition: string;
  original_edition: string;
  version: string;
  stats: { total: number; running: number; available: number };
}

export function useHealth() {
  return useQuery<HealthResponse>({
    queryKey: ["system", "health"],
    queryFn: () => api("/system/health"),
    refetchInterval: 5000,
  });
}
```

```typescript
// src/frontend/hooks/useService.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";

export function useServiceList<T>(service: string, key: string) {
  return useQuery<T>({
    queryKey: ["aws", service, key],
    queryFn: () => api(`/aws/${service}/${key}`),
    refetchInterval: 10000,
  });
}

export function useServiceMutation(service: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ method, path, body }: { method: string; path: string; body?: any }) =>
      api(`/aws/${service}${path}`, { method, body: body ? JSON.stringify(body) : undefined }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", service] }),
  });
}
```

---

## Service Categories (cross-referenced against Floci ResolvedServiceCatalog)

```typescript
// src/frontend/types/services.ts
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

export const SERVICE_LABELS: Record<string, string> = {
  "s3": "S3",
  "sqs": "SQS",
  "sns": "SNS",
  "lambda": "Lambda",
  "dynamodb": "DynamoDB",
  "iam": "IAM",
  "sts": "STS",
  "kms": "KMS",
  "secretsmanager": "Secrets Manager",
  "cloudformation": "CloudFormation",
  "events": "EventBridge",
  "ssm": "Systems Manager",
  "kinesis": "Kinesis",
  "logs": "CloudWatch Logs",
  "monitoring": "CloudWatch Metrics",
  "ec2": "EC2",
  "ecs": "ECS",
  "ecr": "ECR",
  "rds": "RDS",
  "elasticache": "ElastiCache",
  "cognito-idp": "Cognito",
  "acm": "ACM",
  "route53": "Route 53",
  "cloudfront": "CloudFront",
  "apigateway": "API Gateway",
  "apigatewayv2": "API Gateway V2",
  "athena": "Athena",
  "glue": "Glue",
  "firehose": "Kinesis Firehose",
  "states": "Step Functions",
  "kafka": "MSK",
  "es": "OpenSearch",
  "servicediscovery": "Cloud Map",
  "scheduler": "EventBridge Scheduler",
  "pipes": "EventBridge Pipes",
  "email": "SES",
  "elasticloadbalancing": "ELB",
  "neptune": "Neptune",
  "codebuild": "CodeBuild",
  "codedeploy": "CodeDeploy",
  "eks": "EKS",
  "backup": "Backup",
  "transfer": "Transfer Family",
  "cloudtrail": "CloudTrail",
  "appconfig": "AppConfig",
  "appconfigdata": "AppConfig Data",
  "bedrock-runtime": "Bedrock Runtime",
  "textract": "Textract",
  "transcribe": "Transcribe",
  "pricing": "Pricing",
  "ce": "Cost Explorer",
  "cur": "Cost & Usage Report",
  "bcm-data-exports": "BCM Data Exports",
  "tagging": "Resource Groups Tagging",
  "config": "Config",
  "autoscaling": "Auto Scaling",
  "appsync": "AppSync",
  "ec2messages": "EC2 Messages",
};

// Maps Floci's externalKey (from /_floci/health) to display label
export function getServiceLabel(externalKey: string): string {
  return SERVICE_LABELS[externalKey] ?? externalKey;
}
```

---

## ═══════════════════════════════════════════════════════════
## PROGRESS TRACKER
## ═══════════════════════════════════════════════════════════

### Phase 0: Foundation (shared infrastructure)

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 0.1 | Create repo + git init | — | ✅ Done |
| 0.2 | Write PLAN.md | PLAN.md | ✅ Done |
| 0.3 | Create package.json with all scripts | package.json | ⬜ Todo |
| 0.4 | Create tsconfig.json (frontend) | tsconfig.json | ⬜ Todo |
| 0.5 | Create tsconfig.backend.json | tsconfig.backend.json | ⬜ Todo |
| 0.6 | Create vite.config.ts | vite.config.ts | ⬜ Todo |
| 0.7 | Create .gitignore | .gitignore | ⬜ Todo |
| 0.8 | Create Dockerfile | Dockerfile | ⬜ Todo |
| 0.9 | Create docker-compose.yml | docker-compose.yml | ⬜ Todo |
| 0.10 | Install all npm dependencies (backend + frontend) | — | ⬜ Todo |
| 0.11 | Create src/backend/clients/floci.ts | clients/floci.ts | ⬜ Todo |
| 0.12 | Create src/backend/clients/aws.ts (all 55+ SDK clients) | clients/aws.ts | ⬜ Todo |
| 0.13 | Create src/backend/index.ts (Hono + CORS + serve-static) | index.ts | ⬜ Todo |
| 0.14 | Create src/backend/types.ts (shared types) | types.ts | ⬜ Todo |
| 0.15 | Implement /api/system/health route | routes/system.ts | ⬜ Todo |
| 0.16 | Implement /api/system/init route | routes/system.ts | ⬜ Todo |
| 0.17 | Implement /api/inspect/* routes (sqs, ses, sns) | routes/inspection.ts | ⬜ Todo |
| 0.18 | Create routes/aws/index.ts (aggregator) | routes/aws/index.ts | ⬜ Todo |
| 0.19 | Create src/frontend/main.tsx + index.html | main.tsx | ⬜ Todo |
| 0.20 | Create src/frontend/App.tsx (router + providers) | App.tsx | ⬜ Todo |
| 0.21 | Create AppLayoutShell (Cloudscape SideNavigation) | AppLayoutShell.tsx | ⬜ Todo |
| 0.22 | Create DashboardHome page (service grid) | DashboardHome.tsx | ⬜ Todo |
| 0.23 | Create ServicePage.tsx (dynamic per-service page) | ServicePage.tsx | ⬜ Todo |
| 0.24 | Create shared components (ResourceTable, CreateModal, DeleteButton) | components/*.tsx | ⬜ Todo |
| 0.25 | Create frontend api/client.ts + hooks | api/client.ts, hooks/*.ts | ⬜ Todo |
| 0.26 | Create types/services.ts (categories + labels) | types/services.ts | ⬜ Todo |
| 0.27 | Create types/api.ts (API response types) | types/api.ts | ⬜ Todo |
| 0.28 | Create AGENTS.md (agent instructions) | AGENTS.md | ⬜ Todo |
| 0.29 | Run typecheck: `npm run typecheck` | — | ⬜ Todo |
| 0.30 | Run build: `npm run build` | — | ⬜ Todo |
| 0.31 | Verify: docker-compose up → dashboard loads → health shows services | — | ⬜ Todo |

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
| 1.8 | Frontend: Object browser (list objects in bucket) | ⬜ Todo |
| 1.9 | Test: create → list → delete bucket via dashboard UI | ⬜ Todo |

#### 1B — DynamoDB
| # | Task | Status |
|---|------|--------|
| 2.1 | Backend: GET /api/aws/dynamodb/tables | ⬜ Todo |
| 2.2 | Backend: POST /api/aws/dynamodb/tables | ⬜ Todo |
| 2.3 | Backend: DELETE /api/aws/dynamodb/tables/:name | ⬜ Todo |
| 2.4 | Backend: GET /api/aws/dynamodb/tables/:name | ⬜ Todo |
| 2.5 | Backend: POST /api/aws/dynamodb/tables/:name/scan | ⬜ Todo |
| 2.6 | Frontend: Tables show in ServicePage | ⬜ Todo |
| 2.7 | Frontend: Create table modal (name + key schema + attributes) | ⬜ Todo |
| 2.8 | Frontend: Delete table works | ⬜ Todo |
| 2.9 | Frontend: Table detail view + scan results | ⬜ Todo |
| 2.10 | Test: create → describe → scan → delete via dashboard | ⬜ Todo |

#### 1C — SQS
| # | Task | Status |
|---|------|--------|
| 3.1 | Backend: GET /api/aws/sqs/queues | ⬜ Todo |
| 3.2 | Backend: POST /api/aws/sqs/queues | ⬜ Todo |
| 3.3 | Backend: DELETE /api/aws/sqs/queues (body: {queueUrl}) | ⬜ Todo |
| 3.4 | Backend: GET /api/aws/sqs/queues/attributes?url=... | ⬜ Todo |
| 3.5 | Frontend: Queues show in table | ⬜ Todo |
| 3.6 | Frontend: Create queue modal | ⬜ Todo |
| 3.7 | Frontend: Delete queue works | ⬜ Todo |
| 3.8 | Frontend: Queue detail + message peek | ⬜ Todo |
| 3.9 | Frontend: Send message form | ⬜ Todo |
| 3.10 | Test: create → send → peek → purge → delete | ⬜ Todo |

#### 1D — SNS
| # | Task | Status |
|---|------|--------|
| 4.1 | Backend: GET /api/aws/sns/topics | ⬜ Todo |
| 4.2 | Backend: POST /api/aws/sns/topics | ⬜ Todo |
| 4.3 | Backend: DELETE /api/aws/sns/topics/:arn | ⬜ Todo |
| 4.4 | Backend: GET /api/aws/sns/topics/:arn | ⬜ Todo |
| 4.5 | Frontend: Topics show in table | ⬜ Todo |
| 4.6 | Frontend: Create topic modal | ⬜ Todo |
| 4.7 | Frontend: Delete topic works | ⬜ Todo |
| 4.8 | Frontend: Topic detail view | ⬜ Todo |
| 4.9 | Test: create → list → delete topic | ⬜ Todo |

#### 1E — Lambda
| # | Task | Status |
|---|------|--------|
| 5.1 | Backend: GET /api/aws/lambda/functions | ⬜ Todo |
| 5.2 | Backend: POST /api/aws/lambda/functions | ⬜ Todo |
| 5.3 | Backend: DELETE /api/aws/lambda/functions/:name | ⬜ Todo |
| 5.4 | Backend: GET /api/aws/lambda/functions/:name | ⬜ Todo |
| 5.5 | Backend: POST /api/aws/lambda/functions/:name/invoke | ⬜ Todo |
| 5.6 | Frontend: Functions show in table | ⬜ Todo |
| 5.7 | Frontend: Create function form | ⬜ Todo |
| 5.8 | Frontend: Delete function works | ⬜ Todo |
| 5.9 | Frontend: Invoke with payload editor | ⬜ Todo |
| 5.10 | Test: create → invoke → delete | ⬜ Todo |

#### 1F — IAM
| # | Task | Status |
|---|------|--------|
| 6.1 | Backend: GET /api/aws/iam/users | ⬜ Todo |
| 6.2 | Backend: POST /api/aws/iam/users | ⬜ Todo |
| 6.3 | Backend: DELETE /api/aws/iam/users/:name | ⬜ Todo |
| 6.4 | Backend: GET /api/aws/iam/roles | ⬜ Todo |
| 6.5 | Backend: POST /api/aws/iam/roles | ⬜ Todo |
| 6.6 | Backend: DELETE /api/aws/iam/roles/:name | ⬜ Todo |
| 6.7 | Frontend: Users table | ⬜ Todo |
| 6.8 | Frontend: Roles table | ⬜ Todo |
| 6.9 | Frontend: Create user/role modals | ⬜ Todo |
| 6.10 | Frontend: Delete user/role works | ⬜ Todo |
| 6.11 | Test: create → list → delete user and role | ⬜ Todo |

### Phase 2: Compute Services (4 services)

#### 2A — EC2
| # | Task | Status |
|---|------|--------|
| 7.1-7.7 | Backend + Frontend + Test (DescribeInstances, RunInstances, TerminateInstances) | ⬜ Todo |

#### 2B — ECS
| # | Task | Status |
|---|------|--------|
| 8.1-8.7 | Backend + Frontend + Test (ListClusters, CreateCluster, DeleteCluster) | ⬜ Todo |

#### 2C — EKS
| # | Task | Status |
|---|------|--------|
| 9.1-9.7 | Backend + Frontend + Test (ListClusters, CreateCluster, DeleteCluster) | ⬜ Todo |

#### 2D — ECR
| # | Task | Status |
|---|------|--------|
| 10.1-10.7 | Backend + Frontend + Test (DescribeRepositories, CreateRepository, DeleteRepository) | ⬜ Todo |

### Phase 3: Data Services (3 services)

| # | Service | Summary | Status |
|---|---------|---------|--------|
| 11 | RDS | List/Create/Delete DB instances | ⬜ Todo |
| 12 | ElastiCache | List/Create/Delete cache clusters | ⬜ Todo |
| 13 | Neptune | List/Create/Delete DB clusters | ⬜ Todo |

### Phase 4: Security Services (4 services)

| # | Service | Summary | Status |
|---|---------|---------|--------|
| 14 | KMS | List/Create/Describe/Disable keys | ⬜ Todo |
| 15 | Secrets Manager | List/Create/Delete/Describe secrets | ⬜ Todo |
| 16 | Cognito | List/Create/Delete user pools + list users | ⬜ Todo |
| 17 | ACM | List/Request/Delete certificates | ⬜ Todo |

### Phase 5: Messaging Services (3 services)

| # | Service | Summary | Status |
|---|---------|---------|--------|
| 18 | EventBridge | List/Create/Delete buses + rules | ⬜ Todo |
| 19 | Kinesis | List/Create/Delete/Describe streams | ⬜ Todo |
| 20 | Scheduler + Pipes | List schedules and pipes | ⬜ Todo |

### Phase 6: Infrastructure Services (4 services)

| # | Service | Summary | Status |
|---|---------|---------|--------|
| 21 | CloudFormation | List/Create/Delete stacks + events | ⬜ Todo |
| 22 | SSM | List/Create/Delete/Get parameters | ⬜ Todo |
| 23 | CloudWatch | Log groups + streams + events viewer | ⬜ Todo |
| 24 | Config | List config rules | ⬜ Todo |

### Phase 7: Network Services (5 services)

| # | Service | Summary | Status |
|---|---------|---------|--------|
| 25 | Route53 | List/Create/Delete zones + records | ⬜ Todo |
| 26 | CloudFront | List/Create/Delete distributions | ⬜ Todo |
| 27 | ELB | List/Create/Delete load balancers | ⬜ Todo |
| 28 | API Gateway | List/Create/Delete REST APIs | ⬜ Todo |
| 29 | API Gateway V2 | List/Create/Delete HTTP APIs + routes | ⬜ Todo |

### Phase 8: Analytics Services (6 services)

| # | Service | Summary | Status |
|---|---------|---------|--------|
| 30 | Athena | List workgroups + databases | ⬜ Todo |
| 31 | Glue | List databases + tables | ⬜ Todo |
| 32 | Firehose | List/Create/Delete delivery streams | ⬜ Todo |
| 33 | Step Functions | List/Create/Delete state machines | ⬜ Todo |
| 34 | MSK | List/Create/Delete clusters | ⬜ Todo |
| 35 | OpenSearch | List/Create/Delete domains | ⬜ Todo |

### Phase 9: Remaining Services (18 services — list-only or minimal CRUD)

| # | Service (Floci key) | Backend Route | Frontend | Status |
|---|---------------------|--------------|----------|--------|
| 36 | sts | GET caller identity | Info card | ⬜ Todo |
| 37 | codebuild | GET projects | Table | ⬜ Todo |
| 38 | codedeploy | GET applications | Table | ⬜ Todo |
| 39 | backup | GET backup plans | Table | ⬜ Todo |
| 40 | transfer | GET servers | Table | ⬜ Todo |
| 41 | appsync | GET graphql APIs | Table | ⬜ Todo |
| 42 | autoscaling | GET auto scaling groups | Table | ⬜ Todo |
| 43 | bedrock-runtime | GET models | Table | ⬜ Todo |
| 44 | textract | GET (placeholder) | Status card | ⬜ Todo |
| 45 | transcribe | GET (placeholder) | Status card | ⬜ Todo |
| 46 | cloudtrail | GET trails | Table | ⬜ Todo |
| 47 | email (ses) | (uses inspection routes) | Table + inspect | ⬜ Todo |
| 48 | pricing | GET services | Table | ⬜ Todo |
| 49 | ce | GET (placeholder) | Status card | ⬜ Todo |
| 50 | cur | GET (placeholder) | Status card | ⬜ Todo |
| 51 | bcm-data-exports | GET (placeholder) | Status card | ⬜ Todo |
| 52 | tagging | GET tag mappings | Table | ⬜ Todo |
| 53 | cloudmap | GET namespaces | Table | ⬜ Todo |
| 54 | appconfig | GET applications | Table | ⬜ Todo |
| 55 | appconfigdata | GET (placeholder) | Status card | ⬜ Todo |
| 56 | ec2messages | GET (placeholder) | Status card | ⬜ Todo |
| 57 | configservice | GET config rules (already in Phase 6) | — | ⬜ Todo |

### Phase 10: Polish

| # | Task | Status |
|---|------|--------|
| 60.1 | Dark mode toggle (Zustand store + Cloudscape `applyMode`) | ⬜ Todo |
| 60.2 | Auto-refresh interval control (dropdown: 5s, 10s, 30s, off) | ⬜ Todo |
| 60.3 | JSON raw response viewer (Cloudscape CodeEditor readonly) | ⬜ Todo |
| 60.4 | Loading skeletons (Cloudscape `Skeleton`) for all pages | ⬜ Todo |
| 60.5 | Error boundaries + empty states with guidance | ⬜ Todo |
| 60.6 | Responsive layout pass (Cloudscape handles most, verify) | ⬜ Todo |
| 60.7 | Keyboard shortcut: Ctrl+K command palette search | ⬜ Todo |
| 60.8 | Final docker-compose up → full end-to-end smoke test (all services) | ⬜ Todo |
| 60.9 | Final typecheck + build pass | ⬜ Todo |

---

## Conventions

- **No Floci changes.** Dashboard uses existing endpoints only.
- **One service at a time.** Complete S3 end-to-end, mark it done, then DynamoDB.
- **Backend first, then frontend.** Write routes, test with curl, then build UI.
- **Shared components.** `ServicePage.tsx`, `ResourceTable`, `CreateModal`, `DeleteButton` are reused across all 55+ services.
- **Cross-service reuse is encouraged.** If S3 and DynamoDB both need a similar pattern, extract it.
- **Commits:** Conventional (`feat(s3): add bucket CRUD routes`, `feat(dynamodb): add table listing`).
- **Docker-friendly.** All config via environment variables (`FLOCI_URL`, `AWS_REGION`).

---

## Completion Path Summary

```
Phase 0  (Foundation)      → 31 tasks — shared infra, must complete first
Phase 1  (Core: 6 svcs)    → S3 → DynamoDB → SQS → SNS → Lambda → IAM
Phase 2  (Compute: 4)      → EC2 → ECS → EKS → ECR
Phase 3  (Data: 3)         → RDS → ElastiCache → Neptune
Phase 4  (Security: 4)     → KMS → SecretsManager → Cognito → ACM
Phase 5  (Messaging: 3)    → EventBridge → Kinesis → Scheduler/Pipes
Phase 6  (Infra: 4)        → CloudFormation → SSM → CloudWatch → Config
Phase 7  (Network: 5)      → Route53 → CloudFront → ELB → APIGW → APIGWV2
Phase 8  (Analytics: 6)    → Athena → Glue → Firehose → StepFn → MSK → OpenSearch
Phase 9  (Remaining: 19)   → Lighter services, list-only views
Phase 10 (Polish: 9)       → Dark mode, skeletons, errors, final test
Total: ~260 tasks across 10 phases, covering all 58 Floci services
```

At any point, the progress tracker shows exactly what's done ✅ and what's left ⬜.
