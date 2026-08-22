# Floci Dash — Implementation Plan

## Overview

An AWS Console-style web dashboard for Floci, the local AWS emulator. The dashboard provides a polished, production-grade management UI that mirrors the real AWS Console experience — allowing users to manage all 66 AWS services that Floci emulates, including resource CRUD operations, detailed views, filtering, search, and real-time status monitoring.

**Everything runs inside Docker containers.** No host machine dependencies beyond Docker itself.

---

## Current State Summary

### What's Done (Phase 0 + 2 Service Pages)

| Area | Status | Details |
|------|--------|---------|
| Project scaffolding | Done | Docker multi-stage, docker-compose, vite, tsconfig |
| Backend framework | Done | Hono + CORS + serve-static + SDK factory |
| System routes | Done | `/api/system/health`, `/api/system/init` |
| Inspection routes | Done | `/api/inspect/sqs/messages`, `/api/inspect/ses`, `/api/inspect/sns` |
| Active services route | Done | `/api/active` (checks S3 + DynamoDB for resources) |
| S3 backend | Done | Full CRUD + config (versioning, tags, policy, lifecycle, CORS, website, encryption, notifications, public access, logging, object tags, object attributes, head) |
| S3 frontend | Done | Dedicated S3Page with bucket list, object browser, upload, detail view, bucket config tabs (11 tabs), object tags editor |
| DynamoDB backend | Done | Full CRUD + advanced (UpdateItem, BatchGet/Write, Transactions, TTL, Tags, Continuous Backups, PartiQL, GSIs/LSIs) |
| DynamoDB frontend | Done | ServicePage: table list, detail, items, filter, put item, Advanced tab (GSIs, TTL, Tags, Backups, PartiQL, Batch ops) |
| Shared components | Done | ResourceTable, CreateModal, DeleteButton, ServiceCard, ServiceGrid, StatCard, StatusBadge |
| Layout | Done | AppLayoutShell with TopNavigation, SideNavigation, dark mode |
| Settings | Done | Dark mode toggle, refresh interval |
| 66 services implemented — all Floci services covered! | ServicePage: browse, create, delete | 66 of 66 Floci services covered |

### Architecture Constraints

1. **Zero Floci changes.** Dashboard uses only Floci's existing APIs.
2. **AWS SDK lives in the backend only.** The browser never imports `@aws-sdk/client-*`.
3. **Frontend calls `/api/*` routes on the dashboard backend.**
4. **Service-based vertical slices.** Each AWS service gets its own backend route file.
5. **Shared frontend components.** ResourceTable, CreateModal, DeleteButton, StatCard are reused across all services.

---

## Docker-First Workflow

**Principle:** The host machine only needs Docker. All development, building, typechecking, and testing happens inside containers.

| Operation | Command | Where it runs |
|-----------|---------|---------------|
| Start dev environment | `pnpm run dev` or `npm run docker:dev` | Docker (Floci + Dashboard with hot reload) |
| Typecheck | `pnpm run typecheck` or `npm run docker:typecheck` | Docker (one-off container) |
| Build for production | `pnpm run build` or `npm run docker:build` | Docker (builder stage) |
| Start production | `npm run docker:prod` | Docker (Floci + built Dashboard) |
| Stop everything | `npm run docker:down` | — |

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Language | TypeScript 5.x |
| UI Framework | React 19 |
| Build Tool | Vite 6 |
| Design System | Cloudscape Design System 3.x |
| Routing | React Router 7 (HashRouter) |
| Data Fetching | TanStack Query 5 |
| State | Zustand 5 |
| Backend Runtime | Node.js 22 |
| Backend Framework | Hono 4 |
| AWS SDK | @aws-sdk/client-* 3.x |
| Dev Runner | tsx |
| Container | Docker (multi-stage) |

---

## Project Structure

```
floci-dash/
├── src/
│   ├── frontend/                  <- React SPA
│   │   ├── main.tsx               <- Entry point
│   │   ├── App.tsx                <- HashRouter + routes
│   │   ├── lib/
│   │   │   ├── client.ts          <- fetch wrapper to /api/*
│   │   │   └── utils.ts           <- formatBytes, formatItemValue
│   │   ├── hooks/
│   │   │   ├── useSystem.ts       <- Health, init, active
│   │   │   ├── useS3.ts           <- S3 query/mutation hooks
│   │   │   ├── useS3Config.ts     <- S3 config hooks (versioning, tags, policy, lifecycle, etc.)
│   │   │   ├── useDynamoDB.ts     <- DynamoDB query/mutation hooks
│   │   │   └── useDynamoDBAdvanced.ts <- DynamoDB advanced hooks (UpdateItem, Batch, TTL, etc.)
│   │   ├── pages/
│   │   │   ├── DashboardHome.tsx  <- Home with stats + service grid
│   │   │   ├── S3Page.tsx         <- Dedicated S3 page
│   │   │   ├── ServicePage.tsx    <- Dynamic per-service page (DynamoDB implemented)
│   │   │   └── Settings.tsx       <- Dark mode, refresh interval
│   │   ├── components/
│   │   │   ├── AppLayoutShell.tsx <- TopNavigation + AppLayout + SideNavigation
│   │   │   ├── ResourceTable.tsx  <- Reusable table with filter/search/create/delete
│   │   │   ├── CreateModal.tsx    <- Generic create form modal
│   │   │   ├── DeleteButton.tsx   <- Delete with confirmation modal
│   │   │   ├── ServiceCard.tsx    <- Service card for grid
│   │   │   ├── ServiceGrid.tsx    <- Category-grouped service cards
│   │   │   ├── StatCard.tsx       <- Stat display card
│   │   │   ├── StatusBadge.tsx    <- Running/available/error badge
│   │   │   ├── S3BucketConfig.tsx <- S3 bucket config tabs (11 tabs)
│   │   │   ├── PropertyTable.tsx  <- Reusable key-value detail table (horizontal/grid/compact, href support)
│   │   │   ├── ServiceDashboardLayout.tsx <- Unified tab navigation wrapper with loading/error/empty states
│   │   │   └── DynamoDBAdvanced.tsx <- DynamoDB advanced features (GSIs, TTL, Tags, PartiQL)
│   │   ├── stores/
│   │   │   └── settings.ts        <- Zustand: darkMode, refreshInterval
│   │   └── types/
│   │       ├── api.ts             <- API response types
│   │       └── services.ts        <- SERVICE_CATEGORIES, SERVICE_LABELS
│   └── backend/
│       ├── index.ts               <- Hono app + CORS + static + routes
│       ├── clients/
│       │   ├── floci.ts           <- HTTP proxy to Floci
│       │   └── aws.ts             <- AWS SDK config factory
│       ├── routes/
│       │   ├── system.ts          <- /api/system/health, /api/system/init
│       │   ├── inspection.ts      <- /api/inspect/sqs, ses, sns
│       │   ├── active.ts          <- /api/active
│       │   └── aws/
│       │       ├── index.ts       <- Aggregator (registers all service routers)
│       │       ├── s3.ts          <- S3 CRUD routes
│       │       └── dynamodb.ts    <- DynamoDB CRUD routes
│       └── types.ts               <- Shared backend types
├── public/favicon.svg
├── Dockerfile
├── docker-compose.dev.yml
├── docker-compose.yml
├── vite.config.ts
├── tsconfig.json
├── tsconfig.backend.json
├── package.json
├── AGENTS.md
└── PLAN.md
```

---

## Floci Repo Reference

**Location:** `../floci` (sibling to this dashboard repo).

### Lookup Protocol (do this BEFORE writing code for a service)

1. **Identify the service package.** `cd ../floci/src/main/java/io/github/hectorvent/floci/services/{service}`
2. **Confirm the supported operations.** Grep for `*Command`/`*Request` handler classes.
3. **Check request/response shapes.** Read handler input validation + response builder.
4. **Find realistic data shapes.** `../floci/compatibility-tests/` contains real request/response examples.

### Ground Rules

- **Zero Floci changes.** Never edit `../floci` to make the dashboard work.
- **Dashboard adapts to Floci.** Backend route shape follows what Floci accepts.
- **SDK parity.** Use the same `@aws-sdk/client-*` (v3) packages.
- **One source of truth.** If Floci and the AWS docs disagree, Floci wins.

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

## UI/UX Design Specification

### Design Principles

