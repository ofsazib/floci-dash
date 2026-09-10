import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSend, mocks } = vi.hoisted(() => {
  const mockSend = vi.fn();
  const createCmd = (name: string) =>
    vi.fn(function (this: any, args?: any) {
      const cmd: any = { ...args, __cmdName: name };
      return cmd;
    });
  return {
    mockSend,
    mocks: {
      EFSClient: vi.fn(function (this: any) {
        return { send: mockSend };
      }),
      CreateFileSystemCommand: createCmd("CreateFileSystemCommand"),
      DescribeFileSystemsCommand: createCmd("DescribeFileSystemsCommand"),
      DeleteFileSystemCommand: createCmd("DeleteFileSystemCommand"),
      UpdateFileSystemCommand: createCmd("UpdateFileSystemCommand"),
      UpdateFileSystemProtectionCommand: createCmd("UpdateFileSystemProtectionCommand"),
      CreateTagsCommand: createCmd("CreateTagsCommand"),
      DeleteTagsCommand: createCmd("DeleteTagsCommand"),
      DescribeTagsCommand: createCmd("DescribeTagsCommand"),
      ListTagsForResourceCommand: createCmd("ListTagsForResourceCommand"),
      TagResourceCommand: createCmd("TagResourceCommand"),
      UntagResourceCommand: createCmd("UntagResourceCommand"),
      CreateMountTargetCommand: createCmd("CreateMountTargetCommand"),
      DescribeMountTargetsCommand: createCmd("DescribeMountTargetsCommand"),
      DeleteMountTargetCommand: createCmd("DeleteMountTargetCommand"),
      DescribeMountTargetSecurityGroupsCommand: createCmd("DescribeMountTargetSecurityGroupsCommand"),
      ModifyMountTargetSecurityGroupsCommand: createCmd("ModifyMountTargetSecurityGroupsCommand"),
      CreateAccessPointCommand: createCmd("CreateAccessPointCommand"),
      DescribeAccessPointsCommand: createCmd("DescribeAccessPointsCommand"),
      DeleteAccessPointCommand: createCmd("DeleteAccessPointCommand"),
      PutFileSystemPolicyCommand: createCmd("PutFileSystemPolicyCommand"),
      DescribeFileSystemPolicyCommand: createCmd("DescribeFileSystemPolicyCommand"),
      DeleteFileSystemPolicyCommand: createCmd("DeleteFileSystemPolicyCommand"),
      PutBackupPolicyCommand: createCmd("PutBackupPolicyCommand"),
      DescribeBackupPolicyCommand: createCmd("DescribeBackupPolicyCommand"),
      PutLifecycleConfigurationCommand: createCmd("PutLifecycleConfigurationCommand"),
      DescribeLifecycleConfigurationCommand: createCmd("DescribeLifecycleConfigurationCommand"),
    },
  };
});

vi.mock("@aws-sdk/client-efs", () => mocks);

import router from "./efs";

