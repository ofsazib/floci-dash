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

vi.mock("@aws-sdk/client-sagemaker", () => ({
  SageMakerClient: mockClient,
  CreateModelCommand: createCmd("CreateModelCommand"),
  ListModelsCommand: createCmd("ListModelsCommand"),
  DescribeModelCommand: createCmd("DescribeModelCommand"),
  DeleteModelCommand: createCmd("DeleteModelCommand"),
  CreateEndpointConfigCommand: createCmd("CreateEndpointConfigCommand"),
  ListEndpointConfigsCommand: createCmd("ListEndpointConfigsCommand"),
  DeleteEndpointConfigCommand: createCmd("DeleteEndpointConfigCommand"),
  CreateEndpointCommand: createCmd("CreateEndpointCommand"),
  ListEndpointsCommand: createCmd("ListEndpointsCommand"),
  DescribeEndpointCommand: createCmd("DescribeEndpointCommand"),
  UpdateEndpointCommand: createCmd("UpdateEndpointCommand"),
  DeleteEndpointCommand: createCmd("DeleteEndpointCommand"),
  CreateTrainingJobCommand: createCmd("CreateTrainingJobCommand"),
  ListTrainingJobsCommand: createCmd("ListTrainingJobsCommand"),
  DescribeTrainingJobCommand: createCmd("DescribeTrainingJobCommand"),
  StopTrainingJobCommand: createCmd("StopTrainingJobCommand"),
  AddTagsCommand: createCmd("AddTagsCommand"),
  ListTagsCommand: createCmd("ListTagsCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./sagemaker";

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

const CONTAINER = { Image: "1234.dkr.ecr.us-east-1.amazonaws.com/m:1" };

beforeEach(() => {
  vi.clearAllMocks();
  mockSend.mockReset();
});

describe("models", () => {
  it("creates a model with a primary container", async () => {
    mockSend.mockResolvedValueOnce({ ModelArn: "arn:aws:sagemaker::1:model/m1" });
    const res = await post("/models", {
      modelName: "m1",
      primaryContainer: CONTAINER,
      executionRoleArn: "arn:aws:iam::1:role/r",
    });
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.modelArn).toContain("model/m1");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "CreateModelCommand",
        ModelName: "m1",
        PrimaryContainer: CONTAINER,
      })
    );
  });

  it("400 model create without name", async () => {
    expect((await post("/models", { primaryContainer: CONTAINER })).status).toBe(400);
  });

  it("400 model create without container", async () => {
    expect((await post("/models", { modelName: "m1" })).status).toBe(400);
  });

  it("lists models", async () => {
    mockSend.mockResolvedValueOnce({ Models: [{ ModelName: "m1" }] });
    const res = await get("/models");
    const json = await res.json();
    expect(json.total).toBe(1);
  });

  it("returns sparse models", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/models");
    const json = await res.json();
    expect(json.models).toEqual([]);
  });

  it("describes a model", async () => {
    mockSend.mockResolvedValueOnce({ ModelName: "m1" });
    const res = await get("/models/m1");
    const json = await res.json();
    expect(json.model.ModelName).toBe("m1");
  });

  it("returns null model when absent", async () => {
    mockSend.mockResolvedValueOnce(null);
    const res = await get("/models/none");
    const json = await res.json();
    expect(json.model).toBeNull();
  });

  it("deletes a model", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/models/m1");
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "DeleteModelCommand",
        ModelName: "m1",
      })
    );
  });
});

describe("endpoint configs", () => {
  it("creates a config with production variants", async () => {
    mockSend.mockResolvedValueOnce({ EndpointConfigArn: "arn:cfg" });
    const res = await post("/endpoint-configs", {
      endpointConfigName: "cfg1",
      productionVariants: [{ ModelName: "m1", InstanceType: "ml.t2.medium" }],
    });
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.endpointConfigArn).toBe("arn:cfg");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "CreateEndpointConfigCommand",
        EndpointConfigName: "cfg1",
        ProductionVariants: [{ ModelName: "m1", InstanceType: "ml.t2.medium" }],
      })
    );
  });

  it("400 config create without name", async () => {
    expect((await post("/endpoint-configs", { productionVariants: [{ ModelName: "m" }] })).status).toBe(400);
  });

  it("400 config create without variants", async () => {
    expect((await post("/endpoint-configs", { endpointConfigName: "cfg" })).status).toBe(400);
    expect(
      (await post("/endpoint-configs", { endpointConfigName: "cfg", productionVariants: [] })).status
    ).toBe(400);
  });

  it("lists configs", async () => {
    mockSend.mockResolvedValueOnce({ EndpointConfigs: [{ EndpointConfigName: "cfg1" }] });
    const res = await get("/endpoint-configs");
    const json = await res.json();
    expect(json.total).toBe(1);
  });

  it("returns sparse configs", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/endpoint-configs");
    const json = await res.json();
    expect(json.configs).toEqual([]);
  });

  it("deletes a config", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/endpoint-configs/cfg1");
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "DeleteEndpointConfigCommand",
        EndpointConfigName: "cfg1",
      })
    );
  });
});

