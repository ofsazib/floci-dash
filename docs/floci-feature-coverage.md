# Độ phủ chức năng Floci trong Floci Dash

> Ngày khảo sát: 2026-10-25 · Nhánh: `fix/organizations-page-display`
> Câu hỏi: **Floci (`../floci`) hỗ trợ những chức năng nào, và dashboard đã có giao diện cho chức năng đó chưa?**
> Báo cáo liên quan: [So sánh Organizations với console AWS thật](organizations-aws-console-gap.md)

## Cách đo

Mỗi operation được xếp vào một trong ba mức:

| Ký hiệu | Ý nghĩa |
|---|---|
| ✅ | **Có giao diện:** có route backend gọi operation này, có hook frontend gọi route đó, và hook được một màn hình gọi thật (không tính import thừa) |
| 🟠 | **Có backend, chưa có giao diện:** route backend đã gọi operation, nhưng không có hook nào gọi route, hoặc hook có mà không màn hình nào dùng |
| ❌ | **Chưa có:** dashboard không gọi operation này ở đâu cả |

**Nguồn dữ liệu**
1. **Floci hỗ trợ gì:** các section "Supported Operations / Supported Actions / Coverage / Endpoints" trong `../floci/docs/services/*.md`. Mỗi tên operation được **xác minh** bằng cách kiểm tra AWS SDK client tương ứng trong `node_modules/@aws-sdk/client-*` có `XxxCommand` hay không. Tên cũ như `PutBucketLifecycle` được quy về `PutBucketLifecycleConfiguration`.
2. **Backend:** các lệnh `new XxxCommand(` trong `src/backend/routes/aws/*.ts`, tách theo từng route (kể cả hàm helper mà route gọi tới), cùng prefix mount trong `index.ts`.
3. **Giao diện:** mọi lời gọi `api(...)` trong `src/frontend` (có xử lý template string và chuỗi ghép bằng `+`), khớp với route backend theo method và đường dẫn. Sau đó kiểm tra hook có được gọi (`useX(`) trong `pages/` hay `components/` hay không, sau khi đã bỏ phần import.

**Giới hạn đã biết** (đã hiệu chỉnh tay ở mục 0)
- Đo ở mức **route**: nếu một route gọi 2 operation (ví dụ `GET /accounts` gọi `ListAccounts` hoặc `ListAccountsForParent`), cả hai đều được tính là "có giao diện".
- Không phát hiện được nút có trong code nhưng không bao giờ hiện ra. Ví dụ Organizations: `onDelete` bị `ResourceTable` bỏ qua, xem [báo cáo Organizations §15.1](organizations-aws-console-gap.md).
- Route gọi Floci bằng HTTP trực tiếp (`fetch`/`flociFetch`) thay vì SDK thì không đo được: S3 Select, Amazon MQ, S3 Vectors, Lambda MicroVMs, một phần AgentCore Control, phần inspection của SQS/SNS/SES.
- Với service dashboard chưa cài SDK client, danh sách operation lấy từ docs Floci mà **chưa xác minh** qua SDK.
- Kiểm tra tay trên S3 và EC2 (CopyObject 🟠, CreateTags 🟠, AttachVolume ❌, S3 Select, Lifecycle) cho kết quả khớp với script, sau khi đã hiệu chỉnh các mục ở trên.

## 0. Kết luận chính và hiệu chỉnh tay

**Kết luận**
- Floci hỗ trợ **khoảng 3.700 operation** trên hơn 120 service. Dashboard mới có giao diện cho **khoảng 1/3**, có backend cho **khoảng 1/2**.
- **Khoảng 740 operation đã có route backend nhưng không có giao diện.** Đây là phần dễ bổ sung nhất: chỉ cần viết thêm hook hoặc UI, không phải viết thêm backend.
- **27 service Floci hỗ trợ mà dashboard chưa có trang** (mục 3). Lớn nhất là DataSync, Marketplace, Global Accelerator, CodeArtifact, Verified Permissions, SageMaker, Budgets, Security Hub.
- Các service có trang nhưng thiếu nhiều nhất: **IAM, EC2, SES, Glue, SSO Admin** (backend chỉ có `ListInstances`), **RDS, API Gateway, Service Catalog, AgentCore, CloudFront**.
- **11 lời gọi từ frontend tới route không tồn tại**: đây là lỗi đang có, xem mục 6. Cụ thể:
  - Toàn bộ chức năng SES email templates: hook gọi `/aws/ses/...` trong khi route nằm ở `/aws/email/v2/...`.
  - Xóa CUR report: frontend gọi `DELETE`, backend nhận `POST .../delete`.
  - Pricing price-list-file-url: frontend gọi `POST`, backend nhận `GET`.
  - Đọc và ghi ACL của S3 object: không có route.
  - `useS3HeadBucket`: không có route, và hook cũng không được dùng.

**Hiệu chỉnh tay so với số liệu tự động**

| Service | Operation | Script | Thực tế | Lý do |
|---|---|---|---|---|
| s3 | SelectObjectContent | ❌ | ✅ | `s3-select.ts` gọi Floci bằng `fetch`; UI có `S3SelectQueryEditor` trong `S3Page.tsx` |
| organizations | DeleteOrganizationalUnit, CloseAccount, DeletePolicy | ✅ | 🔴 không dùng được | Nút xóa không hiện vì `ResourceTable` bỏ qua `onDelete` |
| organizations | ListAccounts | ✅ | 🟠 | UI luôn gửi `parentId`, nên chỉ chạy `ListAccountsForParent(root)` |
| lightsail | (docs dạng văn xuôi) | — | xem dưới | Docs Floci không có bảng operation |

**Lightsail** (đọc tay từ docs Floci): dashboard đã có instances (create/get/start/stop/reboot/delete/state/ports), disks (create/get/attach/detach/delete), static IPs, key pairs (create/get/delete) và tags. **Còn thiếu:** `ImportKeyPair`, `DownloadDefaultKeyPair`, các API khám phá (`GetRegions`, `GetBlueprints`, `GetBundles`, `GetActiveNames`), `GetOperations` / `GetOperationsForResource`.

**Chức năng Floci giả lập dạng stub** (dashboard có làm thêm cũng không có tác dụng thật): S3 `RestoreObject` chỉ trả về 202, S3 Replication chỉ lưu cấu hình mà không sao chép dữ liệu. Chi tiết xem từng file trong `../floci/docs/services/`.

## 1. Tổng quan

| | Số operation |
|---|---:|
| Floci hỗ trợ (123 service có danh sách operation) | **3720** |
| Dashboard có route backend gọi tới | **1996** (54%) |
| Dashboard có giao diện dùng được | **1252** (34%) |
| Có backend nhưng chưa có giao diện (🟠) | **744** |
| Chưa có ở đâu (❌) | **1724** |

## 2. Bảng tổng hợp theo service

Sắp xếp theo số operation **chưa có giao diện** (nhiều nhất lên đầu). Chỉ gồm các service dashboard đã có trang.

