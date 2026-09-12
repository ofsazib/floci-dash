import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockSend, createCmd } = vi.hoisted(() => {
  const mockSend = vi.fn();
  const createCmd = (name: string) => function (this: any, input: any) { return { __cmd: name, ...(input || {}) }; };
  return { mockSend, createCmd };
});

vi.mock("../../clients/aws", () => ({
  create: vi.fn(() => ({ send: mockSend })),
}));

vi.mock("@aws-sdk/client-resource-explorer-2", () => ({
  ResourceExplorer2Client: class {},
  AssociateDefaultViewCommand: createCmd("AssociateDefaultViewCommand"),
  BatchGetViewCommand: createCmd("BatchGetViewCommand"),
  CreateIndexCommand: createCmd("CreateIndexCommand"),
  CreateResourceExplorerSetupCommand: createCmd("CreateResourceExplorerSetupCommand"),
  CreateViewCommand: createCmd("CreateViewCommand"),
  DeleteIndexCommand: createCmd("DeleteIndexCommand"),
  DeleteResourceExplorerSetupCommand: createCmd("DeleteResourceExplorerSetupCommand"),
  DeleteViewCommand: createCmd("DeleteViewCommand"),
  DisassociateDefaultViewCommand: createCmd("DisassociateDefaultViewCommand"),
  GetAccountLevelServiceConfigurationCommand: createCmd("GetAccountLevelServiceConfigurationCommand"),
  GetDefaultViewCommand: createCmd("GetDefaultViewCommand"),
  GetIndexCommand: createCmd("GetIndexCommand"),
  GetManagedViewCommand: createCmd("GetManagedViewCommand"),
  GetResourceExplorerSetupCommand: createCmd("GetResourceExplorerSetupCommand"),
  GetServiceIndexCommand: createCmd("GetServiceIndexCommand"),
  GetServiceViewCommand: createCmd("GetServiceViewCommand"),
  GetViewCommand: createCmd("GetViewCommand"),
  ListIndexesCommand: createCmd("ListIndexesCommand"),
  ListIndexesForMembersCommand: createCmd("ListIndexesForMembersCommand"),
  ListManagedViewsCommand: createCmd("ListManagedViewsCommand"),
  ListResourcesCommand: createCmd("ListResourcesCommand"),
  ListServiceIndexesCommand: createCmd("ListServiceIndexesCommand"),
  ListServiceViewsCommand: createCmd("ListServiceViewsCommand"),
  ListStreamingAccessForServicesCommand: createCmd("ListStreamingAccessForServicesCommand"),
  ListSupportedResourceTypesCommand: createCmd("ListSupportedResourceTypesCommand"),
  ListViewsCommand: createCmd("ListViewsCommand"),
  SearchCommand: createCmd("SearchCommand"),
  UpdateIndexTypeCommand: createCmd("UpdateIndexTypeCommand"),
  UpdateViewCommand: createCmd("UpdateViewCommand"),
}));

import resourceexplorer2Routes from "./resourceexplorer2";
import { Hono } from "hono";

const app = new Hono();
app.route("/", resourceexplorer2Routes);

const get = (path: string) => app.request(path);
const post = (path: string, json?: any) =>
  app.request(path, json === undefined ? { method: "POST" } : { method: "POST", body: JSON.stringify(json), headers: { "content-type": "application/json" } });
const put = (path: string, json?: any) =>
  app.request(path, json === undefined ? { method: "PUT" } : { method: "PUT", body: JSON.stringify(json), headers: { "content-type": "application/json" } });
const del = (path: string) => app.request(path, { method: "DELETE" });

const INDEX_ARN = "arn:aws:resource-explorer-2:us-east-1:1:index/1";
const VIEW_ARN = "arn:aws:resource-explorer-2:us-east-1:1:view/v";

