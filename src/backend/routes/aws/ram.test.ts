import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSend, mocks } = vi.hoisted(() => {
  const mockSend = vi.fn();
  const createCmd = (name: string) =>
    vi.fn(function (this: any, args?: any) {
      const cmd: any = { ...args, __cmdName: name };
      return cmd;
    });
  return {
    mockSend,
    mocks: {
      ResourceAccessManagerClient: vi.fn(function (this: any) {
        return { send: mockSend };
      }),
      RAMClient: vi.fn(function (this: any) {
        return { send: mockSend };
      }),
      EnableSharingWithAwsOrganizationCommand: createCmd("EnableSharingWithAwsOrganizationCommand"),
      CreateResourceShareCommand: createCmd("CreateResourceShareCommand"),
      GetResourceSharesCommand: createCmd("GetResourceSharesCommand"),
      DeleteResourceShareCommand: createCmd("DeleteResourceShareCommand"),
      UpdateResourceShareCommand: createCmd("UpdateResourceShareCommand"),
      AssociateResourceShareCommand: createCmd("AssociateResourceShareCommand"),
      DisassociateResourceShareCommand: createCmd("DisassociateResourceShareCommand"),
      ListPrincipalsCommand: createCmd("ListPrincipalsCommand"),
      ListResourcesCommand: createCmd("ListResourcesCommand"),
      GetResourceShareInvitationsCommand: createCmd("GetResourceShareInvitationsCommand"),
      TagResourceCommand: createCmd("TagResourceCommand"),
      UntagResourceCommand: createCmd("UntagResourceCommand"),
    },
  };
});

vi.mock("@aws-sdk/client-ram", () => mocks);

import router from "./ram";

const get = (path: string) => router.request(path);
const post = (path: string, body?: any) =>
  router.request(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
const put = (path: string, body?: any) =>
  router.request(path, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
const del = (path: string) => router.request(path, { method: "DELETE" });

const share = {
  resourceShareArn: "arn:aws:ram:us-east-1:123456789012:resource-share/abc",
  name: "my-share",
  status: "ACTIVE",
};

beforeEach(() => {
  mockSend.mockReset();
});

describe("RAM — organization sharing", () => {
  it("POST /enable-sharing — sends EnableSharingWithAwsOrganizationCommand", async () => {
    mockSend.mockResolvedValueOnce({ returnValue: true });
    const res = await post("/enable-sharing");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.returnValue).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("EnableSharingWithAwsOrganizationCommand");
  });

  it("POST /enable-sharing — falls back when returnValue undefined", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/enable-sharing");
    const body = await res.json();
    expect(body.returnValue).toBeUndefined();
  });
});

