import { describe, it, expect, beforeEach, vi } from "vitest";

const mockStsSend = vi.hoisted(() => vi.fn());

const mockSTS = vi.hoisted(() =>
  vi.fn(function () {
    return { send: mockStsSend };
  })
);

const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) {
      return { __cmdName: name, ...args };
    });
  };
});

vi.mock("@aws-sdk/client-sts", () => ({
  STSClient: mockSTS,
  GetCallerIdentityCommand: createCmd("GetCallerIdentityCommand"),
}));

vi.mock("./aws", () => ({
  create: () => ({ send: mockStsSend }),
  getAwsConfig: () => ({ region: "us-east-1" }),
}));

import { callerAccountId, budgetArn, identityPoolArn } from "./arns";

beforeEach(() => {
  vi.clearAllMocks();
  mockStsSend.mockReset();
});

describe("callerAccountId", () => {
  it("returns the STS account", async () => {
    mockStsSend.mockResolvedValueOnce({ Account: "123456789012" });
    const account = await callerAccountId();
    expect(account).toBe("123456789012");
    expect(mockStsSend).toHaveBeenCalledWith(
      expect.objectContaining({ __cmdName: "GetCallerIdentityCommand" })
    );
  });

  it("propagates STS errors", async () => {
    mockStsSend.mockRejectedValueOnce(new Error("no sts"));
    await expect(callerAccountId()).rejects.toThrow("no sts");
  });
});

describe("budgetArn", () => {
  it("builds the budget ARN from the caller account", async () => {
    mockStsSend.mockResolvedValueOnce({ Account: "123456789012" });
    const arn = await budgetArn("monthly");
    expect(arn).toBe("arn:aws:budgets::123456789012:budget/monthly");
  });
});

describe("identityPoolArn", () => {
  it("builds the pool ARN from region and caller account", async () => {
    mockStsSend.mockResolvedValueOnce({ Account: "123456789012" });
    const arn = await identityPoolArn("us-east-1:abc");
    expect(arn).toBe(
      "arn:aws:cognito-identity:us-east-1:123456789012:identitypool/us-east-1:abc"
    );
  });
});
