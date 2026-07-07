// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

const mockWebAcls = vi.fn();
const mockCreateWebAcl = vi.fn();
const mockDeleteWebAcl = vi.fn();
const mockIPSets = vi.fn();
const mockRegexSets = vi.fn();
const mockRuleGroups = vi.fn();

vi.mock("../../hooks/useWafV2", () => ({
  useWebACLs: (...args: any[]) => mockWebAcls(...args),
  useCreateWebACL: () => ({ mutate: mockCreateWebAcl, isPending: false }),
  useDeleteWebACL: () => ({ mutateAsync: mockDeleteWebAcl, isPending: false, variables: null }),
  useIPSets: (...args: any[]) => mockIPSets(...args),
  useRegexPatternSets: (...args: any[]) => mockRegexSets(...args),
  useRuleGroups: (...args: any[]) => mockRuleGroups(...args),
}));

import { WafV2Dashboard } from "./WafV2Dashboard";

beforeEach(() => {
  vi.clearAllMocks();
  mockWebAcls.mockReturnValue({ data: { webAcls: [], total: 0 }, isLoading: false });
  mockIPSets.mockReturnValue({ data: { ipSets: [], total: 0 }, isLoading: false });
  mockRegexSets.mockReturnValue({ data: { regexPatternSets: [], total: 0 }, isLoading: false });
  mockRuleGroups.mockReturnValue({ data: { ruleGroups: [], total: 0 }, isLoading: false });
});

describe("WafV2Dashboard", () => {
  it("renders all section headers", () => {
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/WAF v2 Web ACLs/i)).toBeTruthy();
    expect(screen.getByText("IP Sets")).toBeTruthy();
    expect(screen.getByText("Regex Pattern Sets")).toBeTruthy();
    expect(screen.getByText("Rule Groups")).toBeTruthy();
  });

  it("shows empty messages for all sections", () => {
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No web ACLs found/i)).toBeTruthy();
    expect(screen.getByText(/No IP sets found/i)).toBeTruthy();
    expect(screen.getByText(/No regex pattern sets found/i)).toBeTruthy();
    expect(screen.getByText(/No rule groups found/i)).toBeTruthy();
  });

  it("renders web ACLs with data", () => {
    mockWebAcls.mockReturnValue({
      data: { webAcls: [{ Name: "my-acl", Id: "acl-1", Description: "My ACL", ARN: "arn:aws:wafv2:..." }], total: 1 },
      isLoading: false,
    });
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-acl")).toBeTruthy();
  });

  it("renders IP sets with data", () => {
    mockIPSets.mockReturnValue({
      data: { ipSets: [{ Name: "my-ipset", Id: "ip-1", Description: "My IP set" }], total: 1 },
      isLoading: false,
    });
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-ipset")).toBeTruthy();
  });

  it("renders regex pattern sets with data", () => {
    mockRegexSets.mockReturnValue({
      data: { regexPatternSets: [{ Name: "my-regex", Id: "re-1", Description: "My regex" }], total: 1 },
      isLoading: false,
    });
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-regex")).toBeTruthy();
  });

  it("renders rule groups with data", () => {
    mockRuleGroups.mockReturnValue({
      data: { ruleGroups: [{ Name: "my-rule", Id: "rule-1", Description: "My rule group" }], total: 1 },
      isLoading: false,
    });
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-rule")).toBeTruthy();
  });

  it("opens create Web ACL modal and submits", async () => {
    const user = userEvent.setup();
    const { container } = render(<WafV2Dashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create/i);
    await waitFor(() => expect(container.textContent).toContain("Create Web ACL"));

    const nameInput = screen.getByPlaceholderText("my-web-acl");
    await user.type(nameInput, "new-acl");

    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtns[createBtns.length - 1]);

    await waitFor(() => {
      expect(mockCreateWebAcl).toHaveBeenCalled();
    });
  });

  it("cancels create Web ACL modal", async () => {
    const user = userEvent.setup();
    const { container } = render(<WafV2Dashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(container.textContent).toContain("Create Web ACL"));
    await clickButton(user, /Cancel/i);
    expect(mockCreateWebAcl).not.toHaveBeenCalled();
  });

  it("deletes a web ACL", async () => {
    mockWebAcls.mockReturnValue({
      data: { webAcls: [{ Name: "delete-me", Id: "acl-1" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("delete-me")).toBeTruthy());

    const deleteBtn = screen.getByRole("button", { name: /Delete delete-me/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => {
      expect(mockDeleteWebAcl).toHaveBeenCalledWith(
        expect.objectContaining({ Id: "acl-1", Name: "delete-me" }),
      );
    });
  });

  it("filters web ACLs by name", async () => {
    mockWebAcls.mockReturnValue({
      data: {
        webAcls: [
          { Name: "alpha-acl", Id: "id1" },
          { Name: "beta-acl", Id: "id2" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("alpha-acl")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find web ACLs by name");
    await user.type(filterInput, "beta");
    await waitFor(() => expect(screen.queryByText("alpha-acl")).toBeNull());
  });
});