const get = (path: string) => router.request(path);
const post = (path: string, body?: any) =>
  router.request(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
const put = (path: string, body?: any) =>
  router.request(path, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
const del = (path: string, body?: any) =>
  router.request(path, {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

const fs = {
  FileSystemId: "fs-123",
  LifeCycleState: "available",
  Name: "my-efs",
  Encrypted: true,
  NumberOfMountTargets: 1,
};
const mountTarget = { MountTargetId: "fsmt-1", FileSystemId: "fs-123", SubnetId: "subnet-1" };
const accessPoint = { AccessPointId: "fsap-1", FileSystemId: "fs-123", Name: "ap-1" };

beforeEach(() => {
  mockSend.mockReset();
});

describe("EFS — file systems", () => {
  it("POST /file-systems — creates and returns file system", async () => {
    mockSend.mockResolvedValueOnce({ FileSystem: fs });
    const res = await post("/file-systems", { creationToken: "tok", encrypted: true });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.fileSystem.FileSystemId).toBe("fs-123");
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.CreationToken).toBe("tok");
    expect(cmd.Encrypted).toBe(true);
  });

  it("POST /file-systems — 400 when CreationToken missing", async () => {
    const res = await post("/file-systems", {});
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("creationToken");
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("GET /file-systems — lists with query filters", async () => {
    mockSend.mockResolvedValueOnce({ FileSystems: [fs] });
    const res = await get("/file-systems?fileSystemId=fs-123&creationToken=tok");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.FileSystemId).toBe("fs-123");
    expect(cmd.CreationToken).toBe("tok");
  });

  it("GET /file-systems — empty results", async () => {
    mockSend.mockResolvedValueOnce({ FileSystems: [] });
    const res = await get("/file-systems");
    expect((await res.json()).total).toBe(0);
  });

  it("GET /file-systems — undefined FileSystems falls back to []", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/file-systems");
    expect((await res.json()).fileSystems).toEqual([]);
  });

  it("DELETE /file-systems/:id — deletes", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/file-systems/fs-123");
    expect(res.status).toBe(200);
    expect(mockSend.mock.calls[0][0].FileSystemId).toBe("fs-123");
  });

  it("PUT /file-systems/:id — updates throughput", async () => {
    mockSend.mockResolvedValueOnce({ FileSystem: fs });
    const res = await put("/file-systems/fs-123", { throughputMode: "provisioned", provisionedThroughputInMibps: 10 });
    expect(res.status).toBe(200);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.ThroughputMode).toBe("provisioned");
    expect(cmd.ProvisionedThroughputInMibps).toBe(10);
  });

  it("PUT /file-systems/:id/protection — updates protection", async () => {
    mockSend.mockResolvedValueOnce({ FileSystemProtection: { ReplicationOverwriteProtection: "ENABLED" } });
    const res = await put("/file-systems/fs-123/protection", { replicationOverwriteProtection: "ENABLED" });
    expect(res.status).toBe(200);
    expect((await res.json()).fileSystemProtection.ReplicationOverwriteProtection).toBe("ENABLED");
  });

  it("PUT /file-systems/:id/protection — 400 when missing", async () => {
    const res = await put("/file-systems/fs-123/protection", {});
    expect(res.status).toBe(400);
  });
});

describe("EFS — tags", () => {
  it("POST /file-systems/:id/tags — creates tags", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/file-systems/fs-123/tags", { tags: [{ Key: "env", Value: "dev" }] });
    expect(res.status).toBe(200);
    expect(mockSend.mock.calls[0][0].Tags[0].Key).toBe("env");
  });

  it("POST /file-systems/:id/tags — 400 on missing tags", async () => {
    const res = await post("/file-systems/fs-123/tags", { tags: [] });
    expect(res.status).toBe(400);
  });

  it("GET /file-systems/:id/tags — describes tags", async () => {
    mockSend.mockResolvedValueOnce({ Tags: [{ Key: "env", Value: "dev" }] });
    const res = await get("/file-systems/fs-123/tags");
    expect((await res.json()).tags).toHaveLength(1);
  });

  it("GET /file-systems/:id/tags — falls back to []", async () => {
    mockSend.mockResolvedValueOnce({});
    expect((await (await get("/file-systems/fs-123/tags")).json()).tags).toEqual([]);
  });

  it("DELETE /file-systems/:id/tags — deletes by keys", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/file-systems/fs-123/tags", { tagKeys: ["env"] });
    expect(res.status).toBe(200);
    expect(mockSend.mock.calls[0][0].TagKeys).toEqual(["env"]);
  });

  it("DELETE /file-systems/:id/tags — 400 on missing keys", async () => {
    const res = await del("/file-systems/fs-123/tags", {});
    expect(res.status).toBe(400);
  });

  it("GET /resource-tags/:id — lists resource tags", async () => {
    mockSend.mockResolvedValueOnce({ Tags: [{ Key: "k", Value: "v" }] });
    const res = await get("/resource-tags/fs-123");
    expect((await res.json()).tags).toHaveLength(1);
  });

  it("POST /resource-tags/:id — tags resource", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/resource-tags/fs-123", { tags: [{ Key: "k", Value: "v" }] });
    expect(res.status).toBe(200);
  });

  it("POST /resource-tags/:id — 400 on missing tags", async () => {
    const res = await post("/resource-tags/fs-123", { tags: [] });
    expect(res.status).toBe(400);
  });

  it("DELETE /resource-tags/:id — untags resource", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/resource-tags/fs-123", { tagKeys: ["k"] });
    expect(res.status).toBe(200);
  });

  it("DELETE /resource-tags/:id — 400 on missing keys", async () => {
    const res = await del("/resource-tags/fs-123", { tagKeys: [] });
    expect(res.status).toBe(400);
  });
});

