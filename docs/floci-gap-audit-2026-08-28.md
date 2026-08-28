# Floci vs Dashboard Gap Audit — 2026-08-28

> **Source of truth:** Floci `origin/main` @ `c4050936` (2026-08-27), i.e. the docs that build
> https://floci.io/floci/services/. The deployed site currently lags the source (it advertises
> 45 services / the source has 82), so this audit is against the **newest** Floci state.
> Dashboard state: `main` @ `8abb375` (plus uncommitted OpenSearch/DinD work, not counted).
> Method: every Floci service doc page diffed action-by-action against dashboard backend route
> files (`new <Action>Command` usage), frontend hooks, pages, and `serviceRegistry.tsx`.
> False-positive checks (whole-repo greps for each "missing" action) were run before listing.

## Summary

| Category | Count | Detail |
|---|---|---|
| Floci services audited | 89 doc pages | incl. `lambda-microvms` (part of Lambda) |
| Full backend parity | 25 | list below |
| Missing ops in existing services | 53 services, **~691 actions** | biggest: API GW v1 (76), SES (84), EC2 (65), CloudFront (50), IAM (40) |
| Completely missing services | **11 services, 270 actions** | incl. Service Catalog (89), Resource Explorer (32), Network Firewall (27), EFS (25) |
| Built but unreachable UI (unregistered pages) | 6 | FIS, GuardDuty, CloudControl, S3Tables, AgentCore, CloudHSM |
| Broken end-to-end | 1 | AmazonMQ (double `/api` prefix + wrong Floci path) |

**Full backend parity (25):** ACM, Athena, Auto Scaling, Bedrock Runtime, CE, CloudTrail,
CodeBuild, CodeDeploy, Config, CUR, DynamoDB (+Streams), Elastic Beanstalk, ELBv2, EMR
Serverless, MemoryDB, Neptune, Pipes, Pricing, Resource Groups Tagging, RUM, S3 Vectors,
Secrets Manager, STS, Textract, Transcribe, Transfer, WAFv2, Batch.
*(Several have unused frontend hooks — see §5.)*

---

## P0 — Broken / trivially fixable, highest value-per-hour

### 0.1 AmazonMQ is broken end-to-end (bug fix, not a gap)

Two independent defects (both verified):

1. **Frontend double prefix:** `src/frontend/hooks/useAmazonMQ.ts` calls `api("/api/aws/mq/brokers")`,
   and `src/frontend/lib/client.ts` already prepends `/api` → actual request is
   `/api/api/aws/mq/brokers` → 404. **Fix:** drop the `/api` prefix from the hook paths.
2. **Backend wrong Floci path:** `src/backend/routes/aws/amazonmq.ts` proxies
   `/_aws/mq/v1/brokers/...`. Floci serves MQ at `/v1/brokers` — there is no `/_aws/mq` route
   (verified against Floci source: only `/_aws/execute-api`, `/_aws/kinesis`, `/_aws/ses`,
   `/_aws/sns` exist). **Fix:** change `flociFetch` paths to `/v1/brokers...`.

Also note: Floci is RabbitMQ-only; the user-management API always rejects requests for
RabbitMQ brokers, and ActiveMQ / multi-AZ are rejected. Broker CRUD + reboot are all Floci
supports (5 ops) — all implemented in our backend once paths are fixed.

### 0.2 Six dashboards exist but are unreachable (register them)

These pages + hooks + backend routes all exist and work — they are just not in
`SERVICE_DASHBOARDS` in `src/frontend/pages/serviceRegistry.tsx` (and not routed in App.tsx):

| Dashboard | Backend route | Hook |
|---|---|---|
| `services/FisDashboard.tsx` | `/aws/fis` (fis.ts) | useFIS.ts |
| `services/GuardDutyDashboard.tsx` | `/aws/guardduty` (guardduty.ts) | useGuardDuty.ts |
| `services/CloudControlDashboard.tsx` | `/aws/cloudcontrol` (cloudcontrol.ts) | useCloudControl.ts |
| `services/S3TablesDashboard.tsx` | `/aws/s3tables` (s3tables.ts) | useS3Tables.ts |
| `services/AgentCoreDashboard.tsx` | `/aws/bedrockagentcore` (bedrockagentcore.ts) | useAgentCore.ts |
| `services/CloudHSMDashboard.tsx` | `/aws/cloudhsm` (cloudhsm.ts) | useCloudHSM.ts |

**Fix:** import + add entries in `serviceRegistry.tsx`. Nothing else needed.

### 0.3 Registry inconsistencies (functional, but bypass the registry pattern)

These pages are routed directly in `App.tsx` instead of via `serviceRegistry.tsx` — they work,
but new sidebar/catalog features (favorites, recently visited) may miss them:
`iam` (IAMPage), `kms` (KMSPage), `ec2` (EC2Page), `events` (EventsPage), `cloudwatch`
(CloudWatchPage), `cloudformation` (CloudFormationPage), `secretsmanager` (SecretsManagerPage),
`sns` (SNSPage), `sqs` (SQSPage).

---

## 1. Completely missing services (11 services, 270 actions)

No backend route, no hook, no page, no registry entry. All verified absent repo-wide.

