import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import {
  CloudHSMV2Client,
  DescribeClustersCommand,
  CreateClusterCommand,
  DeleteClusterCommand,
  DescribeBackupsCommand,
  DeleteBackupCommand,
} from "@aws-sdk/client-cloudhsm-v2";

const router = new Hono();
const getClient = () => create(CloudHSMV2Client);

router.get("/clusters", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new DescribeClustersCommand({}));
  const clusters = result.Clusters || [];
/* istanbul ignore next */
  return c.json({ clusters, total: clusters.length, nextToken: result.NextToken ?? null });
});

router.get("/clusters/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const client = getClient();
  const result = await client.send(
    new DescribeClustersCommand({ Filters: { clusterIds: [id] } })
  );
  const cluster = (result.Clusters || [])[0];
  return c.json({
    cluster: cluster
      ? {
          clusterId: cluster.ClusterId ?? null,
          state: cluster.State ?? null,
          hsmType: cluster.HsmType ?? null,
          subnetMapping: cluster.SubnetMapping ?? {},
          vpcId: cluster.VpcId ?? null,
          hsmCount: cluster.Hsms ? Object.keys(cluster.Hsms).length : 0,
          securityGroup: cluster.SecurityGroup ?? null,
          createTimestamp: String(cluster.CreateTimestamp ?? ""),
          backupRetentionPolicy: cluster.BackupRetentionPolicy ?? null,
        }
      : null,
  });
});

router.post("/clusters", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.hsmType) return c.json({ error: "hsmType is required" }, 400);
  if (!body.subnetIds?.length) return c.json({ error: "subnetIds are required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateClusterCommand({
      HsmType: body.hsmType,
      SubnetIds: body.subnetIds,
      BackupRetentionPolicy: body.backupRetentionPolicy,
      TagList: body.tagList,
    })
  );
  return c.json({ clusterId: result.Cluster?.ClusterId, state: result.Cluster?.State }, 201);
});

router.delete("/clusters/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const body = await c.req.json<any>().catch(() => ({}));
  const client = getClient();
  const result = await client.send(
    new DeleteClusterCommand({ ClusterId: id })
  );
  return c.json({
    clusterId: result.Cluster?.ClusterId ?? id,
    state: result.Cluster?.State ?? null,
  });
});

router.get("/backups", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new DescribeBackupsCommand({}));
  const backups = result.Backups || [];
  return c.json({
    backups: backups.map((b: any) => ({
      backupId: b.BackupId ?? null,
      clusterId: b.ClusterId ?? null,
      state: b.BackupState ?? null,
      createTimestamp: String(b.CreateTimestamp ?? ""),
      neverExpires: b.NeverExpires ?? false,
    })),
    total: backups.length,
    nextToken: result.NextToken ?? null,
  });
});

router.delete("/backups/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const client = getClient();
  const result = await client.send(new DeleteBackupCommand({ BackupId: id }));
  return c.json({
    backupId: result.Backup?.BackupId ?? id,
    state: result.Backup?.BackupState ?? null,
  });
});

export default router;
