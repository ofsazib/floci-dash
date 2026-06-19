import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());
const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) { return { __cmdName: name, ...args }; });
  };
});

vi.mock("@aws-sdk/client-kafka", () => ({
  KafkaClient: vi.fn(function () { return { send: mockSend }; }),
  ListClustersV2Command: createCmd("ListClustersV2Command"),
  DescribeClusterV2Command: createCmd("DescribeClusterV2Command"),
  CreateClusterV2Command: createCmd("CreateClusterV2Command"),
  DeleteClusterCommand: createCmd("DeleteClusterCommand"),
  GetBootstrapBrokersCommand: createCmd("GetBootstrapBrokersCommand"),
}));

vi.mock("../../clients/aws", () => ({ create: (Ctor: any, extra?: any) => new Ctor(extra) }));

import router from "./msk";

const ARN = "arn:aws:kafka:us-east-1:123:cluster/my-cluster/abc-123";
const ARN_ENC = encodeURIComponent(ARN);

async function get(p: string) { return router.request(p, { method: "GET" }); }
async function post(p: string, b?: any) {
  return router.request(p, { method: "POST", body: b != null ? JSON.stringify(b) : undefined, headers: b != null ? { "content-type": "application/json" } : undefined });
}
async function del(p: string) { return router.request(p, { method: "DELETE" }); }

beforeEach(() => mockSend.mockReset());

describe("MSK Routes", () => {
  it("GET /clusters — lists clusters", async () => {
    mockSend.mockResolvedValueOnce({ ClusterInfoList: [{ ClusterArn: ARN, ClusterName: "my-cluster", State: "ACTIVE" }] });
    const res = await get("/clusters");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
  });

  it("GET /clusters — empty", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/clusters");
    const body = await res.json();
    expect(body.total).toBe(0);
  });

  it("GET /clusters/:arn — describes cluster", async () => {
    mockSend.mockResolvedValueOnce({ ClusterInfo: { ClusterArn: ARN, ClusterName: "my-cluster" } });
    const res = await get(`/clusters/${ARN_ENC}`);
    expect(res.status).toBe(200);
  });

  it("POST /clusters — creates cluster (201)", async () => {
    mockSend.mockResolvedValueOnce({ ClusterArn: ARN, ClusterName: "new-cluster", State: "CREATING" });
    const res = await post("/clusters", { clusterName: "new-cluster" });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.clusterArn).toBe(ARN);
  });

  it("POST /clusters — 400 if clusterName missing", async () => {
    const res = await post("/clusters", {});
    expect(res.status).toBe(400);
  });

  it("DELETE /clusters/:arn — deletes cluster", async () => {
    mockSend.mockResolvedValueOnce({ ClusterArn: ARN, State: "DELETING" });
    const res = await del(`/clusters/${ARN_ENC}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
    expect(body.state).toBe("DELETING");
  });

  it("GET /clusters/:arn/bootstrap-brokers — gets brokers", async () => {
    mockSend.mockResolvedValueOnce({ BootstrapBrokerString: "host1:9092", BootstrapBrokerStringTls: "host1:9094" });
    const res = await get(`/clusters/${ARN_ENC}/bootstrap-brokers`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.bootstrapBrokerString).toContain("9092");
  });
});
