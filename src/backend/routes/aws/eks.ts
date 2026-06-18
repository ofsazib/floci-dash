import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { EKSClient } from "@aws-sdk/client-eks";
import {
  ListClustersCommand,
  CreateClusterCommand,
  DescribeClusterCommand,
  DeleteClusterCommand,
  ListNodegroupsCommand,
  CreateNodegroupCommand,
  DescribeNodegroupCommand,
  DeleteNodegroupCommand,
} from "@aws-sdk/client-eks";

const router = new Hono();
const getClient = () => create(EKSClient);

// ── Clusters ─────────────────────────────────────────────

router.get("/clusters", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListClustersCommand({}));
  const clusterNames = result.clusters || [];

  if (!clusterNames.length) return c.json({ clusters: [], total: 0 });

  const detailed = await Promise.all(
    clusterNames.map((name) => client.send(new DescribeClusterCommand({ name })))
  );
  const clusters = detailed.map((r) => r.cluster).filter(Boolean);
  return c.json({ clusters, total: clusters.length });
});

router.post("/clusters", async (c: Context) => {
  const body = await c.req.json<{
    name: string;
    version?: string;
    roleArn: string;
    resourcesVpcConfig?: { subnetIds?: string[]; securityGroupIds?: string[] };
    tags?: Record<string, string>;
  }>();
  if (!body.name) return c.json({ error: "name is required" }, 400);
  if (!body.roleArn) return c.json({ error: "roleArn is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new CreateClusterCommand({
      name: body.name,
      version: body.version,
      roleArn: body.roleArn,
      resourcesVpcConfig: body.resourcesVpcConfig,
      tags: body.tags,
    })
  );
  return c.json({ cluster: result.cluster }, 201);
});

router.get("/clusters/:name", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  const result = await client.send(new DescribeClusterCommand({ name }));
  return c.json({ cluster: result.cluster });
});

router.delete("/clusters/:name", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  const result = await client.send(new DeleteClusterCommand({ name }));
  return c.json({ cluster: result.cluster, deleted: true });
});

// ── Node Groups ──────────────────────────────────────────

router.get("/clusters/:name/node-groups", async (c: Context) => {
  const clusterName = c.req.param("name");
  const client = getClient();
  const result = await client.send(new ListNodegroupsCommand({ clusterName }));
  const nodegroupNames = result.nodegroups || [];

  if (!nodegroupNames.length) return c.json({ nodegroups: [], total: 0 });

  const detailed = await Promise.all(
    nodegroupNames.map((ngName) =>
      client.send(new DescribeNodegroupCommand({ clusterName, nodegroupName: ngName }))
    )
  );
  const nodegroups = detailed.map((r) => r.nodegroup).filter(Boolean);
  return c.json({ nodegroups, total: nodegroups.length });
});

router.post("/clusters/:name/node-groups", async (c: Context) => {
  const clusterName = c.req.param("name");
  const body = await c.req.json<{
    nodegroupName: string;
    nodeRole: string;
    subnets: string[];
    instanceTypes?: string[];
    diskSize?: number;
    scalingConfig?: { minSize?: number; maxSize?: number; desiredSize?: number };
    tags?: Record<string, string>;
  }>();
  if (!body.nodegroupName) return c.json({ error: "nodegroupName is required" }, 400);
  if (!body.nodeRole) return c.json({ error: "nodeRole is required" }, 400);
  if (!body.subnets?.length) return c.json({ error: "subnets is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new CreateNodegroupCommand({
      clusterName,
      nodegroupName: body.nodegroupName,
      nodeRole: body.nodeRole,
      subnets: body.subnets,
      instanceTypes: body.instanceTypes,
      diskSize: body.diskSize,
      scalingConfig: body.scalingConfig,
      tags: body.tags,
    })
  );
  return c.json({ nodegroup: result.nodegroup }, 201);
});

router.get("/clusters/:name/node-groups/:ngName", async (c: Context) => {
  const clusterName = c.req.param("name");
  const nodegroupName = c.req.param("ngName");
  const client = getClient();
  const result = await client.send(
    new DescribeNodegroupCommand({ clusterName, nodegroupName })
  );
  return c.json({ nodegroup: result.nodegroup });
});

router.delete("/clusters/:name/node-groups/:ngName", async (c: Context) => {
  const clusterName = c.req.param("name");
  const nodegroupName = c.req.param("ngName");
  const client = getClient();
  const result = await client.send(
    new DeleteNodegroupCommand({ clusterName, nodegroupName })
  );
  return c.json({ nodegroup: result.nodegroup, deleted: true });
});

export default router;