| # | Service | Protocol | Actions | Complexity | Notes |
|---|---|---|---|---|---|
| N.1 | **Service Catalog** | JSON 1.1 (`AWS242ServiceCatalogService.*`) | **89** | Large | Account Factory `ProvisionProduct` creates real Organizations member accounts; bulk of surface is products/portfolios/associations/permissions/constraints |
| N.2 | **Resource Explorer** | REST JSON | **32** | Large | Views + indexes + search; Floci auto-provisions an AGGREGATOR index + `default-view` at startup (zero bootstrap needed). `Search`/`ListResources` are the core ops |
| N.3 | **Network Firewall** | JSON 1.0 (`NetworkFirewall_20201112.*`) | **27** | Medium | Rule groups, firewall policies, firewalls, subnet/AZ associations, logging config. Control-plane only |
| N.4 | **EFS** | REST JSON (`/2015-02-01/...`) | **25** | Medium | File systems, mount targets, access points, policies, lifecycle, tags. Metadata-only in Floci (no NFS data plane) |
| N.5 | **Lambda MicroVMs** | REST JSON (`/2025-09-09/...` + `/2026-04-04/...`) | **22** | Medium | Two models signed as `lambda`: Microvm images/versions/builds (13), RunMicrovm lifecycle (4), network connectors (5). Real CRUD surface — candidate for a Lambda-page section, not emulator config |
| N.6 | **Route 53 Resolver** | JSON 1.1 (`Route53Resolver.*`) | **18** | Medium | Resolver endpoints, resolver rules + associations, firewall domain lists (4 AWS-managed lists computed deterministically) |
| N.7 | **Control Tower** | REST JSON | **15** | Small | Landing zones + baselines lifecycle. Scoped to unblocking LZA Prepare stage |
| N.8 | **Lake Formation** | JSON/REST | **16** | Medium | Data-lake settings, resource registration, permissions (grant/revoke/list), LF-Tags CRUD. Natural pairing: embed in Glue dashboard (permission layer over the Glue catalog) |
| N.9 | **RAM** | REST JSON | **12** | Small | Resource shares CRUD, associations, principals, tags, org-sharing opt-in. `GetResourceShareInvitations` always empty (org sharing auto-accepts) |
| N.10 | **Application Auto Scaling** | JSON 1.1 (`AnyScaleFrontendService.*`) | **9** | Small | Scalable targets + scaling policies + tags. **Missed by every previous audit.** Policies stored but inert in Floci (no control loop). Distinct from EC2 ASG (`autoscaling` id) |
| N.11 | **Service Quotas** | JSON 1.1 (`ServiceQuotasV20190624.*`) | **5** | Small | List/Get quotas (incl. defaults) + request increase (fire-and-forget PENDING in Floci) |

### 1.1 Service Catalog — full action list (89)

Products/portfolios: `CreateProduct`, `DescribeProduct`, `DescribeProductAsAdmin`, `DescribeProductView`, `ListProducts`, `ListProductsAsAdmin`, `SearchProducts`, `SearchProductsAsAdmin`, `UpdateProduct`, `DeleteProduct`, `CreatePortfolio`, `DescribePortfolio`, `ListPortfolios`, `ListPortfoliosForProduct`, `ListAcceptedPortfolioShares`, `ListPortfolioAccess`, `UpdatePortfolio`, `DeletePortfolio`, `AssociateProductWithPortfolio`, `DisassociateProductFromPortfolio`, `CopyProduct`, `AcceptPortfolioShare`, `CreatePortfolioShare`, `DeletePortfolioShare`, `ImportAsProvisionedProduct`, `ProvisionProduct`, `TerminateProvisionedProduct`, `DescribeProvisionedProduct`, `ListProvisionedProductPlans`, `CreateProvisionedProductPlan`, `DeleteProvisionedProductPlan`, `ExecuteProvisionedProductPlan`, `DescribeProvisioningParameters`, `ListPrincipalsForPortfolio`, `AssociatePrincipalWithPortfolio`, `DisassociatePrincipalFromPortfolio`, `ListLaunchPaths`, `DescribeLaunchPath`, `CreateConstraint`, `DescribeConstraint`, `ListConstraintsForPortfolio`, `UpdateConstraint`, `DeleteConstraint`, `CreateTagOption`, `DescribeTagOption`, `ListTagOptions`, `UpdateTagOption`, `DeleteTagOption`, `AssociateTagOptionWithResource`, `DisassociateTagOptionFromResource`, `ListResourcesForTagOption`, `BatchAssociateServiceActionWithProvisionedProduct`, `BatchDisassociateServiceActionFromProvisionedProduct`, `ListServiceActions`, `CreateServiceAction`, `DescribeServiceAction`, `DeleteServiceAction`, `UpdateServiceAction`, `ListServiceActionsForProvisioningArtifact`, `ListPrincipalsForPortfolio` (dup per doc), `SearchProvisionedProducts`, `UpdateProvisionedProduct`, `ListRecordHistory`, `DescribeRecord`, `CreateProvisioningArtifact`, `DescribeProvisioningArtifact`, `ListProvisioningArtifacts`, `ListProvisioningArtifactsForProduct`, `UpdateProvisioningArtifact`, `DeleteProvisioningArtifact`, `ListBudgetsForResource` + Account Factory ops (`ProvisionProduct` w/ AccountFactory, `ListOrganizationsAccess` variants) — extract exact list from `git -C ../floci show origin/main:docs/services/service-catalog.md` when implementing.

### 1.2 Resource Explorer — action list (32)

`ListResources`, `Search`, `ListSupportedResourceTypes`, `CreateIndex`, `GetIndex`, `DeleteIndex`, `ListIndexes`, `UpdateIndexType`, `CreateView`, `GetView`, `DeleteView`, `UpdateView`, `ListViews`, `BatchGetView`, `AssociateDefaultView`, `DisassociateDefaultView`, `GetDefaultView`, `GetAccountLevelServiceConfiguration`, `ListIndexesForMembers`, `ListManagedViews`, `GetManagedView`, `ListServiceViews`, `GetServiceView`, `ListServiceIndexes`, `GetServiceIndex`, `ListStreamingAccessForServices`, `CreateResourceExplorerSetup`, `DeleteResourceExplorerSetup`, `GetResourceExplorerSetup`, `ListTagsForResource`, `TagResource`, `UntagResource`

### 1.3 Network Firewall — action list (27)