beforeEach(() => {
  mockSend.mockReset();
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("resourceexplorer2 — indexes", () => {
  it("GET /indexes maps fields and fills defaults", async () => {
    mockSend.mockResolvedValueOnce({ Indexes: [{ Arn: INDEX_ARN, Region: "us-east-1", Type: "LOCAL" }] });
    const b = await (await get("/indexes")).json();
    expect(b.total).toBe(1);
    expect(b.indexes[0]).toEqual({ arn: INDEX_ARN, region: "us-east-1", type: "LOCAL" });
  });

  it("GET /indexes handles undefined and sparse rows", async () => {
    mockSend.mockResolvedValueOnce({});
    expect((await (await get("/indexes")).json()).indexes).toEqual([]);
    mockSend.mockResolvedValueOnce({ Indexes: [{}] });
    const b = await (await get("/indexes")).json();
    expect(b.indexes[0]).toEqual({ arn: undefined, region: null, type: null });
  });

  it("POST /indexes creates with tags variants", async () => {
    mockSend.mockResolvedValueOnce({ Arn: INDEX_ARN, CreatedAt: "t", State: "CREATING" });
    const res = await post("/indexes", { tags: { env: "dev" } });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ arn: INDEX_ARN, createdAt: "t", state: "CREATING" });
    expect(mockSend.mock.calls[0][0]).toMatchObject({ Tags: { env: "dev" } });

    await post("/indexes", { tags: '{"team":"core"}' });
    expect(mockSend.mock.calls[1][0].Tags).toEqual({ team: "core" });

    await post("/indexes", {});
    expect(mockSend.mock.calls[2][0].Tags).toBeUndefined();
  });

  it("POST /indexes 400 with invalid tags JSON", async () => {
    expect((await post("/indexes", { tags: "{bad" })).status).toBe(400);
  });

  it("DELETE /indexes requires arn", async () => {
    mockSend.mockResolvedValueOnce({ Arn: INDEX_ARN, LastUpdatedAt: "t", State: "DELETED" });
    const res = await del(`/indexes?arn=${encodeURIComponent(INDEX_ARN)}`);
    expect(await res.json()).toEqual({ arn: INDEX_ARN, lastUpdatedAt: "t", state: "DELETED" });
    expect((await del("/indexes")).status).toBe(400);
  });

  it("POST /indexes/type updates and validates", async () => {
    mockSend.mockResolvedValueOnce({ Arn: INDEX_ARN, LastUpdatedAt: "t", State: "ACTIVE", Type: "AGGREGATOR" });
    const res = await post("/indexes/type", { arn: INDEX_ARN, type: "AGGREGATOR" });
    expect(await res.json()).toEqual({ arn: INDEX_ARN, lastUpdatedAt: "t", state: "ACTIVE", type: "AGGREGATOR" });
    expect((await post("/indexes/type", { type: "AGGREGATOR" })).status).toBe(400);
    expect((await post("/indexes/type", { arn: INDEX_ARN })).status).toBe(400);
  });

  it("GET /indexes/detail passes through", async () => {
    mockSend.mockResolvedValueOnce({ Arn: INDEX_ARN, State: "ACTIVE", Type: "LOCAL" });
    const b = await (await get("/indexes/detail")).json();
    expect(b.index).toMatchObject({ Arn: INDEX_ARN });
  });
});

