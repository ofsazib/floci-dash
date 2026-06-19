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

vi.mock("@aws-sdk/client-appconfigdata", () => ({
  AppConfigDataClient: mockClient,
  StartConfigurationSessionCommand: createCmd("StartConfigurationSessionCommand"),
  GetLatestConfigurationCommand: createCmd("GetLatestConfigurationCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./appconfigdata";

async function post(path: string, body?: any) {
  return router.request(path, {
    method: "POST",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSend.mockReset();
});

describe("AppConfigData Routes", () => {
  describe("POST /sessions", () => {
    it("starts a configuration session with required params", async () => {
      mockSend.mockResolvedValueOnce({ InitialConfigurationToken: "token-123" });
      const res = await post("/sessions", {
        ApplicationIdentifier: "app-1",
        EnvironmentIdentifier: "env-1",
        ConfigurationProfileIdentifier: "profile-1",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.initialConfigurationToken).toBe("token-123");
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          __cmdName: "StartConfigurationSessionCommand",
          ApplicationIdentifier: "app-1",
          EnvironmentIdentifier: "env-1",
          ConfigurationProfileIdentifier: "profile-1",
        })
      );
    });

    it("passes optional RequiredMinimumPollIntervalInSeconds", async () => {
      mockSend.mockResolvedValueOnce({ InitialConfigurationToken: "token-456" });
      await post("/sessions", {
        ApplicationIdentifier: "app-1",
        EnvironmentIdentifier: "env-1",
        ConfigurationProfileIdentifier: "profile-1",
        RequiredMinimumPollIntervalInSeconds: 15,
      });
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          RequiredMinimumPollIntervalInSeconds: 15,
        })
      );
    });

    it("returns 400 when ApplicationIdentifier is missing", async () => {
      const res = await post("/sessions", {
        EnvironmentIdentifier: "env-1",
        ConfigurationProfileIdentifier: "profile-1",
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("ApplicationIdentifier");
    });

    it("returns 400 when EnvironmentIdentifier is missing", async () => {
      const res = await post("/sessions", {
        ApplicationIdentifier: "app-1",
        ConfigurationProfileIdentifier: "profile-1",
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("EnvironmentIdentifier");
    });

    it("returns 400 when ConfigurationProfileIdentifier is missing", async () => {
      const res = await post("/sessions", {
        ApplicationIdentifier: "app-1",
        EnvironmentIdentifier: "env-1",
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("ConfigurationProfileIdentifier");
    });
  });

  describe("POST /configurations", () => {
    it("gets configuration with token", async () => {
      mockSend.mockResolvedValueOnce({
        ContentType: "application/json",
        Configuration: new Uint8Array([123, 34, 107, 101, 121, 34, 58, 32, 34, 118, 97, 108, 117, 101, 34, 125]),
        VersionLabel: "1",
        NextPollConfigurationToken: "next-token",
        NextPollIntervalInSeconds: 30,
      });
      const res = await post("/configurations", { configurationToken: "token-123" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.content).toBeTruthy();
      expect(body.contentType).toBe("application/json");
      expect(body.versionLabel).toBe("1");
      expect(body.nextPollConfigurationToken).toBe("next-token");
      expect(body.nextPollIntervalInSeconds).toBe(30);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          __cmdName: "GetLatestConfigurationCommand",
          ConfigurationToken: "token-123",
        })
      );
    });

    it("returns null content when no configuration", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/configurations", { configurationToken: "token-empty" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.content).toBeNull();
    });

    it("returns 400 when configurationToken is missing", async () => {
      const res = await post("/configurations", {});
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("configurationToken");
    });
  });
});
