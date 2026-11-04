import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { ConfigServiceClient } from "@aws-sdk/client-config-service";
import {
  DescribeConfigRulesCommand,
  PutConfigRuleCommand,
  DeleteConfigRuleCommand,
  DescribeConfigurationRecordersCommand,
  PutConfigurationRecorderCommand,
  StartConfigurationRecorderCommand,
  StopConfigurationRecorderCommand,
  DescribeConfigurationRecorderStatusCommand,
  DescribeDeliveryChannelsCommand,
  PutDeliveryChannelCommand,
  DescribeConformancePacksCommand,
  PutConformancePackCommand,
  DeleteConformancePackCommand,
  DescribeConformancePackStatusCommand,
  DescribeComplianceByConfigRuleCommand,
  DescribeConfigRuleEvaluationStatusCommand,
  StartConfigRulesEvaluationCommand,
  ListTagsForResourceCommand,
  TagResourceCommand,
  UntagResourceCommand,
  PutAggregationAuthorizationCommand,
  DescribeAggregationAuthorizationsCommand,
  DeleteAggregationAuthorizationCommand,
  DeleteDeliveryChannelCommand,
  DeleteEvaluationResultsCommand,
  PutRetentionConfigurationCommand,
  DescribeRetentionConfigurationsCommand,
  DeleteRetentionConfigurationCommand,
  DescribeComplianceByResourceCommand,
  GetComplianceDetailsByConfigRuleCommand,
  GetComplianceDetailsByResourceCommand,
  GetComplianceSummaryByConfigRuleCommand,
  GetComplianceSummaryByResourceTypeCommand,
} from "@aws-sdk/client-config-service";

const router = new Hono();
const getClient = () => create(ConfigServiceClient);

// ── Config Rules ─────────────────────────────────────────

router.get("/rules", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new DescribeConfigRulesCommand({}));
  const rules = result.ConfigRules || [];
  return c.json({ rules, total: rules.length });
});

router.post("/rules", async (c: Context) => {
  const body = await c.req.json<{
    configRuleName: string;
    source?: { owner: string; sourceIdentifier: string };
  }>();
  if (!body.configRuleName) return c.json({ error: "configRuleName is required" }, 400);

  const client = getClient();
  await client.send(
    new PutConfigRuleCommand({
      ConfigRule: {
        ConfigRuleName: body.configRuleName,
        Source: body.source as any,
      },
    })
  );
  return c.json({ created: true }, 201);
});

router.delete("/rules/:name", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  await client.send(new DeleteConfigRuleCommand({ ConfigRuleName: name }));
  return c.json({ deleted: true });
});

// ── Configuration Recorders ──────────────────────────────

router.get("/recorders", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new DescribeConfigurationRecordersCommand({}));
  const recorders = result.ConfigurationRecorders || [];
  return c.json({ recorders, total: recorders.length });
});

router.post("/recorders", async (c: Context) => {
  const body = await c.req.json<{
    name?: string;
    roleARN: string;
    recordingGroup?: { allSupported?: boolean; includeGlobalResourceTypes?: boolean; resourceTypes?: string[] };
  }>();
  if (!body.roleARN) return c.json({ error: "roleARN is required" }, 400);

  const client = getClient();
  await client.send(
    new PutConfigurationRecorderCommand({
      ConfigurationRecorder: {
        name: body.name || "default",
        roleARN: body.roleARN,
        recordingGroup: body.recordingGroup as any,
      },
    })
  );
  return c.json({ created: true }, 201);
});

router.post("/recorders/:name/start", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  await client.send(new StartConfigurationRecorderCommand({ ConfigurationRecorderName: name }));
  return c.json({ started: true });
});

router.post("/recorders/:name/stop", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  await client.send(new StopConfigurationRecorderCommand({ ConfigurationRecorderName: name }));
  return c.json({ stopped: true });
});

router.get("/recorders/status", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new DescribeConfigurationRecorderStatusCommand({}));
  const statuses = result.ConfigurationRecordersStatus || [];
  return c.json({ statuses, total: statuses.length });
});

// ── Delivery Channels ────────────────────────────────────

router.get("/delivery-channels", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new DescribeDeliveryChannelsCommand({}));
  const channels = result.DeliveryChannels || [];
  return c.json({ channels, total: channels.length });
});

router.post("/delivery-channels", async (c: Context) => {
  const body = await c.req.json<{
    name?: string;
    s3BucketName?: string;
    s3KeyPrefix?: string;
    snsTopicARN?: string;
  }>();
  const client = getClient();
  await client.send(
    new PutDeliveryChannelCommand({
      DeliveryChannel: {
        name: body.name || "default",
        s3BucketName: body.s3BucketName,
        s3KeyPrefix: body.s3KeyPrefix,
        snsTopicARN: body.snsTopicARN,
      },
    })
  );
  return c.json({ created: true }, 201);
});

