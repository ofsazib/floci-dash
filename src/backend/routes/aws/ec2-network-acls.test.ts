import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockEC2Client = vi.hoisted(() =>
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

vi.mock("@aws-sdk/client-ec2", () => ({
  EC2Client: mockEC2Client,
  CreateNetworkAclCommand: createCmd("CreateNetworkAclCommand"),
  DescribeNetworkAclsCommand: createCmd("DescribeNetworkAclsCommand"),
  DeleteNetworkAclCommand: createCmd("DeleteNetworkAclCommand"),
  CreateNetworkAclEntryCommand: createCmd("CreateNetworkAclEntryCommand"),
  ReplaceNetworkAclEntryCommand: createCmd("ReplaceNetworkAclEntryCommand"),
  DeleteNetworkAclEntryCommand: createCmd("DeleteNetworkAclEntryCommand"),
  ReplaceNetworkAclAssociationCommand: createCmd("ReplaceNetworkAclAssociationCommand"),
}));

vi.mock("../../clients/aws", () => ({
  getAwsConfig: () => ({
    endpoint: "http://localhost:4566",
    region: "us-east-1",
    credentials: { accessKeyId: "test", secretAccessKey: "test" },
  }),
}));

vi.mock("../../clients/sanitize", () => ({
  sanitizeName: (v: string) => v,
}));

import router from "./ec2-network-acls";

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

async function put(path: string, body?: any) {
  return router.request(path, {
    method: "PUT",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}

beforeEach(() => {
  mockSend.mockReset();
  mockEC2Client.mockClear();
});

describe("EC2 Network ACLs Routes", () => {
  describe("List Network ACLs", () => {
    it("GET /network-acls — lists acls", async () => {
      mockSend.mockResolvedValueOnce({
        NetworkAcls: [
          {
            NetworkAclId: "acl-abc123",
            VpcId: "vpc-xyz",
            IsDefault: true,
            OwnerId: "123456789012",
            Entries: [
              {
                RuleNumber: 100,
                Protocol: "-1",
                RuleAction: "allow",
                Egress: false,
                CidrBlock: "0.0.0.0/0",
              },
            ],
            Associations: [
              {
                NetworkAclAssociationId: "aclassoc-abc",
                NetworkAclId: "acl-abc123",
                SubnetId: "subnet-xyz",
              },
            ],
            Tags: [{ Key: "Name", Value: "default" }],
          },
        ],
      });
      const res = await get("/network-acls");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.networkAcls[0].networkAclId).toBe("acl-abc123");
      expect(body.networkAcls[0].entries).toHaveLength(1);
      expect(body.networkAcls[0].associations).toHaveLength(1);
    });

    it("GET /network-acls — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ NetworkAcls: [] });
      const res = await get("/network-acls");
      const body = await res.json();
      expect(body.total).toBe(0);
    });

    it("GET /network-acls — filters by vpcId", async () => {
      mockSend.mockResolvedValueOnce({ NetworkAcls: [] });
      await get("/network-acls?vpcId=vpc-123");
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.Filters).toEqual([{ Name: "vpc-id", Values: ["vpc-123"] }]);
    });

    it("GET /network-acls — returns empty when NetworkAcls key missing", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/network-acls");
      const body = await res.json();
      expect(body.total).toBe(0);
    });

    it("GET /network-acls — handles sparse ACLs and port ranges", async () => {
      mockSend.mockResolvedValueOnce({
        NetworkAcls: [
          { NetworkAclId: "acl-sparse", VpcId: "vpc-1" },
          {
            NetworkAclId: "acl-port",
            VpcId: "vpc-2",
            Entries: [
              {
                RuleNumber: 300,
                Protocol: "6",
                RuleAction: "allow",
                Egress: false,
                CidrBlock: "10.0.0.0/16",
                PortRange: { From: 443, To: 443 },
              },
            ],
          },
        ],
      });
      const res = await get("/network-acls");
      const body = await res.json();
      expect(body.total).toBe(2);
      expect(body.networkAcls[0].entries).toEqual([]);
      expect(body.networkAcls[0].associations).toEqual([]);
      expect(body.networkAcls[0].tags).toEqual([]);
      expect(body.networkAcls[1].entries[0].portRange).toEqual({ from: 443, to: 443 });
    });
  });

  describe("Create Network ACL", () => {
    it("POST /network-acls — creates an ACL", async () => {
      mockSend.mockResolvedValueOnce({
        NetworkAcl: { NetworkAclId: "acl-new", VpcId: "vpc-abc" },
      });
      const res = await post("/network-acls", { vpcId: "vpc-abc" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(body.networkAclId).toBe("acl-new");
    });

    it("POST /network-acls — 400 when vpcId missing", async () => {
      const res = await post("/network-acls", {});
      expect(res.status).toBe(400);
    });
  });

  describe("Delete Network ACL", () => {
    it("DELETE /network-acls/:id", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/network-acls/acl-abc");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
      expect(mockSend.mock.calls[0][0].NetworkAclId).toBe("acl-abc");
    });
  });

  describe("Create Network ACL Entry", () => {
    it("POST /network-acls/:id/entries", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/network-acls/acl-abc/entries", {
        ruleNumber: 100,
        protocol: "6",
        ruleAction: "allow",
        egress: false,
        cidrBlock: "10.0.0.0/16",
        portRangeFrom: 22,
        portRangeTo: 22,
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ruleAdded).toBe(true);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.NetworkAclId).toBe("acl-abc");
      expect(cmd.Protocol).toBe("6");
      expect(cmd.PortRange.From).toBe(22);
    });

    it("POST /network-acls/:id/entries — 400 when required fields missing", async () => {
      const res = await post("/network-acls/acl-abc/entries", {});
      expect(res.status).toBe(400);
    });

    it("POST /network-acls/:id/entries — applies defaults when ruleNumber/egress omitted", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/network-acls/acl-abc/entries", {
        protocol: "6",
        ruleAction: "allow",
        cidrBlock: "10.0.0.0/16",
      });
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.RuleNumber).toBe(100);
      expect(cmd.Egress).toBe(false);
    });
  });

  describe("Replace Network ACL Entry", () => {
    it("PUT /network-acls/:id/entries/:ruleNumber", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/network-acls/acl-abc/entries/100", {
        protocol: "17",
        ruleAction: "deny",
        egress: true,
        cidrBlock: "0.0.0.0/0",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.replaced).toBe(true);
      expect(body.ruleNumber).toBe(100);
    });

    it("PUT /network-acls/:id/entries/:ruleNumber — 400 when missing", async () => {
      const res = await put("/network-acls/acl-abc/entries/100", {});
      expect(res.status).toBe(400);
    });

    it("PUT /network-acls/:id/entries/:ruleNumber — with port range and default egress", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/network-acls/acl-abc/entries/120", {
        protocol: "17",
        ruleAction: "deny",
        cidrBlock: "0.0.0.0/0",
        portRangeFrom: 80,
        portRangeTo: 90,
      });
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.RuleNumber).toBe(120);
      expect(cmd.Egress).toBe(false);
      expect(cmd.PortRange).toEqual({ From: 80, To: 90 });
    });
  });

  describe("Delete Network ACL Entry", () => {
    it("DELETE /network-acls/:id/entries/:ruleNumber", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/network-acls/acl-abc/entries/100?egress=true");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
      expect(body.egress).toBe(true);
    });

    it("DELETE /network-acls/:id/entries/:ruleNumber — default egress false", async () => {
      mockSend.mockResolvedValueOnce({});
      await del("/network-acls/acl-abc/entries/200");
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.Egress).toBe(false);
    });
  });

  describe("Replace Network ACL Association", () => {
    it("POST /network-acls/:id/associations", async () => {
      mockSend.mockResolvedValueOnce({ NewAssociationId: "aclassoc-new" });
      const res = await post("/network-acls/acl-abc/associations", {
        associationId: "aclassoc-old",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.replaced).toBe(true);
      expect(body.newAssociationId).toBe("aclassoc-new");
    });

    it("POST /network-acls/:id/associations — 400 when associationId missing", async () => {
      const res = await post("/network-acls/acl-abc/associations", {});
      expect(res.status).toBe(400);
    });
  });
});
