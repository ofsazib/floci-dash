# Changelog

All notable changes to Floci Dash will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] — 2026-09-01

### Added
- **CloudFormation dashboard** — Stacks, Exports, Stack Sets with detail panels, change sets, create/view templates
- **Lambda MicroVMs dashboard** — 17 backend routes, 3 tabs (MicroVM Images, Managed, MicroVMs)
- **Bedrock AgentCore Control dashboard** — 11 backend routes, Runtimes + Endpoints tabs
- **API Gateway v1 dashboard** — Tabs for Stages, Authorizers, Request Validators, Models, API Keys, Usage Plans, Domain Names
- **EC2 Transit Gateway** — 27 ops (VPCs, attachments, VPC associations, peering, route tables)
- **EC2 Managed Prefix Lists** — 9 ops (CRUD, entries)
- **CloudFront** — 38 ops (cache policies, OAC/OAI, functions, response headers, keys, tags)
- **SES v1 extras** — 18 ops (bulk send, custom verification templates, DKIM, policies, receipt rules)
- **SES v2** — 62 routes across 11 families (identities, templates, config sets, suppression, tags, event destinations, custom verification, DKIM, template render, account)
- **IAM** — 33 ops (attach/detach policies, policy versions, service-linked roles, OIDC providers, account settings)
- **RDS** — DB Proxy (9 ops) + Option Groups (4 ops)
- **MSK** — Configuration routes (7 ops)
- **EKS** — Fargate profiles, access entries, addons, identity providers, pod identity (16 ops)
- **IoT** — Thing Groups (8 ops)
- **App Auto Scaling** — New dashboard with scalable targets + scaling policies
- **Step Functions** — UpdateStateMachine + CloudControl request status polling

### Fixed
- **AmazonMQ** — Fixed double `/api` prefix and wrong Floci path; registered 6 orphaned dashboards (FIS, GuardDuty, CloudControl, S3Tables, AgentCore, CloudHSM)
- **CloudWatch Logs stored bytes** — Log groups that report `storedBytes: 0` now show the sum of their streams' `storedBytes`. Added server-side pagination and name search.
- **EventBridge rule click** — Opening a rule now drills into its event pattern or schedule expression (and targets), instead of appending a targets-only panel below the table
- **RDS** — Added missing PUT /plans, POST/DELETE /tags, GET /supported-resource-types routes
- **Route 53** — Added total field to hosted-zones-by-name response
- **Cloud Map** — Added discover-instances-revision and tags routes

### Improved
- **ResourceTable** — Added controlled filter (`filteringText`/`onFilterChange`) and `pagination` slot for server-side search/pagination
- Removed superpowers spec docs
- Updated README with all new services and features

## [0.2.0] — 2026-08-28

### Added

#### OpenSearch
- **Create Domain modal** — full domain creation UI with domain name input, engine version dropdown (fetches available versions from Floci), and error handling
- **Engine version dropdown** — dynamically loads supported OpenSearch versions from the backend and presents them as selectable options

#### Docker-in-Docker Combined Image
- **Self-contained OpenSearch** — new combined Docker image variant (`Dockerfile.combined`) that runs an internal Docker daemon, enabling real OpenSearch domains without mounting the host Docker socket
- **Process supervision** — custom entrypoint supervises dockerd, Floci, and Dashboard with proper signal handling and readiness checks
- **Health checks** — combined container health check verifies Docker daemon, Floci, and Dashboard are all responsive
- **Documentation** — complete setup guide in `docs/combined-docker-in-docker.md` with architecture diagram, compose example, and troubleshooting

### Fixed
- **ServicePage OpenSearch tests** — added missing `useOpenSearchVersions` mock that caused 3 test failures

### Improved
- **Floci parity audit** — comprehensive gap analysis of all 89 Floci services vs dashboard implementation (`docs/floci-gap-audit-2026-08-28.md`)

## [0.1.1] — 2026-08-27

### Fixed

