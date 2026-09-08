import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { ConnectClient } from "@aws-sdk/client-connect";
import {
  CreateInstanceCommand,
  ListInstancesCommand,
  DescribeInstanceCommand,
  DeleteInstanceCommand,
  UpdateInstanceAttributeCommand,
  DescribeInstanceAttributeCommand,
  ListInstanceAttributesCommand,
  AssociateInstanceStorageConfigCommand,
  DescribeInstanceStorageConfigCommand,
  UpdateInstanceStorageConfigCommand,
  DisassociateInstanceStorageConfigCommand,
  ListInstanceStorageConfigsCommand,
} from "@aws-sdk/client-connect";

const router = new Hono();
const getClient = () => create(ConnectClient);

router.get("/instances", async (c: Context) => {
  const result: any = await getClient().send(new ListInstancesCommand({}));
  return c.json({
    instances: result.InstanceSummaryList || [],
    total: result.InstanceSummaryList?.length || 0,
  });
});

router.post("/instances", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.IdentityManagementType) {
    return c.json({ error: "IdentityManagementType is required" }, 400);
  }
  const result: any = await getClient().send(
    new CreateInstanceCommand({
      IdentityManagementType: body.IdentityManagementType,
      InstanceAlias: body.InstanceAlias,
      DirectoryId: body.DirectoryId,
      InboundCallsEnabled: body.InboundCallsEnabled,
      OutboundCallsEnabled: body.OutboundCallsEnabled,
      Tags: body.Tags,
    })
  );
  return c.json({ id: result.Id, arn: result.Arn }, 201);
});

router.get("/instances/:instanceId", async (c: Context) => {
  const result: any = await getClient().send(
    new DescribeInstanceCommand({ InstanceId: c.req.param("instanceId") })
  );
  return c.json({ instance: result.Instance });
});

router.delete("/instances/:instanceId", async (c: Context) => {
  await getClient().send(
    new DeleteInstanceCommand({ InstanceId: c.req.param("instanceId") })
  );
  return c.json({ deleted: true });
});

router.get("/instances/:instanceId/attributes", async (c: Context) => {
  const result: any = await getClient().send(
    new ListInstanceAttributesCommand({ InstanceId: c.req.param("instanceId") })
  );
  return c.json({
    attributes: result.Attributes || [],
    total: result.Attributes?.length || 0,
  });
});

router.get("/instances/:instanceId/attribute/:attributeType", async (c: Context) => {
  const result: any = await getClient().send(
    new DescribeInstanceAttributeCommand({
      InstanceId: c.req.param("instanceId"),
      AttributeType: c.req.param("attributeType") as any,
    })
  );
  return c.json({ attribute: result.Attribute });
});

router.put("/instances/:instanceId/attribute/:attributeType", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.Value) return c.json({ error: "Value is required" }, 400);
  await getClient().send(
    new UpdateInstanceAttributeCommand({
      InstanceId: c.req.param("instanceId"),
      AttributeType: c.req.param("attributeType") as any,
      Value: body.Value,
    })
  );
  return c.json({ updated: true });
});

router.get("/instances/:instanceId/storage-configs", async (c: Context) => {
  const resourceType = c.req.query("resourceType");
  const result: any = await getClient().send(
    new ListInstanceStorageConfigsCommand({
      InstanceId: c.req.param("instanceId"),
      ResourceType: resourceType as any,
    })
  );
  return c.json({
    storageConfigs: result.StorageConfigs || [],
    total: result.StorageConfigs?.length || 0,
  });
});

router.post("/instances/:instanceId/storage-configs", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.ResourceType || !body.StorageConfig) {
    return c.json({ error: "ResourceType and StorageConfig are required" }, 400);
  }
  const result: any = await getClient().send(
    new AssociateInstanceStorageConfigCommand({
      InstanceId: c.req.param("instanceId"),
      ResourceType: body.ResourceType,
      StorageConfig: body.StorageConfig,
    })
  );
  return c.json({ associationId: result.AssociationId }, 201);
});

router.get("/instances/:instanceId/storage-configs/:associationId", async (c: Context) => {
  const resourceType = c.req.query("resourceType");
  const result: any = await getClient().send(
    new DescribeInstanceStorageConfigCommand({
      InstanceId: c.req.param("instanceId"),
      AssociationId: c.req.param("associationId"),
      ResourceType: resourceType as any,
    })
  );
  return c.json({ storageConfig: result.StorageConfig });
});

router.put("/instances/:instanceId/storage-configs/:associationId", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.ResourceType || !body.StorageConfig) {
    return c.json({ error: "ResourceType and StorageConfig are required" }, 400);
  }
  await getClient().send(
    new UpdateInstanceStorageConfigCommand({
      InstanceId: c.req.param("instanceId"),
      AssociationId: c.req.param("associationId"),
      ResourceType: body.ResourceType,
      StorageConfig: body.StorageConfig,
    })
  );
  return c.json({ updated: true });
});

router.delete("/instances/:instanceId/storage-configs/:associationId", async (c: Context) => {
  const resourceType = c.req.query("resourceType");
  await getClient().send(
    new DisassociateInstanceStorageConfigCommand({
      InstanceId: c.req.param("instanceId"),
      AssociationId: c.req.param("associationId"),
      ResourceType: resourceType as any,
    })
  );
  return c.json({ disassociated: true });
});

export default router;
