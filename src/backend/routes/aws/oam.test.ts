import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockClient = vi.hoisted(() =>
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

vi.mock("@aws-sdk/client-oam", () => ({
  OAMClient: mockClient,
  ListSinksCommand: createCmd("ListSinksCommand"),
  CreateSinkCommand: createCmd("CreateSinkCommand"),
  GetSinkCommand: createCmd("GetSinkCommand"),
  DeleteSinkCommand: createCmd("DeleteSinkCommand"),
  PutSinkPolicyCommand: createCmd("PutSinkPolicyCommand"),
  GetSinkPolicyCommand: createCmd("GetSinkPolicyCommand"),
  ListAttachedLinksCommand: createCmd("ListAttachedLinksCommand"),
  ListLinksCommand: createCmd("ListLinksCommand"),
  CreateLinkCommand: createCmd("CreateLinkCommand"),
  GetLinkCommand: createCmd("GetLinkCommand"),
  UpdateLinkCommand: createCmd("UpdateLinkCommand"),
  DeleteLinkCommand: createCmd("DeleteLinkCommand"),
  ListTagsForResourceCommand: createCmd("ListTagsForResourceCommand"),
  TagResourceCommand: createCmd("TagResourceCommand"),
  UntagResourceCommand: createCmd("UntagResourceCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./oam";

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

async function put(path: string, body?: any) {
  return router.request(path, {
    method: "PUT",
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

describe("sinks", () => {
  it("lists sinks", async () => {
    mockSend.mockResolvedValueOnce({
      Items: [{ Arn: "arn:aws:oam::1:sink/s", Id: "s1", Name: "monitor" }],
    });
    const res = await get("/sinks");
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.total).toBe(1);
    expect(json.sinks[0].Name).toBe("monitor");
  });

  it("returns sparse sinks", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/sinks");
    const json = await res.json();
    expect(json.sinks).toEqual([]);
    expect(json.total).toBe(0);
  });

  it("creates a sink", async () => {
    mockSend.mockResolvedValueOnce({ Arn: "arn:aws:oam::1:sink/s", Id: "s1", Name: "monitor" });
    const res = await post("/sinks", { name: "monitor" });
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.sink.Name).toBe("monitor");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "CreateSinkCommand",
        Name: "monitor",
      })
    );
  });

  it("400 when sink name missing", async () => {
    expect((await post("/sinks", {})).status).toBe(400);
  });

  it("gets a sink", async () => {
    mockSend.mockResolvedValueOnce({ Arn: "arn", Id: "s1", Name: "monitor" });
    const res = await get("/sinks/s1");
    const json = await res.json();
    expect(json.sink.Name).toBe("monitor");
  });

  it("returns null sink when absent", async () => {
    mockSend.mockResolvedValueOnce(null);
    const res = await get("/sinks/none");
    const json = await res.json();
    expect(json.sink).toBeNull();
  });

  it("deletes a sink", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/sinks/s1");
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "DeleteSinkCommand",
        Identifier: "s1",
      })
    );
  });

  it("gets the sink policy", async () => {
    mockSend.mockResolvedValueOnce({
      Policy: '{"allow":true}',
      SinkArn: "arn",
      SinkId: "s1",
    });
    const res = await get("/sinks/s1/policy");
    const json = await res.json();
    expect(json.policy).toBe('{"allow":true}');
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "GetSinkPolicyCommand",
        SinkIdentifier: "s1",
      })
    );
  });

  it("nulls policy when none set", async () => {
    mockSend.mockResolvedValueOnce({ SinkArn: "arn", SinkId: "s1" });
    const res = await get("/sinks/s1/policy");
    const json = await res.json();
    expect(json.policy).toBeNull();
  });

  it("puts the sink policy", async () => {
    mockSend.mockResolvedValueOnce({ Policy: "p", SinkArn: "arn", SinkId: "s1" });
    const res = await put("/sinks/s1/policy", { policy: "p" });
    const json = await res.json();
    expect(json.sinkArn).toBe("arn");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "PutSinkPolicyCommand",
        SinkIdentifier: "s1",
        Policy: "p",
      })
    );
  });

  it("400 policy put without policy", async () => {
    expect((await put("/sinks/s1/policy", {})).status).toBe(400);
  });

  it("lists attached links", async () => {
    mockSend.mockResolvedValueOnce({
      Items: [{ Label: "l", LinkArn: "arn:l", ResourceTypes: ["AWS::Metric"] }],
    });
    const res = await get("/sinks/s1/attached-links");
    const json = await res.json();
    expect(json.total).toBe(1);
    expect(json.links[0].LinkArn).toBe("arn:l");
  });

  it("returns sparse attached links", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/sinks/s1/attached-links");
    const json = await res.json();
    expect(json.links).toEqual([]);
  });
});

