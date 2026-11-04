import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) {
      return { __cmdName: name, ...args };
    });
  };
});

vi.mock("@aws-sdk/client-cloudfront", () => ({
  CloudFrontClient: vi.fn(function () {
    return { send: mockSend };
  }),
  ListDistributionsCommand: createCmd("ListDistributionsCommand"),
  GetDistributionCommand: createCmd("GetDistributionCommand"),
  CreateDistributionCommand: createCmd("CreateDistributionCommand"),
  UpdateDistributionCommand: createCmd("UpdateDistributionCommand"),
  DeleteDistributionCommand: createCmd("DeleteDistributionCommand"),
  ListInvalidationsCommand: createCmd("ListInvalidationsCommand"),
  CreateInvalidationCommand: createCmd("CreateInvalidationCommand"),
  GetInvalidationCommand: createCmd("GetInvalidationCommand"),
  ListCachePoliciesCommand: createCmd("ListCachePoliciesCommand"),
  ListOriginAccessControlsCommand: createCmd("ListOriginAccessControlsCommand"),
  ListFunctionsCommand: createCmd("ListFunctionsCommand"),
  ListTagsForResourceCommand: createCmd("ListTagsForResourceCommand"),
  CreateCachePolicyCommand: createCmd("CreateCachePolicyCommand"),
  GetCachePolicyCommand: createCmd("GetCachePolicyCommand"),
  UpdateCachePolicyCommand: createCmd("UpdateCachePolicyCommand"),
  DeleteCachePolicyCommand: createCmd("DeleteCachePolicyCommand"),
  CreateOriginRequestPolicyCommand: createCmd("CreateOriginRequestPolicyCommand"),
  ListOriginRequestPoliciesCommand: createCmd("ListOriginRequestPoliciesCommand"),
  GetOriginRequestPolicyCommand: createCmd("GetOriginRequestPolicyCommand"),
  UpdateOriginRequestPolicyCommand: createCmd("UpdateOriginRequestPolicyCommand"),
  DeleteOriginRequestPolicyCommand: createCmd("DeleteOriginRequestPolicyCommand"),
  CreateResponseHeadersPolicyCommand: createCmd("CreateResponseHeadersPolicyCommand"),
  ListResponseHeadersPoliciesCommand: createCmd("ListResponseHeadersPoliciesCommand"),
  GetResponseHeadersPolicyCommand: createCmd("GetResponseHeadersPolicyCommand"),
  UpdateResponseHeadersPolicyCommand: createCmd("UpdateResponseHeadersPolicyCommand"),
  DeleteResponseHeadersPolicyCommand: createCmd("DeleteResponseHeadersPolicyCommand"),
  GetOriginAccessControlCommand: createCmd("GetOriginAccessControlCommand"),
  UpdateOriginAccessControlCommand: createCmd("UpdateOriginAccessControlCommand"),
  DeleteOriginAccessControlCommand: createCmd("DeleteOriginAccessControlCommand"),
  CreateCloudFrontOriginAccessIdentityCommand: createCmd("CreateCloudFrontOriginAccessIdentityCommand"),
  ListCloudFrontOriginAccessIdentitiesCommand: createCmd("ListCloudFrontOriginAccessIdentitiesCommand"),
  GetCloudFrontOriginAccessIdentityCommand: createCmd("GetCloudFrontOriginAccessIdentityCommand"),
  UpdateCloudFrontOriginAccessIdentityCommand: createCmd("UpdateCloudFrontOriginAccessIdentityCommand"),
  DeleteCloudFrontOriginAccessIdentityCommand: createCmd("DeleteCloudFrontOriginAccessIdentityCommand"),
  DescribeFunctionCommand: createCmd("DescribeFunctionCommand"),
  GetFunctionCommand: createCmd("GetFunctionCommand"),
  UpdateFunctionCommand: createCmd("UpdateFunctionCommand"),
  PublishFunctionCommand: createCmd("PublishFunctionCommand"),
  DeleteFunctionCommand: createCmd("DeleteFunctionCommand"),
  CreatePublicKeyCommand: createCmd("CreatePublicKeyCommand"),
  ListPublicKeysCommand: createCmd("ListPublicKeysCommand"),
  GetPublicKeyCommand: createCmd("GetPublicKeyCommand"),
  UpdatePublicKeyCommand: createCmd("UpdatePublicKeyCommand"),
  DeletePublicKeyCommand: createCmd("DeletePublicKeyCommand"),
  CreateKeyGroupCommand: createCmd("CreateKeyGroupCommand"),
  ListKeyGroupsCommand: createCmd("ListKeyGroupsCommand"),
  GetKeyGroupCommand: createCmd("GetKeyGroupCommand"),
  UpdateKeyGroupCommand: createCmd("UpdateKeyGroupCommand"),
  DeleteKeyGroupCommand: createCmd("DeleteKeyGroupCommand"),
  CreateDistributionWithTagsCommand: createCmd("CreateDistributionWithTagsCommand"),
  GetDistributionConfigCommand: createCmd("GetDistributionConfigCommand"),
  AssociateAliasCommand: createCmd("AssociateAliasCommand"),
  TagResourceCommand: createCmd("TagResourceCommand"),
  UntagResourceCommand: createCmd("UntagResourceCommand"),
  CreateOriginAccessControlCommand: createCmd("CreateOriginAccessControlCommand"),
  CreateFunctionCommand: createCmd("CreateFunctionCommand"),
  CopyDistributionCommand: createCmd("CopyDistributionCommand"),
  GetMonitoringSubscriptionCommand: createCmd("GetMonitoringSubscriptionCommand"),
  CreateMonitoringSubscriptionCommand: createCmd("CreateMonitoringSubscriptionCommand"),
  CreateRealtimeLogConfigCommand: createCmd("CreateRealtimeLogConfigCommand"),
  ListRealtimeLogConfigsCommand: createCmd("ListRealtimeLogConfigsCommand"),
  GetRealtimeLogConfigCommand: createCmd("GetRealtimeLogConfigCommand"),
  UpdateRealtimeLogConfigCommand: createCmd("UpdateRealtimeLogConfigCommand"),
  DeleteRealtimeLogConfigCommand: createCmd("DeleteRealtimeLogConfigCommand"),
  CreateContinuousDeploymentPolicyCommand: createCmd("CreateContinuousDeploymentPolicyCommand"),
  ListContinuousDeploymentPoliciesCommand: createCmd("ListContinuousDeploymentPoliciesCommand"),
  GetContinuousDeploymentPolicyCommand: createCmd("GetContinuousDeploymentPolicyCommand"),
  UpdateContinuousDeploymentPolicyCommand: createCmd("UpdateContinuousDeploymentPolicyCommand"),
  DeleteContinuousDeploymentPolicyCommand: createCmd("DeleteContinuousDeploymentPolicyCommand"),
  CreateFieldLevelEncryptionConfigCommand: createCmd("CreateFieldLevelEncryptionConfigCommand"),
  ListFieldLevelEncryptionConfigsCommand: createCmd("ListFieldLevelEncryptionConfigsCommand"),
  GetFieldLevelEncryptionCommand: createCmd("GetFieldLevelEncryptionCommand"),
  UpdateFieldLevelEncryptionConfigCommand: createCmd("UpdateFieldLevelEncryptionConfigCommand"),
  DeleteFieldLevelEncryptionConfigCommand: createCmd("DeleteFieldLevelEncryptionConfigCommand"),
  CreateFieldLevelEncryptionProfileCommand: createCmd("CreateFieldLevelEncryptionProfileCommand"),
  ListFieldLevelEncryptionProfilesCommand: createCmd("ListFieldLevelEncryptionProfilesCommand"),
  GetFieldLevelEncryptionProfileCommand: createCmd("GetFieldLevelEncryptionProfileCommand"),
  UpdateFieldLevelEncryptionProfileCommand: createCmd("UpdateFieldLevelEncryptionProfileCommand"),
  DeleteFieldLevelEncryptionProfileCommand: createCmd("DeleteFieldLevelEncryptionProfileCommand"),
  CreateStreamingDistributionCommand: createCmd("CreateStreamingDistributionCommand"),
  ListStreamingDistributionsCommand: createCmd("ListStreamingDistributionsCommand"),
  GetStreamingDistributionCommand: createCmd("GetStreamingDistributionCommand"),
  UpdateStreamingDistributionCommand: createCmd("UpdateStreamingDistributionCommand"),
  DeleteStreamingDistributionCommand: createCmd("DeleteStreamingDistributionCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: (Ctor: any, extra?: any) => new Ctor(extra),
}));

import router from "./cloudfront";

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

async function put(path: string, body?: any, headers?: Record<string, string>) {
  return router.request(path, {
    method: "PUT",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: { "content-type": "application/json", ...headers },
  });
}

async function del(path: string, headers?: Record<string, string>) {
  return router.request(path, { method: "DELETE", headers });
}

beforeEach(() => {
  mockSend.mockReset();
});

describe("CloudFront Routes", () => {
  describe("Distributions", () => {
    it("GET /distributions — lists distributions", async () => {
      mockSend.mockResolvedValueOnce({
        DistributionList: {
          Items: [
            { Id: "E1234567", ARN: "arn:aws:cloudfront::123:distribution/E1234567", Status: "Deployed", DomainName: "d123.cloudfront.net", Enabled: true },
          ],
        },
      });
      const res = await get("/distributions");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.distributions[0].Id).toBe("E1234567");
    });

    it("GET /distributions — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ DistributionList: {} });
      const res = await get("/distributions");
      const body = await res.json();
      expect(body.total).toBe(0);
    });

    it("GET /distributions/:id — gets distribution detail", async () => {
      mockSend.mockResolvedValueOnce({
        Distribution: { Id: "E123", Status: "Deployed" },
        ETag: "E123ABC",
      });
      const res = await get("/distributions/E123");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.distribution.Id).toBe("E123");
      expect(body.eTag).toBe("E123ABC");
    });

    it("POST /distributions — creates distribution (201)", async () => {
      mockSend.mockResolvedValueOnce({
        Distribution: { Id: "E999" },
        Location: "https://cloudfront.amazonaws.com/distribution/E999",
      });
      const res = await post("/distributions", {
        distributionConfig: { enabled: true },
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.distribution.Id).toBe("E999");
      expect(body.location).toContain("E999");
    });

    it("POST /distributions — 400 if config missing", async () => {
      const res = await post("/distributions", {});
      expect(res.status).toBe(400);
    });

    it("PUT /distributions/:id — updates distribution", async () => {
      mockSend.mockResolvedValueOnce({
        Distribution: { Id: "E123" },
        ETag: "NEWETAG",
      });
      const res = await put("/distributions/E123", {
        distributionConfig: { enabled: false },
      }, { "If-Match": "OLDETAG" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.eTag).toBe("NEWETAG");
    });

    it("PUT /distributions/:id — 400 if config missing", async () => {
      const res = await put("/distributions/E123", {});
      expect(res.status).toBe(400);
    });

    it("DELETE /distributions/:id — deletes with If-Match", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/distributions/E123", { "If-Match": "ETAG123" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });

    it("DELETE /distributions/:id — 400 if If-Match missing", async () => {
      const res = await del("/distributions/E123");
      expect(res.status).toBe(400);
    });
  });

  describe("Invalidations", () => {
    it("GET /distributions/:id/invalidations — lists invalidations", async () => {
      mockSend.mockResolvedValueOnce({
        InvalidationList: {
          Items: [{ Id: "I123", Status: "Completed" }],
        },
      });
      const res = await get("/distributions/E123/invalidations");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
    });

    it("GET /distributions/:id/invalidations — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ InvalidationList: {} });
      const res = await get("/distributions/E123/invalidations");
      const body = await res.json();
      expect(body.total).toBe(0);
    });

    it("POST /distributions/:id/invalidations — creates invalidation (201)", async () => {
      mockSend.mockResolvedValueOnce({
        Invalidation: { Id: "I999", Status: "InProgress" },
      });
      const res = await post("/distributions/E123/invalidations", {
        paths: ["/api/*", "/images/*"],
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.invalidation.Id).toBe("I999");
    });

    it("POST /distributions/:id/invalidations — 400 if paths missing", async () => {
      const res = await post("/distributions/E123/invalidations", {});
      expect(res.status).toBe(400);
    });

    it("GET /distributions/:id/invalidations/:invId — gets invalidation", async () => {
      mockSend.mockResolvedValueOnce({
        Invalidation: { Id: "I123", Status: "Completed" },
      });
      const res = await get("/distributions/E123/invalidations/I123");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.invalidation.Id).toBe("I123");
    });
  });

  describe("Cache Policies", () => {
    it("GET /cache-policies — lists cache policies", async () => {
      mockSend.mockResolvedValueOnce({
        CachePolicyList: {
          Items: [{ Type: "managed", CachePolicy: { Id: "658327ea-f89d-4fab-a63d-7e88639e58f6", CachePolicyConfig: { Name: "Managed-CachingOptimized" } } }],
        },
      });
      const res = await get("/cache-policies");
      const body = await res.json();
      expect(body.total).toBe(1);
    });

    it("GET /cache-policies — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ CachePolicyList: {} });
      const res = await get("/cache-policies");
      const body = await res.json();
      expect(body.total).toBe(0);
    });
  });

  describe("Origin Access Controls", () => {
    it("GET /origin-access-controls — lists OACs", async () => {
      mockSend.mockResolvedValueOnce({
        OriginAccessControlList: {
          Items: [{ Id: "E123OAC" }],
        },
      });
      const res = await get("/origin-access-controls");
      const body = await res.json();
      expect(body.total).toBe(1);
    });

    it("GET /origin-access-controls — sparse response defaults to []", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/origin-access-controls");
      const body = await res.json();
      expect(body).toEqual({ originAccessControls: [], total: 0 });
    });
  });

  describe("Functions", () => {
    it("GET /functions — lists functions", async () => {
      mockSend.mockResolvedValueOnce({
        FunctionList: {
          Items: [{ Name: "my-func", FunctionARN: "arn:aws:cloudfront::123:function/my-func" }],
        },
      });
      const res = await get("/functions");
      const body = await res.json();
      expect(body.total).toBe(1);
    });

    it("GET /functions — sparse response defaults to []", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/functions");
      const body = await res.json();
      expect(body).toEqual({ functions: [], total: 0 });
    });
  });

  describe("Tags", () => {
    it("GET /tags — lists tags for resource", async () => {
      mockSend.mockResolvedValueOnce({
        Tags: { Items: [{ Key: "env", Value: "prod" }] },
      });
      const res = await get("/tags?resource=arn:aws:cloudfront::123:distribution/E123");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.tags.length).toBe(1);
    });

    it("GET /tags — 400 if resource missing", async () => {
      const res = await get("/tags");
      expect(res.status).toBe(400);
    });

    it("GET /tags — sparse response defaults to []", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/tags?resource=arn:aws:cloudfront::123:distribution/E123");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.tags).toEqual([]);
    });
  });
});

