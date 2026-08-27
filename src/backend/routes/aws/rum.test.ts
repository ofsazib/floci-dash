import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) {
      return { __cmdName: name, ...args };
    });
  };
});

vi.mock("@aws-sdk/client-rum", () => ({
  RUMClient: vi.fn(function () {
    return { send: mockSend };
  }),
  ListAppMonitorsCommand: createCmd("ListAppMonitorsCommand"),
  GetAppMonitorCommand: createCmd("GetAppMonitorCommand"),
  CreateAppMonitorCommand: createCmd("CreateAppMonitorCommand"),
  UpdateAppMonitorCommand: createCmd("UpdateAppMonitorCommand"),
  DeleteAppMonitorCommand: createCmd("DeleteAppMonitorCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./rum";

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

async function patchReq(path: string, body?: any) {
  return router.request(path, {
    method: "PATCH",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}

async function del(path: string) {
  return router.request(path, { method: "DELETE" });
}

beforeEach(() => {
  mockSend.mockReset();
});

describe("RUM routes", () => {
  it("lists app monitors", async () => {
    mockSend.mockResolvedValueOnce({
      AppMonitorSummaries: [
        {
          Name: "mon-a",
          Id: "id-1",
          State: "ACTIVE",
          Platform: "web",
          Created: 1,
          LastModified: 2,
        },
      ],
      NextToken: "tok",
    });
    const res = await get("/appmonitors");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.appMonitors).toHaveLength(1);
    expect(json.total).toBe(1);
    expect(json.nextToken).toBe("tok");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("ListAppMonitorsCommand");
  });

  it("returns empty list and null token when none", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/appmonitors");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ appMonitors: [], total: 0, nextToken: null });
  });

  it("forwards nextToken query param to the command", async () => {
    mockSend.mockResolvedValueOnce({});
    await get("/appmonitors?nextPage=1&nextToken=t%201");
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "ListAppMonitorsCommand",
      NextToken: "t 1",
    });
  });

  it("gets app monitor detail", async () => {
    mockSend.mockResolvedValueOnce({
      AppMonitor: {
        Id: "id-1",
        Name: "mon-a",
        Domain: "example.com",
        DomainList: ["example.com"],
        State: "ACTIVE",
        Platform: "web",
        Created: 111,
        LastModified: 222,
        Tags: { k: "v" },
      },
    });
    const res = await get("/appmonitors/mon-a");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.appMonitor.name).toBe("mon-a");
    expect(json.appMonitor.domain).toEqual("example.com");
    expect(json.appMonitor.domainList).toEqual(["example.com"]);
    expect(json.appMonitor.created).toBe("111");
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "GetAppMonitorCommand",
      Name: "mon-a",
    });
  });

  it("returns null monitor when missing", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/appmonitors/nope");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ appMonitor: null });
  });

  it("defaults optional monitor fields when absent", async () => {
    mockSend.mockResolvedValueOnce({
      AppMonitor: { Id: "id-2", Name: "mon-b", State: "ACTIVE" },
    });
    const res = await get("/appmonitors/mon-b");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      appMonitor: {
        id: "id-2",
        name: "mon-b",
        domain: undefined,
        domainList: [],
        state: "ACTIVE",
        platform: undefined,
        created: "",
        lastModified: "",
        tags: undefined,
      },
    });
  });

  it("creates an app monitor", async () => {
    mockSend.mockResolvedValueOnce({ Id: "new-id" });
    const res = await post("/appmonitors", {
      name: "mon-b",
      domain: "example.org",
      platform: "web",
    });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: "new-id" });
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "CreateAppMonitorCommand",
      Name: "mon-b",
      Domain: "example.org",
      Platform: "web",
    });
  });

  it("rejects create without name", async () => {
    const res = await post("/appmonitors", { domain: "d" });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "name is required" });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("rejects create without domain", async () => {
    const res = await post("/appmonitors", { name: "n" });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "domain is required" });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("updates an app monitor", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await patchReq("/appmonitors/mon-a", {
      domain: "example.net",
      domains: ["a.com"],
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ updated: true });
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "UpdateAppMonitorCommand",
      Name: "mon-a",
      Domain: "example.net",
      DomainList: ["a.com"],
    });
  });

  it("deletes an app monitor", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/appmonitors/mon-a");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ deleted: true });
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "DeleteAppMonitorCommand",
      Name: "mon-a",
    });
  });
});