Rule groups: `CreateRuleGroup`, `DescribeRuleGroup`, `UpdateRuleGroup`, `DeleteRuleGroup`, `ListRuleGroups`; policies: `CreateFirewallPolicy`, `DescribeFirewallPolicy`, `UpdateFirewallPolicy`, `DeleteFirewallPolicy`, `ListFirewallPolicies`, `AssociateFirewallPolicy`; firewalls: `CreateFirewall`, `DescribeFirewall`, `ListFirewalls`, `DeleteFirewall`, `UpdateFirewall` + protection/description/analysis updates (`UpdateFirewallProtection`, `UpdateFirewallDescription`, `UpdateFirewallEncryptionConfiguration`, `UpdateFirewallDeleteProtection`, `UpdateFirewallSubnetChangeProtection`); `AssociateSubnet`, `DisassociateSubnet`, `AssociateFirewallPolicy` (associations), `DescribeLoggingConfiguration`, `UpdateLoggingConfiguration`

### 1.4 EFS — action list (25)

`CreateFileSystem`, `DescribeFileSystems`, `UpdateFileSystem`, `DeleteFileSystem`, `CreateTags`, `DescribeTags`, `DeleteTags`, `TagResource`, `UntagResource`, `ListTagsForResource`, `CreateMountTarget`, `DescribeMountTargets`, `DeleteMountTarget`, `DescribeMountTargetSecurityGroups`, `ModifyMountTargetSecurityGroups`, `CreateAccessPoint`, `DescribeAccessPoints`, `DeleteAccessPoint`, `PutFileSystemPolicy`, `DescribeFileSystemPolicy`, `DeleteFileSystemPolicy`, `PutBackupPolicy`, `DescribeBackupPolicy`, `PutLifecycleConfiguration`, `DescribeLifecycleConfiguration`

### 1.5 Lambda MicroVMs — action list (22)

Images (13): `CreateMicrovmImage`, `GetMicrovmImage`, `ListMicrovmImages`, `UpdateMicrovmImage`, `DeleteMicrovmImage`, `ListMicrovmImageVersions`, `GetMicrovmImageVersion`, `UpdateMicrovmImageVersion`, `DeleteMicrovmImageVersion`, `ListMicrovmImageBuilds`, `GetMicrovmImageBuild`, `ListManagedMicrovmImages`, `ListManagedMicrovmImageVersions`; MicroVMs (4): `RunMicrovm`, `GetMicrovm`, `ListMicrovms`, `TerminateMicrovm`; Connectors (5): `CreateNetworkConnector`, `GetNetworkConnector`, `ListNetworkConnectors`, `UpdateNetworkConnector`, `DeleteNetworkConnector`

### 1.6 Route 53 Resolver — action list (18)

`ListFirewallDomainLists`, `GetFirewallDomainList`, `CreateFirewallDomainList`, `DeleteFirewallDomainList`, `CreateResolverEndpoint`, `DeleteResolverEndpoint`, `GetResolverEndpoint`, `ListResolverEndpoints`, `UpdateResolverEndpoint`, `CreateResolverRule`, `DeleteResolverRule`, `GetResolverRule`, `ListResolverRules`, `UpdateResolverRule`, `AssociateResolverRule`, `DisassociateResolverRule`, `GetResolverRuleAssociation`, `ListResolverRuleAssociations`

### 1.7 Control Tower — action list (15)

`ListLandingZones`, `GetLandingZone`, `CreateLandingZone`, `UpdateLandingZone`, `DeleteLandingZone`, `ResetLandingZone`, `GetLandingZoneOperation`, `ListLandingZoneOperations`, `ListBaselines`, `ListEnabledBaselines`, `GetEnabledBaseline`, `EnableBaseline`, `ResetEnabledBaseline`, `UpdateEnabledBaseline`, `GetBaselineOperation`

### 1.8 Lake Formation — action list (16)

`PutDataLakeSettings`, `GetDataLakeSettings`, `RegisterResource`, `DeregisterResource`, `ListResources`, `DescribeResource`, `GrantPermissions`, `RevokePermissions`, `ListPermissions`, `CreateLFTag`, `GetLFTag`, `UpdateLFTag`, `DeleteLFTag`, `ListLFTags`, `AddLFTagsToResource`, `RemoveLFTagsFromResource`

### 1.9 RAM — action list (12)

`EnableSharingWithAwsOrganization`, `CreateResourceShare`, `GetResourceShares`, `DeleteResourceShare`, `UpdateResourceShare`, `AssociateResourceShare`, `DisassociateResourceShare`, `ListPrincipals`, `TagResource`, `UntagResource`, `GetResourceShareInvitations`, `ListResources`

### 1.10 Application Auto Scaling — action list (9)

`RegisterScalableTarget`, `DescribeScalableTargets`, `DeregisterScalableTarget`, `PutScalingPolicy`, `DescribeScalingPolicies`, `DeleteScalingPolicy`, `ListTagsForResource`, `TagResource`, `UntagResource`

### 1.11 Service Quotas — action list (5)

`ListServiceQuotas`, `GetServiceQuota`, `GetAWSDefaultServiceQuota`, `ListAWSDefaultServiceQuotas`, `RequestServiceQuotaIncrease`

---

## 2. Missing backend ops in existing services (~691 actions)

Ordered by value. "Frontend: no UI" entries in §5 cover the UI side.

### 2.1 API Gateway v1 — 76 of 82 missing (`src/backend/routes/aws/apigateway.ts`, only 6 commands)

Implemented today: `CreateRestApi`, `GetRestApi`, `GetRestApis`, `DeleteRestApi`, `GetResources`, `GetDeployments`.
Missing: full resource tree (`CreateResource`, `GetResource`, `UpdateResource`, `DeleteResource`), methods (`PutMethod`, `GetMethod`, `UpdateMethod`, `DeleteMethod`, `PutMethodResponse`, `GetMethodResponse`, `DeleteMethodResponse`), integrations (`PutIntegration`, `GetIntegration`, `UpdateIntegration`, `DeleteIntegration`, `PutIntegrationResponse`, `GetIntegrationResponse`, `UpdateIntegrationResponse`, `DeleteIntegrationResponse`), deployments (`CreateDeployment`, `GetDeployment`, `UpdateDeployment`, `DeleteDeployment`), stages (`CreateStage`, `GetStage`, `GetStages`, `UpdateStage`, `DeleteStage`), authorizers (5), API keys (`CreateApiKey`, `ImportApiKeys`, `GetApiKey`, `GetApiKeys`, `UpdateApiKey`, `DeleteApiKey`), usage plans (9: CRUD + keys), request validators (5), models (5), domain names (5), base-path mappings (5), `GetAccount`, `UpdateAccount`, `ImportRestApi`, `PutRestApi`, `UpdateRestApi`, tagging (`TagResource`, `UntagResource`, `GetTags`).
Floci does NOT implement: `TestInvokeAuthorizer`, `GetModelTemplate`, GatewayResponses, documentation parts, VPC links v1, client certs, `GetExport` — skip those.

