import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import {
  RedshiftClient,
  CreateClusterCommand,
  DescribeClustersCommand,
  DeleteClusterCommand,
  ModifyClusterCommand,
  RebootClusterCommand,
  CreateClusterSnapshotCommand,
  DescribeClusterSnapshotsCommand,
  DeleteClusterSnapshotCommand,
  RestoreFromClusterSnapshotCommand,
  CreateClusterParameterGroupCommand,
  DescribeClusterParameterGroupsCommand,
  DescribeClusterParametersCommand,
  ModifyClusterParameterGroupCommand,
  DeleteClusterParameterGroupCommand,
  CreateClusterSubnetGroupCommand,
  DescribeClusterSubnetGroupsCommand,
  ModifyClusterSubnetGroupCommand,
  DeleteClusterSubnetGroupCommand,
  CreateTagsCommand,
  DeleteTagsCommand,
  DescribeTagsCommand,
} from "@aws-sdk/client-redshift";

const router = new Hono();
const getClient = () => create(RedshiftClient);

router.get("/clusters", async (c: Context) => {
  const identifier = c.req.query("identifier");
  const result: any = await getClient().send(
    new DescribeClustersCommand({ ClusterIdentifier: identifier || undefined })
  );
  return c.json({
    clusters: result.Clusters || [],
    total: result.Clusters?.length || 0,
  });
});

router.post("/clusters", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.identifier || !body.nodeType || !body.masterUsername || !body.masterUserPassword) {
    return c.json(
      { error: "identifier, nodeType, masterUsername and masterUserPassword are required" },
      400
    );
  }
  const result: any = await getClient().send(
    new CreateClusterCommand({
      ClusterIdentifier: body.identifier,
      NodeType: body.nodeType,
      MasterUsername: body.masterUsername,
      MasterUserPassword: body.masterUserPassword,
      ClusterSubnetGroupName: body.subnetGroupName,
      VpcSecurityGroupIds: body.vpcSecurityGroupIds,
      NumberOfNodes: body.numberOfNodes,
    })
  );
  return c.json({ cluster: result.Cluster }, 201);
});

router.put("/clusters/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const body = await c.req.json<any>();
  const result: any = await getClient().send(
    new ModifyClusterCommand({
      ClusterIdentifier: id,
      NodeType: body.nodeType,
      NumberOfNodes: body.numberOfNodes,
      ClusterSecurityGroups: body.securityGroups,
      MasterUserPassword: body.masterUserPassword,
    })
  );
  return c.json({ cluster: result.Cluster });
});

router.post("/clusters/:id/reboot", async (c: Context) => {
  const id = c.req.param("id")!;
  const result: any = await getClient().send(new RebootClusterCommand({ ClusterIdentifier: id }));
  return c.json({ cluster: result.Cluster });
});

router.delete("/clusters/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  await getClient().send(new DeleteClusterCommand({ ClusterIdentifier: id }));
  return c.json({ deleted: true });
});

router.get("/snapshots", async (c: Context) => {
  const identifier = c.req.query("identifier");
  const result: any = await getClient().send(
    new DescribeClusterSnapshotsCommand({ ClusterIdentifier: identifier || undefined })
  );
  return c.json({
    snapshots: result.Snapshots || [],
    total: result.Snapshots?.length || 0,
  });
});

router.post("/snapshots", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.identifier || !body.snapshotIdentifier) {
    return c.json({ error: "identifier and snapshotIdentifier are required" }, 400);
  }
  const result: any = await getClient().send(
    new CreateClusterSnapshotCommand({
      ClusterIdentifier: body.identifier,
      SnapshotIdentifier: body.snapshotIdentifier,
    })
  );
  return c.json({ snapshot: result.Snapshot }, 201);
});

router.delete("/snapshots/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const result: any = await getClient().send(
    new DeleteClusterSnapshotCommand({ SnapshotIdentifier: id })
  );
  return c.json({ snapshot: result.Snapshot });
});

router.post("/snapshots/restore", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.snapshotIdentifier || !body.targetIdentifier) {
    return c.json({ error: "snapshotIdentifier and targetIdentifier are required" }, 400);
  }
  const result: any = await getClient().send(
    new RestoreFromClusterSnapshotCommand({
      SnapshotIdentifier: body.snapshotIdentifier,
      ClusterIdentifier: body.targetIdentifier,
      NodeType: body.nodeType,
    })
  );
  return c.json({ cluster: result.Cluster }, 201);
});