describe("RAM — shares", () => {
  it("GET /shares — lists shares with default SELF owner", async () => {
    mockSend.mockResolvedValueOnce({ resourceShares: [share] });
    const res = await get("/shares");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.resourceShares).toHaveLength(1);
    expect(body.total).toBe(1);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("GetResourceSharesCommand");
    expect(cmd.resourceOwner).toBe("SELF");
  });

  it("GET /shares — forwards resourceOwner and falls back when undefined", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/shares?resourceOwner=OTHER");
    const body = await res.json();
    expect(body.resourceShares).toEqual([]);
    expect(body.total).toBe(0);
    expect(mockSend.mock.calls[0][0].resourceOwner).toBe("OTHER");
  });

  it("POST /shares — creates a share", async () => {
    mockSend.mockResolvedValueOnce({ resourceShare: share });
    const res = await post("/shares", {
      name: "my-share",
      allowExternalPrincipals: true,
      principals: ["123456789012"],
      resourceArns: ["arn:aws:s3:::bucket"],
      tags: [{ key: "env", value: "dev" }],
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.resourceShare.name).toBe("my-share");
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("CreateResourceShareCommand");
    expect(cmd.name).toBe("my-share");
    expect(cmd.principals).toEqual(["123456789012"]);
  });

  it("POST /shares — 400 when name missing", async () => {
    const res = await post("/shares", {});
    expect(res.status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("PUT /shares/:arn — updates a share", async () => {
    mockSend.mockResolvedValueOnce({ resourceShare: share });
    const res = await put(`/shares/${encodeURIComponent(share.resourceShareArn)}`, {
      name: "renamed",
      allowExternalPrincipals: false,
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.resourceShare.name).toBe("my-share");
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("UpdateResourceShareCommand");
    expect(cmd.resourceShareArn).toBe(share.resourceShareArn);
    expect(cmd.name).toBe("renamed");
  });

  it("DELETE /shares/:arn — deletes a share", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del(`/shares/${encodeURIComponent(share.resourceShareArn)}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("DeleteResourceShareCommand");
    expect(cmd.resourceShareArn).toBe(share.resourceShareArn);
  });

  it("POST /shares/:arn/associate — associates resources and principals", async () => {
    mockSend.mockResolvedValueOnce({
      resourceShareAssociations: [{ associatedEntity: "123456789012", status: "ASSOCIATED" }],
    });
    const res = await post(`/shares/${encodeURIComponent(share.resourceShareArn)}/associate`, {
      resourceArns: ["arn:aws:s3:::bucket"],
      principals: ["123456789012"],
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.resourceShareAssociations).toHaveLength(1);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("AssociateResourceShareCommand");
    expect(cmd.resourceShareArn).toBe(share.resourceShareArn);
  });

  it("POST /shares/:arn/associate — falls back to empty when associations undefined", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post(`/shares/${encodeURIComponent(share.resourceShareArn)}/associate`, {});
    const body = await res.json();
    expect(body.resourceShareAssociations).toEqual([]);
  });

  it("POST /shares/:arn/disassociate — disassociates resources and principals", async () => {
    mockSend.mockResolvedValueOnce({
      resourceShareAssociations: [{ associatedEntity: "123456789012", status: "DISASSOCIATED" }],
    });
    const res = await post(`/shares/${encodeURIComponent(share.resourceShareArn)}/disassociate`, {
      principals: ["123456789012"],
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.resourceShareAssociations).toHaveLength(1);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("DisassociateResourceShareCommand");
  });

  it("POST /shares/:arn/disassociate — falls back to empty when associations undefined", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post(`/shares/${encodeURIComponent(share.resourceShareArn)}/disassociate`, {});
    const body = await res.json();
    expect(body.resourceShareAssociations).toEqual([]);
  });
});

describe("RAM — principals and resources", () => {
  it("GET /principals — lists principals with default SELF owner", async () => {
    mockSend.mockResolvedValueOnce({
      principals: [{ id: "123456789012", resourceShareArn: share.resourceShareArn }],
    });
    const res = await get("/principals");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.principals).toHaveLength(1);
    expect(body.total).toBe(1);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("ListPrincipalsCommand");
    expect(cmd.resourceOwner).toBe("SELF");
    expect(cmd.resourceShareArns).toBeUndefined();
  });

  it("GET /principals — filters by resourceShareArn query", async () => {
    mockSend.mockResolvedValueOnce({ principals: [] });
    const res = await get(`/principals?resourceShareArn=${encodeURIComponent(share.resourceShareArn)}`);
    const body = await res.json();
    expect(body.principals).toEqual([]);
    expect(mockSend.mock.calls[0][0].resourceShareArns).toEqual([share.resourceShareArn]);
  });

  it("GET /principals — falls back to empty when principals undefined", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/principals");
    const body = await res.json();
    expect(body.principals).toEqual([]);
    expect(body.total).toBe(0);
  });

  it("GET /resources — lists shared resources with default SELF owner", async () => {
    mockSend.mockResolvedValueOnce({
      resources: [{ arn: "arn:aws:s3:::bucket", type: "s3:Bucket", status: "ACTIVE" }],
    });
    const res = await get("/resources");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.resources).toHaveLength(1);
    expect(body.total).toBe(1);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("ListResourcesCommand");
    expect(cmd.resourceOwner).toBe("SELF");
  });

  it("GET /resources — filters by resourceShareArn and falls back when undefined", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get(`/resources?resourceShareArn=${encodeURIComponent(share.resourceShareArn)}`);
    const body = await res.json();
    expect(body.resources).toEqual([]);
    expect(mockSend.mock.calls[0][0].resourceShareArns).toEqual([share.resourceShareArn]);
  });
});

describe("RAM — invitations and tags", () => {
  it("GET /invitations — lists invitations", async () => {
    mockSend.mockResolvedValueOnce({
      resourceShareInvitations: [{ resourceShareInvitationArn: "inv-1" }],
    });
    const res = await get("/invitations");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.resourceShareInvitations).toHaveLength(1);
    expect(body.total).toBe(1);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("GetResourceShareInvitationsCommand");
  });

  it("GET /invitations — falls back to empty when undefined", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/invitations");
    const body = await res.json();
    expect(body.resourceShareInvitations).toEqual([]);
    expect(body.total).toBe(0);
  });

  it("POST /tags — sends TagResourceCommand with key/value pairs", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/tags", {
      resourceShareArn: share.resourceShareArn,
      tags: [{ key: "env", value: "dev" }],
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tagged).toBe(true);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("TagResourceCommand");
    expect(cmd.resourceShareArn).toBe(share.resourceShareArn);
    expect(cmd.tags).toEqual([{ key: "env", value: "dev" }]);
  });

  it("POST /tags — 400 when params missing", async () => {
    const res = await post("/tags", { resourceShareArn: share.resourceShareArn });
    expect(res.status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("POST /tags/untag — sends UntagResourceCommand", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/tags/untag", {
      resourceShareArn: share.resourceShareArn,
      tagKeys: ["env"],
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.untagged).toBe(true);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("UntagResourceCommand");
    expect(cmd.tagKeys).toEqual(["env"]);
  });

  it("POST /tags/untag — 400 when params missing", async () => {
    const res = await post("/tags/untag", { resourceShareArn: share.resourceShareArn });
    expect(res.status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });
});
