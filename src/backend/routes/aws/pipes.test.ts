import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) {
      return { __cmdName: name, ...args };
    });
  };
});

vi.mock("@aws-sdk/client-pipes", () => ({
  PipesClient: vi.fn(function () {
    return { send: mockSend };
  }),
  ListPipesCommand: createCmd("ListPipesCommand"),
  CreatePipeCommand: createCmd("CreatePipeCommand"),
  DescribePipeCommand: createCmd("DescribePipeCommand"),
  UpdatePipeCommand: createCmd("UpdatePipeCommand"),
  DeletePipeCommand: createCmd("DeletePipeCommand"),
  StartPipeCommand: createCmd("StartPipeCommand"),
  StopPipeCommand: createCmd("StopPipeCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: (Ctor: any, extra?: any) => new Ctor(extra),
}));

import router from "./pipes";

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
  mockSend.mockReset();
});

describe("Pipes Routes", () => {
  describe("List & Describe", () => {
    it("GET /pipes — lists pipes", async () => {
      mockSend.mockResolvedValueOnce({
        Pipes: [{ Name: "pipe-1", Source: "sqs:queue", Target: "lambda:fn", CurrentState: "RUNNING" }],
      });
      const res = await get("/pipes");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.pipes[0].Name).toBe("pipe-1");
    });

    it("GET /pipes — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ Pipes: [] });
      const res = await get("/pipes");
      const body = await res.json();
      expect(body.total).toBe(0);
    });

    it("GET /pipes?namePrefix=abc — passes namePrefix", async () => {
      mockSend.mockResolvedValueOnce({ Pipes: [] });
      await get("/pipes?namePrefix=abc");
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it("GET /pipes/:name — describes pipe", async () => {
      mockSend.mockResolvedValueOnce({ Name: "pipe-1", CurrentState: "RUNNING" });
      const res = await get("/pipes/pipe-1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.pipe.Name).toBe("pipe-1");
    });
  });

  describe("Create", () => {
    it("POST /pipes — creates pipe (201)", async () => {
      mockSend.mockResolvedValueOnce({ Name: "pipe-1" });
      const res = await post("/pipes", {
        name: "pipe-1",
        source: "sqs:queue",
        target: "lambda:fn",
        roleArn: "arn:aws:iam::123:role/pipe",
      });
      expect(res.status).toBe(201);
    });

    it("POST /pipes — 400 if name missing", async () => {
      const res = await post("/pipes", { source: "s", target: "t", roleArn: "r" });
      expect(res.status).toBe(400);
    });

    it("POST /pipes — 400 if source missing", async () => {
      const res = await post("/pipes", { name: "p", target: "t", roleArn: "r" });
      expect(res.status).toBe(400);
    });

    it("POST /pipes — 400 if target missing", async () => {
      const res = await post("/pipes", { name: "p", source: "s", roleArn: "r" });
      expect(res.status).toBe(400);
    });

    it("POST /pipes — 400 if roleArn missing", async () => {
      const res = await post("/pipes", { name: "p", source: "s", target: "t" });
      expect(res.status).toBe(400);
    });
  });

  describe("Update", () => {
    it("PUT /pipes/:name — updates pipe", async () => {
      mockSend.mockResolvedValueOnce({ Name: "pipe-1" });
      const res = await put("/pipes/pipe-1", { description: "updated" });
      expect(res.status).toBe(200);
    });
  });

  describe("Delete", () => {
    it("DELETE /pipes/:name — deletes pipe", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/pipes/pipe-1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });
  });

  describe("Start & Stop", () => {
    it("POST /pipes/:name/start — starts pipe", async () => {
      mockSend.mockResolvedValueOnce({ Name: "pipe-1", CurrentState: "RUNNING" });
      const res = await post("/pipes/pipe-1/start");
      expect(res.status).toBe(200);
    });

    it("POST /pipes/:name/stop — stops pipe", async () => {
      mockSend.mockResolvedValueOnce({ Name: "pipe-1", CurrentState: "STOPPED" });
      const res = await post("/pipes/pipe-1/stop");
      expect(res.status).toBe(200);
    });
  });
});
