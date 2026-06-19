import { Hono } from "hono";
import type { Context } from "hono";
import { flociFetch } from "../clients/floci";
import { getAwsConfig } from "../clients/aws";
import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb";
import { EC2Client, DescribeInstancesCommand } from "@aws-sdk/client-ec2";
import { LambdaClient, ListFunctionsCommand } from "@aws-sdk/client-lambda";
import { RDSClient, DescribeDBInstancesCommand } from "@aws-sdk/client-rds";
import { SQSClient, ListQueuesCommand } from "@aws-sdk/client-sqs";
import { SNSClient, ListTopicsCommand } from "@aws-sdk/client-sns";
import { KMSClient, ListKeysCommand } from "@aws-sdk/client-kms";
import { CloudWatchClient, DescribeAlarmsCommand } from "@aws-sdk/client-cloudwatch";
import type { HealthResponse, InitResponse, InfoResponse } from "../types";

const router = new Hono();

router.get("/health", async (c: Context) => {
  const health = await flociFetch("/_floci/health") as any;
  const info = await flociFetch("/_floci/info") as InfoResponse;

  const services = health.services as Record<string, string>;
  const running = Object.values(services).filter((s: string) => s === "running").length;
  const total = Object.keys(services).length;

  const result: HealthResponse = {
    services: health.services,
    edition: health.edition || info.edition,
    original_edition: health.original_edition || info.original_edition,
    version: info.version || health.version,
    stats: { total, running, available: total - running },
  };

  return c.json(result);
});

router.get("/init", async (c: Context) => {
  const data = await flociFetch("/_floci/init") as InitResponse;
  return c.json(data);
});

router.get("/resource-counts", async (c: Context) => {
  const config = getAwsConfig();
  const counts: Record<string, number> = {};

  const checks = [
    { name: "s3", exec: async () => { const s3 = new S3Client({ ...config, forcePathStyle: true }); const r = await s3.send(new ListBucketsCommand({})); return r.Buckets?.length ?? 0; }},
    { name: "dynamodb", exec: async () => { const ddb = new DynamoDBClient(config); const r = await ddb.send(new ListTablesCommand({})); return r.TableNames?.length ?? 0; }},
    { name: "ec2", exec: async () => { const ec2 = new EC2Client(config); const r = await ec2.send(new DescribeInstancesCommand({})); return (r.Reservations || []).reduce((s: number, x: any) => s + (x.Instances?.length || 0), 0); }},
    { name: "lambda", exec: async () => { const l = new LambdaClient(config); const r = await l.send(new ListFunctionsCommand({})); return r.Functions?.length ?? 0; }},
    { name: "rds", exec: async () => { const rds = new RDSClient(config); const r = await rds.send(new DescribeDBInstancesCommand({})); return r.DBInstances?.length ?? 0; }},
    { name: "sqs", exec: async () => { const sqs = new SQSClient(config); const r = await sqs.send(new ListQueuesCommand({})); return r.QueueUrls?.length ?? 0; }},
    { name: "sns", exec: async () => { const sns = new SNSClient(config); const r = await sns.send(new ListTopicsCommand({})); return r.Topics?.length ?? 0; }},
    { name: "kms", exec: async () => { const kms = new KMSClient(config); const r = await kms.send(new ListKeysCommand({})); return r.Keys?.length ?? 0; }},
    { name: "cloudwatch", exec: async () => { const cw = new CloudWatchClient(config); const r = await cw.send(new DescribeAlarmsCommand({})); return r.MetricAlarms?.length ?? 0; }},
  ];

  for (const check of checks) {
    try {
      counts[check.name] = await check.exec();
    } catch {
      counts[check.name] = 0;
    }
  }

  return c.json(counts);
});

export default router;
