import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockBackupClient = vi.hoisted(() =>
  vi.fn(function () {
    return { send: mockSend };
  })
);

const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) {
      return { __cmdName: name, ...args };
    });
  };
});

vi.mock("@aws-sdk/client-backup", () => ({
  BackupClient: mockBackupClient,
  ListBackupPlansCommand: createCmd("ListBackupPlansCommand"),
  CreateBackupPlanCommand: createCmd("CreateBackupPlanCommand"),
  GetBackupPlanCommand: createCmd("GetBackupPlanCommand"),
  DeleteBackupPlanCommand: createCmd("DeleteBackupPlanCommand"),
  UpdateBackupPlanCommand: createCmd("UpdateBackupPlanCommand"),
  ListBackupVaultsCommand: createCmd("ListBackupVaultsCommand"),
  CreateBackupVaultCommand: createCmd("CreateBackupVaultCommand"),
  DescribeBackupVaultCommand: createCmd("DescribeBackupVaultCommand"),
  DeleteBackupVaultCommand: createCmd("DeleteBackupVaultCommand"),
  ListBackupSelectionsCommand: createCmd("ListBackupSelectionsCommand"),
  CreateBackupSelectionCommand: createCmd("CreateBackupSelectionCommand"),
  GetBackupSelectionCommand: createCmd("GetBackupSelectionCommand"),
  DeleteBackupSelectionCommand: createCmd("DeleteBackupSelectionCommand"),
  StartBackupJobCommand: createCmd("StartBackupJobCommand"),
  DescribeBackupJobCommand: createCmd("DescribeBackupJobCommand"),
  ListBackupJobsCommand: createCmd("ListBackupJobsCommand"),
  StopBackupJobCommand: createCmd("StopBackupJobCommand"),
  ListTagsCommand: createCmd("ListTagsCommand"),
  TagResourceCommand: createCmd("TagResourceCommand"),
  UntagResourceCommand: createCmd("UntagResourceCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./backup";

async function get(path: string) {
  return router.request(path, { method: "GET" });
}

async function post(path: string, body?: any) {
  return router.request(path, {
    method: "POST",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}

async function del(path: string) {
  return router.request(path, { method: "DELETE" });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSend.mockReset();
});

describe("Backup routes — Plans", () => {
  it("GET /plans — returns list of plans", async () => {
    mockSend.mockResolvedValueOnce({
      BackupPlansList: [
        { BackupPlanName: "my-plan", BackupPlanId: "plan-1" },
      ],
    });
    const res = await get("/plans");
    const json = await res.json();
    expect(json.plans).toHaveLength(1);
    expect(json.total).toBe(1);
    expect(json.plans[0].BackupPlanName).toBe("my-plan");
  });

  it("GET /plans — returns empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/plans");
    const json = await res.json();
    expect(json.plans).toEqual([]);
    expect(json.total).toBe(0);
  });

  it("POST /plans — creates a plan", async () => {
    mockSend.mockResolvedValueOnce({
      BackupPlanId: "plan-1",
      BackupPlanArn: "arn:aws:backup:us-east-1::plan/plan-1",
    });
    const res = await post("/plans", {
      BackupPlan: { BackupPlanName: "new-plan" },
    });
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.created).toBe(true);
    expect(json.backupPlanId).toBe("plan-1");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("CreateBackupPlanCommand");
  });

  it("POST /plans — 400 when BackupPlanName missing", async () => {
    const res = await post("/plans", { BackupPlan: {} });
    expect(res.status).toBe(400);
  });

  it("GET /plans/:id — returns plan detail", async () => {
    mockSend.mockResolvedValueOnce({
      BackupPlan: { BackupPlanName: "my-plan", BackupPlanId: "plan-1" },
    });
    const res = await get("/plans/plan-1");
    const json = await res.json();
    expect(json.backupPlan.BackupPlanName).toBe("my-plan");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("GetBackupPlanCommand");
  });

  it("DELETE /plans/:id — deletes a plan", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/plans/plan-1");
    const json = await res.json();
    expect(json.deleted).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeleteBackupPlanCommand");
  });
});

describe("Backup routes — Vaults", () => {
  it("GET /backup-vaults — returns list of vaults", async () => {
    mockSend.mockResolvedValueOnce({
      BackupVaultList: [{ BackupVaultName: "my-vault" }],
    });
    const res = await get("/backup-vaults");
    const json = await res.json();
    expect(json.backupVaults).toHaveLength(1);
    expect(json.total).toBe(1);
  });

  it("GET /backup-vaults — returns empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/backup-vaults");
    const json = await res.json();
    expect(json.backupVaults).toEqual([]);
    expect(json.total).toBe(0);
  });

  it("POST /backup-vaults — creates a vault", async () => {
    mockSend.mockResolvedValueOnce({
      BackupVaultName: "new-vault",
      BackupVaultArn: "arn:aws:backup:us-east-1::vault/new-vault",
    });
    const res = await post("/backup-vaults", { backupVaultName: "new-vault" });
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.created).toBe(true);
    expect(json.backupVaultName).toBe("new-vault");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("CreateBackupVaultCommand");
  });

  it("POST /backup-vaults — 400 when backupVaultName missing", async () => {
    const res = await post("/backup-vaults", {});
    expect(res.status).toBe(400);
  });

  it("GET /backup-vaults/:name — returns vault detail", async () => {
    mockSend.mockResolvedValueOnce({
      BackupVaultName: "my-vault",
      BackupVaultArn: "arn:aws:backup:us-east-1::vault/my-vault",
    });
    const res = await get("/backup-vaults/my-vault");
    const json = await res.json();
    expect(json.backupVault.BackupVaultName).toBe("my-vault");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("DescribeBackupVaultCommand");
  });

  it("DELETE /backup-vaults/:name — deletes a vault", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/backup-vaults/my-vault");
    const json = await res.json();
    expect(json.deleted).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeleteBackupVaultCommand");
  });
});

