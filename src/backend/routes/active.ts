import { Hono } from "hono";
import type { Context } from "hono";
import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb";
import { RDSClient, DescribeDBInstancesCommand } from "@aws-sdk/client-rds";
import { EC2Client, DescribeInstancesCommand } from "@aws-sdk/client-ec2";
import { getAwsConfig } from "../clients/aws";

const router = new Hono();

router.get("/", async (c: Context) => {
  const config = getAwsConfig();
  let activeCount = 0;
  const activeServices: string[] = [];

  // Check S3
  try {
    const s3 = new S3Client({ ...config, forcePathStyle: true });
    const buckets = await s3.send(new ListBucketsCommand({}));
    if ((buckets.Buckets?.length ?? 0) > 0) {
      activeCount++;
      activeServices.push("s3");
    }
  } catch { /* service not available */ }

  // Check DynamoDB
  try {
    const ddb = new DynamoDBClient(config);
    const tables = await ddb.send(new ListTablesCommand({}));
    if ((tables.TableNames?.length ?? 0) > 0) {
      activeCount++;
      activeServices.push("dynamodb");
    }
  } catch { /* service not available */ }

  // Check RDS
  try {
    const rds = new RDSClient(config);
    const instances = await rds.send(new DescribeDBInstancesCommand({}));
    if ((instances.DBInstances?.length ?? 0) > 0) {
      activeCount++;
      activeServices.push("rds");
    }
  } catch { /* service not available */ }

  // Check EC2
  try {
    const ec2 = new EC2Client(config);
    const instances = await ec2.send(new DescribeInstancesCommand({}));
    const totalInstances = (instances.Reservations || []).reduce(
      (sum, r) => sum + (r.Instances?.length || 0),
      0
    );
    if (totalInstances > 0) {
      activeCount++;
      activeServices.push("ec2");
    }
  } catch { /* service not available */ }

  return c.json({ activeCount, activeServices });
});

export default router;
