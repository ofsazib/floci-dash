# Changelog

All notable changes to Floci Dash will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
