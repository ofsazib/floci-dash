import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { EKSClient } from "@aws-sdk/client-eks";
/* istanbul ignore start */
import {
  ListClustersCommand,
  CreateClusterCommand,
  DescribeClusterCommand,
  DeleteClusterCommand,
  ListNodegroupsCommand,
  CreateNodegroupCommand,
  DescribeNodegroupCommand,
  DeleteNodegroupCommand,
  ListFargateProfilesCommand,
  CreateFargateProfileCommand,
  DescribeFargateProfileCommand,
  DeleteFargateProfileCommand,
  ListAccessEntriesCommand,
  CreateAccessEntryCommand,
  DescribeAccessEntryCommand,
  DeleteAccessEntryCommand,
  ListAddonsCommand,
  DescribeAddonCommand,
  CreateAddonCommand,
  DeleteAddonCommand,
  UpdateAddonCommand,
  ListIdentityProviderConfigsCommand,
  DescribeIdentityProviderConfigCommand,
  AssociateIdentityProviderConfigCommand,
  DisassociateIdentityProviderConfigCommand,
  ListPodIdentityAssociationsCommand,
  DescribePodIdentityAssociationCommand,
  CreatePodIdentityAssociationCommand,
  DeletePodIdentityAssociationCommand,
  UpdatePodIdentityAssociationCommand,
} from "@aws-sdk/client-eks";
/* istanbul ignore end */

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

// ── Fargate Profiles ──────────────────────────────────

router.get("/clusters/:name/fargate-profiles", async (c: Context) => {
  const clusterName = c.req.param("name");
  const client = getClient();
  const result = await client.send(new ListFargateProfilesCommand({ clusterName }));
  const profiles = result.fargateProfileNames || [];
/* istanbul ignore next */
  if (!profiles.length) return c.json({ profiles: [], total: 0 });
  const detailed = await Promise.all(
    profiles.map((fpName) => client.send(new DescribeFargateProfileCommand({ clusterName, fargateProfileName: fpName })))
  );
  return c.json({ profiles: detailed.map((r) => r.fargateProfile).filter(Boolean), total: profiles.length });
});

router.post("/clusters/:name/fargate-profiles", async (c: Context) => {
  const clusterName = c.req.param("name");
  const body = await c.req.json<{ fargateProfileName: string; podExecutionRoleArn: string; subnets: string[]; selectors: any[] }>();
  if (!body.fargateProfileName) return c.json({ error: "fargateProfileName is required" }, 400);
  if (!body.podExecutionRoleArn) return c.json({ error: "podExecutionRoleArn is required" }, 400);
  const client = getClient();
  const result = await client.send(new CreateFargateProfileCommand({ clusterName, ...body }));
  return c.json({ fargateProfile: result.fargateProfile }, 201);
});

router.get("/clusters/:name/fargate-profiles/:fpName", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new DescribeFargateProfileCommand({
    clusterName: c.req.param("name")!,
    fargateProfileName: c.req.param("fpName")!,
  }));
  return c.json({ fargateProfile: result.fargateProfile });
});

router.delete("/clusters/:name/fargate-profiles/:fpName", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new DeleteFargateProfileCommand({
    clusterName: c.req.param("name")!,
    fargateProfileName: c.req.param("fpName")!,
  }));
  return c.json({ fargateProfile: result.fargateProfile, deleted: true });
});

// ── Access Entries ──────────────────────────────────────

router.get("/clusters/:name/access-entries", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListAccessEntriesCommand({ clusterName: c.req.param("name")! }));
  return c.json({ accessEntries: result.accessEntries || [] });
});

router.post("/clusters/:name/access-entries", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.principalArn) return c.json({ error: "principalArn is required" }, 400);
  const client = getClient();
  const result = await client.send(new CreateAccessEntryCommand({ clusterName: c.req.param("name")!, ...body }));
  return c.json({ accessEntry: result.accessEntry }, 201);
});

router.get("/clusters/:name/access-entries/:principalArn", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new DescribeAccessEntryCommand({
    clusterName: c.req.param("name")!,
    principalArn: decodeURIComponent(c.req.param("principalArn")!),
  }));
  return c.json({ accessEntry: result.accessEntry });
});

router.delete("/clusters/:name/access-entries/:principalArn", async (c: Context) => {
  const client = getClient();
  await client.send(new DeleteAccessEntryCommand({
    clusterName: c.req.param("name")!,
    principalArn: decodeURIComponent(c.req.param("principalArn")!),
  }));
  return c.json({ deleted: true });
});