1. **AWS Console fidelity.** The dashboard should feel like the real AWS Console — same patterns, same layout conventions, same interaction flows. Users familiar with AWS should feel instantly at home.
2. **Progressive disclosure.** Start with a clean overview, reveal detail on drill-down. Never overload the user with all options at once.
3. **Consistent patterns.** Every service page follows the same structure: breadcrumbs -> header with status -> stat cards -> tabs -> resource table.
4. **Dark mode first.** Default to dark mode (matching Cloudscape's dark theme), with light mode as a toggle option.
5. **Zero learning curve.** Icons, labels, and flows should match AWS Console conventions.

### Page Hierarchy

```
/                              -> Dashboard Home
/services/s3                   -> S3 (dedicated page with buckets + objects)
/services/dynamodb             -> DynamoDB (tables + items)
/services/:service             -> Generic service page (per-service UI)
/settings                      -> Settings (dark mode, refresh, about)
```

### Page Layouts

#### 1. Dashboard Home (`/`)

```
+------------------------------------------------------------------+
| [Floci Logo]  Floci          [Dark Mode] [Settings]               |
+----------+-------------------------------------------------------+
|          |  Floci Dash                          Connected v1  |
| Nav      |                                                        |
| ------   |  [Available] [Active] [Running] [Edition]              |
| Dashboard|                                                        |
| ------   |  Services                                              |
| Compute  |  +----------+ +----------+ +----------+ +----------+   |
|  EC2     |  | S3       | | DynamoDB | | SQS      | | SNS      |   |
|  Lambda  |  +----------+ +----------+ +----------+ +----------+   |
|  ECS     |  +----------+ +----------+ +----------+ +----------+   |
| Storage  |  | Lambda   | | IAM      | | KMS      | | Secrets  |   |
|  S3      |  +----------+ +----------+ +----------+ +----------+   |
|  ECR     |  ... (grouped by category, scrollable)                  |
| Database |                                                        |
|  DynamoDB|                                                        |
|  ...     |                                                        |
+----------+-------------------------------------------------------+
```

#### 2. Service Page Pattern (generic)

```
+------------------------------------------------------------------+
| [Floci Logo]  Floci          [Dark Mode] [Settings]               |
+----------+-------------------------------------------------------+
|          |  Dashboard > ServiceName                    [Running]   |
| Nav      |                                                        |
| ------   |  [Stat 1] [Stat 2] [Stat 3] [Stat 4]                  |
|          |                                                        |
|          |  [Resources Tab] [Details Tab] [Activity Tab]           |
|          |                                                        |
|          |  Resources (12)                     [Create] [Refresh] |
|          |  [Search/filter box]                                   |
|          |  +--------------------------------------------------+ |
|          |  | Name         | Status    | Created    | Actions | |
|          |  |--------------|-----------|------------|---------| |
|          |  | my-resource  | Active    | 2h ago     | [X]     | |
|          |  | other-res    | Active    | 1d ago     | [X]     | |
|          |  +--------------------------------------------------+ |
+----------+-------------------------------------------------------+
```

#### 3. S3 Page (dedicated)

```
+------------------------------------------------------------------+
| [Floci Logo]  Floci          [Dark Mode] [Settings]               |
+----------+-------------------------------------------------------+
|          |  Dashboard > S3                            [Running]    |
| Nav      |                                                        |
|          |  [Buckets Tab] [Overview Tab]                            |
|          |                                                        |
|          |  Buckets (5)                         [Create Bucket]    |
|          |  [Find buckets...]                                     |
|          |  +--------------------------------------------------+ |
|          |  | Name         | Created         | Actions          | |
|          |  |--------------|-----------------|------------------| |
|          |  | my-bucket    | Jan 15, 2025    | [X]              | |
|          |  +--------------------------------------------------+ |
|          |                                                        |
|          |  (click bucket -> object browser)                       |
|          |  (click object -> object detail with download)          |
+----------+-------------------------------------------------------+
```

### Component Design System

| Component | Purpose | Used By |
|-----------|---------|---------|
| `AppLayoutShell` | Top nav + side nav + content area | All pages |
| `ServiceGrid` | Category-grouped service cards | DashboardHome |
| `ServiceCard` | Clickable card with status dot | ServiceGrid |
| `StatCard` | Metric display with icon + subtext | All service pages |
| `ResourceTable` | Table with search/filter/create/delete | All service pages |
| `CreateModal` | Form modal for creating resources | All service pages |
| `DeleteButton` | Delete with confirmation modal | All service pages |
| `StatusBadge` | Running/available/error indicator | All service pages |
| `PropertyTable` | Reusable key-value detail table with 3 variants + href support | EC2Page, RDSDashboard |
| `ServiceDashboardLayout` | Unified tab navigation wrapper with loading/error/empty state handling | RDSDashboard, ECSDashboard, Route53Dashboard, SSMDashboard |

### Interaction Patterns

- **Navigation:** Side nav groups services by category. Active service highlighted.
- **Breadcrumb navigation:** Dashboard > Service > Resource > Detail
- **Create flow:** Click "Create" button -> modal form -> submit -> table refreshes
- **Delete flow:** Click delete icon -> confirmation modal -> confirm -> table refreshes
- **Search/filter:** Text filter above every table, with count of matches
- **Drill-down:** Click resource name -> detail view with back navigation
- **Refresh:** Auto-refresh via TanStack Query refetchInterval, manual refresh button
- **Empty states:** Helpful messages with call-to-action when no resources exist
- **Error states:** Inline error indicators, never crashes or blank screens
- **Loading states:** Spinner + loading text, never layout shift

### Dark Mode Implementation

- Cloudscape's `awsui-dark-mode` CSS class on `<body>` and `<html>`
- Custom StatCard/ServiceCard colors work in both modes
- Toggle stored in Zustand, persisted across sessions (localStorage via `stores/settings.ts`, with tests)

---

## Adding a New Service

### Backend Route Pattern

Each service follows this standard pattern in `src/backend/routes/aws/{service}.ts`:

```typescript
// 1. Import AWS SDK client + commands
// 2. Create Hono router
// 3. Define CRUD routes:
//    GET    /{resources}          -> List
//    POST   /{resources}          -> Create
//    DELETE /{resources}/:id      -> Delete
//    GET    /{resources}/:id      -> Describe
// 4. Register in aws/index.ts
```

### Frontend Hook Pattern

Each service gets hooks in `src/frontend/hooks/use{Service}.ts`:

```typescript
// 1. Export TypeScript interfaces for API responses
// 2. Export useQuery hooks for reads (list, describe)
// 3. Export useMutation hooks for writes (create, delete)
// 4. Use TanStack Query invalidation for cache updates
```

### Frontend Page Pattern

Services use the generic `ServicePage.tsx` which routes to service-specific sub-components:

```typescript
// In ServiceResourceList:
if (service === "dynamodb") return <DynamoDBTables />;
if (service === "sqs") return <SQSQueues />;
// etc.
```

### Implementation Checklist (per service)

1. Consult Floci source to confirm supported operations
2. Install `@aws-sdk/client-{service}` if not already present
3. Create backend route file with CRUD endpoints
4. Register route in `aws/index.ts`
5. Create frontend hooks file
6. Add service-specific component to ServicePage.tsx
7. Test: `pnpm run typecheck`
8. Test: `pnpm run build`

---

## Per-Service Feature Specifications

> **Source of truth:** These specs are derived from auditing every Floci service handler in `../floci/src/main/java/io/github/hectorvent/floci/services/`. Only operations Floci actually implements are listed. If Floci and AWS docs disagree, Floci wins.

### Legend

| UI Feature | Meaning |
|------------|---------|
| **List** | Resource table with search/filter |
| **Create** | Create modal/form |
| **Delete** | Delete with confirmation |
| **Detail** | Drill-down detail view |
| **Edit/Update** | Edit form or inline edit |
| **Actions** | Service-specific actions (start/stop, invoke, send, etc.) |

---

### EC2 (81 operations — 12 resource types)

| Resource Type | Floci Operations | Dashboard UI Features |
|---------------|------------------|----------------------|
| **Instances** | RunInstances, DescribeInstances, TerminateInstances, StartInstances, StopInstances, RebootInstances, DescribeInstanceStatus, DescribeInstanceAttribute, ModifyInstanceAttribute, DescribeIamInstanceProfileAssociations | List, Create (image, type, key, subnet, tags), Detail (full instance info), Start/Stop/Reboot/Terminate actions, Attribute viewer |
| **VPCs** | CreateVpc, DescribeVpcs, DeleteVpc, ModifyVpcAttribute, DescribeVpcAttribute, CreateDefaultVpc, AssociateVpcCidrBlock, DisassociateVpcCidrBlock, DescribeVpcEndpointServices, CreateVpcEndpoint, DescribeVpcEndpoints, DeleteVpcEndpoints | List, Create (CIDR, tags), Detail, Delete, Attribute editor, CIDR association, VPC endpoints |
| **Subnets** | CreateSubnet, DescribeSubnets, DeleteSubnet, ModifySubnetAttribute | List, Create (VPC, CIDR, AZ), Detail, Delete, Attribute toggle |
| **Security Groups** | CreateSecurityGroup, DescribeSecurityGroups, DeleteSecurityGroup, AuthorizeSecurityGroupIngress/Egress, RevokeSecurityGroupIngress/Egress, DescribeSecurityGroupRules, ModifySecurityGroupRules | List, Create (name, desc, VPC), Detail (inbound/outbound rules), Delete, Add/Revoke rules |
| **Key Pairs** | CreateKeyPair, DescribeKeyPairs, DeleteKeyPair, ImportKeyPair | List, Create (download .pem), Import (public key), Delete |
| **AMIs** | DescribeImages (catalog-based) | List (from catalog), Detail, Filter by architecture/type |
| **Tags** | CreateTags, DeleteTags, DescribeTags | Tag editor on any EC2 resource, Cross-resource tag search |
| **Internet Gateways** | CreateInternetGateway, DescribeInternetGateways, DeleteInternetGateway, AttachInternetGateway, DetachInternetGateway | List, Create, Attach/Detach to VPC, Delete |
| **Route Tables** | CreateRouteTable, DescribeRouteTables, DeleteRouteTable, AssociateRouteTable, DisassociateRouteTable, CreateRoute, DeleteRoute | List, Create (VPC), Detail (routes + associations), Create/Delete routes, Associate to subnet |
| **NAT Gateways** | CreateNatGateway, DescribeNatGateways, DeleteNatGateway | List, Create (subnet, EIP), Detail, Delete |
| **Elastic IPs** | AllocateAddress, DescribeAddresses, ReleaseAddress, AssociateAddress, DisassociateAddress, DescribeAddressesAttribute | List, Allocate, Associate to instance, Disassociate, Release |
| **Launch Templates** | CreateLaunchTemplate, CreateLaunchTemplateVersion, DescribeLaunchTemplates, DescribeLaunchTemplateVersions, ModifyLaunchTemplate, DeleteLaunchTemplate | List, Create (image, type, key, user data), Version browser, Set default version, Delete |
| **Volumes** | CreateVolume, DescribeVolumes, DeleteVolume | List, Create (AZ, size, type), Detail, Delete |
| **Regions/AZ** | DescribeRegions, DescribeAvailabilityZones, DescribeAccountAttributes | Info display only |
| **Instance Types** | DescribeInstanceTypes, DescribeInstanceTypeOfferings | Info display (8 types: t2/t3/t4g/m5) |
| **Network Interfaces** | DescribeNetworkInterfaces | List (derived from instances), Detail |

---

### SQS (23 operations)

| Resource Type | Floci Operations | Dashboard UI Features |
|---------------|------------------|----------------------|
| **Queues** | CreateQueue, DeleteQueue, ListQueues, GetQueueUrl, GetQueueAttributes, SetQueueAttributes, TagQueue, UntagQueue, ListQueueTags, PurgeQueue | List with search/filter, Create (name, FIFO toggle, attributes, tags), Detail (attributes, stats, ARN), Edit attributes, Purge, Delete |
| **Messages** | SendMessage, SendMessageBatch, ReceiveMessage, DeleteMessage, DeleteMessageBatch, ChangeMessageVisibility, ChangeMessageVisibilityBatch | Message viewer (via inspection API `/_aws/sqs/messages`), Send message modal (body, delay, group ID, dedup ID), Batch send, Delete, Change visibility |
| **DLQ/Redrive** | ListDeadLetterSourceQueues, StartMessageMoveTask, ListMessageMoveTasks, CancelMessageMoveTask | DLQ source display, Start/cancel move task, Task status monitor |
| **Permissions** | AddPermission, RemovePermission | Permission list, Add/remove permission statements |

---

### SNS (27 operations)

| Resource Type | Floci Operations | Dashboard UI Features |
|---------------|------------------|----------------------|
| **Topics** | CreateTopic, DeleteTopic, ListTopics, GetTopicAttributes, SetTopicAttributes | List, Create (name, FIFO, attributes, tags), Detail (attrs, subscription counts), Edit attributes, Delete |
| **Subscriptions** | Subscribe, Unsubscribe, ListSubscriptions, ListSubscriptionsByTopic, GetSubscriptionAttributes, SetSubscriptionAttributes, ConfirmSubscription | List (all + per-topic), Create (protocol, endpoint, filter policy), Detail (attributes, status), Confirm pending, Delete |
| **Publish** | Publish, PublishBatch | Publish message modal (topic, subject, body, attributes, FIFO group/dedup), Batch publish |
| **Platform Apps** | CreatePlatformApplication, DeletePlatformApplication, ListPlatformApplications, GetPlatformApplicationAttributes, SetPlatformApplicationAttributes | List, Create (name, platform: APNS/GCM/FCM), Detail, Edit, Delete |
| **Platform Endpoints** | CreatePlatformEndpoint, DeleteEndpoint, ListEndpointsByPlatformApplication, GetEndpointAttributes, SetEndpointAttributes | List (per app), Create (token, custom data), Detail, Edit, Delete |
| **Tags** | TagResource, UntagResource, ListTagsForResource | Tag editor on topics |
| **Inspection** | GET/DELETE `/_aws/sns` (SMS), GET/DELETE `/_aws/sns/push-notifications` | SMS inbox viewer, Push notification viewer, Clear |

---

### Lambda (44 operations)

| Resource Type | Floci Operations | Dashboard UI Features |
|---------------|------------------|----------------------|
| **Functions** | CreateFunction, GetFunction, ListFunctions, GetFunctionConfiguration, UpdateFunctionConfiguration, UpdateFunctionCode, DeleteFunction | List, Create (name, runtime, handler, code zip/S3/image, env vars, timeout, memory), Detail (config + code location), Edit config, Update code, Delete |
| **Invocation** | Invoke (sync/async/dry-run) | Invoke modal (payload JSON, invocation type), Response viewer (status, body, logs) |
| **Event Source Mappings** | CreateEventSourceMapping, GetEventSourceMapping, ListEventSourceMappings, UpdateEventSourceMapping, DeleteEventSourceMapping | List, Create (function, source ARN, batch size), Detail, Edit (batch size, enabled), Enable/disable, Delete |
| **Versions** | PublishVersion, ListVersionsByFunction | Version list, Publish new version |
| **Aliases** | CreateAlias, GetAlias, ListAliases, UpdateAlias, DeleteAlias | List, Create (name, version, routing config), Edit, Delete |
| **Layers** | PublishLayerVersion, GetLayerVersion, ListLayerVersions, DeleteLayerVersion, ListLayers | Layer list, Publish version (zip content), Version browser, Delete |
| **Tags** | ListTags, TagResource, UntagResource | Tag editor on functions |
| **Event Invoke Config** | PutFunctionEventInvokeConfig, UpdateFunctionEventInvokeConfig, GetFunctionEventInvokeConfig, DeleteFunctionEventInvokeConfig, ListFunctionEventInvokeConfigs | Config viewer, Edit (retry, max age, destinations), Delete config |
| **Concurrency** | PutFunctionConcurrency, GetFunctionConcurrency, DeleteFunctionConcurrency | Set/display/delete reserved concurrency |
| **Function URLs** | CreateFunctionUrlConfig, GetFunctionUrlConfig, UpdateFunctionUrlConfig, DeleteFunctionUrlConfig | Create URL (auth type, invoke mode, CORS), Display URL, Edit config, Delete |
| **Resource Policy** | AddPermission, GetPolicy, RemovePermission | Policy viewer, Add/remove permission statements |

---

### IAM (72 operations) + STS (7 operations)

| Resource Type | Floci Operations | Dashboard UI Features |
|---------------|------------------|----------------------|
| **Users** | CreateUser, GetUser, DeleteUser, ListUsers, UpdateUser, TagUser, UntagUser, ListUserTags | List, Create (name, path, tags), Detail, Rename/repath, Tag editor, Delete |
| **Groups** | CreateGroup, GetGroup, DeleteGroup, ListGroups, AddUserToGroup, RemoveUserFromGroup, ListGroupsForUser | List, Create, Detail (members), Add/remove users, Delete |
| **Roles** | CreateRole, GetRole, DeleteRole, ListRoles, UpdateRole, UpdateAssumeRolePolicy, TagRole, UntagRole, ListRoleTags | List, Create (name, trust policy, description), Detail (trust policy), Edit trust policy/description, Tag editor, Delete |
| **Managed Policies** | CreatePolicy, GetPolicy, DeletePolicy, ListPolicies, CreatePolicyVersion, GetPolicyVersion, DeletePolicyVersion, ListPolicyVersions, SetDefaultPolicyVersion, TagPolicy, UntagPolicy, ListPolicyTags | List (scope: All/AWS/Local), Create (JSON document), Detail (versions, attachment count), Version browser, Set default version, Delete |
| **Policy Attachments** | AttachUserPolicy, DetachUserPolicy, ListAttachedUserPolicies, AttachGroupPolicy, DetachGroupPolicy, ListAttachedGroupPolicies, AttachRolePolicy, DetachRolePolicy, ListAttachedRolePolicies | Per-entity attached policies tab, Attach/detach policy |
| **Inline Policies** | PutUserPolicy, GetUserPolicy, DeleteUserPolicy, ListUserPolicies (same for Group, Role) | Per-entity inline policies tab, Create/edit JSON, View, Delete |
| **Access Keys** | CreateAccessKey, DeleteAccessKey, ListAccessKeys, UpdateAccessKey | Per-user keys list, Create (show secret once), Activate/deactivate, Delete |
| **Instance Profiles** | CreateInstanceProfile, GetInstanceProfile, DeleteInstanceProfile, ListInstanceProfiles, AddRoleToInstanceProfile, RemoveRoleFromInstanceProfile, ListInstanceProfilesForRole | List, Create, Detail (roles), Add/remove role, Delete |
| **Permission Boundaries** | PutUserPermissionsBoundary, DeleteUserPermissionsBoundary, PutRolePermissionsBoundary, DeleteRolePermissionsBoundary | Set/remove boundary on user/role |
| **STS** | AssumeRole, GetCallerIdentity, GetSessionToken, AssumeRoleWithWebIdentity, AssumeRoleWithSAML, GetFederationToken, DecodeAuthorizationMessage | Identity display, Assume role tester, Token decoder |

---

### KMS (35 operations)

| Resource Type | Floci Operations | Dashboard UI Features |
|---------------|------------------|----------------------|
| **Keys** | CreateKey, DescribeKey, ListKeys, ScheduleKeyDeletion, CancelKeyDeletion, UpdateKeyDescription, DisableKey, EnableKey (via state), GetKeyRotationStatus, EnableKeyRotation, DisableKeyRotation, RotateKeyOnDemand | List, Create (description, key spec, usage, policy, tags), Detail (metadata, state, rotation), Enable/disable, Schedule/cancel deletion, Rotate, Edit description |
| **Aliases** | CreateAlias, DeleteAlias, ListAliases | Alias list, Create (name, target key), Delete |
| **Grants** | CreateGrant, ListGrants, ListRetirableGrants, RevokeGrant, RetireGrant | Grant list per key, Create (grantee, operations), Revoke/retire |
| **Crypto** | Encrypt, Decrypt, ReEncrypt, GenerateDataKey, GenerateDataKeyWithoutPlaintext, Sign, Verify, GenerateMac, VerifyMac, GenerateRandom, GetPublicKey | Interactive crypto panel: Encrypt/Decrypt tester, Sign/Verify tester, Generate data key, Generate random, MAC generate/verify |
| **Key Policy** | GetKeyPolicy, PutKeyPolicy | Policy viewer/editor |
| **Tags** | TagResource, UntagResource, ListResourceTags | Tag editor on keys |

---

### DynamoDB (9+ operations) — DONE (2025-06-13)

| Resource Type | Floci Operations | Dashboard UI Features | Status |
|---------------|------------------|----------------------|--------|
| **Tables** | ListTables, CreateTable, DeleteTable, DescribeTable | List, Create (name, keys), Detail (schema, status, stats, GSIs/LSIs), Delete | Done |
| **Items** | Scan, Query (filtered), GetItem, PutItem, DeleteItem | Item table, Filter bar, Put item modal, View item detail, Delete item | Done |
| **UpdateItem** | UpdateItem | Attribute-level update via edit modal | Done |
| **BatchGetItem** | BatchGetItem | Batch get UI in Advanced tab | Done |
| **BatchWriteItem** | BatchWriteItem | Batch write UI in Advanced tab | Done |
| **Transactions** | TransactGetItems, TransactWriteItems | Transaction UI in Advanced tab | Done |
| **TTL** | DescribeTimeToLive, UpdateTimeToLive | TTL config (enable/disable + attribute name) | Done |
| **Tags** | TagResource, UntagResource, ListTagsOfResource | Tag editor in Advanced tab | Done |
| **Continuous Backups** | DescribeContinuousBackups, UpdateContinuousBackups | PITR toggle in Advanced tab | Done |
| **PartiQL** | ExecuteStatement | SQL query editor in Advanced tab | Done |
| **GSIs/LSIs** | (via DescribeTable) | Secondary index display in table detail + Advanced tab | Done |

---

### S3 (7+ operations) — DONE (2025-06-13)

| Resource Type | Floci Operations | Dashboard UI Features | Status |
|---------------|------------------|----------------------|--------|
| **Buckets** | ListBuckets, CreateBucket, DeleteBucket | List with search, Create, Delete | Done |
| **Objects** | ListObjectsV2, GetObject, PutObject (multipart upload), DeleteObject, DeleteObjects (batch) | Object browser, Upload (drag-drop), Detail viewer, Download, Single delete, **Multi-select batch delete** | Done |
| **Folders** | ListObjectsV2 (delimiter), PutObject (zero-byte marker) | Folder navigation, breadcrumbs, Create folder, **Recursive folder delete** | Done |
| **Bucket Versioning** | GetBucketVersioning, PutBucketVersioning | Versioning status viewer, Enable/Suspend toggle | Done |
| **Bucket Tags** | GetBucketTagging, PutBucketTagging, DeleteBucketTagging | Tag list, Key/value editor, Add/remove tags | Done |
| **Bucket Policy** | GetBucketPolicy, PutBucketPolicy, DeleteBucketPolicy | JSON policy editor, Save/delete | Done |
| **Bucket Lifecycle** | GetBucketLifecycleConfiguration, PutBucketLifecycleConfiguration | Full CRUD editor (add/edit/delete rules, transitions, expiration, noncurrent version expiration, abort incomplete multipart upload) | Done |
| **Bucket CORS** | GetBucketCors, PutBucketCors, DeleteBucketCors | JSON rules editor, Save/delete | Done |
| **Bucket Website** | GetBucketWebsite, PutBucketWebsite, DeleteBucketWebsite | Index/error document config, Enable/disable | Done |
| **Bucket Encryption** | GetBucketEncryption, PutBucketEncryption, DeleteBucketEncryption | Encryption algorithm selector (AES256/KMS), Enable/disable | Done |
| **Bucket Notifications** | GetBucketNotificationConfiguration, PutBucketNotificationConfiguration | Lambda/SQS/SNS notification display | Done |
| **Public Access Block** | GetPublicAccessBlock, PutPublicAccessBlock, DeletePublicAccessBlock | 4 toggle switches, Save | Done |
| **Bucket Logging** | GetBucketLogging, PutBucketLogging | Target bucket/prefix config, Save | Done |
| **Object Tags** | GetObjectTagging, PutObjectTagging, DeleteObjectTagging | Inline tag editor in object detail view | Done |
| **Object Attributes** | GetObjectAttributes | ETag, checksum, parts, storage class, size | Done |
| **Head Bucket/Object** | HeadBucket, HeadObject | Existence check (backend only) | Done |

---

### EventBridge (29 operations)

| Resource Type | Floci Operations | Dashboard UI Features |
|---------------|------------------|----------------------|
| **Event Buses** | CreateEventBus, DeleteEventBus, DescribeEventBus, UpdateEventBus, ListEventBuses | List, Create, Detail (stats), Edit, Delete |
| **Rules** | PutRule, DeleteRule, DescribeRule, ListRules, EnableRule, DisableRule | List, Create (name, schedule/event pattern), Detail, Enable/disable toggle, Delete |
| **Targets** | PutTargets, RemoveTargets, ListTargetsByRule | Per-rule targets tab, Add/remove targets |
| **Events** | PutEvents, TestEventPattern | Send test event modal, Test pattern matcher |
| **Archives** | CreateArchive, DescribeArchive, UpdateArchive, DeleteArchive, ListArchives | Archive list, Create, Detail, Edit, Delete |
| **Replays** | StartReplay, DescribeReplay, CancelReplay, ListReplays | Replay list, Start replay, Status monitor, Cancel |
| **Permissions** | PutPermission, RemovePermission | Permission management |
| **Tags** | ListTagsForResource, TagResource, UntagResource | Tag editor |

---

### ECS (50+ operations)

| Resource Type | Floci Operations | Dashboard UI Features |
|---------------|------------------|----------------------|
| **Clusters** | CreateCluster, DescribeClusters, ListClusters, DeleteCluster, UpdateCluster | List with running task/service counts, Create, Detail, Edit, Delete |
| **Task Definitions** | RegisterTaskDefinition, DescribeTaskDefinition, ListTaskDefinitions, ListTaskDefinitionFamilies, DeregisterTaskDefinition, DeleteTaskDefinitions | Family list, Version browser, Register new, Container spec viewer, Deregister |
| **Tasks** | RunTask, StartTask, StopTask, DescribeTasks, ListTasks, UpdateTaskProtection, GetTaskProtection | Task list (per cluster), Run task, Detail, Stop, Protection toggle |
| **Services** | CreateService, UpdateService, DeleteService, DescribeServices, ListServices | Service list, Create (task def, desired count), Detail, Update desired count, Delete |
| **Container Instances** | RegisterContainerInstance, DeregisterContainerInstance, DescribeContainerInstances, ListContainerInstances | Instance list, Detail, Deregister |
| **Capacity Providers** | CreateCapacityProvider, UpdateCapacityProvider, DeleteCapacityProvider, DescribeCapacityProviders | Provider list, Create, Edit, Delete |

---

### Secrets Manager (18 operations)

| Resource Type | Floci Operations | Dashboard UI Features |
|---------------|------------------|----------------------|
| **Secrets** | CreateSecret, GetSecretValue, PutSecretValue, UpdateSecret, DescribeSecret, ListSecrets, DeleteSecret, RestoreSecret, RotateSecret | List (with description, rotation status), Create (name, description, value), Detail (metadata, versions), View secret value (masked/reveal), Edit, Delete/restore, Trigger rotation |
| **Versions** | ListSecretVersionIds, UpdateSecretVersionStage | Version history browser, Stage management |
| **Policy** | GetResourcePolicy, PutResourcePolicy, DeleteResourcePolicy | Policy viewer/editor |
| **Utility** | GetRandomPassword, BatchGetSecretValue | Password generator tool, Batch value viewer |
| **Tags** | TagResource, UntagResource | Tag editor |

---

### CloudWatch Logs (18 operations)

| Resource Type | Floci Operations | Dashboard UI Features |
|---------------|------------------|----------------------|
| **Log Groups** | CreateLogGroup, DeleteLogGroup, DescribeLogGroups, PutRetentionPolicy, DeleteRetentionPolicy | List, Create, Detail (retention), Set retention, Delete |
| **Log Streams** | CreateLogStream, DeleteLogStream, DescribeLogStreams | Stream list per group, Create, Delete |
| **Log Events** | PutLogEvents, GetLogEvents, FilterLogEvents | Live log viewer, Event search with filter patterns, Timestamp navigation |
| **Subscription Filters** | PutSubscriptionFilter, DescribeSubscriptionFilters, DeleteSubscriptionFilter | Filter list, Create, Delete |
| **Tags** | TagLogGroup, UntagLogGroup, ListTagsLogGroup, TagResource, UntagResource | Tag editor |

---

### CloudWatch Metrics (8 operations)

| Resource Type | Floci Operations | Dashboard UI Features |
|---------------|------------------|----------------------|
| **Metrics** | PutMetricData, ListMetrics, GetMetricStatistics, GetMetricData | Namespace/metric browser, Metric chart viewer, Put metric data |
| **Alarms** | PutMetricAlarm, DescribeAlarms, DeleteAlarms, SetAlarmState | Alarm list with state (OK/ALARM/INSUFFICIENT), Create (metric, threshold, period), Detail, Set state, Delete |
| **Tags** | ListTagsForResource, TagResource, UntagResource | Tag editor |

---

### CloudFormation (16 operations)

| Resource Type | Floci Operations | Dashboard UI Features |
|---------------|------------------|----------------------|
| **Stacks** | DescribeStacks, CreateStack, UpdateStack, DeleteStack, ListStacks | Stack list with status, Create (template, parameters), Detail (outputs, parameters, capabilities), Update, Delete |
| **Change Sets** | CreateChangeSet, DescribeChangeSet, ExecuteChangeSet, DeleteChangeSet, ListChangeSets | Change set list, Create, Detail (resource changes diff), Execute, Delete |
| **Stack Resources** | DescribeStackResources, DescribeStackResource, ListStackResources | Resource list per stack, Detail |
| **Events** | DescribeStackEvents | Event log per stack (timestamped) |
| **Templates** | GetTemplate, ValidateTemplate | Template viewer, Template validator tool |
| **Exports** | ListExports | Export list |
| **Stack Sets** | ListStackSets, DescribeStackSet, CreateStackSet | Stack set list, Create, Detail |
| **Policy** | SetStackPolicy, GetStackPolicy | Policy viewer/editor |

---

### SSM (14 operations)

| Resource Type | Floci Operations | Dashboard UI Features |
|---------------|------------------|----------------------|
| **Parameters** | PutParameter, GetParameter, GetParameters, GetParametersByPath, DeleteParameter, DeleteParameters, GetParameterHistory, DescribeParameters, LabelParameterVersion | Hierarchical path browser, Parameter list, Create (name, value, type, tier), Detail with version history, Get/put value, Label version, Delete |
| **Commands** | SendCommand, GetCommandInvocation, ListCommands, ListCommandInvocations, CancelCommand | Command runner (document, targets, parameters), Command list with status, Invocation detail, Cancel |
| **Managed Instances** | DescribeInstanceInformation, UpdateInstanceInformation | Instance list, Detail |
| **Tags** | AddTagsToResource, ListTagsForResource, RemoveTagsFromResource | Tag editor |

---

### Route 53 (20 operations)

| Resource Type | Floci Operations | Dashboard UI Features |
|---------------|------------------|----------------------|
| **Hosted Zones** | CreateHostedZone, GetHostedZone, DeleteHostedZone, ListHostedZones, ListHostedZonesByName, GetHostedZoneCount | Zone list with record count, Create (domain name), Detail, Delete |
| **Record Sets** | ChangeResourceRecordSets, ListResourceRecordSets | Record table editor (A, CNAME, MX, etc.), Create/edit/delete via change batch, Live record set view |
| **Health Checks** | CreateHealthCheck, GetHealthCheck, DeleteHealthCheck, ListHealthChecks, UpdateHealthCheck, GetHealthCheckStatus, GetHealthCheckCount | Health check list with status, Create, Detail, Edit, Delete |
| **Changes** | GetChange | Change status tracker |
| **Tags** | ListTagsForResource, ChangeTagsForResource | Tag editor |
| **DNSSEC** | GetDNSSEC | DNSSEC status display |
| **Limits** | GetAccountLimit, GetHostedZoneLimit | Limit display |

---

### API Gateway REST (full CRUD via path routes)

| Resource Type | Floci Operations | Dashboard UI Features |
|---------------|------------------|----------------------|
| **REST APIs** | CreateRestApi, GetRestApi, UpdateRestApi, DeleteRestApi, GetRestApis | API list, Create (name, description), Detail, Edit, Delete |
| **Resources** | CreateResource, GetResource, UpdateResource, DeleteResource, GetResources | Resource tree viewer (hierarchical path display), CRUD |
| **Methods** | PutMethod, GetMethod, UpdateMethod, DeleteMethod | Method list per resource, Create (HTTP method, auth), Edit, Delete |
| **Integrations** | PutIntegration, GetIntegration, UpdateIntegration, DeleteIntegration | Integration config (type, URI, Lambda/S3/proxy), Edit |
| **Stages** | GetStage, GetStages | Stage list with deployment info |
| **Deployments** | Deployment CRUD | Deployment history |
| **Authorizers** | GetAuthorizer, GetAuthorizers | Authorizer list |
| **API Keys** | ApiKey CRUD | Key list, Create, Detail (show key), Delete |
| **Usage Plans** | UsagePlan CRUD | Plan list, Create, Associate keys |
| **Custom Domains** | Custom domain CRUD | Domain list, Map to API |
| **VPC Links** | VPC link CRUD | Link list, Create, Delete |

---

### API Gateway V2 (HTTP/WebSocket)

| Resource Type | Floci Operations | Dashboard UI Features |
|---------------|------------------|----------------------|
| **APIs** | CreateApi, GetApis, GetApi, UpdateApi, DeleteApi | API list with protocol type, Create, Detail, Edit, Delete |
| **Routes** | CreateRoute, GetRoute, GetRoutes, UpdateRoute, DeleteRoute | Route table (method + path), Create, Edit, Delete |
| **Integrations** | CreateIntegration, GetIntegration, GetIntegrations, UpdateIntegration, DeleteIntegration | Integration config viewer, Create, Edit, Delete |
| **Stages** | CreateStage, GetStage, GetStages, DeleteStage, UpdateStage | Stage list, Create, Edit, Delete |
| **Deployments** | CreateDeployment, GetDeployment, GetDeployments, DeleteDeployment, UpdateDeployment | Deployment list, Create, Delete |
| **Authorizers** | CRUD | Authorizer list, Create, Edit, Delete |
| **Models** | CRUD | Model schema list, Create, Edit, Delete |
| **VPC Links** | CRUD | Link list, Create, Delete |

---

### Step Functions (18 operations)

| Resource Type | Floci Operations | Dashboard UI Features |
|---------------|------------------|----------------------|
| **State Machines** | CreateStateMachine, DescribeStateMachine, ListStateMachines, DeleteStateMachine, ValidateStateMachineDefinition | Machine list, Create (name, definition ASL, type), Detail (definition viewer), Validate definition, Delete |
| **Executions** | StartExecution, StartSyncExecution, DescribeExecution, ListExecutions, StopExecution, GetExecutionHistory | Execution list (status, timeline), Start execution (input JSON), Detail with event history, Stop, Sync execution with result |
| **Activities** | CreateActivity, DeleteActivity, DescribeActivity, ListActivities, GetActivityTask | Activity list, Create, Detail, Delete |
| **Tasks** | SendTaskSuccess, SendTaskFailure, SendTaskHeartbeat | Task control panel |
| **Tags** | ListTagsForResource, TagResource, UntagResource | Tag editor |

---

### SES (v1 + v2 — 50+ operations)

| Resource Type | Floci Operations | Dashboard UI Features |
|---------------|------------------|----------------------|
| **Email Identities** | VerifyEmailIdentity, VerifyEmailAddress, VerifyDomainIdentity (v1), CreateEmailIdentity (v2), ListEmailIdentities, GetEmailIdentity, DeleteEmailIdentity | Identity list with verification status, Verify (email/domain), Detail (DKIM attrs, MAIL FROM), Delete |
| **Templates** | CreateTemplate, UpdateTemplate, GetTemplate, DeleteTemplate, ListTemplates (v1+v2), TestRenderTemplate | Template list, Create/edit (subject, HTML, text), Preview render, Delete |
| **Email Send** | SendEmail, SendRawEmail, SendTemplatedEmail, SendBulkTemplatedEmail (v1), SendEmail, SendBulkEmail (v2) | Email composer (from, to, subject, body), Templated send, Bulk send |
| **Configuration Sets** | CreateConfigurationSet, DescribeConfigurationSet, ListConfigurationSets, DeleteConfigurationSet (v1+v2) | Config set list, Create, Detail, Delete |
| **Suppression List** | PutSuppressedAddress, GetSuppressedAddress, ListSuppressedAddresses, DeleteSuppressedAddress | Suppression list viewer, Add/remove |
| **Sending Quota** | GetSendQuota, GetSendStatistics, GetAccountSendingEnabled, UpdateAccountSendingEnabled | Quota display (max 24hr/max per second), Statistics chart, Enable/disable sending |
| **Inspection** | GET/DELETE `/_aws/ses` | Email inbox viewer, Clear |

---

### Kinesis (22 operations)

| Resource Type | Floci Operations | Dashboard UI Features |
|---------------|------------------|----------------------|
| **Streams** | CreateStream, DeleteStream, ListStreams, DescribeStream, DescribeStreamSummary, UpdateStreamMode | Stream list with retention/shard count, Create (name, shard count), Detail, Update mode, Delete |
| **Shards** | ListShards, SplitShard, MergeShards | Shard map viewer, Split, Merge |
| **Consumers** | RegisterStreamConsumer, DeregisterStreamConsumer, DescribeStreamConsumer, ListStreamConsumers | Consumer list, Register, Deregister |
| **Records** | PutRecord, PutRecords, GetShardIterator, GetRecords | Record sender (data, partition key), Record viewer (get records) |
| **Monitoring** | EnableEnhancedMonitoring, DisableEnhancedMonitoring | Monitoring toggle |
| **Encryption** | StartStreamEncryption, StopStreamEncryption | Encryption toggle |
| **Retention** | IncreaseStreamRetentionPeriod, DecreaseStreamRetentionPeriod | Retention period editor |
| **Tags** | AddTagsToStream, RemoveTagsFromStream, ListTagsForStream | Tag editor |

---

### CloudFront (40+ operations)

| Resource Type | Floci Operations | Dashboard UI Features |
|---------------|------------------|----------------------|
| **Distributions** | CreateDistribution, GetDistribution, UpdateDistribution, DeleteDistribution, ListDistributions | Distribution list (domain, status), Create (origin, behaviors), Detail, Edit, Delete |
| **Invalidations** | CreateInvalidation, GetInvalidation, ListInvalidations | Invalidation list, Create (paths), Status monitor |
| **Cache Policies** | CRUD | Policy list, Create, Edit, Delete |
| **Origin Request Policies** | CRUD | Policy list, Create, Edit, Delete |
| **Response Headers Policies** | CRUD | Policy list, Create, Edit, Delete |
| **Origin Access Controls** | CRUD | OAC list, Create, Edit, Delete |

---

### ELBv2 (20+ operations)

| Resource Type | Floci Operations | Dashboard UI Features |
|---------------|------------------|----------------------|
| **Load Balancers** | CreateLoadBalancer, DescribeLoadBalancers, DeleteLoadBalancer, ModifyLoadBalancerAttributes | LB list (DNS name, type, scheme), Create (name, type, subnets, SGs), Detail (listeners, attributes), Delete |
| **Target Groups** | CreateTargetGroup, DescribeTargetGroups, DeleteTargetGroup, ModifyTargetGroup | TG list (protocol, port, health), Create, Detail, Edit, Delete |
| **Listeners** | CreateListener, DescribeListeners, DeleteListener, ModifyListener | Listener list per LB, Create, Edit, Delete |
| **Rules** | CreateRule, DescribeRules, DeleteRule, ModifyRule, SetRulePriorities | Rule list per listener, Create (priority, conditions, actions), Edit, Reorder, Delete |
| **Targets** | RegisterTargets, DeregisterTargets, DescribeTargetHealth | Target registration, Health status viewer, Deregister |
| **Tags** | AddTags, RemoveTags, DescribeTags | Tag editor |

---

### ECR (18 operations)

| Resource Type | Floci Operations | Dashboard UI Features |
|---------------|------------------|----------------------|
| **Repositories** | CreateRepository, DescribeRepositories, DeleteRepository, PutImageTagMutability | Repo list with image count, Create, Detail (mutability), Delete |
| **Images** | ListImages, DescribeImages, BatchGetImage, BatchDeleteImage | Image browser (tags, digests, sizes), Detail, Batch delete |
| **Auth** | GetAuthorizationToken | Auth token display (for docker login) |
| **Lifecycle** | PutLifecyclePolicy, GetLifecyclePolicy, DeleteLifecyclePolicy | Lifecycle policy editor |
| **Repository Policy** | SetRepositoryPolicy, GetRepositoryPolicy, DeleteRepositoryPolicy | Policy viewer/editor |
| **Tags** | TagResource, UntagResource, ListTagsForResource | Tag editor |

---

### EKS (8 operations)

| Resource Type | Floci Operations | Dashboard UI Features |
|---------------|------------------|----------------------|
| **Clusters** | CreateCluster, ListClusters, DescribeCluster, DeleteCluster | Cluster list with status, Create (name, version, role), Detail (endpoint, version, VPC config), Delete |
| **Node Groups** | CreateNodegroup, ListNodegroups, DescribeNodegroup, DeleteNodegroup | Node group list per cluster, Create, Detail (scaling config, instance types), Delete |

---

### RDS (19 operations)

| Resource Type | Floci Operations | Dashboard UI Features |
|---------------|------------------|----------------------|
| **DB Instances** | CreateDBInstance, DescribeDBInstances, DeleteDBInstance, ModifyDBInstance, RebootDBInstance | Instance list (engine, status, class), Create (engine, class, storage), Detail (endpoint, port), Edit, Reboot, Delete |
| **DB Clusters** | CreateDBCluster, DescribeDBClusters, DeleteDBCluster, ModifyDBCluster | Cluster list, Create, Detail, Edit, Delete |
| **Parameter Groups** | CreateDBParameterGroup, DescribeDBParameterGroups, DeleteDBParameterGroup, ModifyDBParameterGroup, DescribeDBParameters | PG list, Create, Detail with parameter editor, Edit, Delete |
| **Cluster Parameter Groups** | CRUD | Same as PG for clusters |

---

### Neptune (8 operations)

| Resource Type | Floci Operations | Dashboard UI Features |
|---------------|------------------|----------------------|
| **Clusters** | CreateDBCluster, DescribeDBClusters, DeleteDBCluster, ModifyDBCluster | Cluster list, Create, Detail, Edit, Delete |
| **Instances** | CreateDBInstance, DescribeDBInstances, DeleteDBInstance, ModifyDBInstance | Instance list per cluster, Create, Detail, Edit, Delete |

---

### ElastiCache (10 operations)

| Resource Type | Floci Operations | Dashboard UI Features |
|---------------|------------------|----------------------|
| **Replication Groups** | CreateReplicationGroup, DescribeReplicationGroups, ModifyReplicationGroup, DeleteReplicationGroup | Group list (engine, auth), Create, Detail, Edit, Delete |
| **Cache Clusters** | CreateCacheCluster, DescribeCacheClusters, DeleteCacheCluster | Cluster list, Create, Detail (endpoint), Delete |
| **Users** | CreateUser, DescribeUsers, ModifyUser, DeleteUser | User list, Create, Edit, Delete |

---

### Cognito (40+ operations)

| Resource Type | Floci Operations | Dashboard UI Features |
|---------------|------------------|----------------------|
| **User Pools** | CreateUserPool, DescribeUserPool, ListUserPools, UpdateUserPool, DeleteUserPool | Pool list, Create (name, policies, attributes), Detail, Edit, Delete |
| **Pool Clients** | CreateUserPoolClient, DescribeUserPoolClient, ListUserPoolClients, DeleteUserPoolClient, UpdateUserPoolClient | Client list, Create, Detail, Edit, Delete |
| **Users** | AdminCreateUser, AdminGetUser, AdminDeleteUser, ListUsers, AdminSetUserPassword, AdminResetUserPassword, AdminUpdateUserAttributes, AdminEnableUser, AdminDisableUser | User list, Create, Detail (attributes, groups), Set password, Enable/disable, Delete |
| **Groups** | CreateGroup, GetGroup, ListGroups, DeleteGroup, UpdateGroup, AdminAddUserToGroup, AdminRemoveUserFromGroup | Group list, Create, Detail, Edit, Add/remove users, Delete |
| **Resource Servers** | CRUD | Server list, Create, Edit, Delete |
| **Auth** | InitiateAuth, AdminInitiateAuth, RespondToAuthChallenge, SignUp, ConfirmSignUp, ChangePassword, ForgotPassword | Auth flow tester |
| **Tags** | TagResource, UntagResource, ListTagsForResource | Tag editor |

---

### ACM (12 operations)

| Resource Type | Floci Operations | Dashboard UI Features |
|---------------|------------------|----------------------|
| **Certificates** | RequestCertificate, DescribeCertificate, GetCertificate, ListCertificates, DeleteCertificate, ImportCertificate, ExportCertificate | Certificate list (domain, status), Request (domain, validation), Import, Detail (chain, validation), Export, Delete |
| **Tags** | AddTagsToCertificate, ListTagsForCertificate, RemoveTagsFromCertificate | Tag editor |
| **Account** | GetAccountConfiguration, PutAccountConfiguration | Account config display |

---

### AppSync (30+ operations)

| Resource Type | Floci Operations | Dashboard UI Features |
|---------------|------------------|----------------------|
| **GraphQL APIs** | Create, Get, Update, Delete, List | API list, Create (name, auth), Detail, Edit, Delete |
| **Schema** | StartSchemaCreation, GetSchemaCreationStatus, GetIntrospectionSchema | Schema viewer (GraphQL type tree), Create/update |
| **Data Sources** | CRUD | Data source list, Create, Edit, Delete |
| **Resolvers** | CRUD (by type, by function) | Resolver list per type, Create, Edit, Delete |
| **Functions** | CRUD | Function list, Create, Edit, Delete |
| **Domain Names** | CRUD | Domain list, Associate |
| **API Caches** | CRUD | Cache config |

---

### Auto Scaling (25+ operations)

| Resource Type | Floci Operations | Dashboard UI Features |
|---------------|------------------|----------------------|
| **Auto Scaling Groups** | CreateAutoScalingGroup, UpdateAutoScalingGroup, DeleteAutoScalingGroup, DescribeAutoScalingGroups, SetDesiredCapacity | ASG list (desired/current/min/max), Create (name, launch config/template, subnets), Detail, Capacity slider, Edit, Delete |
| **Launch Configs** | CreateLaunchConfiguration, DescribeLaunchConfigurations, DeleteLaunchConfiguration | Config list, Create, Detail, Delete |
| **Scaling Policies** | PutScalingPolicy, DeletePolicy, DescribePolicies | Policy list, Create, Delete |
| **Activities** | DescribeScalingActivities | Activity log |
| **Lifecycle Hooks** | PutLifecycleHook, DeleteLifecycleHook, DescribeLifecycleHooks, CompleteLifecycleAction, RecordLifecycleActionHeartbeat | Hook list, Create, Complete, Delete |
| **Instances** | DescribeAutoScalingInstances, AttachInstances, DetachInstances, TerminateInstanceInAutoScalingGroup | Instance list, Attach/detach, Terminate |
| **LB Attachment** | AttachLoadBalancers, DetachLoadBalancers, AttachLoadBalancerTargetGroups, DetachLoadBalancerTargetGroups | LB attachment management |

---

### CodePipeline (20+ operations) ✅ Done

Floci externalKey: `codepipeline` | Protocol: JSON | SDK: `@aws-sdk/client-codepipeline` (already installed)

| Resource Type | Floci Operations | Dashboard UI Features |
|---------------|------------------|----------------------|
| **Pipelines** | CreatePipeline, GetPipeline, UpdatePipeline, DeletePipeline, ListPipelines, GetPipelineState | List, Create (stages, actions, artifact store), Detail (state visualization), Edit, Delete |
| **Executions** | StartPipelineExecution, StopPipelineExecution, GetPipelineExecution, ListPipelineExecutions, RetryStageExecution | Execution list with status timeline, Start execution, Stop/abandon, Retry stage, Detail view |
| **Stage Transitions** | DisableStageTransition, EnableStageTransition | Per-stage enable/disable toggle, Transition reason |
| **Approvals** | PutApprovalResult | Approval result submission (Approved/Rejected with summary) |
| **Action Executions** | ListActionExecutions | Per-action execution history with status and timing |
| **Action Types** | ListActionTypes, CreateCustomActionType | Built-in action type browser (by owner/region), Custom action type creation |
| **Webhooks** | ListWebhooks, PutWebhook, DeleteWebhook | Webhook list, Create (with filters/authentication), Delete |
| **Tags** | TagResource, UntagResource, ListTagsForResource | Tag editor on pipelines |

---

### Elastic Beanstalk (14 operations) ✅ Done

Floci externalKey: `elasticbeanstalk` | Protocol: QUERY (AWS Query API) | SDK: `@aws-sdk/client-elastic-beanstalk` (needs install)

| Resource Type | Floci Operations | Dashboard UI Features |
|---------------|------------------|----------------------|
| **Applications** | CreateApplication, DescribeApplications, UpdateApplication, DeleteApplication | Application list, Create, Detail, Edit, Delete |
| **Application Versions** | CreateApplicationVersion, DescribeApplicationVersions, DeleteApplicationVersion | Version list per app, Create (source bundle), Detail, Delete |
| **Environments** | CreateEnvironment, DescribeEnvironments, UpdateEnvironment, TerminateEnvironment | Environment list with health, Create (solution stack, version), Detail, Edit, Terminate |
| **Configuration Settings** | DescribeConfigurationSettings | Config settings browser |
| **DNS Availability** | CheckDNSAvailability | CNAME availability checker |
| **Solution Stacks** | ListAvailableSolutionStacks | Solution stack list |

---

### IoT Core (20+ operations) ✅ Done

Floci externalKey: `iot` | Protocol: REST_JSON | SDK: `@aws-sdk/client-iot` + `@aws-sdk/client-iot-data-plane` (needs install)

| Resource Type | Floci Operations | Dashboard UI Features |
|---------------|------------------|----------------------|
| **Things** | CreateThing, DescribeThing, ListThings, UpdateThing, DeleteThing, DescribeEndpoint | Thing list, Create (type, attributes), Detail, Edit attributes, Delete |
| **Certificates** | CreateKeysAndCertificate, CreateCertificateFromCsr, DescribeCertificate, ListCertificates, UpdateCertificate, DeleteCertificate | Certificate list with status, Create (download keys), Activate/deactivate/revoke, Delete |
| **Policies** | CreatePolicy, GetPolicy, ListPolicies, DeletePolicy, CreatePolicyVersion, ListPolicyVersions, SetDefaultPolicyVersion | Policy list, Create (JSON document), Detail, Version browser, Attach/detach to certificate |
| **Shadows** | GetThingShadow, UpdateThingShadow, DeleteThingShadow | Shadow state viewer (JSON), Update shadow, Delete |
| **Topic Rules** | CreateTopicRule, GetTopicRule, ListTopicRules, UpdateTopicRule, DeleteTopicRule | Rule list, Create (SQL query + actions), Detail, Enable/disable, Delete |
| **Jobs** | CreateJob, DescribeJob, ListJobs, DeleteJob | Job list with status, Create (targets + document), Detail, Cancel, Delete |
| **Tags** | TagResource, UntagResource, ListTagsForResource | Tag editor |

---

### Remaining Services (list-only / minimal CRUD)

| Service | Key Resources | Dashboard UI Features |
|---------|---------------|----------------------|
| **EventBridge Scheduler** | Schedule groups, schedules | Group list, Schedule list (expression, target, state), Create schedule, Detail, Edit state, Delete |
| **EventBridge Pipes** | Pipes | Pipe list (source, target, state), Create pipe, Detail, Start/stop, Delete |
| **Athena** | Query executions, work groups, data catalogs, databases, tables | Query editor (SQL input), Query history with status, Work group list, Catalog browser (databases > tables > schema) |
| **Glue** | Databases, tables, partitions, schema registries, schemas, UDFs | Catalog browser (databases > tables > schema/columns), Partition viewer, Schema registry > versions, UDF list |
| **Firehose** | Delivery streams | Stream list (status, destination), Create, Detail (S3 config), Put record test, Delete |
| **MSK** | Clusters | Cluster list (state), Create, Detail (brokers, bootstrap), Delete |
| **OpenSearch** | Domains | Domain list (health, version), Create, Detail (cluster config, access), Edit config, Delete |
| **Bedrock Runtime** | Model invocations | Model invocation tester (converse/invoke), Model ID selector, Response viewer |
| **Textract** | Document analysis jobs | Text detection tester, Job list with status, Job result viewer |
| **Transcribe** | Transcription jobs, vocabularies | Job list with status, Create job, Detail (transcript), Vocabulary management |
| **Cost Explorer** | Cost/usage data, reservations, savings plans | Cost dashboard with time-series charts, Breakdown by service/dimension |
| **CUR** | Report definitions | Report list, Create/edit config, Delete |
| **BCM Data Exports** | Exports, executions | Export list, Create, Detail, Execution history |
| **Pricing** | Service catalog, price lists | Service browser, Attribute lookup, Product/pricing viewer |
| **Resource Groups Tagging** | Tagged resources, tag keys/values | Tag editor (search by tags), Bulk tag/untag, Tag key/value browser |
| **CodeBuild** | Projects, builds, report groups, source credentials | Project list, Build history with logs, Start/retry/stop build, Report group list |
| **CodeDeploy** | Applications, deployment groups, deployments, configs | Application list, Deployment group detail, Deployment history with status timeline |
| **Backup** | Vaults, plans, selections, jobs, recovery points | Vault list, Plan detail, Job list with status, Recovery point browser |
| **Transfer Family** | Servers, users, SSH keys | Server list (endpoint, state), Start/stop, User management per server, SSH key management |
| **CloudTrail** | Trails | Trail list (logging status), Create, Detail (S3 bucket, config), Start/stop logging |
| **AppConfig** | Applications, environments, config profiles, deployments | Application list, Environment list, Config profile browser, Deployment history |
| **Cloud Map** | Namespaces, services, instances | Namespace list (type), Service list per namespace, Instance list with health status |
| **AppSync** | GraphQL APIs, schemas, resolvers | See detailed section above |
| **Config** | Rules, conformance packs, recorders | Rule list with compliance status, Pack browser, Recorder status |
| **STS** | Sessions, tokens | See IAM section above |
| **Service Discovery (Cloud Map)** | Namespaces, services, instances | Namespace list, Service list, Instance registration |

---

## ═══════════════════════════════════════════════════════════
## PROGRESS TRACKER
## ═══════════════════════════════════════════════════════════

### Agent Instructions for Tracker

**Every agent working on this project MUST:**
1. Read this tracker before starting work
2. Update task status as work progresses (Pending -> In Progress -> Done)
3. Mark tasks with the date when completed
4. Never mark a task Done without running `pnpm run typecheck` successfully
5. Never skip verification steps

### Status Legend

| Symbol | Meaning |
|--------|---------|
| Done | Completed and verified |
| In Progress | Currently being worked on |
| Pending | Not started yet |
| Blocked | Waiting on dependency |

---

### Phase 0: Foundation (shared infrastructure)

| # | Task | Status | Date |
|---|------|--------|------|
| 0.1 | Create repo + git init | Done | 2025-06-12 |
| 0.2 | Write PLAN.md | Done | 2025-06-12 |
| 0.3 | Create package.json with all scripts + dependencies | Done | 2025-06-12 |
| 0.4 | Create tsconfig.json (frontend) | Done | 2025-06-12 |
| 0.5 | Create tsconfig.backend.json | Done | 2025-06-12 |
| 0.6 | Create vite.config.ts | Done | 2025-06-12 |
| 0.7 | Create .gitignore | Done | 2025-06-12 |
| 0.8 | Create .dockerignore | Done | 2025-06-12 |
| 0.9 | Create Dockerfile (multi-stage: dev, builder, prod) | Done | 2025-06-12 |
| 0.10 | Create docker-compose.yml (production) | Done | 2025-06-12 |
| 0.11 | Create docker-compose.dev.yml (dev with HMR + volumes) | Done | 2025-06-12 |
| 0.12 | Create src/backend/clients/floci.ts | Done | 2025-06-12 |
| 0.13 | Create src/backend/clients/aws.ts (SDK factory) | Done | 2025-06-12 |
| 0.14 | Create src/backend/index.ts (Hono + CORS + serve-static) | Done | 2025-06-12 |
| 0.15 | Create src/backend/types.ts | Done | 2025-06-12 |
| 0.16 | Implement /api/system/health + /init routes | Done | 2025-06-12 |
| 0.17 | Implement /api/inspect/* routes (sqs, ses, sns) | Done | 2025-06-12 |
| 0.18 | Create routes/aws/index.ts (aggregator) | Done | 2025-06-12 |
| 0.19 | Create src/frontend/main.tsx + index.html | Done | 2025-06-12 |
| 0.20 | Create src/frontend/App.tsx (HashRouter + QueryClientProvider) | Done | 2025-06-12 |
| 0.21 | Create AppLayoutShell (Cloudscape SideNavigation) | Done | 2025-06-12 |
| 0.22 | Create DashboardHome page (service grid) | Done | 2025-06-12 |
| 0.23 | Create ServicePage.tsx (dynamic per-service page) | Done | 2025-06-12 |
| 0.24 | Create shared components (ResourceTable, CreateModal, DeleteButton, ServiceCard, ServiceGrid, StatusBadge) | Done | 2025-06-12 |
| 0.25 | Create frontend api/client.ts + hooks | Done | 2025-06-12 |
| 0.26 | Create types/services.ts (categories + labels) | Done | 2025-06-12 |
| 0.27 | Create types/api.ts (API response types) | Done | 2025-06-12 |
| 0.28 | Create AGENTS.md | Done | 2025-06-12 |
| 0.29 | Implement /api/active route (detect services with resources) | Done | 2025-06-12 |
| 0.30 | Verify: typecheck passes | Done | 2025-06-12 |
| 0.31 | Verify: build passes | Done | 2025-06-12 |

---

### Phase 1: Core Services (fully implemented)

#### 1A — S3 (Dedicated Page)

| # | Task | Status | Date |
|---|------|--------|------|
| 1.1 | Backend: GET /api/aws/s3/buckets | Done | 2025-06-12 |
| 1.2 | Backend: POST /api/aws/s3/buckets | Done | 2025-06-12 |
| 1.3 | Backend: DELETE /api/aws/s3/buckets/:name | Done | 2025-06-12 |
| 1.4 | Backend: GET /api/aws/s3/buckets/:name/objects | Done | 2025-06-12 |
| 1.5 | Backend: GET /api/aws/s3/buckets/:name/objects/* (object detail) | Done | 2025-06-12 |
| 1.6 | Backend: POST /api/aws/s3/buckets/:name/objects/upload (multipart) | Done | 2025-06-12 |
| 1.7 | Backend: DELETE /api/aws/s3/buckets/:name/objects/* | Done | 2025-06-12 |
| 1.8 | Frontend: S3Page with bucket list, search, create, delete | Done | 2025-06-12 |
| 1.9 | Frontend: Object browser with drill-down | Done | 2025-06-12 |
| 1.10 | Frontend: File upload modal with drag-and-drop | Done | 2025-06-12 |
| 1.11 | Frontend: Object detail viewer with download | Done | 2025-06-12 |
| 1.12 | Frontend: Overview tab with stats | Done | 2025-06-12 |
| 1.13 | Frontend: useS3 hooks (buckets, objects, upload, delete) | Done | 2025-06-12 |
| 1.14 | Verify: typecheck + build pass | Done | 2025-06-12 |
| 1.15 | Backend: PUT /api/aws/s3/buckets/:name/folders (create zero-byte folder marker object) | Done | 2025-06-17 |
| 1.16 | Frontend: S3 folder browser — create folder button in S3ObjectBrowser (uses current prefix) | Done | 2025-06-17 |
| 1.17 | Frontend: useS3 hooks — useCreateFolder mutation | Done | 2025-06-17 |
| 1.18 | Verify: typecheck + build pass | Done | 2025-06-17 |
| 1.19 | Backend: POST /api/aws/s3/buckets/:name/objects/batch-delete (DeleteObjectsCommand, accepts keys[]) | Done | 2025-06-18 |
| 1.20 | Backend: POST /api/aws/s3/buckets/:name/folders/delete (recursive delete: list all objects under prefix, batch-delete in chunks of 1000) | Done | 2025-06-18 |
| 1.21 | Frontend: useS3 hooks — useS3BatchDeleteObjects mutation (invalidates objects query on success) | Done | 2025-06-18 |
| 1.22 | Frontend: useS3 hooks — useS3DeleteFolder mutation (calls recursive folder-delete endpoint) | Done | 2025-06-18 |
| 1.23 | Frontend: S3ObjectBrowser — add `selectionType="multi"` to objects Table + `selectedItems` state + `trackBy="key"` | Done | 2025-06-18 |
| 1.24 | Frontend: S3ObjectBrowser — add "Delete selected (N)" button in header actions, shown only when selectedItems > 0 | Done | 2025-06-18 |
| 1.25 | Frontend: S3ObjectBrowser — add delete button column for folders (calls useS3DeleteFolder with folder prefix) | Done | 2025-06-18 |
| 1.26 | Frontend: S3ObjectBrowser — confirm modal for batch delete showing count + selected key names | Done | 2025-06-18 |
| 1.27 | Backend tests: s3.test.ts — batch-delete (happy path, empty list 400, partial failure) + folder-delete (happy path, empty prefix 400) | Done | 2025-06-18 |
| 1.28 | Frontend tests: useS3.test.ts — useS3BatchDeleteObjects + useS3DeleteFolder (correct URL, method, body, invalidation) | Done | 2025-06-18 |
| 1.29 | Verify: typecheck + tests + build pass | Done | 2025-06-18 |

#### 1B — DynamoDB (ServicePage Integration)

| # | Task | Status | Date |
|---|------|--------|------|
| 2.1 | Backend: GET /api/aws/dynamodb/tables | Done | 2025-06-12 |
| 2.2 | Backend: POST /api/aws/dynamodb/tables | Done | 2025-06-12 |
| 2.3 | Backend: DELETE /api/aws/dynamodb/tables/:name | Done | 2025-06-12 |
| 2.4 | Backend: GET /api/aws/dynamodb/tables/:name (describe) | Done | 2025-06-12 |
| 2.5 | Backend: GET /api/aws/dynamodb/tables/:name/items (scan) | Done | 2025-06-12 |
| 2.6 | Backend: POST /api/aws/dynamodb/tables/:name/items/query (filtered scan) | Done | 2025-06-12 |
| 2.7 | Backend: POST /api/aws/dynamodb/tables/:name/items/get | Done | 2025-06-12 |
| 2.8 | Backend: PUT /api/aws/dynamodb/tables/:name/items (put item) | Done | 2025-06-12 |
| 2.9 | Backend: POST /api/aws/dynamodb/tables/:name/items/delete | Done | 2025-06-12 |
| 2.10 | Frontend: Table list with create/delete | Done | 2025-06-12 |
| 2.11 | Frontend: Table detail view with stats + key schema | Done | 2025-06-12 |
| 2.12 | Frontend: Item table with dynamic columns | Done | 2025-06-12 |
| 2.13 | Frontend: Filter bar (attribute + operator + value) | Done | 2025-06-12 |
| 2.14 | Frontend: Put item modal with dynamic attributes | Done | 2025-06-12 |
| 2.15 | Frontend: Item detail modal | Done | 2025-06-12 |
| 2.16 | Frontend: useDynamoDB hooks | Done | 2025-06-12 |
| 2.17 | Verify: typecheck + build pass | Done | 2025-06-12 |

---

### Phase 2: Messaging Services

#### 2A — SQS (23 operations)

| # | Task | Status | Date |
|---|------|--------|------|
| 3.1 | Consult Floci SQS source for supported operations | Done | 2025-06-13 |
| 3.2 | Backend: GET /api/aws/sqs/queues (list queues) | Done | 2025-06-13 |
| 3.3 | Backend: POST /api/aws/sqs/queues (create queue with attrs + tags) | Done | 2025-06-13 |
| 3.4 | Backend: DELETE /api/aws/sqs/queues/:name | Done | 2025-06-13 |
| 3.5 | Backend: GET /api/aws/sqs/queues/:name (get attributes) | Done | 2025-06-13 |
| 3.6 | Backend: PUT /api/aws/sqs/queues/:name/attributes (set attributes) | Done | 2025-06-13 |
| 3.7 | Backend: GET /api/aws/sqs/queues/:name/messages (via inspection API) | Done | 2025-06-13 |
| 3.8 | Backend: POST /api/aws/sqs/queues/:name/messages (send message) | Done | 2025-06-13 |
| 3.9 | Backend: POST /api/aws/sqs/queues/:name/messages/batch (batch send) | Done | 2025-06-13 |
| 3.10 | Backend: DELETE /api/aws/sqs/queues/:name/messages/:receipt (delete message) | Done | 2025-06-13 |
| 3.11 | Backend: POST /api/aws/sqs/queues/:name/purge (purge queue) | Done | 2025-06-13 |
| 3.12 | Backend: POST /api/aws/sqs/queues/:name/messages/visibility (change visibility) | Done | 2025-06-13 |
| 3.13 | Backend: GET /api/aws/sqs/queues/:name/tags + POST/DELETE tags | Done | 2025-06-13 |
| 3.14 | Backend: GET /api/aws/sqs/queues/:name/dlq (dead letter sources) | Done | 2025-06-13 |
| 3.15 | Backend: POST /api/aws/sqs/dlq/move-tasks (start/cancel/list move tasks) | Done | 2025-06-17 |
| 3.16 | Frontend: useSQS hooks (list, create, delete, attributes, messages, tags, DLQ) | Done | 2025-06-13 |
| 3.17 | Frontend: SQS page — Queue list with search/filter/create | Done | 2025-06-13 |
| 3.18 | Frontend: Queue detail — Attributes tab (stats, ARN, retention, visibility timeout) | Done | 2025-06-13 |
| 3.19 | Frontend: Queue detail — Messages tab (view, send, delete, batch send, change visibility) | Done | 2025-06-13 |
| 3.20 | Frontend: Queue detail — DLQ tab (sources, move task start/cancel/status) | Done | 2025-06-13 |
| 3.21 | Frontend: Queue detail — Tags tab | Done | 2025-06-13 |
| 3.22 | Frontend: Queue detail — Purge button with confirmation | Done | 2025-06-13 |
| 3.23 | Verify: typecheck + build pass | Done | 2025-06-13 |

#### 2B — SNS (27 operations)

| # | Task | Status | Date |
|---|------|--------|------|
| 4.1 | Consult Floci SNS source for supported operations | Done | 2025-06-13 |
| 4.2 | Backend: GET /api/aws/sns/topics | Done | 2025-06-13 |
| 4.3 | Backend: POST /api/aws/sns/topics (create with attrs + tags) | Done | 2025-06-13 |
| 4.4 | Backend: DELETE /api/aws/sns/topics/:arn | Done | 2025-06-13 |
| 4.5 | Backend: GET /api/aws/sns/topics/:arn (get attributes) | Done | 2025-06-13 |
| 4.6 | Backend: PUT /api/aws/sns/topics/:arn/attributes | Done | 2025-06-13 |
| 4.7 | Backend: GET /api/aws/sns/subscriptions | Done | 2025-06-13 |
| 4.8 | Backend: GET /api/aws/sns/topics/:arn/subscriptions | Done | 2025-06-13 |
| 4.9 | Backend: POST /api/aws/sns/subscriptions (subscribe) | Done | 2025-06-13 |
| 4.10 | Backend: DELETE /api/aws/sns/subscriptions/:arn (unsubscribe) | Done | 2025-06-13 |
| 4.11 | Backend: POST /api/aws/sns/topics/:arn/publish (publish message) | Done | 2025-06-13 |
| 4.12 | Backend: POST /api/aws/sns/topics/:arn/publish-batch | Done | 2025-06-13 |
| 4.13 | Backend: Platform application CRUD (list, create, delete, get/set attrs) | Done | 2025-06-13 |
| 4.14 | Backend: Platform endpoint CRUD (list, create, delete, get/set attrs) | Done | 2025-06-13 |
| 4.15 | Frontend: useSNS hooks | Done | 2025-06-13 |
| 4.16 | Frontend: SNS page — Topics tab (list, create, detail, delete) | Done | 2025-06-13 |
| 4.17 | Frontend: Topic detail — Subscriptions tab (list, subscribe, unsubscribe, filter policy) | Done | 2025-06-13 |
| 4.18 | Frontend: Topic detail — Publish tab (message composer with attributes) | Done | 2025-06-13 |
| 4.19 | Frontend: SNS page — Platform apps tab (list, create, endpoints) | Done | 2025-06-13 |
| 4.20 | Frontend: SMS inbox viewer (via /api/inspect/sns) | Done | 2025-06-13 |
| 4.21 | Verify: typecheck + build pass | Done | 2025-06-13 |

#### 2C — EventBridge (29 operations)

| # | Task | Status | Date |
|---|------|--------|------|
| 5.1 | Consult Floci EventBridge source for supported operations | Done | 2025-06-13 |
| 5.2 | Backend: Event bus CRUD (list, create, describe, update, delete) | Done | 2025-06-13 |
| 5.3 | Backend: Rule CRUD (list, create/put, describe, delete, enable, disable) | Done | 2025-06-13 |
| 5.4 | Backend: Target CRUD (put, remove, list by rule) | Done | 2025-06-13 |
| 5.5 | Backend: POST /api/aws/events/put-events (send test event) | Done | 2025-06-13 |
| 5.6 | Backend: Archive CRUD (list, create, describe, update, delete) | Done | 2025-06-13 |
| 5.7 | Backend: Replay CRUD (start, describe, cancel, list) | Done | 2025-06-13 |
| 5.8 | Backend: Tags + permissions | Done | 2025-06-13 |
| 5.9 | Frontend: useEvents hooks | Done | 2025-06-13 |
| 5.10 | Frontend: EventBridge page — Event buses tab | Done | 2025-06-13 |
| 5.11 | Frontend: Bus detail — Rules tab (create, enable/disable toggle, detail) | Done | 2025-06-13 |
| 5.12 | Frontend: Rule detail — Targets tab (add/remove targets) | Done | 2025-06-13 |
| 5.13 | Frontend: Event sender modal (put events test) | Done | 2025-06-13 |
| 5.14 | Frontend: Archives tab + Replays tab | Done | 2025-06-13 |
| 5.15 | Verify: typecheck + build pass | Done | 2025-06-13 |

---

### Phase 3: Compute Services

#### 3A — Lambda (44 operations)

| # | Task | Status | Date |
|---|------|--------|------|
| 6.1 | Consult Floci Lambda source for supported operations | Done | 2025-06-14 |
| 6.2 | Backend: Function CRUD (list, create, get, update config, update code, delete) | Done | 2025-06-14 |
| 6.3 | Backend: POST /api/aws/lambda/functions/:name/invocations (invoke sync/async/dry-run) | Done | 2025-06-14 |
| 6.4 | Backend: Event source mapping CRUD (list, create, update, delete) | Done | 2025-06-14 |
| 6.5 | Backend: Version + alias management (publish, list, create/update/delete alias) | Done | 2025-06-14 |
| 6.6 | Backend: Layer management (publish version, list, get, delete) | Done | 2025-06-14 |
| 6.7 | Backend: Function URL config CRUD | Done | 2025-06-14 |
| 6.8 | Backend: Tags + concurrency + event invoke config + resource policy | Done | 2025-06-14 |
| 6.9 | Frontend: useLambda hooks | Done | 2025-06-14 |
| 6.10 | Frontend: Lambda page — Functions tab (list with runtime/timeout/memory, create, delete) | Done | 2025-06-14 |
| 6.11 | Frontend: Function detail — Configuration tab (env vars, timeout, memory, handler, runtime) | Done | 2025-06-14 |
| 6.12 | Frontend: Function detail — Invoke tab (payload input, invocation type selector, response viewer) | Done | 2025-06-14 |
| 6.13 | Frontend: Function detail — Event sources tab (list, create, enable/disable) | Done | 2025-06-14 |
| 6.14 | Frontend: Function detail — Versions tab + Aliases tab | Done | 2025-06-14 |
| 6.15 | Frontend: Function detail — Layers tab (publish, browse versions) | Done | 2025-06-14 |
| 6.16 | Frontend: Function detail — URL config tab + Concurrency + Tags | Done | 2025-06-14 |
| 6.17 | Verify: typecheck + build pass | Done | 2025-06-14 |

#### 3B — EC2 (81 operations — dedicated page)

| # | Task | Status | Date |
|---|------|--------|------|
| 7.1 | Consult Floci EC2 source for supported operations | Done | 2025-06-13 |
| 7.2 | Backend: Instance CRUD (list, run, terminate, start, stop, reboot, describe status) | Done | 2025-06-13 |
| 7.3 | Backend: Instance attributes (describe, modify instanceType/sourceDestCheck/ebsOptimized) | Done | 2025-06-13 |
| 7.4 | Backend: VPC CRUD (list, create, delete, describe/modify attributes, CIDR association) | Done | 2025-06-13 |
| 7.5 | Backend: Subnet CRUD (list, create, delete, modify attributes) | Done | 2025-06-13 |
| 7.6 | Backend: Security group CRUD (list, create, delete, authorize/revoke ingress/egress, rules) | Done | 2025-06-13 |
| 7.7 | Backend: Key pair CRUD (list, create, import, delete) | Done | 2025-06-13 |
| 7.8 | Backend: AMI list (describe images from catalog) | Done | 2025-06-13 |
| 7.9 | Backend: Tags CRUD (create, delete, describe) | Done | 2025-06-13 |
| 7.10 | Backend: Internet gateway CRUD + attach/detach | Done | 2025-06-13 |
| 7.11 | Backend: Route table CRUD + route CRUD + associate/disassociate | Done | 2025-06-13 |
| 7.12 | Backend: NAT gateway CRUD | Done | 2025-06-13 |
| 7.13 | Backend: Elastic IP (allocate, associate, disassociate, release, describe) | Done | 2025-06-13 |
| 7.14 | Backend: Launch template CRUD + version management | Done | 2025-06-13 |
| 7.15 | Backend: Volume CRUD | Done | 2025-06-13 |
| 7.16 | Backend: Network interface list + region/AZ/instance type info | Done | 2025-06-13 |
| 7.17 | Frontend: useEC2 hooks (15 query/mutation hooks) | Done | 2025-06-13 |
| 7.18 | Frontend: EC2 dedicated page with 13 tabs (Instances, VPCs, Subnets, SGs, Key Pairs, AMIs, Tags, IGWs, Route Tables, NAT Gateways, Elastic IPs, Launch Templates, Volumes) | Done | 2025-06-13 |
| 7.19 | Frontend: Instances tab — List with state, Create modal, Start/Stop/Reboot/Terminate actions, Detail view | Done | 2025-06-13 |
| 7.20 | Frontend: Instance detail — Full info, security groups, block devices, tags | Done | 2025-06-13 |
| 7.21 | Frontend: VPC tab — List, create, detail, delete, CIDR association, VPC endpoints | Done | 2025-06-13 |
| 7.22 | Frontend: Security Groups tab — List, create, detail (inbound/outbound rules display) | Done | 2025-06-13 |
| 7.23 | Frontend: Key Pairs, Elastic IPs, Volumes, Launch Templates, Subnets, NAT Gateways, Route Tables, Internet Gateways tabs — each with list + create + delete | Done | 2025-06-13 |
| 7.24 | Frontend: Network topology view (VPC -> Subnets -> Instances visual) | Done | 2026-06-20 |
| 7.25 | Verify: typecheck + build pass | Done | 2025-06-13 |
| 7.26 | Backend: EC2 web terminal — WebSocket server + Docker Engine API with Tty=true for interactive bash | Done | 2025-06-14 |
| 7.27 | Frontend: EC2Terminal component — xterm.js terminal with WebSocket, resize, reconnect | Done | 2025-06-14 |
| 7.28 | Frontend: Instance detail "Connect" button + terminal modal | Done | 2025-06-14 |
| 7.29 | Frontend: Filter terminated instances from list view | Done | 2025-06-14 |
| 7.30 | Verify: typecheck + build + terminal works interactively | Done | 2025-06-14 |

#### 3C — ECS (50+ operations)

| # | Task | Status | Date |
|---|------|--------|------|
| 8.1 | Consult Floci ECS source for supported operations | Done | 2025-06-17 |
| 8.2 | Backend: Cluster CRUD (list, create, describe, delete, update) | Done | 2025-06-17 |
| 8.3 | Backend: Task definition CRUD (register, describe, list families, list versions, deregister) | Done | 2025-06-17 |
| 8.4 | Backend: Task operations (run, start, stop, describe, list, protection) | Done | 2025-06-17 |
| 8.5 | Backend: Service CRUD (create, update, delete, describe, list) | Done | 2025-06-17 |
| 8.6 | Backend: Container instance operations (list, describe, deregister) | Done | 2025-06-17 |
| 8.7 | Frontend: useECS hooks | Done | 2025-06-17 |
| 8.8 | Frontend: ECS page — Clusters tab (list with task/service counts) | Done | 2025-06-17 |
| 8.9 | Frontend: Cluster detail — Services tab + Tasks tab + Container Instances tab | Done | 2025-06-17 |
| 8.10 | Frontend: Task Definitions tab (family list, version browser, container spec viewer) | Done | 2025-06-17 |
| 8.11 | Frontend: Service create/edit (desired count slider, task def selector) | Done | 2025-06-17 |
| 8.12 | Verify: typecheck + build pass | Done | 2025-06-17 |

---

### Phase 4: Security Services

#### 4A — IAM (72 operations) + STS (7 operations) — dedicated page

| # | Task | Status | Date |
|---|------|--------|------|
| 9.1 | Consult Floci IAM source for supported operations | Done | 2025-06-14 |
| 9.2 | Backend: User CRUD (list, create, get, update, delete, tags) | Done | 2025-06-14 |
| 9.3 | Backend: Group CRUD (list, create, get, delete, add/remove user) | Done | 2025-06-14 |
| 9.4 | Backend: Role CRUD (list, create, get, update, delete, update assume role policy, tags) | Done | 2025-06-14 |
| 9.5 | Backend: Managed policy CRUD (list, create, get, delete, version CRUD, set default, tags) | Done | 2025-06-14 |
| 9.6 | Backend: Policy attachments (attach/detach/list for user, group, role) | Done | 2025-06-14 |
| 9.7 | Backend: Inline policy CRUD (put/get/delete/list for user, group, role) | Done | 2025-06-14 |
| 9.8 | Backend: Access keys (create, delete, list, update status per user) | Done | 2025-06-14 |
| 9.9 | Backend: Instance profiles (create, get, delete, list, add/remove role) | Done | 2025-06-14 |
| 9.10 | Backend: Permission boundaries (put/delete for user and role) | Done | 2025-06-17 |
| 9.11 | Backend: STS operations (get caller identity, assume role, session token) | Done | 2025-06-17 |
| 9.12 | Frontend: useIAM hooks | Done | 2025-06-14 |
| 9.13 | Frontend: IAM dedicated page with tabs (Users, Groups, Roles, Policies) | Done | 2025-06-14 |
| 9.14 | Frontend: Users tab — List, create, detail (groups, attached policies, inline policies, access keys, tags) | Done | 2025-06-14 |
| 9.15 | Frontend: Groups tab — List, create, detail (members, attached policies, inline policies) | Done | 2025-06-14 |
| 9.16 | Frontend: Roles tab — List, create, detail (trust policy editor, attached policies, inline policies, instance profiles) | Done | 2025-06-14 |
| 9.17 | Frontend: Policies tab — List (All/AWS/Local scope), create (JSON editor), detail (versions, attachments) | Done | 2025-06-14 |
| 9.18 | Frontend: Access key create modal (show secret once with copy) | Done | 2025-06-14 |
| 9.19 | Frontend: JSON policy editor component (shared across all tabs) | Done | 2025-06-14 |
| 9.20 | Verify: typecheck + build pass | Done | 2025-06-14 |

#### 4B — KMS (35 operations)

| # | Task | Status | Date |
|---|------|--------|------|
| 10.1 | Consult Floci KMS source for supported operations | Done | 2025-06-14 |
| 10.2 | Backend: Key CRUD (create, describe, list, schedule deletion, cancel deletion) | Done | 2025-06-14 |
| 10.3 | Backend: Key management (update description, enable/disable, rotation) | Done | 2025-06-14 |
| 10.4 | Backend: Alias CRUD (create, delete, list) | Done | 2025-06-14 |
| 10.5 | Backend: Grant CRUD (create, list, revoke, retire) | Done | 2025-06-14 |
| 10.6 | Backend: Crypto operations (encrypt, decrypt, re-encrypt, generate data key, sign, verify, generate MAC, verify MAC, generate random, get public key) | Done | 2025-06-14 |
| 10.7 | Backend: Key policy + tags | Done | 2025-06-14 |
| 10.8 | Frontend: useKMS hooks | Done | 2025-06-14 |
| 10.9 | Frontend: KMS page — Keys tab (list, create, detail with state/rotation) | Done | 2025-06-14 |
| 10.10 | Frontend: Key detail — Aliases tab, Grants tab, Tags tab, Policy tab | Done | 2025-06-14 |
| 10.11 | Frontend: Key detail — Crypto playground (encrypt/decrypt, sign/verify, MAC, generate random) | Done | 2025-06-14 |
| 10.12 | Verify: typecheck + build pass | Done | 2025-06-14 |

#### 4C — Secrets Manager (18 operations)

| # | Task | Status | Date |
|---|------|--------|------|
| 11.1 | Consult Floci Secrets Manager source for supported operations | Done | 2025-06-15 |
| 11.2 | Backend: Secret CRUD (list, create, describe, update, delete, restore, rotate) | Done | 2025-06-15 |
| 11.3 | Backend: Secret value (get, put) + version history + stage management | Done | 2025-06-15 |
| 11.4 | Backend: Resource policy + random password + batch get + tags | Done | 2025-06-15 |
| 11.5 | Frontend: useSecretsManager hooks | Done | 2025-06-15 |
| 11.6 | Frontend: Secrets page — List (description, rotation status, create, delete) | Done | 2025-06-15 |
| 11.7 | Frontend: Secret detail — Value tab (masked/reveal toggle), Versions tab (history, stage), Policy tab | Done | 2025-06-15 |
| 11.8 | Verify: typecheck + build pass | Done | 2025-06-15 |

---

### Phase 5: Networking Services

#### 5A — Route 53

| # | Task | Status | Date |
|---|------|--------|------|
| 12.1 | Consult Floci Route53 source for supported operations | Done | 2025-06-17 |
| 12.2 | Backend: GET /api/aws/route53/hosted-zones | Done | 2025-06-17 |
| 12.3 | Backend: POST /api/aws/route53/hosted-zones | Done | 2025-06-17 |
| 12.4 | Backend: DELETE /api/aws/route53/hosted-zones/:id | Done | 2025-06-17 |
| 12.5 | Backend: GET /api/aws/route53/hosted-zones/:id/record-sets | Done | 2025-06-17 |
| 12.6 | Frontend: useRoute53 hooks | Done | 2025-06-17 |
| 12.7 | Frontend: Route53 page (hosted zones + record sets) | Done | 2025-06-17 |
| 12.8 | Verify: typecheck + build pass | Done | 2025-06-17 |

#### 5B — API Gateway

| # | Task | Status | Date |
|---|------|--------|------|
| 13.1 | Consult Floci API Gateway source for supported operations | Done | 2025-06-17 |
| 13.2 | Backend: GET /api/aws/apigateway/rest-apis | Done | 2025-06-17 |
| 13.3 | Backend: POST /api/aws/apigateway/rest-apis | Done | 2025-06-17 |
| 13.4 | Backend: DELETE /api/aws/apigateway/rest-apis/:id | Done | 2025-06-17 |
| 13.5 | Backend: GET /api/aws/apigateway/rest-apis/:id/resources | Done | 2025-06-17 |
| 13.6 | Frontend: useAPIGateway hooks | Done | 2025-06-17 |
| 13.7 | Frontend: API Gateway page | Done | 2025-06-17 |
| 13.8 | Verify: typecheck + build pass | Done | 2025-06-17 |

---

### Phase 6: Management & Monitoring Services

#### 6A — CloudWatch Logs (18 operations) — DONE

| # | Task | Status | Date |
|---|------|--------|------|
| 14.1 | Consult Floci CloudWatch Logs source for supported operations | Done | 2025-06-14 |
| 14.2 | Backend: GET /api/aws/logs/log-groups (list, prefix filter) | Done | 2025-06-14 |
| 14.3 | Backend: POST /api/aws/logs/log-groups (create with tags/KMS) | Done | 2025-06-14 |
| 14.4 | Backend: DELETE /api/aws/logs/log-groups/:name | Done | 2025-06-14 |
| 14.5 | Backend: PUT/DELETE /api/aws/logs/log-groups/:name/retention | Done | 2025-06-14 |
| 14.6 | Backend: GET /api/aws/logs/log-groups/:name/streams (list, prefix, order by LastEventTime) | Done | 2025-06-14 |
| 14.7 | Backend: POST/DELETE stream CRUD | Done | 2025-06-14 |
| 14.8 | Backend: GET events (with pagination, time range, limit) | Done | 2025-06-14 |
| 14.9 | Backend: POST log events (put with sequence token) | Done | 2025-06-14 |
| 14.10 | Backend: POST filter-events (pattern, time range, stream names) | Done | 2025-06-14 |
| 14.11 | Backend: Subscription filters (list, create, delete) | Done | 2025-06-14 |
| 14.12 | Backend: Tags CRUD (list, tag, untag) | Done | 2025-06-14 |
| 14.13 | Frontend: useLogs hooks (17 hooks: groups, streams, events, filters, tags) | Done | 2025-06-14 |
| 14.14 | Frontend: Log groups list with search, create modal, delete | Done | 2025-06-14 |
| 14.15 | Frontend: Log group detail — streams tab (list, create, delete) | Done | 2025-06-14 |
| 14.16 | Frontend: Log stream detail — Live log viewer (timestamped, auto-refresh, auto-scroll, refresh, limit selector) | Done | 2025-06-14 |
| 14.17 | Frontend: Retention config tab (selector with all durations, save/remove) | Done | 2025-06-14 |
| 14.18 | Frontend: Subscription filters tab (list, create with destination ARN, delete) | Done | 2025-06-14 |
| 14.19 | Frontend: Tags tab (table viewer, add tag, remove tag) | Done | 2025-06-14 |
| 14.20 | Verify: typecheck passes | Done | 2025-06-14 |

**What's next:** CloudWatch Metrics (monitoring) — alarms, metric data, charts

#### 6B — CloudFormation

| # | Task | Status | Date |
|---|------|--------|------|
| 15.1 | Consult Floci CloudFormation source for supported operations | Done | 2025-06-15 |
| 15.2 | Backend: GET /api/aws/cloudformation/stacks | Done | 2025-06-15 |
| 15.3 | Backend: POST /api/aws/cloudformation/stacks (create stack) | Done | 2025-06-15 |
| 15.4 | Backend: DELETE /api/aws/cloudformation/stacks/:name | Done | 2025-06-15 |
| 15.5 | Backend: GET /api/aws/cloudformation/stacks/:name (describe) | Done | 2025-06-15 |
| 15.6 | Frontend: useCloudFormation hooks | Done | 2025-06-15 |
| 15.7 | Frontend: CloudFormation page (stack list + detail) | Done | 2025-06-15 |
| 15.8 | Verify: typecheck + build pass | Done | 2025-06-15 |

#### 6C — SSM (Systems Manager)

| # | Task | Status | Date |
|---|------|--------|------|
| 16.1 | Consult Floci SSM source for supported operations | Done | 2025-06-17 |
| 16.2 | Backend: GET /api/aws/ssm/parameters | Done | 2025-06-17 |
| 16.3 | Backend: POST /api/aws/ssm/parameters (put parameter) | Done | 2025-06-17 |
| 16.4 | Backend: DELETE /api/aws/ssm/parameters/:name | Done | 2025-06-17 |
| 16.5 | Backend: GET parameter detail, GET history, tags CRUD | Done | 2025-06-17 |
| 16.6 | Frontend: useSSM hooks | Done | 2025-06-17 |
| 16.7 | Frontend: SSM page (parameter list + create/delete + detail with version history) | Done | 2025-06-17 |
| 16.8 | Verify: typecheck + build pass | Done | 2025-06-17 |

---

### Phase 7: Remaining Services (list-only / minimal CRUD)

Each remaining service gets a standard list + create + delete pattern.

**State:** 46-tracker items (17.42 removed as DUP of 17.35, 17.46 added for ElastiCache, 17.47 added for MemoryDB). **All 46 Done.** 66 services. All 66 Floci services implemented!

| # | Service | Backend | Frontend | Status | Date |
|---|---------|---------|----------|--------|------|
| 17.1 | EKS | Done | Done | Done | 2025-06-18 |
| 17.2 | ECR | Done | Done | Done | 2025-06-18 |
| 17.3 | Auto Scaling | Done | Done | Done | 2025-06-18 |
| 17.4 | RDS | Done | Done | Done | 2025-06-13 |
| 17.5 | Neptune | Done | Done | Done | 2025-06-18 |
| 17.6 | CloudFormation | Done | Done | Done | 2025-06-14 |
| 17.7 | ELB | Done | Done | Done | 2025-06-18 |
| 17.8 | CloudFront | Done | Done | Done | 2025-06-18 |
| 17.9 | API Gateway V2 | Done | Done | Done | 2025-06-18 |
| 17.10 | AppSync | Done | Done | Done | 2025-06-17 |
| 17.11 | Kinesis | Done | Done | Done | 2025-06-18 |
| 17.12 | EventBridge Pipes | Done | Done | Done | 2025-06-18 |
| 17.13 | EventBridge Scheduler | Done | Done | Done | 2025-06-17 |
| 17.14 | SES (email) | Done | Done | Done | 2025-06-18 |
| 17.15 | STS | Done | Done | Done | 2025-06-18 |
| 17.16 | Cognito | Done | Done | Done | 2025-06-18 |
| 17.17 | ACM | Done | Done | Done | 2025-06-18 |
| 17.18 | Config | Done | Done | Done | 2025-06-18 |
| 17.19 | AppConfig | Done | Done | Done | 2025-06-18 |
| 17.20 | CloudTrail | Done | Done | Done | 2025-06-18 |
| 17.21 | Cloud Map (service discovery) | Done | Done | Done | 2025-06-18 |
| 17.22 | Athena | Done | Done | Done | 2025-06-18 |
| 17.23 | Glue | Done | Done | Done | 2025-06-18 |
| 17.24 | Firehose | Done | Done | Done | 2025-06-18 |
| 17.25 | Step Functions (states) | Done | Done | Done | 2025-06-18 |
| 17.26 | MSK (kafka) | Done | Done | Done | 2025-06-18 |
| 17.27 | OpenSearch (es) | Done | Done | Done | 2025-06-18 |
| 17.28 | Bedrock Runtime | Done | Done | Done | 2026-06-19 |
| 17.29 | Textract | Done | Done | Done | 2026-06-19 |
| 17.30 | Transcribe | Done | Done | Done | 2026-06-19 |
| 17.31 | Cost Explorer (ce) | Done | Done | Done | 2026-06-19 |
| 17.32 | Cost & Usage Report (cur) | Done | Done | Done | 2026-06-19 |
| 17.33 | BCM Data Exports | Done | Done | Done | 2026-06-19 |
| 17.34 | Pricing | Done | Done | Done | 2026-06-19 |
| 17.35 | Resource Groups Tagging | Done | Done | Done | 2026-06-19 |
| 17.36 | CodeDeploy | Done | Done | Done | 2026-06-19 |
| 17.37 | CodeBuild | Done | Done | Done | 2026-06-19 |
| 17.38 | Backup | Done | Done | Done | 2026-06-19 |
| 17.39 | Transfer Family | Done | Done | Done | 2026-06-19 |
| 17.40 | CloudWatch Metrics (monitoring) | Done | Done | Done | 2025-06-14 |
| 17.41 | AppConfig Data (appconfigdata) — Floci: code lives in `appconfig/` dir, separate service registration, enabled by default | Done | Done | Done | 2026-06-19 |
| ~~17.42~~ | ~~Resource Groups Tagging (tagging) — DUP of 17.35~~ | | | | |
| 17.43 | EC2 Messages (ec2messages) — Floci: code lives in `ssm/` dir, internal sub-service, NOT in status check, enabled with SSM | Done | Done | Done | 2026-06-19 |
| 17.44 | Verify: all services typecheck + build pass | Done | — | Done | 2026-06-19 |
| 17.45 | WAF v2 (wafv2) | Done | Done | Done | 2026-06-19 |
| 17.46 | ElastiCache (elasticache) — Floci: full CRUD (Replication Groups, Cache Clusters, Users) — spec exists in PLAN.md but no code | Done | Done | Done | 2026-06-19 |
| 17.47 | MemoryDB (memorydb) — Floci: clusters CRUD + tags, SDK: @aws-sdk/client-memorydb@3.1073.0 | Done | Done | Done | 2026-06-21 |

---

### Phase 8: UI/UX Enhancements

| # | Task | Status | Date |
|---|------|--------|------|
| 18.1 | Dashboard Home: Add recent activity feed (localStorage-backed) | Done | 2026-06-19 |
| 18.2 | Dashboard Home: Add quick actions panel (enhanced with 9 services) | Done | 2026-06-19 |
| 18.3 | Dashboard Home: Add resource count summary per service (backend route + frontend cards) | Done | 2026-06-19 |
| 18.4 | All pages: Add loading skeletons (TableSkeleton, CardsSkeleton, DetailSkeleton, DashboardSkeleton components) | Done | 2026-06-20 |
| 18.5 | All pages: Improve empty states with illustrations (EmptyState component with icon, title, description, action) | Done | 2026-06-20 |
| 18.6 | Side nav: Add search/filter for services | Done | 2026-06-19 |
| 18.7 | Side nav: Collapse/expand categories (Expand all / Collapse all toggle) | Done | 2026-06-19 |
| 18.8 | Top nav: Add global search bar (Autosuggest with all services) | Done | 2026-06-19 |
| 18.9 | Top nav: Add notification bell for errors (bell icon with badge, Modal listing non-running services) | Done | 2026-06-19 |
| 18.10 | Settings: Add localStorage persistence for preferences | Done | 2026-06-19 |
| 18.11 | Settings: Add Floci endpoint URL configuration (mutable config store, GET/PUT routes, Settings UI) | Done | 2026-06-20 |
| 18.12 | Responsive: Test and fix mobile layout | Done | 2026-06-20 |
| 18.13 | Accessibility: Keyboard navigation audit | Done | 2026-06-20 |
| 18.14 | Accessibility: ARIA labels audit (labeled search inputs, toggle, skip link, content area) | Done | 2026-06-20 |
| 18.15 | Create PropertyTable reusable component — key-value detail table (3 variants: horizontal, grid, compact) with href support and tests | Done | 2026-07-04 |
| 18.16 | Create ServiceDashboardLayout wrapper — unified tab navigation with loading/error/empty state handling, refactor RDS/ECS/Route53/SSM dashboards to use it | Done | 2026-07-04 |
| 18.17 | Replace inline `<table>` tags in EC2 instance/VPC detail and RDS instance/cluster detail with PropertyTable (eliminates ~80 lines of duplicated inline styles) | Done | 2026-07-04 |
| 18.18 | Add card hover transitions (`.fd-accent-card:hover` translateY + box-shadow) and Cmd+K keyboard shortcut to focus global search input | Done | 2026-07-04 |

---

### Phase 9: Production Readiness

| # | Task | Status | Date |
|---|------|--------|------|
| 19.1 | Error boundary: Add React error boundary component | Done | 2026-06-20 |
| 19.2 | Error handling: Global API error interceptor with toast notifications | Done | 2026-06-20 |
| 19.3 | Performance: Lazy-load service pages with React.lazy | Done | 2026-06-20 |
| 19.4 | Performance: Add TanStack Query devtools (dev only) | Done | 2026-06-20 |
| 19.5 | Security: Add CSP headers in production | Done | 2026-06-20 |
| 19.6 | Security: Sanitize all user inputs on backend | Done | 2026-06-20 |
| 19.7 | Docker: Optimize production image size | Done | 2026-06-20 |
| 19.8 | Docker: Add health check endpoint to dashboard container | Done | 2026-06-20 |
| 19.9 | CI: Add GitHub Actions for typecheck + build | Done | 2025-06-15 |
| 19.10 | Final: Full docker:prod test with all services | Done | 2026-06-20 |

---

### Phase 10: Test Infrastructure & CI/CD

| # | Task | Status | Date |
|---|------|--------|------|
| 20.1 | Create shared test infrastructure (setup.ts, helpers.tsx) | Done | 2025-06-15 |
| 20.2 | Update vitest config (setup files, coverage thresholds) | Done | 2025-06-15 |
| 20.3 | Refactor existing tests to use shared helpers | Done | 2025-06-15 |
| 20.4 | Add 4 missing backend test files (cloudformation, cloudwatch, kms, logs) | Done | 2025-06-15 |
| 20.5 | Add 3 missing frontend test files (CloudFormationPage, KMSPage, SecretsManagerPage) | Done | 2025-06-15 |
| 20.6 | Update CI workflow with Docker build + publish job | Done | 2025-06-15 |
| 20.7 | Create release workflow for GHCR semver tags | Done | 2025-06-15 |
| 20.8 | Update README with CI badge, Docker pull instructions, test section | Done | 2025-06-15 |
| 20.9 | Verify: typecheck + 389 tests pass + coverage thresholds met | Done | 2025-06-15 |

---

### Phase 11: Coverage Improvements & CI Versioning

| # | Task | Status | Date |
|---|------|--------|------|
| 21.1 | Write tests for small 0% files (system.ts, inspection.ts, active.ts, aws/index.ts) | Done | 2025-06-15 |
| 21.2 | Verify: 18 new tests pass (407 total), typecheck passes | Done | 2025-06-15 |
| 21.3 | Change CI Docker tag from sha-<short> to auto-incrementing 0.0.x (${{ github.run_number }}) | Done | 2025-06-15 |
| 21.4 | Create combined Floci+Dashboard Dockerfile (docker/Dockerfile.combined) | Done | 2025-06-15 |
| 21.5 | Create combined startup script (docker/combined-start.sh) | Done | 2025-06-15 |
| 21.6 | Update CI/CD to build + push combined image with -combined tags | Done | 2025-06-15 |
| 21.7 | Verify: combined image builds and runs both services | Done | 2025-06-15 |
| 21.8 | Remaining 0%-coverage files: ec2-terminal.ts (10 tests), dynamodb-advanced.ts (19 tests), rds.ts (29 tests), s3-config.ts (47 tests), s3-objects.ts (12 tests) | Done | 2025-06-16 |
| 21.9 | Deepen low-coverage frontend pages: S3Page, SQSPage, KMSPage, ServicePage, EC2Page | Done | 2025-06-16 |
| 21.a | Coverage: 64.07% stmts / 49.35% branch / 48.60% funcs / 66.67% lines — thresholds: 45% / 40% / 35% / 45% | Done | 2025-06-16 |
| 21.b | Deepen remaining frontend pages: EventsPage, SecretsManagerPage, CloudFormationPage, SNSPage, IAMPage, LambdaPage | Done | 2025-06-16 |

### Phase 12: Deep Coverage (Hooks + Components + Expanded Include)

| # | Task | Status | Date |
|---|------|--------|------|
| 22.1 | Expand coverage include to all source files, fix PARSE_ERROR with extension-specific globs | Done | 2026-06-16 |
| 22.2 | Write tests for frontend shared lib: utils.ts (12 tests), client.ts (7 tests) | Done | 2026-06-16 |
| 22.3 | Deepen backend route tests: dynamodb query (14), s3 upload/edge (6), iam depth (13), sns depth (13), lambda depth (7), sqs depth (12) | Done | 2026-06-16 |
| 22.4 | Deepen frontend pages: CloudWatchPage (+8, total 13), EC2Page (+68, total 82), ServicePage (+35, total 46) | Done | 2026-06-16 |
| 22.5 | Write hook test files for all 18 hooks (383 tests across useKMS, useCloudWatch, useEC2, useS3, useDynamoDB, useRDS, useSNS, useSQS, useLambda, useIAM, useLogs, useEvents, useService, useSystem, useSecrets, useKMS, useCloudFormation, useS3Config, useDynamoDBAdvanced) | Done | 2026-06-16 |
| 22.6 | Fix useCloudWatch `useMetricStatistics` test timeout (vi.waitFor vs waitFor from testing-library) | Done | 2026-06-16 |
| 22.7 | Switch coverage provider from v8 to istanbul and back — v8 fixed with extension-specific include patterns | Done | 2026-06-16 |
| 22.8 | Raise coverage thresholds: 55/45/38/57 → 68/48/60/70 to lock in gains | Done | 2026-06-16 |
| 22.9 | Verify: 1247 unit tests pass, typecheck clean, coverage thresholds met | Done | 2026-06-16 |
| 22.a | Write component tests for high-impact files: DynamoDBTableDetail (22 tests), S3BucketConfig (24 tests), AppLayoutShell (14 tests) | Done | 2026-06-16 |
| 22.b | Write tests for backend entry files (index.ts, types.ts) | Done | 2026-06-20 |
| 22.c | Re-check Codecov number, iterate if below target | Done | 2026-06-20 |

| 22.d | S3VectorsDashboard — fix 3 failing tests (15 pass), improve Query button targeting for duplicate matches | Done | 2026-07-06 |
| 22.e | IoTDashboard — fix 3 failing tests (51 pass), improve coverage 35.05% → 67.81% branch (+32.76pp) | Done | 2026-07-06 |
| 22.f | ECSDashboard — add 17+ tests on cluster detail (loading, filters, stop task, delete service, fallbacks), branch 38.75% → 62.50% (+23.75pp) | Done | 2026-07-06 |
| 22.g | ElasticBeanstalkDashboard — add 10+ tests on cancel modals, error alerts (vi.spyOn), filter, health variants, deselect (29 total) | Done | 2026-07-06 |
| 22.h | AppSyncDashboard — add 14 tests on detail tabs (data sources, resolvers, types, keys, functions), loading, fallbacks, branch 41.33% → 58.66% (+17.33pp) | Done | 2026-07-06 |
| 22.i | CodePipelineDashboard — add 22 tests on stage states, webhooks, action types, filters, cancel modals, branch 45.54% → ~50% (+~5pp) | Done | 2026-07-06 |
| 22.j | Fix pre-existing TS2345 typecheck error in lambda.ts — decodeURIComponent(c.req.param("arn")) ?? "" | Done | 2026-07-06 |

---

### Phase 13: E2E Integration Test Expansion

| # | Task | Status | Date |
|---|------|--------|------|
| 23.1 | Add KMS integration tests (keys, aliases, encrypt/decrypt, tags, schedule/cancel deletion) | Done | 2026-06-20 |
| 23.2 | Add SSM integration tests (parameters, versions, SecureString, tags) | Done | 2026-06-20 |
| 23.3 | Add Route53 integration tests (hosted zones, record sets, CRUD) | Done | 2026-06-20 |
| 23.4 | Add ECR integration tests (repositories, list, create, delete) | Done | 2026-06-20 |
| 23.5 | Add SES integration tests (email identities, verify, list, get, delete) | Done | 2026-06-20 |
| 23.6 | Add Kinesis integration tests (streams, shards, put records, batch records) | Done | 2026-06-20 |
| 23.7 | Add Cognito integration tests (user pools, users, groups, app clients) | Done | 2026-06-20 |
| 23.8 | Add ACM integration tests (certificates, request, list, describe, delete) | Done | 2026-06-20 |
| 23.9 | Add API Gateway integration tests (REST APIs, resources, CRUD) | Done | 2026-06-20 |
| 23.10 | Add Step Functions integration tests (state machines, executions, IAM role setup) | Done | 2026-06-20 |
| 23.11 | Add ECS integration tests (clusters, task definitions, full lifecycle) | Done | 2026-06-20 |
| 23.12 | Add Athena integration tests (work groups, data catalogs, databases) | Done | 2026-06-20 |
| 23.13 | Add ELB integration tests (load balancers, target groups, listeners, tags, 2-AZ subnets) | Done | 2026-06-20 |
| 23.14 | Add EKS integration tests (cluster CRUD with IAM role) | Done | 2026-06-20 |
| 23.15 | Add RDS integration tests (DB instances, parameter groups, clusters) | Done | 2026-06-20 |
| 23.16 | Add Auto Scaling integration tests (ASG CRUD, launch templates, scaling policies) | Done | 2026-06-20 |

### Phase 13: Remaining Floci Services (4 services)

Implement the 4 Floci services not yet covered by the dashboard. Each follows the standard pattern: backend route file → frontend hooks → ServicePage dashboard component → tests.

| # | Task | Status | Date |
|---|------|--------|------|
| 23.1 | **AWS Batch** — Compute environments, job queues, job definitions, jobs. Install `@aws-sdk/client-batch`, create routes/batch.ts with list+create+delete for all 4 resource types, create hooks/useBatch.ts, add BatchDashboard to ServicePage, write tests | Done | 2026-06-20 |
| 23.2 | **DocumentDB** — Clusters (create/describe/delete/modify) and instances (create/describe/delete/modify). Routes via `@aws-sdk/client-docdb`, hooks/useDocDB.ts, DocDBDashboard component, tests | Done | 2026-06-20 |
| 23.3 | **Amazon EMR** — Clusters (run/describe/terminate), steps (add/describe/cancel), instance groups/fleets, security configs. Install `@aws-sdk/client-emr`, routes/emr.ts, hooks/useEMR.ts, EMRDashboard component, tests | Done | 2026-06-20 |
| 23.4 | **RDS Data API** — ExecuteStatement, ExecuteSql, BeginTransaction, CommitTransaction, RollbackTransaction. Install `@aws-sdk/rds-data`, routes/rdsdata.ts, hooks/useRDSData.ts, RDSDataDashboard component, tests | Done | 2026-06-20 |
| 23.5 | Verify: typecheck + all tests pass + coverage thresholds met. Update README with newly implemented services and remove from "Coming soon" | Done | 2026-06-20 |

---

### Phase 14: Remaining Floci Services (4 services — July 2026 Floci audit)

Discovered during a full audit of Floci's 66 service directories (July 2026). Each follows the standard pattern: backend route file → frontend hooks → ServicePage dashboard component → tests.

| # | Task | Status | Date |
|---|------|--------|------|
| 24.1 | **CodePipeline (codepipeline)** — 20+ operations: pipelines, executions, stage transitions, approvals, action executions, action types, webhooks, tags. Full implementation: backend route, useCodePipeline hooks, CodePipelineDashboard with tabs (Pipelines/Webhooks/Action Types), Create/Delete/Start/Stop/Retry, backend tests (31) + frontend tests (21). | Done | 2026-07-02 |
| 24.2 | **S3 Vector Search (s3vectors)** — Vector buckets, indexes, vector data. Direct HTTP (raw POST endpoints). | Done | 2026-06-22 |
| 24.3 | **Elastic Beanstalk (elasticbeanstalk)** — 14 ops: applications (Create/Describe/Update/Delete), versions (Create/Describe/Delete), environments (Create/Describe/Update/Terminate), config settings, DNS availability, solution stacks. Protocol: QUERY. Installed `@aws-sdk/client-elastic-beanstalk`, created `routes/elasticbeanstalk.ts`, `hooks/useElasticBeanstalk.ts`, `ElasticBeanstalkDashboard.tsx` (registered in `serviceRegistry.tsx`), tests. See `../floci/src/main/java/io/github/hectorvent/floci/services/elasticbeanstalk/`. | Done | 2026-07-02 |
| 24.4 | **IoT Core (iot)** — 20+ ops: things (CRUD with attributes/types), certificates (create keys+bundle, activate/deactivate/revoke), policies (CRUD + versions + attachments), shadows (get/update/delete), topic rules (SQL queries + actions), jobs (CRUD + cancel), tags. Protocol: REST_JSON. Installed `@aws-sdk/client-iot` + `@aws-sdk/client-iot-data-plane`. Created `routes/iot.ts` (85 backend tests, 100% branch coverage), `hooks/useIoT.ts` (54 hook tests, 95.65% stmts coverage), `IoTDashboard.tsx` (component tests - 21 tests all passing; 6 pre-existing failures fixed). | Done | 2026-07-04 |
| 24.5 | Verify: typecheck + all tests pass + coverage thresholds met. Update README ("62 services" → "66 services", add new service specs to tables). | Done | 2026-07-02 |

---

## Floci Repo Notes

- **Official dashboard in Floci:** The Floci repo at `../floci` now has an untracked `dashboard/` directory — a separate Node/Express + React dashboard (`../floci/dashboard/`). Not committed to Floci's main branch yet. This is independent from this project.
- **Floci service layout:** `appconfigdata` lives inside `appconfig/` dir. `ec2messages` lives inside `ssm/` dir. `resourcegroupstagging` is implemented as `resourcegroupstagging/` but registered as `tagging`. All three are enabled by default (except `tagging` which is NOT enabled in `application.yml`).
- **66 Floci services total** (including `floci` internal). **65 implemented in the dashboard** (the `floci` service is Floci's own internal management service and does not need a dashboard UI). All services from the Phase 14 audit — `codepipeline`, `elasticbeanstalk`, `iot` — are implemented (see Phase 14).
- **No Floci changes.** Dashboard uses existing endpoints only — never edit `../floci`.

## Conventions

- **Look up Floci first.** Before implementing any service feature, consult `../floci/src/main/java/io/github/hectorvent/floci/services/{service}/`.
- **Docker-first.** Every operation runs inside a container.
- **One service at a time.** S3 -> DynamoDB -> SQS -> SNS -> Lambda -> ...
- **Backend first, verify, then frontend.** Write routes, run typecheck, then build UI.
- **Commits:** Conventional commits.
- **Verify after each service:** `pnpm run typecheck` must pass before moving to next service.

---

## Development Workflow

```bash
# Start development (Floci + Dashboard with hot reload)
pnpm run dev

# Run typecheck
pnpm run typecheck

# Build for production
pnpm run build

# Start production
pnpm start

# Docker development
npm run docker:dev
npm run docker:down
```

### Phase 15: Dashboard Test Coverage Deepening (July 2026)

Deepen branch coverage on low-coverage dashboard component test files using `vi.hoisted` mutable state + reactive getters pattern.

**Batch 1 — CodeBuild, AutoScaling, S3Vectors, DocDB** (2026-07-07)

| # | Task | Status | Date |
|---|------|--------|------|
| 25.1 | CodeBuildDashboard — add `vi.hoisted` createProjectState, error alert test, createdAt date branch test | Done | 2026-07-07 |
| 25.2 | AutoScalingDashboard — add `vi.hoisted` deleteGroupState, isPending/variables test | Done | 2026-07-07 |
| 25.3 | S3VectorsDashboard — add putVectors/query error alert tests, vector data preview test | Done | 2026-07-07 |
| 25.4 | DocDBDashboard — add `vi.hoisted` createClusterState + createInstanceState, error alert tests | Done | 2026-07-07 |
| 25.5 | Verify: 55 tests pass, typecheck clean, all 56 dashboard test files pass (689→701 tests) | Done | 2026-07-07 |

**Batch 2 — ECS, ELB** (2026-07-07)

| # | Task | Status | Date |
|---|------|--------|------|
| 25.6 | ECSDashboard — add 5 `vi.hoisted` states (createCluster/createService/runTask/deleteCluster/deleteService) + error alert + loading tests (27→32 tests) | Done | 2026-07-07 |
| 25.7 | ELBDashboard — add 4 `vi.hoisted` states (createLB/deleteLB/createTG/deleteTG) + loading state tests (7→11 tests) | Done | 2026-07-07 |
| 25.8 | Verify: 43 tests pass (32 ECS + 11 ELB), typecheck clean | Done | 2026-07-07 |

**Batch 3 — CloudTrail, ElastiCache, Cognito** (2026-07-07)

| # | Task | Status | Date |
|---|------|--------|------|
| 25.9 | CloudTrailDashboard — add `vi.hoisted` deleteTrailState + loading test (8→9 tests) | Done | 2026-07-07 |
| 25.10 | ElastiCacheDashboard — add 6 `vi.hoisted` states (createRG/deleteRG/createCC/deleteCC/createUser/deleteUser) + error alert + loading tests (8→14 tests) | Done | 2026-07-07 |
| 25.11 | CognitoDashboard — add `vi.hoisted` deletePoolState + loading test + 4 detail view tests (users/groups/clients/missing-fields) (10→15 tests) | Done | 2026-07-07 |
| 25.12 | EventsDashboard — no separate component exists (rendered inline in EventsPage.tsx) | Skipped | 2026-07-07 |
| 25.13 | Verify: 38 tests pass (9+14+15), typecheck clean, full suite 701 tests | Done | 2026-07-07 |

**Batch 4 — S3 backend sparse-data coverage + upload bug fix** (2026-08-06)

| # | Task | Status | Date |
|---|------|--------|------|
| 25.14 | s3.ts — fix multi-file upload: `parseBody({ all: true })` so repeated `files` fields aren't collapsed to the last file (frontend uploads multiple files under one field name) | Done | 2026-08-06 |
| 25.15 | s3.test.ts — add 17 sparse-data/branch tests (missing Buckets/Contents/CommonPrefixes keys, empty delimiter, octet-stream fallbacks, sparse ACLs, batch-delete/folder-delete pagination, multi-file upload, empty-type fallback) | Done | 2026-08-06 |
| 25.16 | s3.ts — replace unreachable `\|\| ''` fallbacks with `param()!` non-null assertions (codebase convention, keeps branch coverage clean, fixes typecheck) | Done | 2026-08-06 |
| 25.17 | Verify: 62 S3 route tests pass, typecheck clean, full suite 7300 passed (1 integration failure — Floci not running, expected) | Done | 2026-08-06 |
| 25.18 | s3.ts — remove unreachable `file.type \|\| "application/octet-stream"` fallback: busboy always assigns a MIME type (empty types normalize to octet-stream), so the branch is dead code — confirmed empirically via FormData round-trip probe, not a v8 coverage artifact | Done | 2026-08-06 |
| 25.19 | s3.test.ts — add folder-delete DeleteObjects Errors mapping test (last uncovered function); rename octet-stream test to reflect parser normalization | Done | 2026-08-06 |
| 25.20 | Verify: s3.ts reaches **100% stmts/branch/funcs/lines (138/138 branches)**, 63 tests pass, typecheck clean, full suite 7603 passed with Floci up | Done | 2026-08-06 |

**Batch 5 — RGT route branch coverage + RDS integration timeout** (2026-08-06)

| # | Task | Status | Date |
|---|------|--------|------|
| 25.18 | resourcegroupstagging.test.ts — add 7 branch tests (all optional query params forwarded, resourcesPerPage=0 fallback, sparse responses for all 5 endpoints, tags:{} 400) | Done | 2026-08-06 |
| 25.19 | Verify: resourcegroupstagging.ts 73.7%→100% branch, 21 route tests pass | Done | 2026-08-06 |
| 25.20 | integration.test.ts — bump timeout to 30s on slow RDS provisioning tests (DB instance/cluster create) that flaked under full-suite parallel load (10s global timeout) | Done | 2026-08-06 |
| 25.21 | Verify: full suite 7602/7602 passed (269 files), typecheck clean | Done | 2026-08-06 |

**Batch 6 — SES route branch coverage** (2026-08-06)

| # | Task | Status | Date |
|---|------|--------|------|
| 25.22 | ses.ts — replace 21 unreachable `decodeURIComponent(c.req.param(X) \|\| "")` fallbacks with `param(X)!` (routes only match when param present — dead branches) | Done | 2026-08-06 |
| 25.23 | ses.test.ts — add 7 tests: missing Identities key, detail-route DKIM/MailFrom fallbacks, describe without EventDestinations, event-destination 400s (missing matchingEventTypes) + cloudWatch/firehose/SNS destination combinations for POST and PUT | Done | 2026-08-06 |
| 25.24 | Verify: ses.ts 74.41%→**100% branch**, 56 route tests pass, full suite 7610/7610 (269 files), typecheck clean | Done | 2026-08-06 |

**Batch 7 — Bedrock Runtime route branch coverage** (2026-08-06)

| # | Task | Status | Date |
|---|------|--------|------|
| 25.25 | bedrockruntime.test.ts — add invoke test for sparse response (no body → `body: null` ternary fallback on line 43) | Done | 2026-08-06 |
| 25.26 | Verify: bedrockruntime.ts 75%→**100% branch**, 4 route tests pass, full suite 7611/7611 (269 files), typecheck clean | Done | 2026-08-06 |

**Batch 8 — Step Functions route branch coverage** (2026-08-06)

| # | Task | Status | Date |
|---|------|--------|------|
| 25.27 | stepfunctions.test.ts — add 4 tests: 400 when definition missing, sparse responses for executions/events/activities (`\|\| []` fallbacks) | Done | 2026-08-06 |
| 25.28 | Verify: stepfunctions.ts 75%→**100% branch**, 21 route tests pass, full suite 7615/7615 (269 files), typecheck clean | Done | 2026-08-06 |

**Batch 9 — EC2 Messages route branch coverage** (2026-08-06)

| # | Task | Status | Date |
|---|------|--------|------|
| 25.29 | ec2messages.test.ts — add 4 tests: Floci error responses (`!res.ok` throw + `text \|\| statusText` fallbacks), empty body → `{}`, fail message defaults `FailureType` to "Unknown" | Done | 2026-08-06 |
| 25.30 | Verify: ec2messages.ts 75%→**100% branch**, 16 route tests pass, full suite 7619/7619 (269 files), typecheck clean | Done | 2026-08-06 |

**Batch 10 — CodePipeline route branch coverage** (2026-08-06)

| # | Task | Status | Date |
|---|------|--------|------|
| 25.31 | codepipeline.ts — replace 44 unreachable `decodeURIComponent(c.req.param(X) \|\| "")` fallbacks with `param(X)!` + remove 25 unreachable param-validation guards (`if (!name)` etc. — URL params never decode empty; empty segments 404 before routing) | Done | 2026-08-06 |
| 25.32 | Verify: codepipeline.ts 75.62%→**100% branch**, 115 route tests pass, full suite 7619/7619 (269 files), typecheck clean | Done | 2026-08-06 |

**Batch 11 — EC2 Flow Logs route branch coverage** (2026-08-06)

| # | Task | Status | Date |
|---|------|--------|------|
| 25.33 | ec2-flow-logs.test.ts — add 4 sparse-response tests (missing FlowLogs key, flow log without CreationTime/Tags, create/delete responses without FlowLogIds/Unsuccessful) | Done | 2026-08-06 |

**Batch 12 — CE + EventBridge Scheduler route branch coverage** (2026-08-07)

| # | Task | Status | Date |
|---|------|--------|------|
| 25.34 | ce.test.ts — convert 8 empty-result mocks to sparse responses (ResultsByTime/DimensionValues/Tags/CoveragesByTime/UtilizationsByTime/SavingsPlansCoverages/SavingsPlansUtilizationsByTime/CostCategoryNames missing) + add timePeriod-missing 400 tests for /dimension-values and /reservation-coverage (76.31%->100%) | Done | 2026-08-07 |
| 25.35 | scheduler.ts — remove 4 dead param guards + add 2 PUT /schedules/:name tests (defaults + explicit group/flexibleTimeWindow/state) (76.31%->100%) | Done | 2026-08-07 |

**Batch 13 — AppSync route branch coverage** (2026-08-07)

| # | Task | Status | Date |
|---|------|--------|------|
| 25.36 | appsync.ts — remove 20 dead `if (!apiId)` / `if (!apiId || !name/functionId/id)` param guards (routes with :name/:functionId/:id segments can never match empty) (76.47%->100%) | Done | 2026-08-07 |

**Batch 14 — Athena route branch coverage** (2026-08-07)

| # | Task | Status | Date |
|---|------|--------|------|
| 25.37 | athena.test.ts — add 6 sparse/optional tests (results without ResultSet, nextToken/maxResults passthrough + sparse cells, sparse data-catalogs/databases/tables, catalogName query param) (76.66%->100%) | Done | 2026-08-07 |

**Batch 15 — CodeBuild route branch coverage** (2026-08-07)

| # | Task | Status | Date |
|---|------|--------|------|
| 25.38 | codebuild.test.ts — convert 3 empty-list mocks to sparse (projects/ids missing) + add 3 sparse batch-get tests (projects/builds keys missing) (76.92%->100%) | Done | 2026-08-07 |

**Batch 16 — EC2 route branch coverage** (2026-08-07)

| # | Task | Status | Date |
|---|------|--------|------|
| 25.39 | ec2.test.ts — enrich 17 happy-path mocks with nested arrays (tags/attachments/rules/associations/etc. to fire map callbacks) + add 46 sparse/edge tests (missing top-level keys, sparse elements without tags/rules, PATCH no-op guards, defaults when omitted) (77.16%->100%) | Done | 2026-08-07 |

**Batch 17 — IAM route branch coverage** (2026-08-07)

| # | Task | Status | Date |
|---|------|--------|------|
| 25.40 | iam.test.ts — add 18 tests (sparse list/detail fallbacks for users/roles/groups/policies/instance-profiles, attachedPolicies/tags map callback firing, missing name 400s for roles/groups/policies/inline-policies, valid trust doc + default path/version branches) (77.45%->100%) | Done | 2026-08-07 |
| 25.41 | cloudformation.test.ts — add 10 tests (sparse parameters falling back to empty key/value on stack/change-set/stackset creates, templateUrl-only change-set/stackset, ResourceChange without Details, sparse exports/stacksets lists, sparse stackset detail) (77.56%->100%) | Done | 2026-08-07 |
| 25.42 | sqs.test.ts — add 14 tests (sparse QueueUrls/Attributes/Tags/queueUrls/Successful/Failed/Messages fallbacks, missing queueUrl 400s for PUT attributes/POST tags/DELETE tags/purge/DELETE messages/dlq-sources, empty messageBody default, move-tasks sparse message Body/MessageId fallbacks) (77.64%->100%) | Done | 2026-08-07 |
| 25.43 | rds.test.ts — add 19 tests (sparse instances/clusters/parameter-groups/subnet-groups/orderable-options lists, endpoint/vpcSecurityGroups/tags/clusterMembers map firing, create defaults for clusters/parameter-groups/subnet-groups, applyMethod immediate default + missing-parameters 400 for both parameter-group patches) (77.96%->100%) | Done | 2026-08-07 |
| 25.44 | emr.test.ts — add 10 tests (sparse clusters/instances/security-configurations list fallbacks, TerminationProtected ?? true default, cluster-detail resolve undefined->null instead of truthy {}, steps map fallbacks) (78.57%->100%) | Done | 2026-08-07 |
| 25.45 | firehose.test.ts — add 3 sparse tests (no DeliveryStreamNames key -> [] + empty list, batch response without RequestResponses -> [], tags without Tags key -> []) — converts the empty-list truthy-trap mock to {} (78.57%->100%) | Done | 2026-08-07 |
| 25.46 | s3-config.test.ts — add 20 tests (sparse TagSet/Policy/Rules/CORSRules/Website/Encryption/PAB/ACL fallbacks, 404-via-$metadata-status catch branches for tags/policy/lifecycle, unexpected-error throw -> 500 for tags/policy/lifecycle, invalid JSON policy 400, website redirectAllRequestsTo-only PUT, notifications empty config arrays, PAB/logging defaults) (80.00%->100%) | Done | 2026-08-07 |
| 25.47 | events.ts — add 9 tests + remove dead `|| ""` fallbacks (PUT permissions 4x, PUT archives ArchiveName, POST replays ReplayName/EventSourceArn — all guarded truthy): sparse POST buses/rules/archives fallbacks, DELETE permissions without statementId (RemoveAllPermissions true), DELETE archives missing name 400, PUT archives description truthy + empty, POST replays description truthy + empty + eventEndTime Date (80.86%->100%) | Done | 2026-08-07 |
| 25.48 | pricing.test.ts — add 3 tests + convert 3 truthy-trap empty mocks to {} (Services/AttributeValues/PriceList/PriceLists || [] fallbacks), filters query param parsed into GetProductsCommand.Filters, effectiveDate query param into ListPriceListsCommand.EffectiveDate Date (81.48%->100%) | Done | 2026-08-07 |
| 25.49 | apigateway.ts — remove 4 dead `!apiId` 400 guards on `:apiId` route params (never empty in Hono routing) on GET/DELETE /rest-apis/:apiId, GET resources, GET deployments (81.81%->100%, stmts 90.47%->100%) | Done | 2026-08-07 |
| 25.50 | s3vectors.test.ts — add 6 tests (maxResults/nextToken/prefix forwarded on GET buckets + maxResults on GET indexes, sparse {} fallbacks for indexes list/index detail/vectors list/query results) (81.81%->100%) | Done | 2026-08-07 |
| 25.51 | iot.test.ts — add 19 tests + convert 4 truthy-trap empty mocks to {} (things/certificates/policies/topic-rules || [] fallbacks), sparse fallbacks for thing-types/policy versions/policy targets/attached-policies/principals/topic-rule/tags/jobs/retained messages, attributePayload + thingTypeProperties build paths, object policyDocument on versions, pageSize/maxResults param forwarding, cleanSession/payload/qos/retain defaults (82.23%->100%) | Done | 2026-08-07 |
| 25.52 | route53.ts — remove 5 dead `!id` 400 guards on `:id` route params (GET/DELETE hosted-zones/:id, GET/POST/DELETE record-sets) + add POST record-sets defaults test (Action -> CREATE, TTL -> 300) (82.50%->100%, stmts 91.37%->100%) | Done | 2026-08-07 |
| 25.53 | ecs.ts — remove dead `!clusterName` 400 guard on `:clusterName` param + dead `|| ""` fallbacks on 2 `:taskDefinition` decodeURIComponent params (non-null `!` assertions), add 18 tests (sparse {} fallbacks for DescribeClusters/DescribeServices/DescribeTasks/DescribeContainerInstances/ListAttributes/PutAttributes/DescribeTaskSets/DeleteTaskSet/ListServiceDeployments/DescribeServiceDeployments/DescribeServiceRevisions + detail routes, families [] + tags [] defaults, desiredCount -> 0 and count -> 1 defaults, tagKeys [] default) (82.78%->100%) | Done | 2026-08-07 |
| 25.54 | lambda.ts — remove dead `?? ""` fallback on `:arn` route param in DELETE /code-signing-configs/:arn (non-null `!`), add 10 tests (function Layers map callback + environment/tracing/ephemeralStorage/revisionId mapping, sparse Functions [] fallback, POST /functions defaults for handler/s3Bucket/s3Key/environment + environment forwarding, GET detail without Code, PUT configuration environment forwarding + description default, PUT code without ZipFile, invoke without Payload, POST versions invalid JSON catch, layer versions sparse [], DELETE tags tagKeys []) (82.89%->100%, funcs 95.65%->100%) | Done | 2026-08-07 |
| 25.55 | acm.ts — clean double `!!` non-null on GET /certificates/:arn + add GET tags sparse {} test (Tags || [] fallback) (83.33%->100%) | Done | 2026-08-07 |
| 25.56 | apigatewayv2.ts — add 9 tests: 3 missing DELETE routes (integration/stage/deployment with cmd assertions), sparse {} fallbacks for routes/integrations/stages/deployments lists, POST stages 400 when stageName missing, websocket-routes integration-without-IntegrationId skip (83.33%->100%, stmts 87.30%->100%, funcs 86.36%->100%) | Done | 2026-08-07 |
| 25.57 | cloudmap.ts — add 2 sparse {} tests (GET /services and GET /services/:id/instances -> Services/Instances || [] fallbacks; existing filtered test passed { X: [] } so fallback never fired) (83.33%->100%) | Done | 2026-08-07 |
| 25.58 | cloudfront.ts — add 4 tests: PUT /distributions/:id 400 when distributionConfig missing, sparse {} fallbacks for GET /origin-access-controls, GET /functions, GET /tags (OriginAccessControlList/FunctionList/Tags ?.Items || [] fallbacks) (83.33%->100% branch, 98.71%->100% stmts) | Done | 2026-08-07 |
| 25.59 | cloudtrail.ts — add 3 tests: lookup-events endTime/nextToken/eventCategory forwarding (fires all three if-guard truthy sides), sparse {} lookup-events -> Events || [] fallback, sparse {} PUT event-selectors response -> EventSelectors || [] fallback (83.33%->100% branch, 95.83%->100% stmts) | Done | 2026-08-07 |
| 25.60 | neptune.ts — add 2 sparse {} tests: GET /clusters and GET /instances with no DBClusters/DBInstances key -> DBClusters/DBInstances || [] fallbacks (the prior empty tests passed { X: [] } which is truthy so the fallbacks never fired) (83.33%->100% branch) | Done | 2026-08-07 |
| 25.61 | opensearch.ts — add sparse {} test: GET /versions with no Versions key -> Versions || [] fallback (the only other /versions test passed populated Versions) (83.33%->100% branch) | Done | 2026-08-07 |
| 25.62 | codedeploy.ts — add 8 sparse/default tests: sparse {} list responses for GET /applications, /applications/:name/deployment-groups, /applications/:name/deployments (applications/deploymentGroups/deployments || [] fallbacks + early-return), sparse {} BatchGet responses for applications + deployment-groups (applicationsInfo/deploymentGroupsInfo || [] and ?.length || 0 fallbacks), sparse {} single-get responses for /applications/:name, /deployment-groups/:groupName, /deployment-configs/:name (-> null) (83.87%->100% branch) | Done | 2026-08-07 |
| 25.63 | kinesis.ts — add 8 sparse/fallback tests: sparse {} list responses for /streams, /streams/:name/shards, /streams/:name/tags (StreamNames/Shards/Tags || [] fallbacks), streamARN + sparse consumers {} (Consumers || []), subscribe-to-shard events without SubscribeToShardEvent.Records (skip) and records without Data (-> null), sparse {} batch records response (Records || []), shardIterator + sparse GetRecords {} (Records || []) (84.00%->100% branch) | Done | 2026-08-07 |
| 25.64 | ssm.ts — remove 3 dead `|| ""` fallbacks + `!name` 400 guards on :name route params (GET/DELETE /parameters/:name, /parameters/:name/history -> decodeURIComponent(param('name')!), Hono params never match empty segments) + add DELETE /tags without tagKeys test (fires `tagKeys || []` fallback, TagKeys []) (84.09%->100% branch, 94.73%->100% stmts) | Done | 2026-08-07 |
| 25.65 | s3-objects.ts — remove 6 dead `|| ""` fallbacks: 5x `sanitizeBucketName(param('name') || "")` -> `param('name')!` on GET/PUT/DELETE tags, attributes, head routes + extractKey `path.split("/objects/")[1]?.split(...)[0] || ""` -> `[1]!` (Hono wildcard params and matched paths never empty) (84.21%->100% branch) | Done | 2026-08-07 |
| 25.66 | autoscaling.ts — remove 2 dead `|| ""` fallbacks on :policyName/:hookName params (DELETE policies, DELETE lifecycle-hooks -> decodeURIComponent(param()!)) + add 9 tests: sparse {} list responses for /groups, /launch-configurations, /groups/:name/policies, /activities, /lb-target-groups, /load-balancers (AutoScalingGroups/LaunchConfigurations/ScalingPolicies/Activities/LoadBalancerTargetGroups/LoadBalancers || [] fallbacks), POST policies without policyType (-> SimpleScaling default), POST tags/delete without tagKeys (400 guard), metric-collection-types metric without Granularities (-> []) (84.28%->100% branch, 99.51%->100% stmts) | Done | 2026-08-10 |
| 25.67 | ecr.ts — remove dead `!name` 400 guard on :name param (GET scanning-configuration, Hono params never empty -> param('name')!) + add 7 tests: sparse {} responses for GET /repositories (repositories || []), DELETE /repositories/:name/images (imageIds/failures || []), GET /repositories/:name/policy (policyText || null), GET /repositories/:name/lifecycle (lifecyclePolicyText || null), GET scanning-configuration (scanningConfigurations/failures || [] -> nulls), POST /repositories/:name/tags without tags field (tags || {}), DELETE tags without tagKeys field (tagKeys || []) (84.37%->100% branch, 99.07%->100% stmts) | Done | 2026-08-10 |
| 25.68 | configservice.ts — add 4 sparse {} tests: GET /recorders (ConfigurationRecorders || []), GET /recorders/status (ConfigurationRecordersStatus || []), GET /delivery-channels (DeliveryChannels || []), GET /conformance-packs (ConformancePackDetails || []) — these 4 routes only had populated tests so the || [] fallbacks never fired (84.61%->100% branch, 100% stmts already) | Done | 2026-08-10 |
| 25.69 | elb.ts — remove 24 dead `|| ""` fallbacks: `decodeURIComponent(param('arn') || "")` -> `decodeURIComponent(param('arn')!)` across all :arn routes (DELETE/GET/PUT load-balancers, target-groups, listeners, rules, certificates, attributes, subnets, ip-address-type, security-groups, register/deregister) — Hono :arn params never match empty segments (84.61%->100% branch, 100% stmts already) | Done | 2026-08-10 |
| 25.70 | kms.ts — add 6 tests: sparse {} responses for GET /keys (Keys || []), GET /keys/:id with no Tags/Aliases/Grants keys (all || [] fallbacks), GET /aliases (Aliases || []), grant without Operations (operations || [] in mapGrant), POST /keys/:id/tags without tags field (tags || []), POST /random with empty body (fires c.req.json().catch(() => ({})) fallback — the uncovered anonymous function) (85.41%->100% branch, 96.96%->100% funcs) | Done | 2026-08-10 |
| 25.71 | logs.ts — add 8 tests: sparse {} responses for GET /log-groups (logGroups || []), GET /log-groups/:name/streams (logStreams || []), GET stream events (events || []), POST filter-events with empty body (fires filterPattern-if falsy side + events || []), GET subscription-filters (subscriptionFilters || []), GET tags (tags || {}), POST tags without tags object (400 guard), DELETE tags without tags array (400 guard — also uncovered statement) (85.93%->100% branch, 98.58%->100% stmts) | Done | 2026-08-10 |
| 25.72 | glue.ts — add 16 tests: POST schema-version-validity without dataFormat (-> AVRO default), GET function 404 when UserDefinedFunction missing (fires !f guard), sparse {} responses for GET table/partition column-stats (ColumnStatisticsList || []), partition column-stats error path (catch -> [] — the uncovered statement), 400 guards for POST partition column-stats (missing partitionValues / columnStatisticsList) + DELETE partition column-stats (missing column / values), partition without Values (mapPartition Values || [], location || null, parameters || {}), sparse {} GET partitions (Partitions || []), sparse {} POST partitions (Errors || []), batch-get 400 guard + sparse {} (Partitions/UnprocessedKeys || []), batch-update sparse {} (Errors || []), PUT partitions 400 without partitionInput (86.06%->100% branch, 97.64%->100% stmts) | Done | 2026-08-10 |
| 25.73 | dynamodb.ts — add 8 tests: sparse {} responses for GET /tables (TableNames || [] x2), GET scan (Items || []), POST query (Items || []), GET kinesis-streaming (KinesisDataStreamDestinations || []); POST /tables with rangeKey but no rangeType (-> ScalarAttributeType.S default); GET /tables/:name with sparse Table (GlobalSecondaryIndexes/LocalSecondaryIndexes || []) + populated LocalSecondaryIndexes (fires the LSI map callback — the uncovered anonymous_6 function and statement); GET scan with LastEvaluatedKey (fires truthy side of lastEvaluatedKey ternary, previously only query covered it) (86.56%->100% branch, 94.73%->100% funcs) | Done | 2026-08-10 |
| 25.74 | cloudwatch.ts — add 10 tests: sparse {} responses for GET /metrics (Metrics || []), GET /metrics/statistics (Datapoints || []), POST /metrics/data/query (MetricDataResults || []), GET /alarms (MetricAlarms || []), GET /tags/:arn (Tags || []); POST /metrics/data without metricData (metricData || []) + POST query without queries (queries || []); GET /metrics with populated Dimensions (fires the inner dimensions map callback — uncovered anonymous_5 + statement); GET /metrics/statistics with valid JSON dimensions (fires the parsed.map callback — uncovered anonymous_13); GET /metrics/statistics with 4 datapoints (2 with + 2 without timestamps, fires the sort comparator — uncovered anonymous_11 — covering all 4 || 0 branches) (86.58%->100% branch, 90.32%->100% funcs) | Done | 2026-08-10 |
| 25.75 | ec2-terminal.ts — remove 3 provably-dead if(!closed) guards (onExit/onError/.catch: connection closed can only be set via close(), which always calls proc?.kill() -> dockerExecTty-level closed blocks the socket end/error before the connection-level guard is ever evaluated; .catch can never run after .then registered the close handlers) + add 2 tests: connection with no req.url and empty headers (fires req.url || "" and req.headers.host || "localhost" fallbacks -> invalid path); resize JSON message after close (fires resize's if(closed) return — no resize POST) (86.66%->100% branch, 99.1%->100% stmts) | Done | 2026-08-10 |
| 25.76 | secretsmanager.ts — add 1 test: POST /random-password with empty request body (no content-type -> c.req.json() rejects -> fires the uncovered .catch(() => ({})) fallback, the anonymous_18 function; prior "no body" test posted {} which parses fine) (98.5%->100% stmts, 94.73%->100% funcs) | Done | 2026-08-10 |
| 25.77 | cognito.ts — add 9 tests: sparse {} responses for GET /user-pools (UserPools || []), GET /user-pools/:id/users (Users || []), GET groups (Groups || []), GET clients (UserPoolClients || []), GET client secrets (ClientSecrets || []), GET resource-servers (ResourceServers || [] + length || 0), GET /users/:username/groups (Groups || [] + Groups?.length || 0), GET /groups/:groupName/users (Users || [] + Users?.length || 0); PUT mfa-config with smsAuthenticationMessage + non-ON config (fires smsAuthenticationMessage truthy side line 358 AND mfaConfiguration === "ON" falsy side line 362 — existing test only passed "ON" without sms message) (87.35%->100% branch) | Done | 2026-08-10 |
| 25.78 | elasticache.ts — add 3 sparse {} tests for GET /replication-groups (ReplicationGroups || [] line 27), GET /cache-clusters (CacheClusters || [] line 59), GET /users (Users || [] line 90) — existing empty tests pass truthy [] literals (87.5%->100% branch) | Done | 2026-08-10 |
| 25.79 | cur.ts — add 5 tests: sparse {} for GET /report-definitions (both ReportDefinitions || [] fallbacks lines 22/23) + GET /tags (Tags || [] line 96); PUT /report-definitions 400 when timeUnit missing (line 57 branch 0 — never taken) + modify with defaults when s3Bucket missing (S3Bucket || "" line 68, also asserts S3Prefix "" and S3Region us-east-1 defaults); POST /report-definitions/delete 400 when reportName missing (line 83 branch 0 — never taken) (88%->100% branch, 96.55%->100% stmts) | Done | 2026-08-10 |
| 25.80 | sns.ts — remove 2 dead || "" fallbacks (Endpoint line 136 + Message line 181 — both fields are required by their routes' guards so the fallback can never fire) + add 6 tests: sparse {} for GET /topics (Topics || []), GET /topics/attributes (Attributes || {}) + 400 without topicArn (line 71 branch 0 — never taken), GET /topics/tags (Tags || []) + 400 without topicArn (line 94 branch 0 — never taken), GET /subscriptions (Subscriptions || []) (88.4%->100% branch, 98.7%->100% stmts) | Done | 2026-08-10 |
| 25.81 | eks.ts — add 2 sparse {} tests: GET /clusters (result.clusters || [] line 24) + GET /clusters/:name/node-groups (result.nodegroups || [] line 79) — existing empty tests pass truthy [] literals so the fallbacks never fired (88.88%->100% branch) | Done | 2026-08-10 |
| 25.82 | pipes.ts — add 1 sparse {} test: GET /pipes (result.Pipes || [] line 30) — existing empty test passes truthy [] literal (90%->100% branch) | Done | 2026-08-10 |
| 25.83 | memorydb.ts — add 2 sparse {} response tests: POST /tags/:arn (TagList || [] line 87) + DELETE /tags/:arn (TagList || [] line 95) — existing tests mock truthy TagList values (91.66%->100% branch) | Done | 2026-08-10 |
| 25.93 | useECS.ts (frontend hook) — remove 1 dead `taskDefinition || ""` fallback (line 69 — guarded by `enabled: !!taskDefinition`, same pattern as useIAM) + add 2 tests: useDeleteECSTaskSet without force (fires `force ? "&force=true" : ""` falsy side line 348 — only the force:true path was tested) + useECSServiceDeployments with cluster null (fires `cluster ? ... : ""` falsy side line 362 — only the with-cluster path was tested) (85%->100% branch) | Done | 2026-08-10 |
| 25.94 | CEDashboard.tsx (services dashboard) — add 2 sparse-data tests: cost-and-usage with data `{}` (fires `resultsByTime || []` line 538) + cost-categories with data `{}` (fires `costCategories || []` line 589) — existing "does not show" tests pass data undefined so the `&&` guard short-circuits and the fallbacks never fire (75%->100% branch) | Done | 2026-08-10 |
| 25.95 | ELBDashboard.tsx (services dashboard, 75% branch / 77.31% stmts / 64.51% funcs) — large batch: remove dead guarded branches (`selectedLBArn &&` / `selectedListenerArn &&` / `!selectedListenerArn ||` guards + `rules || []` behind modal guards + `if (x.trim())` guards behind disabled buttons), make create-LB/TG modals conditionally mounted like the other 5 modals, update mutation mocks to invoke `opts.onSuccess` (fires the onSuccess invalidation branches), fix Escape-dismiss tests to fire keydown on the Cloudscape `.dialog` element (user.keyboard Escape doesn't trigger React onKeyDown), add cert sparse-data test + LB/TG/rules/priority/cert modal tests (100% -> all metrics) | Done | 2026-08-10 |
| 25.96 | RDSDashboard.tsx (services dashboard, 81.14% branch / 60.46% stmts / 51.61% funcs) — large batch: remove 6 dead guards (`if (!form.X) return;` behind disabled buttons + `if (!editParam) return;` in Save onClick) and dead edit-input `p ? ... : null` fallback (modal only opens with editParam set), update all create/modify mutation mocks to invoke `opts.onSuccess` (fires the onSuccess close/reset branches) + add named modify mocks, add tests for every create modal full flow (engine/family selects, all text fields, cancel, Escape dismiss, error-without-message fallbacks), instance/cluster detail truthy flags (multiAZ/IAM auth/copyTags), detail reboot/delete/loading, cluster detail null data, PG/CPG create with & without description (fires `description || undefined` both sides), subnet group description+multi-subnet parsing, edit-parameter save for both parameter-group and cluster-parameter-group paths (fires `if (isCluster)` both branches), edit modal cancel/Escape, null-value + sparse applyType/source params (100% -> all metrics) | Done | 2026-08-10 |
| 25.97 | EKSDashboard.tsx (services dashboard, 68.11% stmts / 87.17% branch / 57.89% funcs) — conditionally mount create-cluster and create-nodegroup modals (Cloudscape keeps Modal children mounted when `visible=false`, so close assertions never fired — same fix as the ELB batch), wire createCluster/createNodegroup mutation mocks to invoke `opts.onSuccess` (fires the onSuccess close + field-reset branches), add tests for full create flows (cluster with & without version, firing `clusterVersion \|\| undefined` both sides; nodegroup with spacey/trailing-comma subnets, firing split/trim/filter(Boolean)), partial-fill disabled states for both modals (fires `!clusterName \|\| !clusterRoleArn` and `!ngName \|\| !ngNodeRole \|\| !ngSubnets` remaining branches), Escape-dismiss for both modals, drill-down "Create node group" button, and name-filter typing for both resource tables (fires both filterFunction callbacks) (100% -> all metrics) | Done | 2026-08-10 |
| 25.98 | DynamoDBTables.tsx (services sub-component, 63.82% stmts / 91.66% branch / 57.89% funcs) — remove dead `if (!name \|\| !hashKey) return;` guard in handleCreate (Create button is disabled under those exact conditions — same dead-guard pattern as the RDS batch), mock DynamoDBTableDetail (it imports other useDynamoDB hooks the module mock doesn't provide), wire createTable mutation mock to invoke `opts.onSuccess` (fires the onSuccess close + resetForm branches), add tests for detail drill-down + Back (fires `if (selectedTable)` truthy + name-button onClick), Cancel and Escape-dismiss (fire both onDismiss/Cancel close + resetForm paths), partition-key Select change (fires hashType onChange, asserts `hashType: "N"` payload), and sort-key Select change (types range key -> conditional type select appears, fires rangeType onChange, asserts `rangeType: "B"` payload) (100% -> all metrics) | Done | 2026-08-10 |
| 25.99 | Ec2MessagesDashboard.tsx (services dashboard, 71.42% stmts / 83.33% branch / 72.72% funcs) — add 4 tests: "Get Messages" click with spacey destination (fires `activated ? destination.trim() : null` truthy side + the onClick and setTimeout refetch callbacks), acknowledge success (fires try-path: mutateAsync resolve -> success toast + refetch), acknowledge failure (fires catch-path: reject -> error toast), and data without a Messages key (fires `(data as any)?.Messages \|\| []` fallback — prior empty tests passed a truthy `Messages: []`) (100% -> all metrics) | Done | 2026-08-10 |
| 25.100 | TransferDashboard.tsx (services dashboard, 72.58% stmts / 79.31% branch / 61.76% funcs) — conditionally mount create-server and create-user modals (Cloudscape keeps Modal children in the DOM when hidden, so close assertions and the always-mounted Cancel/onDismiss handlers skewed coverage — same fix as the EKS/ELB batches), remove dead `if (!selectedServerId) return;` guard in createUser onClick ("Create user" is only reachable with a selected server -> `selectedServerId!` non-null assertion) + dead `\|\| "S3"` fallback on serverDomain.value (Select options always carry a value), wire createServer/createUser mutation mocks to invoke `opts.onSuccess` (fires the onSuccess close branches), add tests for Start/Stop clicks, server-selection toggle-off (fires the `i.serverId === selectedServerId ? null : i.serverId` ternary), users-data-without-users-key fallback, create-server with default S3 and EFS domain (fires the Domain Select onChange), Escape-dismiss + generic error for both create modals, full create-user flow with trimmed fields (fires `!userName.trim() \|\| !userRole.trim()` remaining branches), Cancel-dismiss for the user modal (last Cancel — DeleteButton's hidden ConfirmDialog renders an earlier Cancel button in the DOM), delete-user loading state, and create-user error alerts (message + generic) (100% -> all metrics) | Done | 2026-08-10 |
| 25.101 | GlueDashboard.tsx (services dashboard, 73.12% stmts / 83.87% branch / 66.17% funcs) — large multi-tab batch (Databases & Tables, Schema Registry, UDFs, Partitions, Column Stats): remove 3 dead Select `\|\| "AVRO"/"NONE"/"string"` fallbacks (options always carry a value) + dead `selectedDb ? "No UDFs found" : "Select a database"` emptyMessage ternary (ResourceTable only renders when selectedDb is truthy), add hoisted delete-state mocks for registry/schema/UDF/partition/stats (fires the `isPending && variables ===` loading branches), wire createRegistry/createSchema/registerVersion/createUDF/updateUDF/updateStats/createPartitions mocks to invoke `opts.onSuccess`/`opts.onError` (fires close/reset + toast branches), add tests for: tables name-filter + `tables/databases`-key-missing fallbacks, sparse-data fallbacks for all 5 tabs (`\|\| []` and `\|\| "-"` falsy sides), registry/schema delete with & without selection (fires `if (selectedRegistry === r.name)` / `if (selectedSchema === s.name)` both sides), version-detail Close + Escape dismiss, version-detail loading spinner (Cloudscape Spinner asserts on the `awsui_circle` marker — hashed classes), metadata `\|\| {}` fallback, full create-registry/create-schema (with dataFormat/compatibility Select changes)/register-version flows + Cancel/Escape + disabled states, UDF create/edit success + error + Cancel/Escape + disabled + loading, add-partition without location (no StorageDescriptor) + success toast + error toast + Cancel/Escape + disabled + partition-without-values render & delete (fires `(p.values \|\| [])` falsy 3x) + delete loading, partition-delete onError path (rejects the onDelete promise — guarded with an unhandledRejection listener), column-stats partition-values typing (fires `partValues.length` truthy + partition header), analyzedTime truthy, delete-stats + loading, update-stats Cancel/Escape/success/error/disabled + number inputs (`Number(x) \|\| 0` both sides via typing 5 then 0) + column-type Select change (100% -> all metrics) | Done | 2026-08-11 |
| 25.102 | EMRDashboard.tsx (services dashboard, 73.2% stmts / 65.5% funcs) — conditionally mount the Run Job Flow and Create Security Configuration modals (Cloudscape keeps Modal children in the DOM when hidden, so the cluster-modal Cancel/onDismiss handlers never fired and close assertions were impossible — same fix as the EKS/ELB/Transfer batches; the sec-config modal's "Create Security Configuration" header collides with the table's onCreate button, so close assertions use the modal-unique "Security Configuration (JSON)" FormField label), wire runJobFlow/createSecConfig mutation mocks to invoke `opts.onSuccess` (fires the close + field-reset branches), add tests for: clusters + security-configurations name filters (both `filterFunction` callbacks — the tables share the "Find by name" placeholder so they're targeted by input index), cluster submit with & without release label (fires `releaseLabel.trim() \|\| undefined` both sides, asserts full payload), Escape-dismiss for both modals, `\|\| "Failed"` alert fallback for both error alerts (empty-message errors), sec-configs `securityConfigurations`-key-missing fallback (fires `|| []`), and invalid-JSON submit (fires the `JSON.parse` catch guard — mutate never called) (100% -> all metrics) | Done | 2026-08-11 |
| 25.103 | AthenaDashboard.tsx (services dashboard, 78.1% stmts / 66.3% funcs) — conditionally mount the Create Work Group and Query Execution Detail modals (Cloudscape keeps Modal children in the DOM when hidden, so the onDismiss/Escape handlers never fired and close assertions were impossible — same fix as the EKS/ELB/Transfer/EMR batches), wire hoisted `deleteWgState` + `mockStopQuery` into the delete/stop hook mocks (fires the `isPending && variables ===` loading branches and makes the Stop click assertable), add tests for: work-group name filter (fires the `filterFunction`), `workGroups`-key-missing fallback (fires `\|\| []`), missing-State `\|\| "ENABLED"` fallback, delete loading state, create-with-description flow (fires the description Input onChange + `opts.onSuccess` close/reset — modal closes), create onError toast path, Cancel + Escape-dismiss for the create modal, detail loading spinner (Cloudscape Spinner asserts on the `awsui_circle` marker — hashed classes), missing detail State `\|\| "—"` dash, Configuration defaults with null ResultConfiguration (fires `ResultConfiguration?.OutputLocation \|\| "—"`) + both false toggles (`? "Yes" : "No"` falsy sides), Stop click + stop loading, `queryExecutionIds`-key-missing fallback, detail-modal Escape-dismiss, missing status state (fires `Status?.State \|\| ""` in getStatusType + `\|\| "—"` dash), non-FAILED StateChangeReason info alert (fires `State === "FAILED" ? "error" : "info"` falsy side), results loading spinner + data-missing empty state (fires `data ? counter : undefined` + `data?.headers?.length ?? 0` nullish sides), Col-N header + empty-cell fallbacks (`h.name \|\| \`Col ${i + 1}\`` + `row[i] \|\| ""` falsy sides), catalogs/databases/tables all-data-missing (fires all 4 counter/`\|\| []` falsy sides), tables-container-without-data (fires the `tables ? ... : undefined` counter + `tables?.tables \|\| []`), and table metadata without Columns (fires `Columns?.length \|\| 0` + no Columns table) (100% -> all metrics) | Done | 2026-08-11 |
| 25.104 | CodeDeployDashboard.tsx (services dashboard, 75% stmts / 66.66% funcs — lowest of the coverage sweep) — conditionally mount all 4 create modals (Create Application / Deployment Group / Deployment / Deployment Config): the group and deployment modals sit inside `{selectedApp && (}` wrappers which were collapsed into the new `{showX && <Modal}` mounts, and the config modal's prior submit test passed WITHOUT ever opening the modal (Cloudscape keeps hidden Modal children in the DOM and happy-dom applies no stylesheets, so hidden inputs were typeable/clickable — `onCreate` was never fired), wire createApplication/createDeploymentGroup/createDeployment/createDeploymentConfig mocks to invoke `opts.onSuccess` in beforeEach (fires all 4 close + field-reset branches), add tests for: create-group full flow with trimmed fields (types group name + role ARN — fires the `groupRoleArn` Input onChange — asserts full `{ appName, deploymentGroupName, serviceRoleArn }` payload + modal closes), create-deployment full flow (types group name — fires the `deployGroupName` Input onChange — asserts payload + closes via the now-unique `my-group` placeholder), Escape-dismiss for all 4 modals (fires every onDismiss), Cancel for the group (last Cancel — DeleteButton's hidden ConfirmDialog renders an earlier Cancel), deployment, and config modals, and updated the config submit test to assert the modal closes (`onSuccess` + close branch) (100% -> all metrics) | Done | 2026-08-11 |
| 25.105 | KMSPage.tsx (frontend page, 59.44% lines — lowest non-dashboard file of the frontend sweep; the streak's first non-dashboard target) — pure test additions (+33 tests, 23 -> 56), no source changes: add hoisted `mockNavigate` (breadcrumb click asserts `navigate("/")` — fires the `onFollow` preventDefault + `href.replace("/#", "")`), hoisted `healthState` + `useSystem` mock (fires the `kmsStatus` Running/Available/Connected ternary via StatusBadge), wire `mockDeleteAlias` into the useDeleteAlias factory (delete-alias success + error toasts — the try/catch branches), add `refetch: vi.fn()` to the key-detail mock (the toggle/schedule/cancel onSuccess handlers call `keyQuery.refetch()`), and tests for: key-table state fallbacks (missing keyState -> `enabled ? "Enabled" : "Disabled"` both sides, explicit Disabled grey branch, missing keyManager -> `CUSTOMER` fallback, missing description/usage/spec/deletion -> dashes, deletionDate -> formatted date), full create-key flow (description typing + both Select onChanges via the RDS trigger/option pattern -> asserts `{ description, keyUsage: "SIGN_VERIFY", keySpec: "RSA_2048" }` payload + mutateAsync success toast + modal close) + reject path (catch -> error toast) + Cancel (onClose arrow), detail-modal actions (edit-description Save with `user.clear` — the input pre-fills with the current description — Cancel, and the empty-description `|| ""` fallback, enable/disable rotation, disable/enable key, schedule/cancel deletion — all with `opts.onSuccess` assertions + toasts, Close button, and every `opts.onError` path -> error toast), detail overview with `keyManager: "AWS"` + `multiRegion: true` + deletion date (fires the overview badge ternary + Multi-Region + Deletion date branches), aliases/grants tables with data (both aliases trackBy sides `a.arn \|\| a.name` + sparse grant -> dash name/no ops/dash created), AliasesTab key-missing `\|\| []` + creationDate display, create-alias flow (both Input onChanges + onSuccess close + onError toast) (100% -> all metrics) | Done | 2026-08-11 |
| 25.106 | EventsPage.tsx (frontend page, 66.43% lines) — the second non-dashboard target, a 1329-line EventBridge page: remove 5 dead guards matching their disabled-button conditions (CreateRuleModal `if (!name.trim()) return;` — Create is `disabled={!name.trim()}`, TargetsSection `if (!newTargetArn.trim() \|\| !newTargetId.trim()) return;`, CreateReplayModal and CreatePermissionModal submit guards, and RulesTab onRowClick `if (detail.item)` — Cloudscape always supplies the item), convert the anonymous showToast to a shared `mockShowToast` (every toast assertion now verifiable), wire `mockConfirm` through the ConfirmDialog mock (confirmation-declined paths for rule/bus/archive/target/replay/permission deletes), hoisted `mockNavigate` + `healthState` (breadcrumb navigate + Running/Available status badge), wire all 17 mutation mocks to invoke `opts.onSuccess` in beforeEach (fires every close/reset/toast branch), and add tests for: rule enable-toggle + toggle/delete success & error toasts, rule delete declined, rule schedule-expression render + `EventBusName \|\| "default"` fallback, create-rule full flow (event-pattern paste, description typing, Enabled toggle off -> asserts `state: "DISABLED"` payload + close) + onError, add/remove target success+error+declined + Hide, create-bus with description + error + Cancel + delete-bus success/error/declined + dashes for bare bus + Hide panel, send-event success (`failedCount === 0`) + partial-failure warning (`failedCount: 2`) + onError + Cancel + detail textarea change, create-archive with description + error + Cancel + delete success/error/declined + sparse state/count fallbacks, archive detail fallbacks (missing State/EventCount) + update with cleared fields (`description.trim() \|\| undefined` + `retentionDays ? parseInt : undefined` falsy sides) + update error + Hide, replay start with optional fields (endTime/description/destination) + error + Cancel + cancel success/error/declined + `replays`-key-missing + no-State dash, permission add with valid JSON condition (paste) + invalid-JSON error (mutate never called) + onError + Cancel + action pre-fill clear, permission remove success/error/declined, and sparse statements (array-Action join, no-Sid -> dash + no button, no-fields -> dashes) (100% -> all metrics) | Done | 2026-08-11 |
| 25.107 | SQSPage.tsx (frontend page, 67.23% lines / 58.02% funcs) — remove 3 dead submit guards matching their disabled-button conditions (CreateQueueModal `if (!name) return;` — Create is `disabled={!queueName.trim()}`, SendMessageModal `if (!body.trim()) return;` — Send is disabled, TagsTab `if (!newKey.trim()) return;` — Add tag is disabled), hoist `mockShowToast`/`mockConfirm`/`mockSetSearchParams` (toast/confirmation-declined/setSearchParams assertions now verifiable) + hoisted `mockPurgeQueueMutate`/`mockDeleteMessageMutate` (previously anonymous mocks), wire all 8 mutation mocks to invoke `opts.onSuccess` in beforeEach, and add tests for: queue select via link (Cloudscape Link renders `role="button"`), breadcrumb SQS click (fires the `href === "#/services/sqs"` true side of the onFollow) + Dashboard click (false side — uses `getAllByText("Dashboard")[0]` since Cloudscape renders a hidden duplicate), back button, empty-state Create queue button (line 231), error-without-message fallback (fires `(error as Error)?.message \|\| "Failed to load queues"`), delete-queue success/error/declined toasts, create-queue all 4 attribute input onChanges (typing custom values -> full payload assert) + cleared-input falsy sides (`if (visibilityTimeout)` etc. — all four cleared -> `attributes: {}`) + success toast/close/reset + onError, purge success/error/declined, attributes FIFO (`FifoQueue === "true"`) + CreatedTimestamp/LastModifiedTimestamp formatting + save success/error + edit-input onChanges with payload assert, messages data-missing (`|| []`), truncated body >100 chars, sparse message (no Attributes/ReceiptHandle -> "0"/"—"/no delete button — asserts exactly 1 delete button), FIFO group-ID column (with + without MessageGroupId), delete-message success/error/declined with payload assert, send-message success toast (8-char messageId prefix) + modal close + onError + custom delay (`parseInt(delay) \|\| 0`) + FIFO group/dedup IDs, tag-add success toast + input clear + payload assert + onError, tag-remove success/error (100% -> all metrics) | Done | 2026-08-11 |
| 25.108 | DashboardHome.tsx (frontend page, ~69.7% lines) — pure test additions (+4 tests, 19 -> 23), no source changes: click every remaining quick-action button (Open DynamoDB/EC2/Lambda/RDS/SQS/SNS/KMS — fires the 7 uncovered `trackNav` buttons and asserts `navigate(path)` for each), error-without-message fallback (fires `(error as Error)?.message \|\| "Failed to connect to Floci"`), health-falsy render (data null + no loading/error -> `health ? (...) : null` false side), and an older-timestamp test that seeds `floci-activity-feed` in localStorage with 5.5-minute/5.5-hour/5-day-old entries + a `resource` field, then clicks a quick action (addActivity -> emitChange re-reads the seeded entries into the feed) to fire `formatTime`'s `m ago` / `h ago` / `toLocaleDateString` branches, the `diff < 60000` false side, and the `entry.resource &&` truthy side (`— my-bucket` render) (100% -> all metrics) | Done | 2026-08-11 |
 | 25.109 | elasticbeanstalk.ts (backend route, 94.9% stmts / 79.4% branch / 95% funcs — the first backend target of the streak, from the backend sweep which showed 83/86 files already at 100% lines) — pure test additions (+7 tests, 24 -> 31), no source changes: add the missing `PUT /applications/:name/environments/:envName` test (the whole UpdateEnvironmentCommand handler — lines 231-234, 247 — and its arrow function were never exercised; asserts command name, VersionLabel payload passthrough, `updated: true` + mapped response), the `PUT /applications/:name` null-application branch (`result.Application ? mapApp(...) : null` falsy side with `{}` response + command assertion), and `\|\| []` falsy-side tests for every endpoint whose "empty" test passed an explicit `[]` (GET /applications with `Applications` key missing, GET versions with `ApplicationVersions` missing, GET environments with `Environments` missing, config GET with `ConfigurationSettings` missing, and solution-stacks with both `SolutionStacks`/`SolutionStackDetails` keys missing) (100% -> all metrics) | Done | 2026-08-11 |
 | 25.110 | index.ts (backend app entry, 92.3% stmts / 80% funcs — the lowest backend file from the sweep) — pure test additions (+1 test, 17 -> 18) + 2 mock improvements, no source changes: the gaps were the two production-only code paths — the SPA fallback handler (lines 67-68: `readFile` + `c.html`) never ran because the existing prod tests only request `/api/healthz`, and the `httpServer.listen` startup callback (line 78 `console.log`) was never invoked by the mocked server. Mocked `@hono/node-server/serve-static` (serveStatic calls `next()` directly, so the `/*` fallback deterministically runs without depending on a real `dist/` build) + `node:fs/promises` `readFile` (returns a fake index.html), made the createAdaptorServer mock invoke the listen callback (recording first, then calling `args[1]` — the PORT assertion still holds), and added the prod test: request `/some/spa/route` with NODE_ENV=production -> 200 + body contains the served HTML (100% -> all metrics) | Done | 2026-08-11 |
 | 25.111 | dynamodb-advanced.ts (backend route, 98.5% stmts / 79.1% branch / 97.2% funcs) — pure test additions (+35 tests, 51 -> 86), no source changes: the 42 uncovered branches were almost all `\|\| []`/`\|\| null`/`?.`-falsy sides where the existing "empty" tests passed an explicit `[]`, plus missing 400 paths and default branches. Added tests for: UpdateTable (400 when ProvisionedThroughput is set with PAY_PER_REQUEST, SSE without SSEType/KMSMasterKeyId, GSI Projection `{}` -> ALL default, GSI with NonKeyAttributes, no-TableDescription -> `UPDATING` default), UpdateItem (attributes null when response lacks them), BatchGet (Responses-missing `\|\| {}`, UnprocessedKeys passthrough), BatchWrite (same-table grouping — the `!requestItems[table]` falsy side, requests without item/key -> empty buckets, UnprocessedItems-missing wrote count + the non-array `requests` 400), Transactions (Responses-missing `\|\| []`, Item-missing -> null entry, update-without-updates -> empty SET + names, unknown type -> Hono 500 via the switch default/throw — note Hono catches handler throws into 500 responses rather than rejecting), TTL (no-description DISABLED/null defaults + the missing attributeName 400), Tags (Tags-missing `\|\| []` + the missing-tags 400), Backups (no-description DISABLED default), PartiQL (Items-missing `\|\| []`, transaction Responses-missing + Item-missing `{}` entries, batch with Parameters — the batch handler's `s.Parameters?.length` truthy side was DA=0, batch Responses-missing + TableName-missing -> null), Exports (ExportSummaries-missing, summary without StartTime/EndTime -> null, s3Prefix/ExportFormat defaults, exportType/exportTime set, no-description IN_PROGRESS default, GET /exports description-missing -> null times) (100% -> all metrics) | Done | 2026-08-11 |
 | 25.112 | dynamodb-streams.ts (backend route, 100% lines / 78% branch — the last backend file below 100% after the sweep) — 4 test additions (19 -> 23) + remove 2 dead guards, no other source changes: probed whether Hono can match an empty `:arn` segment (`/streams/` and `/streams//shard-iterator` both 404) and confirmed the `decodeURIComponent(c.req.param("arn") \|\| "")` falsy side is unreachable dead code — replaced both with the codebase-standard `c.req.param("arn")!` (same as acm.ts/ecs.ts/elb.ts; BRF dropped 50 -> 46). Then covered the remaining falsy sides with key-missing tests: GET /streams with no `Streams` key (\|\| []), describe with no KeySchema/Shards keys (both \|\| [] + `lastEvaluatedShardId \|\| null` in one test), shard without SequenceNumberRange (ternary falsy -> null), records with no `Records` key (\|\| [] + `NextShardIterator \|\| null` + `MillisBehindLatest ?? 0` falsy), and a record whose `dynamodb` lacks Keys/NewImage/OldImage (all three \|\| {} + `userIdentity \|\| null`) (100% -> all metrics) | Done | 2026-08-11 |
 | 25.113 | system.ts (backend non-route file, 100% lines / 96.7% branch — found by the clients + non-route verification sweep; the last backend file below 100% anywhere) — pure test addition (+1 test, 12 -> 13), no source changes: the single uncovered branch was the ec2 check's `x.Instances?.length \|\| 0` falsy side inside the `/resource-counts` reduce — the "returns counts" test's reservations always had `Instances`, and the "empty results" test sent no `Reservations` at all, so a reservation entry without `Instances` never flowed through the reducer. Added a test resolving `Reservations: [{ Instances: [{ InstanceId: "i-1" }] }, { OtherField: "x" }]` (plus `{}` for the other 8 clients) -> `body.ec2 === 1` (100% -> all metrics — the entire backend, all 86 files, is now at 100% lines/branch/funcs) | Done | 2026-08-11 |
 | 25.114 | useApiGatewayV2.ts (frontend hook, 71.4% lines / 74.3% funcs — the lowest-coverage file found by the fresh whole-repo sweep, which measured 271 source files with all 86 backend files at 100%) — pure test additions (+3 tests, 23 -> 26), no source changes: the 12 uncovered lines + 9 uncovered functions were the three never-tested mutation hooks — `useCreateApiGatewayV2Route` (POST /apis/:id/routes with body + onSuccess invalidation), `useDeleteApiGatewayV2Stage` (DELETE /apis/:id/stages/:name with encoded stage name + invalidation), and `useDeleteApiGatewayV2Deployment` (DELETE /apis/:id/deployments/:id + invalidation) — each hook contributes 3 functions (hook + mutationFn arrow + onSuccess arrow) accounting for the 9 uncovered funcs. Added them to the helpers-based useApiGatewayV2.test.ts (which mocks useQueryClient to a no-op invalidateQueries, firing the onSuccess lines); the .test.ts/.test.tsx duplicate files both run (26 tests total) (100% -> all metrics) | Done | 2026-08-11 | 75.75%→**100% branch**, 17 route tests pass, full suite 7623/7623 (269 files), typecheck clean | Done | 2026-08-06 |
 | 25.115 | MemoryDBDashboard.tsx (frontend dashboard, 76.7% lines / 71.4% funcs) — pure test additions (+5 tests, 8 -> 13), no source changes: the 10 uncovered lines + 1 branch were all in the create/delete flows — delete success toast assert (already firing showToast), delete rejection → catch → error toast, `deleteCluster.isPending && variables === name` row-loading branch (mutable isPending/variables delete mock), full create flow typing description/nodeType/engine onChanges (nodeType/engine prefill `db.t4g.small`/`redis` so they need clearing — user.clear gotcha) with payload assert + onSuccess toast (`mockCreateCluster` invoking `opts.onSuccess`), create onError toast (`opts.onError(new Error(...))`), and Escape-dismiss of the create modal (the `onDismiss` arrow — Cancel only covered the button's onClick). Hoisted `mockShowToast` via a `../../components/Toast` mock (useToast defaults to a no-op without a provider) (100% -> all metrics) | Done | 2026-08-12 |
 | 25.116 | LambdaPage.tsx (frontend page, 73.3% lines / 59.4% funcs) — the streak's biggest frontend batch (+36 tests, 90 -> 127): 3 dead Select/`|| ""` guards removed (runtime Selects prefill and Cloudscape Select has no clear button, so the falsy sides were unreachable — matching LambdaDashboard's `selectedOption.value!` convention) + 2 dead submit guards; new coverage via dialog-scoped helpers (dialogOf/clickInDialog/rowButtons/dismissModalWithEscape): breadcrumb navigation (Cloudscape renders the last breadcrumb as plain text — must click "Dashboard", the only real link), lastModified table cell, layers filter, sparse versions/aliases/esm data, create-modal Cancel/Escape/description/cleared timeout+memory/runtime Select/onSuccess-close, detail config runtime/handler/state fallbacks + Failed state + invokeMode + detail-header delete, Config-tab inline concurrency edit/remove/set+onSuccess, URL add/edit fallbacks/CORS/cancel + detail-view delete (the Advanced-tab DeleteButton — Cloudscape Tabs mount only the active panel) + onSuccess on both create/update, event-invoke-config edit/remove/add/values, code-signing edit/detach/add+onSuccess, layer runtime Select/empty description+license payload/cancel/onSuccess-close, invoke payload textarea (user.type can't type `{`/`}` and paste needs clipboardData happy-dom lacks — fireEvent.change) (100% -> all metrics) | Done | 2026-08-12 |
 | 25.117 | EC2Page.tsx (frontend page, 78.9% lines / 65.5% funcs — 93 uncovered lines, the streak's largest gap) — 64 tests added (147 -> 211): row actions never clicked (list Start/Stop/Reboot + terminate confirm, detail Connect/Start/Stop/Reboot + terminate-with-onBack, breadcrumb navigation, instance/VPC detail back), every create modal's onSuccess arrow (all 14 create mutations now invoke opts.onSuccess — v8 attributes the same-line onSuccess arrows to the create line, so the FNs were uncovered despite the creates being tested), every Cancel + Escape onDismiss pair (new dismissModalWithEscape helper — Cloudscape hides closed modals with CSS display:none not aria-hidden, so close assertions check the dialog's `hidden` class), every table filterFunction, all 10 Select onChange handlers (AMI/keyType/volumeType/LT-AMI/resourceType/trafficType/interval/protocol/VPC picks), form inputs never typed (CIDR/AZ/description/logFormat/instance type), CommandBox clipboard-reject + focus fallbacks, LT delete flow, EC2Terminal onClose (mock now renders a Close button). Removed the dead SG revokeIngress branch (no UI sets action=remove — the rule modal only ever opens as add, so the else + hook + import were unreachable; matches the streak's dead-code convention) (100% -> all metrics) | Done | 2026-08-12 |
 | 25.118 | SESDashboard.tsx (frontend dashboard, 78.9% lines / 61.6% funcs) — 17 tests added (77 -> 94): removed the dead verify-domain modal (setShowVerifyDomain(true) never called anywhere — the modal + its 5 lines + hook + state + 2 placeholder tests were unreachable; the identity table's onCreate only opens verify-EMAIL, and the other two modals' openers were already covered); identity notification-detail Close (config-set Close was covered, identity Close wasn't); verify-email Escape; send-email Cancel + Escape; delete tracking options flow (hoisted mockDeleteTrackingOpts — the factory's inline mutateAsync wasn't assertable); notification-topic typed-ARN save with onSuccess + Cancel/Escape; MAIL FROM typed save with onSuccess + Cancel/Escape; create-config-set onSuccess (the existing create test's plain vi.fn never invoked opts.onSuccess, so the same-line arrow FN was dead) + dialog-scoped Cancel (the unscoped /^Cancel$/ hit a different hidden modal's button) + Escape; event-destination add-with-ARN onSuccess + Cancel/Escape; edit-event-dest typed fields onSuccess + Cancel/Escape; tracking-options Save in both create (1329) and edit (1327) branches with onSuccess + Cancel/Escape; delivery-options TLS-policy Select pick + onSuccess + Cancel/Escape. New dismissModalWithEscape/expectModalHidden helpers — Cloudscape closed modals are display:none, so close assertions check the dialog's hidden class (100% -> all metrics) | Done | 2026-08-12 |
| 25.119 | S3Page.tsx (frontend page, 79.1% lines / 75.9% funcs, 67 uncovered lines — the sweep's 4th-lowest file) — 31 tests added (96 -> 127): removed 4 dead branches/guards (breadcrumb onFollow's new URL + bucket-param logic — the bucket breadcrumb is the LAST item so never clickable; handlePrefixChange + onPrefixChange + currentPrefix plumbing — never invoked anywhere in S3ObjectBrowser; upload handleUpload guard and S3 Select handleRunQuery guard — both buttons are disabled under the identical conditions; checksum handleVerify !checksum||empty-value guard — Verify button disabled while empty and the view only renders with checksum data; S3 Select textarea onFocus/onBlur focus-style handlers — happy-dom + React 19 cannot fire onFocus at all (probed focus()/focusIn/dispatchEvent/userEvent — all fail), so the cosmetic handlers were removed). New tests: Overview tab click (S3Overview body never rendered — Tabs mount only the active panel); ← Buckets back-nav (selectBucket(null) + setSearchParams({})); S3 + Dashboard breadcrumb onFollow (hoisted mockNavigate; Cloudscape breadcrumb links are role=link); create-bucket Cancel/Escape/onSuccess/onError (hoisted mockShowToast); upload modal Cancel (closeUpload body), dropzone text on document dragover with dataTransfer.types=["Files"] (FileUpload's dropzoneText closure), success auto-close after the 1200ms timer (real-timer waitFor), prefix typing + mutateAsync payload, error-alert dismiss via class query (Cloudscape Alert's dismiss button has NO accessible name); delete-bucket onSuccess/onError; folder breadcrumb navigate; folder-delete onError + singular toast; object-delete onSuccess/onError; create-folder typed name + onSuccess/onError + Cancel + Escape; tag-update onError + multi-tag edit (map false arm); ACL Select pick via trigger-button + data-open-scoped option (the dropdown renders the option list twice — hidden + open; option click needs the open one) + onSuccess/onError + no-message fallback; checksum verify empty + no-stored-algo + algo-switch (trigger name is "Algorithm <value>") + Verify disabled-button discovery; S3 Select expression textarea typing. New dialogOf/clickInDialog/dismissModalWithEscape helpers (100% lines/funcs/stmts, branch 89.2% -> 91.9%) | Done | 2026-08-12 |
| 25.120 | IoTDashboard.tsx (frontend dashboard, 79.7% lines / 74.4% funcs, 38 uncovered lines — the sweep's largest remaining gap) — 38 tests added (98 -> 136), 100% on ALL metrics (100% branch too): certificate success-modal completions — PEM/public/private-key Download (downloadText body — stubObjectUrl helper overrides URL.createObjectURL/revokeObjectURL since happy-dom may lack them), public/private-key Copy, Escape dismiss (onDismiss + createCert.reset); cert list — Activate on an INACTIVE cert (the Activate button is inline-icon with NO accessible text — clicked by row position), delete-with-confirmation (DeleteButton confirm flow), filter-by-ID (cert cells truncate to 20 chars + "..." so assertions use regex), delete-while-pending loading state; create modals — thing Escape + onSuccess with thing-type typed (clears form), policy Escape + onSuccess, topic-rule Escape + onSuccess with description + lambda action ARN typed (the onCreate button is "Create Topic Rule" via ResourceTable's resourceName), thing-type Escape + onSuccess with description (placeholder is "LightBulb"/"Smart light bulb"); shadow modal — Close + Escape (header "Shadow — <thing>"), update flow with typed JSON + onSuccess clearing the editor, empty-editor Update gate (mutate not called); MQTT — publish Cancel/Escape/onSuccess with retain-checkbox toggle, disconnect onSuccess closing the inspect panel, subscriptions empty-data state, retained-messages empty-data state; sparse-data fallbacks — thing/cert/policy/rule/thing-type rows with missing fields (the || "—" mapping arms), job with no jobId, policy version with no versionId/policyVersionId, subscription qos ?? 0, retained payloadSize/qos fallbacks, policy + thing row toggle-off branches, clipboard .catch fallback (reject-once — the last uncovered FN). No source changes needed (100% -> all metrics) | Done | 2026-08-12 |
| 25.121 | "Reach 100% in every file under 20 uncovered lines" campaign — Batches A+B (32 small files, all now 100% lines + funcs): **Batch A (16 one-two-line files)** — App.tsx (devtools const read at render time — `import.meta.env.DEV` is baked true by vitest, so the production fallback is unreachable; restructured to `if (import.meta.env.DEV) ... else ...` at render), AppLayoutShell.tsx (nav sort comparator — needed 2+ non-implemented services in one category; Athena/Glue order assertion), DynamoDBStreams (iteratorType branch + shard with sequenceNumberRange), EC2NetworkTopology, useActivityFeed (error branch), useS3 (upload error body-unreadable fallback — `as unknown as Response` cast), ACMDashboard/AppConfigDataDashboard/CloudFrontDashboard/CodeBuildDashboard/ECRDashboard/RDSDataDashboard (Escape dismisses + create onSuccess + transaction-input typing), ErrorBoundary (fallback with children prop), ServiceCard (star onMouseLeave opacity reset), ServicePage, Settings (local-storage toggle persistence); **Batch B (16 four-seven-line files)** — DynamoDBExports (create-modal Cancel/Escape/onSuccess + format Select + export-detail Close/Escape), DynamoDBKinesisStreaming (enable modal Cancel/Escape/onSuccess + destination delete confirm), DynamoDBUpdateTable (billing-mode Select switch, streams Toggle off, remove-GSI), EC2Terminal (resize via window + ResizeObserver callback, post-connect fit/focus timers, Disconnect + header Close via unnamed inline-icon buttons clicked by position), useRDS/useSQS (useModifyDBSubnetGroup + useSQSMoveDLQMessages hook tests), APIGatewayDashboard (Escape + description-typed onSuccess), BCMDashboard (filter + Escape + onSuccess), CURDashboard (filter + Escape-reset + onSuccess + timeUnit/format Selects), CognitoDashboard (challenge-name Select + session input in Admin Respond to Challenge, resource-server + custom-attrs Escape; **removed the dead `default: return true` switch arm** — all 9 auth-flow option values have explicit cases, restructured to a ternary chain), ConfigServiceDashboard (5 table filterFunctions), DocDBDashboard (both table filters + cluster/instance modal Cancel/Escape/onSuccess + instance-class typing), KinesisDashboard (create/register-consumer/subscribe Escape + subscribe Close + subscribe needs a consumer mocked; **removed dead "Back to streams" button** — it rendered only in the Streams tab while selectedStream was set, but the tab onChange clears selectedStream first, so it was never visible), S3Dashboard (bucket-name click sets hash, create Escape-reset + onSuccess; the "Create Bucket" text matches both the header and the button label), SSMDashboard (filter + Escape + onSuccess + SecureString type/description/overwrite — trigger accessible name is "Type String"), STSDashboard (assume/session-token modal Cancel + Escape + custom duration). Verification: typecheck clean, full unit suite 8,420 passed (only the Floci integration test fails as usual) | Done | 2026-08-12 |

| 25.122 | Final 3 sweep files — CodePipelineDashboard.tsx (27 uncovered lines, 73.6%->100%), S3BucketConfig.tsx (30 uncovered, 76.2%->100%), CloudFormationPage.tsx (33 uncovered, 75.6%->100%) — all to 100% lines + funcs (the campaign target): **CodePipelineDashboard** (+21 tests, 57 -> 78) — every modal Cancel/Escape/onDismiss/onSuccess: create-pipeline Cancel with provider Select + role ARN typed (the provider input's placeholder is "arn:aws:iam::123456789012:role/..." not "Provider"), start-execution Cancel + success, rollback Cancel (dialog-scoped — 5 modals stay mounted so Cancel index differs), job-detail Close (header text is split across elements so the dialog matcher uses a partial match), override-action Cancel + success, rules filter typing (fires the filterFunctions), webhook Cancel/Escape + create-webhook onSuccess, approve/delete-approval Cancel + success + error, poll-jobs success; new dialogOf(header, regex) helper accepting a regex for split headers; **S3BucketConfig** (+11 tests, 85 -> 96) — versioning Select off-path, encryption SSE-KMS path, lifecycle edit-rule (Delete all + Add rule), policy read-only editor typing, website inputs, public-access toggle, logging target prefix typing, ACL canned Select + onSuccess, CORS save, modal Escape via the awsui-dialog dismiss pattern; split the delete-all-after-last-rule flow (button unmounts), fixed test pollution with explicit mockReturnValue; **CloudFormationPage** (+18 tests, 107 -> 125) — create-stack Cancel/error (useContentRemoved assertions — the modals unmount on close so dialogOf-style checks crash), stack-detail Close + resource-detail Close, create-change-set Cancel + validate error + create error, change-set-detail Close + execute success (clicking the LAST Execute — a row-level Execute button precedes the detail one) + error, stack-set delete success/error + create Cancel/success + detail Close, add-instances Cancel (content-removal assertion) + deploy error, breadcrumb onFollow (scoped to the nav element — "Dashboard" also appears in the page header; "CloudFormation" matches twice too); added the useSystem mock with default return for the new describe + a dialogOf helper. Verification: typecheck clean, full unit suite 268/269 files pass (only the Floci integration test fails as usual — ECONNREFUSED, Floci not running) | Done | 2026-08-13 |
| 25.123 | **Branch-coverage campaign — batches 1-4h (13 commits)** — the branch campaign that followed the line campaign: **batches 1-2** (10 files: KMS, SQS, SNS, IAM, SES, DynamoDBTables, Ec2Messages, Transfer, Glue, EMR + EC2Page 100% branch), **batch 3** (CloudFrontDashboard, DynamoDBExports, AutoScalingDashboard), **4a** (ElasticBeanstalkDashboard, EC2NetworkTopology, SSMDashboard), **4b** (ServiceCard, StatusBadge), **4c** (EC2Terminal, STSDashboard), **4d** (CodePipelineDashboard), **4e** (ConfigServiceDashboard, MskDashboard), **4f** (IAMPage, CloudWatchPage), **4g** (ResourceTable — first dedicated suite, 13 tests; ErrorBoundary — v8-ignore on the statically-inlined NODE_ENV branch), **4h** (S3Page 90.2%->100%, 291/291; CloudFormationPage 90.2%->100%, 252/252) — the campaign pattern: remove dead guards/fallbacks that mirror disabled-button conditions or guaranteed-value option lists (replacing with `!` assertions), wire `vi.hoisted` mutable states + reactive getters into hook mocks (fires `isPending && variables ===` loading arms), invoke `opts.onSuccess`/`opts.onError` in beforeEach (fires close/reset/toast branches), and add sparse-data fixtures (key-absent data fires `\|\| []`/`\|\| "—"` falsy arms the truthy `[]` mocks never did). Verification: typecheck clean, full suite 8,888 passed | Done | 2026-08-16 |
| 25.124 | **Branch-coverage campaign — batches 4i-4m + the 14-file cleanup** — **4i** (S3BucketConfig 96.2%->100%, WafV2Dashboard 91.2%->100% — removed 9 disabled-mirrored guards, DynamoDBTableDetail 95.6%->100% — removed 6 `??` fallbacks + 2 guards), **4j** (AppLayoutShell, CloudWatchLogsDashboard — 7 missed branches each, mixed dead-arm removal + onSelect health-falsy test), **4k** (BCMDashboard 88.2%->100%, SchedulerDashboard 93.4%->100%, CognitoDashboard 97.8%->100% — the 9-level auth-flow disabled ternary refactored into an object lookup), **14-file cleanup** (all single-missed-branch files: ServicePage, StatCard, useEvents, useS3, usePricing, useLogs, ACMDashboard, OpenSearchDashboard, RDSDataDashboard, Route53Dashboard, StepFunctionsDashboard, BatchDashboard, S3VectorsDashboard, DynamoDBUpdateTable — 12 tests + 6 dead-arm removals), **4l** (CloudMapDashboard, ECRDashboard, KinesisDashboard — hoisted delete states + key-absent drill-down data + 2 dead Select fallbacks), **4m** (AppSyncDashboard, ElastiCacheDashboard, DynamoDBAdvanced — 9 dead guards/fallbacks removed, no test changes needed). Verification: typecheck clean, full suite 8,925 passed | Done | 2026-08-16 |
| 25.125 | **Branch-campaign verification + final stragglers** — the whole-repo threshold run exposed 3 real gaps the frontend-only sweep's path filter had masked: **DynamoDBStreams** (removed the `!streamDetailArn \|\| !shardId` and `!nextIterator` guards — the panel/poll buttons only render when those values are set), **ECSDashboard** (removed the task-definition `\|\| ""` and launch-type `\|\| "FARGATE"` Select fallbacks), **LambdaPage** (+1 test clicking the Reserved-concurrency edit icon with concurrency unset — fires the `?? ""` nullish arm). Also found and fixed the root cause of the never-passing integration suite: `config.ts` captures FLOCI_URL at import time, so integration.test.ts's late env assignment never took effect and routes fetched the Docker-internal port 4566 instead of host-mapped 9878 — added `setFlociEndpoint()`; and restored `globalThis.fetch` after s3-select.test.ts's raw mock assignments leaked across fork workers. Verification: with Floci up, full suite 271/271 files, 9,221/9,221 tests, exit 0 — the first fully green end-to-end run | Done | 2026-08-16 |
| 25.126 | **100% line + statement coverage repo-wide (all metrics)** — the milestone: **EventsPage** (+1 test feeding an unparseable bus policy — covered the JSON.parse catch return-null arm, the last uncovered statement in the repo), **vitest.config.ts** (testTimeout 10s -> 20s — modal-flow and integration tests exceeded 10s under full-suite parallel load with coverage instrumentation, which also silently truncated coverage mid-test; excluded the two pure type-declaration files src/frontend/types/api.ts + src/backend/types.ts since they have no executable statements), **deleted the tracked-but-empty useService.ts** (0 bytes, nothing imports it), and removed a stray src/frontend/coverage/ dir (created by a mis-cwd run) that the include glob was matching at 0%. Final verified state: typecheck clean; full suite with Floci up 271/271 files, 9,221/9,221 tests, exit 0; coverage **100% statements / 100% branch / 100% functions / 100% lines** — every file with executable code at 100% on every metric, far above the vitest thresholds (72/50/62/74) and the codecov patch target (75%) | Done | 2026-08-16 |
| 25.127 | **Floci parity audit (2026-08-17)** — service-level diff (65/65 Floci services matched, zero missing), control-plane enumeration (`/_floci/*` vs `system.ts` — found reset/nuke/diagnose/config unwired), and operation-level diff (Floci `case "Op"` + `*_ACTIONS` sets vs dashboard SDK commands, filtered for false positives: enum/field names, STS ops covered by sts.ts, ec2messages agent-channel ops). Result: 17 new gap items added to the GAP ANALYSIS as G.81–G.97 (2 control-plane + 15 operations), summary stats updated | Done | 2026-08-17 |
| 25.128 | **G.81+G.82 — Floci control plane (Settings page)** — `system.ts` +4 proxy routes: `GET /diagnose`, `GET /config` (→ `/_floci/diagnose`/`/_floci/config`), `POST /state/reset`, `POST /state/nuke` (→ `/_floci/state/reset|nuke` with `{ method: "POST" }`); Settings.tsx new "Floci Maintenance" container: Reset/Nuke buttons (primary) with a confirm modal (header "Reset/Nuke Floci state?", Cancel + confirm, body warning), success/error maintenance alerts (dismissible), "Load diagnostics" button opening a monospace JSON modal; removed the dead `if (target)` guard behind the confirm button (modal only renders with `confirmTarget !== null` → `handleMaintenance(target!)`); +5 backend tests (each route happy path + reset error propagation) and +11 frontend tests (section render, modal open/cancel, reset/nuke confirm flows + API assertions, reset error + non-Error fallback, alert dismiss, diagnostics load/open/close + error + fallback + dismiss). Verification: scoped runs 100/100/100/100 on both files, typecheck clean, `make test-cov` exit 0 (272/272 files, 8,956 tests, 100% all metrics) | Done | 2026-08-17 |
| 25.129 | **G.83 — DynamoDB native Query** — backend `dynamodb.ts` +1 route: `POST /tables/:name/items/query-native` (QueryCommand; requires keyConditionExpression → 400 when missing; optional expressionAttributeValues/Names, indexName, scanIndexForward, limit, exclusiveStartKey, filterExpression — marshalled when present, omitted when empty, lastEvaluatedKey unmarshalled, sparse-response `|| []`); `useDynamoDBQuery` hook (mutation → POST query-native, invalidates items cache); DynamoDBTableDetail +"Query" tab (key-condition expression input, values/names JSON textareas with parse errors, index name, limit with NaN guard, scan-index-forward toggle, Run Query button disabled until expression typed, results JSON viewer + empty state); removed the dead `if (!queryExpr.trim()) return;` guard (button disabled under the same condition → `!` convention). Tests: +6 backend (400 without expression, minimal happy path asserting QueryCommand, all-optional-params passthrough, empty-optionals omitted, lastEvaluatedKey, sparse response), +2 hook (endpoint+body, invalidation), +9 component (tab render, full flow with JSON typing via fireEvent.change — userEvent can't type `{`/`}`, empty results, invalid values/names JSON errors, mutation error + generic fallback, error dismiss, forward toggle off, non-numeric limit omitted). Verification: scoped runs 100/100/100/100 on all 3 files, typecheck clean, `make test-cov` exit 0 (272/272 files, 8,974 tests, 100% all metrics) | Done | 2026-08-17 |
| 25.130 | **G.90 — ECR image manifests + auth token** — backend `ecr.ts` +2 routes: `GET /repositories/:name/images/manifest?tag=|digest=` (BatchGetImage — 400 without tag or digest, null image when absent, sparse `|| []`), `GET /auth-token` (GetAuthorizationToken — nulls when sparse); hooks: `useECRImageManifest` mutation (URLSearchParams for tag/digest) + `useECRAuthToken` lazy query (enabled: false, manual refetch); ECRDashboard: per-repo "Manifest" button → modal with tag/digest inputs + Fetch (disabled until one is filled) + JSON result viewer (`result.image || result` fallback) + error alert, "Auth token" button → modal with Fetch token + read-only token/proxy/expiry inputs (dash fallbacks) + error alert; removed the dead `!repoName ||` guard (modal only renders with repoName → `repoName!`). Tests: +7 backend (tag/digest/both-missing 400/null-image/sparse, auth-token happy + sparse), +5 hook (tag/digest/no-params URL building, lazy no-fetch + refetch), +13 component (manifest open/fetch-by-tag/fetch-by-digest/empty-gate/error/generic-error/dismiss/close/image-null fallback, auth open+refetch/render-data/error/generic-error/dashes/close). Verification: scoped runs 100/100/100/100 on all 3 files, typecheck clean, `make test-cov` exit 0 (272/272 files, 9,001 tests, 100% all metrics) | Done | 2026-08-17 |
| 25.131 | **G.93 — EventBridge UpdateEventBus** — backend `events.ts` +1 route: `PUT /buses` (UpdateEventBusCommand — name required → 400; description/KmsKeyIdentifier/DeadLetterConfig optional, omitted when absent; returns Arn/Name/Description/KmsKeyIdentifier); `useUpdateEventBus` hook (PUT with full body); EventsPage buses tab: per-row Edit icon button (non-default buses) → EditBusModal (prefilled description from `bus.Description || ""`, Save → description.trim() || undefined, success/error toasts, Cancel). Tests: +3 backend (full update with description/kms/dead-letter ARN asserting command fields, 400 without name, optionals omitted), +2 hook (full body, minimal body), +6 component (open with prefilled description, open without description → empty input, save success + toast + close, cleared description → undefined, save error toast, cancel no-op). Verification: scoped runs 100/100/100/100 on all 3 files, typecheck clean, `make test-cov` exit 0 (272/272 files, 9,012 tests, 100% all metrics) | Done | 2026-08-17 |
| 25.139 | **G.84 — Step Functions activities, task callbacks, sync executions, validation, tags** — backend `stepfunctions.ts` +13 routes: `POST /activities` (CreateActivity — 400 without name, sparse `|| null`), `DELETE /activities/:arn`, `GET /activities/:arn` (DescribeActivity — sparse null), `POST /activities/:arn/tasks` (GetActivityTask — 400 without workerName, sparse null), `POST /activities/:arn/tasks/success` (SendTaskSuccess — 400 without taskToken, output `?? "{}"` default), `POST /activities/:arn/tasks/failure` (SendTaskFailure — 400 without taskToken, error/cause `|| undefined`), `POST /activities/:arn/tasks/heartbeat` (SendTaskHeartbeat — 400 without taskToken), `POST /state-machines/:arn/sync-executions` (StartSyncExecution — name/input optional, sparse null), `POST /state-machines/validate` (ValidateStateMachineDefinition — 400 without definition, `result === "OK"` → valid, `diagnostics || []`), `GET/PUT/DELETE /state-machines/:arn/tags` (ListTagsForResource sparse `|| []`, TagResource 400 without tags, UntagResource 400 without tagKeys); `useStepFunctions` +12 hooks (create/delete/describe activity, get-task + 3 send-task mutations, sync-execution + validate mutations, tags query gated on arn + tag/untag mutations); StepFunctionsDashboard: Activities tab "Create activity" modal (disabled-until-name, trimmed name, error fallback, Cancel/Escape), per-row DeleteButton + "Task callbacks" modal (worker name Poll → task token/input with dash fallbacks, Send success with output input, Send failure with error/cause `|| undefined`, Heartbeat, error fallbacks, no-task empty state, Close/Escape), State Machines tab "Validate definition" modal (disabled-until-definition, valid/invalid-with-diagnostics/invalid-without/diagnostic-without-code-or-message arms, error fallback, Close/Escape), per-row "Tags" modal (Badges + Remove, key/value Add disabled without key, sparse no-tags state, Close/Escape) + "Sync run" modal (name/input optional with empty-input `|| undefined` arm, success alert with dash fallbacks, error fallback, Cancel/Escape). Tests: +23 backend (each route happy/400/sparse, FAIL diagnostics arm, optionals-omitted), +12 hook (URL/method/body + invalidation + arn-null gate), +22 component (create success/trim/disabled/error/cancel, delete + loading arm, poll/send-success/send-failure/heartbeat/errors/sparse/empty-optional, tags add/remove/empty/sparse/escape, sync run full/sparse-empty-input/error/cancel, validate valid/invalid×2/diagnostics-blank/error/escape). Verification: scoped runs 100/100/100/100 on all 3 files, typecheck clean |
| 25.140 | **G.62 — Kinesis day-2 stream management** — backend `kinesis.ts` +11 routes: `POST /streams/:name/retention/increase` + `/decrease` (400 without retentionPeriodHours), `POST /streams/:name/encryption/start` (400 without encryptionType/keyId) + `/stop` (AWS requires EncryptionType/KeyId on StopStreamEncryption — sent as NONE/empty, Floci ignores), `POST /streams/:name/monitoring/enable` + `/disable` (ShardLevelMetrics \|\| [], maps StreamName/StreamARN/CurrentShardLevelMetrics/DesiredShardLevelMetrics with sparse `\|\| []`), `PUT /streams/:name/stream-mode` (Floci UpdateStreamMode accepts StreamARN only — 400s for streamARN/streamMode), `POST /streams/:name/shards/split` + `/merge` (400 guards per field), `PUT /streams/:name/tags` (AddTagsToStream, 400 when tags empty), `DELETE /streams/:name/tags` (RemoveTagsFromStream, 400 when tagKeys empty); `useKinesis` +12 hooks (add/remove tags, retention inc/dec, encryption start/stop, monitoring enable/disable with sparse normalization in the enable mutationFn, stream mode, split/merge shard; shared useInvalidateKinesis invalidates streams+stream-detail); KinesisDashboard new "Settings" tab: Retention container (Increase/Decrease disabled-until-hours, error alerts with dismiss), Encryption container (KMS start disabled-until-key, stop, combined error alert), Enhanced monitoring (comma-split metrics, success alert with current/desired metrics), Stream mode Select gated on stream ARN presence, Resharding (split select+hash key, merge two selects, both disabled-until-valid), Tags table + add form (disabled-until-key) + per-tag DeleteButton. Tests: kinesis.test.ts 39→65 (+26: every route happy + 400 arms + sparse monitoring + Add/RemoveTags command assertions via delBody helper), useKinesis.test.ts 22→34 (+12 incl. enable sparse-normalization arm), KinesisDashboard.test.tsx 58→94 (+36: all sections render, every mutation flow with payload asserts + input clears, all disabled gates, every error alert incl. fallback-message arms via new Error(""), dismiss clicks firing onDismiss resets, three-trigger merge flow clicking open dropdown instances). Verification: scoped runs 100% stmts/branch/funcs/lines on all 3 files, typecheck clean, make test-cov exit 0 (272 files, coverage 100% repo-wide) | Done | 2026-08-22 |
| 25.138 | **G.86 — Cognito admin user ops + update flows** — backend `cognito.ts` +14 routes: `GET /user-pools/:id/users/:username` (AdminGetUser — null when sparse), `DELETE /user-pools/:id/users/:username/groups/:groupName` (AdminRemoveUserFromGroup), `POST /user-pools/:id/users/:username/reset-password` (AdminResetUserPassword), `PUT /user-pools/:id/users/:username/attributes` (AdminUpdateUserAttributes), `POST /user-pools/:id/auth/change-password` (ChangePassword — 400 without accessToken), `POST /user-pools/:id/auth/sign-up` (SignUp — 400 without clientId/username), `POST /user-pools/:id/auth/respond-challenge` (RespondToAuthChallenge — 400 without clientId), `GET /user-pools/:id/groups/:groupName` (GetGroup — `result.Group || null` null arm), `PUT /user-pools/:id/groups/:groupName` (UpdateGroup — description/roleArn/precedence optional), `PUT /user-pools/:id` (UpdateUserPool — name/mfaConfiguration optional), `PUT /user-pools/:id/clients/:clientId` (UpdateUserPoolClient — name/refreshTokenValidity optional), `GET/PUT /user-pools/:id/tags` (ListTagsForResource/TagResource — sparse `|| {}`), `DELETE /user-pools/:id/tags` (UntagResource — 400 without tagKeys); `useCognito` +9 hooks (user detail query, remove-from-group/reset-password/update-attributes/change-password/sign-up/respond-challenge mutations, group query + update mutation, pool/client update mutations, tags query + tag/untag mutations); CognitoDashboard: Users tab "View" button → user detail modal (attributes + Enabled/Created dashes, Reset password, spinner loading arm, not-found + no-attributes fallbacks), Groups tab per-row Edit → UpdateGroup modal (description/role ARN/precedence with `|| undefined` empty-field arms, Save/Cancel), App Clients tab per-row Edit → UpdateUserPoolClient modal (name + refresh validity, empty-optional save arm), pool detail header "Edit pool" (name + MFA Select, sparse-list `|| ""` prefill arm) + "Tags" buttons → UpdateUserPool + tags modals (Badges + Remove per tag, key/value Add tag disabled without key, sparse-payload `|| {}` no-tags state, Close), Auth Flows tester +3 flow types (change-password, sign-up, respond-to-challenge with JSON.parse responses arm); removed 2 dead `|| []` arms behind ternary guards. Tests: +21 backend (each route happy/400/sparse + UpdateGroup null arm), +9 hook (each mutation body/URL + invalidation), +25 component (user detail open/reset/not-found/loading/no-attributes, group edit full/empty-dash-fallbacks/cancel/save, client edit full/empty-optional/cancel, pool edit full/sparse-empty-save, tags add/remove/empty/sparse, 3 auth-flow runs incl. JSON responses, Escape/cancel dismiss paths). Verification: scoped runs 100/100/100/100 on all 3 files, typecheck clean |
| 25.137 | **G.85 — IAM group membership, group policies, instance profiles, SetDefaultPolicyVersion, tags** — backend `iam.ts` +10 routes: `GET /groups/:name` (GetGroup — group + members), `POST /groups/:name/users` (AddUserToGroup — 400 without userName), `DELETE /groups/:name/users/:userName` (RemoveUserFromGroup), `GET /groups/:name/inline-policies` (ListGroupPolicies — sparse `|| []`), `GET /groups/:name/inline-policies/:policyName` (GetGroupPolicy — decoded document, null fallback), `PUT /groups/:name/inline-policies` (PutGroupPolicy — 400 without policyName, invalid-JSON 400), `DELETE /groups/:name/inline-policies/:policyName` (DeleteGroupPolicy), `POST /policies/:arn/set-default-version` (SetDefaultPolicyVersion), `POST/DELETE /policies/:arn/tags` + `/roles/:name/tags` + `/users/:name/tags` (Tag/Untag with 400 guards); user detail (`GET /users/:name`) and policy detail (`GET /policies/detail`) now also return tags; `useIAM` +19 hooks (group query/membership mutations, group inline-policy query/mutations, set-default-version, tag/untag user-role-policy, create/delete instance profile, add/remove role on profile); IAMPage: Groups tab gained a "View" button → group detail modal (member table with Remove, add-user input, inline-policy list with View-document alert + Delete + add-policy form with Cancel), Policies tab policy detail gained a version Select "Set as default" button + TagEditor, Role/User detail modals gained TagEditor (add tag key/value + Remove per tag), new Instance profiles tab (create modal with name/path, add-role modal, per-role Remove, DeleteButton, sparse fallbacks); removed dead `p.roles || []` in the roles map (ternary guard). Tests: +14 backend (group detail/sparse, add/remove user incl. 400, group policy list/sparse/get/doc-null/put/400/no-doc/invalid-json/delete, set-default, user detail now 6 sends + tags, policy detail tags/absent-tags), +22 hook (group query + null-gates, membership mutations, policy query/mutations + gates, set-default URL encoding, 6 tag mutations, 4 instance-profile mutations), +27 component (group detail open/not-found/members/add-remove/error/loading/sparse/empty-members, policy add/view/delete/error/cancel/alert-dismiss/no-document, set-default + tag editor + errors, role/user tag editors + errors, instance profiles tab empty/create/delete/add-role/remove-role/sparse/errors/cancel/escape). Verification: scoped runs 100/100/100/100 on all 3 files, typecheck clean |
| 25.136 | **G.95 — Auto Scaling launch configs + instance ops** — backend `autoscaling.ts` +6 routes: `POST /launch-configurations` (CreateLaunchConfigurationCommand — 400 without name, optional fields passed through), `DELETE /launch-configurations/:name` (decodeURIComponent), `GET /groups/:name/instances` (DescribeAutoScalingInstancesCommand, client-side group filter), `POST /groups/:name/instances/attach` (400 without non-empty InstanceIds), `POST /groups/:name/instances/detach` (400 without ids, ShouldDecrementDesiredCapacity passthrough), `POST /instances/terminate` (400 without InstanceId); `useAutoScaling` +6 hooks (create/delete launch config mutations invalidating the LC cache, instances query gated on group, attach/detach/terminate mutations); AutoScalingDashboard: Launch Configurations tab gained `onCreate` (Create modal: name required + optional AMI/type/key/security-groups/user-data/IAM-profile/associate-public-IP, `trim() \|\| undefined` + split/filter SGs, success toast, message-less-error fallback alert with dismiss, Cancel + Escape) and a per-row DeleteButton (batch-delete via single-name mutation); Advanced tab gained an "Instances" container (rendered after the classic-LB section to preserve the pre-existing Attach-button index contract): instance table with `ProtectedFromScaleIn ? "Yes" : "No"`, Terminate per row (`ShouldDecrementDesiredCapacity: true`, success toast + fallback error alert), Attach/Detach comma-separated inputs + buttons (disabled when empty, success toasts + dismissible fallback error alert), empty + `data: undefined` sparse states; removed the dead `\|\| []` on the instances `.map` (ternary guard guarantees non-empty). Tests: +7 backend (create full/400, delete, instances filter/sparse, attach/400, detach/400, terminate/400), +7 hook (create body, delete encoded, instances null-gate + URL, attach/detach/terminate bodies), +13 component (create with all fields incl. user-data textarea + toast, fallback error + dismiss + cancel, Escape, delete, instances render + terminate, attach/detach, attach error + dismiss, terminate error, detach error, sparse). Verification: scoped runs 100/100/100/100 on all 3 files, typecheck clean, `make test-cov` exit 0 (273/273 files, 9,135 tests, 100% all metrics) | Done | 2026-08-17 |
| 25.135 | **G.97 — SSM batch params + instance info** — backend `ssm.ts` +5 routes: `POST /parameters/batch` (GetParametersCommand — 400 when Names missing/empty, sparse `\|\| []`), `GET /parameters-by-path` (GetParametersByPathCommand — 400 without path, recursive/withDecryption booleans, `nextToken \|\| null`), `POST /parameters/delete-batch` (DeleteParametersCommand — 400 without Names, sparse arms), `POST /parameters/label` (LabelParameterVersionCommand — 400 without Name or ParameterVersion, `Labels \|\| []`), `GET /instance-information` (DescribeInstanceInformationCommand — sparse `\|\| []`); `useSSM` +5 hooks (batch-get/delete-batch/label mutations invalidating the parameters cache, by-path query gated on path, instance-information polling query); SSMDashboard: "Parameter Lookup" container (path input + Load by path → clickable results with value-or-dash, empty + sparse states), "Batch get" modal (comma-separated names, validation + error fallback + dismiss, results with Label (`Version ?? 1` fallback) + Delete via batch delete, Cancel/Escape), "Label parameter version" modal (validation + fallback error + dismiss + Cancel), new "Managed Instances" tab (instance table with dash fallbacks + empty + sparse states); removed dead `if (!labelTarget) return;` guard and the `\|\| null` arm behind the disabled Load button. Tests: +7 backend (batch happy/sparse/400, by-path happy/sparse/400, delete-batch happy/sparse/400, label happy/default-labels/400×2, instance-info happy/sparse), +7 hook (batch body, by-path null-gate + encoded path, delete-batch body, label body, instance GET), +13 component (path load+navigate, empty path, dash values, sparse path, batch fetch+label flow, batch validation+dismiss, batch error+delete result, label validation/fallback/dismiss/cancel, sparse batch dashes + version-1 fallback, sparse batch no-array, Escape, instances tab data/dashes, instances empty, instances sparse). Verification: scoped runs 100/100/100/100 on all 3 files, typecheck clean, `make test-cov` exit 0 (273/273 files, 9,112 tests, 100% all metrics) | Done | 2026-08-17 |
| 25.134 | **G.94 — WAFv2 UpdateWebACL + CheckCapacity** — backend `wafv2.ts` +2 routes: `PUT /web-acls/:id` (UpdateWebACLCommand — 400 when Name/Scope/LockToken missing, Description/DefaultAction/Rules/VisibilityConfig/CustomResponseBodies/CaptchaConfig/ChallengeConfig/TokenDomains/AssociationConfig passed through, returns `{ nextLockToken }`), `POST /capacity` (CheckCapacityCommand — 400 without Rules, `body.Scope \|\| "REGIONAL"` default, returns `{ capacity }`); `useUpdateWebACL` (PUT with encoded id, invalidates web-acls cache with REGIONAL fallback) + `useCheckCapacity` (POST) hooks; WafV2Dashboard: per-web-ACL "Edit" button → modal with description input (`description === "\u2014" ? "" : description` prefill), default-action Allow/Block Select, rules JSON textarea, Save (invalid JSON → dismissible validation alert; success → close + toast; message-less error → fallback text), "Check capacity" button (success alert with unit count, invalid-JSON + message-less-error alerts, all dismissible, Escape closes modal). Tests: +7 backend (full update asserting command fields, 3 separate 400 arms, capacity explicit-scope + REGIONAL default + 400), +3 hook (PUT URL encoding + body, REGIONAL fallback, capacity POST), +9 component (open+prefill+save with edited description/Block/rules asserting payload, em-dash description omitted, invalid-JSON validation + dismiss, message-less error fallback, capacity success + dismiss, capacity invalid-JSON + failed-check error + dismiss, empty-rules fallback save + capacity, cancel, Escape). Verification: scoped runs 100/100/100/100 on all 3 files, typecheck clean, `make test-cov` exit 0 (273/273 files, 9,081 tests, 100% all metrics) | Done | 2026-08-17 |
| 25.133 | **G.91 — ELBv2 DescribeTags / ModifyListener / ModifyTargetGroup** — backend `elb.ts` +3 routes: `GET /tags?arns=` (DescribeTags — 400 without arns, sparse `|| []`), `PUT /listeners` (ModifyListener — 400 without listenerArn, sslPolicy/certificates omitted when absent, certificates split/trim/filtered), `PUT /target-groups/health-check` (ModifyTargetGroup — 400 without targetGroupArn, numeric fields NaN-guarded to undefined); `useELB` +3 hooks (tags query gated on arns, modify-listener + modify-target-group mutations); ELBDashboard: per-load-balancer "Tags" modal (Badges, "No tags found." empty state, Close button + Escape dismiss), per-listener "Edit" modal (prefilled port `String(l.port ?? "")` + protocol `l.protocol \|\| "HTTP"` fallbacks, protocol Select, optional SSL policy + comma-separated certificate ARNs, error alert with dismiss), per-target-group "Health check" modal (path + 4 optional numeric fields with NaN guards, error alert with dismiss). Tests: +3 backend (tags happy/400/sparse, listener modify full/400/optionals-omitted, TG health-check full/400), +4 hook (tags URL+enabled gate, both mutations URL/method/body), +12 component (tags modal open/empty/close/escape, listener modal open+save-with-all-fields/portless-protocol-less fallbacks/error+clear-port/fallback-message/error-dismiss/cancel/escape, health-check save-with-all-fields/non-numeric-undefined/error-fallback+dismiss/cancel/escape). Verification: scoped runs 100/100/100/100 on all 3 files, typecheck clean, `make test-cov` exit 0 (273/273 files, 9,067 tests, 100% all metrics) | Done | 2026-08-17 |
| 25.132 | **G.87 — SES account stats + raw send** — backend `ses.ts` +6 routes: `GET /account-sending` (GetAccountSendingEnabled), `PUT /account-sending` (UpdateAccountSendingEnabled — 400 without enabled), `GET /send-quota` (GetSendQuota), `GET /send-stats` (GetSendStatistics — sparse `|| []`), `POST /send-raw` (SendRawEmail — 400 without rawMessage; source optional), `POST /verify-email-address` (VerifyEmailAddress — 400 without emailAddress); `useSES` +6 hooks (account-sending query + update mutation, quota/stats queries, send-raw + verify-address mutations); SESDashboard new "Account" container: sending-enabled Toggle (`sendingEnabled?.enabled ?? false` unchecked arm), quota StatCards with dash fallbacks, send-statistics ResourceTable gated on `(sendStats?.sendDataPoints || []).length > 0`, "Send raw email" (MIME) modal (raw-message textarea + optional source, Send disabled until message typed, error alert dismissible), "Verify address" modal (disabled until email typed, generic error fallbacks for message-less failures). Tests: +6 backend (each route happy/400/sparse), +8 hook (all six hooks' URL/method/body + invalidation), +14 component (toggle on/off/error/dismiss/absent-null, quota dashes, stats table present/absent/absent-data, verify happy/error/generic-error, send-raw happy with source/error/generic-error/cancel/escape/alert-dismiss). Verification: scoped runs 100/100/100/100 on all 3 files, typecheck clean, `make test-cov` exit 0 (273/273 files, 9,054 tests, 100% all metrics) | Done | 2026-08-17 |

---

## ═══════════════════════════════════════════════════════════
## GAP ANALYSIS — Floci Operations Not Yet Exposed in Dashboard
## ═══════════════════════════════════════════════════════════

> **Audit date:** 2026-07-13 (1st/2nd pass, verified against dashboard codebase), **2026-08-17 (3rd pass — service-level + control-plane + operation-level parity audit)**
> **Method:** Compared every `case` statement in Floci's Java handlers against the dashboard's backend route files. Each item was verified by searching for the corresponding AWS command in both Floci handlers and dashboard routes. The 2026-08-17 pass also diffed the Floci service directory list against dashboard routes (65/65 services matched — **zero missing services**) and enumerated Floci's lifecycle control endpoints (`/_floci/*`) against `system.ts`.
> **Result:** All 65 Floci services have basic CRUD in the dashboard. However, many services have significant Floci-supported operations NOT yet exposed. Several items from the initial audit (G.5 old, G.10 old, G.12 old partial, G.18 old, G.27 old) were found to be already implemented and have been removed. The 3rd pass added the **control-plane gap category (G.81–G.82)** and operation gaps G.83–G.97 that the July audit did not list.

### Latest Gap Analysis — Service Depth & Priority Order

*Service coverage is now complete — all 66 Floci services have basic dashboard support (backend route, frontend hook, dashboard component, serviceRegistry entry). The focus is now entirely on depth.*

#### Service Depth Tiers

| Tier | Count | Description |
|------|-------|-------------|
| **Rich** | ~12 | Full CRUD + service-specific features + detail views (e.g., S3, DynamoDB, IAM, Lambda, EC2, API Gateway) |
| **Good** | ~15 | CRUD + some extras (invoke, config, versions) (e.g., KMS, Secrets Manager, Step Functions, CloudFormation) |
| **Basic** | ~38 | List + Create + Delete + minimal detail; missing deeper operations |

#### Notable Feature Gaps by Service

| Service | Missing Features | Floci Ops Missed |
|---------|-----------------|------------------|
| **EventBridge (Events)** | Archives (create/describe/delete/update) ✅ Done 2026-07-20, Replays (start/describe/cancel) ✅ Done 2026-07-20, Permissions management (PutPermission/RemovePermission) ✅ Done 2026-07-20, TestEventPattern | 8+ operations |
| **Cognito** | AdminRespondToAuthChallenge, AdminUserGlobalSignOut, AddCustomAttributes, GetUserPoolMfaConfig, DescribeResourceServer, ListUserPoolClientSecrets, admin auth flow testers, Resource Server CRUD | 10+ operations |
| **Kinesis** | SubscribeToShard, DisableEnhancedMonitoring, Start/StopStreamEncryption, DecreaseStreamRetentionPeriod, stream mode/consumers | 8+ operations |
| **Lambda** | UpdateAlias, UpdateEventSourceMapping, GetPolicy, AddPermission, RemovePermission, GetLayerVersion, resource-based policy management | 5+ operations |
| **SQS** | CancelMessageMoveTask, ListMessageMoveTasks (DLQ move task management), ChangeMessageVisibility batch | 3+ operations |
| **RDS** | DBParameterGroup edit, ModifyDBCluster, DBClusterParameterGroups, DBSubnetGroups | 5+ operations |
| **EC2** | IamInstanceProfileAssociations, ModifySecurityGroupRules, DescribeAddressesAttribute, DescribeVpcEndpointServices | 5+ operations |
| **CloudFront** | Distribution tags, Origin Request Policies, Response Headers Policies, monitoring/subscriptions | 4+ operations |
| **SNS** | ConfirmSubscription, SetEndpointAttributes, SetPlatformApplicationAttributes, SetSubscriptionAttributes | 5+ operations |
| **CloudWatch Metrics** | GetMetricWidgetImage, ListDashboards, PutDashboard, DeleteDashboards | 4+ operations |
| **CloudWatch Logs** | PutRetentionPolicy, DeleteRetentionPolicy, TagLogGroup | 3+ operations |
| **SES** | SendBulkTemplatedEmail (v1), SendBulkEmail (v2) | 2+ operations |
| **MSK** | Configuration management, broker operations | 2+ operations |
| **EMR** | Cluster detail with tags + step management | 2+ operations |

#### Recommended Priority Order for Deepening

1. **EventBridge** — Archives + Replays are major missing features
2. **Cognito** — Auth flow testers, Resource Servers, MFA config
3. **Kinesis** — Encryption toggle, enhanced monitoring, stream mode editor
4. **Lambda** — Resource-based policy management (AddPermission)
5. **SQS** — Message move task management (list/cancel)
6. **RDS** — Parameter groups edit UI, cluster parameter groups
7. **EC2** — Instance profiles, security group rules description
8. **CloudFront** — Origin/response header policies, monitoring
9. **MSK** — Configuration management, broker operations
10. **EMR** — Cluster detail with tags + step management

### Priority Tiers

| Tier | Meaning |
|------|---------|
| **P1** | High-value — significant Floci operations with clear UI benefit |
| **P2** | Moderate-value — useful operations for completeness |
| **P3** | Low-value — niche operations, stubs, or rarely used |

---

### P1 — High-Value Missing Features (15 items)

| # | Service | Missing Operations | Floci Handler | Dashboard Impact |
|---|---------|-------------------|---------------|-----------------|
| G.1 | **DynamoDB Streams** | ListStreams, DescribeStream, GetShardIterator, GetRecords | `DynamoDbStreamsJsonHandler` | Done 2026-07-13 — users can't see item-level changes |
| G.2 | **EC2 Flow Logs** | CreateFlowLogs, DescribeFlowLogs, DeleteFlowLogs | `Ec2QueryHandler` | Done 2026-07-18 — Flow Logs tab in EC2 page |
| G.3 | **EC2 Network ACLs** | CreateNetworkAcl, DescribeNetworkAcls, DeleteNetworkAcl, CreateNetworkAclEntry, ReplaceNetworkAclEntry, DeleteNetworkAclEntry, ReplaceNetworkAclAssociation | `Ec2QueryHandler` | Done 2026-07-13 — network ACL resource type |
| G.4 | **S3 Select** | SelectObjectContent (SQL queries on CSV/JSON objects) | `S3SelectService` + `S3Controller` | Done 2026-07-13 | — users can't query object contents with SQL |
| G.5 | **CloudFormation** (Stack Sets) | CreateStackSet, DescribeStackSet, ListStackSets, UpdateStackSet, DeleteStackSet, CreateStackInstances, ListStackInstances, DescribeStackInstance, DeleteStackInstances, ListStackSetOperations, DescribeStackSetOperation | `CloudFormationQueryHandler` + `StackSetService` | Done (Stack Sets list/create/detail/delete + stack instance management) |
| G.6 | **CloudFormation** (Events + Stack Resources) | DescribeStackEvents, DescribeStackResource, SetStackPolicy, GetStackPolicy | `CloudFormationQueryHandler` | Done 2026-07-16 (Events tab, resource detail, and Policy tab with get/set — Floci accepts policy but does not persist it) |
| G.7 | **Glue** (Schema Registry) | CreateRegistry, GetRegistry, ListRegistries, UpdateRegistry, DeleteRegistry, CreateSchema, RegisterSchemaVersion, GetSchemaVersion, GetSchema, ListSchemas, ListSchemaVersions, DeleteSchema, GetSchemaVersionsDiff, CheckSchemaVersionValidity, PutSchemaVersionMetadata, RemoveSchemaVersionMetadata, QuerySchemaVersionMetadata | `GlueJsonHandler` | Done 2026-07-14 (UpdateRegistry, GetSchemaVersion, GetSchemaVersionsDiff, CheckSchemaVersionValidity, Query/Put/RemoveSchemaVersionMetadata + version detail modal) |
| G.8 | **Glue** (UDFs + Column Stats + Partitions) | CreateUserDefinedFunction, GetUserDefinedFunction, GetUserDefinedFunctions, UpdateUserDefinedFunction, DeleteUserDefinedFunction, UpdateColumnStatisticsForTable, GetColumnStatisticsForTable, DeleteColumnStatisticsForTable (same for Partition), BatchCreatePartition, BatchUpdatePartition, BatchGetPartition, UpdatePartition, DeletePartition, GetPartition | `GlueJsonHandler` | Done 2026-07-14 (BatchUpdatePartition added; other UDF/partition/column-stats ops already present) |
| G.9 | **WAFv2** (Regex Pattern Sets) | CreateRegexPatternSet, GetRegexPatternSet, UpdateRegexPatternSet, DeleteRegexPatternSet, ListRegexPatternSets | `WafV2Handler` | Done 2026-07-14 (UpdateRegexPatternSet hook + regex edit modal with LockToken fetch) |
| G.10 | **WAFv2** (Logging + Associations) | PutLoggingConfiguration, GetLoggingConfiguration, DeleteLoggingConfiguration, ListLoggingConfigurations, AssociateWebACL, DisassociateWebACL, GetWebACLForResource, ListResourcesForWebACL, PutPermissionPolicy, GetPermissionPolicy, DeletePermissionPolicy | `WafV2Handler` | Done 2026-07-14 (backend/hooks/dashboard already complete; added test coverage) |
| G.11 | **SES** (Identity Notifications + Feedback) | SetIdentityNotificationTopic, GetIdentityNotificationAttributes, SetIdentityFeedbackForwardingEnabled, SetIdentityHeadersInNotificationsEnabled | `SesQueryHandler` | Done 2026-07-21 — notification topics, feedback forwarding, and headers in notifications UI implemented with backend/hook tests |
| G.12 | **SES** (Config Set Event Destinations) | CreateConfigurationSetEventDestination, UpdateConfigurationSetEventDestination, DeleteConfigurationSetEventDestination, UpdateConfigurationSetSendingEnabled, CreateConfigurationSetTrackingOptions, UpdateConfigurationSetTrackingOptions, DeleteConfigurationSetTrackingOptions, UpdateConfigurationSetReputationMetricsEnabled, PutConfigurationSetDeliveryOptions | `SesQueryHandler` | Done 2026-07-21 — event destinations (create/update/delete), sending enabled, tracking options (create/update/delete), reputation metrics, and delivery options UI implemented with backend/hook tests |
| G.13 | **ELBv2** (SSL, Certificates, Settings) | SetSecurityGroups, SetSubnets, SetIpAddressType, ModifyTargetGroupAttributes, DescribeTargetGroupAttributes, ModifyListenerAttributes, DescribeListenerAttributes, SetRulePriorities, DescribeAccountLimits, DescribeSSLPolicies, AddListenerCertificates, RemoveListenerCertificates, DescribeListenerCertificates, DescribeRules, CreateRule, ModifyRule, DeleteRule | `ElbV2QueryHandler` | Done 2026-07-21 — SSL policies, account limits, security groups, subnets, IP address type, listener/target group attributes, listener certificates, and listener rules (create/update/delete/set priorities) UI implemented with backend/hook tests |
| G.14 | **Auto Scaling** (Instance Refresh + Tags + LB) | StartInstanceRefresh, DescribeInstanceRefreshes, CreateOrUpdateTags, DeleteTags, AttachLoadBalancerTargetGroups, DetachLoadBalancerTargetGroups, DescribeLoadBalancerTargetGroups, AttachLoadBalancers, DetachLoadBalancers, DescribeLoadBalancers | `AutoScalingQueryHandler` | Done 2026-07-21 — instance refresh (start/list), ASG tags (create/delete), LB target groups (attach/detach/list), classic load balancers (attach/detach/list) UI implemented with backend/hook/tests |
| G.15 | **Cognito** (Resource Servers + MFA + Custom Attrs + Auth Flow Testers) | CreateResourceServer, DescribeResourceServer, ListResourceServers, UpdateResourceServer, DeleteResourceServer, AddCustomAttributes, GetUserPoolMfaConfig, SetUserPoolMfaConfig, AdminDeleteUserAttributes, AdminUserGlobalSignOut, AdminRespondToAuthChallenge, AdminConfirmSignUp, ConfirmForgotPassword, GetUser, UpdateUserAttributes, DeleteUserAttributes, ListUsersInGroup, AdminListGroupsForUser, GetTokensFromRefreshToken, ListUserPoolClientSecrets, AddUserPoolClientSecret, DeleteUserPoolClientSecret | `CognitoJsonHandler` | Done — Resource servers, MFA config, custom attributes, client secrets, and auth flow testers (InitiateAuth, AdminInitiateAuth, ConfirmSignUp, AdminRespondToAuthChallenge, ForgotPassword, ConfirmForgotPassword, GetUser, UpdateUserAttributes, DeleteUserAttributes) implemented |

---

### P2 — Moderate-Value Missing Features (14 items)

| # | Service | Missing Operations | Impact |
|---|---------|-------------------|--------|
| G.16 | **DynamoDB** (Kinesis Streaming) | EnableKinesisStreamingDestination, DisableKinesisStreamingDestination, DescribeKinesisStreamingDestination | Done 2026-07-14 (List/Enable/Disable Kinesis streaming destinations) |
| G.17 | **DynamoDB** (Exports + UpdateTable) | ExportTableToPointInTime, DescribeExport, ListExports, UpdateTable | Done 2026-07-14 (Exports: S3 modal + detail viewer; UpdateTable: billing/throughput/SSE/streams/GSIs settings tab) |
| G.18 | **DynamoDB** (PartiQL Transactions) | ExecuteTransaction, BatchExecuteStatement | Done 2026-07-14 (Transaction/Batch sub-tabs in PartiQL editor, atomic multi-statement execution, per-statement results) |
| G.19 | **S3** (ACLs) | GetObjectAcl, PutObjectAcl, GetBucketAcl, PutBucketAcl | Done 2026-07-14 (Bucket ACL tab with canned ACL picker + grants view, Object ACL view with Set ACL modal) |
| G.20 | **CloudTrail** (Lookup + Event Selectors) | LookupEvents, PutEventSelectors | Done 2026-07-18 (Lookup Events tab: attribute/time-range search + event detail modal; Event Selectors tab: basic + advanced selector config with current-config view; 6 new dashboard tests covering both tabs) |
| G.21 | **Kinesis** (Enhanced Fan-out) | SubscribeToShard, RegisterStreamConsumer, DeregisterStreamConsumer, DescribeStreamConsumer | Done 2026-07-14 (Consumers tab with register/deregister/subscribe modals; SubscribeToShard with shard select + starting position + results display) |
| G.22 | **CodePipeline** (Advanced) | RollbackStage, OverrideStageCondition, ListRuleExecutions, CreateCustomActionType, UpdateActionType, GetActionType, DeleteCustomActionType, ListActionTypes, PutActionRevision, RegisterWebhookWithThirdParty, DeregisterWebhookWithThirdParty, PollForJobs, AcknowledgeJob, GetJobDetails, PutJobSuccessResult, PutJobFailureResult | Done 2026-07-14 (Rollback/Override modals, Rules tab, Jobs tab with poll+detail, Webhook register/deregister, Action type delete, 12 new backend tests) |
| G.23 | **ECS** (Account Settings + Task Sets) | PutAccountSetting, PutAccountSettingDefault, DeleteAccountSetting, ListAccountSettings, PutAttributes, DeleteAttributes, ListAttributes, CreateTaskSet, UpdateTaskSet, DeleteTaskSet, DescribeTaskSets, UpdateServicePrimaryTaskSet, DescribeServiceDeployments, ListServiceDeployments, DescribeServiceRevisions | Done 2026-07-14 (Account Settings, Attributes, Task Sets, Service Deployments) |
| G.24 | **IoT** (MQTT Broker + Shadows) | MQTT broker status, client connections, list subscriptions, disconnect client, ListNamedShadowsForThing | Done 2026-07-18 (Data-plane: GetConnection/ListSubscriptions/DeleteConnection/SendDirectMessage/Publish, ListRetainedMessages/GetRetainedMessage, ListNamedShadowsForThing + named-shadow support on shadow CRUD; MQTT Broker tab with client inspect/disconnect + publish modal + retained messages table; 13 backend tests, 11 hook tests, 6 component tests) |
| G.25 | **API Gateway V2** (WebSocket) | WebSocket connection management, route resolution display | Done 2026-07-14 (WebSocket API discovery + route→integration resolution tab; live @connections management not wired — documented limitation) |
| G.26 | **MemoryDB** (Users + ACLs) | CreateUser, DescribeUsers, DeleteUser, CreateACL, DescribeACLs, DeleteACL | Users/ACLs not yet exposed in dashboard | **Done** — backend routes + tests added, useMemoryDB hooks extended, Users/ACLs tabs added to MemoryDBDashboard, 26 tests pass, 100% coverage |
| G.27 | **CloudWatch Logs** (Data Protection) | GetDataProtectionPolicy | No data protection policy viewer | **Done** — backend route, useDataProtectionPolicy hook, Data Protection tab with JSON viewer, 83 tests, 100% coverage |
| G.28 | **Config Service** (Compliance Status) | DescribeComplianceByConfigRule, DescribeConfigRuleEvaluationStatus, DescribeConformancePackStatus, DescribeConfigurationRecorderStatus | No compliance/status detail views (basic CRUD for rules/packs/recorders already implemented) |
| G.29 | **RDS** (Subnet Groups + Cluster PGs) | CreateDBSubnetGroup, DescribeDBSubnetGroups, ModifyDBSubnetGroup, DeleteDBSubnetGroup, CreateDBClusterParameterGroup, DescribeDBClusterParameterGroups, DeleteDBClusterParameterGroup, ModifyDBClusterParameterGroup, DescribeDBClusterParameters, DescribeOrderableDBInstanceOptions | No DB Subnet Group management, no Cluster Parameter Group management |

---

### P3 — Low-Value / Niche Missing Features (9 items)

| # | Service | Missing Operations | Impact |
|---|---------|-------------------|--------|
| G.30 | **S3 Control** | listTagsForResource, tagResource, untagResource (S3 Access Points) | No Access Points tag management |
| G.31 | **EC2** (Prefix Lists + SG Rule Descriptions) | DescribePrefixLists, UpdateSecurityGroupRuleDescriptionsIngress, UpdateSecurityGroupRuleDescriptionsEgress | No prefix list display, no SG rule description editor |
| G.32 | **ECR** (Scanning Config) | BatchGetRepositoryScanningConfiguration | Done 2026-07-14 (per-repository scan config modal: scan-on-push, frequency, applied filters) |
| G.33 | **SES** (Verified Emails) | ListVerifiedEmailAddresses, DeleteVerifiedEmailAddress | **Done** — delete route added, useSESDeleteVerifiedEmail hook added, delete button added to verified emails section, 226 tests all pass, 100% coverage |
| G.34 | **Auto Scaling** (Describe Types) | DescribeAutoScalingNotificationTypes, DescribeTerminationPolicyTypes, DescribeAdjustmentTypes, DescribeAccountLimits, DescribeLifecycleHookTypes, DescribeMetricCollectionTypes | Done 2026-07-22 — notification types, termination policy types, adjustment types, account limits, lifecycle hook types, and metric collection types displayed in Advanced tab Container |
| G.35 | **ELBv2** (Capacity Reservation) | DescribeCapacityReservation | **Done** — backend route added, useELBCapacityReservation hook added, capacity reservation section in ELBDashboard advanced tab, 131 tests pass, 100% coverage |
| G.36 | **CodeDeploy** (On-Premises + Advanced) | RegisterOnPremisesInstance, DeregisterOnPremisesInstance, GetOnPremisesInstance, BatchGetOnPremisesInstances, ListOnPremisesInstances, AddTagsToOnPremisesInstances, RemoveTagsFromOnPremisesInstances, ContinueDeployment, PutLifecycleEventHookExecutionStatus, ListDeploymentTargets, BatchGetDeploymentTargets | No on-premises instance management, no deployment continuation |
| G.37 | **Step Functions** (Version Management) | PublishStateMachineVersion, ListStateMachineVersions, DeleteStateMachineVersion | No version management for state machines | **Done** — versions tab with publish/delete, 57 tests, 100% coverage |
| G.38 | **CloudFormation** (Stack Policy) | SetStackPolicy, GetStackPolicy (stubbed as empty response in Floci) | Done 2026-07-16 (stack policy viewer/editor — Floci stubs persistence) |

---

### Second-Pass Audit — Additional Gaps (2026-07-14)

Full 66-service diff of Floci-supported operations vs. dashboard UI-reachable operations (backend route + hook + rendered page). These are gaps beyond G.1–G.38.

#### Tier 1 — Backend route already exists, only needs hook + UI (cheap wins)

| # | Service | Missing UI (route exists) | Dashboard Impact |
|---|---------|---------------------------|------------------|
| G.39 | **Step Functions** (Execution control) | StartExecution (`POST /state-machines/:arn/executions`), StopExecution (`POST /executions/:arn/stop`) — routes exist, no hook | Done 2026-07-14 — Start execution modal (name + JSON input) + per-row Stop for RUNNING executions |
| G.40 | **Scheduler** (Update) | UpdateSchedule (`PUT /schedules/:name`) — route exists, no hook | Done 2026-07-14 — useUpdateSchedule hook + per-row Edit modal (expression, state ENABLED/DISABLED, target ARN/role, description) |
| G.41 | **AppConfig** (Environments + Profiles) | CreateEnvironment/DeleteEnvironment, CreateConfigurationProfile/DeleteConfigurationProfile, ListHostedConfigurationVersions — routes exist, no hooks | Done 2026-07-14 — create/delete hooks + Create modals & per-row Delete for environments and configuration profiles in the app detail view |
| G.42 | **Config Service** (Delivery + Recorder + Conformance) | PutDeliveryChannel/DescribeDeliveryChannels, PutConfigurationRecorder/Start/Stop, PutConformancePack — routes exist, no hook/UI | Recorders read-only; no delivery channel UI; no conformance pack create |
| G.43 | **EMR** (Instance fleets/groups + step control) | ListInstanceFleets/ListInstanceGroups/AddInstanceFleet/AddInstanceGroups, CancelSteps, ModifyCluster, DescribeStep — commands imported in `emr.ts`, not surfaced | Cannot view/scale instance groups or cancel steps |
| G.44 | **Route 53** (Health Checks) | CreateHealthCheck, UpdateHealthCheck, DeleteHealthCheck, GetHealthCheck, GetHealthCheckStatus — `ListHealthChecks` route + `useRoute53HealthChecks` hook exist but page never renders them | **Done** — create/delete backend routes added, hooks + hook tests added, Health Checks tab added to Route53Dashboard, 46 tests all pass, 100% coverage on all metrics |
| G.45 | **Cloud Map** (Service + instance registration) | CreateService (route exists, backend-only), RegisterInstance, DeregisterInstance, DNS namespace types | Service discovery unusable end-to-end |

#### Tier 2 — High-value features (need backend + frontend)

| # | Service | Missing Operations | Dashboard Impact |
|---|---------|-------------------|------------------|
| G.46 | **SSM** (Run Command) | SendCommand, ListCommands, ListCommandInvocations, GetCommandInvocation, CancelCommand | No remote command execution; dashboard is Parameter Store only |
| G.47 | **Athena** (Run query) | StartQueryExecution | Can view/stop queries but cannot actually run one | **Done** |
| G.48 | **IoT** (Thing Groups) | CreateThingGroup, DescribeThingGroup, ListThingGroups, UpdateThingGroup, DeleteThingGroup, AddThingToThingGroup, RemoveThingFromThingGroup | Entire thing-group feature absent |
| G.49 | **ECS** (Capacity Providers) | CreateCapacityProvider, DeleteCapacityProvider, UpdateCapacityProvider, DescribeCapacityProviders, PutClusterCapacityProviders | Core Fargate/EC2 capacity management absent |
| G.50 | **EC2** (Spot Instances) | RequestSpotInstances, DescribeSpotInstanceRequests, CancelSpotInstanceRequests | No spot support anywhere |
| G.51 | **ELBv2** (Listener Rules) | CreateRule, ModifyRule, DeleteRule, DescribeRules, SetRulePriorities | Done 2026-08-20 — routes, hooks, dashboard tab with create/edit/delete modal, all tests + 100% coverage |
| G.52 | **Auto Scaling** (Policies + Lifecycle Hooks) | PutScalingPolicy, DeletePolicy, PutLifecycleHook, DeleteLifecycleHook, DescribeLifecycleHooks, CompleteLifecycleAction | Done 2026-07-22 — scaling policies create/delete, lifecycle hooks CRUD with create/list/delete/complete action modals in Advanced tab |
| G.53 | **SES** (Email Templates) | CreateTemplate, UpdateTemplate, DeleteTemplate, GetTemplate, ListTemplates, SendTemplatedEmail, SendBulkTemplatedEmail, TestRenderTemplate | Templated email workflow entirely unexposed |
| G.54 | **CloudFront** (Functions + Policies) | CreateFunction/UpdateFunction/PublishFunction/DeleteFunction, cache/OAC/response-headers/origin-request policy CRUD | Functions & policies read-only |
| G.55 | **Backup** (Recovery Points) | ListRecoveryPointsByBackupVault, DescribeRecoveryPoint, DeleteRecoveryPoint | Vaults show no contents |
| G.56 | **OpenSearch** (Domain management) | UpdateDomainConfig, AddTags/ListTags/RemoveTags, UpgradeDomain, Start/CancelServiceSoftwareUpdate | Domains read-only after creation |
| G.57 | **IAM** (Policy management) | PutRolePolicy, PutUserPolicy, DeleteRolePolicy, DeleteUserPolicy, AddUserToGroup, RemoveUserFromGroup, AttachGroupPolicy, PutGroupPolicy, SimulatePrincipalPolicy, UpdateAssumeRolePolicy | Inline/group policies read-only; no policy simulator |
| G.58 | **KMS** (Key policy + signing) | GetKeyPolicy, PutKeyPolicy, Sign, Verify, GenerateMac, VerifyMac, RotateKeyOnDemand | Key policy not viewable/editable; no signing/MAC ops |
| G.59 | **Secrets Manager** (Resource policy) | GetResourcePolicy, PutResourcePolicy, DeleteResourcePolicy, BatchGetSecretValue, UpdateSecretVersionStage | Cross-account secret sharing unmanaged |

#### Tier 3 — Smaller / rounding-out gaps

| # | Service | Missing Operations | Dashboard Impact |
|---|---------|-------------------|------------------|
| G.60 | **CodeBuild** | ReportGroups CRUD + BatchGetReportGroups, RetryBuild, UpdateProject | No report groups; can't retry/edit builds |
| G.61 | **CodeDeploy** (Stop + Targets) | StopDeployment, ListDeploymentTargets, BatchGetDeploymentTargets | Can't stop in-flight deployments; no per-target detail |
| G.62 | **Kinesis** (Stream management) | Increase/DecreaseStreamRetentionPeriod, Start/StopStreamEncryption, Enable/DisableEnhancedMonitoring, Merge/SplitShard, UpdateStreamMode, AddTags/RemoveTagsToStream | Done 2026-08-22 — `kinesis.ts` +11 routes (retention inc/dec, encryption start/stop with AWS-required NONE type passthrough, monitoring enable/disable mapping CurrentShardLevelMetrics, stream mode via StreamARN-only UpdateStreamMode, shard split/merge, tags PUT/DELETE), `useKinesis` +12 hooks (incl. sparse-response normalization), KinesisDashboard new "Settings" tab (retention, encryption, enhanced monitoring with result alert, stream-mode Select gated on ARN, resharding split/merge selects, tag table + add/remove); tests: kinesis.test.ts 39→65, useKinesis.test.ts 22→34, KinesisDashboard.test.tsx 58→94 — all three files 100% on all metrics; full suite 272 files green, coverage 100% repo-wide |
| G.63 | **Lambda** (Policy + ESM write) | AddPermission, RemovePermission, GetPolicy, CreateEventSourceMapping, UpdateEventSourceMapping | Resource policy unmanaged; event source mappings list/delete only |
| G.64 | **AppSync** (Resolver + Type mutations) | CreateResolver/UpdateResolver/DeleteResolver, CreateType/UpdateType/DeleteType, UpdateDataSource/UpdateFunction/UpdateGraphqlApi | Resolvers & types read-only |
| G.65 | **EventBridge** (Replay + testing) | StartReplay, CancelReplay, DescribeReplay, UpdateArchive, TestEventPattern, PutPermission/RemovePermission | Replays read-only; no pattern tester |
| G.66 | **API Gateway v1** (Stages + Deployments) | CreateDeployment, DeleteDeployment, Stages CRUD, ApiKeys, UsagePlans, Authorizers, Methods/Integrations | v1 dashboard is very thin (read-only apis/resources) |
| G.67 | **Transfer** (Server/User + SSH keys) | UpdateServer, UpdateUser, ImportSshPublicKey, DeleteSshPublicKey | Cannot edit servers/users or manage SFTP keys |
| G.68 | **Transcribe** (Vocabularies) | CreateVocabulary, GetVocabulary, DeleteVocabulary | Vocabularies list-only |
| G.69 | **Glue** (Table/DB updates) | UpdateTable, UpdateDatabase, GetTableVersions, BatchDeleteTable | Tables/databases create/delete-only, no edit or version history |
| G.70 | **Neptune / ElastiCache** (Modify) | ModifyDBCluster, ModifyDBInstance (Neptune); ModifyReplicationGroup, ModifyUser (ElastiCache) | Resources not editable after creation |
| G.71 | **RDS** (Tagging) | AddTagsToResource, RemoveTagsFromResource, ListTagsForResource | Resource tagging not exposed |
| G.72 | **ECR** (Tag mutability) | PutImageTagMutability | Value displayed read-only, not editable |
| G.73 | **SQS** (Message move tasks) | StartMessageMoveTask, ListMessageMoveTasks, CancelMessageMoveTask | DLQ redrive uses manual receive/send loop instead of native task API |
| G.74 | **Firehose** (Tag write) | TagDeliveryStream, UntagDeliveryStream | Tags read-only |
| G.75 | **RDS Data** (Batch) | BatchExecuteStatement | No bulk parameterized writes |
| G.76 | **ACM** (Import + tags) | ImportCertificate, ExportCertificate, AddTagsToCertificate, RemoveTagsFromCertificate | Cannot import external certs; tags read-only |
| G.77 | **Cognito** (Update + client secret) | UpdateUserPool, UpdateUserPoolClient, UpdateGroup, AdminAddUserToGroup, AddUserPoolClientSecret | Pools/clients/groups create+delete only |
| G.78 | **STS** (Federation) | AssumeRoleWithSAML, AssumeRoleWithWebIdentity, GetFederationToken, DecodeAuthorizationMessage | Federated assume-role not exposed |
| G.79 | **EC2** (SG rules + Spot detail) | DescribeSecurityGroupRules, ModifySecurityGroupRules, DescribeInstanceAttribute | Fine-grained SG rule editing absent |
| G.80 | **CE** (Resource-level cost) | GetCostAndUsageWithResources | Resource-level cost breakdown not wired |

---

### Third-Pass Audit — 2026-08-17 (Control Plane + New Operation Gaps)

> **Method:** Full parity audit — (1) service-level: diffed every directory under `floci/services/` against `src/backend/routes/aws/` → **65/65 services matched, zero missing services** (the only unmatched dir, `floci/`, is the emulator's internal web UI — `duck`/`ui` — not an AWS service); (2) control-plane: enumerated Floci's `/_floci/*` lifecycle endpoints vs `system.ts`; (3) operation-level: diffed Floci `case "Op"` handler dispatch + `*_ACTIONS` sets against dashboard SDK commands per route. Items below were **not** in the G.1–G.80 list; ops already covered by G.1–G.80 (e.g. Athena StartQueryExecution → G.47, SSM Run Command → G.46, KMS Sign/Verify → G.58, IAM policy mgmt → G.57) are not duplicated here.

#### Control Plane (new gap category)

| # | Endpoint | Purpose | Dashboard Impact |
|---|----------|---------|------------------|
| G.81 | `POST /_floci/state/reset`, `POST /_floci/state/nuke` | Emulator state reset / full nuke | Done 2026-08-17 — Settings "Floci Maintenance" section: Reset state / Nuke state buttons with confirm modal, success/error alerts, `POST /system/state/reset` + `/system/state/nuke` proxy routes in `system.ts` (100% coverage) |
| G.82 | `GET /_floci/diagnose`, `GET /_floci/config` | Diagnostics dump / runtime config | Done 2026-08-17 — "Load diagnostics" button in the same section opens a modal with the JSON dump; `GET /system/diagnose` proxy route (diagnose + config both proxied in `system.ts`, 100% coverage) |

#### Operation Gaps (not previously tracked)

| # | Service | Missing Operations | Dashboard Impact |
|---|---------|-------------------|------------------|
| G.83 | **DynamoDB** | Query | Done 2026-08-17 — native key-condition Query: backend `POST /tables/:name/items/query-native` (QueryCommand with KeyConditionExpression + optional values/names/index/scanIndexForward/limit/startKey/filter, 400 when expression missing), `useDynamoDBQuery` hook, and a "Query" tab in DynamoDBTableDetail with expression/values/names/index/limit inputs, forward toggle, JSON validation errors, results viewer (100% coverage) |
| G.84 | **Step Functions** | CreateActivity, DeleteActivity, DescribeActivity, GetActivityTask, SendTaskSuccess, SendTaskFailure, SendTaskHeartbeat, StartSyncExecution, ValidateStateMachineDefinition, tags | Activities + task-token callbacks entirely absent (G.37/G.39 cover versions + start/stop only) | Done | 2026-08-18 |
| G.85 | **IAM** | GetGroup, AddUserToGroup, RemoveUserFromGroup, group policies (Put/Get/Delete/List), Create/Delete/Get/ListLoginProfile, Generate/GetCredentialReport, GetAccountSummary, instance profiles (Create/Get/Delete/List/AddRole/RemoveRole), SetDefaultPolicyVersion, Tag/Untag policy-role-user | Done 2026-08-17 — group membership (GetGroup detail modal with members + add/remove user), group inline policies (list/view/put/delete with document alert), instance profiles tab (create/delete/add-role/remove-role with sparse fallbacks), SetDefaultPolicyVersion button in policy detail, Tag/Untag editors for user/role/policy. Login profiles, credential reports, and account summary skipped — Floci IAM supports neither (no case handlers). Backend `iam.ts` +10 routes (GetGroup, AddUserToGroup, RemoveUserFromGroup, List/Get/Put/DeleteGroupPolicy, SetDefaultPolicyVersion, Tag/Untag policy-role-user), user + policy detail routes now return tags; `useIAM` +19 hooks; tests 88 backend / 50 hook / 94 component — all 3 files 100/100/100/100 |
| G.86 | **Cognito** | AdminGetUser, AdminRemoveUserFromGroup, AdminResetUserPassword, AdminUpdateUserAttributes, ChangePassword, SignUp, RespondToAuthChallenge, GetGroup, UpdateGroup, UpdateUserPool, UpdateUserPoolClient, tags | Admin user ops + update flows absent beyond G.15/G.77 | Done | 2026-08-18 |
| G.87 | **SES** | GetAccountSendingEnabled, UpdateAccountSendingEnabled, GetSendQuota, GetSendStatistics, SendRawEmail, VerifyEmailAddress | Done 2026-08-17 — account-level sending stats + raw email send: backend `ses.ts` +6 routes (GET /account-sending, PUT /account-sending, GET /send-quota, GET /send-stats, POST /send-raw, POST /verify-email-address), `useSES` +6 hooks, SESDashboard "Account" section with sending Toggle, quota StatCards, send-statistics table, "Send raw email" (MIME) modal, "Verify address" modal (100% coverage) |
| G.88 | **SNS** | AddPermission, RemovePermission, CheckIfPhoneNumberIsOptedOut, ListPhoneNumbersOptedOut, OptInPhoneNumber, Set/GetSMSAttributes, SMS sandbox (Create/Delete/List/GetStatus/Verify) | Skipped 2026-08-17 — verified Floci has none of these ops: `SnsJsonHandler`/`SnsQueryHandler` only dispatch Create/DeleteTopic, ListTopics, (Set/Get)TopicAttributes, Subscribe/Unsubscribe, (List)Subscriptions(ByTopic), (Publish|Batch), (Set/Get)SubscriptionAttributes, ConfirmSubscription, Tag/Untag/ListTags, platform-app + endpoint CRUD/attrs; AddPermission/RemovePermission/SMS sandbox/opt-out all fall to the `default -> 400 UnsupportedOperation` arm. Topic permissions are visible read-only via the Policy attribute in GetTopicAttributes. No dashboard change is possible without violating "Zero Floci changes" |
| G.89 | **ECS** | DeregisterContainerInstance, DescribeContainerInstances, StartTask, GetTaskProtection, UpdateTaskProtection, UpdateContainerInstancesState, UpdateContainerAgent, DiscoverPollEndpoint | Done 2026-08-18 — `GET /container-instances/:instanceId` (DescribeContainerInstances — 400 without cluster), `POST /container-instances/deregister` (force flag), `POST /container-instances/state` (400 without cluster/instances/status), `POST /container-instances/agent`, `POST /tasks/start` (StartTask — 400 without cluster/taskDefinition; optional instances/group/startedBy, 201), `GET /tasks/:taskId/protection` (GetTaskProtection), `PUT /tasks/protection` (UpdateTaskProtection — 400 without cluster/tasks/protectionEnabled; optional expiresInMinutes), `GET /poll-endpoint` (DiscoverPollEndpoint); `useECS` +8 hooks; ECSDashboard: new "Container Instances" cluster tab (per-row Update state modal with ACTIVE/DRAINING/STOPPED Select, Update agent, Poll endpoint toast, Deregister confirm, "Start task on instances" modal with task def + comma-separated instances + group + startedBy, dismissible error alerts) and per-task "Protection" modal on the Tasks tab (current protection StatusIndicator + loading/error states, enable checkbox, expires-in-minutes input, save toast) |
| G.90 | **ECR** | BatchGetImage, GetAuthorizationToken | Done 2026-08-17 — `GET /repositories/:name/images/manifest?tag=|digest=` (BatchGetImage, 400 without tag/digest) + `GET /auth-token` (GetAuthorizationToken) routes; `useECRImageManifest` mutation + `useECRAuthToken` lazy query hooks; Manifest (tag/digest inputs + JSON result) and Auth token modals on the ECR dashboard (100% coverage) |
| G.91 | **ELBv2** | DescribeTags, ModifyListener, ModifyTargetGroup | Done 2026-08-17 — `GET /tags?arns=` (DescribeTags — 400 without arns, sparse `|| []`), `PUT /listeners` (ModifyListener — 400 without listenerArn; port/protocol required, sslPolicy/certificates optional, certificates split/trimmed/filtered), `PUT /target-groups/health-check` (ModifyTargetGroup — 400 without targetGroupArn; path + optional interval/timeout/healthy/unhealthy with NaN guards); `useELB` +3 hooks (tags query, modify-listener + modify-target-group mutations); ELBDashboard: per-LB "Tags" modal (Badges, empty state, Close + Escape), per-listener "Edit" modal (prefilled port/protocol with `?? ""`/`|| "HTTP"` fallbacks, protocol Select, optional SSL policy + comma-separated certificates, error alert dismissible), per-target-group "Health check" modal (path + 4 optional numeric fields with NaN guards, error alert dismissible) |
| G.92 | **Cloud Map** | DiscoverInstances, DiscoverInstancesRevision, GetInstance, GetInstancesHealthStatus, GetOperation, ListOperations, RegisterInstance, DeregisterInstance, DNS namespaces (Public/Private), tags | Skipped 2026-08-17 — Floci has no servicediscovery implementation at all (no `services/servicediscovery/` directory, no handler/registry files anywhere in the repo). The G.45 partial in the dashboard cannot be extended without violating "Zero Floci changes" |
| G.93 | **EventBridge** | UpdateEventBus | Done 2026-08-17 — `PUT /buses` route (UpdateEventBusCommand: description, kmsKeyIdentifier, deadLetterArn with 400 when name missing), `useUpdateEventBus` hook, and an Edit bus modal on the buses tab (prefilled description, save/cancel, success/error toasts) (100% coverage) |
| G.94 | **WAFv2** | UpdateWebACL, CheckCapacity | Done 2026-08-17 — `PUT /web-acls/:id` (UpdateWebACL — 400 without Name/Scope/LockToken; description/defaultAction/rules/visibilityConfig/customResponseBodies/captcha/challenge/tokenDomains/associationConfig; returns NextLockToken), `POST /capacity` (CheckCapacity — 400 without Rules, scope defaults to REGIONAL); `useUpdateWebACL` + `useCheckCapacity` hooks; WafV2Dashboard per-web-ACL "Edit" modal (description input with em-dash→empty prefills, default-action Allow/Block Select, rules JSON textarea, Save with invalid-JSON validation + error alert dismissible + success toast) and "Check capacity" button showing a success-alert capacity result or error alert |
| G.95 | **Auto Scaling** | CreateLaunchConfiguration, DeleteLaunchConfiguration, DescribeAutoScalingInstances, AttachInstances, DetachInstances, TerminateInstanceInAutoScalingGroup | Done 2026-08-17 — `POST /launch-configurations` (CreateLaunchConfiguration — 400 without name; optional image/type/key/SGs/userData/iamProfile/associatePublicIp), `DELETE /launch-configurations/:name`, `GET /groups/:name/instances` (DescribeAutoScalingInstances filtered client-side by group), `POST /groups/:name/instances/attach`, `POST /groups/:name/instances/detach` (decrement flag), `POST /instances/terminate`; `useAutoScaling` +6 hooks; AutoScalingDashboard: Launch Configurations tab Create modal (all optional fields, validation, success toast, error alert dismissible, Cancel/Escape) + per-row Delete, Advanced tab "Instances" container (table with lifecycle/health/AZ/protected, Terminate per row, comma-separated Attach/Detach with inputs + success toasts + dismissible error alert) |
| G.96 | **API Gateway V2** | CreateAuthorizer, GetAuthorizer(s), Update/DeleteAuthorizer, CreateModel, GetModel(s), Update/DeleteModel, GetIntegration(Response)(s), Create/Update/DeleteIntegrationResponse, GetRoute(Response)(s), Create/Update/DeleteRouteResponse, GetDeployment, Update/DeleteDeployment, GetStage, Update/DeleteStage, TagResource, UntagResource, GetTags | Done 2026-08-20 — 3794 insertions across 6 files: backend routes (Create/Update/DeleteAuthorizer, Create/Update/DeleteModel, UpdateRoute, UpdateIntegration, Create/Update/DeleteRouteResponse, Create/Update/DeleteIntegrationResponse, UpdateStage, UpdateDeployment, TagResource, UntagResource, GetTags) + 15 new hooks + dashboard CRUD flows (authorizer create/edit/delete, model create/edit/delete, route-response create/delete, integration-response create/delete, stage update, deployment update, tag/untag, route edit, integration edit) with 100% coverage; mock Select for Cloudscape onChange coverage in happy-dom (118 tests, 100% stmts/branches/functions/lines) |
| G.97 | **SSM** | GetParameters, GetParametersByPath, DeleteParameters, LabelParameterVersion, DescribeInstanceInformation | Done 2026-08-17 — `POST /parameters/batch` (GetParameters — 400 without non-empty Names), `GET /parameters-by-path` (GetParametersByPath — 400 without path; recursive/withDecryption flags), `POST /parameters/delete-batch` (DeleteParameters — 400 without non-empty Names), `POST /parameters/label` (LabelParameterVersion — 400 without Name/ParameterVersion, labels default []), `GET /instance-information` (DescribeInstanceInformation); `useSSM` +5 hooks; SSMDashboard "Parameter Lookup" container (load-by-path results + batch-get modal with per-result Label/Delete, label modal) + "Managed Instances" tab (DescribePatchBaselines/GetDefaultPatchBaseline not present in Floci's handler) |

---

### Already Implemented (Removed from Gap List)

These items were in the initial audit but found to be already implemented upon code verification:

| Original # | Service | Feature | Verified In |
|------------|---------|---------|-------------|
| G.5 | **CloudFormation** (Change Sets) | CreateChangeSet, DescribeChangeSet, ExecuteChangeSet, DeleteChangeSet, ListChangeSets | `CloudFormationQueryHandler` | Done 2026-07-13 |
| G.7 (old) partial | CloudFormation Templates/Exports | GetTemplate, ValidateTemplate, ListExports | `cloudformation.ts` — routes exist |
| G.10 (old) partial | WAFv2 IP Sets | CreateIPSet, GetIPSet, UpdateIPSet, DeleteIPSet, ListIPSets | `wafv2.ts` — full CRUD routes | (G.10 done)
| G.10 (old) partial | WAFv2 Rule Groups | CreateRuleGroup, GetRuleGroup, UpdateRuleGroup, DeleteRuleGroup, ListRuleGroups | `wafv2.ts` — full CRUD routes |
| G.12 (old) partial | SES DKIM + MailFrom | GetIdentityDkimAttributes, SetIdentityDkimEnabled, SetIdentityMailFromDomain, GetIdentityMailFromDomainAttributes | `ses.ts` — routes exist + included in identity list/detail |
| G.18 (old) full | Config Service Conformance Packs + Recorder | PutConformancePack, DeleteConformancePack, DescribeConformancePacks, PutConfigurationRecorder, DescribeConfigurationRecorders, StartConfigurationRecorder, StopConfigurationRecorder, PutDeliveryChannel, DescribeDeliveryChannels, StartConfigRulesEvaluation | `configservice.ts` — all routes exist |
| G.27 (old) full | Athena Work Groups + Query Results + Data Catalogs | GetWorkGroup, CreateWorkGroup, DeleteWorkGroup, GetQueryResults, StopQueryExecution, ListDataCatalogs, GetDataCatalog, ListDatabases, ListTableMetadata | Done 2026-07-14 (Query Results viewer, Stop query, Work Group detail, Catalog/Database/Table browser + metadata) |

---

### Summary Statistics

| Metric | Count |
|--------|-------|
| Total gap items identified (1st pass) | 38 |
| P1 (high-value) | 15 |
| P2 (moderate-value) | 14 |
| P3 (low-value) | 9 |
| Already implemented (removed) | 6 feature groups |
| Services with P1 gaps | 11 unique services |
| Services with any gaps | 20+ unique services |
| Second-pass gaps (G.39–G.80) | 42 |
| — Tier 1 (backend route exists, needs UI) | 7 (G.39–G.45) |
| — Tier 2 (high-value, backend+frontend) | 14 (G.46–G.59) |
| — Tier 3 (rounding-out) | 21 (G.60–G.80) |
| Third-pass gaps (G.81–G.97, 2026-08-17) | 17 |
| — Control plane (/_floci/* lifecycle endpoints) | 2 (G.81–G.82) |
| — New operation gaps (not in G.1–G.80) | 15 (G.83–G.97) |
| Missing services (service-level parity) | 0 of 65 |

### Recommended Implementation Order

> **Updated priority order based on the latest service-depth gap analysis.** The focus has shifted from "missing service scaffolding" (now complete) to "deepening" the services that currently only have basic CRUD.

1. **EventBridge** — Archives + Replays are major missing features (8+ operations).
2. **Cognito** — Auth flow testers, Resource Servers, MFA config (~10+ operations).
3. **Kinesis** — Encryption toggle, enhanced monitoring, stream mode editor (8+ operations).
4. **Lambda** — Resource-based policy management: AddPermission, RemovePermission, GetPolicy, UpdateAlias, UpdateEventSourceMapping, GetLayerVersion (5+ operations).
5. **SQS** — Message move task management: ListMessageMoveTasks, CancelMessageMoveTask, ChangeMessageVisibility batch (3+ operations).
6. **RDS** — Parameter groups edit UI, ModifyDBCluster, DBClusterParameterGroups, DBSubnetGroups (5+ operations).
7. **EC2** — IamInstanceProfileAssociations, ModifySecurityGroupRules, DescribeAddressesAttribute, DescribeVpcEndpointServices (5+ operations).
8. **CloudFront** — Distribution tags, Origin Request Policies, Response Headers Policies, monitoring/subscriptions (4+ operations).
9. **MSK** — Configuration management, broker operations (2+ operations).
10. **EMR** — Cluster detail with tags + step management (2+ operations).

#### Historical G.1–G.15 Order (retained for reference)

1. **G.1 — DynamoDB Streams** — Done 2026-07-13, Floci has 4 dedicated Streams operations
2. **G.2 — EC2 Flow Logs** — Done 2026-07-13 (3 operations)
3. **G.3 — EC2 Network ACLs** — Done 2026-07-13 (7 operations)
4. **G.5 — CloudFormation Stack Sets** — Major feature gap, Floci has full StackSetService (11 operations)
5. **G.9-G.10 — WAFv2 Regex Pattern Sets + Logging** — Complete WAFv2 coverage (14 operations)
6. **G.8 — Glue Partitions** — Done 2026-07-13, added GetPartitions/GetPartition/BatchGetPartition/BatchCreatePartition/UpdatePartition/DeletePartition + Partitions tab (Schema Registry, UDFs, Column Stats already implemented)
7. **G.15 — Cognito Resource Servers + MFA + Custom Attrs** — Completes Cognito management (~22 operations)
8. **G.4 — S3 Select** — Unique feature, high demo value, Floci has S3SelectService + S3SelectEvaluator
9. **G.11-G.12 — SES Notifications + Config Set Event Destinations** — Completes SES management (13 operations)
10. **G.13 — ELBv2 SSL/Certificates/Security Groups** — Completes ELBv2 management (13 operations)