// ─── P1 gap audit — policy families (cache/ORP/RHP) ─────

describe("CloudFront policy families (cache/origin-request/response-headers)", () => {
  it("creates policies for all three families", async () => {
    mockSend.mockResolvedValue({});
    expect((await post("/cache-policies", { name: "cp1" })).status).toBe(201);
    expect(mockSend.mock.calls[0][0].CachePolicyConfig.Name).toBe("cp1");
    expect((await post("/origin-request-policies", { name: "orp1" })).status).toBe(201);
    expect(mockSend.mock.calls[1][0].OriginRequestPolicyConfig.Name).toBe("orp1");
    expect((await post("/response-headers-policies", { name: "rhp1" })).status).toBe(201);
    expect(mockSend.mock.calls[2][0].ResponseHeadersPolicyConfig.Name).toBe("rhp1");
  });
  it("lists all three families", async () => {
    mockSend
      .mockResolvedValueOnce({ CachePolicyList: { Items: [{ CachePolicy: { Id: "cp1", Name: "cp" } }] } })
      .mockResolvedValueOnce({ OriginRequestPolicyList: { Items: [{ OriginRequestPolicy: { Id: "orp1" } }] } })
      .mockResolvedValueOnce({ ResponseHeadersPolicyList: { Items: [{ ResponseHeadersPolicy: { Id: "rhp1" } }] } });
    expect((await (await get("/cache-policies")).json()).total).toBe(1);
    expect((await (await get("/origin-request-policies")).json()).total).toBe(1);
    expect((await (await get("/response-headers-policies")).json()).total).toBe(1);
  });
  it("get/update/delete per family", async () => {
    mockSend
      .mockResolvedValueOnce({ CachePolicy: { Id: "cp1" } })
      .mockResolvedValueOnce({ CachePolicy: { Id: "cp1" } })
      .mockResolvedValueOnce({});
    expect((await get("/cache-policies/cp1")).status).toBe(200);
    const up = await put("/cache-policies/cp1", { name: "cp1", ifMatch: "E1" });
    expect(up.status).toBe(200);
    expect(mockSend.mock.calls[1][0].IfMatch).toBe("E1");
    expect((await del("/cache-policies/cp1?ifMatch=E2")).status).toBe(200);
    expect(mockSend.mock.calls[2][0].IfMatch).toBe("E2");
  });
  it("400 without name", async () => {
    expect((await post("/cache-policies", {})).status).toBe(400);
  });
  it("policy arms: config-passthrough, list-sparse, delete-without-ifMatch", async () => {
    // create with config passthrough (cache)
    mockSend.mockResolvedValueOnce({});
    await post("/cache-policies", { CachePolicyConfig: { Name: "direct" } });
    expect(mockSend.mock.calls[0][0].CachePolicyConfig).toEqual({ Name: "direct" });
    // create with config passthrough (origin-request)
    await post("/origin-request-policies", { config: { Name: "direct2" } });
    expect(mockSend.mock.calls[1][0].OriginRequestPolicyConfig).toEqual({ Name: "direct2" });
    // list sparse — Items missing
    mockSend.mockResolvedValueOnce({ CachePolicyList: {} });
    expect((await (await get("/cache-policies")).json()).total).toBe(0);
    // delete without ifMatch -> undefined
    mockSend.mockResolvedValueOnce({});
    await del("/cache-policies/cp9");
    expect(mockSend.mock.calls[3][0].IfMatch).toBeUndefined();
  });
});