- **S3 object tags 500** — the `/buckets/:name/objects/*` catch-all no longer swallows `tags|acl|attributes|head|raw` requests; object keys containing slashes (URL-encoded `%2F`) round-trip correctly, and `NoSuchKey`/`NoSuchTagSet` map to 404 instead of 500
- **Lambda function list empty** — all Lambda GET hooks now call `/aws/lambda/*` (previously `/lambda/*` returned the SPA HTML and broke JSON parsing) (#5, #4)
- **Lambda detail 500 without Function URL** — `GET /functions/:name/url` returns an empty config when Floci/AWS raise `ResourceNotFoundException` instead of a 500 (#6, #4)

### Added

#### SES
- Account details (v2): `GET/PUT /aws/email/account/details`, account panel with quota/statistics, edit modal for mail type, website, contacts, and production access request

#### Cognito
- Auth flow tester: GlobalSignOut and RevokeToken flows
- User pool create passes `usernameAttributes` (email / phone_number) through to Floci

#### New service dashboards
- AmazonMQ (M.5: brokers + users), Kinesis Analytics V2 (M.5), EMR Serverless (M.6), Fault Injection Simulator (M.7), GuardDuty (M.8), CloudHSM (M.9), MWAA (M.10), CloudWatch RUM (M.11), S3 Tables (M.12), Bedrock AgentCore (M.13), CloudControl (M.14)
- Organizations, SWF, Lightsail dashboards

## [0.1.0] — 2026-08-25

### Added

#### Cross-Platform & UX
- **Auto-detect Floci endpoint** — dashboard probes candidate URLs (`localhost`, `host.docker.internal`, `172.17.0.1`, `127.0.0.1`) and auto-configures the connection. Works out of the box on Windows, macOS, and Linux Docker.
- **Settings link always visible** — sidebar Settings link now renders even when the API returns 500, so users can always reach the endpoint configuration page.
- **`/system/discover-floci` endpoint** — backend probe route that tests candidate Floci URLs and returns the first working one.

#### ACM (Certificate Manager)
- Account configuration GET/PUT routes
- Import certificate (`ImportCertificate`) and export certificate (`ExportCertificate`) routes
- Hooks, UI flows, and tests

#### Route 53
- Tag CRUD operations (list, create, delete)
- DNSSEC status (`GetDNSSEC`)
- Account limits (`ListLimits`)
- Change info (`GetChange`)
- Health Checks create/delete with full UI tab
- Hooks, dashboard tests, and 100% coverage

#### Glue
- Tag operations (GET/POST/DELETE for resource tags)
- Update schema compatibility mode
- Delete schema versions
- Get schema by definition
- Fixed SDK types: `TagsToAdd` (Record), `TagsToRemove` (string[]), `Versions` (string range)
- Removed dead `|| {}` fallbacks for 100% branch coverage

#### SES (Simple Email Service)
- Email template CRUD (create, get, delete, preview, templated send)
- Verified email delete route
- Account statistics (sending quotas, reputation, delivery metrics)
- Raw email send
- Configuration sets and event destinations
- Identity notifications, DKIM, and MAIL FROM configuration

#### ECS (Elastic Container Service)
- Capacity provider management
- Container instances list and detail
- Task protection (update protection on running tasks)
- StartTask for ad-hoc container execution

#### Step Functions
- Activity management (create, list, describe, delete)
- Task callbacks (send task success/failure/heartbeat)
- Sync execution runs
- State machine validation
- Tags CRUD

#### Cognito
- Admin user operations (create, delete, disable/enable, confirm sign-up, forgot password, respond to auth challenge)
- Update user flows
- Pool tags CRUD
- Resource Servers, MFA config, and Custom Attributes (from earlier)
- Auth flow tester (InitiateAuth, AdminInitiateAuth, ConfirmSignUp)

#### IAM
- Group membership (add/remove users from groups)
- Group policies (list/attach/detach inline policies)
- Instance profiles CRUD
- SetDefaultPolicyVersion
- Tags for roles, users, groups
- Role inline policies CRUD
- Trust policy editing
- Policy simulator

#### Auto Scaling
- Launch configurations CRUD
- Instance operations (terminate, detach, connect)
- Scaling policies create/delete
- Lifecycle hooks CRUD
- Describe types (notification, termination, adjustment, metric collection)
- Instance refresh, tags, and LB attachments

#### SSM (Systems Manager)
- Batch parameter operations
- By-path parameter lookup
- Parameter labels
- Instance information
- Run Command (send commands, view history and invocations, cancel)

#### ELBv2 (Elastic Load Balancing)
- DescribeTags and ModifyListener
- ModifyTargetGroup
- Listener rules (create/update/delete/set priorities)
- Capacity Reservation display

#### API Gateway V2
- Full CRUD flows for routes, integrations, stages, deployments, authorizers, models, and route responses
- WebSocket API discovery and route resolution

#### DynamoDB
- Native Query support (key-condition expression queries)
- Streams, Exports, Kinesis Streaming, UpdateTable, and PartiQL

#### Kinesis
- Day-2 stream management
- Enhanced Fan-out (consumer management + SubscribeToShard)

#### CloudWatch Logs
- Data Protection policy viewer tab

#### MemoryDB
- Users + ACLs tabs with full CRUD

#### Athena
- RunQueryExecution backend route, hook, and Run Query UI

#### Floci Control-Plane
- Reset/nuke state endpoints
- Diagnostics in Settings page

#### Additional Services
- **EventBridge:** UpdateEventBus, permissions management, pattern tester, event bus tags
- **ECR:** Image manifests, registry auth token, scanning configuration, image tag mutability
- **OpenSearch:** Domain config update, upgrade check, and tags
- **EC2:** Spot requests, prefix lists, security group rules, flow logs, network ACLs
- **EMR:** Cluster detail with steps and instance groups
- **Transfer:** Server/user updates, SSH public key management
- **KMS:** Key policy, sign/verify, MAC, on-demand rotation
- **Secrets Manager:** Resource policy, batch get, version stage ops
- **Transcribe:** Custom vocabulary create, get, and delete
- **Cost Explorer/Firehose:** Resource-level costs, delivery stream tags
- **CodeDeploy:** Stop deployments, update deployment groups, on-premises instances, deployment lifecycle
- **Events:** Pattern tester and event bus tags
- **Config:** Resource tags on config rules and conformance packs
- **CodeBuild:** Report groups, build retry, project editing
- **RDS:** Resource tags on instance and cluster details
- **SQS:** Native DLQ redrive with message move tasks
- **Lambda:** Resource-based policy, ESM writes, alias editing
- **CloudMap:** Operations, instance detail, DNS namespace creation
- **AppSync:** Resolver mutations, resolver create/delete, datasource update

### Fixed
- **Settings link visibility** — sidebar Settings link now renders when the API returns 500 (issue #2), so users can always reach endpoint configuration
- **S3VectorsDashboard registration** — dashboard was imported but not registered in `serviceRegistry.tsx`, making it unreachable
- **Glue SDK type errors** — corrected `TagsToAdd`/`TagsToRemove` (Glue-specific Record types) and `Versions` (string range, not array)
- **Cross-platform Docker networking** — auto-detection eliminates the need for manual `FLOCI_URL` configuration on Windows/macOS
- **Dead code removal** — removed 100+ unreachable `|| []`, `|| {}`, `|| "-"` fallbacks across backend routes and frontend components

### Improved
- **100% test coverage** — all four metrics (statements, branches, functions, lines) at 100% across every file
- **10,514 tests** across 272 test files
- **CI coverage gates** — `vitest.config.ts` thresholds at 100%, `codecov.yml` patch target at 100%, worker cap for memory pressure
- **Deterministic env-stub tests** — all `process.env` captures tested with `vi.stubEnv` + `vi.resetModules()` to prevent ambient-env flakes
- **README** — comprehensive cross-platform Docker networking docs, updated feature table, auto-detect documentation
- **AGENTS.md** — mandate 100% coverage on all four metrics for every change
- **PLAN.md** — fully reconciled progress tracker with 567 tasks resolved

## [Unreleased]

_No changes yet._

## [0.0.99] — 2026-07-07

### Fixed
- **Release workflow:** Added GitHub Release creation step (was only building Docker images)
- **Release workflow:** Changed permissions from `contents: read` to `contents: write`
- Cleaned up stale remote tags from previous sessions

## [0.0.86] — 2026-07-07

### Added
- **IoT Core:** Full service support — things (CRUD with attributes/types), certificates (create keys+bundle, activate/deactivate/revoke), policies (CRUD + versions), shadows, topic rules, jobs. Backend routes, hooks, dashboard, and comprehensive tests (85 backend + 54 hook tests).
- **Elastic Beanstalk:** Full service support — applications, environments, application versions, configuration templates, events. Backend routes, hooks, dashboard, and tests.
- **CodePipeline:** Full service support — pipelines (create/list/get/delete), stages, actions, manual approval, retry execution, pipeline execution history. Backend routes, hooks, dashboard, and tests.
- **S3 Vector Search:** S3-backed vector search with CRUD for buckets, indexes, and query endpoints. Backend routes, hooks, dashboard, and tests.
- **Lambda Code Signing:** Added code signing config routes and URL delete hook; fixed delete button behavior.
- **UI/UX:** Platform-aware keyboard shortcut badges (⌘K / Ctrl+K) in side nav search and global search input.

### Fixed
- **CodePipeline:** Added `stageName` validation to retry execution route.
- **CodePipeline:** Resolved 6 TypeScript errors blocking Docker build.
- **IoT Dashboard:** Fixed 6 pre-existing test failures for Cloudscape inline-icon buttons.

### Improved
- **Test Coverage:** Deepened branch coverage for 15 dashboard test files using `vi.hoisted` mutable states + reactive getters pattern:
  - CodeBuild, AutoScaling, S3Vectors, DocDB (batch 1)
  - ECS, ELB (batch 2)
  - CloudTrail, ElastiCache, Cognito (batch 3)
  - IoT, Kinesis, Firehose, Glue (batch 4)
  - EKS, SSM, STS, CUR (batch 5)
  - SES, EMR (batch 6)
  - RDS, CloudTrail (batch 7 — RDS went from 11.34% to comprehensive 31-test suite)
- **Project Structure:** Refactored `ServicePage` into per-service dashboard files. Added open-source project files (CODE_OF_CONDUCT.md, CONTRIBUTING.md, SECURITY.md, PULL_REQUEST_TEMPLATE.md, issue templates).
- **Project Rename:** Renamed project to Floci Dash.

## [0.0.85] — 2026-06-21

### Added
- Initial public release
- 62+ AWS services with dedicated dashboards and hooks
- Docker Compose integration with Floci local AWS emulator
- Cloudscape Design System UI
- TanStack Query for data fetching
- Full test suite with 244+ test files and 4,000+ tests
- Multi-arch Docker builds (amd64 + arm64)
- GitHub Actions CI/CD with automated releases