### 2.2 SES — 84 missing (18 v1 + 66 v2) (`src/backend/routes/aws/ses.ts`)

- **v1 (18):** `SendBulkTemplatedEmail`, custom-verification-email family (6: `Create/Get/List/Update/DeleteCustomVerificationEmailTemplate`, `SendCustomVerificationEmail`), `VerifyDomainDkim`, identity policies (5: `Put/Get/List/DeleteIdentityPolicy`), receipt rule sets (5: `Create/Describe/List/DeleteReceiptRuleSet`, `SetActiveReceiptRuleSet`, `DescribeActiveReceiptRuleSet`).
- **v2 (66 of 68):** everything except `GetAccount`/`PutAccountDetails`: email identities (9), identity policies (4), `SendEmail`, `SendBulkEmail`, account attributes (`PutAccountSendingAttributes`, `PutAccountSuppressionAttributes`, `PutAccountVdmAttributes`), templates (5), config sets (5 + 9 PutConfigurationSet* option groups), dedicated IP pools (4), contact lists (5 + contacts 5), suppression (5), tags (3).
- Also: Floci's `/_aws/ses` inspection mailbox is not surfaced anywhere in the dashboard.

### 2.3 EC2 — 65 of 146 missing (`src/backend/routes/aws/ec2.ts`)

Whole families absent (verified zero `TransitGateway`/`Ipam` hits):
- **Transit Gateway (25):** `Create/Describe/Modify/DeleteTransitGateway`, VPC attachments (5), route tables (10 incl. associations/propagations/routes/search/export)
- **IPAM (18):** org admin enable/disable, `Create/Describe/Modify/DeleteIpam`, pools (7 incl. CIDR provision/allocate/release), BYOASN (3)
- **Prefix lists (5):** `Create/Describe/Modify/DeleteManagedPrefixList`, `GetManagedPrefixListEntries`
- **EBS encryption defaults (6):** `Enable/Disable/GetEbsEncryptionByDefault`, `Modify/Get/ResetEbsDefaultKmsKeyId`
- **Misc (11):** `DescribeInstanceAttribute`, `DescribeVpcAttribute`, `DescribeVpcEndpointServices`, `ModifyVpcEndpoint`, `CreateDefaultVpc`, `GetSecurityGroupsForVpc`, `UpdateSecurityGroupRuleDescriptionsEgress`, `CreateImage`, `RegisterImage`, `ReplaceRoute`, `DescribeAddressesAttribute`, `DescribeInstanceTypeOfferings`, `DescribeIamInstanceProfileAssociations`

### 2.4 CloudFront — 50 of 62 missing (`src/backend/routes/aws/cloudfront.ts`, 12 commands)

Missing: cache policies (5), origin request policies (6), response headers policies (6), OAC (5), OAI (6), functions (5: `CreateFunction`, `DescribeFunction`, `UpdateFunction`, `PublishFunction`, `DeleteFunction`), public keys (6), key groups (6), `TagResource`/`UntagResource`, `CreateDistributionWithTags`, `GetDistributionConfig`, `AssociateAlias`.
**Note:** missing `GetDistributionConfig` makes `UpdateDistribution` awkward (Floci requires If-Match ETag). Skip Floci Phase-2: continuous deployment, `CopyDistribution`, realtime logs, field-level encryption, `TestFunction`, streaming distributions.

### 2.5 IAM — 40 of 98 missing (`src/backend/routes/aws/iam.ts`)

- Users/roles: `UpdateUser`, `UpdateRole`, `CreateServiceLinkedRole`, `DeleteServiceLinkedRole`, `GetServiceLinkedRoleDeletionStatus`
- Policies: `ListEntitiesForPolicy`, `CreatePolicyVersion`, `DeletePolicyVersion`
- **Managed-policy attach/detach (7):** `Attach/DetachUserPolicy`, `Attach/DetachGroupPolicy`, `Attach/DetachRolePolicy`, `ListAttachedGroupPolicies` — entire write path absent
- Inline: `GetRolePolicy`, `ListRolePolicies`
- Instance profiles: `GetInstanceProfile`, `ListInstanceProfilesForRole`
- Access keys: `GetAccessKeyLastUsed`
- Account aliases (3), account password policy (3), `GetAccountSummary`
- **OIDC providers (10):** full family incl. thumbprint/client-ID updates and tagging
- Login profiles (3): `Create/Update/DeleteLoginProfile`
- Note: `iam.ts` already imports 8 of these commands but never instantiates them (dead imports marking intent): `UpdateUser`, `UpdateRole`, `CreatePolicyVersion`, `DeletePolicyVersion`, `AttachUserPolicy`, `DetachUserPolicy`, `AttachRolePolicy`, `DetachRolePolicy`.

### 2.6 AppSync — 35 of 58 missing (`src/backend/routes/aws/appsync.ts`)

`UpdateGraphqlApi`; single-resource reads (`GetDataSource`, `GetResolver`, `GetFunction`); resolver listings (`ListResolversByType`, `ListResolversByFunction`); types (5: `Create/Get/Update/DeleteType` + ListTypes exists); API keys (`GetApiKey`, `UpdateApiKey`); tags (3); environment variables (2); domain names (5); API associations (4 merged-API + `ListApiAssociations`); channel namespaces (5); `GetEnhancedMetricsConfig`.

