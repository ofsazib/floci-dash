import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { EFSClient } from "@aws-sdk/client-efs";
import {
  CreateFileSystemCommand,
  DescribeFileSystemsCommand,
  DeleteFileSystemCommand,
  UpdateFileSystemCommand,
  UpdateFileSystemProtectionCommand,
  CreateTagsCommand,
  DeleteTagsCommand,
  DescribeTagsCommand,
  ListTagsForResourceCommand,
  TagResourceCommand,
  UntagResourceCommand,
  CreateMountTargetCommand,
  DescribeMountTargetsCommand,
  DeleteMountTargetCommand,
  DescribeMountTargetSecurityGroupsCommand,
  ModifyMountTargetSecurityGroupsCommand,
  CreateAccessPointCommand,
  DescribeAccessPointsCommand,
  DeleteAccessPointCommand,
  PutFileSystemPolicyCommand,
  DescribeFileSystemPolicyCommand,
  DeleteFileSystemPolicyCommand,
  PutBackupPolicyCommand,
  DescribeBackupPolicyCommand,
  PutLifecycleConfigurationCommand,
  DescribeLifecycleConfigurationCommand,
} from "@aws-sdk/client-efs";

const router = new Hono();
const getClient = () => create(EFSClient);

const badRequest = (c: Context, msg: string) =>
  c.json({ error: msg }, 400);

// ---------- File systems ----------

router.post("/file-systems", async (c: Context) => {
  const body = await c.req.json().catch(() => ({}));
  const CreationToken = body.creationToken;
  if (!CreationToken) return badRequest(c, "creationToken is required");
  const result: any = await getClient().send(
    new CreateFileSystemCommand({
      CreationToken,
      PerformanceMode: body.performanceMode,
      Encrypted: body.encrypted,
      KmsKeyId: body.kmsKeyId,
      ThroughputMode: body.throughputMode,
      ProvisionedThroughputInMibps: body.provisionedThroughputInMibps,
      AvailabilityZoneName: body.availabilityZoneName,
      Backup: body.backup,
      Tags: body.tags,
    })
  );
  return c.json({ fileSystem: result.FileSystem || result });
});

router.get("/file-systems", async (c: Context) => {
  const result: any = await getClient().send(
    new DescribeFileSystemsCommand({
      FileSystemId: c.req.query("fileSystemId") || undefined,
      CreationToken: c.req.query("creationToken") || undefined,
    })
  );
  return c.json({
    fileSystems: result.FileSystems || [],
    total: result.FileSystems?.length || 0,
  });
});

router.delete("/file-systems/:id", async (c: Context) => {
  await getClient().send(new DeleteFileSystemCommand({ FileSystemId: c.req.param("id") }));
  return c.json({ deleted: true });
});

router.put("/file-systems/:id", async (c: Context) => {
  const body = await c.req.json().catch(() => ({}));
  const result: any = await getClient().send(
    new UpdateFileSystemCommand({
      FileSystemId: c.req.param("id"),
      ThroughputMode: body.throughputMode,
      ProvisionedThroughputInMibps: body.provisionedThroughputInMibps,
    })
  );
  return c.json({ fileSystem: result.FileSystem || result });
});

router.put("/file-systems/:id/protection", async (c: Context) => {
  const body = await c.req.json().catch(() => ({}));
  const ReplicationOverwriteProtection = body.replicationOverwriteProtection;
  if (!ReplicationOverwriteProtection) return badRequest(c, "replicationOverwriteProtection is required");
  const result: any = await getClient().send(
    new UpdateFileSystemProtectionCommand({
      FileSystemId: c.req.param("id"),
      ReplicationOverwriteProtection,
    })
  );
  return c.json({ fileSystemProtection: result.FileSystemProtection || result });
});

// ---------- Tags ----------

router.post("/file-systems/:id/tags", async (c: Context) => {
  const body = await c.req.json().catch(() => ({}));
  const tags = body.tags;
  if (!Array.isArray(tags) || tags.length === 0) return badRequest(c, "tags array is required");
  await getClient().send(
    new CreateTagsCommand({ FileSystemId: c.req.param("id"), Tags: tags })
  );
  return c.json({ created: true });
});

