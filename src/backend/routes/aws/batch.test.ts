import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockBatch = vi.hoisted(() =>
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

vi.mock("@aws-sdk/client-batch", () => ({
  BatchClient: mockBatch,
  CreateComputeEnvironmentCommand: createCmd("CreateComputeEnvironmentCommand"),
  DescribeComputeEnvironmentsCommand: createCmd("DescribeComputeEnvironmentsCommand"),
  DeleteComputeEnvironmentCommand: createCmd("DeleteComputeEnvironmentCommand"),
  CreateJobQueueCommand: createCmd("CreateJobQueueCommand"),
  DescribeJobQueuesCommand: createCmd("DescribeJobQueuesCommand"),
  DeleteJobQueueCommand: createCmd("DeleteJobQueueCommand"),
  RegisterJobDefinitionCommand: createCmd("RegisterJobDefinitionCommand"),
  DeregisterJobDefinitionCommand: createCmd("DeregisterJobDefinitionCommand"),
  DescribeJobDefinitionsCommand: createCmd("DescribeJobDefinitionsCommand"),
  SubmitJobCommand: createCmd("SubmitJobCommand"),
  DescribeJobsCommand: createCmd("DescribeJobsCommand"),
  ListJobsCommand: createCmd("ListJobsCommand"),
  TerminateJobCommand: createCmd("TerminateJobCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./batch";

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

describe("Batch — Compute Environments", () => {
  it("GET /compute-environments — returns empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/compute-environments");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ computeEnvironments: [], total: 0 });
  });

  it("GET /compute-environments — returns environments", async () => {
    mockSend.mockResolvedValueOnce({ computeEnvironments: [{ computeEnvironmentName: "ce1" }] });
    const res = await get("/compute-environments");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.computeEnvironments).toHaveLength(1);
    expect(json.total).toBe(1);
  });

  it("GET /compute-environments/:name — returns single", async () => {
    mockSend.mockResolvedValueOnce({ computeEnvironments: [{ computeEnvironmentName: "my-ce" }] });
    const res = await get("/compute-environments/my-ce");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.computeEnvironment).toEqual({ computeEnvironmentName: "my-ce" });
  });

  it("GET /compute-environments/:name — returns null when not found", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/compute-environments/nonexistent");
    const json = await res.json();
    expect(json.computeEnvironment).toBeNull();
  });

  it("POST /compute-environments — 400 when name missing", async () => {
    const res = await post("/compute-environments", { type: "MANAGED" });
    expect(res.status).toBe(400);
  });

  it("POST /compute-environments — 400 when type missing", async () => {
    const res = await post("/compute-environments", { computeEnvironmentName: "ce1" });
    expect(res.status).toBe(400);
  });

  it("POST /compute-environments — creates environment", async () => {
    mockSend.mockResolvedValueOnce({ computeEnvironmentName: "ce1", computeEnvironmentArn: "arn:ce1" });
    const res = await post("/compute-environments", { computeEnvironmentName: "ce1", type: "MANAGED" });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.computeEnvironmentName).toBe("ce1");
  });

  it("DELETE /compute-environments/:name — deletes", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/compute-environments/my-ce");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.deleted).toBe(true);
  });
});

describe("Batch — Job Queues", () => {
  it("GET /job-queues — returns empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/job-queues");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ jobQueues: [], total: 0 });
  });

  it("GET /job-queues — returns queues", async () => {
    mockSend.mockResolvedValueOnce({ jobQueues: [{ jobQueueName: "jq1" }] });
    const res = await get("/job-queues");
    const json = await res.json();
    expect(json.jobQueues).toHaveLength(1);
  });

  it("GET /job-queues/:name — returns single", async () => {
    mockSend.mockResolvedValueOnce({ jobQueues: [{ jobQueueName: "my-jq" }] });
    const res = await get("/job-queues/my-jq");
    const json = await res.json();
    expect(json.jobQueue).toEqual({ jobQueueName: "my-jq" });
  });

  it("POST /job-queues — 400 when name missing", async () => {
    const res = await post("/job-queues", { priority: 1 });
    expect(res.status).toBe(400);
  });

  it("POST /job-queues — 400 when priority missing", async () => {
    const res = await post("/job-queues", { jobQueueName: "jq1" });
    expect(res.status).toBe(400);
  });

  it("POST /job-queues — creates queue", async () => {
    mockSend.mockResolvedValueOnce({ jobQueueName: "jq1", jobQueueArn: "arn:jq1" });
    const res = await post("/job-queues", { jobQueueName: "jq1", priority: 5 });
    expect(res.status).toBe(201);
  });

  it("DELETE /job-queues/:name — deletes", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/job-queues/my-jq");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.deleted).toBe(true);
  });
});

