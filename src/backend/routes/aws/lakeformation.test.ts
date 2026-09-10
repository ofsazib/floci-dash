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
      LakeFormationClient: vi.fn(function (this: any) {
        return { send: mockSend };
      }),
      GetDataLakeSettingsCommand: createCmd("GetDataLakeSettingsCommand"),
      PutDataLakeSettingsCommand: createCmd("PutDataLakeSettingsCommand"),
      RegisterResourceCommand: createCmd("RegisterResourceCommand"),
      DeregisterResourceCommand: createCmd("DeregisterResourceCommand"),
      ListResourcesCommand: createCmd("ListResourcesCommand"),
      DescribeResourceCommand: createCmd("DescribeResourceCommand"),
      UpdateResourceCommand: createCmd("UpdateResourceCommand"),
      GrantPermissionsCommand: createCmd("GrantPermissionsCommand"),
      RevokePermissionsCommand: createCmd("RevokePermissionsCommand"),
      ListPermissionsCommand: createCmd("ListPermissionsCommand"),
      CreateLFTagCommand: createCmd("CreateLFTagCommand"),
      GetLFTagCommand: createCmd("GetLFTagCommand"),
      UpdateLFTagCommand: createCmd("UpdateLFTagCommand"),
      DeleteLFTagCommand: createCmd("DeleteLFTagCommand"),
      ListLFTagsCommand: createCmd("ListLFTagsCommand"),
      AddLFTagsToResourceCommand: createCmd("AddLFTagsToResourceCommand"),
      RemoveLFTagsFromResourceCommand: createCmd("RemoveLFTagsFromResourceCommand"),
    },
  };
});

vi.mock("@aws-sdk/client-lakeformation", () => mocks);

import router from "./lakeformation";

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

const resourceInfo = {
  ResourceArn: "arn:aws:s3:::my-datalake",
  RoleArn: "arn:aws:iam::123456789012:role/lf-role",
  LastModified: 1234567890,
  WithFederation: false,
  HybridAccessEnabled: true,
  WithPrivilegedAccess: true,
};

beforeEach(() => {
  mockSend.mockReset();
});

// ---------- Data lake settings ----------

describe("GET /settings", () => {
  it("returns mapped data lake settings", async () => {
    mockSend.mockResolvedValueOnce({
      DataLakeSettings: {
        DataLakeAdmins: [{ DataLakePrincipalIdentifier: "arn:aws:iam::123456789012:user/admin" }],
        CreateDatabaseDefaultPermissions: [{ Permissions: ["ALL"] }],
        CreateTableDefaultPermissions: [{ Permissions: ["SELECT"] }],
        AllowExternalDataFiltering: true,
        Parameters: { CrossAccountVersion: "3" },
        TrustedResourceOwners: ["123456789012"],
      },
    });
    const res = await get("/settings");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.dataLakeAdmins).toEqual(["arn:aws:iam::123456789012:user/admin"]);
    expect(body.createDatabaseDefaultPermissions).toEqual([{ Permissions: ["ALL"] }]);
    expect(body.createTableDefaultPermissions).toEqual([{ Permissions: ["SELECT"] }]);
    expect(body.allowExternalDataFiltering).toBe(true);
    expect(body.parameters).toEqual({ CrossAccountVersion: "3" });
    expect(body.trustedResourceOwners).toEqual(["123456789012"]);
  });

  it("falls back to defaults when settings absent", async () => {
    mockSend.mockResolvedValueOnce({ DataLakeSettings: { DataLakeAdmins: [{}] } });
    const res = await get("/settings");
    const body = await res.json();
    expect(body.dataLakeAdmins).toEqual([]);
    expect(body.allowExternalDataFiltering).toBe(false);
    expect(body.parameters).toEqual({});
    expect(body.trustedResourceOwners).toEqual([]);
  });

  it("falls back to fully-empty settings when response undefined", async () => {
    mockSend.mockResolvedValueOnce(undefined);
    const res = await get("/settings");
    const body = await res.json();
    expect(body.dataLakeAdmins).toEqual([]);
    expect(body.createDatabaseDefaultPermissions).toEqual([]);
    expect(body.createTableDefaultPermissions).toEqual([]);
  });

  it("falls back to empty admins when DataLakeAdmins absent", async () => {
    mockSend.mockResolvedValueOnce({ DataLakeSettings: {} });
    const res = await get("/settings");
    const body = await res.json();
    expect(body.dataLakeAdmins).toEqual([]);
  });
});