describe("CloudFront OAC + OAI", () => {
  it("OAC create/get/update/delete + list", async () => {
    mockSend
      .mockResolvedValueOnce({ OriginAccessControl: { Id: "oac-1" } })
      .mockResolvedValueOnce({ OriginAccessControl: { Id: "oac-1" } })
      .mockResolvedValueOnce({ OriginAccessControl: { Id: "oac-1" } })
      .mockResolvedValueOnce({});
    expect((await post("/origin-access-controls", { name: "oac1" })).status).toBe(201);
    expect((await get("/origin-access-controls/oac-1")).status).toBe(200);
    expect((await put("/origin-access-controls/oac-1", { config: { Name: "oac1" } })).status).toBe(200);
    expect((await del("/origin-access-controls/oac-1?ifMatch=E1")).status).toBe(200);
    expect(mockSend.mock.calls[0][0].OriginAccessControlConfig.Name).toBe("oac1");
    expect((await post("/origin-access-controls", {})).status).toBe(400);
    // OAC sparse arms
    mockSend.mockResolvedValue({});
    expect((await get("/origin-access-controls/oac-9")).status).toBe(200);
    expect((await put("/origin-access-controls/oac-9", {})).status).toBe(200);
  });
  it("OAI create/list/get/update/delete + 400", async () => {
    mockSend
      .mockResolvedValueOnce({ CloudFrontOriginAccessIdentity: { Id: "oai-1" } })
      .mockResolvedValueOnce({ CloudFrontOriginAccessIdentityList: { Items: [{ Id: "oai-1" }] } })
      .mockResolvedValueOnce({ CloudFrontOriginAccessIdentity: { Id: "oai-1" } })
      .mockResolvedValueOnce({ CloudFrontOriginAccessIdentity: { Id: "oai-1" } })
      .mockResolvedValueOnce({});
    expect((await post("/oai", { callerReference: "c1" })).status).toBe(201);
    expect((await (await get("/oai")).json()).total).toBe(1);
    expect((await get("/oai/oai-1")).status).toBe(200);
    expect((await put("/oai/oai-1", { config: { Comment: "x" } })).status).toBe(200);
    expect((await del("/oai/oai-1?ifMatch=E")).status).toBe(200);
    expect((await post("/oai", {})).status).toBe(400);
  });
});