### 2.7 Organizations — 19 of 56 missing (`src/backend/routes/aws/organizations.ts`)

Handshakes/invitations (6: `InviteAccountToOrganization`, `AcceptHandshake`, `DeclineHandshake`, `CancelHandshake`, `DescribeHandshake`, `ListHandshakesForAccount`, `ListHandshakesForOrganization`), delegated administrators (4), trusted service access (3), organization resource policy (3), `CreateGovCloudAccount`, `ListAccountsWithInvalidEffectivePolicy` (always empty).

### 2.8 S3 — 21 of 62 missing (`s3.ts`, `s3-objects.ts`, `s3-config.ts`, `s3-select.ts`)

Multipart upload (5: `CreateMultipartUpload`, `UploadPart`, `CompleteMultipartUpload`, `AbortMultipartUpload`, `ListMultipartUploads`), Object Lock (6: `Put/Get` for `ObjectLockConfiguration`, `ObjectRetention`, `ObjectLegalHold`), metrics configurations (4), `CopyObject`, `ListObjectVersions`, `ListObjects` (v1), `GetBucketLocation`, `DeleteBucketLifecycle`, `RestoreObject` (Floci stubs 202 — low value). **Presigned-URL generation is not implemented anywhere** (Floci supports generating + validating presigned URLs).

### 2.9 RDS — 16 of 43 missing (`src/backend/routes/aws/rds.ts`)

DB proxies (9: `Create/Modify/DeleteDBProxy`, `DescribeDBProxies`, `Register/DeregisterDBProxyTargets`, `DescribeDBProxyTargetGroups`, `ModifyDBProxyTargetGroup`, `DescribeDBProxyTargets`), option groups (4: `Create/Describe/Modify/DeleteOptionGroup`), `DescribeDBSnapshots`, `DescribeDBClusterSnapshots`, `DescribeGlobalClusters` (the three Describe* return empty lists in Floci — low value). `ModifyDBCluster` implemented but has no UI caller.

### 2.10 S3 Tables — 15 of 25 missing (`s3tables.ts`) + page unregistered

`GetNamespace`, `GetTable`, `RenameTable`, `GetTableMetadataLocation`, `UpdateTableMetadataLocation` (optimistic concurrency via versionToken), table-bucket policy (3), table-bucket maintenance (2), table policy (3), table maintenance (2).

### 2.11 FIS — 17 of 26 missing (`fis.ts`) + page unregistered

`ListActions`, `GetAction`, `GetSafetyLever`, `UpdateSafetyLeverState`, target account configurations (6: create/delete/get/list per experiment/account, `GetExperimentTargetAccountConfiguration`), `ListTargetResourceTypes`, `GetTargetResourceType`, `ListExperimentResolvedTargets`, tags (3).

### 2.12 IoT — 16 of 72 missing (`iot.ts`)

Thing groups (9: full family incl. membership), jobs control plane (3: `CreateJob`, `DescribeJob`, `ListJobs`), jobs data-plane mutations (2: `StartNextPendingJobExecution`, `UpdateJobExecution`), `ListPrincipalThings`, `UpdateThingType` (Floci implements retired op).

### 2.13 SWF — 11 of 39 missing (`swf.ts`)

The entire worker/decider runtime: `PollForDecisionTask`, `RespondDecisionTaskCompleted`, `PollForActivityTask`, `RecordActivityTaskHeartbeat`, `RespondActivityTaskCompleted/Failed/Canceled`, `CountOpen/ClosedWorkflowExecutions`, `CountPendingActivityTasks`, `CountPendingDecisionTasks`. Arguably by-design (a dashboard is control-plane), but Floci's full decider/worker runtime is unreachable from the dashboard.

### 2.14 MSK — 13 of 18 missing (`msk.ts`)

Broker configurations family (6: `Create/Describe/Delete/UpdateConfiguration`, `ListConfigurations`, `List/DescribeConfigurationRevision`), entire v1 API (3: `Create/Describe/ListClusters` — legacy, skippable), tags (3).

### 2.15 Bedrock AgentCore — 29 of 35 missing (`bedrockagentcore.ts`) + page unregistered

Runtime endpoints (5), runtime versions (1: `ListAgentRuntimeVersions`), workload identities (5), gateways (5), gateway targets (5), memory (5), tags (3).

### 2.16 CloudHSM — 13 of 18 missing (`cloudhsm.ts`) + page unregistered

`ModifyCluster`, `InitializeCluster`, `CreateHsm`, `DeleteHsm`, `RestoreBackup`, `ModifyBackupAttributes`, `CopyBackupToRegion`, resource policy (3), tags (3).

### 2.17 CloudWatch Logs — 11 of 29 missing (`logs.ts`)

`AssociateKmsKey`, `DisassociateKmsKey`, `PutLogGroupDeletionProtection`, tag-by-ARN (3: `TagResource`/`UntagResource`/`ListTagsForResource`), resource policies (2: `PutResourcePolicy`, `DescribeResourcePolicies`), **Logs Insights queries (3: `StartQuery`, `GetQueryResults`, `StopQuery`)** — note Floci's query language is a degraded subset.

### 2.18 ElastiCache — 11 of 22 missing (`elasticache.ts`)

Cache subnet groups (4), cache parameter groups (5 incl. `DescribeCacheParameters`), `ListTagsForResource`, `ValidateIamAuthToken` (data-plane auth).

### 2.19 OpenSearch — 15 of 24 missing (`opensearch.ts`)

Meaningful: `RemoveTags` (untagging currently impossible), `DescribeDomainConfig`, `GetCompatibleVersions`, `ListInstanceTypeDetails`, `DescribeInstanceTypeLimits`, `DescribeDomains`. Low value (Floci no-op stubs): `DescribeDomainChangeProgress`, `DescribeDomainAutoTunes`, `DescribeDryRunProgress`, `DescribeDomainHealth`, `GetUpgradeHistory`, `GetUpgradeStatus`, `CancelDomainConfigChange`, `StartServiceSoftwareUpdate`, `CancelServiceSoftwareUpdate`.

