import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { BackupClient } from "@aws-sdk/client-backup";
import {
  ListBackupPlansCommand,
  CreateBackupPlanCommand,
  GetBackupPlanCommand,
  DeleteBackupPlanCommand,
  UpdateBackupPlanCommand,
  ListBackupVaultsCommand,
  CreateBackupVaultCommand,
  DescribeBackupVaultCommand,
  DeleteBackupVaultCommand,
  ListBackupSelectionsCommand,
  CreateBackupSelectionCommand,
  GetBackupSelectionCommand,
  DeleteBackupSelectionCommand,
  StartBackupJobCommand,
  DescribeBackupJobCommand,
  ListBackupJobsCommand,
  StopBackupJobCommand,
  ListTagsCommand,
  TagResourceCommand,
  UntagResourceCommand,
} from "@aws-sdk/client-backup";

const router = new Hono();
const getClient = () => create(BackupClient);

// ── Backup Plans ──────────────────────────────────────────

router.get("/plans", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListBackupPlansCommand({}));
  const plans = result.BackupPlansList || [];
  return c.json({ plans, total: plans.length });
});

router.post("/plans", async (c: Context) => {
  const body = await c.req.json();
  if (!body.BackupPlan?.BackupPlanName) {
    return c.json({ error: "BackupPlan.BackupPlanName is required" }, 400);
  }
  const client = getClient();
  const result = await client.send(
    new CreateBackupPlanCommand({ BackupPlan: body.BackupPlan })
  );
  return c.json({ backupPlanId: result.BackupPlanId, created: true }, 201);
});

router.get("/plans/:id", async (c: Context) => {
  const id = c.req.param("id");
  const client = getClient();
  const result = await client.send(new GetBackupPlanCommand({ BackupPlanId: id }));
  return c.json({ backupPlan: result.BackupPlan });
});

router.delete("/plans/:id", async (c: Context) => {
  const id = c.req.param("id");
  const client = getClient();
  await client.send(new DeleteBackupPlanCommand({ BackupPlanId: id }));
  return c.json({ deleted: true });
});

// ── Backup Vaults ─────────────────────────────────────────

router.get("/backup-vaults", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListBackupVaultsCommand({}));
  const backupVaults = result.BackupVaultList || [];
  return c.json({ backupVaults, total: backupVaults.length });
});

router.post("/backup-vaults", async (c: Context) => {
  const body = await c.req.json();
  if (!body.backupVaultName) {
    return c.json({ error: "backupVaultName is required" }, 400);
  }
  const client = getClient();
  const result = await client.send(
    new CreateBackupVaultCommand({ BackupVaultName: body.backupVaultName })
  );
  return c.json({ backupVaultName: result.BackupVaultName, created: true }, 201);
});

router.get("/backup-vaults/:name", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  const result = await client.send(
    new DescribeBackupVaultCommand({ BackupVaultName: name })
  );
  return c.json({ backupVault: result });
});

router.delete("/backup-vaults/:name", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  await client.send(new DeleteBackupVaultCommand({ BackupVaultName: name }));
  return c.json({ deleted: true });
});

// ── Backup Selections ─────────────────────────────────────

router.get("/plans/:planId/selections", async (c: Context) => {
  const planId = c.req.param("planId");
  const client = getClient();
  const result = await client.send(
    new ListBackupSelectionsCommand({ BackupPlanId: planId })
  );
  const backupSelections = result.BackupSelectionsList || [];
  return c.json({ backupSelections, total: backupSelections.length });
});

router.post("/plans/:planId/selections", async (c: Context) => {
  const planId = c.req.param("planId");
  const body = await c.req.json();
  if (!body.BackupSelection?.SelectionName) {
    return c.json({ error: "BackupSelection.SelectionName is required" }, 400);
  }
  if (!body.BackupSelection?.IamRoleArn) {
    return c.json({ error: "BackupSelection.IamRoleArn is required" }, 400);
  }
  const client = getClient();
  const result = await client.send(
    new CreateBackupSelectionCommand({
      BackupPlanId: planId,
      BackupSelection: body.BackupSelection,
    })
  );
  return c.json({ selectionId: result.SelectionId, created: true }, 201);
});

router.get("/plans/:planId/selections/:selId", async (c: Context) => {
  const planId = c.req.param("planId");
  const selId = c.req.param("selId");
  const client = getClient();
  const result = await client.send(
    new GetBackupSelectionCommand({ BackupPlanId: planId, SelectionId: selId })
  );
  return c.json({ backupSelection: result.BackupSelection });
});

router.delete("/plans/:planId/selections/:selId", async (c: Context) => {
  const planId = c.req.param("planId");
  const selId = c.req.param("selId");
  const client = getClient();
  await client.send(
    new DeleteBackupSelectionCommand({ BackupPlanId: planId, SelectionId: selId })
  );
  return c.json({ deleted: true });
});

// ── Backup Jobs ───────────────────────────────────────────

router.get("/jobs", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListBackupJobsCommand({}));
  const backupJobs = result.BackupJobs || [];
  return c.json({ backupJobs, total: backupJobs.length });
});

router.post("/jobs", async (c: Context) => {
  const body = await c.req.json();
  if (!body.backupVaultName) {
    return c.json({ error: "backupVaultName is required" }, 400);
  }
  if (!body.resourceArn) {
    return c.json({ error: "resourceArn is required" }, 400);
  }
  if (!body.iamRoleArn) {
    return c.json({ error: "iamRoleArn is required" }, 400);
  }
  const client = getClient();
  const result = await client.send(
    new StartBackupJobCommand({
      BackupVaultName: body.backupVaultName,
      ResourceArn: body.resourceArn,
      IamRoleArn: body.iamRoleArn,
    })
  );
  return c.json({ backupJobId: result.BackupJobId, created: true }, 201);
});

router.get("/jobs/:jobId", async (c: Context) => {
  const jobId = c.req.param("jobId");
  const client = getClient();
  const result = await client.send(
    new DescribeBackupJobCommand({ BackupJobId: jobId })
  );
  return c.json({ backupJob: result });
});

router.post("/jobs/:jobId/stop", async (c: Context) => {
  const jobId = c.req.param("jobId");
  const client = getClient();
  await client.send(new StopBackupJobCommand({ BackupJobId: jobId }));
  return c.json({ stopped: true });
});

// ── Tags ──────────────────────────────────────────────────

router.get("/tags", async (c: Context) => {
  const resourceArn = c.req.query("resourceArn");
  if (!resourceArn) {
    return c.json({ error: "resourceArn query parameter required" }, 400);
  }
  const client = getClient();
  const result = await client.send(
    new ListTagsCommand({ ResourceArn: resourceArn })
  );
  return c.json({ tags: result.Tags || {} });
});

export default router;