router.get("/file-systems/:id/tags", async (c: Context) => {
  const result: any = await getClient().send(
    new DescribeTagsCommand({ FileSystemId: c.req.param("id") })
  );
  return c.json({ tags: result.Tags || [] });
});

router.delete("/file-systems/:id/tags", async (c: Context) => {
  const body = await c.req.json().catch(() => ({}));
  const tagKeys = body.tagKeys;
  if (!Array.isArray(tagKeys) || tagKeys.length === 0) return badRequest(c, "tagKeys array is required");
  await getClient().send(
    new DeleteTagsCommand({ FileSystemId: c.req.param("id"), TagKeys: tagKeys })
  );
  return c.json({ deleted: true });
});

router.get("/resource-tags/:resourceId", async (c: Context) => {
  const result: any = await getClient().send(
    new ListTagsForResourceCommand({ ResourceId: c.req.param("resourceId") })
  );
  return c.json({ tags: result.Tags || [] });
});

router.post("/resource-tags/:resourceId", async (c: Context) => {
  const body = await c.req.json().catch(() => ({}));
  const tags = body.tags;
  if (!Array.isArray(tags) || tags.length === 0) return badRequest(c, "tags array is required");
  await getClient().send(new TagResourceCommand({ ResourceId: c.req.param("resourceId"), Tags: tags }));
  return c.json({ created: true });
});

router.delete("/resource-tags/:resourceId", async (c: Context) => {
  const body = await c.req.json().catch(() => ({}));
  const tagKeys = body.tagKeys;
  if (!Array.isArray(tagKeys) || tagKeys.length === 0) return badRequest(c, "tagKeys array is required");
  await getClient().send(
    new UntagResourceCommand({ ResourceId: c.req.param("resourceId"), TagKeys: tagKeys })
  );
  return c.json({ deleted: true });
});

// ---------- Mount targets ----------

router.post("/mount-targets", async (c: Context) => {
  const body = await c.req.json().catch(() => ({}));
  const FileSystemId = body.fileSystemId;
  const SubnetId = body.subnetId;
  if (!FileSystemId) return badRequest(c, "fileSystemId is required");
  if (!SubnetId) return badRequest(c, "subnetId is required");
  const result: any = await getClient().send(
    new CreateMountTargetCommand({
      FileSystemId,
      SubnetId,
      IpAddress: body.ipAddress,
      SecurityGroups: body.securityGroups,
    })
  );
  return c.json({ mountTarget: result.MountTarget || result });
});

router.get("/mount-targets", async (c: Context) => {
  const fsId = c.req.query("fileSystemId") || undefined;
  const mtId = c.req.query("mountTargetId") || undefined;
  if (!fsId && !mtId) return badRequest(c, "fileSystemId or mountTargetId is required");
  const result: any = await getClient().send(
    new DescribeMountTargetsCommand({ FileSystemId: fsId, MountTargetId: mtId })
  );
  return c.json({
    mountTargets: result.MountTargets || [],
    total: result.MountTargets?.length || 0,
  });
});

router.delete("/mount-targets/:id", async (c: Context) => {
  await getClient().send(new DeleteMountTargetCommand({ MountTargetId: c.req.param("id") }));
  return c.json({ deleted: true });
});

router.get("/mount-targets/:id/security-groups", async (c: Context) => {
  const result: any = await getClient().send(
    new DescribeMountTargetSecurityGroupsCommand({ MountTargetId: c.req.param("id") })
  );
  return c.json({ securityGroups: result.SecurityGroups || [] });
});

router.put("/mount-targets/:id/security-groups", async (c: Context) => {
  const body = await c.req.json().catch(() => ({}));
  const groups = body.securityGroups;
  if (!Array.isArray(groups)) return badRequest(c, "securityGroups array is required");
  await getClient().send(
    new ModifyMountTargetSecurityGroupsCommand({ MountTargetId: c.req.param("id"), SecurityGroups: groups })
  );
  return c.json({ updated: true });
});

