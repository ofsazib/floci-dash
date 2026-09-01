import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) {
      return { __cmdName: name, ...args };
    });
  };
});

vi.mock("@aws-sdk/client-eks", () => ({
  EKSClient: vi.fn(function () {
    return { send: mockSend };
  }),
  ListClustersCommand: createCmd("ListClustersCommand"),
  CreateClusterCommand: createCmd("CreateClusterCommand"),
  DescribeClusterCommand: createCmd("DescribeClusterCommand"),
  DeleteClusterCommand: createCmd("DeleteClusterCommand"),
  ListNodegroupsCommand: createCmd("ListNodegroupsCommand"),
  CreateNodegroupCommand: createCmd("CreateNodegroupCommand"),
  DescribeNodegroupCommand: createCmd("DescribeNodegroupCommand"),
  DeleteNodegroupCommand: createCmd("DeleteNodegroupCommand"),
  ListFargateProfilesCommand: createCmd("ListFargateProfilesCommand"),
  CreateFargateProfileCommand: createCmd("CreateFargateProfileCommand"),
  DescribeFargateProfileCommand: createCmd("DescribeFargateProfileCommand"),
  DeleteFargateProfileCommand: createCmd("DeleteFargateProfileCommand"),
  ListAccessEntriesCommand: createCmd("ListAccessEntriesCommand"),
  CreateAccessEntryCommand: createCmd("CreateAccessEntryCommand"),
  DescribeAccessEntryCommand: createCmd("DescribeAccessEntryCommand"),
  DeleteAccessEntryCommand: createCmd("DeleteAccessEntryCommand"),
  ListAddonsCommand: createCmd("ListAddonsCommand"),
  DescribeAddonCommand: createCmd("DescribeAddonCommand"),
  CreateAddonCommand: createCmd("CreateAddonCommand"),
  UpdateAddonCommand: createCmd("UpdateAddonCommand"),
  DeleteAddonCommand: createCmd("DeleteAddonCommand"),
  ListIdentityProviderConfigsCommand: createCmd("ListIdentityProviderConfigsCommand"),
  DescribeIdentityProviderConfigCommand: createCmd("DescribeIdentityProviderConfigCommand"),
  AssociateIdentityProviderConfigCommand: createCmd("AssociateIdentityProviderConfigCommand"),
  DisassociateIdentityProviderConfigCommand: createCmd("DisassociateIdentityProviderConfigCommand"),
  ListPodIdentityAssociationsCommand: createCmd("ListPodIdentityAssociationsCommand"),
  DescribePodIdentityAssociationCommand: createCmd("DescribePodIdentityAssociationCommand"),
  CreatePodIdentityAssociationCommand: createCmd("CreatePodIdentityAssociationCommand"),
  UpdatePodIdentityAssociationCommand: createCmd("UpdatePodIdentityAssociationCommand"),
  DeletePodIdentityAssociationCommand: createCmd("DeletePodIdentityAssociationCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: (Ctor: any, extra?: any) => new Ctor(extra),
}));

import router from "./eks";

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
  mockSend.mockReset();
});