describe("EFS — mount targets", () => {
  it("POST /mount-targets — creates mount target", async () => {
    mockSend.mockResolvedValueOnce({ MountTarget: mountTarget });
    const res = await post("/mount-targets", { fileSystemId: "fs-123", subnetId: "subnet-1" });
    expect(res.status).toBe(200);
    expect((await res.json()).mountTarget.MountTargetId).toBe("fsmt-1");
  });

  it("POST /mount-targets — 400 when fileSystemId missing", async () => {
    const res = await post("/mount-targets", { subnetId: "subnet-1" });
    expect(res.status).toBe(400);
  });

  it("POST /mount-targets — 400 when subnetId missing", async () => {
    const res = await post("/mount-targets", { fileSystemId: "fs-123" });
    expect(res.status).toBe(400);
  });

  it("GET /mount-targets — describes by fileSystemId", async () => {
    mockSend.mockResolvedValueOnce({ MountTargets: [mountTarget] });
    const res = await get("/mount-targets?fileSystemId=fs-123");
    expect((await res.json()).total).toBe(1);
  });

  it("GET /mount-targets — 400 when no query param", async () => {
    const res = await get("/mount-targets");
    expect(res.status).toBe(400);
  });

  it("GET /mount-targets — empty results", async () => {
    mockSend.mockResolvedValueOnce({ MountTargets: [] });
    const res = await get("/mount-targets?fileSystemId=fs-123");
    expect((await res.json()).total).toBe(0);
  });

  it("DELETE /mount-targets/:id — deletes", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/mount-targets/fsmt-1");
    expect(res.status).toBe(200);
  });

  it("GET /mount-targets/:id/security-groups — lists groups", async () => {
    mockSend.mockResolvedValueOnce({ SecurityGroups: ["sg-1"] });
    const res = await get("/mount-targets/fsmt-1/security-groups");
    expect((await res.json()).securityGroups).toEqual(["sg-1"]);
  });

  it("PUT /mount-targets/:id/security-groups — modifies groups", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/mount-targets/fsmt-1/security-groups", { securityGroups: ["sg-2"] });
    expect(res.status).toBe(200);
  });

  it("PUT /mount-targets/:id/security-groups — 400 on missing array", async () => {
    const res = await put("/mount-targets/fsmt-1/security-groups", {});
    expect(res.status).toBe(400);
  });
});

describe("EFS — access points", () => {
  it("POST /access-points — creates access point", async () => {
    mockSend.mockResolvedValueOnce({ AccessPoint: accessPoint });
    const res = await post("/access-points", { clientToken: "tok", fileSystemId: "fs-123" });
    expect(res.status).toBe(200);
    expect((await res.json()).accessPoint.AccessPointId).toBe("fsap-1");
  });

  it("POST /access-points — 400 when clientToken missing", async () => {
    const res = await post("/access-points", { fileSystemId: "fs-123" });
    expect(res.status).toBe(400);
  });

  it("POST /access-points — 400 when fileSystemId missing", async () => {
    const res = await post("/access-points", { clientToken: "tok" });
    expect(res.status).toBe(400);
  });

  it("GET /access-points — describes by fileSystemId", async () => {
    mockSend.mockResolvedValueOnce({ AccessPoints: [accessPoint] });
    const res = await get("/access-points?fileSystemId=fs-123");
    expect((await res.json()).total).toBe(1);
  });

  it("GET /access-points — 400 when no query param", async () => {
    const res = await get("/access-points");
    expect(res.status).toBe(400);
  });

  it("GET /access-points — empty results", async () => {
    mockSend.mockResolvedValueOnce({ AccessPoints: [] });
    const res = await get("/access-points?fileSystemId=fs-123");
    expect((await res.json()).total).toBe(0);
  });

  it("DELETE /access-points/:id — deletes", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/access-points/fsap-1");
    expect(res.status).toBe(200);
  });
});

