// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from "vitest";
import { POLICY_TYPES, accountDateLabel, accountsCsv, downloadText, formatOrgDate, jsonError, policyTypeLabel } from "./orgUtils";

const acct = (over: object = {}) => ({ Id: "111", Arn: "arn", Name: "Dev", Email: "d@x.io", Status: "ACTIVE", ...over });

afterEach(() => vi.restoreAllMocks());

describe("orgUtils", () => {
  it("labels known policy types and passes unknown ones through", () => {
    expect(policyTypeLabel("TAG_POLICY")).toBe("Tag policies");
    expect(policyTypeLabel("NEW_POLICY")).toBe("NEW_POLICY");
    expect(POLICY_TYPES.filter((p) => p.category === "Authorization policies")).toHaveLength(2);
  });

  it("formats dates like the console and tolerates missing values", () => {
    expect(formatOrgDate(new Date(2022, 9, 7))).toBe("2022/10/07");
    expect(formatOrgDate(undefined)).toBe("");
  });

  it("labels created vs joined accounts", () => {
    expect(accountDateLabel(acct({ JoinedMethod: "CREATED", JoinedTimestamp: new Date(2022, 10, 4).toISOString() }))).toBe("Created 2022/11/04");
    expect(accountDateLabel(acct({ JoinedMethod: "INVITED", JoinedTimestamp: new Date(2022, 9, 27).toISOString() }))).toBe("Joined 2022/10/27");
    expect(accountDateLabel(acct())).toBe("");
  });

  it("builds a CSV with quoting where needed", () => {
    const csv = accountsCsv([acct({ Name: 'A, "B"', JoinedMethod: "CREATED", JoinedTimestamp: new Date(2022, 0, 2).toISOString() }), acct()]);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("Account name,Account ID,Email,Status,Joined method,Joined date");
    expect(lines[1]).toBe('"A, ""B""",111,d@x.io,ACTIVE,CREATED,2022/01/02');
    expect(lines[2]).toBe("Dev,111,d@x.io,ACTIVE,,");
  });

  it("downloads text through a temporary link", () => {
    const create = vi.fn(() => "blob:x");
    const revoke = vi.fn();
    Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    downloadText("a.csv", "x");
    expect(create).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(revoke).toHaveBeenCalledWith("blob:x");
  });

  it("validates policy JSON", () => {
    expect(jsonError('{"a":1}')).toBeNull();
    expect(jsonError("[1]")).toBe("The policy must be a JSON object.");
    expect(jsonError("null")).toBe("The policy must be a JSON object.");
    expect(jsonError("{")).toMatch(/^Invalid JSON/);
  });
});