describe("EKS Routes", () => {
  describe("Clusters", () => {
    it("GET /clusters — lists clusters with details", async () => {
      mockSend
        .mockResolvedValueOnce({ clusters: ["cluster-1", "cluster-2"] })
        .mockResolvedValueOnce({
          cluster: { name: "cluster-1", arn: "arn:aws:eks:us-east-1:123456789:cluster/cluster-1", status: "ACTIVE" },
        })
        .mockResolvedValueOnce({
          cluster: { name: "cluster-2", arn: "arn:aws:eks:us-east-1:123456789:cluster/cluster-2", status: "CREATING" },
        });
      const res = await get("/clusters");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(2);
      expect(body.clusters[0].name).toBe("cluster-1");
      expect(body.clusters[1].status).toBe("CREATING");
    });

    it("GET /clusters — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ clusters: [] });
      const res = await get("/clusters");
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.clusters).toEqual([]);
    });

    it("GET /clusters — sparse response defaults to empty list", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/clusters");
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.clusters).toEqual([]);
    });

    it("POST /clusters — creates cluster (201)", async () => {
      mockSend.mockResolvedValueOnce({
        cluster: { name: "new-cluster", arn: "arn:aws:eks:us-east-1:123456789:cluster/new-cluster", status: "CREATING" },
      });
      const res = await post("/clusters", {
        name: "new-cluster",
        roleArn: "arn:aws:iam::123456789012:role/eks-role",
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.cluster.name).toBe("new-cluster");
    });

    it("POST /clusters — 400 when name missing", async () => {
      const res = await post("/clusters", { roleArn: "arn:aws:iam::123456789012:role/eks-role" });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("name is required");
    });

    it("POST /clusters — 400 when roleArn missing", async () => {
      const res = await post("/clusters", { name: "my-cluster" });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("roleArn is required");
    });

    it("GET /clusters/:name — describes cluster", async () => {
      mockSend.mockResolvedValueOnce({
        cluster: { name: "my-cluster", arn: "arn:aws:eks:us-east-1:123456789:cluster/my-cluster", status: "ACTIVE", version: "1.27" },
      });
      const res = await get("/clusters/my-cluster");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.cluster.name).toBe("my-cluster");
      expect(body.cluster.version).toBe("1.27");
    });

    it("DELETE /clusters/:name — deletes cluster", async () => {
      mockSend.mockResolvedValueOnce({
        cluster: { name: "my-cluster", status: "DELETING" },
      });
      const res = await del("/clusters/my-cluster");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
      expect(body.cluster.status).toBe("DELETING");
    });
  });

  describe("Node Groups", () => {
    it("GET /clusters/:name/node-groups — lists nodegroups with details", async () => {
      mockSend
        .mockResolvedValueOnce({ nodegroups: ["ng-1"] })
        .mockResolvedValueOnce({
          nodegroup: {
            nodegroupName: "ng-1",
            clusterName: "my-cluster",
            status: "ACTIVE",
            nodeRole: "arn:aws:iam::123456789012:role/node-role",
            subnets: ["subnet-123"],
            instanceTypes: ["t3.medium"],
          },
        });
      const res = await get("/clusters/my-cluster/node-groups");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.nodegroups[0].nodegroupName).toBe("ng-1");
    });

    it("GET /clusters/:name/node-groups — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ nodegroups: [] });
      const res = await get("/clusters/my-cluster/node-groups");
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.nodegroups).toEqual([]);
    });

    it("GET /clusters/:name/node-groups — sparse response defaults to empty list", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/clusters/my-cluster/node-groups");
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.nodegroups).toEqual([]);
    });

    it("POST /clusters/:name/node-groups — creates nodegroup (201)", async () => {
      mockSend.mockResolvedValueOnce({
        nodegroup: {
          nodegroupName: "new-ng",
          clusterName: "my-cluster",
          status: "CREATING",
        },
      });
      const res = await post("/clusters/my-cluster/node-groups", {
        nodegroupName: "new-ng",
        nodeRole: "arn:aws:iam::123456789012:role/node-role",
        subnets: ["subnet-123"],
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.nodegroup.nodegroupName).toBe("new-ng");
    });

    it("POST /clusters/:name/node-groups — 400 when nodegroupName missing", async () => {
      const res = await post("/clusters/my-cluster/node-groups", {
        nodeRole: "arn:aws:iam::123456789012:role/node-role",
        subnets: ["subnet-123"],
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("nodegroupName is required");
    });

    it("POST /clusters/:name/node-groups — 400 when nodeRole missing", async () => {
      const res = await post("/clusters/my-cluster/node-groups", {
        nodegroupName: "new-ng",
        subnets: ["subnet-123"],
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("nodeRole is required");
    });

    it("POST /clusters/:name/node-groups — 400 when subnets empty", async () => {
      const res = await post("/clusters/my-cluster/node-groups", {
        nodegroupName: "new-ng",
        nodeRole: "arn:aws:iam::123456789012:role/node-role",
        subnets: [],
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("subnets is required");
    });

    it("GET /clusters/:name/node-groups/:ngName — describes nodegroup", async () => {
      mockSend.mockResolvedValueOnce({
        nodegroup: {
          nodegroupName: "ng-1",
          clusterName: "my-cluster",
          status: "ACTIVE",
          version: "1.27",
        },
      });
      const res = await get("/clusters/my-cluster/node-groups/ng-1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.nodegroup.nodegroupName).toBe("ng-1");
    });

    it("DELETE /clusters/:name/node-groups/:ngName — deletes nodegroup", async () => {
      mockSend.mockResolvedValueOnce({
        nodegroup: { nodegroupName: "ng-1", status: "DELETING" },
      });
      const res = await del("/clusters/my-cluster/node-groups/ng-1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });
  });

  describe("Fargate Profiles", () => {
    it("GET /clusters/:name/fargate-profiles — lists with details", async () => {
      mockSend
        .mockResolvedValueOnce({ fargateProfileNames: ["fp-1"] })
        .mockResolvedValueOnce({ fargateProfile: { fargateProfileName: "fp-1", status: "ACTIVE" } });
      const res = await get("/clusters/my-cluster/fargate-profiles");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.profiles[0].fargateProfileName).toBe("fp-1");
    });

    it("GET /clusters/:name/fargate-profiles — empty list", async () => {
      mockSend.mockResolvedValueOnce({ fargateProfileNames: [] });
      const res = await get("/clusters/my-cluster/fargate-profiles");
      const body = await res.json();
      expect(body.total).toBe(0);
    });

    it("POST /clusters/:name/fargate-profiles — creates (201)", async () => {
      mockSend.mockResolvedValueOnce({ fargateProfile: { fargateProfileName: "new-fp", status: "ACTIVE" } });
      const res = await post("/clusters/my-cluster/fargate-profiles", {
        fargateProfileName: "new-fp",
        podExecutionRoleArn: "arn:aws:iam::123:role/role",
        subnets: ["s1"],
        selectors: [{ namespace: "default" }],
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.fargateProfile.fargateProfileName).toBe("new-fp");
    });

    it("POST /clusters/:name/fargate-profiles — 400 when name missing", async () => {
      const res = await post("/clusters/my-cluster/fargate-profiles", { podExecutionRoleArn: "arn:x" });
      expect(res.status).toBe(400);
    });

    it("POST /clusters/:name/fargate-profiles — 400 when roleArn missing", async () => {
      const res = await post("/clusters/my-cluster/fargate-profiles", { fargateProfileName: "fp" });
      expect(res.status).toBe(400);
    });

    it("GET /clusters/:name/fargate-profiles/:fpName — describes", async () => {
      mockSend.mockResolvedValueOnce({ fargateProfile: { fargateProfileName: "fp-1" } });
      const res = await get("/clusters/my-cluster/fargate-profiles/fp-1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.fargateProfile.fargateProfileName).toBe("fp-1");
    });

    it("DELETE /clusters/:name/fargate-profiles/:fpName — deletes", async () => {
      mockSend.mockResolvedValueOnce({ fargateProfile: { fargateProfileName: "fp-1" } });
      const res = await del("/clusters/my-cluster/fargate-profiles/fp-1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });
  });

  describe("Access Entries", () => {
    it("GET /clusters/:name/access-entries — lists", async () => {
      mockSend.mockResolvedValueOnce({ accessEntries: ["arn:aws:iam::123:role/r"] });
      const res = await get("/clusters/my-cluster/access-entries");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.accessEntries).toHaveLength(1);
    });

    it("POST /clusters/:name/access-entries — creates (201)", async () => {
      mockSend.mockResolvedValueOnce({ accessEntry: { principalArn: "arn:aws:iam::123:role/r" } });
      const res = await post("/clusters/my-cluster/access-entries", { principalArn: "arn:aws:iam::123:role/r" });
      expect(res.status).toBe(201);
    });

    it("POST /clusters/:name/access-entries — 400 when principalArn missing", async () => {
      const res = await post("/clusters/my-cluster/access-entries", {});
      expect(res.status).toBe(400);
    });

    it("GET /clusters/:name/access-entries/:arn — describes", async () => {
      mockSend.mockResolvedValueOnce({ accessEntry: { principalArn: "arn:aws:iam::123:role/r" } });
      const res = await get("/clusters/my-cluster/access-entries/arn%3Aaws%3Aiam%3A%3A123%3Arole%2Fr");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.accessEntry.principalArn).toContain("role/r");
    });

    it("DELETE /clusters/:name/access-entries/:arn — deletes", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/clusters/my-cluster/access-entries/arn%3Aaws%3Aiam%3A%3A123%3Arole%2Fr");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });
  });

  describe("Addons", () => {
    it("GET /clusters/:name/addons — lists", async () => {
      mockSend.mockResolvedValueOnce({ addons: ["vpc-cni"] });
      const res = await get("/clusters/my-cluster/addons");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.addons).toEqual(["vpc-cni"]);
    });

    it("GET /clusters/:name/addons/:addonName — describes", async () => {
      mockSend.mockResolvedValueOnce({ addon: { addonName: "vpc-cni", status: "ACTIVE" } });
      const res = await get("/clusters/my-cluster/addons/vpc-cni");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.addon.addonName).toBe("vpc-cni");
    });

    it("POST /clusters/:name/addons — creates (201)", async () => {
      mockSend.mockResolvedValueOnce({ addon: { addonName: "vpc-cni", status: "CREATING" } });
      const res = await post("/clusters/my-cluster/addons", { addonName: "vpc-cni" });
      expect(res.status).toBe(201);
    });

    it("POST /clusters/:name/addons — 400 when addonName missing", async () => {
      const res = await post("/clusters/my-cluster/addons", {});
      expect(res.status).toBe(400);
    });

    it("PUT /clusters/:name/addons/:addonName — updates", async () => {
      mockSend.mockResolvedValueOnce({ update: { addon: { addonName: "vpc-cni" } } });
      const res = await router.request("/clusters/my-cluster/addons/vpc-cni", {
        method: "PUT",
        body: JSON.stringify({ version: "v2" }),
        headers: { "content-type": "application/json" },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.update.addon.addonName).toBe("vpc-cni");
    });

    it("DELETE /clusters/:name/addons/:addonName — deletes", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/clusters/my-cluster/addons/vpc-cni");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });
  });

  describe("Identity Provider Configs", () => {
    it("GET /clusters/:name/identity-providers — lists", async () => {
      mockSend.mockResolvedValueOnce({ identityProviderConfigs: [{ name: "oidc", type: "oidc" }] });
      const res = await get("/clusters/my-cluster/identity-providers");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.identityProviderConfigs).toHaveLength(1);
    });

    it("GET /clusters/:name/identity-providers/:idpName — describes", async () => {
      mockSend.mockResolvedValueOnce({ identityProviderConfig: { identityProviderConfig: { name: "oidc" }, oidc: { issuer: "https://x" } } });
      const res = await get("/clusters/my-cluster/identity-providers/oidc");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.identityProviderConfig.identityProviderConfig.name).toBe("oidc");
    });

    it("POST /clusters/:name/identity-providers — associates (201)", async () => {
      mockSend.mockResolvedValueOnce({ update: { id: "u1" }, tags: { env: "prod" } });
      const res = await post("/clusters/my-cluster/identity-providers", { oidc: { issuer: "https://x" } });
      expect(res.status).toBe(201);
    });

    it("POST /clusters/:name/identity-providers — 400 when oidc.issuer missing", async () => {
      const res = await post("/clusters/my-cluster/identity-providers", { oidc: {} });
      expect(res.status).toBe(400);
    });

    it("DELETE /clusters/:name/identity-providers/:idpName — disassociates", async () => {
      mockSend.mockResolvedValueOnce({ update: { id: "u1" } });
      const res = await del("/clusters/my-cluster/identity-providers/oidc");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });
  });

  describe("Pod Identity Associations", () => {
    it("GET /clusters/:name/pod-identity-associations — lists", async () => {
      mockSend.mockResolvedValueOnce({ associations: [{ associationId: "a-1" }] });
      const res = await get("/clusters/my-cluster/pod-identity-associations");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.associations).toHaveLength(1);
    });

    it("GET /clusters/:name/pod-identity-associations/:assocId — describes", async () => {
      mockSend.mockResolvedValueOnce({ association: { associationId: "a-1" } });
      const res = await get("/clusters/my-cluster/pod-identity-associations/a-1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.association.associationId).toBe("a-1");
    });

    it("POST /clusters/:name/pod-identity-associations — creates (201)", async () => {
      mockSend.mockResolvedValueOnce({ association: { associationId: "a-new" } });
      const res = await post("/clusters/my-cluster/pod-identity-associations", {
        roleArn: "arn:aws:iam::123:role/r",
        serviceAccount: "sa-name",
      });
      expect(res.status).toBe(201);
    });

    it("POST /clusters/:name/pod-identity-associations — 400 when roleArn missing", async () => {
      const res = await post("/clusters/my-cluster/pod-identity-associations", { serviceAccount: "sa" });
      expect(res.status).toBe(400);
    });

    it("POST /clusters/:name/pod-identity-associations — 400 when serviceAccount missing", async () => {
      const res = await post("/clusters/my-cluster/pod-identity-associations", { roleArn: "arn:x" });
      expect(res.status).toBe(400);
    });

    it("PUT /clusters/:name/pod-identity-associations/:assocId — updates", async () => {
      mockSend.mockResolvedValueOnce({ association: { associationId: "a-1" } });
      const res = await router.request("/clusters/my-cluster/pod-identity-associations/a-1", {
        method: "PUT",
        body: JSON.stringify({ roleArn: "arn:x" }),
        headers: { "content-type": "application/json" },
      });
      expect(res.status).toBe(200);
    });

    it("DELETE /clusters/:name/pod-identity-associations/:assocId — deletes", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/clusters/my-cluster/pod-identity-associations/a-1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });
  });
});
