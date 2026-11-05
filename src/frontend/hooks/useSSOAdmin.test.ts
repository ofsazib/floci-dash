// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createWrapper } from "../../test/helpers";

const mockApi = vi.hoisted(() => vi.fn());
const invalidate = vi.hoisted(() => vi.fn());
vi.mock("../lib/client", () => ({ api: (...args: any[]) => mockApi(...args) }));
vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual: any = await importOriginal();
  return { ...actual, useQueryClient: () => ({ invalidateQueries: invalidate }) };
});

import {
  useSSOInstances,
  usePermissionSets,
  usePermissionSetDetail,
  useCreatePermissionSet,
  useUpdatePermissionSet,
  useDeletePermissionSet,
  useManagedPolicies,
  useAttachManagedPolicy,
  useDetachManagedPolicy,
  useCustomerManagedPolicyReferences,
  useAttachCustomerManagedPolicy,
  useDetachCustomerManagedPolicy,
  useInlinePolicy,
  usePutInlinePolicy,
  useDeleteInlinePolicy,
  usePermissionsBoundary,
  usePutPermissionsBoundary,
  useDeletePermissionsBoundary,
  useSsoTags,
  useAddSsoTags,
  useRemoveSsoTags,
  useAccountAssignments,
  useCreateAccountAssignment,
  useDeleteAccountAssignment,
  useAssignmentCreationStatuses,
  useAssignmentDeletionStatuses,
  usePermissionSetProvisioningStatuses,
  useProvisionPermissionSet,
  useAccountsForProvisionedPermissionSet,
  useTrustedTokenIssuers,
  useTrustedTokenIssuerDetail,
  useCreateTrustedTokenIssuer,
  useUpdateTrustedTokenIssuer,
  useDeleteTrustedTokenIssuer,
  useAccessControlAttributeConfiguration,
  useCreateAccessControlConfig,
  useUpdateAccessControlConfig,
  useDeleteAccessControlConfig,
  useSsoRegions,
  useAddSsoRegion,
  useRemoveSsoRegion,
} from "./useSSOAdmin";

const INSTANCE = "arn:aws:sso:::instance/ssoins-1";
const INSTANCE_ENC = encodeURIComponent(INSTANCE);
const PS = "arn:aws:sso:::permissionSet/ssoins-1/ps-1";
const PS_ENC = encodeURIComponent(PS);
const TTI = "arn:aws:sso::123456789012:trustedTokenIssuer/ins/tti-1";
const TTI_ENC = encodeURIComponent(TTI);

beforeEach(() => {
  mockApi.mockReset();
  invalidate.mockReset();
});

// ── Queries ──────────────────────────────────────────────

