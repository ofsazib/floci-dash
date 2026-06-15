import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const createClient = vi.hoisted(() => function() { return { send: mockSend }; });

const mockS3Client = vi.hoisted(() => vi.fn(createClient));
const mockDDBClient = vi.hoisted(() => vi.fn(createClient));
const mockRDSClient = vi.hoisted(() => vi.fn(createClient));
const mockEC2Client = vi.hoisted(() => vi.fn(createClient));
const mockLambdaClient = vi.hoisted(() => vi.fn(createClient));
const mockCWClient = vi.hoisted(() => vi.fn(createClient));

vi.mock("@aws-sdk/client-s3", () => ({ S3Client: mockS3Client, ListBucketsCommand: vi.fn() }));
vi.mock("@aws-sdk/client-dynamodb", () => ({ DynamoDBClient: mockDDBClient, ListTablesCommand: vi.fn() }));
vi.mock("@aws-sdk/client-rds", () => ({ RDSClient: mockRDSClient, DescribeDBInstancesCommand: vi.fn() }));
vi.mock("@aws-sdk/client-ec2", () => ({ EC2Client: mockEC2Client, DescribeInstancesCommand: vi.fn() }));
vi.mock("@aws-sdk/client-lambda", () => ({ LambdaClient: mockLambdaClient, ListFunctionsCommand: vi.fn() }));
vi.mock("@aws-sdk/client-cloudwatch", () => ({ CloudWatchClient: mockCWClient, DescribeAlarmsCommand: vi.fn() }));

vi.mock("../clients/aws", () => ({
  getAwsConfig: () => ({
    endpoint: "http://localhost:4566",
    region: "us-east-1",
    credentials: { accessKeyId: "test", secretAccessKey: "test" },
  }),
}));

import router from "./active";

beforeEach(() => {
  mockSend.mockReset();
});

describe("Active Routes", () => {
  it("GET / — returns no active services when empty", async () => {
    mockSend
      .mockResolvedValueOnce({ Buckets: [] })
      .mockResolvedValueOnce({ TableNames: [] })
      .mockResolvedValueOnce({ DBInstances: [] })
      .mockResolvedValueOnce({ Reservations: [] })
      .mockResolvedValueOnce({ Functions: [] })
      .mockResolvedValueOnce({ MetricAlarms: [] });
    const res = await router.request("/", { method: "GET" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.activeCount).toBe(0);
    expect(body.activeServices).toEqual([]);
  });

  it("GET / — detects S3 buckets", async () => {
    mockSend
      .mockResolvedValueOnce({ Buckets: [{ Name: "my-bucket" }] })
      .mockResolvedValueOnce({ TableNames: [] })
      .mockResolvedValueOnce({ DBInstances: [] })
      .mockResolvedValueOnce({ Reservations: [] })
      .mockResolvedValueOnce({ Functions: [] })
      .mockResolvedValueOnce({ MetricAlarms: [] });
    const res = await router.request("/", { method: "GET" });
    const body = await res.json();
    expect(body.activeCount).toBe(1);
    expect(body.activeServices).toContain("s3");
  });

  it("GET / — detects DynamoDB tables", async () => {
    mockSend
      .mockResolvedValueOnce({ Buckets: [] })
      .mockResolvedValueOnce({ TableNames: ["my-table"] })
      .mockResolvedValueOnce({ DBInstances: [] })
      .mockResolvedValueOnce({ Reservations: [] })
      .mockResolvedValueOnce({ Functions: [] })
      .mockResolvedValueOnce({ MetricAlarms: [] });
    const res = await router.request("/", { method: "GET" });
    const body = await res.json();
    expect(body.activeCount).toBe(1);
    expect(body.activeServices).toContain("dynamodb");
  });

  it("GET / — detects EC2 instances", async () => {
    mockSend
      .mockResolvedValueOnce({ Buckets: [] })
      .mockResolvedValueOnce({ TableNames: [] })
      .mockResolvedValueOnce({ DBInstances: [] })
      .mockResolvedValueOnce({ Reservations: [{ Instances: [{ InstanceId: "i-123" }] }] })
      .mockResolvedValueOnce({ Functions: [] })
      .mockResolvedValueOnce({ MetricAlarms: [] });
    const res = await router.request("/", { method: "GET" });
    const body = await res.json();
    expect(body.activeCount).toBe(1);
    expect(body.activeServices).toContain("ec2");
  });

  it("GET / — detects Lambda functions", async () => {
    mockSend
      .mockResolvedValueOnce({ Buckets: [] })
      .mockResolvedValueOnce({ TableNames: [] })
      .mockResolvedValueOnce({ DBInstances: [] })
      .mockResolvedValueOnce({ Reservations: [] })
      .mockResolvedValueOnce({ Functions: [{ FunctionName: "my-func" }] })
      .mockResolvedValueOnce({ MetricAlarms: [] });
    const res = await router.request("/", { method: "GET" });
    const body = await res.json();
    expect(body.activeCount).toBe(1);
    expect(body.activeServices).toContain("lambda");
  });

  it("GET / — detects CloudWatch alarms", async () => {
    mockSend
      .mockResolvedValueOnce({ Buckets: [] })
      .mockResolvedValueOnce({ TableNames: [] })
      .mockResolvedValueOnce({ DBInstances: [] })
      .mockResolvedValueOnce({ Reservations: [] })
      .mockResolvedValueOnce({ Functions: [] })
      .mockResolvedValueOnce({ MetricAlarms: [{ AlarmName: "cpu-high" }] });
    const res = await router.request("/", { method: "GET" });
    const body = await res.json();
    expect(body.activeCount).toBe(1);
    expect(body.activeServices).toContain("cloudwatch");
  });

  it("GET / — detects all services when all have resources", async () => {
    mockSend
      .mockResolvedValueOnce({ Buckets: [{ Name: "b" }] })
      .mockResolvedValueOnce({ TableNames: ["t"] })
      .mockResolvedValueOnce({ DBInstances: [{ DBInstanceIdentifier: "d" }] })
      .mockResolvedValueOnce({ Reservations: [{ Instances: [{ InstanceId: "i" }] }] })
      .mockResolvedValueOnce({ Functions: [{ FunctionName: "f" }] })
      .mockResolvedValueOnce({ MetricAlarms: [{ AlarmName: "a" }] });
    const res = await router.request("/", { method: "GET" });
    const body = await res.json();
    expect(body.activeCount).toBe(6);
    expect(body.activeServices).toEqual(["s3", "dynamodb", "rds", "ec2", "lambda", "cloudwatch"]);
  });

  it("GET / — handles SDK errors gracefully", async () => {
    mockSend
      .mockRejectedValueOnce(new Error("S3 down"))
      .mockRejectedValueOnce(new Error("DDB down"))
      .mockRejectedValueOnce(new Error("RDS down"))
      .mockRejectedValueOnce(new Error("EC2 down"))
      .mockRejectedValueOnce(new Error("Lambda down"))
      .mockRejectedValueOnce(new Error("CW down"));
    const res = await router.request("/", { method: "GET" });
    const body = await res.json();
    expect(body.activeCount).toBe(0);
    expect(body.activeServices).toEqual([]);
  });
});
