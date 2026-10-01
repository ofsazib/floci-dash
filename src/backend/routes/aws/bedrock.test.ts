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

vi.mock("@aws-sdk/client-bedrock", () => ({
  BedrockClient: mockClient,
  CreateGuardrailCommand: createCmd("CreateGuardrailCommand"),
  GetGuardrailCommand: createCmd("GetGuardrailCommand"),
  UpdateGuardrailCommand: createCmd("UpdateGuardrailCommand"),
  DeleteGuardrailCommand: createCmd("DeleteGuardrailCommand"),
  CreateGuardrailVersionCommand: createCmd("CreateGuardrailVersionCommand"),
  ListGuardrailsCommand: createCmd("ListGuardrailsCommand"),
  TagResourceCommand: createCmd("TagResourceCommand"),
  UntagResourceCommand: createCmd("UntagResourceCommand"),
  ListTagsForResourceCommand: createCmd("ListTagsForResourceCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./bedrock";

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

const GUARDRAIL = {
  name: "safe",
  guardrailId: "gr-1",
  version: "DRAFT",
  status: "READY",
};

beforeEach(() => {
  vi.clearAllMocks();
  mockSend.mockReset();
});

describe("GET /guardrails", () => {
  it("lists guardrails", async () => {
    mockSend.mockResolvedValueOnce({ guardrails: [GUARDRAIL] });
    const res = await get("/guardrails");
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.total).toBe(1);
    expect(json.guardrails[0].name).toBe("safe");
  });

  it("returns sparse guardrails", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/guardrails");
    const json = await res.json();
    expect(json.guardrails).toEqual([]);
    expect(json.total).toBe(0);
  });
});

describe("POST /guardrails", () => {
  it("creates a guardrail", async () => {
    mockSend.mockResolvedValueOnce({ ...GUARDRAIL });
    const res = await post("/guardrails", {
      name: "safe",
      blockedInputMessaging: "blocked in",
      blockedOutputsMessaging: "blocked out",
      contentPolicyConfig: { filtersConfig: [] },
    });
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.guardrail.name).toBe("safe");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "CreateGuardrailCommand",
        name: "safe",
        blockedInputMessaging: "blocked in",
        contentPolicyConfig: { filtersConfig: [] },
      })
    );
  });

  it("400 without name", async () => {
    expect(
      (await post("/guardrails", { blockedInputMessaging: "b", blockedOutputsMessaging: "o" })).status
    ).toBe(400);
  });

  it("400 without blockedInputMessaging", async () => {
    expect((await post("/guardrails", { name: "safe", blockedOutputsMessaging: "o" })).status).toBe(400);
  });

  it("400 without blockedOutputsMessaging", async () => {
    expect((await post("/guardrails", { name: "safe", blockedInputMessaging: "b" })).status).toBe(400);
  });
});

describe("GET /guardrails/:id", () => {
  it("gets a guardrail", async () => {
    mockSend.mockResolvedValueOnce({ ...GUARDRAIL });
    const res = await get("/guardrails/gr-1");
    const json = await res.json();
    expect(json.guardrail.guardrailId).toBe("gr-1");
  });

  it("returns null when absent", async () => {
    mockSend.mockResolvedValueOnce(null);
    const res = await get("/guardrails/none");
    const json = await res.json();
    expect(json.guardrail).toBeNull();
  });
});

describe("PUT /guardrails/:id", () => {
  it("updates a guardrail", async () => {
    mockSend.mockResolvedValueOnce({ ...GUARDRAIL });
    const res = await put("/guardrails/gr-1", {
      name: "safe2",
      blockedInputMessaging: "in",
      blockedOutputsMessaging: "out",
    });
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "UpdateGuardrailCommand",
        guardrailIdentifier: "gr-1",
        name: "safe2",
      })
    );
  });

  it("400 update without required fields", async () => {
    expect((await put("/guardrails/gr-1", {})).status).toBe(400);
    expect(
      (await put("/guardrails/gr-1", { name: "s", blockedInputMessaging: "b" })).status
    ).toBe(400);
  });
});

describe("POST /guardrails/:id/versions", () => {
  it("creates a version", async () => {
    mockSend.mockResolvedValueOnce({ version: "1", guardrailId: "gr-1" });
    const res = await post("/guardrails/gr-1/versions", { description: "first" });
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.version).toBe("1");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "CreateGuardrailVersionCommand",
        guardrailIdentifier: "gr-1",
        description: "first",
      })
    );
  });

  it("creates a version without description", async () => {
    mockSend.mockResolvedValueOnce({ version: "1" });
    await post("/guardrails/gr-1/versions");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ __cmdName: "CreateGuardrailVersionCommand" })
    );
  });
});

describe("DELETE /guardrails/:id", () => {
  it("deletes a guardrail", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/guardrails/gr-1");
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "DeleteGuardrailCommand",
        guardrailIdentifier: "gr-1",
      })
    );
  });

  it("passes a version query param when given", async () => {
    mockSend.mockResolvedValueOnce({});
    await del("/guardrails/gr-1?version=2");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "DeleteGuardrailCommand",
        guardrailVersion: "2",
      })
    );
  });
});

describe("tags", () => {
  it("lists tags", async () => {
    mockSend.mockResolvedValueOnce({ tags: [{ key: "env", value: "dev" }] });
    const res = await get("/resources/tags?arn=arn%3Abr");
    const json = await res.json();
    expect(json.tags).toEqual([{ key: "env", value: "dev" }]);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "ListTagsForResourceCommand",
        resourceARN: "arn:br",
      })
    );
  });

  it("returns sparse tags", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/resources/tags?arn=arn%3Abr");
    const json = await res.json();
    expect(json.tags).toEqual([]);
  });

  it("400 tag list without arn", async () => {
    expect((await get("/resources/tags")).status).toBe(400);
  });

  it("adds tags", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/resources/tags", {
      resourceARN: "arn:br",
      tags: [{ key: "env", value: "dev" }],
    });
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "TagResourceCommand",
        resourceARN: "arn:br",
      })
    );
  });

  it("400 add tags without arn or empty tags", async () => {
    expect((await post("/resources/tags", { tags: [{ key: "k", value: "v" }] })).status).toBe(400);
    expect((await post("/resources/tags", { resourceARN: "arn:br" })).status).toBe(400);
    expect((await post("/resources/tags", { resourceARN: "arn:br", tags: [] })).status).toBe(400);
  });

  it("removes tags", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/resources/tags/untag", { resourceARN: "arn:br", tagKeys: ["env"] });
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "UntagResourceCommand",
        tagKeys: ["env"],
      })
    );
  });

  it("400 untag without arn or empty keys", async () => {
    expect((await post("/resources/tags/untag", { tagKeys: ["env"] })).status).toBe(400);
    expect((await post("/resources/tags/untag", { resourceARN: "arn:br" })).status).toBe(400);
    expect((await post("/resources/tags/untag", { resourceARN: "arn:br", tagKeys: [] })).status).toBe(400);
  });
});
