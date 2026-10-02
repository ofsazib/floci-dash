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

vi.mock("@aws-sdk/client-controlcatalog", () => ({
  ControlCatalogClient: mockClient,
  ListControlsCommand: createCmd("ListControlsCommand"),
  GetControlCommand: createCmd("GetControlCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./controlcatalog";

async function get(path: string) {
  return router.request(path, { method: "GET" });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSend.mockReset();
});

describe("GET /controls", () => {
  it("lists controls", async () => {
    mockSend.mockResolvedValueOnce({
      Controls: [
        { Arn: "arn:cc:control/1", Name: "audit-lock", Behavior: "PROACTIVE", Severity: "CRITICAL" },
      ],
    });
    const res = await get("/controls");
    const json = await res.json();
    expect(json.controls.length).toBe(1);
    expect(json.controls[0].Name).toBe("audit-lock");
  });

  it("returns sparse controls", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/controls");
    const json = await res.json();
    expect(json.controls).toEqual([]);
    expect(json.nextToken).toBeNull();
  });
});

describe("GET /controls/:arn", () => {
  it("gets a control", async () => {
    mockSend.mockResolvedValueOnce({ Arn: "arn:cc:control/1", Name: "audit-lock" });
    const res = await get("/controls/arn%3Acc%3Acontrol%2F1");
    const json = await res.json();
    expect(json.control.Name).toBe("audit-lock");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "GetControlCommand",
        ControlArn: "arn:cc:control/1",
      })
    );
  });

  it("returns null when absent", async () => {
    mockSend.mockResolvedValueOnce(null);
    const res = await get("/controls/none");
    const json = await res.json();
    expect(json.control).toBeNull();
  });
});