describe("CloudFront functions", () => {
  it("create/describe/code/update/publish/delete", async () => {
    const codeBytes = new Uint8Array([1, 2, 3]);
    mockSend
      .mockResolvedValueOnce({ FunctionSummary: { Name: "fn1" }, Location: "/fn" })
      .mockResolvedValueOnce({ FunctionSummary: { Name: "fn1" } })
      .mockResolvedValueOnce({ ETag: "E1", FunctionCode: codeBytes })
      .mockResolvedValueOnce({ FunctionSummary: { Name: "fn1" } })
      .mockResolvedValueOnce({ FunctionSummary: { Name: "fn1", Status: "PUBLISHED" } })
      .mockResolvedValueOnce({});
    expect((await post("/functions", { name: "fn1", functionCode: "code" })).status).toBe(201);
    expect((await get("/functions/fn1")).status).toBe(200);
    const code = await get("/functions/fn1/code");
    const cb = await code.json();
    expect(cb.etag).toBe("E1");
    expect(cb.codeBase64).toBe(Buffer.from(codeBytes).toString("base64"));
    expect((await put("/functions/fn1", { functionCode: "code2", ifMatch: "E1" })).status).toBe(200);
    expect((await post("/functions/fn1/publish?ifMatch=E1", {})).status).toBe(200);
    expect((await del("/functions/fn1?ifMatch=E1")).status).toBe(200);
    expect((await post("/functions", {})).status).toBe(400);
  });
  it("function code sparse — null codeBase64", async () => {
    mockSend.mockResolvedValueOnce({ ETag: "E" });
    const code = await get("/functions/fn9/code");
    expect((await code.json()).codeBase64).toBeNull();
  });
});