### 2.20 Lightsail — 10 of 40 missing (`lightsail.ts`)

`ImportKeyPair`, `DownloadDefaultKeyPair`, `GetRegions`, **`GetBlueprints`/`GetBundles` (catalog the create-instance form should consume)**, `GetActiveNames`, `GetOperations`, `GetOperationsForResource`, `GetOperation`, `IsVpcPeered`.

### 2.21 Medium gaps (5–8 ops each)

- **CloudFormation (5):** `UpdateTerminationProtection`, `GetTemplateSummary`, `UpdateStackSet`, `DescribeStackInstance`, `DescribeStackSetOperation`
- **CloudMap (4):** `DiscoverInstancesRevision`, tags (3). Also `DiscoverInstances` + `GetInstancesHealthStatus` have no UI.
- **Route 53 (4):** `ListHostedZonesByName`, `GetHostedZoneCount`, `GetHealthCheck`, `UpdateHealthCheck`
- **GuardDuty (8):** org config (5: `Describe/UpdateOrganizationConfiguration`, `Enable/DisableOrganizationAdminAccount`, `ListOrganizationAdminAccounts`), tags (3)
- **ECS (7):** `UpdateClusterSettings`, `DeleteTaskDefinitions`, `ListServicesByNamespace`, agent stubs (4: `RegisterContainerInstance`, `SubmitTaskStateChange`, `SubmitContainerStateChange`, `SubmitAttachmentStateChanges`) — agent stubs are low value
- **EKS (7):** Fargate profiles (4), tags (3)
- **DocDB (5):** `DescribeDBClusterSnapshots`, `DescribeGlobalClusters` (both empty in Floci), tag ops (3)
- **KMS (6):** `CreateGrant`, `ListRetirableGrants`, `ReEncrypt`, `GenerateDataKeyWithoutPlaintext`, `UpdateAlias`, `ListKeyPolicies`

### 2.22 Small gaps (1–3 ops each)

| Service | Missing |
|---|---|
| API Gateway v2 (14) | `UpdateApi`, `DeleteCorsConfiguration`, domain names (5: `Create/Get/GetList/DeleteDomainName`), API mappings (4), VPC links (4) |
| AppConfig (11) | `GetEnvironment`, `GetConfigurationProfile`, hosted config versions (3), deployment strategies (4), `StartDeployment`, `GetDeployment` — whole deployment surface |
| Backup (4) | `UpdateBackupPlan`, `TagResource`, `UntagResource`, `GetSupportedResourceTypes` |
| Cognito (2) | `AdminLinkProviderForUser`, `GetUserAttributeVerificationCode` |
| CodePipeline (7) | third-party job aliases (5: `Acknowledge/Get/PollFor/PutThirdPartyJob*`), `ListRuleTypes`, `ListDeployActionExecutionTargets` — all alias/empty-list ops, trivial |
| CloudControl (1) | `GetResourceRequestStatus` — **functionally important**: `CreateResource` is async in Floci; UI can't poll completion |
| CloudFormation — see 2.21 | |
| DocDB/ECR/EventBridge/Kinesis/etc. | see below |
| ECR (1) | `DeleteLifecyclePolicy` (dead import) |
| ElastiCache — see 2.18 | |
| EMR (3) | `SetVisibleToAllUsers`, `SetKeepJobFlowAliveWhenNoSteps`, `SetUnhealthyNodeReplacement` |
| EventBridge (6) | `DescribeRule` (dead import), **connections family (5)** — API destinations entirely absent |
| Firehose (3) | `UpdateDestination`, `StartDeliveryStreamEncryption`, `StopDeliveryStreamEncryption` |
| Glue (1) | `CreatePartition` (only Batch variant implemented) |
| Kinesis (1) | `UpdateMaxRecordSize` |
| Kinesis Analytics (1) | `CreateApplicationPresignedUrl` (returns live Flink dashboard URL — nice UI affordance) |
| Lambda (4) | `GetFunctionConfiguration`, `GetEventSourceMapping`, `GetAlias`, `GetLayerVersion` (all single-item reads reachable via List — low severity) |
| MWAA (3) | tags (3) |
| OpenSearch — see 2.19 | |
| RDS Data (1) | `BatchExecuteStatement` |
| SNS (5) | `ConfirmSubscription`, platform/endpoint attributes (4) |
| SSM (3) | patch-baseline stubs (`DescribePatchBaselines`, `GetDefaultPatchBaseline`, `UpdateInstanceInformation`) — cosmetic |
| SQS (1) | `DeleteMessageBatch` (dead import) |
| Step Functions (1) | `UpdateStateMachine` — **state machines created in UI can never be edited** |
| CloudTrail, Cognito — see above | |

---

## 3. Backend ops implemented but with NO frontend UI

High-value subset (hooks exist but are never invoked, or no hook at all):