// ── Conformance Pack Status ──────────────────────────────

router.get("/conformance-packs/status", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new DescribeConformancePackStatusCommand({}));
  const statuses = result.ConformancePackStatusDetails || [];
  return c.json({ statuses, total: statuses.length });
});

// ── Compliance & Evaluation ──────────────────────────────

router.get("/rules/compliance", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new DescribeComplianceByConfigRuleCommand({}));
  const compliance = result.ComplianceByConfigRules || [];
  return c.json({ compliance, total: compliance.length });
});

router.get("/rules/evaluation-status", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new DescribeConfigRuleEvaluationStatusCommand({}));
  const statuses = result.ConfigRulesEvaluationStatus || [];
  return c.json({ statuses, total: statuses.length });
});

router.post("/rules/evaluate", async (c: Context) => {
  const body = await c.req.json<{ ruleNames?: string[] }>();
  const client = getClient();
  await client.send(
    new StartConfigRulesEvaluationCommand({ ConfigRuleNames: body.ruleNames })
  );
  return c.json({ started: true });
});

// ── Conformance Packs ────────────────────────────────────

router.get("/conformance-packs", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new DescribeConformancePacksCommand({}));
  const packs = result.ConformancePackDetails || [];
  return c.json({ conformancePacks: packs, total: packs.length });
});

router.post("/conformance-packs", async (c: Context) => {
  const body = await c.req.json<{
    conformancePackName: string;
    templateBody?: string;
    templateS3Uri?: string;
  }>();
  if (!body.conformancePackName) return c.json({ error: "conformancePackName is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new PutConformancePackCommand({
      ConformancePackName: body.conformancePackName,
      TemplateBody: body.templateBody,
      TemplateS3Uri: body.templateS3Uri,
    })
  );
  return c.json({ conformancePackArn: result.ConformancePackArn }, 201);
});

router.delete("/conformance-packs/:name", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  await client.send(new DeleteConformancePackCommand({ ConformancePackName: name }));
  return c.json({ deleted: true });
});

// ── Tags ─────────────────────────────────────────────────

router.get("/tags", async (c: Context) => {
  const arn = c.req.query("arn");
  if (!arn) return c.json({ error: "arn query parameter required" }, 400);
  const client = getClient();
  const result = await client.send(new ListTagsForResourceCommand({ ResourceArn: arn }));
  const tags = (result.Tags || []).map((t: any) => ({ key: t.Key, value: t.Value }));
  return c.json({ tags });
});

router.post("/tags", async (c: Context) => {
  const body = await c.req.json<{ arn?: string; tags?: Record<string, string> }>();
  if (!body.arn) return c.json({ error: "arn is required" }, 400);
  if (!body.tags || !Object.keys(body.tags).length)
    return c.json({ error: "tags is required" }, 400);
  const client = getClient();
  await client.send(
    new TagResourceCommand({
      ResourceArn: body.arn,
      Tags: Object.entries(body.tags).map(([Key, Value]) => ({ Key, Value })),
    })
  );
  return c.json({ tagged: true });
});

router.post("/tags/untag", async (c: Context) => {
  const body = await c.req.json<{ arn?: string; tagKeys?: string[] }>();
  if (!body.arn) return c.json({ error: "arn is required" }, 400);
  if (!body.tagKeys?.length) return c.json({ error: "tagKeys is required" }, 400);
  const client = getClient();
  await client.send(
    new UntagResourceCommand({ ResourceArn: body.arn, TagKeys: body.tagKeys })
  );
  return c.json({ untagged: true });
});

// ── Aggregation Authorizations ──────────────────────────

router.get("/aggregation-authorizations", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new DescribeAggregationAuthorizationsCommand({}));
  const authorizations = result.AggregationAuthorizations || [];
  return c.json({ authorizations, total: authorizations.length });
});

router.post("/aggregation-authorizations", async (c: Context) => {
  const body = await c.req.json<{ authorizedAccountId?: string; authorizedAwsRegion?: string }>();
  if (!body.authorizedAccountId) return c.json({ error: "authorizedAccountId is required" }, 400);
  if (!body.authorizedAwsRegion) return c.json({ error: "authorizedAwsRegion is required" }, 400);
  const client = getClient();
  await client.send(
    new PutAggregationAuthorizationCommand({
      AuthorizedAccountId: body.authorizedAccountId,
      AuthorizedAwsRegion: body.authorizedAwsRegion,
    })
  );
  return c.json({ created: true }, 201);
});

