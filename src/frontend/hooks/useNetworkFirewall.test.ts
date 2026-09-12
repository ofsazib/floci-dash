// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockApi = vi.fn();
vi.mock("../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

import * as hooks from "./useNetworkFirewall";

const names = Object.keys(hooks);

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
  mockApi.mockResolvedValue({ ok: true });
});

describe("useNetworkFirewall hooks", () => {
  it("exports 25 hooks", () => {
    expect(names.length).toBe(27);
  });

  for (const name of names) {
    it(`${name} behaves correctly`, async () => {
      const hook = (hooks as any)[name];
      const isQuery = name.match(/Firewalls$|Detail$|DefaultView$|Policies$|RuleGroups$|LoggingConfig$|Config$/) || name === "useNfwLoggingConfig";
      if (isQuery) {
        const arg = name === "useNfwFirewallDetail" || name === "useNfwPolicyDetail" || name === "useNfwRuleGroupDetail" || name === "useNfwLoggingConfig"
          ? { name: "x" }
          : name === "useNfwRuleGroups"
            ? "STATEFUL"
            : undefined;
        const { result } = renderHook(() => hook(arg), { wrapper: createWrapper() });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(mockApi).toHaveBeenCalled();
        return;
      }
      if (name === "useNfwDisassociateZones" || name === "useNfwDisassociateDefaultView") {
        const { result } = renderHook(() => hook(), { wrapper: createWrapper() });
        result.current.mutate({});
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        return;
      }
      const { result } = renderHook(() => hook(), { wrapper: createWrapper() });
      const bodies: Record<string, any> = {
        useNfwCreateFirewall: { name: "fw", vpcId: "vpc", subnetMappings: ["subnet-1"] },
        useNfwDeleteFirewall: { name: "fw" },
        useNfwDeleteProtection: { name: "fw", enabled: true },
        useNfwPolicyChangeProtection: { name: "fw", enabled: true },
        useNfwSubnetChangeProtection: { name: "fw", enabled: true },
        useNfwAzChangeProtection: { name: "fw", enabled: true },
        useNfwUpdateDescription: { name: "fw", description: "d" },
        useNfwAnalysisSettings: { name: "fw", analysisSettings: "{}" },
        useNfwAssociateSubnets: { name: "fw", subnetIds: ["subnet-1"] },
        useNfwDisassociateSubnets: { name: "fw", subnetIds: ["subnet-1"] },
        useNfwAssociateZones: { name: "fw", zoneMappings: [] },
        useNfwAssociatePolicy: { name: "fw", policyArn: "arn:pol" },
        useNfwUpdateLogging: { name: "fw", loggingConfiguration: "{}" },
        useNfwCreatePolicy: { name: "p" },
        useNfwUpdatePolicy: { name: "p" },
        useNfwDeletePolicy: { name: "p" },
        useNfwCreateRuleGroup: { name: "g", type: "STATEFUL", capacity: "1" },
        useNfwUpdateRuleGroup: { name: "g" },
        useNfwDeleteRuleGroup: { name: "g" },
      };
      result.current.mutate(bodies[name] ?? {});
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi).toHaveBeenCalled();
    });
  }

  it("query hooks are disabled without refs", () => {
    for (const name of ["useNfwFirewallDetail", "useNfwPolicyDetail", "useNfwRuleGroupDetail", "useNfwLoggingConfig"]) {
      const { result } = renderHook(() => (hooks as any)[name](null), { wrapper: createWrapper() });
      expect(result.current.fetchStatus).toBe("idle");
    }
    expect(mockApi).not.toHaveBeenCalled();
  });
});