describe("resourceexplorer2 — views", () => {
  it("GET /views maps arn strings", async () => {
    mockSend.mockResolvedValueOnce({ Views: [VIEW_ARN] });
    const b = await (await get("/views")).json();
    expect(b.total).toBe(1);
    expect(b.views).toEqual([{ arn: VIEW_ARN }]);
  });

  it("GET /views handles undefined", async () => {
    mockSend.mockResolvedValueOnce({});
    expect((await (await get("/views")).json()).views).toEqual([]);
  });

  it("POST /views creates with filters, properties and scope", async () => {
    mockSend.mockResolvedValueOnce({ View: { ViewArn: VIEW_ARN } });
    const res = await post("/views", {
      viewName: "v",
      filters: "res:type eq s3:bucket",
      includedProperties: "tags",
      scope: "arn:aws:organizations::1:ou/o/x",
      tags: { a: "b" },
    });
    expect(res.status).toBe(201);
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      ViewName: "v",
      Filters: { FilterString: "res:type eq s3:bucket" },
      IncludedProperties: [{ Name: "tags" }],
      Scope: "arn:aws:organizations::1:ou/o/x",
    });
  });

  it("POST /views omits optional fields and 400s without name", async () => {
    mockSend.mockResolvedValueOnce({ View: { ViewArn: VIEW_ARN } });
    await post("/views", { viewName: "v" });
    expect(mockSend.mock.calls[0][0].Filters).toBeUndefined();
    expect(mockSend.mock.calls[0][0].IncludedProperties).toBeUndefined();
    expect(mockSend.mock.calls[0][0].Scope).toBeUndefined();
    expect((await post("/views", {})).status).toBe(400);
  });

  it("GET /views/detail requires arn and fills tags default", async () => {
    mockSend.mockResolvedValueOnce({ View: { ViewArn: VIEW_ARN }, Tags: { k: "v" } });
    const b = await (await get(`/views/detail?arn=${encodeURIComponent(VIEW_ARN)}`)).json();
    expect(b.view).toMatchObject({ ViewArn: VIEW_ARN });
    expect(b.tags).toEqual({ k: "v" });
    mockSend.mockResolvedValueOnce({ View: { ViewArn: VIEW_ARN } });
    const b2 = await (await get(`/views/detail?arn=${encodeURIComponent(VIEW_ARN)}`)).json();
    expect(b2.tags).toEqual({});
    expect((await get("/views/detail")).status).toBe(400);
  });

  it("PUT /views/update requires viewArn and maps fields", async () => {
    mockSend.mockResolvedValueOnce({ View: { ViewArn: VIEW_ARN } });
    const res = await put("/views/update", {
      viewArn: VIEW_ARN,
      filters: "service eq ec2",
      includedProperties: "tags",
    });
    expect(await res.json()).toEqual({ view: { ViewArn: VIEW_ARN } });
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      ViewArn: VIEW_ARN,
      Filters: { FilterString: "service eq ec2" },
      IncludedProperties: [{ Name: "tags" }],
    });
    expect((await put("/views/update", { filters: "x" })).status).toBe(400);
  });

  it("PUT /views/update omits empty includedProperties", async () => {
    mockSend.mockResolvedValueOnce({ View: { ViewArn: VIEW_ARN } });
    await put("/views/update", { viewArn: VIEW_ARN, includedProperties: "  " });
    expect(mockSend.mock.calls[0][0].IncludedProperties).toBeUndefined();
  });

  it("DELETE /views requires arn", async () => {
    const res = await del(`/views?arn=${encodeURIComponent(VIEW_ARN)}`);
    expect(await res.json()).toEqual({ viewArn: VIEW_ARN });
    expect((await del("/views")).status).toBe(400);
  });

  it("POST /views/batch-get passes through with defaults", async () => {
    mockSend.mockResolvedValueOnce({ Views: [{ ViewArn: VIEW_ARN }], Errors: [] });
    const b = await (await post("/views/batch-get", { viewArns: [VIEW_ARN] })).json();
    expect(b.views.length).toBe(1);
    mockSend.mockResolvedValueOnce(undefined);
    const b2 = await (await post("/views/batch-get", {})).json();
    expect(b2.views).toEqual([]);
    expect(b2.errors).toEqual([]);
  });

  it("POST /views/associate-default validates", async () => {
    const res = await post("/views/associate-default", { viewArn: VIEW_ARN });
    expect(await res.json()).toEqual({ viewArn: VIEW_ARN });
    expect((await post("/views/associate-default", {})).status).toBe(400);
  });

  it("POST /views/disassociate-default", async () => {
    const res = await post("/views/disassociate-default");
    expect(await res.json()).toEqual({ ok: true });
  });

  it("GET /views/default returns null when unset", async () => {
    mockSend.mockResolvedValueOnce({ ViewArn: VIEW_ARN });
    expect(await (await get("/views/default")).json()).toEqual({ viewArn: VIEW_ARN });
    mockSend.mockResolvedValueOnce({});
    expect(await (await get("/views/default")).json()).toEqual({ viewArn: null });
  });
});

describe("resourceexplorer2 — search and resources", () => {
  const resource = {
    Arn: "arn:aws:s3:::bucket",
    ResourceType: "s3:bucket",
    Region: "us-east-1",
    Service: "s3",
    OwningAccountId: "1",
    LastReportedAt: "t",
  };

  it("GET /resources maps with and without filter", async () => {
    mockSend.mockResolvedValueOnce({ Resources: [resource], ViewArn: VIEW_ARN });
    const b = await (await get("/resources?filter=service%20eq%20s3")).json();
    expect(b.total).toBe(1);
    expect(b.resources[0]).toMatchObject({ arn: "arn:aws:s3:::bucket", service: "s3" });
    expect(b.viewArn).toBe(VIEW_ARN);
    expect(mockSend.mock.calls[0][0].Filters).toMatchObject({ FilterString: "service eq s3" });

    mockSend.mockResolvedValueOnce({ Resources: [resource] });
    await get("/resources");
    expect(mockSend.mock.calls[1][0].Filters).toBeUndefined();
  });

  it("GET /resources handles undefined and sparse rows", async () => {
    mockSend.mockResolvedValueOnce({});
    const b = await (await get("/resources")).json();
    expect(b.resources).toEqual([]);
    expect(b.viewArn).toBeNull();
    mockSend.mockResolvedValueOnce({ Resources: [{}] });
    const b2 = await (await get("/resources")).json();
    expect(b2.resources[0]).toEqual({
      arn: undefined,
      resourceType: null,
      region: null,
      service: null,
      owningAccountId: null,
      lastReportedAt: null,
    });
  });

  it("POST /search requires queryString and maps results", async () => {
    mockSend.mockResolvedValueOnce({ Resources: [resource], ViewArn: VIEW_ARN });
    const res = await post("/search", { queryString: "service:s3", viewArn: VIEW_ARN, maxResults: 10 });
    expect(await res.json()).toMatchObject({ total: 1, viewArn: VIEW_ARN });
    expect(mockSend.mock.calls[0][0]).toMatchObject({ QueryString: "service:s3", ViewArn: VIEW_ARN, MaxResults: 10 });
    expect((await post("/search", {})).status).toBe(400);
  });

  it("POST /search omits optional fields", async () => {
    mockSend.mockResolvedValueOnce(undefined);
    await post("/search", { queryString: "q" });
    expect(mockSend.mock.calls[0][0].ViewArn).toBeUndefined();
    expect(mockSend.mock.calls[0][0].MaxResults).toBeUndefined();
  });

  it("POST /search fills sparse-row defaults", async () => {
    mockSend.mockResolvedValueOnce({ Resources: [{}] });
    const b = await (await post("/search", { queryString: "q" })).json();
    expect(b.resources[0]).toEqual({
      arn: undefined,
      resourceType: null,
      region: null,
      service: null,
      owningAccountId: null,
    });
  });

  it("GET /resource-types maps fields", async () => {
    mockSend.mockResolvedValueOnce({ Types: [{ ResourceType: "s3:bucket", Service: "s3" }] });
    const b = await (await get("/resource-types")).json();
    expect(b.total).toBe(1);
    expect(b.types[0]).toEqual({ resourceType: "s3:bucket", service: "s3" });
  });

  it("GET /resource-types handles undefined and sparse", async () => {
    mockSend.mockResolvedValueOnce({});
    expect((await (await get("/resource-types")).json()).types).toEqual([]);
    mockSend.mockResolvedValueOnce({ Types: [{}] });
    const b = await (await get("/resource-types")).json();
    expect(b.types[0]).toEqual({ resourceType: null, service: null });
  });

  it("GET /service-config passes through", async () => {
    mockSend.mockResolvedValueOnce({ OrgConfiguration: { AWSServiceAccessStatus: "DISABLED" } });
    const b = await (await get("/service-config")).json();
    expect(b.OrgConfiguration).toMatchObject({ AWSServiceAccessStatus: "DISABLED" });
  });
});