describe("PUT /settings", () => {
  it("puts data lake settings with mapped admins", async () => {
    await put("/settings", {
      dataLakeAdmins: ["arn:aws:iam::123456789012:user/admin"],
      allowExternalDataFiltering: true,
      trustedResourceOwners: ["123456789012"],
    });
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.DataLakeSettings.DataLakeAdmins).toEqual([
      { DataLakePrincipalIdentifier: "arn:aws:iam::123456789012:user/admin" },
    ]);
    expect(cmd.DataLakeSettings.AllowExternalDataFiltering).toBe(true);
    expect(cmd.DataLakeSettings.TrustedResourceOwners).toEqual(["123456789012"]);
  });

  it("handles empty body", async () => {
    const res = await put("/settings");
    expect(res.status).toBe(200);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.DataLakeSettings.DataLakeAdmins).toEqual([]);
  });
});

// ---------- Registered resources ----------

describe("POST /resources", () => {
  it("registers a resource", async () => {
    const res = await post("/resources", { resourceArn: "arn:aws:s3:::my-datalake", roleArn: "arn:aws:iam::1:role/r" });
    expect(res.status).toBe(201);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.ResourceArn).toBe("arn:aws:s3:::my-datalake");
    expect(cmd.RoleArn).toBe("arn:aws:iam::1:role/r");
    expect(cmd.UseServiceLinkedRole).toBe(true);
  });

  it("400 when resourceArn missing", async () => {
    const res = await post("/resources", {});
    expect(res.status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });
});

describe("GET /resources", () => {
  it("lists registered resources", async () => {
    mockSend.mockResolvedValueOnce({ ResourceInfoList: [resourceInfo] });
    const res = await get("/resources");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.resources[0]).toEqual({
      resourceArn: "arn:aws:s3:::my-datalake",
      roleArn: "arn:aws:iam::123456789012:role/lf-role",
      lastModified: 1234567890,
      withFederation: false,
    });
  });

  it("returns empty list when undefined", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/resources");
    const body = await res.json();
    expect(body.resources).toEqual([]);
    expect(body.total).toBe(0);
  });
});

describe("GET /resources/detail", () => {
  it("describes a resource", async () => {
    mockSend.mockResolvedValueOnce({ ResourceInfo: resourceInfo });
    const res = await get("/resources/detail?resourceArn=arn:aws:s3:::my-datalake");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.resourceArn).toBe("arn:aws:s3:::my-datalake");
    expect(body.hybridAccessEnabled).toBe(true);
    expect(body.withPrivilegedAccess).toBe(true);
    expect(mockSend.mock.calls[0][0].ResourceArn).toBe("arn:aws:s3:::my-datalake");
  });

  it("falls back to empty detail", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/resources/detail?resourceArn=x");
    const body = await res.json();
    expect(body.resourceArn).toBeUndefined();
  });

  it("400 when resourceArn query missing", async () => {
    const res = await get("/resources/detail");
    expect(res.status).toBe(400);
  });
});

describe("DELETE /resources", () => {
  it("deregisters a resource", async () => {
    const res = await del("/resources?resourceArn=arn:aws:s3:::my-datalake");
    expect(res.status).toBe(200);
    expect(mockSend.mock.calls[0][0].ResourceArn).toBe("arn:aws:s3:::my-datalake");
  });

  it("400 when resourceArn query missing", async () => {
    const res = await del("/resources");
    expect(res.status).toBe(400);
  });
});

describe("PUT /resources", () => {
  it("updates resource role", async () => {
    const res = await put("/resources", { resourceArn: "arn:aws:s3:::x", roleArn: "arn:aws:iam::1:role/new" });
    expect(res.status).toBe(200);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.ResourceArn).toBe("arn:aws:s3:::x");
    expect(cmd.RoleArn).toBe("arn:aws:iam::1:role/new");
  });

  it("400 when resourceArn missing", async () => {
    const res = await put("/resources", {});
    expect(res.status).toBe(400);
  });
});

// ---------- Permissions ----------

const grantBody = {
  principal: "arn:aws:iam::123456789012:user/analyst",
  resource: { Database: { Name: "db1" } },
  permissions: ["SELECT"],
};