describe("CloudFront public keys + key groups", () => {
  it("public keys CRUD", async () => {
    mockSend
      .mockResolvedValueOnce({ PublicKey: { Id: "pk-1" } })
      .mockResolvedValueOnce({ PublicKeyList: { Items: [{ PublicKey: { Id: "pk-1" } }] } })
      .mockResolvedValueOnce({ PublicKey: { Id: "pk-1" }, ETag: "E" })
      .mockResolvedValueOnce({ PublicKey: { Id: "pk-1" } })
      .mockResolvedValueOnce({});
    expect((await post("/public-keys", { name: "k", encodedKey: "x" })).status).toBe(201);
    expect((await (await get("/public-keys")).json()).total).toBe(1);
    expect((await get("/public-keys/pk-1")).status).toBe(200);
    expect((await put("/public-keys/pk-1", { config: { Name: "k" } })).status).toBe(200);
    expect((await del("/public-keys/pk-1?ifMatch=E")).status).toBe(200);
    expect((await post("/public-keys", {})).status).toBe(400);
  });
  it("key groups CRUD", async () => {
    mockSend
      .mockResolvedValueOnce({ KeyGroup: { Id: "kg-1" } })
      .mockResolvedValueOnce({ KeyGroupList: { Items: [{ KeyGroup: { Id: "kg-1" } }] } })
      .mockResolvedValueOnce({ KeyGroup: { Id: "kg-1" } })
      .mockResolvedValueOnce({ KeyGroup: { Id: "kg-1" } })
      .mockResolvedValueOnce({});
    expect((await post("/key-groups", { name: "kg", items: [] })).status).toBe(201);
    expect((await (await get("/key-groups")).json()).total).toBe(1);
    expect((await get("/key-groups/kg-1")).status).toBe(200);
    expect((await put("/key-groups/kg-1", { config: { Name: "kg" } })).status).toBe(200);
    expect((await del("/key-groups/kg-1?ifMatch=E")).status).toBe(200);
    expect((await post("/key-groups", {})).status).toBe(400);
  });
});

describe("CloudFront distribution helpers + tags", () => {
  it("create-with-tags, get-config, associate alias", async () => {
    mockSend
      .mockResolvedValueOnce({ Distribution: { Id: "d1" } })
      .mockResolvedValueOnce({ DistributionConfig: { CallerReference: "x" }, ETag: "E1" })
      .mockResolvedValueOnce({});
    const res = await post("/distributions-with-tags", { distributionConfig: { CallerReference: "x" }, tags: [{ Key: "env", Value: "t" }] });
    expect(res.status).toBe(201);
    expect(mockSend.mock.calls[0][0].DistributionConfigWithTags.Tags.Items).toEqual([{ Key: "env", Value: "t" }]);
    const cfg = await get("/distributions/d1/config");
    const cb = await cfg.json();
    expect(cb.etag).toBe("E1");
    const alias = await post("/distributions/d1/alias", { alias: "cdn.example.com" });
    expect(alias.status).toBe(200);
    expect((await post("/distributions-with-tags", {})).status).toBe(400);
    expect((await post("/distributions/d1/alias", {})).status).toBe(400);
  });
  it("tags write + 400s", async () => {
    mockSend.mockResolvedValue({});
    expect((await post("/tags", { resourceArn: "arn:d", tags: [{ Key: "a", Value: "b" }] })).status).toBe(200);
    expect((await del("/tags?resourceArn=arn%3Ad&tagKeys=a")).status).toBe(200);
    expect((await post("/tags", {})).status).toBe(400);
    expect((await del("/tags")).status).toBe(400);
  });
});