describe("SSO Admin query hooks", () => {
  it("useSSOInstances calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ instances: [], total: 0 });
    const { result } = renderHook(() => useSSOInstances(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ssoadmin/instances");
  });

  it("usePermissionSets calls encoded URL", async () => {
    mockApi.mockResolvedValueOnce({ permissionSets: [], total: 0 });
    const { result } = renderHook(() => usePermissionSets(INSTANCE), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(`/aws/ssoadmin/permission-sets?instanceArn=${INSTANCE_ENC}`);
  });

  it("usePermissionSets is disabled when instanceArn is null", () => {
    const { result } = renderHook(() => usePermissionSets(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("usePermissionSetDetail calls encoded URL", async () => {
    mockApi.mockResolvedValueOnce({ permissionSet: null });
    const { result } = renderHook(() => usePermissionSetDetail(INSTANCE, PS), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/ssoadmin/permission-sets/detail?instanceArn=${INSTANCE_ENC}&permissionSetArn=${PS_ENC}`
    );
  });

  it("usePermissionSetDetail is disabled when a param is null", () => {
    const { result } = renderHook(() => usePermissionSetDetail(INSTANCE, null), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("useManagedPolicies calls encoded URL", async () => {
    mockApi.mockResolvedValueOnce({ policies: [], total: 0 });
    const { result } = renderHook(() => useManagedPolicies(INSTANCE, PS), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/ssoadmin/managed-policies?instanceArn=${INSTANCE_ENC}&permissionSetArn=${PS_ENC}`
    );
  });

  it("useManagedPolicies is disabled when permissionSetArn is null", () => {
    const { result } = renderHook(() => useManagedPolicies(INSTANCE, null), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("useCustomerManagedPolicyReferences calls encoded URL", async () => {
    mockApi.mockResolvedValueOnce({ references: [], total: 0 });
    const { result } = renderHook(() => useCustomerManagedPolicyReferences(INSTANCE, PS), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/ssoadmin/customer-managed-policies?instanceArn=${INSTANCE_ENC}&permissionSetArn=${PS_ENC}`
    );
  });

  it("useCustomerManagedPolicyReferences is disabled when a param is null", () => {
    const { result } = renderHook(() => useCustomerManagedPolicyReferences(null, PS), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("useInlinePolicy calls encoded URL", async () => {
    mockApi.mockResolvedValueOnce({ inlinePolicy: "{}" });
    const { result } = renderHook(() => useInlinePolicy(INSTANCE, PS), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/ssoadmin/inline-policy?instanceArn=${INSTANCE_ENC}&permissionSetArn=${PS_ENC}`
    );
  });

  it("useInlinePolicy is disabled when permissionSetArn is null", () => {
    const { result } = renderHook(() => useInlinePolicy(INSTANCE, null), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("usePermissionsBoundary calls encoded URL", async () => {
    mockApi.mockResolvedValueOnce({ permissionsBoundary: null });
    const { result } = renderHook(() => usePermissionsBoundary(INSTANCE, PS), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/ssoadmin/permissions-boundary?instanceArn=${INSTANCE_ENC}&permissionSetArn=${PS_ENC}`
    );
  });

  it("usePermissionsBoundary is disabled when a param is null", () => {
    const { result } = renderHook(() => usePermissionsBoundary(null, PS), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("useSsoTags calls encoded URL", async () => {
    mockApi.mockResolvedValueOnce({ tags: [], total: 0 });
    const { result } = renderHook(() => useSsoTags(PS), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(`/aws/ssoadmin/tags?resourceArn=${PS_ENC}`);
  });

  it("useSsoTags is disabled when resourceArn is null", () => {
    const { result } = renderHook(() => useSsoTags(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("useAccountAssignments calls encoded URL", async () => {
    mockApi.mockResolvedValueOnce({ assignments: [], total: 0 });
    const { result } = renderHook(() => useAccountAssignments(INSTANCE, "111122223333", PS), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/ssoadmin/account-assignments?instanceArn=${INSTANCE_ENC}&accountId=111122223333&permissionSetArn=${PS_ENC}`
    );
  });

  it("useAccountAssignments is disabled when any param is null", () => {
    const { result } = renderHook(() => useAccountAssignments(INSTANCE, null, PS), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("useAssignmentCreationStatuses calls encoded URL", async () => {
    mockApi.mockResolvedValueOnce({ statuses: [], total: 0 });
    const { result } = renderHook(() => useAssignmentCreationStatuses(INSTANCE), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/ssoadmin/assignment-creation-status?instanceArn=${INSTANCE_ENC}`
    );
  });

  it("useAssignmentCreationStatuses is disabled when instanceArn is null", () => {
    const { result } = renderHook(() => useAssignmentCreationStatuses(null), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("useAssignmentDeletionStatuses calls encoded URL", async () => {
    mockApi.mockResolvedValueOnce({ statuses: [], total: 0 });
    const { result } = renderHook(() => useAssignmentDeletionStatuses(INSTANCE), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/ssoadmin/assignment-deletion-status?instanceArn=${INSTANCE_ENC}`
    );
  });

  it("useAssignmentDeletionStatuses is disabled when instanceArn is null", () => {
    const { result } = renderHook(() => useAssignmentDeletionStatuses(null), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("usePermissionSetProvisioningStatuses calls encoded URL", async () => {
    mockApi.mockResolvedValueOnce({ statuses: [], total: 0 });
    const { result } = renderHook(() => usePermissionSetProvisioningStatuses(INSTANCE), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/ssoadmin/permission-set-provisioning-status?instanceArn=${INSTANCE_ENC}`
    );
  });

  it("usePermissionSetProvisioningStatuses is disabled when instanceArn is null", () => {
    const { result } = renderHook(() => usePermissionSetProvisioningStatuses(null), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("useAccountsForProvisionedPermissionSet calls encoded URL", async () => {
    mockApi.mockResolvedValueOnce({ accountIds: [], total: 0 });
    const { result } = renderHook(() => useAccountsForProvisionedPermissionSet(INSTANCE, PS), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/ssoadmin/accounts-for-provisioned-permission-set?instanceArn=${INSTANCE_ENC}&permissionSetArn=${PS_ENC}`
    );
  });

  it("useAccountsForProvisionedPermissionSet is disabled when a param is null", () => {
    const { result } = renderHook(() => useAccountsForProvisionedPermissionSet(INSTANCE, null), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("useTrustedTokenIssuers calls encoded URL", async () => {
    mockApi.mockResolvedValueOnce({ trustedTokenIssuers: [], total: 0 });
    const { result } = renderHook(() => useTrustedTokenIssuers(INSTANCE), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/ssoadmin/trusted-token-issuers?instanceArn=${INSTANCE_ENC}`
    );
  });

  it("useTrustedTokenIssuers is disabled when instanceArn is null", () => {
    const { result } = renderHook(() => useTrustedTokenIssuers(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("useTrustedTokenIssuerDetail calls encoded URL", async () => {
    mockApi.mockResolvedValueOnce({ trustedTokenIssuer: null });
    const { result } = renderHook(() => useTrustedTokenIssuerDetail(TTI), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/ssoadmin/trusted-token-issuers/detail?trustedTokenIssuerArn=${TTI_ENC}`
    );
  });

  it("useTrustedTokenIssuerDetail is disabled when arn is null", () => {
    const { result } = renderHook(() => useTrustedTokenIssuerDetail(null), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("useAccessControlAttributeConfiguration calls encoded URL", async () => {
    mockApi.mockResolvedValueOnce({ configuration: null });
    const { result } = renderHook(() => useAccessControlAttributeConfiguration(INSTANCE), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/ssoadmin/access-control-attribute-configuration?instanceArn=${INSTANCE_ENC}`
    );
  });

  it("useAccessControlAttributeConfiguration is disabled when instanceArn is null", () => {
    const { result } = renderHook(() => useAccessControlAttributeConfiguration(null), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("useSsoRegions calls encoded URL", async () => {
    mockApi.mockResolvedValueOnce({ regions: [], total: 0 });
    const { result } = renderHook(() => useSsoRegions(INSTANCE), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(`/aws/ssoadmin/regions?instanceArn=${INSTANCE_ENC}`);
  });

  it("useSsoRegions is disabled when instanceArn is null", () => {
    const { result } = renderHook(() => useSsoRegions(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
    expect(mockApi).not.toHaveBeenCalled();
  });
});

// ── Mutations ────────────────────────────────────────────

describe("SSO Admin mutation hooks", () => {
  it("useCreatePermissionSet posts and invalidates", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreatePermissionSet(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ instanceArn: INSTANCE, name: "admins" });
    expect(mockApi).toHaveBeenCalledWith("/aws/ssoadmin/permission-sets", {
      method: "POST",
      body: JSON.stringify({ instanceArn: INSTANCE, name: "admins" }),
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["aws", "ssoadmin"] });
  });

  it("useUpdatePermissionSet puts and invalidates", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useUpdatePermissionSet(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      instanceArn: INSTANCE,
      permissionSetArn: PS,
      description: "d",
    });
    expect(mockApi).toHaveBeenCalledWith("/aws/ssoadmin/permission-sets", {
      method: "PUT",
      body: JSON.stringify({ instanceArn: INSTANCE, permissionSetArn: PS, description: "d" }),
    });
    expect(invalidate).toHaveBeenCalled();
  });

  it("useDeletePermissionSet deletes with encoded query", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeletePermissionSet(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ instanceArn: INSTANCE, permissionSetArn: PS });
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/ssoadmin/permission-sets?instanceArn=${INSTANCE_ENC}&permissionSetArn=${PS_ENC}`,
      { method: "DELETE" }
    );
    expect(invalidate).toHaveBeenCalled();
  });

  it("useAttachManagedPolicy posts", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useAttachManagedPolicy(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      instanceArn: INSTANCE,
      permissionSetArn: PS,
      managedPolicyArn: "arn:aws:iam::aws:policy/ReadOnlyAccess",
    });
    expect(mockApi).toHaveBeenCalledWith("/aws/ssoadmin/managed-policies", {
      method: "POST",
      body: JSON.stringify({
        instanceArn: INSTANCE,
        permissionSetArn: PS,
        managedPolicyArn: "arn:aws:iam::aws:policy/ReadOnlyAccess",
      }),
    });
    expect(invalidate).toHaveBeenCalled();
  });

  it("useDetachManagedPolicy deletes with encoded query", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDetachManagedPolicy(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      instanceArn: INSTANCE,
      permissionSetArn: PS,
      managedPolicyArn: "arn:p",
    });
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/ssoadmin/managed-policies?instanceArn=${INSTANCE_ENC}&permissionSetArn=${PS_ENC}&managedPolicyArn=arn%3Ap`,
      { method: "DELETE" }
    );
    expect(invalidate).toHaveBeenCalled();
  });

  it("useAttachCustomerManagedPolicy posts with name and path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useAttachCustomerManagedPolicy(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({
      instanceArn: INSTANCE,
      permissionSetArn: PS,
      name: "cust",
      path: "/team/",
    });
    expect(mockApi).toHaveBeenCalledWith("/aws/ssoadmin/customer-managed-policies", {
      method: "POST",
      body: JSON.stringify({ instanceArn: INSTANCE, permissionSetArn: PS, name: "cust", path: "/team/" }),
    });
    expect(invalidate).toHaveBeenCalled();
  });

  it("useDetachCustomerManagedPolicy deletes with path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDetachCustomerManagedPolicy(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({
      instanceArn: INSTANCE,
      permissionSetArn: PS,
      name: "cust",
      path: "/team/",
    });
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/ssoadmin/customer-managed-policies?instanceArn=${INSTANCE_ENC}&permissionSetArn=${PS_ENC}&name=cust&path=%2Fteam%2F`,
      { method: "DELETE" }
    );
    expect(invalidate).toHaveBeenCalled();
  });

  it("useDetachCustomerManagedPolicy deletes without path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDetachCustomerManagedPolicy(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({ instanceArn: INSTANCE, permissionSetArn: PS, name: "cust" });
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/ssoadmin/customer-managed-policies?instanceArn=${INSTANCE_ENC}&permissionSetArn=${PS_ENC}&name=cust`,
      { method: "DELETE" }
    );
    expect(invalidate).toHaveBeenCalled();
  });

  it("usePutInlinePolicy puts", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => usePutInlinePolicy(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ instanceArn: INSTANCE, permissionSetArn: PS, inlinePolicy: "{}" });
    expect(mockApi).toHaveBeenCalledWith("/aws/ssoadmin/inline-policy", {
      method: "PUT",
      body: JSON.stringify({ instanceArn: INSTANCE, permissionSetArn: PS, inlinePolicy: "{}" }),
    });
    expect(invalidate).toHaveBeenCalled();
  });

  it("useDeleteInlinePolicy deletes", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteInlinePolicy(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ instanceArn: INSTANCE, permissionSetArn: PS });
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/ssoadmin/inline-policy?instanceArn=${INSTANCE_ENC}&permissionSetArn=${PS_ENC}`,
      { method: "DELETE" }
    );
    expect(invalidate).toHaveBeenCalled();
  });

  it("usePutPermissionsBoundary puts managed policy arn", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => usePutPermissionsBoundary(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      instanceArn: INSTANCE,
      permissionSetArn: PS,
      managedPolicyArn: "arn:p",
    });
    expect(mockApi).toHaveBeenCalledWith("/aws/ssoadmin/permissions-boundary", {
      method: "PUT",
      body: JSON.stringify({ instanceArn: INSTANCE, permissionSetArn: PS, managedPolicyArn: "arn:p" }),
    });
    expect(invalidate).toHaveBeenCalled();
  });

  it("useDeletePermissionsBoundary deletes", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeletePermissionsBoundary(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ instanceArn: INSTANCE, permissionSetArn: PS });
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/ssoadmin/permissions-boundary?instanceArn=${INSTANCE_ENC}&permissionSetArn=${PS_ENC}`,
      { method: "DELETE" }
    );
    expect(invalidate).toHaveBeenCalled();
  });

  it("useAddSsoTags posts and invalidates the tag key", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useAddSsoTags(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ resourceArn: PS, tags: { env: "dev" } });
    expect(mockApi).toHaveBeenCalledWith("/aws/ssoadmin/tags", {
      method: "POST",
      body: JSON.stringify({ resourceArn: PS, tags: { env: "dev" } }),
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["aws", "ssoadmin", "tags", PS] });
  });

  it("useRemoveSsoTags posts untag and invalidates the tag key", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useRemoveSsoTags(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ resourceArn: PS, tagKeys: ["env"] });
    expect(mockApi).toHaveBeenCalledWith("/aws/ssoadmin/tags/untag", {
      method: "POST",
      body: JSON.stringify({ resourceArn: PS, tagKeys: ["env"] }),
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["aws", "ssoadmin", "tags", PS] });
  });

  it("useCreateAccountAssignment posts", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateAccountAssignment(), { wrapper: createWrapper() });
    const params = {
      instanceArn: INSTANCE,
      targetId: "111122223333",
      permissionSetArn: PS,
      principalId: "uuid",
      principalType: "USER",
    };
    await result.current.mutateAsync(params);
    expect(mockApi).toHaveBeenCalledWith("/aws/ssoadmin/account-assignments", {
      method: "POST",
      body: JSON.stringify(params),
    });
    expect(invalidate).toHaveBeenCalled();
  });

  it("useDeleteAccountAssignment deletes with encoded query", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteAccountAssignment(), { wrapper: createWrapper() });
    const params = {
      instanceArn: INSTANCE,
      targetId: "111122223333",
      permissionSetArn: PS,
      principalId: "uuid",
      principalType: "USER",
    };
    await result.current.mutateAsync(params);
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/ssoadmin/account-assignments?instanceArn=${INSTANCE_ENC}&targetId=111122223333&permissionSetArn=${PS_ENC}&principalId=uuid&principalType=USER`,
      { method: "DELETE" }
    );
    expect(invalidate).toHaveBeenCalled();
  });

  it("useProvisionPermissionSet posts to one account", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useProvisionPermissionSet(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      instanceArn: INSTANCE,
      permissionSetArn: PS,
      targetType: "AWS_ACCOUNT",
      targetId: "111122223333",
    });
    expect(mockApi).toHaveBeenCalledWith("/aws/ssoadmin/provision-permission-set", {
      method: "POST",
      body: JSON.stringify({
        instanceArn: INSTANCE,
        permissionSetArn: PS,
        targetType: "AWS_ACCOUNT",
        targetId: "111122223333",
      }),
    });
    expect(invalidate).toHaveBeenCalled();
  });

  it("useProvisionPermissionSet posts without targetId", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useProvisionPermissionSet(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      instanceArn: INSTANCE,
      permissionSetArn: PS,
      targetType: "ALL_PROVISIONED_ACCOUNTS",
    });
    expect(mockApi).toHaveBeenCalledWith("/aws/ssoadmin/provision-permission-set", {
      method: "POST",
      body: JSON.stringify({
        instanceArn: INSTANCE,
        permissionSetArn: PS,
        targetType: "ALL_PROVISIONED_ACCOUNTS",
      }),
    });
    expect(invalidate).toHaveBeenCalled();
  });

  it("useCreateTrustedTokenIssuer posts", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateTrustedTokenIssuer(), { wrapper: createWrapper() });
    const params = {
      instanceArn: INSTANCE,
      name: "okta",
      issuerUrl: "https://okta.example.com",
      claimAttributePath: "sub",
      identityStoreAttributePath: "userName",
    };
    await result.current.mutateAsync(params);
    expect(mockApi).toHaveBeenCalledWith("/aws/ssoadmin/trusted-token-issuers", {
      method: "POST",
      body: JSON.stringify(params),
    });
    expect(invalidate).toHaveBeenCalled();
  });

  it("useUpdateTrustedTokenIssuer puts", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useUpdateTrustedTokenIssuer(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ trustedTokenIssuerArn: TTI, name: "okta-2" });
    expect(mockApi).toHaveBeenCalledWith("/aws/ssoadmin/trusted-token-issuers", {
      method: "PUT",
      body: JSON.stringify({ trustedTokenIssuerArn: TTI, name: "okta-2" }),
    });
    expect(invalidate).toHaveBeenCalled();
  });

  it("useDeleteTrustedTokenIssuer deletes", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteTrustedTokenIssuer(), { wrapper: createWrapper() });
    await result.current.mutateAsync(TTI);
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/ssoadmin/trusted-token-issuers?trustedTokenIssuerArn=${TTI_ENC}`,
      { method: "DELETE" }
    );
    expect(invalidate).toHaveBeenCalled();
  });

  it("useCreateAccessControlConfig posts", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateAccessControlConfig(), { wrapper: createWrapper() });
    const params = { instanceArn: INSTANCE, attributes: [{ key: "k", source: "$.k" }] };
    await result.current.mutateAsync(params);
    expect(mockApi).toHaveBeenCalledWith("/aws/ssoadmin/access-control-attribute-configuration", {
      method: "POST",
      body: JSON.stringify(params),
    });
    expect(invalidate).toHaveBeenCalled();
  });

  it("useUpdateAccessControlConfig puts", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useUpdateAccessControlConfig(), { wrapper: createWrapper() });
    const params = { instanceArn: INSTANCE, attributes: [{ key: "k", source: "$.k" }] };
    await result.current.mutateAsync(params);
    expect(mockApi).toHaveBeenCalledWith("/aws/ssoadmin/access-control-attribute-configuration", {
      method: "PUT",
      body: JSON.stringify(params),
    });
    expect(invalidate).toHaveBeenCalled();
  });

  it("useDeleteAccessControlConfig deletes", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteAccessControlConfig(), { wrapper: createWrapper() });
    await result.current.mutateAsync(INSTANCE);
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/ssoadmin/access-control-attribute-configuration?instanceArn=${INSTANCE_ENC}`,
      { method: "DELETE" }
    );
    expect(invalidate).toHaveBeenCalled();
  });

  it("useAddSsoRegion posts", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useAddSsoRegion(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ instanceArn: INSTANCE, regionName: "eu-west-1" });
    expect(mockApi).toHaveBeenCalledWith("/aws/ssoadmin/regions", {
      method: "POST",
      body: JSON.stringify({ instanceArn: INSTANCE, regionName: "eu-west-1" }),
    });
    expect(invalidate).toHaveBeenCalled();
  });

  it("useRemoveSsoRegion deletes with encoded query", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useRemoveSsoRegion(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ instanceArn: INSTANCE, regionName: "eu-west-1" });
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/ssoadmin/regions?instanceArn=${INSTANCE_ENC}&regionName=eu-west-1`,
      { method: "DELETE" }
    );
    expect(invalidate).toHaveBeenCalled();
  });
});
