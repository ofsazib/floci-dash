# Floci Dashboard — Implementation Plan

## Overview

An AWS Console-style web dashboard for Floci, the local AWS emulator. The dashboard provides a polished, production-grade management UI that mirrors the real AWS Console experience — allowing users to manage all 58+ AWS services that Floci emulates, including resource CRUD operations, detailed views, filtering, search, and real-time status monitoring.

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
| 56 other services | Not started | Show "Coming soon" placeholder |

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
| Start dev environment | `npm run dev` or `npm run docker:dev` | Docker (Floci + Dashboard with hot reload) |
| Typecheck | `npm run typecheck` or `npm run docker:typecheck` | Docker (one-off container) |
| Build for production | `npm run build` or `npm run docker:build` | Docker (builder stage) |
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
floci-dashboard/
├── src/
│   ├── frontend/                  <- React SPA
│   │   ├── main.tsx               <- Entry point
│   │   ├── App.tsx                <- HashRouter + routes
│   │   ├── lib/
│   │   │   ├── client.ts          <- fetch wrapper to /api/*
│   │   │   └── utils.ts           <- formatBytes, formatItemValue
│   │   ├── hooks/
│   │   │   ├── useSystem.ts       <- Health, init, active
│   │   │   ├── useService.ts      <- Generic service hooks (disabled)
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
|          |  Floci Dashboard                          Connected v1  |
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
- Toggle stored in Zustand, persisted across sessions (TODO: localStorage persistence)

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
7. Test: `npm run typecheck`
8. Test: `npm run build`

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
| **Objects** | ListObjectsV2, GetObject, PutObject (multipart upload), DeleteObject | Object browser, Upload (drag-drop), Detail viewer, Download, Delete | Done |
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
4. Never mark a task Done without running `npm run typecheck` successfully
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
| 3.15 | Backend: POST /api/aws/sqs/dlq/move-tasks (start/cancel/list move tasks) | Pending | |
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
| 7.24 | Frontend: Network topology view (VPC -> Subnets -> Instances visual) | Pending | |
| 7.25 | Verify: typecheck + build pass | Done | 2025-06-13 |
| 7.26 | Backend: EC2 web terminal — WebSocket server + Docker Engine API with Tty=true for interactive bash | Done | 2025-06-14 |
| 7.27 | Frontend: EC2Terminal component — xterm.js terminal with WebSocket, resize, reconnect | Done | 2025-06-14 |
| 7.28 | Frontend: Instance detail "Connect" button + terminal modal | Done | 2025-06-14 |
| 7.29 | Frontend: Filter terminated instances from list view | Done | 2025-06-14 |
| 7.30 | Verify: typecheck + build + terminal works interactively | Done | 2025-06-14 |

#### 3C — ECS (50+ operations)

| # | Task | Status | Date |
|---|------|--------|------|
| 8.1 | Consult Floci ECS source for supported operations | Pending | |
| 8.2 | Backend: Cluster CRUD (list, create, describe, delete, update) | Pending | |
| 8.3 | Backend: Task definition CRUD (register, describe, list families, list versions, deregister) | Pending | |
| 8.4 | Backend: Task operations (run, start, stop, describe, list, protection) | Pending | |
| 8.5 | Backend: Service CRUD (create, update, delete, describe, list) | Pending | |
| 8.6 | Backend: Container instance operations (list, describe, deregister) | Pending | |
| 8.7 | Frontend: useECS hooks | Pending | |
| 8.8 | Frontend: ECS page — Clusters tab (list with task/service counts) | Pending | |
| 8.9 | Frontend: Cluster detail — Services tab + Tasks tab + Container Instances tab | Pending | |
| 8.10 | Frontend: Task Definitions tab (family list, version browser, container spec viewer) | Pending | |
| 8.11 | Frontend: Service create/edit (desired count slider, task def selector) | Pending | |
| 8.12 | Verify: typecheck + build pass | Pending | |

---

### Phase 4: Security Services

#### 4A — IAM (72 operations) + STS (7 operations) — dedicated page

| # | Task | Status | Date |
|---|------|--------|------|
| 9.1 | Consult Floci IAM source for supported operations | Pending | |
| 9.2 | Backend: User CRUD (list, create, get, update, delete, tags) | Pending | |
| 9.3 | Backend: Group CRUD (list, create, get, delete, add/remove user) | Pending | |
| 9.4 | Backend: Role CRUD (list, create, get, update, delete, update assume role policy, tags) | Pending | |
| 9.5 | Backend: Managed policy CRUD (list, create, get, delete, version CRUD, set default, tags) | Pending | |
| 9.6 | Backend: Policy attachments (attach/detach/list for user, group, role) | Pending | |
| 9.7 | Backend: Inline policy CRUD (put/get/delete/list for user, group, role) | Pending | |
| 9.8 | Backend: Access keys (create, delete, list, update status per user) | Pending | |
| 9.9 | Backend: Instance profiles (create, get, delete, list, add/remove role) | Pending | |
| 9.10 | Backend: Permission boundaries (put/delete for user and role) | Pending | |
| 9.11 | Backend: STS operations (get caller identity, assume role, session token) | Pending | |
| 9.12 | Frontend: useIAM hooks | Pending | |
| 9.13 | Frontend: IAM dedicated page with tabs (Users, Groups, Roles, Policies) | Pending | |
| 9.14 | Frontend: Users tab — List, create, detail (groups, attached policies, inline policies, access keys, tags) | Pending | |
| 9.15 | Frontend: Groups tab — List, create, detail (members, attached policies, inline policies) | Pending | |
| 9.16 | Frontend: Roles tab — List, create, detail (trust policy editor, attached policies, inline policies, instance profiles) | Pending | |
| 9.17 | Frontend: Policies tab — List (All/AWS/Local scope), create (JSON editor), detail (versions, attachments) | Pending | |
| 9.18 | Frontend: Access key create modal (show secret once with copy) | Pending | |
| 9.19 | Frontend: JSON policy editor component (shared across all tabs) | Pending | |
| 9.20 | Verify: typecheck + build pass | Pending | |

#### 4B — KMS (35 operations)

| # | Task | Status | Date |
|---|------|--------|------|
| 10.1 | Consult Floci KMS source for supported operations | Pending | |
| 10.2 | Backend: Key CRUD (create, describe, list, schedule deletion, cancel deletion) | Pending | |
| 10.3 | Backend: Key management (update description, enable/disable, rotation) | Pending | |
| 10.4 | Backend: Alias CRUD (create, delete, list) | Pending | |
| 10.5 | Backend: Grant CRUD (create, list, revoke, retire) | Pending | |
| 10.6 | Backend: Crypto operations (encrypt, decrypt, re-encrypt, generate data key, sign, verify, generate MAC, verify MAC, generate random, get public key) | Pending | |
| 10.7 | Backend: Key policy + tags | Pending | |
| 10.8 | Frontend: useKMS hooks | Pending | |
| 10.9 | Frontend: KMS page — Keys tab (list, create, detail with state/rotation) | Pending | |
| 10.10 | Frontend: Key detail — Aliases tab, Grants tab, Tags tab, Policy tab | Pending | |
| 10.11 | Frontend: Key detail — Crypto playground (encrypt/decrypt, sign/verify, MAC, generate random) | Pending | |
| 10.12 | Verify: typecheck + build pass | Pending | |

#### 4C — Secrets Manager (18 operations)

| # | Task | Status | Date |
|---|------|--------|------|
| 11.1 | Consult Floci Secrets Manager source for supported operations | Pending | |
| 11.2 | Backend: Secret CRUD (list, create, describe, update, delete, restore, rotate) | Pending | |
| 11.3 | Backend: Secret value (get, put) + version history + stage management | Pending | |
| 11.4 | Backend: Resource policy + random password + batch get + tags | Pending | |
| 11.5 | Frontend: useSecretsManager hooks | Pending | |
| 11.6 | Frontend: Secrets page — List (description, rotation status, create, delete) | Pending | |
| 11.7 | Frontend: Secret detail — Value tab (masked/reveal toggle), Versions tab (history, stage), Policy tab | Pending | |
| 11.8 | Verify: typecheck + build pass | Pending | |

---

### Phase 5: Networking Services

#### 5A — Route 53

| # | Task | Status | Date |
|---|------|--------|------|
| 12.1 | Consult Floci Route53 source for supported operations | Pending | |
| 12.2 | Backend: GET /api/aws/route53/hosted-zones | Pending | |
| 12.3 | Backend: POST /api/aws/route53/hosted-zones | Pending | |
| 12.4 | Backend: DELETE /api/aws/route53/hosted-zones/:id | Pending | |
| 12.5 | Backend: GET /api/aws/route53/hosted-zones/:id/record-sets | Pending | |
| 12.6 | Frontend: useRoute53 hooks | Pending | |
| 12.7 | Frontend: Route53 page (hosted zones + record sets) | Pending | |
| 12.8 | Verify: typecheck + build pass | Pending | |

#### 5B — API Gateway

| # | Task | Status | Date |
|---|------|--------|------|
| 13.1 | Consult Floci API Gateway source for supported operations | Pending | |
| 13.2 | Backend: GET /api/aws/apigateway/rest-apis | Pending | |
| 13.3 | Backend: POST /api/aws/apigateway/rest-apis | Pending | |
| 13.4 | Backend: DELETE /api/aws/apigateway/rest-apis/:id | Pending | |
| 13.5 | Backend: GET /api/aws/apigateway/rest-apis/:id/resources | Pending | |
| 13.6 | Frontend: useAPIGateway hooks | Pending | |
| 13.7 | Frontend: API Gateway page | Pending | |
| 13.8 | Verify: typecheck + build pass | Pending | |

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
| 15.1 | Consult Floci CloudFormation source for supported operations | Pending | |
| 15.2 | Backend: GET /api/aws/cloudformation/stacks | Pending | |
| 15.3 | Backend: POST /api/aws/cloudformation/stacks (create stack) | Pending | |
| 15.4 | Backend: DELETE /api/aws/cloudformation/stacks/:name | Pending | |
| 15.5 | Backend: GET /api/aws/cloudformation/stacks/:name (describe) | Pending | |
| 15.6 | Frontend: useCloudFormation hooks | Pending | |
| 15.7 | Frontend: CloudFormation page (stack list + detail) | Pending | |
| 15.8 | Verify: typecheck + build pass | Pending | |

#### 6C — SSM (Systems Manager)

| # | Task | Status | Date |
|---|------|--------|------|
| 16.1 | Consult Floci SSM source for supported operations | Pending | |
| 16.2 | Backend: GET /api/aws/ssm/parameters | Pending | |
| 16.3 | Backend: POST /api/aws/ssm/parameters (put parameter) | Pending | |
| 16.4 | Backend: DELETE /api/aws/ssm/parameters/:name | Pending | |
| 16.5 | Frontend: useSSM hooks | Pending | |
| 16.6 | Frontend: SSM page (parameter list + create/delete) | Pending | |
| 16.7 | Verify: typecheck + build pass | Pending | |

---

### Phase 7: Remaining Services (list-only / minimal CRUD)

Each remaining service gets a standard list + create + delete pattern.

| # | Service | Backend | Frontend | Status | Date |
|---|---------|---------|----------|--------|------|
| 17.1 | EKS | Pending | Pending | Pending | |
| 17.2 | ECR | Pending | Pending | Pending | |
| 17.3 | Auto Scaling | Pending | Pending | Pending | |
| 17.4 | RDS | Done | Done | Done | 2025-06-13 |
| 17.5 | Neptune | Pending | Pending | Pending | |
| 17.6 | ElastiCache | Pending | Pending | Pending | |
| 17.7 | ELB | Pending | Pending | Pending | |
| 17.8 | CloudFront | Pending | Pending | Pending | |
| 17.9 | API Gateway V2 | Pending | Pending | Pending | |
| 17.10 | AppSync | Pending | Pending | Pending | |
| 17.11 | Kinesis | Pending | Pending | Pending | |
| 17.12 | EventBridge Pipes | Pending | Pending | Pending | |
| 17.13 | EventBridge Scheduler | Pending | Pending | Pending | |
| 17.14 | SES (email) | Pending | Pending | Pending | |
| 17.15 | STS | Pending | Pending | Pending | |
| 17.16 | Cognito | Pending | Pending | Pending | |
| 17.17 | ACM | Pending | Pending | Pending | |
| 17.18 | Config | Pending | Pending | Pending | |
| 17.19 | AppConfig | Pending | Pending | Pending | |
| 17.20 | CloudTrail | Pending | Pending | Pending | |
| 17.21 | Cloud Map (service discovery) | Pending | Pending | Pending | |
| 17.22 | Athena | Pending | Pending | Pending | |
| 17.23 | Glue | Pending | Pending | Pending | |
| 17.24 | Firehose | Pending | Pending | Pending | |
| 17.25 | Step Functions (states) | Pending | Pending | Pending | |
| 17.26 | MSK (kafka) | Pending | Pending | Pending | |
| 17.27 | OpenSearch (es) | Pending | Pending | Pending | |
| 17.28 | Bedrock Runtime | Pending | Pending | Pending | |
| 17.29 | Textract | Pending | Pending | Pending | |
| 17.30 | Transcribe | Pending | Pending | Pending | |
| 17.31 | Cost Explorer (ce) | Pending | Pending | Pending | |
| 17.32 | Cost & Usage Report (cur) | Pending | Pending | Pending | |
| 17.33 | BCM Data Exports | Pending | Pending | Pending | |
| 17.34 | Pricing | Pending | Pending | Pending | |
| 17.35 | Resource Groups Tagging | Pending | Pending | Pending | |
| 17.36 | CodeDeploy | Pending | Pending | Pending | |
| 17.37 | CodeBuild | Pending | Pending | Pending | |
| 17.38 | Backup | Pending | Pending | Pending | |
| 17.39 | Transfer Family | Pending | Pending | Pending | |
| 17.40 | CloudWatch Metrics (monitoring) | Pending | Pending | Pending | |
| 17.41 | AppConfig Data (appconfigdata) | Pending | Pending | Pending | |
| 17.42 | Resource Groups Tagging (tagging) | Pending | Pending | Pending | |
| 17.43 | EC2 Messages (ec2messages) | Pending | Pending | Pending | |
| 17.44 | Verify: all services typecheck + build pass | Pending | | Pending | |

---

### Phase 8: UI/UX Enhancements

| # | Task | Status | Date |
|---|------|--------|------|
| 18.1 | Dashboard Home: Add recent activity feed | Pending | |
| 18.2 | Dashboard Home: Add quick actions panel | Pending | |
| 18.3 | Dashboard Home: Add resource count summary per service | Pending | |
| 18.4 | All pages: Add loading skeletons (not just spinners) | Pending | |
| 18.5 | All pages: Improve empty states with illustrations | Pending | |
| 18.6 | Side nav: Add search/filter for services | Pending | |
| 18.7 | Side nav: Collapse/expand categories | Pending | |
| 18.8 | Top nav: Add global search bar | Pending | |
| 18.9 | Top nav: Add notification bell for errors | Pending | |
| 18.10 | Settings: Add localStorage persistence for preferences | Pending | |
| 18.11 | Settings: Add Floci endpoint URL configuration | Pending | |
| 18.12 | Responsive: Test and fix mobile layout | Pending | |
| 18.13 | Accessibility: Keyboard navigation audit | Pending | |
| 18.14 | Accessibility: ARIA labels audit | Pending | |

---

### Phase 9: Production Readiness

| # | Task | Status | Date |
|---|------|--------|------|
| 19.1 | Error boundary: Add React error boundary component | Pending | |
| 19.2 | Error handling: Global API error interceptor with toast notifications | Pending | |
| 19.3 | Performance: Lazy-load service pages with React.lazy | Pending | |
| 19.4 | Performance: Add TanStack Query devtools (dev only) | Pending | |
| 19.5 | Security: Add CSP headers in production | Pending | |
| 19.6 | Security: Sanitize all user inputs on backend | Pending | |
| 19.7 | Docker: Optimize production image size | Pending | |
| 19.8 | Docker: Add health check endpoint to dashboard container | Pending | |
| 19.9 | CI: Add GitHub Actions for typecheck + build | Pending | |
| 19.10 | Final: Full docker:prod test with all services | Pending | |

---

## Conventions

- **Look up Floci first.** Before implementing any service feature, consult `../floci/src/main/java/io/github/hectorvent/floci/services/{service}/`.
- **Docker-first.** Every operation runs inside a container.
- **No Floci changes.** Dashboard uses existing endpoints only — never edit `../floci`.
- **One service at a time.** S3 -> DynamoDB -> SQS -> SNS -> Lambda -> ...
- **Backend first, verify, then frontend.** Write routes, run typecheck, then build UI.
- **Commits:** Conventional commits.
- **Verify after each service:** `npm run typecheck` must pass before moving to next service.

---

## Development Workflow

```bash
# Start development (Floci + Dashboard with hot reload)
npm run dev

# Run typecheck
npm run typecheck

# Build for production
npm run build

# Start production
npm start

# Docker development
npm run docker:dev
npm run docker:down
```