describe("POST /permissions/grant", () => {
  it("grants permissions", async () => {
    const res = await post("/permissions/grant", grantBody);
    expect(res.status).toBe(201);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.Principal).toEqual({ DataLakePrincipalIdentifier: grantBody.principal });
    expect(cmd.Resource).toEqual({ Database: { Name: "db1" } });
    expect(cmd.Permissions).toEqual(["SELECT"]);
    expect(cmd.PermissionsWithGrantOption).toEqual([]);
  });

  it("passes grant-option list", async () => {
    await post("/permissions/grant", { ...grantBody, permissionsWithGrantOption: ["SELECT"] });
    expect(mockSend.mock.calls[0][0].PermissionsWithGrantOption).toEqual(["SELECT"]);
  });

  it("400 when principal missing", async () => {
    const res = await post("/permissions/grant", { permissions: ["SELECT"] });
    expect(res.status).toBe(400);
  });

  it("400 when permissions empty", async () => {
    const res = await post("/permissions/grant", { principal: "p", permissions: [] });
    expect(res.status).toBe(400);
  });

  it("400 when permissions not a list", async () => {
    const res = await post("/permissions/grant", { principal: "p", permissions: "SELECT" });
    expect(res.status).toBe(400);
  });
});

describe("POST /permissions/revoke", () => {
  it("revokes permissions", async () => {
    const res = await post("/permissions/revoke", grantBody);
    expect(res.status).toBe(201);
    expect(mockSend.mock.calls[0][0].Permissions).toEqual(["SELECT"]);
  });

  it("400 when principal missing", async () => {
    const res = await post("/permissions/revoke", { permissions: ["SELECT"] });
    expect(res.status).toBe(400);
  });

  it("400 when permissions empty", async () => {
    const res = await post("/permissions/revoke", { principal: "p" });
    expect(res.status).toBe(400);
  });

  it("400 with invalid JSON body", async () => {
    const res = await router.request("/permissions/revoke", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not-json",
    });
    expect(res.status).toBe(400);
  });
});

describe("GET /permissions", () => {
  it("lists permissions", async () => {
    mockSend.mockResolvedValueOnce({
      PrincipalResourcePermissions: [
        {
          Principal: { DataLakePrincipalIdentifier: "arn:aws:iam::1:user/a" },
          Resource: { Table: { DatabaseName: "db", Name: "t" } },
          Permissions: ["SELECT", "INSERT"],
          PermissionsWithGrantOption: ["SELECT"],
        },
      ],
    });
    const res = await get("/permissions");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.principalResourcePermissions[0].principal).toBe("arn:aws:iam::1:user/a");
    expect(body.principalResourcePermissions[0].permissions).toEqual(["SELECT", "INSERT"]);
    expect(body.principalResourcePermissions[0].permissionsWithGrantOption).toEqual(["SELECT"]);
  });

  it("falls back to empty lists", async () => {
    mockSend.mockResolvedValueOnce({ PrincipalResourcePermissions: [{}] });
    const res = await get("/permissions");
    const body = await res.json();
    expect(body.principalResourcePermissions[0].principal).toBeUndefined();
    expect(body.principalResourcePermissions[0].permissions).toEqual([]);
    expect(body.principalResourcePermissions[0].permissionsWithGrantOption).toEqual([]);
  });

  it("returns empty when undefined", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/permissions");
    const body = await res.json();
    expect(body.total).toBe(0);
  });
});

// ---------- LF-tags ----------

describe("POST /lf-tags", () => {
  it("creates an LF-tag", async () => {
    const res = await post("/lf-tags", { tagKey: "env", tagValues: ["prod", "dev"] });
    expect(res.status).toBe(201);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.TagKey).toBe("env");
    expect(cmd.TagValues).toEqual(["prod", "dev"]);
  });

  it("400 when tagKey missing", async () => {
    const res = await post("/lf-tags", { tagValues: ["prod"] });
    expect(res.status).toBe(400);
  });

  it("400 when tagValues empty", async () => {
    const res = await post("/lf-tags", { tagKey: "env", tagValues: [] });
    expect(res.status).toBe(400);
  });

  it("treats non-array tagValues as empty list", async () => {
    const res = await post("/lf-tags", { tagKey: "env", tagValues: "prod" });
    expect(res.status).toBe(400);
  });
});