// ── Addons ──────────────────────────────────────────────

router.get("/clusters/:name/addons", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListAddonsCommand({ clusterName: c.req.param("name")! }));
  return c.json({ addons: result.addons || [] });
});

router.get("/clusters/:name/addons/:addonName", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new DescribeAddonCommand({
    clusterName: c.req.param("name")!,
    addonName: c.req.param("addonName")!,
  }));
  return c.json({ addon: result.addon });
});

router.post("/clusters/:name/addons", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.addonName) return c.json({ error: "addonName is required" }, 400);
  const client = getClient();
  const result = await client.send(new CreateAddonCommand({ clusterName: c.req.param("name")!, ...body }));
  return c.json({ addon: result.addon }, 201);
});

router.put("/clusters/:name/addons/:addonName", async (c: Context) => {
  const body = await c.req.json<any>();
  const client = getClient();
  const result = await client.send(new UpdateAddonCommand({
    clusterName: c.req.param("name")!,
    addonName: c.req.param("addonName")!,
    ...body,
  }));
  return c.json({ update: result.update });
});

router.delete("/clusters/:name/addons/:addonName", async (c: Context) => {
  const client = getClient();
  await client.send(new DeleteAddonCommand({
    clusterName: c.req.param("name")!,
    addonName: c.req.param("addonName")!,
  }));
  return c.json({ deleted: true });
});

// ── Identity Provider Configs ───────────────────────────

router.get("/clusters/:name/identity-providers", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListIdentityProviderConfigsCommand({ clusterName: c.req.param("name")! }));
  return c.json({ identityProviderConfigs: result.identityProviderConfigs || [] });
});

router.get("/clusters/:name/identity-providers/:idpName", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new DescribeIdentityProviderConfigCommand({
    clusterName: c.req.param("name")!,
    identityProviderConfig: { name: c.req.param("idpName")!, type: "oidc" },
  }));
  return c.json({ identityProviderConfig: result.identityProviderConfig });
});

router.post("/clusters/:name/identity-providers", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.oidc?.issuer) return c.json({ error: "oidc.issuer is required" }, 400);
  const client = getClient();
  const result = await client.send(new AssociateIdentityProviderConfigCommand({
    clusterName: c.req.param("name")!,
    oidc: body.oidc,
    tags: body.tags,
  }));
  return c.json({ update: result.update, tags: result.tags }, 201);
});

router.delete("/clusters/:name/identity-providers/:idpName", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new DisassociateIdentityProviderConfigCommand({
    clusterName: c.req.param("name")!,
    identityProviderConfig: { name: c.req.param("idpName")!, type: "oidc" },
  }));
  return c.json({ update: result.update, deleted: true });
});

// ── Pod Identity Associations ───────────────────────────

router.get("/clusters/:name/pod-identity-associations", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListPodIdentityAssociationsCommand({ clusterName: c.req.param("name")! }));
  return c.json({ associations: result.associations || [] });
});

router.get("/clusters/:name/pod-identity-associations/:assocId", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new DescribePodIdentityAssociationCommand({
    clusterName: c.req.param("name")!,
    associationId: c.req.param("assocId")!,
  }));
  return c.json({ association: result.association });
});

router.post("/clusters/:name/pod-identity-associations", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.roleArn) return c.json({ error: "roleArn is required" }, 400);
  if (!body.serviceAccount) return c.json({ error: "serviceAccount is required" }, 400);
  const client = getClient();
  const result = await client.send(new CreatePodIdentityAssociationCommand({
    clusterName: c.req.param("name")!,
    ...body,
  }));
  return c.json({ association: result.association }, 201);
});

router.put("/clusters/:name/pod-identity-associations/:assocId", async (c: Context) => {
  const body = await c.req.json<any>();
  const client = getClient();
  const result = await client.send(new UpdatePodIdentityAssociationCommand({
    clusterName: c.req.param("name")!,
    associationId: c.req.param("assocId")!,
    ...body,
  }));
  return c.json({ association: result.association });
});

router.delete("/clusters/:name/pod-identity-associations/:assocId", async (c: Context) => {
  const client = getClient();
  await client.send(new DeletePodIdentityAssociationCommand({
    clusterName: c.req.param("name")!,
    associationId: c.req.param("assocId")!,
  }));
  return c.json({ deleted: true });
});

export default router;