| Service (docs Floci) | Floci | Backend | UI | % UI | Thiếu UI |
|---|---:|---:|---:|---:|---:|
| [iam](#svc-iam) | 165 | 76 | 32 | 19% | 133 |
| [ec2](#svc-ec2) | 188 | 120 | 69 | 37% | 119 |
| [ses](#svc-ses) | 148 | 105 | 36 | 24% | 112 |
| [glue](#svc-glue) | 117 | 40 | 21 | 18% | 96 |
| [ssoadmin](#svc-ssoadmin) | 79 | 1 | 1 | 1% | 78 |
| [rds](#svc-rds) | 98 | 37 | 21 | 21% | 77 |
| [api-gateway](#svc-api-gateway) | 122 | 95 | 49 | 40% | 73 |
| [service-catalog](#svc-service-catalog) | 89 | 21 | 16 | 18% | 73 |
| [bedrock-agentcore](#svc-bedrock-agentcore) | 65 | 5 | 4 | 6% | 61 |
| [cloudfront](#svc-cloudfront) | 63 | 42 | 5 | 8% | 58 |
| [cognito](#svc-cognito) | 76 | 50 | 34 | 45% | 42 |
| [organizations](#svc-organizations) | 56 | 37 | 14 | 25% | 42 |
| [s3](#svc-s3) | 83 | 59 | 42 | 51% | 41 |
| [appsync](#svc-appsync) | 49 | 38 | 17 | 35% | 32 |
| [cloudwatch](#svc-cloudwatch) | 55 | 29 | 24 | 44% | 31 |
| [iot](#svc-iot) | 47 | 41 | 16 | 34% | 31 |
| [backup](#svc-backup) | 41 | 23 | 11 | 27% | 30 |
| [emr](#svc-emr) | 37 | 21 | 8 | 22% | 29 |
| [lambda](#svc-lambda) | 55 | 37 | 27 | 49% | 28 |
| [sns](#svc-sns) | 39 | 22 | 12 | 31% | 27 |
| [config](#svc-config) | 36 | 20 | 13 | 36% | 23 |
| [eks](#svc-eks) | 31 | 26 | 8 | 26% | 23 |
| [redshift](#svc-redshift) | 43 | 21 | 21 | 49% | 22 |
| [ecs](#svc-ecs) | 59 | 51 | 38 | 64% | 21 |
| [swf](#svc-swf) | 39 | 28 | 18 | 46% | 21 |
| [elasticache](#svc-elasticache) | 28 | 10 | 9 | 32% | 19 |
| [fis](#svc-fis) | 26 | 9 | 7 | 27% | 19 |
| [route53](#svc-route53) | 27 | 18 | 8 | 30% | 19 |
| [autoscaling](#svc-autoscaling) | 46 | 32 | 28 | 61% | 18 |
| [ecr](#svc-ecr) | 24 | 18 | 7 | 29% | 17 |
| [kms](#svc-kms) | 42 | 36 | 25 | 60% | 17 |
| [resource-explorer](#svc-resource-explorer) | 32 | 29 | 15 | 47% | 17 |
| [msk](#svc-msk) | 18 | 12 | 2 | 11% | 16 |
| [network-firewall](#svc-network-firewall) | 27 | 18 | 11 | 41% | 16 |
| [s3tables](#svc-s3tables) | 25 | 10 | 9 | 36% | 16 |
| [appconfig](#svc-appconfig) | 25 | 12 | 10 | 40% | 15 |
| [guardduty](#svc-guardduty) | 20 | 5 | 5 | 25% | 15 |
| [efs](#svc-efs) | 26 | 26 | 12 | 46% | 14 |
| [cloudhsmv2](#svc-cloudhsmv2) | 18 | 5 | 5 | 28% | 13 |
| [dynamodb](#svc-dynamodb) | 35 | 28 | 22 | 63% | 13 |
| [opensearch](#svc-opensearch) | 24 | 12 | 11 | 46% | 13 |
| [secrets-manager](#svc-secrets-manager) | 23 | 18 | 10 | 43% | 13 |
| [acm](#svc-acm) | 16 | 12 | 4 | 25% | 12 |
| [eventbridge](#svc-eventbridge) | 40 | 29 | 28 | 70% | 12 |
| [ce](#svc-ce) | 20 | 9 | 9 | 45% | 11 |
| [cloudformation](#svc-cloudformation) | 36 | 26 | 25 | 69% | 11 |
| [codedeploy](#svc-codedeploy) | 29 | 29 | 18 | 62% | 11 |
| [step-functions](#svc-step-functions) | 32 | 26 | 21 | 66% | 11 |
| [kinesis](#svc-kinesis) | 29 | 23 | 19 | 66% | 10 |
| [batch](#svc-batch) | 19 | 13 | 10 | 53% | 9 |
| [elb](#svc-elb) | 37 | 37 | 28 | 76% | 9 |
| [neptune](#svc-neptune) | 14 | 8 | 5 | 36% | 9 |
| [wafv2](#svc-wafv2) | 35 | 35 | 26 | 74% | 9 |
| [athena](#svc-athena) | 21 | 14 | 13 | 62% | 8 |
| [sqs](#svc-sqs) | 23 | 23 | 15 | 65% | 8 |
| [cloudmap](#svc-cloudmap) | 22 | 22 | 15 | 68% | 7 |
| [cloudtrail](#svc-cloudtrail) | 14 | 10 | 7 | 50% | 7 |
| [connect](#svc-connect) | 15 | 12 | 8 | 53% | 7 |
| [docdb](#svc-docdb) | 13 | 8 | 6 | 46% | 7 |
| [managed-prometheus](#svc-managed-prometheus) | 13 | 8 | 6 | 46% | 7 |
| [ssm](#svc-ssm) | 21 | 18 | 14 | 67% | 7 |
| [codebuild](#svc-codebuild) | 20 | 20 | 14 | 70% | 6 |
| [controltower](#svc-controltower) | 21 | 15 | 15 | 71% | 6 |
| [firehose](#svc-firehose) | 12 | 9 | 6 | 50% | 6 |
| [kinesisanalytics](#svc-kinesisanalytics) | 15 | 14 | 9 | 60% | 6 |
| [ram](#svc-ram) | 15 | 12 | 9 | 60% | 6 |
| [textract](#svc-textract) | 6 | 6 | 0 | 0% | 6 |
| [cur](#svc-cur) | 7 | 7 | 2 | 29% | 5 |
| [scheduler](#svc-scheduler) | 12 | 8 | 7 | 58% | 5 |
| [applicationautoscaling](#svc-applicationautoscaling) | 10 | 9 | 6 | 60% | 4 |
| [elastic-beanstalk](#svc-elastic-beanstalk) | 14 | 14 | 10 | 71% | 4 |
| [memorydb](#svc-memorydb) | 13 | 13 | 9 | 69% | 4 |
| [mwaa](#svc-mwaa) | 10 | 7 | 6 | 60% | 4 |
| [route53resolver](#svc-route53resolver) | 18 | 18 | 14 | 78% | 4 |
| [servicequotas](#svc-servicequotas) | 7 | 5 | 3 | 43% | 4 |
| [transfer](#svc-transfer) | 17 | 17 | 13 | 76% | 4 |
| [bcm-data-exports](#svc-bcm-data-exports) | 7 | 6 | 4 | 57% | 3 |
| [bedrock-runtime](#svc-bedrock-runtime) | 3 | 2 | 0 | 0% | 3 |
| [emr-serverless](#svc-emr-serverless) | 10 | 7 | 7 | 70% | 3 |
| [lakeformation](#svc-lakeformation) | 17 | 17 | 14 | 82% | 3 |
| [pipes](#svc-pipes) | 7 | 7 | 4 | 57% | 3 |
| [transcribe](#svc-transcribe) | 8 | 8 | 5 | 63% | 3 |
| [codegurureviewer](#svc-codegurureviewer) | 7 | 7 | 5 | 71% | 2 |
| [elb-classic](#svc-elb-classic) | 19 | 19 | 17 | 89% | 2 |
| [rds-data](#svc-rds-data) | 6 | 4 | 4 | 67% | 2 |
| [rum](#svc-rum) | 5 | 5 | 4 | 80% | 1 |
| [cloudcontrol](#svc-cloudcontrol) | 5 | 5 | 5 | 100% | 0 |
| [comprehend](#svc-comprehend) | 5 | 5 | 5 | 100% | 0 |
| [pricing](#svc-pricing) | 5 | 5 | 5 | 100% | 0 |
| [rekognition](#svc-rekognition) | 5 | 5 | 5 | 100% | 0 |
| [resource-groups-tagging](#svc-resource-groups-tagging) | 5 | 5 | 5 | 100% | 0 |
| [sts](#svc-sts) | 7 | 7 | 7 | 100% | 0 |
| [translate](#svc-translate) | 3 | 3 | 3 | 100% | 0 |

## 3. Service Floci hỗ trợ nhưng dashboard **chưa có trang**

| Service (docs Floci) | Số operation Floci | Ghi chú |
|---|---:|---|
| datasync | 63 | Chưa cài SDK client; số operation lấy từ docs, chưa xác minh qua SDK |
| marketplace | 56 | Chưa cài SDK client; số operation lấy từ docs, chưa xác minh qua SDK |
| globalaccelerator | 39 | Chưa cài SDK client; số operation lấy từ docs, chưa xác minh qua SDK |
| codeartifact | 35 | Chưa cài SDK client; số operation lấy từ docs, chưa xác minh qua SDK |
| verifiedpermissions | 33 | Chưa cài SDK client; số operation lấy từ docs, chưa xác minh qua SDK |
| sagemaker | 31 | Chưa cài SDK client; số operation lấy từ docs, chưa xác minh qua SDK |
| budgets | 26 | Chưa cài SDK client; số operation lấy từ docs, chưa xác minh qua SDK |
| redshift-serverless | 26 | Chưa cài SDK client; số operation lấy từ docs, chưa xác minh qua SDK |
| securityhub | 26 | Chưa cài SDK client; số operation lấy từ docs, chưa xác minh qua SDK |
| timestream-influxdb | 25 | Chưa cài SDK client; số operation lấy từ docs, chưa xác minh qua SDK |
| dms | 21 | Chưa cài SDK client; số operation lấy từ docs, chưa xác minh qua SDK |
| appintegrations | 19 | Chưa cài SDK client; số operation lấy từ docs, chưa xác minh qua SDK |
| identitystore | 19 | Chưa cài SDK client; số operation lấy từ docs, chưa xác minh qua SDK |
| bedrock | 16 | Chưa cài SDK client; số operation lấy từ docs, chưa xác minh qua SDK |
| cognitoidentity | 15 | Chưa cài SDK client; số operation lấy từ docs, chưa xác minh qua SDK |
| detective | 15 | Chưa cài SDK client; số operation lấy từ docs, chưa xác minh qua SDK |
| oam | 15 | Chưa cài SDK client; số operation lấy từ docs, chưa xác minh qua SDK |
| redshift-data | 15 | Chưa cài SDK client; số operation lấy từ docs, chưa xác minh qua SDK |
| macie2 | 14 | Chưa cài SDK client; số operation lấy từ docs, chưa xác minh qua SDK |
| dlm | 8 | Chưa cài SDK client; số operation lấy từ docs, chưa xác minh qua SDK |
| ssoportal | 7 | Chưa cài SDK client; số operation lấy từ docs, chưa xác minh qua SDK |
| inspector2 | 6 | Chưa cài SDK client; số operation lấy từ docs, chưa xác minh qua SDK |
| ssooidc | 6 | Chưa cài SDK client; số operation lấy từ docs, chưa xác minh qua SDK |
| access-analyzer | 5 | Chưa cài SDK client; số operation lấy từ docs, chưa xác minh qua SDK |
| bcm-pricing-calculator | 4 | Chưa cài SDK client; số operation lấy từ docs, chưa xác minh qua SDK |
| controlcatalog | 4 | Chưa cài SDK client; số operation lấy từ docs, chưa xác minh qua SDK |
| account | 3 | Chưa cài SDK client; số operation lấy từ docs, chưa xác minh qua SDK |

Ba service sau **có trang** nhưng gọi Floci qua HTTP trực tiếp (`flociFetch`), không qua AWS SDK, nên script không đo tự động được:

- **amazonmq** (16 operation trong docs Floci) — `AmazonMQDashboard.tsx`
- **lambda-microvms** (24 operation trong docs Floci) — `LambdaMicrovmsDashboard.tsx`
- **s3vectors** (12 operation trong docs Floci) — `S3VectorsDashboard.tsx`

## 4. Chi tiết S3 và EC2

<a id="svc-s3"></a>
<details><summary><b>s3</b> — UI 42/83 (51%), backend 59/83</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Buckets | ListBuckets, CreateBucket, HeadBucket, DeleteBucket, GetBucketLocation |  |  |
| Objects | PutObject, GetObject, GetObjectAttributes, DeleteObject, DeleteObjects | HeadObject, CopyObject |  |
| Listing | ListObjectsV2, ListObjectVersions |  | ListObjects |
| Multipart | ListMultipartUploads | CreateMultipartUpload, UploadPart, CompleteMultipartUpload, AbortMultipartUpload |  |
| Versioning | PutBucketVersioning, GetBucketVersioning |  |  |
| Tagging | PutBucketTagging, GetBucketTagging, PutObjectTagging, GetObjectTagging | DeleteObjectTagging |  |
| Annotations |  |  | PutObjectAnnotation, GetObjectAnnotation, ListObjectAnnotations, DeleteObjectAnnotation |
| Policy | PutBucketPolicy, GetBucketPolicy, DeleteBucketPolicy |  |  |
| CORS | PutBucketCors, GetBucketCors, DeleteBucketCors |  |  |
| Lifecycle | PutBucketLifecycleConfiguration, GetBucketLifecycleConfiguration |  | DeleteBucketLifecycle |
| ACL | PutBucketAcl, GetBucketAcl, GetObjectAcl | PutObjectAcl |  |
| Encryption | PutBucketEncryption, GetBucketEncryption, DeleteBucketEncryption |  |  |
| Notifications | GetBucketNotificationConfiguration | PutBucketNotificationConfiguration |  |
| Object Lock | GetObjectLockConfiguration | PutObjectLockConfiguration, PutObjectRetention, GetObjectRetention, PutObjectLegalHold, GetObjectLegalHold |  |
| Website | PutBucketWebsite, GetBucketWebsite, DeleteBucketWebsite |  |  |
| S3 Select | SelectObjectContent (hiệu chỉnh tay, xem mục 0) |  |  |
| Public Access Block | PutPublicAccessBlock, GetPublicAccessBlock | DeletePublicAccessBlock |  |
| Metrics | GetBucketMetricsConfiguration, ListBucketMetricsConfigurations | PutBucketMetricsConfiguration, DeleteBucketMetricsConfiguration |  |
| Intelligent-Tiering |  |  | PutBucketIntelligentTieringConfiguration, GetBucketIntelligentTieringConfiguration, ListBucketIntelligentTieringConfigurations, DeleteBucketIntelligentTieringConfiguration |
| Analytics |  |  | PutBucketAnalyticsConfiguration, GetBucketAnalyticsConfiguration, ListBucketAnalyticsConfigurations, DeleteBucketAnalyticsConfiguration |
| Inventory |  |  | PutBucketInventoryConfiguration, GetBucketInventoryConfiguration, ListBucketInventoryConfigurations, DeleteBucketInventoryConfiguration |
| Replication |  |  | PutBucketReplication, GetBucketReplication, DeleteBucketReplication |
| Khác |  |  | RestoreObject, UploadPartCopy |

Backend còn gọi các operation không có trong docs Floci: `DeleteBucketTagging`, `GetBucketLogging`, `PutBucketLogging`.

</details>

<a id="svc-ec2"></a>
<details><summary><b>ec2</b> — UI 69/188 (37%), backend 120/188</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Instances | RunInstances, DescribeInstances, TerminateInstances, StartInstances, StopInstances, RebootInstances | DescribeInstanceStatus, ModifyInstanceAttribute | CreateFleet, DescribeInstanceCreditSpecifications, DescribeInstanceAttribute, ModifyInstanceMetadataOptions |
| VPCs | DescribeVpcs, DeleteVpc, DescribeVpcEndpointServices, DescribeVpcEndpoints | ModifyVpcAttribute, DescribeVpcAttribute, DeleteVpcEndpoints, CreateDefaultVpc, AssociateVpcCidrBlock, DisassociateVpcCidrBlock | DescribeVpnGateways, DescribeEgressOnlyInternetGateways |
| Subnets | CreateSubnet, DescribeSubnets, DeleteSubnet | ModifySubnetAttribute |  |
| Security Groups | CreateSecurityGroup, DescribeSecurityGroups, DeleteSecurityGroup, AuthorizeSecurityGroupIngress, GetSecurityGroupsForVpc, DescribeSecurityGroupRules | AuthorizeSecurityGroupEgress, RevokeSecurityGroupIngress, RevokeSecurityGroupEgress, ModifySecurityGroupRules, UpdateSecurityGroupRuleDescriptionsIngress, UpdateSecurityGroupRuleDescriptionsEgress |  |
| Key Pairs | CreateKeyPair, DescribeKeyPairs, DeleteKeyPair, ImportKeyPair |  |  |
| AMIs | DescribeImages | CreateImage, RegisterImage |  |
| Tags | DescribeTags | CreateTags, DeleteTags |  |
| Internet Gateways | CreateInternetGateway, DescribeInternetGateways, DeleteInternetGateway, AttachInternetGateway, DetachInternetGateway |  |  |
| Route Tables | CreateRouteTable, DescribeRouteTables, DeleteRouteTable | AssociateRouteTable, DisassociateRouteTable, CreateRoute, ReplaceRoute, DeleteRoute |  |
| VPC Peering Connections |  |  | CreateVpcPeeringConnection, AcceptVpcPeeringConnection, DescribeVpcPeeringConnections, ModifyVpcPeeringConnectionOptions, DeleteVpcPeeringConnection |
| Network ACLs | CreateNetworkAcl, DescribeNetworkAcls, DeleteNetworkAcl, CreateNetworkAclEntry, DeleteNetworkAclEntry | ReplaceNetworkAclEntry, ReplaceNetworkAclAssociation |  |
| Prefix Lists | DescribePrefixLists, DescribeManagedPrefixLists | GetManagedPrefixListEntries, ModifyManagedPrefixList, DeleteManagedPrefixList | CreateManagedPrefixList |
| Transit Gateways | DescribeTransitGateways | ModifyTransitGateway, DeleteTransitGateway | CreateTransitGateway |
| Transit Gateway VPC Attachments | DescribeTransitGatewayAttachments | CreateTransitGatewayVpcAttachment, DescribeTransitGatewayVpcAttachments, ModifyTransitGatewayVpcAttachment, DeleteTransitGatewayVpcAttachment | DescribeTransitGatewayConnects |
| Transit Gateway Peering Attachments |  |  | CreateTransitGatewayPeeringAttachment, DescribeTransitGatewayPeeringAttachments, AcceptTransitGatewayPeeringAttachment, DeleteTransitGatewayPeeringAttachment |
| Transit Gateway Route Tables | DescribeTransitGatewayRouteTables | CreateTransitGatewayRouteTable, DeleteTransitGatewayRouteTable, AssociateTransitGatewayRouteTable, DisassociateTransitGatewayRouteTable, GetTransitGatewayRouteTableAssociations, EnableTransitGatewayRouteTablePropagation, DisableTransitGatewayRouteTablePropagation, GetTransitGatewayRouteTablePropagations, CreateTransitGatewayRoute, DeleteTransitGatewayRoute, SearchTransitGatewayRoutes | ReplaceTransitGatewayRoute, ExportTransitGatewayRoutes |
| NAT Gateways | CreateNatGateway, DescribeNatGateways, DeleteNatGateway |  |  |
| Capacity Reservations |  |  | CreateCapacityReservation, DescribeCapacityReservations, ModifyCapacityReservation, CancelCapacityReservation |
| Dedicated Hosts |  |  | AllocateHosts, DescribeHosts, ModifyHosts, ReleaseHosts |
| Elastic IPs | AllocateAddress, DescribeAddresses, DescribeAddressesAttribute, ReleaseAddress | AssociateAddress, DisassociateAddress |  |
| Availability Zones & Regions | DescribeAvailabilityZones, DescribeRegions, DescribeAccountAttributes |  |  |
| Instance Types | DescribeInstanceTypes, DescribeInstanceTypeOfferings |  |  |
| Launch Templates | CreateLaunchTemplate, DescribeLaunchTemplates, DeleteLaunchTemplate | CreateLaunchTemplateVersion, DescribeLaunchTemplateVersions, ModifyLaunchTemplate |  |
| Launch template data members |  |  | ModifyVolume |
| IAM Instance Profiles | DescribeIamInstanceProfileAssociations |  | AssociateIamInstanceProfile, ReplaceIamInstanceProfileAssociation, DisassociateIamInstanceProfile |
| Network Interfaces | DescribeNetworkInterfaces |  | CreateNetworkInterface, AttachNetworkInterface, DetachNetworkInterface, DeleteNetworkInterface |
| Volumes | CreateVolume, DescribeVolumes, DeleteVolume |  | DescribeVolumesModifications, AttachVolume, DetachVolume |
| Snapshots |  |  | DescribeSnapshots |
| Flow Logs | CreateFlowLogs, DescribeFlowLogs, DeleteFlowLogs |  |  |
| Spot Instances | RequestSpotInstances, DescribeSpotInstanceRequests, CancelSpotInstanceRequests |  | DescribeSpotPriceHistory |
| EBS Encryption Defaults |  |  | EnableEbsEncryptionByDefault, DisableEbsEncryptionByDefault, GetEbsEncryptionByDefault, ModifyEbsDefaultKmsKeyId, GetEbsDefaultKmsKeyId, ResetEbsDefaultKmsKeyId |
| Snapshot Block Public Access |  |  | EnableSnapshotBlockPublicAccess, DisableSnapshotBlockPublicAccess, GetSnapshotBlockPublicAccessState |
| IPAM |  |  | EnableIpamOrganizationAdminAccount, DisableIpamOrganizationAdminAccount, CreateIpam, DescribeIpams, ModifyIpam, DeleteIpam, CreateIpamPool, DescribeIpamPools, ModifyIpamPool, DeleteIpamPool, ProvisionIpamPoolCidr, GetIpamPoolCidrs, AllocateIpamPoolCidr, ReleaseIpamPoolAllocation, GetIpamPoolAllocations, AssociateIpamByoasn, DisassociateIpamByoasn, DescribeIpamByoasn |

Backend còn gọi các operation không có trong docs Floci: `CreateVpc`, `CreateVpcEndpoint`.

</details>

## 5. Chi tiết từng service còn lại

<a id="svc-acm"></a>
<details><summary><b>acm</b> — UI 4/16 (25%), backend 12/16</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | ListCertificates, DeleteCertificate, ImportCertificate, ExportCertificate | RequestCertificate, DescribeCertificate, GetCertificate, AddTagsToCertificate, ListTagsForCertificate, RemoveTagsFromCertificate, GetAccountConfiguration, PutAccountConfiguration | UpdateCertificateOptions, RevokeCertificate, RenewCertificate, ResendValidationEmail |

</details>

<a id="svc-api-gateway"></a>
<details><summary><b>api-gateway</b> — UI 49/122 (40%), backend 95/122</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| APIs | CreateRestApi, GetRestApi, GetRestApis, DeleteRestApi, GetApis, DeleteApi | ImportRestApi, PutRestApi, CreateApi, GetApi | UpdateRestApi, UpdateApi, DeleteCorsConfiguration, ImportApi, ReimportApi |
| Resources | GetResources, DeleteResource | GetResource, UpdateResource | CreateResource |
| Methods |  | PutMethod, GetMethod, DeleteMethod | UpdateMethod |
| Method Responses |  | PutMethodResponse, GetMethodResponse, DeleteMethodResponse |  |
| Integrations | UpdateIntegration, GetIntegrations | PutIntegration, GetIntegration, DeleteIntegration, CreateIntegration |  |
| Integration Responses | DeleteIntegrationResponse, CreateIntegrationResponse, GetIntegrationResponses | PutIntegrationResponse, GetIntegrationResponse, UpdateIntegrationResponse |  |
| Deployments | CreateDeployment, GetDeployments, UpdateDeployment, DeleteDeployment | GetDeployment |  |
| Stages | CreateStage, GetStages, UpdateStage, DeleteStage | GetStage | FlushStageAuthorizersCache, GetExport |
| Authorizers | CreateAuthorizer, GetAuthorizers, UpdateAuthorizer, DeleteAuthorizer | GetAuthorizer |  |
| API Keys | CreateApiKey, GetApiKeys, DeleteApiKey | ImportApiKeys, GetApiKey, UpdateApiKey |  |
| Usage Plans | CreateUsagePlan, GetUsagePlans, DeleteUsagePlan | GetUsagePlan, UpdateUsagePlan, GetUsage |  |
| Usage Plan Keys |  | CreateUsagePlanKey, GetUsagePlanKeys, DeleteUsagePlanKey | GetUsagePlanKey |
| Request Validators | CreateRequestValidator, GetRequestValidators, DeleteRequestValidator | GetRequestValidator, UpdateRequestValidator |  |
| Gateway Responses |  |  | PutGatewayResponse, GetGatewayResponse, GetGatewayResponses, UpdateGatewayResponse, DeleteGatewayResponse |
| Models | CreateModel, GetModels, UpdateModel, DeleteModel | GetModel |  |
| Domain Names | CreateDomainName, GetDomainNames, DeleteDomainName | GetDomainName, UpdateDomainName |  |
| Base Path Mappings |  | CreateBasePathMapping, GetBasePathMappings, DeleteBasePathMapping | GetBasePathMapping, UpdateBasePathMapping |
| Account |  | GetAccount, UpdateAccount |  |
| Tags | TagResource, UntagResource, GetTags |  |  |
| Routes | GetRoutes, UpdateRoute | CreateRoute, GetRoute, DeleteRoute |  |
| Route Responses | CreateRouteResponse, GetRouteResponses, DeleteRouteResponse | GetRouteResponse, UpdateRouteResponse |  |
| API Mappings |  |  | CreateApiMapping, GetApiMapping, GetApiMappings, UpdateApiMapping, DeleteApiMapping |
| VPC Links |  |  | CreateVpcLink, GetVpcLink, GetVpcLinks, UpdateVpcLink, DeleteVpcLink |

</details>

<a id="svc-appconfig"></a>
<details><summary><b>appconfig</b> — UI 10/25 (40%), backend 12/25</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | ListApplications, DeleteApplication, CreateEnvironment, ListEnvironments, DeleteEnvironment, CreateConfigurationProfile, ListConfigurationProfiles, DeleteConfigurationProfile, StartConfigurationSession, GetLatestConfiguration | CreateApplication, GetApplication | GetEnvironment, GetConfigurationProfile, CreateHostedConfigurationVersion, GetHostedConfigurationVersion, DeleteHostedConfigurationVersion, CreateDeploymentStrategy, GetDeploymentStrategy, ListDeploymentStrategies, DeleteDeploymentStrategy, StartDeployment, GetDeployment, ListDeployments, GetConfiguration |

Backend còn gọi các operation không có trong docs Floci: `ListHostedConfigurationVersions`.

</details>

<a id="svc-applicationautoscaling"></a>
<details><summary><b>applicationautoscaling</b> — UI 6/10 (60%), backend 9/10</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | RegisterScalableTarget, DescribeScalableTargets, DeregisterScalableTarget, PutScalingPolicy, DescribeScalingPolicies, DeleteScalingPolicy | ListTagsForResource, TagResource, UntagResource | DescribeScalingActivities |

</details>

<a id="svc-appsync"></a>
<details><summary><b>appsync</b> — UI 17/49 (35%), backend 38/49</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| GraphQL API | CreateGraphqlApi, GetGraphqlApi, DeleteGraphqlApi, ListGraphqlApis |  | UpdateGraphqlApi |
| Schema |  | StartSchemaCreation, GetSchemaCreationStatus, GetIntrospectionSchema |  |
| Data Sources | CreateDataSource, DeleteDataSource, ListDataSources | GetDataSource, UpdateDataSource |  |
| Resolvers | CreateResolver, DeleteResolver, ListResolvers | GetResolver, UpdateResolver | ListResolversByFunction |
| Functions | CreateFunction, DeleteFunction, ListFunctions | GetFunction | UpdateFunction |
| Types | ListTypes |  | CreateType, GetType, UpdateType, DeleteType |
| API Keys | CreateApiKey, DeleteApiKey, ListApiKeys | UpdateApiKey |  |
| Tags |  | TagResource, UntagResource, ListTagsForResource |  |
| Domain Names |  | CreateDomainName, GetDomainName, ListDomainNames, DeleteDomainName | UpdateDomainName, AssociateApi, DisassociateApi |
| Channel Namespaces |  | CreateChannelNamespace, GetChannelNamespace, ListChannelNamespaces, DeleteChannelNamespace | UpdateChannelNamespace |
| Merged API Associations |  | GetApiAssociation |  |

Backend còn gọi các operation không có trong docs Floci: `PutGraphqlApiEnvironmentVariables`, `GetGraphqlApiEnvironmentVariables`.

</details>

<a id="svc-athena"></a>
<details><summary><b>athena</b> — UI 13/21 (62%), backend 14/21</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | StartQueryExecution, GetQueryExecution, GetQueryResults, ListQueryExecutions, StopQueryExecution, GetWorkGroup, ListWorkGroups, CreateWorkGroup, ListDataCatalogs, ListDatabases, ListTableMetadata, GetTableMetadata, DeleteWorkGroup | GetDataCatalog | UpdateWorkGroup, CreateDataCatalog, UpdateDataCatalog, DeleteDataCatalog, TagResource, UntagResource, ListTagsForResource |

</details>

<a id="svc-autoscaling"></a>
<details><summary><b>autoscaling</b> — UI 28/46 (61%), backend 32/46</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Launch Configurations | CreateLaunchConfiguration, DescribeLaunchConfigurations, DeleteLaunchConfiguration |  |  |
| Auto Scaling Groups | DescribeAutoScalingGroups, DeleteAutoScalingGroup | CreateAutoScalingGroup, UpdateAutoScalingGroup | EnableMetricsCollection, DisableMetricsCollection |
| Instance Management | DescribeAutoScalingInstances, AttachInstances, DetachInstances, TerminateInstanceInAutoScalingGroup | SetDesiredCapacity | SuspendProcesses, ResumeProcesses |
| Load Balancer Attachment | AttachLoadBalancerTargetGroups, DetachLoadBalancerTargetGroups, DescribeLoadBalancerTargetGroups, AttachLoadBalancers, DetachLoadBalancers, DescribeLoadBalancers |  |  |
| Traffic Sources |  |  | AttachTrafficSources, DetachTrafficSources, DescribeTrafficSources |
| Lifecycle Hooks | PutLifecycleHook, DescribeLifecycleHooks, DeleteLifecycleHook, CompleteLifecycleAction |  | RecordLifecycleActionHeartbeat |
| Scaling Policies | PutScalingPolicy, DescribePolicies, DeletePolicy |  |  |
| Scheduled Actions |  |  | PutScheduledUpdateGroupAction, DescribeScheduledActions, DeleteScheduledAction |
| Warm Pools |  |  | PutWarmPool, DescribeWarmPool, DeleteWarmPool |
| Activities |  | DescribeScalingActivities |  |
| Metadata | DescribeTerminationPolicyTypes, DescribeAccountLimits, DescribeLifecycleHookTypes, DescribeAdjustmentTypes, DescribeMetricCollectionTypes, DescribeAutoScalingNotificationTypes |  |  |

Backend còn gọi các operation không có trong docs Floci: `StartInstanceRefresh`, `DescribeInstanceRefreshes`, `CreateOrUpdateTags`, `DeleteTags`.

</details>

<a id="svc-backup"></a>
<details><summary><b>backup</b> — UI 11/41 (27%), backend 23/41</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Backup Vaults | CreateBackupVault, DeleteBackupVault, ListBackupVaults | DescribeBackupVault |  |
| Backup Vault Access Policy |  |  | PutBackupVaultAccessPolicy, GetBackupVaultAccessPolicy, DeleteBackupVaultAccessPolicy |
| Backup Vault Notifications |  |  | PutBackupVaultNotifications, GetBackupVaultNotifications, DeleteBackupVaultNotifications |
| Backup Vault Lock |  |  | PutBackupVaultLockConfiguration, DeleteBackupVaultLockConfiguration |
| Backup Plans | CreateBackupPlan, DeleteBackupPlan, ListBackupPlans | GetBackupPlan, UpdateBackupPlan |  |
| Backup Selections | ListBackupSelections | CreateBackupSelection, GetBackupSelection, DeleteBackupSelection |  |
| Backup Jobs | StopBackupJob, ListBackupJobs | StartBackupJob, DescribeBackupJob |  |
| Recovery Points | ListRecoveryPointsByBackupVault, DeleteRecoveryPoint | DescribeRecoveryPoint |  |
| Tagging |  | ListTags, TagResource, UntagResource |  |
| Other |  |  | GetSupportedResourceTypes |
| Khác |  |  | StartRestoreJob, DescribeRestoreJob, ListRestoreJobs, StartCopyJob, DescribeCopyJob, ListCopyJobs, CreateReportPlan, DescribeReportPlan, CreateFramework |

</details>

<a id="svc-batch"></a>
<details><summary><b>batch</b> — UI 10/19 (53%), backend 13/19</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | CreateComputeEnvironment, DescribeComputeEnvironments, DeleteComputeEnvironment, CreateJobQueue, DeleteJobQueue, DescribeJobQueues, RegisterJobDefinition, DeregisterJobDefinition, DescribeJobDefinitions, SubmitJob | TerminateJob, DescribeJobs, ListJobs | UpdateComputeEnvironment, UpdateJobQueue, CancelJob, ListTagsForResource, TagResource, UntagResource |

</details>

<a id="svc-bcm-data-exports"></a>
<details><summary><b>bcm-data-exports</b> — UI 4/7 (57%), backend 6/7</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | CreateExport, ListExports, DeleteExport, ListExecutions | GetExport, UpdateExport | GetExecution |

Backend còn gọi các operation không có trong docs Floci: `ListTables`, `ListTagsForResource`, `TagResource`, `UntagResource`.

</details>

<a id="svc-bedrock-agentcore"></a>
<details><summary><b>bedrock-agentcore</b> — UI 4/65 (6%), backend 5/65</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | CreateAgentRuntime, ListAgentRuntimes, GetAgentRuntime, DeleteAgentRuntime | UpdateAgentRuntime | ListAgentRuntimeVersions, CreateAgentRuntimeEndpoint, GetAgentRuntimeEndpoint, UpdateAgentRuntimeEndpoint, DeleteAgentRuntimeEndpoint, ListAgentRuntimeEndpoints, CreateWorkloadIdentity, GetWorkloadIdentity, UpdateWorkloadIdentity, DeleteWorkloadIdentity, ListWorkloadIdentities, CreateApiKeyCredentialProvider, GetApiKeyCredentialProvider, ListApiKeyCredentialProviders, UpdateApiKeyCredentialProvider, DeleteApiKeyCredentialProvider, CreateOauth2CredentialProvider, GetOauth2CredentialProvider, ListOauth2CredentialProviders, UpdateOauth2CredentialProvider, DeleteOauth2CredentialProvider, CreateGateway, GetGateway, UpdateGateway, DeleteGateway, ListGateways, CreateGatewayTarget, GetGatewayTarget, UpdateGatewayTarget, DeleteGatewayTarget, ListGatewayTargets, CreateMemory, GetMemory, UpdateMemory, DeleteMemory, ListMemories, CreateEvent, ListEvents, GetEvent, DeleteEvent, CreateBrowser, GetCodeInterpreter, DeleteCodeInterpreter, ListCodeInterpreters, CreateCodeInterpreter, CreateBrowserProfile, ListBrowserProfiles, DeleteBrowserProfile, GetBrowserProfile, GetBrowser, DeleteBrowser, ListBrowsers, CreateGatewayRule, GetGatewayRule, ListGatewayRules, UpdateGatewayRule, DeleteGatewayRule, GetResourcePolicy, PutResourcePolicy, DeleteResourcePolicy |

Backend còn gọi các operation không có trong docs Floci: `InvokeAgentRuntime`.

</details>

<a id="svc-bedrock-runtime"></a>
<details><summary><b>bedrock-runtime</b> — UI 0/3 (0%), backend 2/3</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác |  | Converse, InvokeModel | ConverseStream |

</details>

<a id="svc-ce"></a>
<details><summary><b>ce</b> — UI 9/20 (45%), backend 9/20</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | GetCostAndUsage, GetCostAndUsageWithResources, GetDimensionValues, GetTags, GetReservationCoverage, GetReservationUtilization, GetSavingsPlansCoverage, GetSavingsPlansUtilization, GetCostCategories |  | CreateAnomalyMonitor, GetAnomalyMonitors, UpdateAnomalyMonitor, DeleteAnomalyMonitor, CreateAnomalySubscription, GetAnomalySubscriptions, UpdateAnomalySubscription, DeleteAnomalySubscription, ListTagsForResource, TagResource, UntagResource |

</details>

<a id="svc-cloudcontrol"></a>
<details><summary><b>cloudcontrol</b> — UI 5/5 (100%), backend 5/5</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | CreateResource, DeleteResource, GetResource, ListResources, GetResourceRequestStatus |  |  |

</details>

<a id="svc-cloudformation"></a>
<details><summary><b>cloudformation</b> — UI 25/36 (69%), backend 26/36</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | DescribeStacks, CreateStack, DeleteStack, CreateChangeSet, DescribeChangeSet, ExecuteChangeSet, DeleteChangeSet, ListChangeSets, DescribeStackEvents, ListStackResources, GetTemplate, ValidateTemplate, ListStacks, ListExports, SetStackPolicy, GetStackPolicy, DescribeStackResource, CreateStackSet, DescribeStackSet, ListStackSets, DeleteStackSet, CreateStackInstances, ListStackInstances, DeleteStackInstances, ListStackSetOperations | UpdateStack | ContinueUpdateRollback, UpdateTerminationProtection, DescribeStackResources, GetTemplateSummary, DescribeOrganizationsAccess, ActivateOrganizationsAccess, UpdateStackSet, DescribeStackInstance, DescribeStackSetOperation, ListStackSetAutoDeploymentTargets |

</details>

<a id="svc-cloudfront"></a>
<details><summary><b>cloudfront</b> — UI 5/63 (8%), backend 42/63</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Distributions | ListDistributions | CreateDistribution, CreateDistributionWithTags, GetDistribution, GetDistributionConfig, UpdateDistribution, DeleteDistribution, AssociateAlias |  |
| Invalidations | CreateInvalidation, ListInvalidations | GetInvalidation |  |
| Cache Policies | ListCachePolicies |  | CreateCachePolicy, GetCachePolicy, GetCachePolicyConfig, UpdateCachePolicy, DeleteCachePolicy |
| Origin Request Policies |  |  | CreateOriginRequestPolicy, GetOriginRequestPolicy, GetOriginRequestPolicyConfig, UpdateOriginRequestPolicy, DeleteOriginRequestPolicy, ListOriginRequestPolicies |
| Response Headers Policies |  |  | CreateResponseHeadersPolicy, GetResponseHeadersPolicy, GetResponseHeadersPolicyConfig, UpdateResponseHeadersPolicy, DeleteResponseHeadersPolicy, ListResponseHeadersPolicies |
| Origin Access Control (OAC) |  | CreateOriginAccessControl, GetOriginAccessControl, UpdateOriginAccessControl, DeleteOriginAccessControl, ListOriginAccessControls | GetOriginAccessControlConfig |
| Origin Access Identity (OAI — legacy) |  | CreateCloudFrontOriginAccessIdentity, GetCloudFrontOriginAccessIdentity, UpdateCloudFrontOriginAccessIdentity, DeleteCloudFrontOriginAccessIdentity, ListCloudFrontOriginAccessIdentities | GetCloudFrontOriginAccessIdentityConfig |
| CloudFront Functions | ListFunctions | CreateFunction, GetFunction, DescribeFunction, UpdateFunction, PublishFunction, DeleteFunction |  |
| Public Keys and Key Groups |  | CreatePublicKey, GetPublicKey, UpdatePublicKey, DeletePublicKey, ListPublicKeys, CreateKeyGroup, GetKeyGroup, UpdateKeyGroup, DeleteKeyGroup, ListKeyGroups | GetPublicKeyConfig, GetKeyGroupConfig |
| Tagging |  | ListTagsForResource, TagResource, UntagResource |  |

</details>

<a id="svc-cloudhsmv2"></a>
<details><summary><b>cloudhsmv2</b> — UI 5/18 (28%), backend 5/18</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | CreateCluster, DescribeClusters, DeleteCluster, DescribeBackups, DeleteBackup |  | ModifyCluster, InitializeCluster, CreateHsm, DeleteHsm, RestoreBackup, ModifyBackupAttributes, CopyBackupToRegion, PutResourcePolicy, GetResourcePolicy, DeleteResourcePolicy, TagResource, UntagResource, ListTags |

</details>

<a id="svc-cloudmap"></a>
<details><summary><b>cloudmap</b> — UI 15/22 (68%), backend 22/22</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | CreateHttpNamespace, CreatePublicDnsNamespace, CreatePrivateDnsNamespace, ListNamespaces, DeleteNamespace, ListServices, DeleteService, RegisterInstance, DeregisterInstance, GetInstance, ListInstances, GetInstancesHealthStatus, DiscoverInstancesRevision, GetOperation, ListOperations | GetNamespace, CreateService, GetService, DiscoverInstances, TagResource, UntagResource, ListTagsForResource |  |

</details>

<a id="svc-cloudtrail"></a>
<details><summary><b>cloudtrail</b> — UI 7/14 (50%), backend 10/14</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | DescribeTrails, DeleteTrail, PutEventSelectors, GetEventSelectors, StartLogging, StopLogging, LookupEvents | CreateTrail, UpdateTrail, GetTrailStatus | ListTrails, AddTags, RemoveTags, ListTags |

</details>

<a id="svc-cloudwatch"></a>
<details><summary><b>cloudwatch</b> — UI 24/55 (44%), backend 29/55</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | CreateLogGroup, DeleteLogGroup, DescribeLogGroups, CreateLogStream, DeleteLogStream, DescribeLogStreams, GetLogEvents, FilterLogEvents, PutRetentionPolicy, DeleteRetentionPolicy, TagLogGroup, UntagLogGroup, ListTagsLogGroup, PutSubscriptionFilter, DescribeSubscriptionFilters, DeleteSubscriptionFilter, GetDataProtectionPolicy, PutMetricData, ListMetrics, GetMetricStatistics, PutMetricAlarm, DescribeAlarms, DeleteAlarms, SetAlarmState | PutLogEvents, TagResource, UntagResource, ListTagsForResource, GetMetricData | PutLogGroupDeletionProtection, AssociateKmsKey, DisassociateKmsKey, PutMetricFilter, DescribeMetricFilters, DeleteMetricFilter, TestMetricFilter, PutResourcePolicy, DescribeResourcePolicies, PutDestination, PutDestinationPolicy, PutAccountPolicy, DescribeAccountPolicies, StartQuery, GetQueryResults, StopQuery, PutMetricStream, GetMetricStream, ListMetricStreams, DeleteMetricStream, StartMetricStreams, StopMetricStreams, PutDashboard, GetDashboard, ListDashboards, DeleteDashboards |

</details>

<a id="svc-codebuild"></a>
<details><summary><b>codebuild</b> — UI 14/20 (70%), backend 20/20</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Projects | CreateProject, UpdateProject, DeleteProject, BatchGetProjects, ListProjects |  |  |
| Build Execution | StartBuild, BatchGetBuilds, ListBuilds, RetryBuild | ListBuildsForProject, StopBuild |  |
| Report Groups | CreateReportGroup, DeleteReportGroup, ListReportGroups | UpdateReportGroup, BatchGetReportGroups |  |
| Source Credentials | ListSourceCredentials | ImportSourceCredentials, DeleteSourceCredentials |  |
| Images | ListCuratedEnvironmentImages |  |  |

</details>

<a id="svc-codedeploy"></a>
<details><summary><b>codedeploy</b> — UI 18/29 (62%), backend 29/29</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Applications | CreateApplication, DeleteApplication, ListApplications, BatchGetApplications | GetApplication, UpdateApplication |  |
| Deployment Groups | CreateDeploymentGroup, ListDeploymentGroups, BatchGetDeploymentGroups | GetDeploymentGroup, UpdateDeploymentGroup, DeleteDeploymentGroup |  |
| Deployment Configs | ListDeploymentConfigs | GetDeploymentConfig, DeleteDeploymentConfig |  |
| Deployment Execution | CreateDeployment, StopDeployment, ContinueDeployment, ListDeployments, BatchGetDeployments, ListDeploymentTargets, BatchGetDeploymentTargets, PutLifecycleEventHookExecutionStatus | GetDeployment |  |
| Tagging |  | TagResource, UntagResource, ListTagsForResource |  |
| On-Premises (no-op) | AddTagsToOnPremisesInstances, RemoveTagsFromOnPremisesInstances |  |  |

Backend còn gọi các operation không có trong docs Floci: `CreateDeploymentConfig`, `ListOnPremisesInstances`, `BatchGetOnPremisesInstances`, `RegisterOnPremisesInstance`, `GetOnPremisesInstance`, `DeregisterOnPremisesInstance`.

</details>

<a id="svc-codegurureviewer"></a>
<details><summary><b>codegurureviewer</b> — UI 5/7 (71%), backend 7/7</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | AssociateRepository, DisassociateRepository, ListRepositoryAssociations, TagResource, UntagResource | DescribeRepositoryAssociation, ListTagsForResource |  |

</details>

<a id="svc-cognito"></a>
<details><summary><b>cognito</b> — UI 34/76 (45%), backend 50/76</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| User Pools | ListUserPools, UpdateUserPool, DeleteUserPool, GetUserPoolMfaConfig, AddCustomAttributes | CreateUserPool, DescribeUserPool |  |
| User Pool Tags | TagResource, UntagResource, ListTagsForResource |  |  |
| User Pool Clients | ListUserPoolClients, UpdateUserPoolClient, AddUserPoolClientSecret, ListUserPoolClientSecrets, DeleteUserPoolClientSecret | CreateUserPoolClient, DescribeUserPoolClient, DeleteUserPoolClient |  |
| Resource Servers | CreateResourceServer, ListResourceServers, DeleteResourceServer | DescribeResourceServer, UpdateResourceServer |  |
| Identity Providers |  |  | CreateIdentityProvider, DescribeIdentityProvider, ListIdentityProviders, UpdateIdentityProvider, DeleteIdentityProvider |
| User Pool Domains |  |  | CreateUserPoolDomain, DescribeUserPoolDomain, UpdateUserPoolDomain, DeleteUserPoolDomain |
| Log Delivery |  |  | SetLogDeliveryConfiguration, GetLogDeliveryConfiguration |
| Admin User Management | AdminGetUser, AdminResetUserPassword, ForgotPassword, ConfirmForgotPassword | AdminCreateUser, AdminDeleteUser, AdminSetUserPassword, AdminUpdateUserAttributes, AdminDeleteUserAttributes, AdminConfirmSignUp, AdminDisableUser, AdminEnableUser, AdminUserGlobalSignOut | AdminSetUserMFAPreference, AdminLinkProviderForUser |
| AdminCreateUser invitations | SignUp |  |  |
| User Operations | ConfirmSignUp, GetUser, UpdateUserAttributes, DeleteUserAttributes, ChangePassword, GlobalSignOut, InitiateAuth |  | ResendConfirmationCode, GetUserAuthFactors, VerifySoftwareToken, SetUserMFAPreference, GetUserAttributeVerificationCode, VerifyUserAttribute, DeleteUser, StartWebAuthnRegistration, CompleteWebAuthnRegistration, ListWebAuthnCredentials, DeleteWebAuthnCredential, AssociateSoftwareToken |
| Authentication | AdminInitiateAuth, RespondToAuthChallenge, AdminRespondToAuthChallenge, RevokeToken |  | GetTokensFromRefreshToken |
| Passkeys | SetUserPoolMfaConfig |  |  |
| User Listing | ListUsers |  |  |

Backend còn gọi các operation không có trong docs Floci: `ListGroups`, `CreateGroup`, `DeleteGroup`, `AdminListGroupsForUser`, `ListUsersInGroup`, `AdminRemoveUserFromGroup`, `AdminAddUserToGroup`, `GetGroup`, `UpdateGroup`.

</details>

<a id="svc-comprehend"></a>
<details><summary><b>comprehend</b> — UI 5/5 (100%), backend 5/5</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | DetectSentiment, DetectKeyPhrases, DetectDominantLanguage, DetectPiiEntities, ContainsPiiEntities |  |  |

</details>

<a id="svc-config"></a>
<details><summary><b>config</b> — UI 13/36 (36%), backend 20/36</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Config Rules | DeleteConfigRule, DescribeConfigRules, DescribeConfigRuleEvaluationStatus, StartConfigRulesEvaluation | PutConfigRule |  |
| Compliance & Evaluations | DescribeComplianceByConfigRule |  | PutEvaluations, PutExternalEvaluation, DeleteEvaluationResults, DescribeComplianceByResource, GetComplianceDetailsByConfigRule, GetComplianceDetailsByResource, GetComplianceSummaryByConfigRule, GetComplianceSummaryByResourceType |
| Configuration Recorder | DescribeConfigurationRecorders, DescribeConfigurationRecorderStatus | PutConfigurationRecorder, StartConfigurationRecorder, StopConfigurationRecorder | DeleteConfigurationRecorder |
| Delivery Channel |  | PutDeliveryChannel, DescribeDeliveryChannels | DeleteDeliveryChannel |
| Retention Configuration |  |  | PutRetentionConfiguration, DescribeRetentionConfigurations, DeleteRetentionConfiguration |
| Conformance Packs | DeleteConformancePack, DescribeConformancePacks, DescribeConformancePackStatus | PutConformancePack |  |
| Aggregation Authorizations |  |  | PutAggregationAuthorization, DescribeAggregationAuthorizations, DeleteAggregationAuthorization |
| Tagging | TagResource, UntagResource, ListTagsForResource |  |  |

</details>

<a id="svc-connect"></a>
<details><summary><b>connect</b> — UI 8/15 (53%), backend 12/15</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | CreateInstance, DeleteInstance, ListInstances, UpdateInstanceAttribute, ListInstanceAttributes, AssociateInstanceStorageConfig, DisassociateInstanceStorageConfig, ListInstanceStorageConfigs | DescribeInstance, DescribeInstanceAttribute, DescribeInstanceStorageConfig, UpdateInstanceStorageConfig | ListTagsForResource, TagResource, UntagResource |

</details>

<a id="svc-controltower"></a>
<details><summary><b>controltower</b> — UI 15/21 (71%), backend 15/21</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | ListLandingZones, GetLandingZone, CreateLandingZone, UpdateLandingZone, DeleteLandingZone, ResetLandingZone, GetLandingZoneOperation, ListLandingZoneOperations, ListBaselines, ListEnabledBaselines, GetEnabledBaseline, EnableBaseline, ResetEnabledBaseline, UpdateEnabledBaseline, GetBaselineOperation |  | EnableControl, ListEnabledControls, GetEnabledControl, UpdateEnabledControl, ResetEnabledControl, GetControlOperation |

</details>

<a id="svc-cur"></a>
<details><summary><b>cur</b> — UI 2/7 (29%), backend 7/7</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | PutReportDefinition, DescribeReportDefinitions | ModifyReportDefinition, DeleteReportDefinition, TagResource, UntagResource, ListTagsForResource |  |

</details>

<a id="svc-docdb"></a>
<details><summary><b>docdb</b> — UI 6/13 (46%), backend 8/13</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | CreateDBCluster, DescribeDBClusters, DeleteDBCluster, CreateDBInstance, DescribeDBInstances, DeleteDBInstance | ModifyDBCluster, ModifyDBInstance | DescribeDBClusterSnapshots, DescribeGlobalClusters, ListTagsForResource, AddTagsToResource, RemoveTagsFromResource |

</details>

<a id="svc-dynamodb"></a>
<details><summary><b>dynamodb</b> — UI 22/35 (63%), backend 28/35</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | CreateTable, DeleteTable, DescribeTable, ListTables, UpdateTable, PutItem, DeleteItem, Query, Scan, DescribeTimeToLive, UpdateTimeToLive, TagResource, UntagResource, ListTagsOfResource, DescribeContinuousBackups, UpdateContinuousBackups, DescribeKinesisStreamingDestination, EnableKinesisStreamingDestination, DisableKinesisStreamingDestination, ExportTableToPointInTime, DescribeExport, ListExports | GetItem, UpdateItem, BatchWriteItem, BatchGetItem, TransactWriteItems, TransactGetItems | CreateGlobalTable, DescribeGlobalTable, UpdateGlobalTable, ListGlobalTables, ImportTable, DescribeImport, ListImports |

Backend còn gọi các operation không có trong docs Floci: `ExecuteStatement`, `ExecuteTransaction`, `BatchExecuteStatement`, `ListStreams`, `DescribeStream`, `GetShardIterator`, `GetRecords`.

</details>

<a id="svc-ecr"></a>
<details><summary><b>ecr</b> — UI 7/24 (29%), backend 18/24</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | CreateRepository, DescribeRepositories, DeleteRepository, GetAuthorizationToken, BatchGetImage, PutImageTagMutability, BatchGetRepositoryScanningConfiguration | ListImages, DescribeImages, BatchDeleteImage, TagResource, UntagResource, ListTagsForResource, PutLifecyclePolicy, GetLifecyclePolicy, SetRepositoryPolicy, GetRepositoryPolicy, DeleteRepositoryPolicy | CreatePullThroughCacheRule, DescribePullThroughCacheRules, UpdatePullThroughCacheRule, ValidatePullThroughCacheRule, DeletePullThroughCacheRule, DeleteLifecyclePolicy |

</details>

<a id="svc-ecs"></a>
<details><summary><b>ecs</b> — UI 38/59 (64%), backend 51/59</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Clusters | CreateCluster, DescribeClusters, ListClusters, DeleteCluster, DescribeServices, DescribeTasks | UpdateCluster, PutClusterCapacityProviders | UpdateClusterSettings |
| Task Definitions | ListTaskDefinitions, ListTaskDefinitionFamilies, RunTask, CreateService, StopTask | RegisterTaskDefinition, DescribeTaskDefinition, DeregisterTaskDefinition, UpdateService | DeleteTaskDefinitions |
| Tasks | StartTask, ListTasks, UpdateTaskProtection, GetTaskProtection |  | ExecuteCommand |
| Fargate | DescribeTaskSets |  |  |
| Services | DeleteService, ListServices |  | ListServicesByNamespace |
| Service deployments |  | DescribeServiceDeployments |  |
| ECS EventBridge events |  |  | SubmitTaskStateChange, SubmitContainerStateChange |
| Task Sets | CreateTaskSet, DeleteTaskSet, UpdateServicePrimaryTaskSet | UpdateTaskSet |  |
| Container Instances | DeregisterContainerInstance, DescribeContainerInstances, ListContainerInstances, UpdateContainerAgent, UpdateContainerInstancesState |  | RegisterContainerInstance |
| Capacity Providers | CreateCapacityProvider, DeleteCapacityProvider, DescribeCapacityProviders | UpdateCapacityProvider |  |
| Service Deployments & Revisions | ListServiceDeployments, DescribeServiceRevisions |  |  |
| Tags | ListTagsForResource | TagResource, UntagResource |  |
| Account Settings & Attributes | PutAccountSetting, PutAccountSettingDefault, DeleteAccountSetting, ListAccountSettings, ListAttributes | PutAttributes, DeleteAttributes |  |
| Agent / State Change Stubs | DiscoverPollEndpoint |  | SubmitAttachmentStateChanges |

</details>

<a id="svc-efs"></a>
<details><summary><b>efs</b> — UI 12/26 (46%), backend 26/26</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | CreateFileSystem, DescribeFileSystems, DeleteFileSystem, CreateTags, DescribeTags, DeleteTags, CreateMountTarget, DescribeMountTargets, DeleteMountTarget, CreateAccessPoint, DescribeAccessPoints, DeleteAccessPoint | UpdateFileSystem, UpdateFileSystemProtection, TagResource, UntagResource, ListTagsForResource, DescribeMountTargetSecurityGroups, ModifyMountTargetSecurityGroups, PutFileSystemPolicy, DescribeFileSystemPolicy, DeleteFileSystemPolicy, PutBackupPolicy, DescribeBackupPolicy, PutLifecycleConfiguration, DescribeLifecycleConfiguration |  |

</details>

<a id="svc-eks"></a>
<details><summary><b>eks</b> — UI 8/31 (26%), backend 26/31</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | CreateCluster, DescribeCluster, ListClusters, DeleteCluster, CreateNodegroup, DescribeNodegroup, ListNodegroups, DeleteNodegroup | CreateAccessEntry, DescribeAccessEntry, ListAccessEntries, DeleteAccessEntry, CreatePodIdentityAssociation, DescribePodIdentityAssociation, ListPodIdentityAssociations, UpdatePodIdentityAssociation, DeletePodIdentityAssociation, CreateAddon, DescribeAddon, ListAddons, UpdateAddon, DeleteAddon, CreateFargateProfile, DescribeFargateProfile, ListFargateProfiles, DeleteFargateProfile | DescribeUpdate, DescribeAddonVersions, TagResource, UntagResource, ListTagsForResource |

Backend còn gọi các operation không có trong docs Floci: `ListIdentityProviderConfigs`, `DescribeIdentityProviderConfig`, `AssociateIdentityProviderConfig`, `DisassociateIdentityProviderConfig`.

</details>

<a id="svc-elastic-beanstalk"></a>
<details><summary><b>elastic-beanstalk</b> — UI 10/14 (71%), backend 14/14</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | CreateApplication, DescribeApplications, DeleteApplication, CreateApplicationVersion, DescribeApplicationVersions, DeleteApplicationVersion, CreateEnvironment, DescribeEnvironments, TerminateEnvironment, DescribeConfigurationSettings | UpdateApplication, UpdateEnvironment, CheckDNSAvailability, ListAvailableSolutionStacks |  |

</details>

<a id="svc-elasticache"></a>
<details><summary><b>elasticache</b> — UI 9/28 (32%), backend 10/28</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | CreateReplicationGroup, DescribeReplicationGroups, DeleteReplicationGroup, CreateUser, DescribeUsers, DeleteUser, CreateCacheCluster, DescribeCacheClusters, DeleteCacheCluster | ModifyUser | CreateUserGroup, DescribeUserGroups, ModifyUserGroup, DeleteUserGroup, CreateServerlessCache, DescribeServerlessCaches, ModifyServerlessCache, DeleteServerlessCache, CreateCacheSubnetGroup, DescribeCacheSubnetGroups, ModifyCacheSubnetGroup, DeleteCacheSubnetGroup, CreateCacheParameterGroup, DescribeCacheParameterGroups, ModifyCacheParameterGroup, DescribeCacheParameters, DeleteCacheParameterGroup, ListTagsForResource |

Backend còn gọi các operation không có trong docs Floci: `ModifyReplicationGroup`.

</details>

<a id="svc-elb"></a>
<details><summary><b>elb</b> — UI 28/37 (76%), backend 37/37</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Load Balancers | CreateLoadBalancer, DescribeLoadBalancers, DeleteLoadBalancer, DescribeCapacityReservation, SetSecurityGroups, SetSubnets, SetIpAddressType | ModifyLoadBalancerAttributes, DescribeLoadBalancerAttributes |  |
| Target Groups | CreateTargetGroup, DescribeTargetGroups, ModifyTargetGroup, DeleteTargetGroup, ModifyTargetGroupAttributes, DescribeTargetGroupAttributes |  |  |
| Targets |  | RegisterTargets, DeregisterTargets, DescribeTargetHealth |  |
| Listeners | DescribeListeners, ModifyListener, ModifyListenerAttributes, DescribeListenerAttributes, AddListenerCertificates, RemoveListenerCertificates, DescribeListenerCertificates | CreateListener, DeleteListener |  |
| Rules | CreateRule, DescribeRules, ModifyRule, DeleteRule, SetRulePriorities |  |  |
| Tags | DescribeTags | AddTags, RemoveTags |  |
| Metadata | DescribeSSLPolicies, DescribeAccountLimits |  |  |

</details>

<a id="svc-elb-classic"></a>
<details><summary><b>elb-classic</b> — UI 17/19 (89%), backend 19/19</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | CreateLoadBalancer, DescribeLoadBalancers, DeleteLoadBalancer, DeleteLoadBalancerListeners, ConfigureHealthCheck, RegisterInstancesWithLoadBalancer, DeregisterInstancesFromLoadBalancer, DescribeInstanceHealth, ApplySecurityGroupsToLoadBalancer, AttachLoadBalancerToSubnets, DetachLoadBalancerFromSubnets, EnableAvailabilityZonesForLoadBalancer, DisableAvailabilityZonesForLoadBalancer, AddTags, RemoveTags, DescribeTags, DescribeAccountLimits | ModifyLoadBalancerAttributes, DescribeLoadBalancerAttributes |  |

Backend còn gọi các operation không có trong docs Floci: `CreateLoadBalancerListeners`.

</details>

<a id="svc-emr"></a>
<details><summary><b>emr</b> — UI 8/37 (22%), backend 21/37</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | RunJobFlow, ListClusters, TerminateJobFlows, ListSteps, ListInstanceGroups, CreateSecurityConfiguration, DeleteSecurityConfiguration, ListSecurityConfigurations | DescribeCluster, SetTerminationProtection, ModifyCluster, AddJobFlowSteps, DescribeStep, CancelSteps, AddInstanceGroups, AddInstanceFleet, ListInstanceFleets, ListInstances, DescribeSecurityConfiguration, AddTags, RemoveTags | SetVisibleToAllUsers, SetKeepJobFlowAliveWhenNoSteps, SetUnhealthyNodeReplacement, ModifyInstanceGroups, ModifyInstanceFleet, ListBootstrapActions, PutManagedScalingPolicy, GetManagedScalingPolicy, RemoveManagedScalingPolicy, PutAutoTerminationPolicy, GetAutoTerminationPolicy, RemoveAutoTerminationPolicy, PutAutoScalingPolicy, RemoveAutoScalingPolicy, GetBlockPublicAccessConfiguration, PutBlockPublicAccessConfiguration |

</details>

<a id="svc-emr-serverless"></a>
<details><summary><b>emr-serverless</b> — UI 7/10 (70%), backend 7/10</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | CreateApplication, ListApplications, GetApplication, UpdateApplication, DeleteApplication, StartApplication, StopApplication |  | TagResource, UntagResource, ListTagsForResource |

</details>

<a id="svc-eventbridge"></a>
<details><summary><b>eventbridge</b> — UI 28/40 (70%), backend 29/40</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | CreateEventBus, DeleteEventBus, DescribeEventBus, UpdateEventBus, ListEventBuses, PutRule, DeleteRule, ListRules, EnableRule, DisableRule, PutTargets, RemoveTargets, ListTargetsByRule, PutEvents, TestEventPattern, ListTagsForResource, TagResource, UntagResource, PutPermission, RemovePermission, CreateArchive, DescribeArchive, UpdateArchive, DeleteArchive, ListArchives, StartReplay, CancelReplay, ListReplays | DescribeReplay | DescribeRule, CreateConnection, DescribeConnection, UpdateConnection, DeleteConnection, ListConnections, CreateApiDestination, DescribeApiDestination, UpdateApiDestination, DeleteApiDestination, ListApiDestinations |

</details>

<a id="svc-firehose"></a>
<details><summary><b>firehose</b> — UI 6/12 (50%), backend 9/12</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | DescribeDeliveryStream, ListDeliveryStreams, DeleteDeliveryStream, TagDeliveryStream, UntagDeliveryStream, ListTagsForDeliveryStream | CreateDeliveryStream, PutRecord, PutRecordBatch | UpdateDestination, StartDeliveryStreamEncryption, StopDeliveryStreamEncryption |

</details>

<a id="svc-fis"></a>
<details><summary><b>fis</b> — UI 7/26 (27%), backend 9/26</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | CreateExperimentTemplate, DeleteExperimentTemplate, GetExperimentTemplate, ListExperimentTemplates, ListExperiments, StartExperiment, StopExperiment | GetExperiment, UpdateExperimentTemplate | CreateTargetAccountConfiguration, DeleteTargetAccountConfiguration, GetAction, GetExperimentTargetAccountConfiguration, GetSafetyLever, GetTargetAccountConfiguration, GetTargetResourceType, ListActions, ListExperimentResolvedTargets, ListExperimentTargetAccountConfigurations, ListTargetAccountConfigurations, ListTargetResourceTypes, UpdateSafetyLeverState, UpdateTargetAccountConfiguration, ListTagsForResource, TagResource, UntagResource |

</details>

<a id="svc-glue"></a>
<details><summary><b>glue</b> — UI 21/117 (18%), backend 40/117</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Databases | GetDatabases, DeleteDatabase | CreateDatabase, GetDatabase |  |
| Tables | GetTables, UpdateTable, DeleteTable, GetTableVersions | CreateTable, GetTable, BatchDeleteTable | GetTableVersion, DeleteTableVersion, BatchDeleteTableVersion, SearchTables |
| Partitions | GetPartitions |  | CreatePartition, BatchDeletePartition, CreatePartitionIndex, GetPartitionIndexes, DeletePartitionIndex |
| User-defined Functions | CreateUserDefinedFunction, GetUserDefinedFunctions, UpdateUserDefinedFunction, DeleteUserDefinedFunction | GetUserDefinedFunction |  |
| Connections |  |  | CreateConnection, GetConnection, GetConnections, UpdateConnection, DeleteConnection, BatchDeleteConnection, TestConnection |
| Resource policy |  |  | PutResourcePolicy, GetResourcePolicy, GetResourcePolicies, DeleteResourcePolicy |
| Encryption settings |  |  | GetDataCatalogEncryptionSettings, PutDataCatalogEncryptionSettings |
| Security configurations |  |  | CreateSecurityConfiguration, GetSecurityConfiguration, GetSecurityConfigurations, DeleteSecurityConfiguration |
| Jobs |  |  | CreateJob, GetJob, GetJobs, ListJobs, BatchGetJobs, UpdateJob, DeleteJob, StartJobRun, GetJobRun, GetJobRuns, BatchStopJobRun |
| Crawlers |  |  | CreateCrawler, GetCrawler, GetCrawlers, ListCrawlers, BatchGetCrawlers, UpdateCrawler, DeleteCrawler, StartCrawler, StopCrawler, GetCrawlerMetrics, UpdateCrawlerSchedule, StartCrawlerSchedule, StopCrawlerSchedule |
| Triggers |  |  | CreateTrigger, GetTrigger, GetTriggers, ListTriggers, BatchGetTriggers, UpdateTrigger, DeleteTrigger, StartTrigger, StopTrigger |
| Workflows |  |  | CreateWorkflow, GetWorkflow, ListWorkflows, BatchGetWorkflows, UpdateWorkflow, DeleteWorkflow, StartWorkflowRun, StopWorkflowRun, ResumeWorkflowRun, GetWorkflowRun, GetWorkflowRuns, GetWorkflowRunProperties, PutWorkflowRunProperties |
| Classifiers |  |  | CreateClassifier, GetClassifier, GetClassifiers, UpdateClassifier, DeleteClassifier |
| Registries | CreateRegistry, ListRegistries, DeleteRegistry | GetRegistry, UpdateRegistry |  |
| Schemas | CreateSchema, ListSchemas, DeleteSchema | GetSchema, UpdateSchema |  |
| Versions | RegisterSchemaVersion, GetSchemaVersion, ListSchemaVersions | GetSchemaByDefinition, DeleteSchemaVersions, GetSchemaVersionsDiff, CheckSchemaVersionValidity |  |
| Metadata and Tags | QuerySchemaVersionMetadata | PutSchemaVersionMetadata, RemoveSchemaVersionMetadata, TagResource, UntagResource, GetTags |  |

Backend còn gọi các operation không có trong docs Floci: `GetColumnStatisticsForTable`, `UpdateColumnStatisticsForTable`, `DeleteColumnStatisticsForTable`, `GetColumnStatisticsForPartition`, `UpdateColumnStatisticsForPartition`, `DeleteColumnStatisticsForPartition`, `GetPartition`, `BatchCreatePartition`, `BatchGetPartition`, `BatchUpdatePartition`, `UpdatePartition`, `DeletePartition`, `UpdateDatabase`.

</details>

<a id="svc-guardduty"></a>
<details><summary><b>guardduty</b> — UI 5/20 (25%), backend 5/20</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | CreateDetector, GetDetector, UpdateDetector, DeleteDetector, ListDetectors |  | DescribeOrganizationConfiguration, UpdateOrganizationConfiguration, EnableOrganizationAdminAccount, DisableOrganizationAdminAccount, ListOrganizationAdminAccounts, CreateMembers, ListMembers, CreateMalwareProtectionPlan, GetMalwareProtectionPlan, UpdateMalwareProtectionPlan, DeleteMalwareProtectionPlan, ListMalwareProtectionPlans, TagResource, UntagResource, ListTagsForResource |

</details>

<a id="svc-iam"></a>
<details><summary><b>iam</b> — UI 32/165 (19%), backend 76/165</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Users | CreateUser, DeleteUser, TagUser, UntagUser | GetUser, UpdateUser, ListUserTags | ListUsers |
| Groups | CreateGroup, GetGroup, DeleteGroup, AddUserToGroup, RemoveUserFromGroup | ListGroupsForUser | UpdateGroup, ListGroups |
| Roles | CreateRole, DeleteRole, DeleteServiceLinkedRole, UpdateAssumeRolePolicy, TagRole, UntagRole, PutRolePolicy | GetRole, UpdateRole, GetServiceLinkedRoleDeletionStatus, ListRoleTags, AttachRolePolicy | ListRoles, CreateServiceLinkedRole |
| Policies | CreatePolicy, DeletePolicy, GetPolicyVersion, SetDefaultPolicyVersion, TagPolicy, UntagPolicy | GetPolicy, ListEntitiesForPolicy, CreatePolicyVersion, DeletePolicyVersion, ListPolicyVersions, ListPolicyTags | ListPolicies |
| Permission Boundaries |  | DeleteUserPermissionsBoundary, PutRolePermissionsBoundary, DeleteRolePermissionsBoundary | PutUserPermissionsBoundary |
| Policy Attachments |  | DetachUserPolicy, ListAttachedUserPolicies, DetachGroupPolicy, ListAttachedGroupPolicies, DetachRolePolicy, ListAttachedRolePolicies | AttachUserPolicy, AttachGroupPolicy |
| Inline Policies | PutGroupPolicy, GetGroupPolicy, DeleteGroupPolicy, ListGroupPolicies, DeleteRolePolicy | PutUserPolicy, GetUserPolicy, DeleteUserPolicy, GetRolePolicy | ListUserPolicies, ListRolePolicies |
| Instance Profiles | CreateInstanceProfile, DeleteInstanceProfile, AddRoleToInstanceProfile, RemoveRoleFromInstanceProfile | ListInstanceProfilesForRole | GetInstanceProfile, ListInstanceProfiles, TagInstanceProfile, UntagInstanceProfile, ListInstanceProfileTags |
| Access Keys | CreateAccessKey | GetAccessKeyLastUsed, UpdateAccessKey, DeleteAccessKey | ListAccessKeys |
| Account Aliases |  | ListAccountAliases, DeleteAccountAlias | CreateAccountAlias |
| Account Password Policy |  |  | GetAccountPasswordPolicy, UpdateAccountPasswordPolicy, DeleteAccountPasswordPolicy |
| OIDC Identity Providers |  | GetOpenIDConnectProvider, ListOpenIDConnectProviders, DeleteOpenIDConnectProvider, AddClientIDToOpenIDConnectProvider, RemoveClientIDFromOpenIDConnectProvider, UpdateOpenIDConnectProviderThumbprint | CreateOpenIDConnectProvider, TagOpenIDConnectProvider, UntagOpenIDConnectProvider, ListOpenIDConnectProviderTags |
| SAML Identity Providers |  | ListSAMLProviders | CreateSAMLProvider, GetSAMLProvider, UpdateSAMLProvider, DeleteSAMLProvider, TagSAMLProvider, UntagSAMLProvider, ListSAMLProviderTags |
| Login Profiles |  |  | CreateLoginProfile, GetLoginProfile, UpdateLoginProfile, DeleteLoginProfile, ChangePassword |
| Policy Simulation |  | SimulatePrincipalPolicy | SimulateCustomPolicy, GetContextKeysForCustomPolicy, GetContextKeysForPrincipalPolicy |
| Last-Accessed Reporting |  |  | GenerateServiceLastAccessedDetails, GetServiceLastAccessedDetails, GetServiceLastAccessedDetailsWithEntities, ListPoliciesGrantingServiceAccess, GenerateOrganizationsAccessReport, GetOrganizationsAccessReport |
| Multi-Factor Authentication |  |  | CreateVirtualMFADevice, ListVirtualMFADevices, DeleteVirtualMFADevice, EnableMFADevice, DeactivateMFADevice, ResyncMFADevice, ListMFADevices, TagMFADevice, UntagMFADevice, ListMFADeviceTags |
| Account |  | GetAccountSummary | GetAccountAuthorizationDetails, GenerateCredentialReport, GetCredentialReport |
| Account Properties and Outbound Federation |  |  | SetSecurityTokenServicePreferences, EnableOutboundWebIdentityFederation, DisableOutboundWebIdentityFederation, GetOutboundWebIdentityFederationInfo |
| Organizations Root Access |  |  | ListOrganizationsFeatures, EnableOrganizationsRootCredentialsManagement, DisableOrganizationsRootCredentialsManagement, EnableOrganizationsRootSessions, DisableOrganizationsRootSessions |
| Server Certificates |  | ListServerCertificates | UploadServerCertificate, GetServerCertificate, UpdateServerCertificate, DeleteServerCertificate, TagServerCertificate, UntagServerCertificate, ListServerCertificateTags |
| SSH Public Keys |  |  | UploadSSHPublicKey, GetSSHPublicKey, ListSSHPublicKeys, UpdateSSHPublicKey, DeleteSSHPublicKey |
| Signing Certificates |  |  | UploadSigningCertificate, ListSigningCertificates, UpdateSigningCertificate, DeleteSigningCertificate |
| Service-Specific Credentials |  |  | CreateServiceSpecificCredential, ListServiceSpecificCredentials, UpdateServiceSpecificCredential, ResetServiceSpecificCredential, DeleteServiceSpecificCredential |

</details>

<a id="svc-iot"></a>
<details><summary><b>iot</b> — UI 16/47 (34%), backend 41/47</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | CreateThing, CreateKeysAndCertificate, ListCertificates, UpdateCertificate, DeleteCertificate, CreatePolicy, ListPolicies, DeletePolicy, Publish, ListRetainedMessages, CreateThingType, ListThingTypes, DeleteThingType, GetConnection, DeleteConnection, ListSubscriptions | UpdateThing, CreateCertificateFromCsr, DescribeCertificate, GetPolicy, AttachPolicy, DetachPolicy, ListAttachedPolicies, ListTargetsForPolicy, AttachThingPrincipal, DetachThingPrincipal, ListThingPrincipals, GetRetainedMessage, DescribeThingType, DeprecateThingType, CreateThingGroup, DescribeThingGroup, ListThingGroups, UpdateThingGroup, DeleteThingGroup, AddThingToThingGroup, RemoveThingFromThingGroup, ListThingsInThingGroup, ListThingGroupsForThing, DescribeJobExecution, SendDirectMessage | ListPrincipalThings, UpdateThingType, CreateJob, DescribeJob, ListJobs, SearchIndex |

Backend còn gọi các operation không có trong docs Floci: `DescribeEndpoint`, `ListThings`, `DescribeThing`, `DeleteThing`, `ListPolicyVersions`, `GetPolicyVersion`, `CreatePolicyVersion`, `SetDefaultPolicyVersion`, `DeletePolicyVersion`, `ListTopicRules`, `GetTopicRule`, `CreateTopicRule`, `ReplaceTopicRule`, `DeleteTopicRule`, `EnableTopicRule`, `DisableTopicRule`, `ListTagsForResource`, `TagResource`, `UntagResource`, `ListJobExecutionsForThing`, `GetThingShadow`, `UpdateThingShadow`, `DeleteThingShadow`, `ListNamedShadowsForThing`.

</details>

<a id="svc-kinesis"></a>
<details><summary><b>kinesis</b> — UI 19/29 (66%), backend 23/29</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | CreateStream, DeleteStream, ListStreams, DescribeStream, DescribeStreamSummary, RegisterStreamConsumer, DeregisterStreamConsumer, ListStreamConsumers, SubscribeToShard, AddTagsToStream, RemoveTagsFromStream, ListTagsForStream, StartStreamEncryption, StopStreamEncryption, SplitShard, MergeShards, PutRecord, ListShards, UpdateStreamMode | DescribeStreamConsumer, PutRecords, GetShardIterator, GetRecords | IncreaseStreamRetentionPeriod, DecreaseStreamRetentionPeriod, EnableEnhancedMonitoring, DisableEnhancedMonitoring, UpdateMaxRecordSize, UpdateShardCount |

</details>

<a id="svc-kinesisanalytics"></a>
<details><summary><b>kinesisanalytics</b> — UI 9/15 (60%), backend 14/15</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | CreateApplication, DescribeApplication, ListApplications, StartApplication, StopApplication, DeleteApplication, CreateApplicationSnapshot, ListApplicationSnapshots, DeleteApplicationSnapshot | UpdateApplication, TagResource, UntagResource, ListTagsForResource, DescribeApplicationSnapshot | CreateApplicationPresignedUrl |

</details>

<a id="svc-kms"></a>
<details><summary><b>kms</b> — UI 25/42 (60%), backend 36/42</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | CreateKey, DescribeKey, ListKeys, Encrypt, Decrypt, ReEncrypt, GenerateDataKey, GenerateDataKeyWithoutPlaintext, Sign, Verify, GenerateMac, CreateAlias, DeleteAlias, ListAliases, ScheduleKeyDeletion, CancelKeyDeletion, TagResource, GetKeyPolicy, PutKeyPolicy, UpdateKeyDescription, EnableKeyRotation, DisableKeyRotation, EnableKey, DisableKey, RotateKeyOnDemand | GenerateRandom, GetPublicKey, ListGrants, RevokeGrant, RetireGrant, VerifyMac, UpdateAlias, UntagResource, ListResourceTags, ListKeyPolicies, GetKeyRotationStatus | ReplicateKey, CreateGrant, ListRetirableGrants, GetParametersForImport, ImportKeyMaterial, DeleteImportedKeyMaterial |

</details>

<a id="svc-lakeformation"></a>
<details><summary><b>lakeformation</b> — UI 14/17 (82%), backend 17/17</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Data Lake Settings | PutDataLakeSettings, GetDataLakeSettings |  |  |
| Resource Registration | RegisterResource, UpdateResource, DeregisterResource, ListResources, DescribeResource |  |  |
| Permissions | GrantPermissions, RevokePermissions, ListPermissions |  |  |
| LF-Tags | CreateLFTag, UpdateLFTag, DeleteLFTag, ListLFTags | GetLFTag, AddLFTagsToResource, RemoveLFTagsFromResource |  |

</details>

<a id="svc-lambda"></a>
<details><summary><b>lambda</b> — UI 27/55 (49%), backend 37/55</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | CreateFunction, GetFunction, ListFunctions, DeleteFunction, Invoke, CreateEventSourceMapping, ListEventSourceMappings, UpdateEventSourceMapping, PublishVersion, ListVersionsByFunction, ListAliases, UpdateAlias, AddPermission, GetPolicy, RemovePermission, GetFunctionCodeSigningConfig, ListCodeSigningConfigs, CreateFunctionUrlConfig, GetFunctionUrlConfig, UpdateFunctionUrlConfig, DeleteFunctionUrlConfig, PutFunctionConcurrency, GetFunctionConcurrency, DeleteFunctionConcurrency, PutFunctionEventInvokeConfig, GetFunctionEventInvokeConfig, DeleteFunctionEventInvokeConfig | UpdateFunctionCode, UpdateFunctionConfiguration, DeleteEventSourceMapping, CreateAlias, DeleteAlias, CreateCodeSigningConfig, DeleteCodeSigningConfig, ListTags, TagResource, UntagResource | GetFunctionConfiguration, GetEventSourceMapping, GetAlias, ListFunctionsByCodeSigningConfig, GetCodeSigningConfig, UpdateCodeSigningConfig, GetAccountSettings, UpdateFunctionEventInvokeConfig, ListFunctionEventInvokeConfigs, CheckpointDurableExecution, GetDurableExecutionState, GetDurableExecution, GetDurableExecutionHistory, ListDurableExecutionsByFunction, StopDurableExecution, SendDurableExecutionCallbackSuccess, SendDurableExecutionCallbackFailure, SendDurableExecutionCallbackHeartbeat |

Backend còn gọi các operation không có trong docs Floci: `ListLayers`, `ListLayerVersions`, `DeleteLayerVersion`, `PublishLayerVersion`, `PutFunctionCodeSigningConfig`, `DeleteFunctionCodeSigningConfig`.

</details>

<a id="svc-managed-prometheus"></a>
<details><summary><b>managed-prometheus</b> — UI 6/13 (46%), backend 8/13</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | CreateWorkspace, ListWorkspaces, UpdateWorkspaceAlias, DeleteWorkspace, TagResource, UntagResource | DescribeWorkspace, ListTagsForResource | CreateRuleGroupsNamespace, DescribeRuleGroupsNamespace, ListRuleGroupsNamespaces, PutRuleGroupsNamespace, DeleteRuleGroupsNamespace |

</details>

<a id="svc-memorydb"></a>
<details><summary><b>memorydb</b> — UI 9/13 (69%), backend 13/13</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | CreateCluster, DescribeClusters, DeleteCluster, CreateUser, DescribeUsers, DeleteUser, CreateACL, DescribeACLs, DeleteACL | UpdateCluster, ListTags, TagResource, UntagResource |  |

</details>

<a id="svc-msk"></a>
<details><summary><b>msk</b> — UI 2/18 (11%), backend 12/18</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | ListClustersV2, DeleteCluster | CreateClusterV2, CreateConfiguration, DescribeClusterV2, GetBootstrapBrokers, ListConfigurations, DescribeConfiguration, DeleteConfiguration, UpdateConfiguration, ListConfigurationRevisions, DescribeConfigurationRevision | CreateCluster, ListClusters, DescribeCluster, ListTagsForResource, TagResource, UntagResource |

</details>

<a id="svc-mwaa"></a>
<details><summary><b>mwaa</b> — UI 6/10 (60%), backend 7/10</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | CreateEnvironment, GetEnvironment, ListEnvironments, DeleteEnvironment, CreateWebLoginToken, CreateCliToken | UpdateEnvironment | TagResource, UntagResource, ListTagsForResource |

</details>

<a id="svc-neptune"></a>
<details><summary><b>neptune</b> — UI 5/14 (36%), backend 8/14</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | DescribeDBClusters, DeleteDBCluster, ModifyDBCluster, DescribeDBInstances, DeleteDBInstance | CreateDBCluster, CreateDBInstance, ModifyDBInstance | AddRoleToDBCluster, RemoveRoleFromDBCluster, DescribeGlobalClusters, ListTagsForResource, AddTagsToResource, RemoveTagsFromResource |

</details>

<a id="svc-network-firewall"></a>
<details><summary><b>network-firewall</b> — UI 11/27 (41%), backend 18/27</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | CreateRuleGroup, DeleteRuleGroup, ListRuleGroups, CreateFirewallPolicy, DeleteFirewallPolicy, ListFirewallPolicies, CreateFirewall, DeleteFirewall, ListFirewalls, UpdateLoggingConfiguration, AssociateFirewallPolicy | DescribeRuleGroup, UpdateRuleGroup, DescribeFirewallPolicy, UpdateFirewallPolicy, DescribeFirewall, UpdateFirewallAnalysisSettings, DescribeLoggingConfiguration | UpdateFirewallDeleteProtection, UpdateFirewallPolicyChangeProtection, UpdateSubnetChangeProtection, UpdateAvailabilityZoneChangeProtection, UpdateFirewallDescription, AssociateSubnets, DisassociateSubnets, AssociateAvailabilityZones, DisassociateAvailabilityZones |

</details>

<a id="svc-opensearch"></a>
<details><summary><b>opensearch</b> — UI 11/24 (46%), backend 12/24</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Domain Lifecycle | CreateDomain, DescribeDomain, DescribeDomainConfig, UpdateDomainConfig, DeleteDomain, ListDomainNames | DescribeDomains |  |
| Tags | AddTags, ListTags, RemoveTags |  |  |
| Versions & Instance Types | ListVersions |  | GetCompatibleVersions, ListInstanceTypeDetails, DescribeInstanceTypeLimits |
| Stubs (SDK-compatible, no-op responses) | UpgradeDomain |  | DescribeDomainChangeProgress, DescribeDomainAutoTunes, DescribeDryRunProgress, DescribeDomainHealth, GetUpgradeHistory, GetUpgradeStatus, CancelDomainConfigChange, StartServiceSoftwareUpdate, CancelServiceSoftwareUpdate |

</details>

<a id="svc-organizations"></a>
<details><summary><b>organizations</b> — UI 14/56 (25%), backend 37/56</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | CreateOrganization, DescribeOrganization, DeleteOrganization, ListRoots, CreateOrganizationalUnit, DeleteOrganizationalUnit, ListOrganizationalUnitsForParent, CreateAccount, ListAccounts, ListAccountsForParent, CloseAccount, CreatePolicy, DeletePolicy, ListPolicies | EnableAllFeatures, UpdateOrganizationalUnit, DescribeOrganizationalUnit, ListParents, ListChildren, DescribeCreateAccountStatus, ListCreateAccountStatus, DescribeAccount, MoveAccount, RemoveAccountFromOrganization, LeaveOrganization, UpdatePolicy, DescribePolicy, AttachPolicy, DetachPolicy, ListPoliciesForTarget, ListTargetsForPolicy, EnablePolicyType, DisablePolicyType, DescribeEffectivePolicy, TagResource, UntagResource, ListTagsForResource | CreateGovCloudAccount, ListAccountsWithInvalidEffectivePolicy, EnableAWSServiceAccess, DisableAWSServiceAccess, ListAWSServiceAccessForOrganization, RegisterDelegatedAdministrator, DeregisterDelegatedAdministrator, ListDelegatedAdministrators, ListDelegatedServicesForAccount, PutResourcePolicy, DescribeResourcePolicy, DeleteResourcePolicy, InviteAccountToOrganization, AcceptHandshake, DeclineHandshake, CancelHandshake, DescribeHandshake, ListHandshakesForAccount, ListHandshakesForOrganization |

</details>

<a id="svc-pipes"></a>
<details><summary><b>pipes</b> — UI 4/7 (57%), backend 7/7</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | DeletePipe, ListPipes, StartPipe, StopPipe | CreatePipe, DescribePipe, UpdatePipe |  |

</details>

<a id="svc-pricing"></a>
<details><summary><b>pricing</b> — UI 5/5 (100%), backend 5/5</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | DescribeServices, GetAttributeValues, GetProducts, ListPriceLists, GetPriceListFileUrl |  |  |

</details>

<a id="svc-ram"></a>
<details><summary><b>ram</b> — UI 9/15 (60%), backend 12/15</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | EnableSharingWithAwsOrganization, CreateResourceShare, GetResourceShares, DeleteResourceShare, AssociateResourceShare, DisassociateResourceShare, ListPrincipals, GetResourceShareInvitations, ListResources | UpdateResourceShare, TagResource, UntagResource | ListResourceSharePermissions, AcceptResourceShareInvitation, RejectResourceShareInvitation |

</details>

<a id="svc-rds"></a>
<details><summary><b>rds</b> — UI 21/98 (21%), backend 37/98</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | CreateDBInstance, DescribeDBInstances, DeleteDBInstance, RebootDBInstance, CreateDBSubnetGroup, ListTagsForResource, DescribeDBSubnetGroups, DeleteDBSubnetGroup, CreateDBCluster, DescribeDBClusters, DeleteDBCluster, CreateDBParameterGroup, DescribeDBParameterGroups, DeleteDBParameterGroup, ModifyDBParameterGroup, CreateDBClusterParameterGroup, DescribeDBClusterParameterGroups, DeleteDBClusterParameterGroup, ModifyDBClusterParameterGroup, AddTagsToResource, RemoveTagsFromResource | ModifyDBInstance, DescribeOrderableDBInstanceOptions, ModifyDBSubnetGroup, ModifyDBCluster, DescribeDBParameters, DescribeDBClusterParameters, DescribeOptionGroups, ModifyOptionGroup, DeleteOptionGroup, DescribeDBProxies, DeleteDBProxy, RegisterDBProxyTargets, DeregisterDBProxyTargets, DescribeDBProxyTargetGroups, ModifyDBProxyTargetGroup, DescribeDBProxyTargets | StopDBInstance, StartDBInstance, StopDBCluster, StartDBCluster, RebootDBCluster, CreateDBInstanceReadReplica, PromoteReadReplica, SwitchoverReadReplica, PromoteReadReplicaDBCluster, DescribeDBEngineVersions, DescribeEngineDefaultParameters, DescribeEngineDefaultClusterParameters, DescribeValidDBInstanceModifications, DescribeEvents, CreateEventSubscription, DescribeEventSubscriptions, ModifyEventSubscription, DeleteEventSubscription, CreateDBClusterEndpoint, DescribeDBClusterEndpoints, ModifyDBClusterEndpoint, DeleteDBClusterEndpoint, AddRoleToDBCluster, RemoveRoleFromDBCluster, AddRoleToDBInstance, RemoveRoleFromDBInstance, AddSourceIdentifierToSubscription, RemoveSourceIdentifierFromSubscription, CopyDBParameterGroup, ResetDBParameterGroup, CopyDBClusterParameterGroup, ResetDBClusterParameterGroup, CreateOptionGroup, CopyOptionGroup, CreateDBSnapshot, DeleteDBSnapshot, CopyDBSnapshot, ModifyDBSnapshot, RestoreDBInstanceFromDBSnapshot, RestoreDBInstanceToPointInTime, DescribeDBSnapshots, DescribeDBSnapshotAttributes, ModifyDBSnapshotAttribute, CreateDBProxy, ModifyDBProxy, DescribeDBClusterSnapshots, CreateDBClusterSnapshot, DeleteDBClusterSnapshot, CopyDBClusterSnapshot, RestoreDBClusterFromSnapshot, RestoreDBClusterToPointInTime, DescribeDBClusterSnapshotAttributes, ModifyDBClusterSnapshotAttribute, DescribeGlobalClusters, CreateGlobalCluster, ModifyGlobalCluster, DeleteGlobalCluster, RemoveFromGlobalCluster, FailoverGlobalCluster, SwitchoverGlobalCluster, FailoverDBCluster |

</details>

<a id="svc-rds-data"></a>
<details><summary><b>rds-data</b> — UI 4/6 (67%), backend 4/6</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | ExecuteStatement, BeginTransaction, CommitTransaction, RollbackTransaction |  | BatchExecuteStatement, ExecuteSql |

</details>

<a id="svc-redshift"></a>
<details><summary><b>redshift</b> — UI 21/43 (49%), backend 21/43</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | CreateCluster, DescribeClusters, DeleteCluster, CreateClusterSnapshot, DescribeClusterSnapshots, DeleteClusterSnapshot, RestoreFromClusterSnapshot, CreateClusterParameterGroup, DescribeClusterParameterGroups, DescribeClusterParameters, ModifyClusterParameterGroup, DeleteClusterParameterGroup, CreateTags, DeleteTags, DescribeTags, CreateClusterSubnetGroup, DescribeClusterSubnetGroups, ModifyClusterSubnetGroup, DeleteClusterSubnetGroup, ModifyCluster, RebootCluster |  | CreateIntegration, DescribeIntegrations, DeleteIntegration, CreateSnapshotCopyGrant, DescribeSnapshotCopyGrants, DeleteSnapshotCopyGrant, EnableSnapshotCopy, DisableSnapshotCopy, ModifySnapshotCopyRetentionPeriod, CreateSnapshotSchedule, ModifySnapshotSchedule, DescribeSnapshotSchedules, DeleteSnapshotSchedule, ModifyClusterSnapshotSchedule, DescribeClusterVersions, DescribeOrderableClusterOptions, ModifyClusterIamRoles, DescribeLoggingStatus, EnableLogging, DisableLogging, GetClusterCredentials, GetClusterCredentialsWithIAM |

</details>

<a id="svc-rekognition"></a>
<details><summary><b>rekognition</b> — UI 5/5 (100%), backend 5/5</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | DetectLabels, DetectFaces, DetectText, CompareFaces, DetectModerationLabels |  |  |

</details>

<a id="svc-resource-explorer"></a>
<details><summary><b>resource-explorer</b> — UI 15/32 (47%), backend 29/32</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | Search, ListSupportedResourceTypes, CreateIndex, GetIndex, DeleteIndex, ListIndexes, UpdateIndexType, CreateView, DeleteView, UpdateView, ListViews, AssociateDefaultView, DisassociateDefaultView, GetDefaultView, GetAccountLevelServiceConfiguration | ListResources, GetView, BatchGetView, ListIndexesForMembers, ListManagedViews, GetManagedView, ListServiceViews, GetServiceView, ListServiceIndexes, GetServiceIndex, ListStreamingAccessForServices, CreateResourceExplorerSetup, DeleteResourceExplorerSetup, GetResourceExplorerSetup | ListTagsForResource, TagResource, UntagResource |

</details>

<a id="svc-resource-groups-tagging"></a>
<details><summary><b>resource-groups-tagging</b> — UI 5/5 (100%), backend 5/5</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | TagResources, UntagResources, GetResources, GetTagKeys, GetTagValues |  |  |

</details>

<a id="svc-route53"></a>
<details><summary><b>route53</b> — UI 8/27 (30%), backend 18/27</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | CreateHostedZone, DeleteHostedZone, ListHostedZones, ChangeResourceRecordSets, ListResourceRecordSets, CreateHealthCheck, DeleteHealthCheck, ListHealthChecks | GetHostedZone, ListHostedZonesByName, GetHostedZoneCount, GetChange, GetHealthCheck, UpdateHealthCheck, ListTagsForResource, ChangeTagsForResource, GetAccountLimit, GetDNSSEC | UpdateHostedZoneComment, AssociateVPCWithHostedZone, DisassociateVPCFromHostedZone, CreateVPCAssociationAuthorization, DeleteVPCAssociationAuthorization, ListVPCAssociationAuthorizations, ListHostedZonesByVPC, GetHealthCheckStatus, GetHostedZoneLimit |

</details>

<a id="svc-route53resolver"></a>
<details><summary><b>route53resolver</b> — UI 14/18 (78%), backend 18/18</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | ListFirewallDomainLists, CreateFirewallDomainList, DeleteFirewallDomainList, CreateResolverEndpoint, DeleteResolverEndpoint, ListResolverEndpoints, UpdateResolverEndpoint, CreateResolverRule, DeleteResolverRule, ListResolverRules, UpdateResolverRule, AssociateResolverRule, DisassociateResolverRule, ListResolverRuleAssociations | GetFirewallDomainList, GetResolverEndpoint, GetResolverRule, GetResolverRuleAssociation |  |

</details>

<a id="svc-rum"></a>
<details><summary><b>rum</b> — UI 4/5 (80%), backend 5/5</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | CreateAppMonitor, GetAppMonitor, DeleteAppMonitor, ListAppMonitors | UpdateAppMonitor |  |

</details>

<a id="svc-s3tables"></a>
<details><summary><b>s3tables</b> — UI 9/25 (36%), backend 10/25</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | CreateTableBucket, ListTableBuckets, DeleteTableBucket, CreateNamespace, ListNamespaces, DeleteNamespace, CreateTable, ListTables, DeleteTable | GetTableBucket | PutTableBucketPolicy, GetTableBucketPolicy, DeleteTableBucketPolicy, PutTableBucketMaintenanceConfiguration, GetTableBucketMaintenanceConfiguration, GetNamespace, GetTable, RenameTable, GetTableMetadataLocation, UpdateTableMetadataLocation, PutTablePolicy, GetTablePolicy, DeleteTablePolicy, PutTableMaintenanceConfiguration, GetTableMaintenanceConfiguration |

</details>

<a id="svc-scheduler"></a>
<details><summary><b>scheduler</b> — UI 7/12 (58%), backend 8/12</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | CreateScheduleGroup, DeleteScheduleGroup, ListScheduleGroups, CreateSchedule, UpdateSchedule, DeleteSchedule, ListSchedules | GetSchedule | GetScheduleGroup, TagResource, UntagResource, ListTagsForResource |

</details>

<a id="svc-secrets-manager"></a>
<details><summary><b>secrets-manager</b> — UI 10/23 (43%), backend 18/23</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | CreateSecret, GetSecretValue, PutSecretValue, ListSecrets, DeleteSecret, RestoreSecret, GetResourcePolicy, GetRandomPassword, PutResourcePolicy, UpdateSecretVersionStage | UpdateSecret, DescribeSecret, RotateSecret, TagResource, UntagResource, ListSecretVersionIds, BatchGetSecretValue, DeleteResourcePolicy | CancelRotateSecret, ValidateResourcePolicy, ReplicateSecretToRegions, RemoveRegionsFromReplication, StopReplicationToReplica |

</details>

<a id="svc-service-catalog"></a>
<details><summary><b>service-catalog</b> — UI 16/89 (18%), backend 21/89</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | CreatePortfolio, ListPortfolios, DeletePortfolio, CreateProduct, SearchProductsAsAdmin, ListProvisioningArtifacts, ProvisionProduct, SearchProvisionedProducts, DeleteProduct, CreateTagOption, ListTagOptions, DeleteTagOption, CreateConstraint, DeleteConstraint, ListConstraintsForPortfolio, TerminateProvisionedProduct | DescribePortfolio, AssociateProductWithPortfolio, DisassociateProductFromPortfolio, ListPortfoliosForProduct, DeleteProvisioningArtifact | UpdatePortfolio, UpdateProduct, DescribeProductAsAdmin, SearchProducts, UpdateTagOption, DescribeTagOption, AssociateTagOptionWithResource, DisassociateTagOptionFromResource, UpdatePortfolioShare, CreatePortfolioShare, DescribePortfolioShareStatus, DescribeProduct, DescribePortfolioShares, CopyProduct, DescribeProvisioningArtifact, AcceptPortfolioShare, DeletePortfolioShare, RejectPortfolioShare, AssociateBudgetWithResource, AssociatePrincipalWithPortfolio, AssociateServiceActionWithProvisioningArtifact, BatchAssociateServiceActionWithProvisioningArtifact, BatchDisassociateServiceActionFromProvisioningArtifact, CreateProvisionedProductPlan, CreateServiceAction, DeleteProvisionedProductPlan, DeleteServiceAction, DescribeConstraint, DescribeProductView, DescribeProvisionedProduct, DescribeProvisionedProductPlan, DescribeProvisioningParameters, DescribeRecord, ExecuteProvisionedProductPlan, DescribeServiceActionExecutionParameters, DisableAWSOrganizationsAccess, DisassociateBudgetFromResource, DisassociatePrincipalFromPortfolio, DisassociateServiceActionFromProvisioningArtifact, EnableAWSOrganizationsAccess, ExecuteProvisionedProductServiceAction, GetAWSOrganizationsAccessStatus, GetProvisionedProductOutputs, ImportAsProvisionedProduct, ListAcceptedPortfolioShares, ListBudgetsForResource, ListLaunchPaths, ListOrganizationPortfolioAccess, ListPortfolioAccess, ListPrincipalsForPortfolio, ListProvisionedProductPlans, ListProvisioningArtifactsForServiceAction, ListRecordHistory, ListResourcesForTagOption, ListServiceActions, ListServiceActionsForProvisioningArtifact, ListStackInstancesForProvisionedProduct, NotifyProvisionProductEngineWorkflowResult, NotifyTerminateProvisionedProductEngineWorkflowResult, NotifyUpdateProvisionedProductEngineWorkflowResult, ScanProvisionedProducts, UpdateConstraint, UpdateProvisionedProduct, UpdateProvisionedProductProperties, UpdateServiceAction, CreateProvisioningArtifact, DescribeCopyProductStatus, UpdateProvisioningArtifact |

</details>

<a id="svc-servicequotas"></a>
<details><summary><b>servicequotas</b> — UI 3/7 (43%), backend 5/7</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | ListServiceQuotas, ListAWSDefaultServiceQuotas, RequestServiceQuotaIncrease | GetServiceQuota, GetAWSDefaultServiceQuota | GetRequestedServiceQuotaChange, ListRequestedServiceQuotaChangeHistoryByQuota |

</details>

<a id="svc-ses"></a>
<details><summary><b>ses</b> — UI 36/148 (24%), backend 105/148</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | VerifyEmailIdentity, VerifyEmailAddress, DeleteIdentity, ListIdentities, GetIdentityVerificationAttributes, SendEmail, SendRawEmail, GetSendQuota, GetSendStatistics, GetAccountSendingEnabled, UpdateAccountSendingEnabled, ListVerifiedEmailAddresses, DeleteVerifiedEmailAddress, SetIdentityNotificationTopic, GetIdentityNotificationAttributes, SetIdentityFeedbackForwardingEnabled, SetIdentityHeadersInNotificationsEnabled, SetIdentityMailFromDomain, GetIdentityMailFromDomainAttributes, GetIdentityDkimAttributes, SetIdentityDkimEnabled, CreateConfigurationSet, DescribeConfigurationSet, ListConfigurationSets, DeleteConfigurationSet, CreateConfigurationSetEventDestination, UpdateConfigurationSetEventDestination, DeleteConfigurationSetEventDestination, UpdateConfigurationSetSendingEnabled, CreateConfigurationSetTrackingOptions, UpdateConfigurationSetTrackingOptions, DeleteConfigurationSetTrackingOptions, UpdateConfigurationSetReputationMetricsEnabled, PutConfigurationSetDeliveryOptions, GetAccount, PutAccountDetails | VerifyDomainIdentity, SendTemplatedEmail, CreateTemplate, GetTemplate, UpdateTemplate, DeleteTemplate, ListTemplates, TestRenderTemplate, CreateCustomVerificationEmailTemplate, GetCustomVerificationEmailTemplate, ListCustomVerificationEmailTemplates, UpdateCustomVerificationEmailTemplate, DeleteCustomVerificationEmailTemplate, SendCustomVerificationEmail, VerifyDomainDkim, PutIdentityPolicy, GetIdentityPolicies, DeleteIdentityPolicy, CreateReceiptRuleSet, DescribeReceiptRuleSet, ListReceiptRuleSets, DeleteReceiptRuleSet, SetActiveReceiptRuleSet, DescribeActiveReceiptRuleSet, CreateEmailIdentity, ListEmailIdentities, GetEmailIdentity, DeleteEmailIdentity, PutEmailIdentityDkimAttributes, PutEmailIdentityDkimSigningAttributes, PutEmailIdentityFeedbackAttributes, PutEmailIdentityMailFromAttributes, PutEmailIdentityConfigurationSetAttributes, CreateEmailIdentityPolicy, GetEmailIdentityPolicies, UpdateEmailIdentityPolicy, DeleteEmailIdentityPolicy, SendBulkEmail, PutAccountSendingAttributes, PutAccountSuppressionAttributes, PutAccountVdmAttributes, CreateEmailTemplate, ListEmailTemplates, GetEmailTemplate, UpdateEmailTemplate, DeleteEmailTemplate, TestRenderEmailTemplate, GetConfigurationSet, GetConfigurationSetEventDestinations, CreateDedicatedIpPool, ListDedicatedIpPools, GetDedicatedIpPool, DeleteDedicatedIpPool, CreateContactList, ListContactLists, GetContactList, DeleteContactList, CreateContact, ListContacts, GetContact, UpdateContact, DeleteContact, PutSuppressedDestination, GetSuppressedDestination, DeleteSuppressedDestination, ListSuppressedDestinations, TagResource, UntagResource, ListTagsForResource | SendBulkTemplatedEmail, ListIdentityPolicies, ReorderReceiptRuleSet, CloneReceiptRuleSet, CreateReceiptRule, DescribeReceiptRule, UpdateReceiptRule, DeleteReceiptRule, SetReceiptRulePosition, CreateReceiptFilter, ListReceiptFilters, DeleteReceiptFilter, CreateTenant, GetTenant, ListTenants, DeleteTenant, CreateTenantResourceAssociation, DeleteTenantResourceAssociation, ListTenantResources, ListResourceTenants, PutTenantSuppressionAttributes, PutConfigurationSetSuppressionOptions, PutConfigurationSetSendingOptions, PutConfigurationSetReputationOptions, PutConfigurationSetTrackingOptions, PutConfigurationSetArchivingOptions, PutConfigurationSetVdmOptions, PutDedicatedIpPoolScalingAttributes, GetDedicatedIps, GetDedicatedIp, PutDedicatedIpInPool, PutDedicatedIpWarmupAttributes, PutAccountDedicatedIpWarmupAttributes, UpdateContactList, CreateImportJob, GetImportJob, ListImportJobs, GetMessageInsights, BatchGetMetricData, CreateExportJob, GetExportJob, ListExportJobs, CancelExportJob |

</details>

<a id="svc-sns"></a>
<details><summary><b>sns</b> — UI 12/39 (31%), backend 22/39</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | CreateTopic, DeleteTopic, ListTopics, GetTopicAttributes, Subscribe, Unsubscribe, ListSubscriptions, ListSubscriptionsByTopic, Publish, TagResource, UntagResource, ListTagsForResource | SetTopicAttributes, GetSubscriptionAttributes, SetSubscriptionAttributes, PublishBatch, CreatePlatformApplication, DeletePlatformApplication, ListPlatformApplications, CreatePlatformEndpoint, DeleteEndpoint, ListEndpointsByPlatformApplication | AddPermission, RemovePermission, GetSMSAttributes, SetSMSAttributes, GetSMSSandboxAccountStatus, CreateSMSSandboxPhoneNumber, VerifySMSSandboxPhoneNumber, DeleteSMSSandboxPhoneNumber, ListSMSSandboxPhoneNumbers, CheckIfPhoneNumberIsOptedOut, ListPhoneNumbersOptedOut, OptInPhoneNumber, ConfirmSubscription, GetPlatformApplicationAttributes, SetPlatformApplicationAttributes, GetEndpointAttributes, SetEndpointAttributes |

</details>

<a id="svc-sqs"></a>
<details><summary><b>sqs</b> — UI 15/23 (65%), backend 23/23</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | CreateQueue, DeleteQueue, ListQueues, GetQueueAttributes, SendMessage, DeleteMessage, SetQueueAttributes, TagQueue, UntagQueue, ListQueueTags, PurgeQueue, ListDeadLetterSourceQueues, StartMessageMoveTask, ListMessageMoveTasks, CancelMessageMoveTask | GetQueueUrl, ReceiveMessage, DeleteMessageBatch, SendMessageBatch, ChangeMessageVisibility, ChangeMessageVisibilityBatch, AddPermission, RemovePermission |  |

</details>

<a id="svc-ssm"></a>
<details><summary><b>ssm</b> — UI 14/21 (67%), backend 18/21</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Parameter Store | PutParameter, GetParameter, GetParameters, GetParametersByPath, DeleteParameter, DeleteParameters, GetParameterHistory, DescribeParameters, LabelParameterVersion | AddTagsToResource, ListTagsForResource, RemoveTagsFromResource | UnlabelParameterVersion, DescribePatchBaselines, GetDefaultPatchBaseline |
| Run Command | DescribeInstanceInformation, SendCommand, ListCommands, ListCommandInvocations, CancelCommand | GetCommandInvocation |  |

</details>

<a id="svc-ssoadmin"></a>
<details><summary><b>ssoadmin</b> — UI 1/79 (1%), backend 1/79</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | ListInstances |  | CreateInstance, UpdateInstance, DescribeInstance, DeleteInstance, CreateInstanceAccessControlAttributeConfiguration, DescribeInstanceAccessControlAttributeConfiguration, UpdateInstanceAccessControlAttributeConfiguration, DeleteInstanceAccessControlAttributeConfiguration, CreateTrustedTokenIssuer, UpdateTrustedTokenIssuer, DescribeTrustedTokenIssuer, ListTrustedTokenIssuers, DeleteTrustedTokenIssuer, AddRegion, RemoveRegion, DescribeRegion, ListRegions, ListTagsForResource, TagResource, UntagResource, CreateApplication, UpdateApplication, DescribeApplication, ListApplications, CreateApplicationAssignment, DescribeApplicationAssignment, DescribeApplicationProvider, ListApplicationProviders, ListApplicationAssignments, ListApplicationAssignmentsForPrincipal, DeleteApplication, GetApplicationAssignmentConfiguration, PutApplicationAssignmentConfiguration, PutApplicationAccessScope, GetApplicationAccessScope, ListApplicationAccessScopes, DeleteApplicationAccessScope, DeleteApplicationAssignment, GetApplicationAuthenticationMethod, ListApplicationAuthenticationMethods, PutApplicationAuthenticationMethod, DeleteApplicationAuthenticationMethod, GetApplicationGrant, ListApplicationGrants, GetApplicationSessionConfiguration, PutApplicationSessionConfiguration, PutApplicationGrant, DeleteApplicationGrant, ListPermissionSets, CreatePermissionSet, DeletePermissionSet, DescribePermissionSet, UpdatePermissionSet, ListManagedPoliciesInPermissionSet, AttachManagedPolicyToPermissionSet, AttachCustomerManagedPolicyReferenceToPermissionSet, DetachCustomerManagedPolicyReferenceFromPermissionSet, ListCustomerManagedPolicyReferencesInPermissionSet, DetachManagedPolicyFromPermissionSet, DeleteInlinePolicyFromPermissionSet, DeletePermissionsBoundaryFromPermissionSet, GetInlinePolicyForPermissionSet, GetPermissionsBoundaryForPermissionSet, PutInlinePolicyToPermissionSet, PutPermissionsBoundaryToPermissionSet, ListAccountAssignments, ListAccountAssignmentsForPrincipal, ProvisionPermissionSet, DescribePermissionSetProvisioningStatus, ListPermissionSetProvisioningStatus, ListPermissionSetsProvisionedToAccount, ListAccountsForProvisionedPermissionSet, CreateAccountAssignment, DeleteAccountAssignment, DescribeAccountAssignmentCreationStatus, ListAccountAssignmentCreationStatus, DescribeAccountAssignmentDeletionStatus, ListAccountAssignmentDeletionStatus |

</details>

<a id="svc-step-functions"></a>
<details><summary><b>step-functions</b> — UI 21/32 (66%), backend 26/32</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | UpdateStateMachine, ListStateMachines, DeleteStateMachine, PublishStateMachineVersion, ListStateMachineVersions, DeleteStateMachineVersion, ValidateStateMachineDefinition, StartExecution, StartSyncExecution, ListExecutions, StopExecution, SendTaskSuccess, SendTaskFailure, SendTaskHeartbeat, CreateActivity, DeleteActivity, ListActivities, GetActivityTask, ListTagsForResource, TagResource, UntagResource | CreateStateMachine, DescribeStateMachine, DescribeExecution, GetExecutionHistory, DescribeActivity | CreateStateMachineAlias, DescribeStateMachineAlias, ListStateMachineAliases, UpdateStateMachineAlias, DeleteStateMachineAlias, DescribeMapRun |

</details>

<a id="svc-sts"></a>
<details><summary><b>sts</b> — UI 7/7 (100%), backend 7/7</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | GetCallerIdentity, AssumeRole, AssumeRoleWithWebIdentity, AssumeRoleWithSAML, GetSessionToken, GetFederationToken, DecodeAuthorizationMessage |  |  |

</details>

<a id="svc-swf"></a>
<details><summary><b>swf</b> — UI 18/39 (46%), backend 28/39</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | RegisterDomain, ListDomains, DeprecateDomain, UndeprecateDomain, RegisterWorkflowType, ListWorkflowTypes, DeprecateWorkflowType, DeleteWorkflowType, RegisterActivityType, ListActivityTypes, DeprecateActivityType, DeleteActivityType, StartWorkflowExecution, GetWorkflowExecutionHistory, ListOpenWorkflowExecutions, ListClosedWorkflowExecutions, SignalWorkflowExecution, TerminateWorkflowExecution | DescribeDomain, DescribeWorkflowType, UndeprecateWorkflowType, DescribeActivityType, UndeprecateActivityType, DescribeWorkflowExecution, RequestCancelWorkflowExecution, ListTagsForResource, TagResource, UntagResource | CountOpenWorkflowExecutions, CountClosedWorkflowExecutions, CountPendingActivityTasks, CountPendingDecisionTasks, PollForDecisionTask, RespondDecisionTaskCompleted, PollForActivityTask, RecordActivityTaskHeartbeat, RespondActivityTaskCompleted, RespondActivityTaskFailed, RespondActivityTaskCanceled |

</details>

<a id="svc-textract"></a>
<details><summary><b>textract</b> — UI 0/6 (0%), backend 6/6</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác |  | DetectDocumentText, AnalyzeDocument, StartDocumentTextDetection, GetDocumentTextDetection, StartDocumentAnalysis, GetDocumentAnalysis |  |

</details>

<a id="svc-transcribe"></a>
<details><summary><b>transcribe</b> — UI 5/8 (63%), backend 8/8</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | ListTranscriptionJobs, DeleteTranscriptionJob, CreateVocabulary, ListVocabularies, DeleteVocabulary | StartTranscriptionJob, GetTranscriptionJob, GetVocabulary |  |

</details>

<a id="svc-transfer"></a>
<details><summary><b>transfer</b> — UI 13/17 (76%), backend 17/17</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Servers | CreateServer, DescribeServer, UpdateServer, DeleteServer, ListServers, StartServer, StopServer |  |  |
| Users | CreateUser, DescribeUser, UpdateUser, DeleteUser, ListUsers |  |  |
| SSH Public Keys | ImportSshPublicKey | DeleteSshPublicKey |  |
| Tagging |  | TagResource, UntagResource, ListTagsForResource |  |

</details>

<a id="svc-translate"></a>
<details><summary><b>translate</b> — UI 3/3 (100%), backend 3/3</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | TranslateText, TranslateDocument, ListLanguages |  |  |

</details>

<a id="svc-wafv2"></a>
<details><summary><b>wafv2</b> — UI 26/35 (74%), backend 35/35</summary>

| Nhóm | ✅ Có UI | 🟠 Có backend, chưa có UI | ❌ Chưa có |
|---|---|---|---|
| Khác | CreateWebACL, UpdateWebACL, DeleteWebACL, ListWebACLs, CreateIPSet, DeleteIPSet, ListIPSets, CreateRegexPatternSet, GetRegexPatternSet, UpdateRegexPatternSet, DeleteRegexPatternSet, ListRegexPatternSets, CreateRuleGroup, DeleteRuleGroup, ListRuleGroups, CheckCapacity, AssociateWebACL, DisassociateWebACL, GetWebACLForResource, ListResourcesForWebACL, PutLoggingConfiguration, DeleteLoggingConfiguration, ListLoggingConfigurations, PutPermissionPolicy, GetPermissionPolicy, DeletePermissionPolicy | GetWebACL, GetIPSet, UpdateIPSet, GetRuleGroup, UpdateRuleGroup, GetLoggingConfiguration, TagResource, UntagResource, ListTagsForResource |  |

</details>

## 6. Lời gọi từ frontend tới route **không tồn tại** (lỗi thật)

Script đối chiếu từng lời gọi `api()` trong frontend với route đã mount ở backend. Các lời gọi dưới đây không khớp route nào, nên sẽ trả về trang HTML của SPA hoặc 404 thay vì JSON:

| Lời gọi | Hook |
|---|---|
| `DELETE /aws/cur/report-definitions/:p` | `src/frontend/hooks/useCUR.ts:useDeleteReportDefinition` |
| `POST /aws/pricing/price-list-file-url` | `src/frontend/hooks/usePricing.ts:usePricingPriceListFileUrl` |
| `GET /aws/s3/buckets/:p` | `src/frontend/hooks/useS3Config.ts:useS3HeadBucket` |
| `GET /aws/s3/buckets/:p/objects/:p/acl` | `src/frontend/hooks/useS3Config.ts:useS3ObjectAcl` |
| `PUT /aws/s3/buckets/:p/objects/:p/acl` | `src/frontend/hooks/useS3Config.ts:useS3PutObjectAcl` |
| `GET /aws/ses/templates` | `src/frontend/hooks/useSES.ts:useSESTemplates` |
| `POST /aws/ses/templates` | `src/frontend/hooks/useSES.ts:useCreateSESTemplate` |
| `PUT /aws/ses/templates/:p` | `src/frontend/hooks/useSES.ts:useUpdateSESTemplate` |
| `DELETE /aws/ses/templates/:p` | `src/frontend/hooks/useSES.ts:useDeleteSESTemplate` |
| `POST /aws/ses/templates/:p/render` | `src/frontend/hooks/useSES.ts:useRenderSESTemplate` |
| `POST /aws/ses/send-templated` | `src/frontend/hooks/useSES.ts:useSESSendTemplated` |

## 7. Route backend không được giao diện dùng

- **484 route** không có hook nào gọi tới.
- **447 route** có hook gọi tới nhưng hook đó không được màn hình nào dùng.

Theo prefix (top 25):

| Prefix `/aws/...` | Không có hook | Có hook nhưng hook không dùng |
|---|---:|---:|
| email | 47 | 41 |
| ec2 | 26 | 30 |
| iam | 11 | 37 |
| apigateway | 41 | 4 |
| cloudfront | 10 | 31 |
| iot | 28 | 9 |
| lightsail | 30 | 0 |
| appsync | 7 | 19 |
| glue | 10 | 16 |
| eks | 22 | 2 |
| organizations | 3 | 19 |
| cognito | 4 | 17 |
| apigatewayv2 | 14 | 6 |
| s3 | 15 | 5 |
| rds | 14 | 4 |
| lambda | 11 | 6 |
| codepipeline | 4 | 11 |
| ecs | 4 | 11 |
| efs | 13 | 1 |
| resourceexplorer2 | 14 | 0 |
| sns | 7 | 7 |
| backup | 7 | 6 |
| emr | 11 | 2 |
| codedeploy | 10 | 2 |
| route53 | 4 | 7 |