describe("EFS — policies", () => {
  it("PUT /file-systems/:id/policy — puts policy", async () => {
    mockSend.mockResolvedValueOnce({ Policy: '{"Version":"2012-10-17"}' });
    const res = await put("/file-systems/fs-123/policy", { policy: '{"Version":"2012-10-17"}' });
    expect(res.status).toBe(200);
    expect((await res.json()).policy).toContain("2012-10-17");
  });

  it("PUT /file-systems/:id/policy — 400 when missing", async () => {
    const res = await put("/file-systems/fs-123/policy", {});
    expect(res.status).toBe(400);
  });

  it("GET /file-systems/:id/policy — describes policy", async () => {
    mockSend.mockResolvedValueOnce({ Policy: '{"Version":"2012-10-17"}' });
    const res = await get("/file-systems/fs-123/policy");
    expect(res.status).toBe(200);
  });

  it("DELETE /file-systems/:id/policy — deletes policy", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/file-systems/fs-123/policy");
    expect(res.status).toBe(200);
  });

  it("PUT /file-systems/:id/backup-policy — puts backup policy", async () => {
    mockSend.mockResolvedValueOnce({ BackupPolicy: { Status: "ENABLED" } });
    const res = await put("/file-systems/fs-123/backup-policy", { status: "ENABLED" });
    expect((await res.json()).backupPolicy.Status).toBe("ENABLED");
  });

  it("PUT /file-systems/:id/backup-policy — 400 when missing", async () => {
    const res = await put("/file-systems/fs-123/backup-policy", {});
    expect(res.status).toBe(400);
  });

  it("GET /file-systems/:id/backup-policy — describes backup policy", async () => {
    mockSend.mockResolvedValueOnce({ BackupPolicy: { Status: "ENABLED" } });
    const res = await get("/file-systems/fs-123/backup-policy");
    expect(res.status).toBe(200);
  });

  it("PUT /file-systems/:id/lifecycle-configuration — puts policies", async () => {
    mockSend.mockResolvedValueOnce({ LifecyclePolicies: [{ TransitionToIA: "AFTER_30_DAYS" }] });
    const res = await put("/file-systems/fs-123/lifecycle-configuration", {
      lifecyclePolicies: [{ TransitionToIA: "AFTER_30_DAYS" }],
    });
    expect(res.status).toBe(200);
  });

  it("PUT /file-systems/:id/lifecycle-configuration — 400 on missing array", async () => {
    const res = await put("/file-systems/fs-123/lifecycle-configuration", {});
    expect(res.status).toBe(400);
  });

  it("GET /file-systems/:id/lifecycle-configuration — describes policies", async () => {
    mockSend.mockResolvedValueOnce({ LifecyclePolicies: [{ TransitionToIA: "AFTER_30_DAYS" }] });
    const res = await get("/file-systems/fs-123/lifecycle-configuration");
    expect(res.status).toBe(200);
  });

  it("GET /file-systems/:id/lifecycle-configuration — falls back to []", async () => {
    mockSend.mockResolvedValueOnce({});
    expect((await (await get("/file-systems/fs-123/lifecycle-configuration")).json()).lifecyclePolicies).toEqual([]);
  });
});

describe("EFS — invalid/missing JSON bodies hit the parse fallback", () => {
  const noBody = (method: string, path: string) =>
    router.request(path, { method });

  it("POST /file-systems with no body → 400", async () => {
    expect((await noBody("POST", "/file-systems")).status).toBe(400);
  });

  it("PUT /file-systems/:id with no body → still proxies", async () => {
    mockSend.mockResolvedValueOnce({ FileSystem: fs });
    expect((await noBody("PUT", "/file-systems/fs-123")).status).toBe(200);
  });

  it("PUT /file-systems/:id/protection with no body → 400", async () => {
    expect((await noBody("PUT", "/file-systems/fs-123/protection")).status).toBe(400);
  });

  it("POST /file-systems/:id/tags with no body → 400", async () => {
    expect((await noBody("POST", "/file-systems/fs-123/tags")).status).toBe(400);
  });

  it("DELETE /file-systems/:id/tags with no body → 400", async () => {
    expect((await noBody("DELETE", "/file-systems/fs-123/tags")).status).toBe(400);
  });

  it("POST /resource-tags/:id with no body → 400", async () => {
    expect((await noBody("POST", "/resource-tags/fs-123")).status).toBe(400);
  });

  it("DELETE /resource-tags/:id with no body → 400", async () => {
    expect((await noBody("DELETE", "/resource-tags/fs-123")).status).toBe(400);
  });

  it("POST /mount-targets with no body → 400", async () => {
    expect((await noBody("POST", "/mount-targets")).status).toBe(400);
  });

  it("PUT /mount-targets/:id/security-groups with no body → 400", async () => {
    expect((await noBody("PUT", "/mount-targets/fsmt-1/security-groups")).status).toBe(400);
  });

  it("POST /access-points with no body → 400", async () => {
    expect((await noBody("POST", "/access-points")).status).toBe(400);
  });

  it("PUT /file-systems/:id/policy with no body → 400", async () => {
    expect((await noBody("PUT", "/file-systems/fs-123/policy")).status).toBe(400);
  });

  it("PUT /file-systems/:id/backup-policy with no body → 400", async () => {
    expect((await noBody("PUT", "/file-systems/fs-123/backup-policy")).status).toBe(400);
  });

  it("PUT /file-systems/:id/lifecycle-configuration with no body → 400", async () => {
    expect((await noBody("PUT", "/file-systems/fs-123/lifecycle-configuration")).status).toBe(400);
  });
});

