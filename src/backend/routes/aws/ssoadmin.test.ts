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
      SSOAdminClient: vi.fn(function (this: any) {
        return { send: mockSend };
      }),
      ListInstancesCommand: createCmd("ListInstancesCommand"),
    },
  };
});

vi.mock("@aws-sdk/client-sso-admin", () => mocks);

import router from "./ssoadmin";

beforeEach(() => {
  mockSend.mockReset();
});

describe("SSO Admin routes", () => {
  it("GET /instances — sends ListInstancesCommand and maps rows", async () => {
    mockSend.mockResolvedValueOnce({
      Instances: [
        {
          InstanceArn: "arn:aws:sso:::instance/ssoins-1",
          IdentityStoreId: "d-1",
          Name: "floci-identity-center",
          OwnerAccountId: "123456789012",
          Status: "ACTIVE",
        },
      ],
    });
    const res = await router.request("/instances");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.instances).toHaveLength(1);
    expect(body.total).toBe(1);
    expect(body.instances[0].InstanceArn).toBe("arn:aws:sso:::instance/ssoins-1");
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("ListInstancesCommand");
  });

  it("GET /instances — falls back to empty when Instances undefined", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await router.request("/instances");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.instances).toEqual([]);
    expect(body.total).toBe(0);
  });
});