| Service | Ops with no UI |
|---|---|
| Auto Scaling | `CreateAutoScalingGroup`, `UpdateAutoScalingGroup`, `SetDesiredCapacity`, `DescribeScalingActivities` — no way to create/edit an ASG from the dashboard |
| Batch | `ListJobs`, `DescribeJobs` (jobs can be submitted but never seen), `TerminateJob` |
| ACM | `RequestCertificate` (hook exists, unused — no create button), `DescribeCertificate` detail, `GetCertificate` PEM, tag ops, account config |
| API GW v2 | `CreateApi`, `CreateRoute`, `CreateIntegration`, `DeleteRoute`, `DeleteStage`, `DeleteDeployment` + all singular detail ops |
| AppConfig | `CreateApplication` (no create-app UI) |
| Backup | `Create/DeleteBackupSelection`, `ListTags`, detail hooks (list-level views only) |
| CloudMap | `DiscoverInstances`, `GetInstancesHealthStatus` |
| CloudTrail | `GetTrailStatus` |
| CloudWatch | `GetMetricData` endpoint |
| Cognito — n/a | |
| EC2 | account attributes, EIP associate/disassociate, instance status, launch-template versions/modify, route-table associate/create/delete, SG egress rules, `ModifySecurityGroupRules`, tags CRUD, VPC endpoints CRUD, VPC CIDR associate, `ModifySubnetAttribute` |
| ECR | tags, `BatchDeleteImage`, `Set/DeleteRepositoryPolicy`, `PutLifecyclePolicy` |
| ECS | `UpdateCluster`, `PutClusterCapacityProviders`, service deployments/revolutions, tags, attributes, `UpdateService`, task-def register/deregister, `UpdateTaskSet`, container-instance detail |
| ElastiCache | `ModifyReplicationGroup`, `ModifyUser` |
| ELB | `DescribeTargetHealth`, `RegisterTargets`, `DeregisterTargets`, load-balancer attributes |
| EMR | `ModifyCluster`, `SetTerminationProtection`, `DescribeStep`, `CancelSteps`, instance groups/fleets, `ListInstances`, tags, `AddJobFlowSteps` — thinnest UI vs backend (6 of 14 routes used) |
| Firehose | `PutRecordBatch` |
| Glue | `BatchGetPartition` |
| IAM | user inline-policy writes (read-only display) |
| IoT | `Attach/DetachPolicy`, `ListTargetsForPolicy`, `ListAttachedPolicies`, thing principals, `CreateCertificateFromCsr`, `DescribeJobExecution`, retained-message detail |
| KMS | `GenerateRandom`, `GetPublicKey`, `GenerateDataKey`, `GenerateMac`/`VerifyMac`, `RevokeGrant`, `RetireGrant`, tag mutations |
| Lambda | `UpdateFunctionCode` |
| Lightsail | instance state, public ports, tags |
| OpenSearch — n/a | |
| Organizations | `DescribeCreateAccountStatus`, `DescribeEffectivePolicy`, `Enable/DisablePolicyType` |
| S3 Tables — page unreachable | |
| SQS | `AddPermission`/`RemovePermission`, `ChangeMessageVisibilityBatch`, `GetQueueUrl` |
| Step Functions | `DescribeExecution` detail, `DeleteStateMachineVersion` |
| SWF | type detail ops, undeprecate ops, execution detail, `RequestCancelWorkflowExecution`, domain tags |
| Textract | 4 async-job ops |
| Transfer | `UpdateUser` |
| Athena | `GetDataCatalog` detail |
| Cur/Config/Cognito/CodeDeploy/CodePipeline | tag endpoints / delivery channels (minor) |

Also: Floci local inspection endpoints not surfaced: `/_aws/ses` (mailbox), `/_aws/sqs/messages` (peek/purge).

---

## 4. Dashboard-only ops that will error against Floci (cleanup candidates)

These dashboard calls have no Floci implementation — they 404/error at runtime:

- **S3:** `PutBucketLogging` / `GetBucketLogging` (Floci "Not Implemented" list)
- **Route 53:** `GetDNSSEC` (Floci Phase 2)
- **Lambda:** code-signing config CRUD (5), event-invoke config (3)
- **Batch:** `TerminateJob` (explicitly not implemented), `DeleteComputeEnvironment`, `DeleteJobQueue` (absent from Floci source) — delete buttons error
- **DynamoDB:** PartiQL ops (`ExecuteStatement`, `BatchExecuteStatement`, `ExecuteTransaction`) are not in Floci's documented table — verify before relying
- **SES v1/v2 divergence:** v1/v2 share state in Floci, so partially masked

---

## 5. Recommended implementation order

| Priority | Work | Est. effort | Why |
|---|---|---|---|
| P0 | Fix AmazonMQ paths (hook + backend) | XS | Service currently 100% broken |
| P0 | Register 6 orphaned dashboards | XS | 6 working features invisible |
| P1 | IAM 40 ops (esp. attach/detach, policy versions, OIDC, login profiles) | M | Highest-use service in the dashboard |
| P1 | EC2 TGW (25) + IPAM (18) + prefix lists (5) | L | Whole feature families; TGW pairs with RAM/LZA flows |
| P1 | Step Functions `UpdateStateMachine`; CloudControl `GetResourceRequestStatus` | XS | Completes existing workflows |
| P1 | API Gateway v1 resources/methods/integrations/stages (the ~50 core of the 76) | L | v1 is currently a stub with 6 ops |
| P2 | SES v2 surface (identities, templates, config sets, send) | M | v2 is 2/68 |
| P2 | CloudFront policy/OAC/function families (50) | M | |
| P2 | S3 multipart + CopyObject + Object Lock (13 core) | M | |
| P2 | Organizations handshakes/delegated admins (19); RDS proxies (9 core); MSK configs (7); AppConfig deployments (11); EventBridge connections (5) | M each | |
| P2 | New services: Application Auto Scaling (9), Service Quotas (5), RAM (12), Control Tower (15) | S–M each | Small, self-contained |
| P2 | New services: EFS (25), Route 53 Resolver (18), Lake Formation (16, embed in Glue), Network Firewall (27), Resource Explorer (32), Lambda MicroVMs (22, Lambda-page section) | M each | |
| P3 | Service Catalog (89) | L | Biggest single service; Account Factory ties into Organizations |
| P3 | Frontend coverage for no-UI backend ops (§3) — Auto Scaling create/edit, Batch jobs list, ACM create, ELB targets, EMR enrichment | M | UX completeness |
| P3 | Registry consolidation (§0.3) | S | Consistency |

---

## Appendix — per-service status at a glance