// ─── Copy Distribution ──────────────────────────────────────

describe("Copy Distribution", () => {
  it("POST /distributions/:id/copy — copies with staging flag", async () => {
    mockSend.mockResolvedValueOnce({ Distribution: { Id: "E-COPY" } });
    const res = await post("/distributions/E1234567/copy", { staging: true, ifMatch: "ETAG1" });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.distribution.Id).toBe("E-COPY");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("CopyDistributionCommand");
    expect(mockSend.mock.calls[0][0].SourceDistributionId).toBe("E1234567");
    expect(mockSend.mock.calls[0][0].Staging).toBe(true);
    expect(mockSend.mock.calls[0][0].IfMatch).toBe("ETAG1");
  });

  it("POST /distributions/:id/copy — defaults staging to false", async () => {
    mockSend.mockResolvedValueOnce({ Distribution: { Id: "E-COPY" } });
    const res = await post("/distributions/E1234567/copy", {});
    expect(res.status).toBe(201);
    expect(mockSend.mock.calls[0][0].Staging).toBe(false);
  });

  it("POST /distributions/:id/copy — null distribution when sparse", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/distributions/E1234567/copy", {});
    expect(res.status).toBe(201);
    expect((await res.json()).distribution).toBe(null);
  });
});

// ─── Monitoring Subscriptions ───────────────────────────────

describe("Monitoring Subscriptions", () => {
  it("GET /distributions/:id/monitoring-subscription — returns subscription", async () => {
    mockSend.mockResolvedValueOnce({ MonitoringSubscription: { RealtimeMetricsSubscriptionConfig: { RealtimeMetricsSubscriptionStatus: "Enabled" } } });
    const res = await get("/distributions/E1234567/monitoring-subscription");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.monitoringSubscription.RealtimeMetricsSubscriptionConfig.RealtimeMetricsSubscriptionStatus).toBe("Enabled");
    expect(mockSend.mock.calls[0][0].DistributionId).toBe("E1234567");
  });

  it("GET /distributions/:id/monitoring-subscription — null when sparse", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/distributions/E1234567/monitoring-subscription");
    expect((await res.json()).monitoringSubscription).toBe(null);
  });

  it("PUT /distributions/:id/monitoring-subscription — updates with provided config", async () => {
    mockSend.mockResolvedValueOnce({ MonitoringSubscription: { RealtimeMetricsSubscriptionConfig: { RealtimeMetricsSubscriptionStatus: "Disabled" } } });
    const res = await put("/distributions/E1234567/monitoring-subscription", {
      monitoringSubscription: { RealtimeMetricsSubscriptionConfig: { RealtimeMetricsSubscriptionStatus: "Disabled" } },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.updated).toBe(true);
    expect(mockSend.mock.calls[0][0].MonitoringSubscription.RealtimeMetricsSubscriptionConfig.RealtimeMetricsSubscriptionStatus).toBe("Disabled");
  });

  it("PUT /distributions/:id/monitoring-subscription — defaults to enabled config", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/distributions/E1234567/monitoring-subscription", {});
    expect(res.status).toBe(200);
    expect(mockSend.mock.calls[0][0].MonitoringSubscription.RealtimeMetricsSubscriptionConfig.RealtimeMetricsSubscriptionStatus).toBe("Enabled");
    expect((await res.json()).monitoringSubscription).toBe(null);
  });
});

// ─── Realtime Log Configs ───────────────────────────────────

describe("Realtime Log Configs", () => {
  it("POST /realtime-log-configs — creates config", async () => {
    mockSend.mockResolvedValueOnce({ RealtimeLogConfig: { Name: "rt", SamplingRate: 50 } });
    const res = await post("/realtime-log-configs", { name: "rt", samplingRate: 50 });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.realtimeLogConfig.Name).toBe("rt");
    expect(mockSend.mock.calls[0][0].SamplingRate).toBe(50);
    expect(mockSend.mock.calls[0][0].Name).toBe("rt");
  });

  it("POST /realtime-log-configs — defaults sampling rate", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/realtime-log-configs", { name: "rt" });
    expect(res.status).toBe(201);
    expect(mockSend.mock.calls[0][0].SamplingRate).toBe(100000);
    expect((await res.json()).realtimeLogConfig).toBe(null);
  });

  it("POST /realtime-log-configs — 400 without name", async () => {
    const res = await post("/realtime-log-configs", {});
    expect(res.status).toBe(400);
  });

  it("GET /realtime-log-configs — lists configs", async () => {
    mockSend.mockResolvedValueOnce({ RealtimeLogConfigs: { Items: [{ Name: "rt", ARN: "arn:rt" }] } });
    const res = await get("/realtime-log-configs");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.realtimeLogConfigs[0].Name).toBe("rt");
  });

  it("GET /realtime-log-configs — empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/realtime-log-configs");
    const body = await res.json();
    expect(body.realtimeLogConfigs).toEqual([]);
    expect(body.total).toBe(0);
  });

  it("GET /realtime-log-configs/:name — returns config", async () => {
    mockSend.mockResolvedValueOnce({ RealtimeLogConfig: { Name: "rt" } });
    const res = await get("/realtime-log-configs/rt");
    expect(res.status).toBe(200);
    expect((await res.json()).realtimeLogConfig.Name).toBe("rt");
    expect(mockSend.mock.calls[0][0].Name).toBe("rt");
  });

  it("GET /realtime-log-configs/:name — null when sparse", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/realtime-log-configs/rt");
    expect((await res.json()).realtimeLogConfig).toBe(null);
  });

  it("PUT /realtime-log-configs/:arn — updates config", async () => {
    mockSend.mockResolvedValueOnce({ RealtimeLogConfig: { ARN: "arn:rt", SamplingRate: 75 } });
    const res = await put("/realtime-log-configs/arn%3Art", { samplingRate: 75 });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.updated).toBe(true);
    expect(body.realtimeLogConfig.SamplingRate).toBe(75);
    expect(mockSend.mock.calls[0][0].ARN).toBe("arn:rt");
  });

  it("PUT /realtime-log-configs/:arn — null config when sparse", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/realtime-log-configs/arn%3Art", {});
    expect((await res.json()).realtimeLogConfig).toBe(null);
  });

  it("DELETE /realtime-log-configs/:name — deletes", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/realtime-log-configs/rt");
    expect(res.status).toBe(200);
    expect((await res.json()).deleted).toBe(true);
    expect(mockSend.mock.calls[0][0].Name).toBe("rt");
  });
});