describe("endpoints", () => {
  it("creates an endpoint", async () => {
    mockSend.mockResolvedValueOnce({ EndpointArn: "arn:ep" });
    const res = await post("/endpoints", { endpointName: "ep1", endpointConfigName: "cfg1" });
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.endpointArn).toBe("arn:ep");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "CreateEndpointCommand",
        EndpointName: "ep1",
        EndpointConfigName: "cfg1",
      })
    );
  });

  it("400 endpoint create without name or config", async () => {
    expect((await post("/endpoints", { endpointConfigName: "cfg1" })).status).toBe(400);
    expect((await post("/endpoints", { endpointName: "ep1" })).status).toBe(400);
  });

  it("lists endpoints", async () => {
    mockSend.mockResolvedValueOnce({
      Endpoints: [{ EndpointName: "ep1", EndpointStatus: "InService" }],
    });
    const res = await get("/endpoints");
    const json = await res.json();
    expect(json.total).toBe(1);
  });

  it("returns sparse endpoints", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/endpoints");
    const json = await res.json();
    expect(json.endpoints).toEqual([]);
  });

  it("describes an endpoint", async () => {
    mockSend.mockResolvedValueOnce({ EndpointName: "ep1", EndpointStatus: "InService" });
    const res = await get("/endpoints/ep1");
    const json = await res.json();
    expect(json.endpoint.EndpointStatus).toBe("InService");
  });

  it("returns null endpoint when absent", async () => {
    mockSend.mockResolvedValueOnce(null);
    const res = await get("/endpoints/none");
    const json = await res.json();
    expect(json.endpoint).toBeNull();
  });

  it("updates an endpoint to a new config", async () => {
    mockSend.mockResolvedValueOnce({ EndpointArn: "arn:ep" });
    const res = await put("/endpoints/ep1", { endpointConfigName: "cfg2" });
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "UpdateEndpointCommand",
        EndpointName: "ep1",
        EndpointConfigName: "cfg2",
      })
    );
  });

  it("400 endpoint update without config", async () => {
    expect((await put("/endpoints/ep1", {})).status).toBe(400);
  });

  it("deletes an endpoint", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/endpoints/ep1");
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "DeleteEndpointCommand",
        EndpointName: "ep1",
      })
    );
  });
});

describe("training jobs", () => {
  const JOB = {
    trainingJobName: "job1",
    algorithmSpecification: { TrainingImage: "img:1", TrainingInputMode: "File" },
    inputDataConfig: [{ ChannelName: "train", DataSource: { S3DataSource: { S3Uri: "s3://b/x" } } }],
    roleArn: "arn:aws:iam::1:role/r",
  };

  it("creates a training job", async () => {
    mockSend.mockResolvedValueOnce({ TrainingJobArn: "arn:job" });
    const res = await post("/training-jobs", JOB);
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.trainingJobArn).toBe("arn:job");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "CreateTrainingJobCommand",
        TrainingJobName: "job1",
        RoleArn: JOB.roleArn,
      })
    );
  });

  it("400 training job without name", async () => {
    expect((await post("/training-jobs", { ...JOB, trainingJobName: undefined })).status).toBe(400);
  });

  it("400 training job without training image", async () => {
    expect(
      (await post("/training-jobs", { ...JOB, algorithmSpecification: {} })).status
    ).toBe(400);
  });

  it("400 training job without input channels", async () => {
    expect(
      (await post("/training-jobs", { ...JOB, inputDataConfig: [] })).status
    ).toBe(400);
    expect(
      (await post("/training-jobs", { ...JOB, inputDataConfig: undefined })).status
    ).toBe(400);
  });

  it("lists training jobs", async () => {
    mockSend.mockResolvedValueOnce({
      TrainingJobSummaries: [{ TrainingJobName: "job1", TrainingJobStatus: "Completed" }],
    });
    const res = await get("/training-jobs");
    const json = await res.json();
    expect(json.total).toBe(1);
  });

  it("returns sparse training jobs", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/training-jobs");
    const json = await res.json();
    expect(json.jobs).toEqual([]);
  });

  it("describes a training job", async () => {
    mockSend.mockResolvedValueOnce({ TrainingJobName: "job1", TrainingJobStatus: "Completed" });
    const res = await get("/training-jobs/job1");
    const json = await res.json();
    expect(json.job.TrainingJobStatus).toBe("Completed");
  });

  it("returns null job when absent", async () => {
    mockSend.mockResolvedValueOnce(null);
    const res = await get("/training-jobs/none");
    const json = await res.json();
    expect(json.job).toBeNull();
  });

  it("stops a training job", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/training-jobs/job1/stop");
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "StopTrainingJobCommand",
        TrainingJobName: "job1",
      })
    );
  });
});

describe("tags", () => {
  it("lists tags for an ARN", async () => {
    mockSend.mockResolvedValueOnce({ Tags: [{ Key: "env", Value: "dev" }] });
    const res = await get("/resources/tags?arn=arn%3Asm");
    const json = await res.json();
    expect(json.tags).toEqual([{ Key: "env", Value: "dev" }]);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "ListTagsCommand",
        ResourceArn: "arn:sm",
      })
    );
  });

  it("returns sparse tags", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/resources/tags?arn=arn%3Asm");
    const json = await res.json();
    expect(json.tags).toEqual([]);
  });

  it("400 tag list without arn", async () => {
    expect((await get("/resources/tags")).status).toBe(400);
  });

  it("adds tags", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/resources/tags", {
      resourceArn: "arn:sm",
      tags: [{ Key: "env", Value: "dev" }],
    });
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "AddTagsCommand",
        ResourceArn: "arn:sm",
        Tags: [{ Key: "env", Value: "dev" }],
      })
    );
  });

  it("400 add tags without arn or empty tags", async () => {
    expect((await post("/resources/tags", { tags: [{ Key: "k", Value: "v" }] })).status).toBe(400);
    expect((await post("/resources/tags", { resourceArn: "arn:sm" })).status).toBe(400);
    expect((await post("/resources/tags", { resourceArn: "arn:sm", tags: [] })).status).toBe(400);
  });
});
