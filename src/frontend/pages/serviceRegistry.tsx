import { DynamoDBTables } from "./services/DynamoDBTables";
import { RDSDashboard } from "./services/RDSDashboard";
import { Route53Dashboard } from "./services/Route53Dashboard";
import { SSMDashboard } from "./services/SSMDashboard";
import { ECSDashboard } from "./services/ECSDashboard";
import { APIGatewayDashboard } from "./services/APIGatewayDashboard";
import { AppSyncDashboard } from "./services/AppSyncDashboard";
import { SchedulerDashboard } from "./services/SchedulerDashboard";
import { CloudWatchLogsDashboard } from "./services/CloudWatchLogsDashboard";
import { ECRDashboard } from "./services/ECRDashboard";
import { ELBDashboard } from "./services/ELBDashboard";
import { SESDashboard } from "./services/SESDashboard";
import { STSDashboard } from "./services/STSDashboard";
import { EKSDashboard } from "./services/EKSDashboard";
import { AutoScalingDashboard } from "./services/AutoScalingDashboard";
import { CloudFrontDashboard } from "./services/CloudFrontDashboard";
import { KinesisDashboard } from "./services/KinesisDashboard";
import { NeptuneDashboard } from "./services/NeptuneDashboard";
import { PipesDashboard } from "./services/PipesDashboard";
import { CognitoDashboard } from "./services/CognitoDashboard";
import { ApiGatewayV2Dashboard } from "./services/ApiGatewayV2Dashboard";
import { ACMDashboard } from "./services/ACMDashboard";
import { CloudTrailDashboard } from "./services/CloudTrailDashboard";
import { ConfigServiceDashboard } from "./services/ConfigServiceDashboard";
import { AppConfigDashboard } from "./services/AppConfigDashboard";
import { CloudMapDashboard } from "./services/CloudMapDashboard";
import { AthenaDashboard } from "./services/AthenaDashboard";
import { GlueDashboard } from "./services/GlueDashboard";
import { FirehoseDashboard } from "./services/FirehoseDashboard";
import { StepFunctionsDashboard } from "./services/StepFunctionsDashboard";
import { OpenSearchDashboard } from "./services/OpenSearchDashboard";
import { MskDashboard } from "./services/MskDashboard";
import { BedrockRuntimeDashboard } from "./services/BedrockRuntimeDashboard";
import { TextractDashboard } from "./services/TextractDashboard";
import { TranscribeDashboard } from "./services/TranscribeDashboard";
import { CEDashboard } from "./services/CEDashboard";
import { PricingDashboard } from "./services/PricingDashboard";
import { RGTDashboard } from "./services/RGTDashboard";
import { CodeBuildDashboard } from "./services/CodeBuildDashboard";
import { BackupDashboard } from "./services/BackupDashboard";
import { CodeDeployDashboard } from "./services/CodeDeployDashboard";
import { TransferDashboard } from "./services/TransferDashboard";
import { CURDashboard } from "./services/CURDashboard";
import { BCMDashboard } from "./services/BCMDashboard";
import { WafV2Dashboard } from "./services/WafV2Dashboard";
import { ElastiCacheDashboard } from "./services/ElastiCacheDashboard";
import { BatchDashboard } from "./services/BatchDashboard";
import { DocDBDashboard } from "./services/DocDBDashboard";
import { EMRDashboard } from "./services/EMRDashboard";
import { RDSDataDashboard } from "./services/RDSDataDashboard";
import { Ec2MessagesDashboard } from "./services/Ec2MessagesDashboard";
import { AppConfigDataDashboard } from "./services/AppConfigDataDashboard";
import { MemoryDBDashboard } from "./services/MemoryDBDashboard";

import type { ComponentType } from "react";

export const SERVICE_DASHBOARDS: Record<string, ComponentType> = {
  "dynamodb": DynamoDBTables,
  "rds": RDSDashboard,
  "route53": Route53Dashboard,
  "ssm": SSMDashboard,
  "ecs": ECSDashboard,
  "apigateway": APIGatewayDashboard,
  "appsync": AppSyncDashboard,
  "scheduler": SchedulerDashboard,
  "logs": CloudWatchLogsDashboard,
  "ecr": ECRDashboard,
  "elasticloadbalancing": ELBDashboard,
  "email": SESDashboard,
  "sts": STSDashboard,
  "eks": EKSDashboard,
  "autoscaling": AutoScalingDashboard,
  "cloudfront": CloudFrontDashboard,
  "kinesis": KinesisDashboard,
  "neptune": NeptuneDashboard,
  "pipes": PipesDashboard,
  "cognito-idp": CognitoDashboard,
  "apigatewayv2": ApiGatewayV2Dashboard,
  "acm": ACMDashboard,
  "cloudtrail": CloudTrailDashboard,
  "config": ConfigServiceDashboard,
  "appconfig": AppConfigDashboard,
  "servicediscovery": CloudMapDashboard,
  "athena": AthenaDashboard,
  "glue": GlueDashboard,
  "firehose": FirehoseDashboard,
  "states": StepFunctionsDashboard,
  "es": OpenSearchDashboard,
  "kafka": MskDashboard,
  "bedrock-runtime": BedrockRuntimeDashboard,
  "textract": TextractDashboard,
  "transcribe": TranscribeDashboard,
  "ce": CEDashboard,
  "pricing": PricingDashboard,
  "tagging": RGTDashboard,
  "codebuild": CodeBuildDashboard,
  "backup": BackupDashboard,
  "codedeploy": CodeDeployDashboard,
  "transfer": TransferDashboard,
  "cur": CURDashboard,
  "bcmdataexports": BCMDashboard,
  "wafv2": WafV2Dashboard,
  "elasticache": ElastiCacheDashboard,
  "batch": BatchDashboard,
  "docdb": DocDBDashboard,
  "emr": EMRDashboard,
  "rdsdata": RDSDataDashboard,
  "ec2messages": Ec2MessagesDashboard,
  "appconfigdata": AppConfigDataDashboard,
  "memorydb": MemoryDBDashboard,
};