// ─── Continuous Deployment Policies ─────────────────────────

describe("Continuous Deployment Policies", () => {
  it("POST /continuous-deployment-policies — creates policy", async () => {
    mockSend.mockResolvedValueOnce({ ContinuousDeploymentPolicy: { Id: "CDP1", Enabled: true } });
    const res = await post("/continuous-deployment-policies", { policy: { Enabled: true } });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.policy.Id).toBe("CDP1");
    expect(mockSend.mock.calls[0][0].ContinuousDeploymentPolicy.Enabled).toBe(true);
  });

  it("POST /continuous-deployment-policies — accepts ContinuousDeploymentPolicy key", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/continuous-deployment-policies", { ContinuousDeploymentPolicy: { Enabled: false } });
    expect(res.status).toBe(201);
    expect(mockSend.mock.calls[0][0].ContinuousDeploymentPolicy.Enabled).toBe(false);
    expect((await res.json()).policy).toBe(null);
  });

  it("POST /continuous-deployment-policies — 400 without policy", async () => {
    const res = await post("/continuous-deployment-policies", {});
    expect(res.status).toBe(400);
  });

  it("GET /continuous-deployment-policies — lists policies", async () => {
    mockSend.mockResolvedValueOnce({ ContinuousDeploymentPolicyList: { Items: [{ Id: "CDP1" }] } });
    const res = await get("/continuous-deployment-policies");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.policies[0].Id).toBe("CDP1");
  });

  it("GET /continuous-deployment-policies — empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/continuous-deployment-policies");
    expect((await res.json()).total).toBe(0);
  });

  it("GET /continuous-deployment-policies/:id — returns policy", async () => {
    mockSend.mockResolvedValueOnce({ ContinuousDeploymentPolicy: { Id: "CDP1" } });
    const res = await get("/continuous-deployment-policies/CDP1");
    expect((await res.json()).policy.Id).toBe("CDP1");
    expect(mockSend.mock.calls[0][0].Id).toBe("CDP1");
  });

  it("GET /continuous-deployment-policies/:id — null when sparse", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/continuous-deployment-policies/CDP1");
    expect((await res.json()).policy).toBe(null);
  });

  it("PUT /continuous-deployment-policies/:id — updates policy", async () => {
    mockSend.mockResolvedValueOnce({ ContinuousDeploymentPolicy: { Id: "CDP1", Enabled: false } });
    const res = await put("/continuous-deployment-policies/CDP1", { policy: { Enabled: false }, ifMatch: "ETAG" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.updated).toBe(true);
    expect(mockSend.mock.calls[0][0].IfMatch).toBe("ETAG");
  });

  it("PUT /continuous-deployment-policies/:id — null policy when sparse", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/continuous-deployment-policies/CDP1", {});
    expect((await res.json()).policy).toBe(null);
  });

  it("DELETE /continuous-deployment-policies/:id — deletes with IfMatch header", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/continuous-deployment-policies/CDP1", { "If-Match": "ETAG-HDR" });
    expect(res.status).toBe(200);
    expect((await res.json()).deleted).toBe(true);
    expect(mockSend.mock.calls[0][0].IfMatch).toBe("ETAG-HDR");
  });

  it("DELETE /continuous-deployment-policies/:id — uses query ifMatch", async () => {
    mockSend.mockResolvedValueOnce({});
    await del("/continuous-deployment-policies/CDP1?ifMatch=ETAG-Q");
    expect(mockSend.mock.calls[0][0].IfMatch).toBe("ETAG-Q");
  });
});

// ─── FLE / FLE Profiles / Streaming Distributions ───────────