router.delete("/aggregation-authorizations", async (c: Context) => {
  const body = await c.req.json<{ authorizedAccountId?: string; authorizedAwsRegion?: string }>();
  if (!body.authorizedAccountId) return c.json({ error: "authorizedAccountId is required" }, 400);
  if (!body.authorizedAwsRegion) return c.json({ error: "authorizedAwsRegion is required" }, 400);
  const client = getClient();
  await client.send(
    new DeleteAggregationAuthorizationCommand({
      AuthorizedAccountId: body.authorizedAccountId,
      AuthorizedAwsRegion: body.authorizedAwsRegion,
    })
  );
  return c.json({ deleted: true });
});

// ── Delivery Channels (delete) ──────────────────────────

router.delete("/delivery-channels/:name", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  await client.send(new DeleteDeliveryChannelCommand({ DeliveryChannelName: name }));
  return c.json({ deleted: true });
});

// ── Retention Configurations ────────────────────────────

router.get("/retention-configurations", async (c: Context) => {
  const name = c.req.query("name");
  const client = getClient();
  const result = await client.send(new DescribeRetentionConfigurationsCommand({
    ConfigurationName: name || undefined,
  } as any));
  const configurations = result.RetentionConfigurations || [];
  return c.json({ retentionConfigurations: configurations, total: configurations.length });
});

router.put("/retention-configurations", async (c: Context) => {
  const body = await c.req.json<{ retentionPeriodInDays?: number }>();
  if (!body.retentionPeriodInDays || typeof body.retentionPeriodInDays !== "number") {
    return c.json({ error: "retentionPeriodInDays must be a positive number" }, 400);
  }
  const client = getClient();
  const result = await client.send(
    new PutRetentionConfigurationCommand({ RetentionPeriodInDays: body.retentionPeriodInDays })
  );
  return c.json({ retentionConfiguration: result.RetentionConfiguration || null, created: true }, 201);
});

router.delete("/retention-configurations/:name", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  await client.send(new DeleteRetentionConfigurationCommand({ ConfigurationName: name } as any));
  return c.json({ deleted: true });
});

// ── Evaluation Results (delete) ─────────────────────────

router.delete("/rules/:name/evaluation-results", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  await client.send(new DeleteEvaluationResultsCommand({ ConfigRuleName: name }));
  return c.json({ deleted: true });
});

// ── Compliance ──────────────────────────────────────────

router.get("/compliance-by-resource", async (c: Context) => {
  const resourceId = c.req.query("resourceId");
  const resourceType = c.req.query("resourceType");
  const complianceTypes = c.req.query("complianceTypes");
  const client = getClient();
  const result = await client.send(new DescribeComplianceByResourceCommand({
    ResourceId: resourceId || undefined,
    ResourceType: resourceType || undefined,
    ComplianceTypes: complianceTypes ? complianceTypes.split(",") : undefined,
  } as any));
  const compliance = result.ComplianceByResources || [];
  return c.json({ compliance, total: compliance.length });
});

router.get("/compliance-details/by-rule/:name", async (c: Context) => {
  const name = c.req.param("name");
  const complianceTypes = c.req.query("complianceTypes");
  const client = getClient();
  const result = await client.send(new GetComplianceDetailsByConfigRuleCommand({
    ConfigRuleName: name,
    ComplianceTypes: complianceTypes ? complianceTypes.split(",") : undefined,
  } as any));
  const evaluationResults = result.EvaluationResults || [];
  return c.json({ evaluationResults, total: evaluationResults.length });
});

router.get("/compliance-details/by-resource", async (c: Context) => {
  const resourceId = c.req.query("resourceId");
  const resourceType = c.req.query("resourceType");
  if (!resourceId) return c.json({ error: "resourceId query parameter required" }, 400);
  if (!resourceType) return c.json({ error: "resourceType query parameter required" }, 400);
  const client = getClient();
  const result = await client.send(new GetComplianceDetailsByResourceCommand({
    ResourceId: resourceId,
    ResourceType: resourceType,
  }));
  const evaluationResults = result.EvaluationResults || [];
  return c.json({ evaluationResults, total: evaluationResults.length });
});

router.get("/compliance-summary/by-config-rule", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new GetComplianceSummaryByConfigRuleCommand({}));
  return c.json({ complianceSummary: result.ComplianceSummary || null });
});

router.get("/compliance-summary/by-resource-type", async (c: Context) => {
  const resourceTypes = c.req.query("resourceTypes");
  const client = getClient();
  const result = await client.send(new GetComplianceSummaryByResourceTypeCommand({
    ResourceTypes: resourceTypes ? resourceTypes.split(",") : undefined,
  } as any));
  const summaries = result.ComplianceSummariesByResourceType || [];
  return c.json({ summaries, total: summaries.length });
});

export default router;