| Service | Floci ops | Backend | Missing | Frontend |
|---|---|---|---|---|
| ACM | 12 | 12/12 | 0 | gaps (§3) |
| AmazonMQ | 5 | 5/5 | 0 | **broken (§0.1)** |
| API Gateway v1 | 82 | 6 | 76 | ok for the 6 |
| API Gateway v2 | 61 | 47 | 14 | create/delete gaps |
| AppConfig (+Data) | 20+2 | 9+2 | 11 | create-app missing |
| App Auto Scaling | 9 | 0 | 9 | **missing service** |
| AppSync | 58 | 23 | 35 | schema/update gaps |
| Athena | 14 | 14 | 0 | catalog detail |
| Auto Scaling | 37 | 36 | 1 | **no ASG create/edit UI** |
| Backup | 24 | 20 | 4 | selection/tags UI |
| Batch | 10 | 13 | 0 | **jobs invisible** |
| BCM Data Exports | 7 | 6 | 1 (GetExecution) | tags no UI |
| Bedrock AgentCore | 35 | 6 | 29 | **page unregistered** |
| Bedrock Runtime | 2 | 2 | 0 | ok |
| CE | 9 | 9 | 0 | ok |
| CloudControl | 5 | 4 | 1 | **page unregistered** |
| CloudFormation | 32 | 26 | 5 | minor |
| CloudFront | 62 | 12 | 50 | ok for the 12 |
| CloudHSM | 18 | 5 | 13 | **page unregistered** |
| CloudMap | 22 | 18 | 4 | discover/health no UI |
| CloudTrail | 10 | 10 | 0 | status no UI |
| CloudWatch Logs | 29 | 18 | 11 | ok |
| CloudWatch Metrics | 8 | 8 | 0 | GetMetricData no UI |
| CodeBuild | 20 | 20 | 0 | ok |
| CodeDeploy | 30 | 30+11 | 0 | tags no UI |
| CodePipeline | 44 | 37 | 7 | tags no UI |
| Cognito | 43 | 41+17 | 2 | ok |
| Config | 20 | 20 | 0 | delivery channels no UI |
| Control Tower | 15 | 0 | 15 | **missing service** |
| CUR | 7 | 7 | 0 | tags no UI |
| DocDB | 13 | 8 | 5 | ok |
| DynamoDB (+Streams) | 32 | 32+3 | 0 | ok |
| EC2 | 146 | 81 | 65 | many no-UI ops |
| ECR | 18 | 18 | 1 | tags/policies/lifecycle no UI |
| ECS | 58 | 51 | 7 | many no-UI ops |
| EFS | 25 | 0 | 25 | **missing service** |
| EKS | 15 | 8 | 7 | ok |
| Elastic Beanstalk | 14 | 14 | 0 | 2 unused hooks |
| ElastiCache | 22 | 11 | 11 | modify no UI |
| ELBv2 | 37 | 37 | 0 | targets/attributes no UI |
| EMR | 24 | 21 | 3 | thinnest UI (§3) |
| EMR Serverless | 7 | 7 | 0 | ok |
| EventBridge | 35 | 29 | 6 | replay detail |
| Firehose | 12 | 9 | 3 | batch no UI |
| FIS | 26 | 9 | 17 | **page unregistered** |
| Glue | 59 | 54 | 1 (+4 stubs) | batch-get no UI |
| GuardDuty | 13 | 5 | 8 | **page unregistered** |
| IAM | 98 | 58 | 40 | inline-write gap |
| IoT | 72 | 56 | 16 | attach/csr/principals no UI |
| Kinesis | 28 | 27 | 1 | ok |
| Kinesis Analytics | 15 | 14 | 1 | ok |
| KMS | 38 | 32 | 6 | many no-UI ops |
| Lake Formation | 16 | 0 | 16 | **missing service** |
| Lambda | 39 | 35 | 4 | code update no UI |
| Lambda MicroVMs | 22 | 0 | 22 | **missing service** |
| Lightsail | 40 | 30 | 10 | state/ports/tags no UI |
| MemoryDB | 13 | 13 | 0 | ok |
| MSK | 18 | 5 | 13 | ok for the 5 |
| MWAA | 10 | 7 | 3 | ok |
| Neptune | 8 | 8 | 0 | ok |
| Network Firewall | 27 | 0 | 27 | **missing service** |
| OpenSearch | 24 | 9 | 15 | ok for the 9 |
| Organizations | 56 | 38 | 19 | 4 no-UI ops |
| Pipes | 7 | 7 | 0 | ok |
| Pricing | 5 | 5 | 0 | ok |
| RAM | 12 | 0 | 12 | **missing service** |
| RDS | 43 | 27 | 16 | ModifyDBCluster no UI |
| RDS Data | 5 | 4 | 1 | ok |
| Resource Explorer | 32 | 0 | 32 | **missing service** |
| RGT | 5 | 5 | 0 | ok |
| Route 53 | 17 | 13 | 4 | ok |
| Route 53 Resolver | 18 | 0 | 18 | **missing service** |
| RUM | 5 | 5 | 0 | ok |
| S3 | 62 | 41 | 21 | ok |
| S3 Tables | 25 | 10 | 15 | **page unregistered** |
| S3 Vectors | 12 | 12 | 0 | ok |
| Scheduler | 12 | 9 | 3 | ok |
| Secrets Manager | 18 | 18 | 0 | ok |
| Service Catalog | 89 | 0 | 89 | **missing service** |
| Service Quotas | 5 | 0 | 5 | **missing service** |
| SES | 128 | 44 | 84 | ok for the 44 |
| SNS | 27 | 22 | 5 | ok |
| SQS | 23 | 22 | 1 | 4 no-UI ops |
| SSM | 27 | 24 | 3 | invocation detail alt |
| Step Functions | 27 | 26 | 1 | 2 no-UI ops |
| STS | 7 | 7 | 0 | ok |
| SWF | 39 | 28 | 11 | 5 no-UI ops |
| Textract | 6 | 6 | 0 | async jobs no UI |
| Transcribe | 8 | 8 | 0 | vocabulary detail |
| Transfer | 17 | 17 | 0 | UpdateUser no UI |
| WAFv2 | 36 | 36 | 0 | ok |