describe.each([
  ["field-level-encryption-configs", "fieldLevelEncryption", "FieldLevelEncryption", "FieldLevelEncryptionList", "FieldLevelEncryptionConfig"],
  ["field-level-encryption-profiles", "fieldLevelEncryptionProfile", "FieldLevelEncryptionProfile", "FieldLevelEncryptionProfileList", "FieldLevelEncryptionProfileConfig"],
  ["streaming-distributions", "streamingDistribution", "StreamingDistribution", "StreamingDistributionList", "StreamingDistributionConfig"],
])("%s", (route, singular, resultKey, listField, configName) => {
  it("POST — creates from config key", async () => {
    mockSend.mockResolvedValueOnce({ [resultKey]: { Id: "X1" } });
    const res = await post(`/${route}`, { [configName]: { Name: "x" } });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body[singular].Id).toBe("X1");
    expect(mockSend.mock.calls[0][0][configName].Name).toBe("x");
  });

  it("POST — creates from config shorthand", async () => {
    mockSend.mockResolvedValueOnce({ [resultKey]: { Id: "X1" } });
    const res = await post(`/${route}`, { config: { Name: "y" } });
    expect(res.status).toBe(201);
    expect(mockSend.mock.calls[0][0][configName].Name).toBe("y");
  });

  it("POST — 400 without config", async () => {
    const res = await post(`/${route}`, {});
    expect(res.status).toBe(400);
  });

  it("GET — lists items", async () => {
    mockSend.mockResolvedValueOnce({ [listField]: { Items: [{ Id: "X1" }] } });
    const res = await get(`/${route}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body[route]).toEqual([{ Id: "X1" }]);
    expect(body.total).toBe(1);
  });

  it("GET — empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get(`/${route}`);
    expect((await res.json()).total).toBe(0);
  });

  it("GET :id — returns resource", async () => {
    mockSend.mockResolvedValueOnce({ [resultKey]: { Id: "X1" } });
    const res = await get(`/${route}/X1`);
    expect(res.status).toBe(200);
    expect((await res.json())[singular].Id).toBe("X1");
    expect(mockSend.mock.calls[0][0].Id).toBe("X1");
  });

  it("GET :id — null when sparse", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get(`/${route}/X1`);
    expect((await res.json())[singular]).toBe(null);
  });

  it("PUT :id — updates config", async () => {
    mockSend.mockResolvedValueOnce({ [resultKey]: { Id: "X1" } });
    const res = await put(`/${route}/X1`, { [configName]: { Name: "z" }, ifMatch: "ETAG" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.updated).toBe(true);
    expect(mockSend.mock.calls[0][0].IfMatch).toBe("ETAG");
    expect(mockSend.mock.calls[0][0].Id).toBe("X1");
  });

  it("PUT :id — accepts config shorthand", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put(`/${route}/X1`, { config: { Name: "w" } });
    expect(mockSend.mock.calls[0][0][configName].Name).toBe("w");
    expect((await res.json())[singular]).toBe(null);
  });

  it("DELETE :id — deletes with query ifMatch", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del(`/${route}/X1?ifMatch=ETAG-Q`);
    expect(res.status).toBe(200);
    expect((await res.json()).deleted).toBe(true);
    expect(mockSend.mock.calls[0][0].IfMatch).toBe("ETAG-Q");
  });
});

describe("Advanced routes — extra arms", () => {
  it("DELETE /continuous-deployment-policies/:id — uses If-Match header when query missing", async () => {
    mockSend.mockResolvedValueOnce({});
    await del("/continuous-deployment-policies/CDP1", { "If-Match": "ETAG-HDR" });
    expect(mockSend.mock.calls[0][0].IfMatch).toBe("ETAG-HDR");
  });

  it("POST simple family — accepts policy shorthand", async () => {
    mockSend.mockResolvedValueOnce({ StreamingDistribution: { Id: "S1" } });
    const res = await post("/streaming-distributions", { policy: { Name: "p" } });
    expect(res.status).toBe(201);
    expect(mockSend.mock.calls[0][0].StreamingDistributionConfig.Name).toBe("p");
    expect((await res.json()).streamingDistribution.Id).toBe("S1");
  });

  it("DELETE simple family — uses If-Match header when query missing", async () => {
    mockSend.mockResolvedValueOnce({});
    await del("/streaming-distributions/S1", { "If-Match": "ETAG-HDR" });
    expect(mockSend.mock.calls[0][0].IfMatch).toBe("ETAG-HDR");
  });
});

describe("Advanced routes — no-IfMatch deletes", () => {
  it("DELETE /continuous-deployment-policies/:id — undefined IfMatch when none given", async () => {
    mockSend.mockResolvedValueOnce({});
    await del("/continuous-deployment-policies/CDP1");
    expect(mockSend.mock.calls[0][0].IfMatch).toBeUndefined();
  });

  it("DELETE simple family — undefined IfMatch when none given", async () => {
    mockSend.mockResolvedValueOnce({});
    await del("/field-level-encryption-configs/F1");
    expect(mockSend.mock.calls[0][0].IfMatch).toBeUndefined();
  });
});

describe("Advanced routes — sparse create results", () => {
  it("POST simple family — null singular when result sparse", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/field-level-encryption-configs", { config: { Name: "x" } });
    expect(res.status).toBe(201);
    expect((await res.json()).fieldLevelEncryption).toBe(null);
  });
});
