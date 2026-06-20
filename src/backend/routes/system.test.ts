import { describe, it, expect, beforeEach, vi } from "vitest";
import router from "./system";
import { setFlociEndpoint, getDefaultFlociEndpoint } from "../clients/config";

const mockFlociFetch = vi.hoisted(() => vi.fn());
vi.mock("../clients/floci", () => ({ flociFetch: mockFlociFetch }));

const mockAwsSend = vi.hoisted(() => vi.fn());

const createClient = vi.hoisted(() => function () { return { send: mockAwsSend }; });

const mockS3Client = vi.hoisted(() => vi.fn(createClient));
const mockDDBClient = vi.hoisted(() => vi.fn(createClient));
const mockEC2Client = vi.hoisted(() => vi.fn(createClient));
const mockLambdaClient = vi.hoisted(() => vi.fn(createClient));
const mockRDSClient = vi.hoisted(() => vi.fn(createClient));
const mockSQSClient = vi.hoisted(() => vi.fn(createClient));
const mockSNSClient = vi.hoisted(() => vi.fn(createClient));
const mockKMSClient = vi.hoisted(() => vi.fn(createClient));
const mockCWClient = vi.hoisted(() => vi.fn(createClient));

vi.mock("@aws-sdk/client-s3", () => ({ S3Client: mockS3Client, ListBucketsCommand: vi.fn() }));
vi.mock("@aws-sdk/client-dynamodb", () => ({ DynamoDBClient: mockDDBClient, ListTablesCommand: vi.fn() }));
vi.mock("@aws-sdk/client-ec2", () => ({ EC2Client: mockEC2Client, DescribeInstancesCommand: vi.fn() }));
vi.mock("@aws-sdk/client-lambda", () => ({ LambdaClient: mockLambdaClient, ListFunctionsCommand: vi.fn() }));
vi.mock("@aws-sdk/client-rds", () => ({ RDSClient: mockRDSClient, DescribeDBInstancesCommand: vi.fn() }));
vi.mock("@aws-sdk/client-sqs", () => ({ SQSClient: mockSQSClient, ListQueuesCommand: vi.fn() }));
vi.mock("@aws-sdk/client-sns", () => ({ SNSClient: mockSNSClient, ListTopicsCommand: vi.fn() }));
vi.mock("@aws-sdk/client-kms", () => ({ KMSClient: mockKMSClient, ListKeysCommand: vi.fn() }));
vi.mock("@aws-sdk/client-cloudwatch", () => ({ CloudWatchClient: mockCWClient, DescribeAlarmsCommand: vi.fn() }));

vi.mock("../clients/aws", () => ({
  getAwsConfig: () => ({
    endpoint: "http://localhost:4566",
    region: "us-east-1",
    credentials: { accessKeyId: "test", secretAccessKey: "test" },
  }),
}));

beforeEach(() => {
  mockFlociFetch.mockReset();
  mockAwsSend.mockReset();
});

describe("System Routes", () => {
  it("GET /health — returns aggregated health + info", async () => {
    mockFlociFetch
      .mockResolvedValueOnce({ services: { s3: "running", ec2: "stopped" }, edition: "Community", original_edition: "Community" })
      .mockResolvedValueOnce({ version: "1.5.22", edition: "Community" });
    const res = await router.request("/health", { method: "GET" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.version).toBe("1.5.22");
    expect(body.stats.total).toBe(2);
    expect(body.stats.running).toBe(1);
    expect(body.stats.available).toBe(1);
    expect(body.services.s3).toBe("running");
  });

  it("GET /health — handles missing info fields", async () => {
    mockFlociFetch
      .mockResolvedValueOnce({ services: {} })
      .mockResolvedValueOnce({});
    const res = await router.request("/health", { method: "GET" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.stats.total).toBe(0);
    expect(body.stats.running).toBe(0);
  });

  it("GET /init — returns init data", async () => {
    mockFlociFetch.mockResolvedValueOnce({ status: "initialized" });
    const res = await router.request("/init", { method: "GET" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("initialized");
  });

  describe("GET /resource-counts", () => {
    it("returns counts for all queried services", async () => {
      mockAwsSend
        .mockResolvedValueOnce({ Buckets: [{ Name: "b1" }, { Name: "b2" }] })
        .mockResolvedValueOnce({ TableNames: ["t1"] })
        .mockResolvedValueOnce({ Reservations: [{ Instances: [{ InstanceId: "i-1" }] }] })
        .mockResolvedValueOnce({ Functions: [{ FunctionName: "f1" }] })
        .mockResolvedValueOnce({ DBInstances: [{ DBInstanceIdentifier: "db1" }] })
        .mockResolvedValueOnce({ QueueUrls: ["q1", "q2", "q3"] })
        .mockResolvedValueOnce({ Topics: [{ TopicArn: "t1" }] })
        .mockResolvedValueOnce({ Keys: [{ KeyId: "k1" }, { KeyId: "k2" }] })
        .mockResolvedValueOnce({ MetricAlarms: [{ AlarmName: "a1" }] });
      const res = await router.request("/resource-counts", { method: "GET" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.s3).toBe(2);
      expect(body.dynamodb).toBe(1);
      expect(body.ec2).toBe(1);
      expect(body.lambda).toBe(1);
      expect(body.rds).toBe(1);
      expect(body.sqs).toBe(3);
      expect(body.sns).toBe(1);
      expect(body.kms).toBe(2);
      expect(body.cloudwatch).toBe(1);
    });

    it("returns 0 for services that error", async () => {
      mockAwsSend.mockRejectedValue(new Error("Service unavailable"));
      const res = await router.request("/resource-counts", { method: "GET" });
      expect(res.status).toBe(200);
      const body = await res.json();
      Object.values(body).forEach((count) => expect(count).toBe(0));
    });

    it("returns 0 for services with empty results", async () => {
      mockAwsSend.mockResolvedValue({});
      const res = await router.request("/resource-counts", { method: "GET" });
      const body = await res.json();
      Object.values(body).forEach((count) => expect(count).toBe(0));
    });
  });

  describe("GET /floci-endpoint", () => {
    it("returns current endpoint and default", async () => {
      setFlociEndpoint("http://example.test:4566");
      const res = await router.request("/floci-endpoint", { method: "GET" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.endpoint).toBe("http://example.test:4566");
      expect(body.default).toBe(getDefaultFlociEndpoint());
    });
  });

  describe("PUT /floci-endpoint", () => {
    it("updates the endpoint successfully", async () => {
      const res = await router.request("/floci-endpoint", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: "http://my-floci:4566" }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.endpoint).toBe("http://my-floci:4566");
    });

    it("strips trailing slashes from endpoint", async () => {
      const res = await router.request("/floci-endpoint", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: "http://my-floci:4566///" }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.endpoint).toBe("http://my-floci:4566");
    });

    it("returns 400 when endpoint is missing", async () => {
      const res = await router.request("/floci-endpoint", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("required");
    });

    it("returns 400 for invalid URL", async () => {
      const res = await router.request("/floci-endpoint", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: "not-a-url" }),
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("valid URL");
    });

    it("returns 400 when body is not valid JSON", async () => {
      const res = await router.request("/floci-endpoint", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: "not-json",
      });
      expect(res.status).toBe(400);
    });
  });
});