describe("links", () => {
  it("lists links", async () => {
    mockSend.mockResolvedValueOnce({
      Items: [{ Arn: "arn:l", Id: "l1", Label: "l", ResourceTypes: ["AWS::Metric"], SinkArn: "arn:s" }],
    });
    const res = await get("/links");
    const json = await res.json();
    expect(json.total).toBe(1);
  });

  it("returns sparse links", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/links");
    const json = await res.json();
    expect(json.links).toEqual([]);
  });

  it("creates a link", async () => {
    mockSend.mockResolvedValueOnce({ Arn: "arn:l", Id: "l1", Label: "%s" });
    const res = await post("/links", {
      sinkIdentifier: "s1",
      labelTemplate: "$AccountName",
      resourceTypes: ["AWS::Metric"],
    });
    expect(res.status).toBe(201);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "CreateLinkCommand",
        SinkIdentifier: "s1",
        LabelTemplate: "$AccountName",
        ResourceTypes: ["AWS::Metric"],
      })
    );
  });

  it("400 link create without sinkIdentifier", async () => {
    expect((await post("/links", { labelTemplate: "x", resourceTypes: ["AWS::Metric"] })).status).toBe(400);
  });

  it("400 link create without labelTemplate", async () => {
    expect((await post("/links", { sinkIdentifier: "s1", resourceTypes: ["AWS::Metric"] })).status).toBe(400);
  });

  it("400 link create without resourceTypes", async () => {
    expect((await post("/links", { sinkIdentifier: "s1", labelTemplate: "x" })).status).toBe(400);
    expect(
      (await post("/links", { sinkIdentifier: "s1", labelTemplate: "x", resourceTypes: [] })).status
    ).toBe(400);
  });

  it("gets a link", async () => {
    mockSend.mockResolvedValueOnce({ Arn: "arn:l", Id: "l1" });
    const res = await get("/links/l1");
    const json = await res.json();
    expect(json.link.Id).toBe("l1");
  });

  it("returns null link when absent", async () => {
    mockSend.mockResolvedValueOnce(null);
    const res = await get("/links/none");
    const json = await res.json();
    expect(json.link).toBeNull();
  });

  it("updates a link", async () => {
    mockSend.mockResolvedValueOnce({ Arn: "arn:l", Id: "l1" });
    const res = await put("/links/l1", { resourceTypes: ["AWS::Log"] });
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "UpdateLinkCommand",
        Identifier: "l1",
        ResourceTypes: ["AWS::Log"],
      })
    );
  });

  it("400 link update without resourceTypes", async () => {
    expect((await put("/links/l1", {})).status).toBe(400);
  });

  it("deletes a link", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/links/l1");
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "DeleteLinkCommand",
        Identifier: "l1",
      })
    );
  });
});

describe("tags", () => {
  it("lists tags accepting capital-T Tags from Floci", async () => {
    mockSend.mockResolvedValueOnce({ Tags: { env: "dev" } });
    const res = await get("/resources/tags?arn=arn%3Aaws");
    const json = await res.json();
    expect(json.tags).toEqual({ env: "dev" });
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "ListTagsForResourceCommand",
        ResourceArn: "arn:aws",
      })
    );
  });

  it("accepts lowercase tags", async () => {
    mockSend.mockResolvedValueOnce({ tags: { env: "dev" } });
    const res = await get("/resources/tags?arn=arn%3Aaws");
    const json = await res.json();
    expect(json.tags).toEqual({ env: "dev" });
  });

  it("returns empty tags when absent", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/resources/tags?arn=arn%3Aaws");
    const json = await res.json();
    expect(json.tags).toEqual({});
  });

  it("400 tag list without arn", async () => {
    expect((await get("/resources/tags")).status).toBe(400);
  });

  it("adds tags", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/resources/tags", { arn: "arn:aws", tags: { env: "dev" } });
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "TagResourceCommand",
        ResourceArn: "arn:aws",
        Tags: { env: "dev" },
      })
    );
  });

  it("400 add tags without arn or empty tags", async () => {
    expect((await post("/resources/tags", { tags: { env: "dev" } })).status).toBe(400);
    expect((await post("/resources/tags", { arn: "arn:aws" })).status).toBe(400);
    expect((await post("/resources/tags", { arn: "arn:aws", tags: {} })).status).toBe(400);
  });

  it("removes tags", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/resources/tags/untag", { arn: "arn:aws", tagKeys: ["env"] });
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "UntagResourceCommand",
        TagKeys: ["env"],
      })
    );
  });

  it("400 untag without arn or empty keys", async () => {
    expect((await post("/resources/tags/untag", { tagKeys: ["env"] })).status).toBe(400);
    expect((await post("/resources/tags/untag", { arn: "arn:aws" })).status).toBe(400);
    expect((await post("/resources/tags/untag", { arn: "arn:aws", tagKeys: [] })).status).toBe(400);
  });
});