router.get("/parameter-groups", async (c: Context) => {
  const name = c.req.query("name");
  const result: any = await getClient().send(
    new DescribeClusterParameterGroupsCommand({ ParameterGroupName: name || undefined })
  );
  return c.json({
    parameterGroups: result.ParameterGroups || [],
    total: result.ParameterGroups?.length || 0,
  });
});

router.post("/parameter-groups", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.name || !body.family) {
    return c.json({ error: "name and family are required" }, 400);
  }
  const result: any = await getClient().send(
    new CreateClusterParameterGroupCommand({
      ParameterGroupName: body.name,
      ParameterGroupFamily: body.family,
      Description: body.description,
    })
  );
  return c.json({ parameterGroup: result.ParameterGroup }, 201);
});

router.get("/parameter-groups/:name/parameters", async (c: Context) => {
  const name = c.req.param("name")!;
  const result: any = await getClient().send(
    new DescribeClusterParametersCommand({ ParameterGroupName: name })
  );
  return c.json({
    parameters: result.Parameters || [],
    total: result.Parameters?.length || 0,
  });
});

router.put("/parameter-groups/:name", async (c: Context) => {
  const name = c.req.param("name")!;
  const body = await c.req.json<any>();
  if (!Array.isArray(body.parameters)) {
    return c.json({ error: "parameters array is required" }, 400);
  }
  await getClient().send(
    new ModifyClusterParameterGroupCommand({
      ParameterGroupName: name,
      Parameters: body.parameters.map((p: any) => ({
        ParameterName: p.name,
        ParameterValue: p.value,
      })),
    })
  );
  return c.json({ updated: true });
});

router.delete("/parameter-groups/:name", async (c: Context) => {
  const name = c.req.param("name")!;
  await getClient().send(
    new DeleteClusterParameterGroupCommand({ ParameterGroupName: name })
  );
  return c.json({ deleted: true });
});

router.get("/subnet-groups", async (c: Context) => {
  const name = c.req.query("name");
  const result: any = await getClient().send(
    new DescribeClusterSubnetGroupsCommand({ ClusterSubnetGroupName: name || undefined })
  );
  return c.json({
    subnetGroups: result.ClusterSubnetGroups || [],
    total: result.ClusterSubnetGroups?.length || 0,
  });
});

router.post("/subnet-groups", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.name || !body.subnetIds) {
    return c.json({ error: "name and subnetIds are required" }, 400);
  }
  const result: any = await getClient().send(
    new CreateClusterSubnetGroupCommand({
      ClusterSubnetGroupName: body.name,
      SubnetIds: body.subnetIds,
      Description: body.description,
    })
  );
  return c.json({ subnetGroup: result.ClusterSubnetGroup }, 201);
});

router.put("/subnet-groups/:name", async (c: Context) => {
  const name = c.req.param("name")!;
  const body = await c.req.json<any>();
  if (!Array.isArray(body.subnetIds)) {
    return c.json({ error: "subnetIds array is required" }, 400);
  }
  const result: any = await getClient().send(
    new ModifyClusterSubnetGroupCommand({
      ClusterSubnetGroupName: name,
      SubnetIds: body.subnetIds,
      Description: body.description,
    })
  );
  return c.json({ subnetGroup: result.ClusterSubnetGroup });
});

router.delete("/subnet-groups/:name", async (c: Context) => {
  const name = c.req.param("name")!;
  await getClient().send(
    new DeleteClusterSubnetGroupCommand({ ClusterSubnetGroupName: name })
  );
  return c.json({ deleted: true });
});

router.post("/tags", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.resourceName || !body.tags) {
    return c.json({ error: "resourceName and tags are required" }, 400);
  }
  await getClient().send(
    new CreateTagsCommand({
      ResourceName: body.resourceName,
      Tags: body.tags.map((t: any) => ({ Key: t.key, Value: t.value })),
    })
  );
  return c.json({ tagged: true });
});

router.post("/tags/untag", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.resourceName || !body.tagKeys) {
    return c.json({ error: "resourceName and tagKeys are required" }, 400);
  }
  await getClient().send(
    new DeleteTagsCommand({ ResourceName: body.resourceName, TagKeys: body.tagKeys })
  );
  return c.json({ untagged: true });
});

router.get("/tags", async (c: Context) => {
  const result: any = await getClient().send(new DescribeTagsCommand({}));
  return c.json({ taggedResources: result.TaggedResources || [], total: result.TaggedResources?.length || 0 });
});

export default router;