describe("resourceexplorer2 — member and service surfaces", () => {
  it("GET /member-indexes requires accounts and passes through", async () => {
    mockSend.mockResolvedValueOnce({ Indexes: [] });
    const b = await (await get("/member-indexes?accounts=1, 2")).json();
    expect(b.Indexes).toEqual([]);
    expect(mockSend.mock.calls[0][0]).toMatchObject({ AccountIdList: ["1", "2"] });
    expect((await get("/member-indexes")).status).toBe(400);
  });

  it("managed/service/index/streaming routes pass through and validate arns", async () => {
    mockSend.mockResolvedValue({ ok: true });
    for (const path of [
      "/managed-views",
      "/service-views",
      "/service-indexes",
      "/service-index",
      "/streaming-access",
    ]) {
      expect((await (await get(path)).json()).ok).toBe(true);
    }
    expect((await (await get("/managed-views/detail?arn=x")).json()).ok).toBe(true);
    expect((await get("/managed-views/detail")).status).toBe(400);
    expect((await (await get("/service-views/detail?arn=x")).json()).ok).toBe(true);
    expect((await get("/service-views/detail")).status).toBe(400);
  });
});

describe("resourceexplorer2 — setup", () => {
  it("POST /setup creates and validates", async () => {
    mockSend.mockResolvedValueOnce({ TaskId: "task-1" });
    const res = await post("/setup", { regionList: ["us-east-1", "us-west-2"], viewName: "v", aggregatorRegions: ["us-east-1"] });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ taskId: "task-1" });
    expect(mockSend.mock.calls[0][0]).toMatchObject({ RegionList: ["us-east-1", "us-west-2"], ViewName: "v" });
    expect((await post("/setup", {})).status).toBe(400);
    expect((await post("/setup", { regionList: "not-array" })).status).toBe(400);
  });

  it("POST /setup omits optional fields", async () => {
    mockSend.mockResolvedValueOnce({ TaskId: "task-3" });
    await post("/setup", { regionList: ["us-east-1"] });
    expect(mockSend.mock.calls[0][0].ViewName).toBeUndefined();
    expect(mockSend.mock.calls[0][0].AggregatorRegions).toBeUndefined();
  });

  it("POST /setup/delete validates and sends flags", async () => {
    mockSend.mockResolvedValueOnce({ TaskId: "task-2" });
    const res = await post("/setup/delete", { regionList: ["us-east-1"], deleteInAllRegions: true });
    expect(await res.json()).toEqual({ taskId: "task-2" });
    expect(mockSend.mock.calls[0][0]).toMatchObject({ DeleteInAllRegions: true, RegionList: ["us-east-1"] });
    expect((await post("/setup/delete", {})).status).toBe(400);
  });

  it("GET /setup requires taskId and passes through", async () => {
    mockSend.mockResolvedValueOnce({ TaskId: "task-1", Regions: ["us-east-1"] });
    const b = await (await get("/setup?taskId=task-1")).json();
    expect(b.TaskId).toBe("task-1");
    expect((await get("/setup")).status).toBe(400);
  });
});