describe("GET /lf-tags/:key", () => {
  it("gets an LF-tag", async () => {
    mockSend.mockResolvedValueOnce({ CatalogId: "123456789012", TagKey: "env", TagValues: ["prod"] });
    const res = await get("/lf-tags/env?catalogId=123456789012");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tagKey).toBe("env");
    expect(body.tagValues).toEqual(["prod"]);
  });

  it("falls back to empty values", async () => {
    mockSend.mockResolvedValueOnce({ TagKey: "env" });
    const res = await get("/lf-tags/env");
    const body = await res.json();
    expect(body.tagValues).toEqual([]);
  });
});

describe("PUT /lf-tags/:key", () => {
  it("updates an LF-tag adding values", async () => {
    const res = await put("/lf-tags/env", { tagValuesToAdd: ["staging"] });
    expect(res.status).toBe(200);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.TagKey).toBe("env");
    expect(cmd.TagValuesToAdd).toEqual(["staging"]);
  });

  it("updates an LF-tag deleting values", async () => {
    await put("/lf-tags/env", { tagValuesToDelete: ["dev"] });
    expect(mockSend.mock.calls[0][0].TagValuesToDelete).toEqual(["dev"]);
  });

  it("400 when neither add nor delete provided", async () => {
    const res = await put("/lf-tags/env", {});
    expect(res.status).toBe(400);
  });

  it("400 when both lists empty", async () => {
    const res = await put("/lf-tags/env", { tagValuesToAdd: [], tagValuesToDelete: [] });
    expect(res.status).toBe(400);
  });
});

describe("DELETE /lf-tags/:key", () => {
  it("deletes an LF-tag", async () => {
    const res = await del("/lf-tags/env?catalogId=123");
    expect(res.status).toBe(200);
    expect(mockSend.mock.calls[0][0].TagKey).toBe("env");
    expect(mockSend.mock.calls[0][0].CatalogId).toBe("123");
  });
});

describe("GET /lf-tags", () => {
  it("lists LF-tags", async () => {
    mockSend.mockResolvedValueOnce({
      LFTags: [{ CatalogId: "123", TagKey: "env", TagValues: ["prod"] }],
      NextToken: "tok",
    });
    const res = await get("/lf-tags?catalogId=123");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.lfTags[0]).toEqual({ catalogId: "123", tagKey: "env", tagValues: ["prod"] });
    expect(body.nextToken).toBe("tok");
  });

  it("passes numeric maxResults", async () => {
    mockSend.mockResolvedValueOnce({ LFTags: [] });
    await get("/lf-tags?maxResults=10");
    expect(mockSend.mock.calls[0][0].MaxResults).toBe(10);
  });

  it("omits maxResults when absent", async () => {
    mockSend.mockResolvedValueOnce({ LFTags: [] });
    await get("/lf-tags");
    expect(mockSend.mock.calls[0][0].MaxResults).toBeUndefined();
  });

  it("falls back to empty values", async () => {
    mockSend.mockResolvedValueOnce({ LFTags: [{ TagKey: "env" }] });
    const res = await get("/lf-tags");
    const body = await res.json();
    expect(body.lfTags[0].tagValues).toEqual([]);
  });

  it("falls back to empty list when LFTags absent", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/lf-tags");
    const body = await res.json();
    expect(body.lfTags).toEqual([]);
    expect(body.total).toBe(0);
  });
});

// ---------- LF-tag assignment ----------

const assignBody = {
  resource: { Database: { Name: "db1" } },
  lfTags: [{ TagKey: "env", TagValues: ["prod"] }],
};

