import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { CostAndUsageReportServiceClient } from "@aws-sdk/client-cost-and-usage-report-service";
import {
  PutReportDefinitionCommand,
  DescribeReportDefinitionsCommand,
  ModifyReportDefinitionCommand,
  DeleteReportDefinitionCommand,
  TagResourceCommand,
  UntagResourceCommand,
  ListTagsForResourceCommand,
} from "@aws-sdk/client-cost-and-usage-report-service";

const router = new Hono();
const getClient = () => create(CostAndUsageReportServiceClient);

router.get("/report-definitions", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new DescribeReportDefinitionsCommand({}));
  return c.json({
    reportDefinitions: result.ReportDefinitions || [],
    total: (result.ReportDefinitions || []).length,
  });
});

router.post("/report-definitions", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.reportName) return c.json({ error: "reportName is required" }, 400);
  if (!body.timeUnit) return c.json({ error: "timeUnit is required" }, 400);
  if (!body.s3Bucket) return c.json({ error: "s3Bucket is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new PutReportDefinitionCommand({
      ReportDefinition: {
        ReportName: body.reportName,
        TimeUnit: body.timeUnit,
        Format: body.format || "textORcsv",
        Compression: body.compression || "GZIP",
        S3Bucket: body.s3Bucket,
        S3Prefix: body.s3Prefix || "",
        S3Region: body.s3Region || "us-east-1",
        AdditionalSchemaElements: body.additionalSchemaElements || [],
        AdditionalArtifacts: body.additionalArtifacts,
        RefreshClosedReports: body.refreshClosedReports,
        ReportVersioning: body.reportVersioning,
      },
    })
  );
  return c.json({ reportName: body.reportName, created: true }, 201);
});

router.put("/report-definitions", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.reportName) return c.json({ error: "reportName is required" }, 400);
  if (!body.timeUnit) return c.json({ error: "timeUnit is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new ModifyReportDefinitionCommand({
      ReportName: body.reportName,
      ReportDefinition: {
        ReportName: body.reportName,
        TimeUnit: body.timeUnit,
        Format: body.format || "textORcsv",
        Compression: body.compression || "GZIP",
        S3Bucket: body.s3Bucket || "",
        S3Prefix: body.s3Prefix || "",
        S3Region: body.s3Region || "us-east-1",
        AdditionalSchemaElements: body.additionalSchemaElements || [],
        AdditionalArtifacts: body.additionalArtifacts,
        RefreshClosedReports: body.refreshClosedReports,
        ReportVersioning: body.reportVersioning,
      },
    })
  );
  return c.json({ modified: true });
});

router.post("/report-definitions/delete", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.reportName) return c.json({ error: "reportName is required" }, 400);

  const client = getClient();
  const result = await client.send(new DeleteReportDefinitionCommand({ ReportName: body.reportName }));
  return c.json({ deleted: true, reportName: body.reportName });
});

router.get("/tags", async (c: Context) => {
  const reportName = c.req.query("reportName");
  if (!reportName) return c.json({ error: "reportName query param required" }, 400);

  const client = getClient();
  const result = await client.send(new ListTagsForResourceCommand({ ReportName: reportName }));
  return c.json({ tags: result.Tags || [] });
});

router.post("/tags", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.reportName) return c.json({ error: "reportName is required" }, 400);
  if (!body.tags) return c.json({ error: "tags is required" }, 400);

  const client = getClient();
  const result = await client.send(new TagResourceCommand({ ReportName: body.reportName, Tags: body.tags }));
  return c.json({ tagged: true });
});

router.post("/tags/untag", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.reportName) return c.json({ error: "reportName is required" }, 400);
  if (!body.tagKeys) return c.json({ error: "tagKeys is required" }, 400);

  const client = getClient();
  const result = await client.send(new UntagResourceCommand({ ReportName: body.reportName, TagKeys: body.tagKeys }));
  return c.json({ untagged: true });
});

export default router;