describe("EFS — response fallback arms", () => {

  it("GET /resource-tags/:id falls back to []", async () => {
    mockSend.mockResolvedValueOnce({});
    expect((await (await get("/resource-tags/fs-123")).json()).tags).toEqual([]);
  });
  it("POST /file-systems falls back to raw result", async () => {
    mockSend.mockResolvedValueOnce({ FileSystemId: "fs-x" });
    const res = await post("/file-systems", { creationToken: "tok" });
    expect((await res.json()).fileSystem.FileSystemId).toBe("fs-x");
  });

  it("PUT /file-systems/:id falls back to raw result", async () => {
    mockSend.mockResolvedValueOnce({ FileSystemId: "fs-x" });
    const res = await put("/file-systems/fs-123", {});
    expect((await res.json()).fileSystem.FileSystemId).toBe("fs-x");
  });

  it("PUT protection falls back to raw result", async () => {
    mockSend.mockResolvedValueOnce({ ReplicationOverwriteProtection: "DISABLED" });
    const res = await put("/file-systems/fs-123/protection", { replicationOverwriteProtection: "DISABLED" });
    expect((await res.json()).fileSystemProtection.ReplicationOverwriteProtection).toBe("DISABLED");
  });


  it("PUT lifecycle-configuration falls back to []", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/file-systems/fs-123/lifecycle-configuration", { lifecyclePolicies: [] });
    expect((await res.json()).lifecyclePolicies).toEqual([]);
  });

  it("GET /file-systems/:id/tags falls back to []", async () => {
    mockSend.mockResolvedValueOnce({});
    expect((await (await get("/file-systems/fs-123/tags")).json()).tags).toEqual([]);
  });

  it("POST /mount-targets falls back to raw result", async () => {
    mockSend.mockResolvedValueOnce({ MountTargetId: "fsmt-x" });
    const res = await post("/mount-targets", { fileSystemId: "fs-123", subnetId: "subnet-1" });
    expect((await res.json()).mountTarget.MountTargetId).toBe("fsmt-x");
  });

  it("GET /mount-targets falls back to []", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/mount-targets?fileSystemId=fs-123");
    expect((await res.json()).mountTargets).toEqual([]);
  });

  it("GET security-groups falls back to []", async () => {
    mockSend.mockResolvedValueOnce({});
    expect((await (await get("/mount-targets/fsmt-1/security-groups")).json()).securityGroups).toEqual([]);
  });

  it("POST /access-points falls back to raw result", async () => {
    mockSend.mockResolvedValueOnce({ AccessPointId: "fsap-x" });
    const res = await post("/access-points", { clientToken: "tok", fileSystemId: "fs-123" });
    expect((await res.json()).accessPoint.AccessPointId).toBe("fsap-x");
  });

  it("GET /access-points falls back to []", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/access-points?fileSystemId=fs-123");
    expect((await res.json()).accessPoints).toEqual([]);
  });

  it("GET lifecycle-configuration falls back to []", async () => {
    mockSend.mockResolvedValueOnce({});
    expect((await (await get("/file-systems/fs-123/lifecycle-configuration")).json()).lifecyclePolicies).toEqual([]);
  });
});