describe("Backup routes — Selections", () => {
  it("GET /plans/:planId/selections — returns list", async () => {
    mockSend.mockResolvedValueOnce({
      BackupSelectionsList: [{ SelectionName: "sel-1", SelectionId: "sel-id-1" }],
    });
    const res = await get("/plans/plan-1/selections");
    const json = await res.json();
    expect(json.backupSelections).toHaveLength(1);
    expect(json.total).toBe(1);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("ListBackupSelectionsCommand");
  });

  it("GET /plans/:planId/selections — returns empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/plans/plan-1/selections");
    const json = await res.json();
    expect(json.backupSelections).toEqual([]);
    expect(json.total).toBe(0);
  });

  it("POST /plans/:planId/selections — creates selection", async () => {
    mockSend.mockResolvedValueOnce({
      SelectionId: "sel-id-1",
      SelectionArn: "arn:aws:backup:us-east-1::selection/sel-id-1",
    });
    const res = await post("/plans/plan-1/selections", {
      BackupSelection: {
        SelectionName: "new-sel",
        IamRoleArn: "arn:aws:iam::123:role/backup",
      },
    });
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.created).toBe(true);
    expect(json.selectionId).toBe("sel-id-1");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("CreateBackupSelectionCommand");
  });

  it("POST /plans/:planId/selections — 400 when SelectionName missing", async () => {
    const res = await post("/plans/plan-1/selections", {
      BackupSelection: { IamRoleArn: "arn:aws:iam::123:role/backup" },
    });
    expect(res.status).toBe(400);
  });

  it("POST /plans/:planId/selections — 400 when IamRoleArn missing", async () => {
    const res = await post("/plans/plan-1/selections", {
      BackupSelection: { SelectionName: "new-sel" },
    });
    expect(res.status).toBe(400);
  });

  it("GET /plans/:planId/selections/:selId — returns selection detail", async () => {
    mockSend.mockResolvedValueOnce({
      BackupSelection: { SelectionName: "sel-1", SelectionId: "sel-id-1" },
    });
    const res = await get("/plans/plan-1/selections/sel-id-1");
    const json = await res.json();
    expect(json.backupSelection.SelectionName).toBe("sel-1");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("GetBackupSelectionCommand");
  });

  it("DELETE /plans/:planId/selections/:selId — deletes selection", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/plans/plan-1/selections/sel-id-1");
    const json = await res.json();
    expect(json.deleted).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeleteBackupSelectionCommand");
  });
});

describe("Backup routes — Jobs", () => {
  it("GET /jobs — returns list of jobs", async () => {
    mockSend.mockResolvedValueOnce({
      BackupJobs: [{ BackupJobId: "job-1", State: "RUNNING" }],
    });
    const res = await get("/jobs");
    const json = await res.json();
    expect(json.backupJobs).toHaveLength(1);
    expect(json.total).toBe(1);
  });

  it("GET /jobs — returns empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/jobs");
    const json = await res.json();
    expect(json.backupJobs).toEqual([]);
    expect(json.total).toBe(0);
  });

  it("POST /jobs — starts a backup job", async () => {
    mockSend.mockResolvedValueOnce({
      BackupJobId: "job-1",
      BackupJobArn: "arn:aws:backup:us-east-1::job/job-1",
    });
    const res = await post("/jobs", {
      backupVaultName: "my-vault",
      resourceArn: "arn:aws:dynamodb:us-east-1::table/my-table",
      iamRoleArn: "arn:aws:iam::123:role/backup",
    });
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.created).toBe(true);
    expect(json.backupJobId).toBe("job-1");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("StartBackupJobCommand");
  });

  it("POST /jobs — 400 when resourceArn missing", async () => {
    const res = await post("/jobs", {
      backupVaultName: "my-vault",
      iamRoleArn: "arn:aws:iam::123:role/backup",
    });
    expect(res.status).toBe(400);
  });

  it("GET /jobs/:jobId — returns job detail", async () => {
    mockSend.mockResolvedValueOnce({
      BackupJobId: "job-1",
      State: "RUNNING",
    });
    const res = await get("/jobs/job-1");
    const json = await res.json();
    expect(json.backupJob.BackupJobId).toBe("job-1");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("DescribeBackupJobCommand");
  });

  it("POST /jobs/:jobId/stop — stops a job", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/jobs/job-1/stop");
    const json = await res.json();
    expect(json.stopped).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("StopBackupJobCommand");
  });
});

describe("Backup routes — Tags", () => {
  it("GET /tags — returns tags for resource", async () => {
    mockSend.mockResolvedValueOnce({
      Tags: { env: "prod", team: "backend" },
    });
    const res = await get(
      "/tags?resourceArn=arn:aws:backup:us-east-1::plan/plan-1"
    );
    const json = await res.json();
    expect(json.tags).toEqual({ env: "prod", team: "backend" });
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("ListTagsCommand");
  });

  it("GET /tags — returns empty object when no tags", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get(
      "/tags?resourceArn=arn:aws:backup:us-east-1::plan/plan-1"
    );
    const json = await res.json();
    expect(json.tags).toEqual({});
  });

  it("GET /tags — 400 when no resourceArn", async () => {
    const res = await get("/tags");
    expect(res.status).toBe(400);
  });
});