// ---------- Access points ----------

router.post("/access-points", async (c: Context) => {
  const body = await c.req.json().catch(() => ({}));
  const ClientToken = body.clientToken;
  const FileSystemId = body.fileSystemId;
  if (!ClientToken) return badRequest(c, "clientToken is required");
  if (!FileSystemId) return badRequest(c, "fileSystemId is required");
  const result: any = await getClient().send(
    new CreateAccessPointCommand({
      ClientToken,
      FileSystemId,
      PosixUser: body.posixUser as any,
      RootDirectory: body.rootDirectory as any,
      Tags: body.tags,
    })
  );
  return c.json({ accessPoint: result.AccessPoint || result });
});

router.get("/access-points", async (c: Context) => {
  const fsId = c.req.query("fileSystemId") || undefined;
  const apId = c.req.query("accessPointId") || undefined;
  if (!fsId && !apId) return badRequest(c, "fileSystemId or accessPointId is required");
  const result: any = await getClient().send(
    new DescribeAccessPointsCommand({ FileSystemId: fsId, AccessPointId: apId })
  );
  return c.json({
    accessPoints: result.AccessPoints || [],
    total: result.AccessPoints?.length || 0,
  });
});

router.delete("/access-points/:id", async (c: Context) => {
  await getClient().send(new DeleteAccessPointCommand({ AccessPointId: c.req.param("id") }));
  return c.json({ deleted: true });
});

// ---------- Policies ----------

router.put("/file-systems/:id/policy", async (c: Context) => {
  const body = await c.req.json().catch(() => ({}));
  const Policy = body.policy;
  if (!Policy) return badRequest(c, "policy is required");
  const result: any = await getClient().send(
    new PutFileSystemPolicyCommand({
      FileSystemId: c.req.param("id"),
      Policy,
      BypassPolicyLockoutSafetyCheck: body.bypassPolicyLockoutSafetyCheck,
    })
  );
  return c.json({ policy: result.Policy });
});

router.get("/file-systems/:id/policy", async (c: Context) => {
  const result: any = await getClient().send(
    new DescribeFileSystemPolicyCommand({ FileSystemId: c.req.param("id") })
  );
  return c.json({ policy: result.Policy });
});

router.delete("/file-systems/:id/policy", async (c: Context) => {
  await getClient().send(new DeleteFileSystemPolicyCommand({ FileSystemId: c.req.param("id") }));
  return c.json({ deleted: true });
});

router.put("/file-systems/:id/backup-policy", async (c: Context) => {
  const body = await c.req.json().catch(() => ({}));
  const Status = body.status;
  if (!Status) return badRequest(c, "status is required");
  const result: any = await getClient().send(
    new PutBackupPolicyCommand({
      FileSystemId: c.req.param("id"),
      BackupPolicy: { Status },
    })
  );
  return c.json({ backupPolicy: result.BackupPolicy });
});

router.get("/file-systems/:id/backup-policy", async (c: Context) => {
  const result: any = await getClient().send(
    new DescribeBackupPolicyCommand({ FileSystemId: c.req.param("id") })
  );
  return c.json({ backupPolicy: result.BackupPolicy });
});

router.put("/file-systems/:id/lifecycle-configuration", async (c: Context) => {
  const body = await c.req.json().catch(() => ({}));
  const policies = body.lifecyclePolicies;
  if (!Array.isArray(policies)) return badRequest(c, "lifecyclePolicies array is required");
  const result: any = await getClient().send(
    new PutLifecycleConfigurationCommand({
      FileSystemId: c.req.param("id"),
      LifecyclePolicies: policies,
    })
  );
  return c.json({ lifecyclePolicies: result.LifecyclePolicies || [] });
});

router.get("/file-systems/:id/lifecycle-configuration", async (c: Context) => {
  const result: any = await getClient().send(
    new DescribeLifecycleConfigurationCommand({ FileSystemId: c.req.param("id") })
  );
  return c.json({ lifecyclePolicies: result.LifecyclePolicies || [] });
});

export default router;