describe("POST /lf-tags/assign", () => {
  it("assigns LF-tags to a resource", async () => {
    mockSend.mockResolvedValueOnce({ Failures: [] });
    const res = await post("/lf-tags/assign", assignBody);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.failures).toEqual([]);
  });

  it("maps failures", async () => {
    mockSend.mockResolvedValueOnce({
      Failures: [{ LFTag: { TagKey: "env" }, Error: { ErrorMessage: "not found" } }],
    });
    const res = await post("/lf-tags/assign", assignBody);
    const body = await res.json();
    expect(body.failures).toEqual([{ lfTag: { TagKey: "env" }, error: "not found" }]);
  });

  it("falls back to empty failures", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/lf-tags/assign", assignBody);
    const body = await res.json();
    expect(body.failures).toEqual([]);
  });

  it("falls back to empty failures when response undefined", async () => {
    mockSend.mockResolvedValueOnce(undefined);
    const res = await post("/lf-tags/assign", assignBody);
    const body = await res.json();
    expect(body.failures).toEqual([]);
  });

  it("treats non-array lfTags as empty list", async () => {
    const res = await post("/lf-tags/assign", { resource: { Database: { Name: "db" } }, lfTags: "env" });
    expect(res.status).toBe(400);
  });

  it("maps failure without Error object", async () => {
    mockSend.mockResolvedValueOnce({ Failures: [{ LFTag: { TagKey: "env" } }] });
    const res = await post("/lf-tags/assign", assignBody);
    const body = await res.json();
    expect(body.failures).toEqual([{ lfTag: { TagKey: "env" }, error: undefined }]);
  });

  it("400 when resource missing", async () => {
    const res = await post("/lf-tags/assign", { lfTags: [{ TagKey: "env" }] });
    expect(res.status).toBe(400);
  });

  it("400 when lfTags empty", async () => {
    const res = await post("/lf-tags/assign", { resource: { Database: { Name: "db" } }, lfTags: [] });
    expect(res.status).toBe(400);
  });
});

describe("POST /lf-tags/unassign", () => {
  it("removes LF-tags from a resource", async () => {
    mockSend.mockResolvedValueOnce({ Failures: [] });
    const res = await post("/lf-tags/unassign", assignBody);
    expect(res.status).toBe(201);
    expect(mockSend.mock.calls[0][0].LFTags).toEqual(assignBody.lfTags);
  });

  it("maps failures", async () => {
    mockSend.mockResolvedValueOnce({
      Failures: [{ LFTag: { TagKey: "env" }, Error: { ErrorMessage: "boom" } }],
    });
    const res = await post("/lf-tags/unassign", assignBody);
    const body = await res.json();
    expect(body.failures[0].error).toBe("boom");
  });

  it("treats non-array lfTags as empty list", async () => {
    const res = await post("/lf-tags/unassign", { resource: {}, lfTags: "env" });
    expect(res.status).toBe(400);
  });

  it("falls back to empty failures when response undefined", async () => {
    mockSend.mockResolvedValueOnce(undefined);
    const res = await post("/lf-tags/unassign", assignBody);
    const body = await res.json();
    expect(body.failures).toEqual([]);
  });

  it("maps failure without Error object", async () => {
    mockSend.mockResolvedValueOnce({ Failures: [{ LFTag: { TagKey: "env" } }] });
    const res = await post("/lf-tags/unassign", assignBody);
    const body = await res.json();
    expect(body.failures).toEqual([{ lfTag: { TagKey: "env" }, error: undefined }]);
  });

  it("400 when resource missing", async () => {
    const res = await post("/lf-tags/unassign", {});
    expect(res.status).toBe(400);
  });

  it("400 when lfTags empty", async () => {
    const res = await post("/lf-tags/unassign", { resource: {} });
    expect(res.status).toBe(400);
  });
});

// ---------- JSON parse fallback ----------

describe("body parse fallbacks", () => {
  it("POST /permissions/grant with invalid JSON body", async () => {
    const res = await router.request("/permissions/grant", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not-json",
    });
    expect(res.status).toBe(400);
  });

  it("POST /resources with invalid JSON body", async () => {
    const res = await router.request("/resources", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not-json",
    });
    expect(res.status).toBe(400);
  });

  it("PUT /resources with invalid JSON body", async () => {
    const res = await router.request("/resources", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: "not-json",
    });
    expect(res.status).toBe(400);
  });

  it("POST /lf-tags with invalid JSON body", async () => {
    const res = await router.request("/lf-tags", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not-json",
    });
    expect(res.status).toBe(400);
  });

  it("PUT /lf-tags/:key with invalid JSON body", async () => {
    const res = await router.request("/lf-tags/env", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: "not-json",
    });
    expect(res.status).toBe(400);
  });

  it("POST /lf-tags/assign with invalid JSON body", async () => {
    const res = await router.request("/lf-tags/assign", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not-json",
    });
    expect(res.status).toBe(400);
  });

  it("POST /lf-tags/unassign with invalid JSON body", async () => {
    const res = await router.request("/lf-tags/unassign", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not-json",
    });
    expect(res.status).toBe(400);
  });

  it("PUT /settings with invalid JSON body", async () => {
    const res = await router.request("/settings", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: "not-json",
    });
    expect(res.status).toBe(200);
  });
});