describe("Batch — Job Definitions", () => {
  it("GET /job-definitions — returns empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/job-definitions");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ jobDefinitions: [], total: 0 });
  });

  it("GET /job-definitions — returns definitions", async () => {
    mockSend.mockResolvedValueOnce({ jobDefinitions: [{ jobDefinitionName: "jd1" }] });
    const res = await get("/job-definitions");
    const json = await res.json();
    expect(json.jobDefinitions).toHaveLength(1);
  });

  it("GET /job-definitions/:name — returns single", async () => {
    mockSend.mockResolvedValueOnce({ jobDefinitions: [{ jobDefinitionName: "my-jd" }] });
    const res = await get("/job-definitions/my-jd");
    const json = await res.json();
    expect(json.jobDefinition).toEqual({ jobDefinitionName: "my-jd" });
  });

  it("POST /job-definitions — 400 when name missing", async () => {
    const res = await post("/job-definitions", { type: "container", containerProperties: {} });
    expect(res.status).toBe(400);
  });

  it("POST /job-definitions — 400 when type missing", async () => {
    const res = await post("/job-definitions", { jobDefinitionName: "jd1", containerProperties: {} });
    expect(res.status).toBe(400);
  });

  it("POST /job-definitions — 400 when containerProperties missing", async () => {
    const res = await post("/job-definitions", { jobDefinitionName: "jd1", type: "container" });
    expect(res.status).toBe(400);
  });

  it("POST /job-definitions — registers definition", async () => {
    mockSend.mockResolvedValueOnce({ jobDefinitionName: "jd1", jobDefinitionArn: "arn:jd1", revision: 1 });
    const res = await post("/job-definitions", { jobDefinitionName: "jd1", type: "container", containerProperties: { image: "busybox" } });
    expect(res.status).toBe(201);
  });

  it("DELETE /job-definitions/:name — deregisters", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/job-definitions/my-jd");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.deleted).toBe(true);
  });
});

describe("Batch — Jobs", () => {
  it("GET /jobs — returns list", async () => {
    mockSend.mockResolvedValueOnce({ jobSummaryList: [{ jobId: "j1", jobName: "test" }] });
    const res = await get("/jobs");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.jobs).toHaveLength(1);
    expect(json.total).toBe(1);
  });

  it("GET /jobs — returns empty when none", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/jobs");
    const json = await res.json();
    expect(json.jobs).toEqual([]);
    expect(json.total).toBe(0);
  });

  it("GET /jobs/:id — returns single job", async () => {
    mockSend.mockResolvedValueOnce({ jobs: [{ jobId: "j1" }] });
    const res = await get("/jobs/j1");
    const json = await res.json();
    expect(json.job).toEqual({ jobId: "j1" });
  });

  it("GET /jobs/:id — returns null when not found", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/jobs/nonexistent");
    const json = await res.json();
    expect(json.job).toBeNull();
  });

  it("POST /jobs — 400 when jobName missing", async () => {
    const res = await post("/jobs", { jobQueue: "q1", jobDefinition: "d1" });
    expect(res.status).toBe(400);
  });

  it("POST /jobs — 400 when jobQueue missing", async () => {
    const res = await post("/jobs", { jobName: "j1", jobDefinition: "d1" });
    expect(res.status).toBe(400);
  });

  it("POST /jobs — 400 when jobDefinition missing", async () => {
    const res = await post("/jobs", { jobName: "j1", jobQueue: "q1" });
    expect(res.status).toBe(400);
  });

  it("POST /jobs — submits job", async () => {
    mockSend.mockResolvedValueOnce({ jobId: "j1", jobArn: "arn:j1", jobName: "test" });
    const res = await post("/jobs", { jobName: "test", jobQueue: "q1", jobDefinition: "d1" });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.jobId).toBe("j1");
  });

  it("POST /jobs/:id/terminate — terminates job", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/jobs/j1/terminate", { reason: "test" });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.terminated).toBe(true);
  });
});
