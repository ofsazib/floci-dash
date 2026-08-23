// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../test/helpers";
import React from "react";
import { MemoryRouter } from "react-router-dom";

const mockKeys = vi.fn();
const mockKeyDetail = vi.fn();
const mockCreateKey = vi.fn();
const mockScheduleKeyDeletion = vi.fn();
const mockCancelKeyDeletion = vi.fn();
const mockToggleKey = vi.fn();
const mockToggleRotation = vi.fn();
const mockUpdateKeyDescription = vi.fn();
const mockAliases = vi.fn();
const mockCreateAlias = vi.fn();
const mockDeleteAlias = vi.fn();
const mockEncrypt = vi.fn();
const mockDecrypt = vi.fn();
const mockKeyPolicy = vi.fn();
const mockPutKeyPolicy = vi.fn();
const mockSign = vi.fn();
const mockVerify = vi.fn();
const mockRotateOnDemand = vi.fn();
let mockEncryptMutateAsync = vi.fn().mockResolvedValue({ ciphertextBlob: "ZW5jcnlwdGVk" });
let mockDecryptMutateAsync = vi.fn().mockResolvedValue({ plaintext: "cGxhaW50ZXh0" });

const mockNavigate = vi.hoisted(() => vi.fn());

const healthState = vi.hoisted(() => ({
  data: undefined as any,
  isLoading: false,
}));

vi.mock("../hooks/useSystem", () => ({
  useHealth: () => ({ get data() { return healthState.data; }, isLoading: false }),
}));

vi.mock("../hooks/useKMS", () => ({
  useKMSKeys: (...args: any[]) => mockKeys(...args),
  useKMSKey: (...args: any[]) => mockKeyDetail(...args),
  useCreateKey: () => ({ mutate: mockCreateKey, mutateAsync: mockCreateKey, isPending: false, isError: false, error: null }),
  useScheduleKeyDeletion: () => ({ mutate: mockScheduleKeyDeletion, isPending: false }),
  useCancelKeyDeletion: () => ({ mutate: mockCancelKeyDeletion, isPending: false }),
  useToggleKey: () => ({ mutate: mockToggleKey, isPending: false }),
  useToggleRotation: () => ({ mutate: mockToggleRotation, isPending: false }),
  useUpdateKeyDescription: () => ({ mutate: mockUpdateKeyDescription, isPending: false }),
  useKMSAliases: (...args: any[]) => mockAliases(...args),
  useCreateAlias: () => ({ mutate: mockCreateAlias, isPending: false }),
  useDeleteAlias: () => ({ mutateAsync: mockDeleteAlias, isPending: false }),
  useEncrypt: () => ({ mutate: mockEncrypt, mutateAsync: mockEncryptMutateAsync, isPending: false, data: null }),
  useDecrypt: () => ({ mutate: mockDecrypt, mutateAsync: mockDecryptMutateAsync, isPending: false, data: null }),
  useKeyPolicy: (...args: any[]) => mockKeyPolicy(...args),
  usePutKeyPolicy: () => ({ mutate: mockPutKeyPolicy, isPending: false }),
  useSign: () => ({ mutate: mockSign, isPending: false }),
  useVerify: () => ({ mutate: mockVerify, isPending: false }),
  useRotateKeyOnDemand: () => ({ mutate: mockRotateOnDemand, isPending: false }),
}));

let mockShowToast = vi.fn();

vi.mock("../components/Toast", () => ({
  useToast: () => ({ showToast: mockShowToast }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("react-router-dom", async () => {
  const actual = await import("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  };
});

import KMSPage from "./KMSPage";

function pageWrapper() {
  const Wrapper = createWrapper();
  return ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter>
      <Wrapper>{children}</Wrapper>
    </MemoryRouter>
  );
}

describe("KMSPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockKeyPolicy.mockReturnValue({ data: undefined });
    mockEncryptMutateAsync = vi.fn().mockResolvedValue({ ciphertextBlob: "ZW5jcnlwdGVk" });
    mockDecryptMutateAsync = vi.fn().mockResolvedValue({ plaintext: "cGxhaW50ZXh0" });
    mockShowToast = vi.fn();
    healthState.data = undefined;
    mockKeys.mockReturnValue({
      data: { keys: [{ keyId: "1234-abcd", arn: "arn:aws:kms:us-east-1::key/1234-abcd", keyManager: "CUSTOMER", keyState: "Enabled", description: "My key", keySpec: "SYMMETRIC_DEFAULT" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockKeyDetail.mockReturnValue({
      data: { key: { keyId: "1234-abcd", keyState: "Enabled" }, tags: {}, aliases: [], grants: [], rotationEnabled: false },
      isLoading: false, isError: false, error: null,
      refetch: vi.fn(),
    });
    mockAliases.mockReturnValue({
      data: { aliases: [{ name: "alias/my-key", targetKeyId: "1234-abcd" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
  });

  it("renders key list", () => {
    render(<KMSPage />, { wrapper: pageWrapper() });
    expect(screen.getAllByText("KMS").length).toBeGreaterThan(0);
    expect(screen.getAllByText("1234-abcd").length).toBeGreaterThan(0);
  });

  it("renders empty key list when no data", () => {
    mockKeys.mockReturnValue({ data: { keys: [], total: 0 }, isLoading: false, isError: false, error: null });
    render(<KMSPage />, { wrapper: pageWrapper() });
    expect(screen.getByRole("heading", { name: /KMS Keys/i, level: 2 })).toBeTruthy();
  });

  it("shows create key button", () => {
    render(<KMSPage />, { wrapper: pageWrapper() });
    expect(screen.getByRole("button", { name: /Create key/i })).toBeTruthy();
  });

  it("shows loading state", () => {
    mockKeys.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    render(<KMSPage />, { wrapper: pageWrapper() });
    expect(screen.getByRole("heading", { name: /KMS Keys/i, level: 2 })).toBeTruthy();
  });

  it("renders without crashing in error state", () => {
    mockKeys.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("Failed to load keys") });
    render(<KMSPage />, { wrapper: pageWrapper() });
    expect(screen.getByRole("heading", { name: /KMS Keys/i, level: 2 })).toBeTruthy();
  });

  it("opens key detail modal when View is clicked", async () => {
    const user = userEvent.setup();
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getAllByText(/KMS Key:/i).length).toBeGreaterThan(0);
    });
  });

  it("renders aliases tab with alias data", async () => {
    const user = userEvent.setup();
    render(<KMSPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Aliases/i }));
    await waitFor(() => {
      expect(screen.getAllByText("alias/my-key").length).toBeGreaterThan(0);
    });
  });

  it("opens create key modal when Create key is clicked", async () => {
    const user = userEvent.setup();
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /Create key/i);
    await waitFor(() => {
      expect(screen.getAllByPlaceholderText("My encryption key").length).toBeGreaterThan(0);
    });
  });

  it("renders state fallbacks and dash placeholders in key table", () => {
    mockKeys.mockReturnValue({
      data: {
        keys: [
          // no keyState/enabled/keyManager/description/usage/spec/deletion -> "Disabled" + dashes
          { keyId: "k1" },
          // no keyState but enabled flag -> "Enabled"
          { keyId: "k2", enabled: true, keyManager: "CUSTOMER" },
          // explicit Disabled state -> grey badge branch
          { keyId: "k3", keyState: "Disabled", keyManager: "CUSTOMER" },
          // with deletion date -> formatted date in the Deletion column
          { keyId: "k4", keyState: "Enabled", keyManager: "CUSTOMER", deletionDate: "2025-06-15" },
        ],
        total: 4,
      },
      isLoading: false, isError: false, error: null,
    });
    render(<KMSPage />, { wrapper: pageWrapper() });
    expect(screen.getAllByText("Disabled").length).toBeGreaterThanOrEqual(1);
    // "Enabled" appears for the k2 fallback badge and k4's explicit state
    expect(screen.getAllByText("Enabled").length).toBeGreaterThanOrEqual(2);
    // k1 and k2 render dashes for description/usage/spec/deletion; k1's manager falls back to CUSTOMER
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(6);
    expect(screen.getByText("6/15/2025")).toBeTruthy();
  });

  it("creates a key with description, usage, and spec", async () => {
    const user = userEvent.setup();
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /Create key/i);
    await waitFor(() => expect(screen.getByPlaceholderText("My encryption key")).toBeTruthy());

    await user.type(screen.getByPlaceholderText("My encryption key"), "My new key");
    // Key usage -> SIGN_VERIFY
    await user.click(screen.getByRole("button", { name: /Encrypt and decrypt/i }));
    await user.click(screen.getByRole("option", { name: /Sign and verify/i }));
    // Key spec -> RSA_2048
    await user.click(screen.getByRole("button", { name: /SYMMETRIC_DEFAULT/i }));
    await user.click(screen.getByRole("option", { name: /RSA_2048/i }));

    await clickButton(user, /^Create$/);
    await waitFor(() => {
      expect(mockCreateKey).toHaveBeenCalledWith({
        description: "My new key",
        keyUsage: "SIGN_VERIFY",
        keySpec: "RSA_2048",
      });
      expect(mockShowToast).toHaveBeenCalledWith("success", "Key created");
      expect(screen.queryByPlaceholderText("My encryption key")).toBeNull();
    });
  });

  it("shows error toast when create key fails", async () => {
    mockCreateKey.mockRejectedValueOnce(new Error("key creation failed"));
    const user = userEvent.setup();
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /Create key/i);
    await waitFor(() => expect(screen.getByPlaceholderText("My encryption key")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("My encryption key"), "fail-key");
    await clickButton(user, /^Create$/);
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "key creation failed"));
  });

  it("cancels the create key modal", async () => {
    const user = userEvent.setup();
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /Create key/i);
    await waitFor(() => expect(screen.getByPlaceholderText("My encryption key")).toBeTruthy());
    await clickButton(user, /Cancel/i);
    await waitFor(() => expect(screen.queryByPlaceholderText("My encryption key")).toBeNull());
    expect(mockCreateKey).not.toHaveBeenCalled();
  });

  it("shows enable action button for a disabled key in detail modal", async () => {
    const user = userEvent.setup();
    mockKeyDetail.mockReturnValue({
      data: { key: { keyId: "1234-abcd", keyState: "Disabled", description: "My key" }, tags: {}, aliases: [], grants: [], rotationEnabled: false },
      isLoading: false, isError: false, error: null,
    });
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /Enable/i }).length).toBeGreaterThan(0);
    });
  });

  it("shows Schedule deletion button in detail modal", async () => {
    const user = userEvent.setup();
    mockKeyDetail.mockReturnValue({
      data: { key: { keyId: "1234-abcd", keyState: "Enabled", description: "My key" }, tags: {}, aliases: [], grants: [], rotationEnabled: false },
      isLoading: false, isError: false, error: null,
    });
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Schedule deletion/i })).toBeTruthy();
    });
  });

  it("shows Cancel deletion button for PendingDeletion key", async () => {
    const user = userEvent.setup();
    mockKeyDetail.mockReturnValue({
      data: { key: { keyId: "1234-abcd", keyState: "PendingDeletion", description: "My key" }, tags: {}, aliases: [], grants: [], rotationEnabled: false },
      isLoading: false, isError: false, error: null,
    });
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Cancel deletion/i })).toBeTruthy();
    });
  });

  it("shows rotation toggle button for enabled key", async () => {
    const user = userEvent.setup();
    mockKeyDetail.mockReturnValue({
      data: { key: { keyId: "1234-abcd", keyState: "Enabled", description: "My key" }, tags: {}, aliases: [], grants: [], rotationEnabled: false },
      isLoading: false, isError: false, error: null,
    });
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Enable rotation/i })).toBeTruthy();
    });
  });

  it("shows Disable rotation button for key with rotation enabled", async () => {
    const user = userEvent.setup();
    mockKeyDetail.mockReturnValue({
      data: { key: { keyId: "1234-abcd", keyState: "Enabled", description: "My key" }, tags: {}, aliases: [], grants: [], rotationEnabled: true },
      isLoading: false, isError: false, error: null,
    });
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Disable rotation/i })).toBeTruthy();
    });
  });

  it("shows Edit description button in detail modal", async () => {
    const user = userEvent.setup();
    mockKeyDetail.mockReturnValue({
      data: { key: { keyId: "1234-abcd", keyState: "Enabled", description: "My key" }, tags: {}, aliases: [], grants: [], rotationEnabled: false },
      isLoading: false, isError: false, error: null,
    });
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Edit description/i })).toBeTruthy();
    });
  });

  it("edits the key description and saves", async () => {
    mockUpdateKeyDescription.mockImplementation((_body: any, opts: any) => opts?.onSuccess?.());
    mockKeyDetail.mockReturnValue({
      data: { key: { keyId: "1234-abcd", keyState: "Enabled", description: "My key" }, tags: {}, aliases: [], grants: [], rotationEnabled: false },
      isLoading: false, isError: false, error: null,
      refetch: vi.fn(),
    });
    const user = userEvent.setup();
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByText(/KMS Key:/i)).toBeTruthy());

    await user.click(screen.getByRole("button", { name: /Edit description/i }));
    const input = screen.getAllByRole("textbox")[0];
    await user.clear(input);
    await user.type(input, "Updated description");
    await user.click(screen.getByRole("button", { name: /^Save$/i }));

    await waitFor(() => {
      expect(mockUpdateKeyDescription).toHaveBeenCalledWith(
        { id: "1234-abcd", description: "Updated description" },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
      expect(mockShowToast).toHaveBeenCalledWith("success", "Description updated");
      // Edit mode closes
      expect(screen.queryByRole("textbox")).toBeNull();
    });
  });

  it("cancels editing the key description", async () => {
    const user = userEvent.setup();
    mockKeyDetail.mockReturnValue({
      data: { key: { keyId: "1234-abcd", keyState: "Enabled", description: "My key" }, tags: {}, aliases: [], grants: [], rotationEnabled: false },
      isLoading: false, isError: false, error: null,
    });
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByText(/KMS Key:/i)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Edit description/i }));
    await waitFor(() => expect(screen.getAllByRole("textbox").length).toBeGreaterThan(0));
    await user.click(screen.getByRole("button", { name: /Cancel/i }));
    await waitFor(() => expect(screen.queryByRole("textbox")).toBeNull());
    expect(mockUpdateKeyDescription).not.toHaveBeenCalled();
  });

  it("enables rotation", async () => {
    mockToggleRotation.mockImplementation((_body: any, opts: any) => opts?.onSuccess?.());
    const user = userEvent.setup();
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("button", { name: /Enable rotation/i })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Enable rotation/i }));
    await waitFor(() => {
      expect(mockToggleRotation).toHaveBeenCalledWith(
        { id: "1234-abcd", enable: true },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
      expect(mockShowToast).toHaveBeenCalledWith("success", "Rotation enabled");
    });
  });

  it("disables rotation", async () => {
    mockToggleRotation.mockImplementation((_body: any, opts: any) => opts?.onSuccess?.());
    mockKeyDetail.mockReturnValue({
      data: { key: { keyId: "1234-abcd", keyState: "Enabled", description: "My key" }, tags: {}, aliases: [], grants: [], rotationEnabled: true },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("button", { name: /Disable rotation/i })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Disable rotation/i }));
    await waitFor(() => {
      expect(mockToggleRotation).toHaveBeenCalledWith(
        { id: "1234-abcd", enable: false },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
      expect(mockShowToast).toHaveBeenCalledWith("success", "Rotation disabled");
    });
  });

  it("disables an enabled key", async () => {
    mockToggleKey.mockImplementation((_body: any, opts: any) => opts?.onSuccess?.());
    const user = userEvent.setup();
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("button", { name: /^Disable$/i })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Disable$/i }));
    await waitFor(() => {
      expect(mockToggleKey).toHaveBeenCalledWith(
        { id: "1234-abcd", enable: false },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
      expect(mockShowToast).toHaveBeenCalledWith("success", "Key disabled");
    });
  });

  it("enables a disabled key", async () => {
    mockToggleKey.mockImplementation((_body: any, opts: any) => opts?.onSuccess?.());
    mockKeyDetail.mockReturnValue({
      data: { key: { keyId: "1234-abcd", keyState: "Disabled", description: "My key" }, tags: {}, aliases: [], grants: [], rotationEnabled: false },
      isLoading: false, isError: false, error: null,
      refetch: vi.fn(),
    });
    const user = userEvent.setup();
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("button", { name: /^Enable$/i })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Enable$/i }));
    await waitFor(() => {
      expect(mockToggleKey).toHaveBeenCalledWith(
        { id: "1234-abcd", enable: true },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
      expect(mockShowToast).toHaveBeenCalledWith("success", "Key enabled");
    });
  });

  it("schedules key deletion", async () => {
    mockScheduleKeyDeletion.mockImplementation((_body: any, opts: any) => opts?.onSuccess?.());
    const user = userEvent.setup();
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("button", { name: /Schedule deletion/i })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Schedule deletion/i }));
    await waitFor(() => {
      expect(mockScheduleKeyDeletion).toHaveBeenCalledWith(
        { id: "1234-abcd" },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
      expect(mockShowToast).toHaveBeenCalledWith("success", "Deletion scheduled");
    });
  });

  it("cancels key deletion", async () => {
    mockCancelKeyDeletion.mockImplementation((_body: any, opts: any) => opts?.onSuccess?.());
    mockKeyDetail.mockReturnValue({
      data: { key: { keyId: "1234-abcd", keyState: "PendingDeletion", description: "My key" }, tags: {}, aliases: [], grants: [], rotationEnabled: false },
      isLoading: false, isError: false, error: null,
      refetch: vi.fn(),
    });
    const user = userEvent.setup();
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("button", { name: /Cancel deletion/i })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Cancel deletion/i }));
    await waitFor(() => {
      expect(mockCancelKeyDeletion).toHaveBeenCalledWith(
        "1234-abcd",
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
      expect(mockShowToast).toHaveBeenCalledWith("success", "Deletion cancelled");
    });
  });

  it("closes the key detail modal", async () => {
    const user = userEvent.setup();
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByText(/KMS Key:/i)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Close/i }));
    await waitFor(() => expect(screen.queryByText(/KMS Key:/i)).toBeNull());
  });

  it("edits a key with no description (empty fallback)", async () => {
    mockUpdateKeyDescription.mockImplementation((_body: any, opts: any) => opts?.onSuccess?.());
    mockKeyDetail.mockReturnValue({
      data: { key: { keyId: "1234-abcd", keyState: "Enabled", description: "" }, tags: {}, aliases: [], grants: [], rotationEnabled: false },
      isLoading: false, isError: false, error: null,
      refetch: vi.fn(),
    });
    const user = userEvent.setup();
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByText(/KMS Key:/i)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Edit description/i }));
    const input = screen.getAllByRole("textbox")[0];
    // Pre-filled with the empty description fallback
    expect((input as HTMLInputElement).value).toBe("");
    await user.type(input, "New desc");
    await user.click(screen.getByRole("button", { name: /^Save$/i }));
    await waitFor(() => {
      expect(mockUpdateKeyDescription).toHaveBeenCalledWith(
        { id: "1234-abcd", description: "New desc" },
        expect.anything(),
      );
    });
  });

  it("shows error toast when updating description fails", async () => {
    mockUpdateKeyDescription.mockImplementation((_body: any, opts: any) => opts?.onError?.(new Error("desc failed")));
    mockKeyDetail.mockReturnValue({
      data: { key: { keyId: "1234-abcd", keyState: "Enabled", description: "My key" }, tags: {}, aliases: [], grants: [], rotationEnabled: false },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByText(/KMS Key:/i)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Edit description/i }));
    const input = screen.getAllByRole("textbox")[0];
    await user.type(input, "changed");
    await user.click(screen.getByRole("button", { name: /^Save$/i }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "desc failed"));
  });

  it("shows error toast when enabling rotation fails", async () => {
    mockToggleRotation.mockImplementation((_body: any, opts: any) => opts?.onError?.(new Error("rotation failed")));
    const user = userEvent.setup();
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("button", { name: /Enable rotation/i })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Enable rotation/i }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "rotation failed"));
  });

  it("shows error toast when disabling rotation fails", async () => {
    mockToggleRotation.mockImplementation((_body: any, opts: any) => opts?.onError?.(new Error("rotation failed")));
    mockKeyDetail.mockReturnValue({
      data: { key: { keyId: "1234-abcd", keyState: "Enabled", description: "My key" }, tags: {}, aliases: [], grants: [], rotationEnabled: true },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("button", { name: /Disable rotation/i })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Disable rotation/i }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "rotation failed"));
  });

  it("shows error toast when disabling a key fails", async () => {
    mockToggleKey.mockImplementation((_body: any, opts: any) => opts?.onError?.(new Error("toggle failed")));
    const user = userEvent.setup();
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("button", { name: /^Disable$/i })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Disable$/i }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "toggle failed"));
  });

  it("shows error toast when enabling a key fails", async () => {
    mockToggleKey.mockImplementation((_body: any, opts: any) => opts?.onError?.(new Error("toggle failed")));
    mockKeyDetail.mockReturnValue({
      data: { key: { keyId: "1234-abcd", keyState: "Disabled", description: "My key" }, tags: {}, aliases: [], grants: [], rotationEnabled: false },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("button", { name: /^Enable$/i })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Enable$/i }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "toggle failed"));
  });

  it("shows error toast when scheduling deletion fails", async () => {
    mockScheduleKeyDeletion.mockImplementation((_body: any, opts: any) => opts?.onError?.(new Error("schedule failed")));
    const user = userEvent.setup();
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("button", { name: /Schedule deletion/i })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Schedule deletion/i }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "schedule failed"));
  });

  it("shows error toast when cancelling deletion fails", async () => {
    mockCancelKeyDeletion.mockImplementation((_body: any, opts: any) => opts?.onError?.(new Error("cancel failed")));
    mockKeyDetail.mockReturnValue({
      data: { key: { keyId: "1234-abcd", keyState: "PendingDeletion", description: "My key" }, tags: {}, aliases: [], grants: [], rotationEnabled: false },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("button", { name: /Cancel deletion/i })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Cancel deletion/i }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "cancel failed"));
  });

  it("shows Aliases, Grants, and Encrypt/Decrypt tabs in detail modal", async () => {
    const user = userEvent.setup();
    mockKeyDetail.mockReturnValue({
      data: { key: { keyId: "1234-abcd", keyState: "Enabled", description: "My key" }, tags: {}, aliases: [{ name: "alias/my-key", arn: "arn:aws:kms:alias/my-key", creationDate: "2025-01-01" }], grants: [{ grantId: "grant-1", name: "test-grant", granteePrincipal: "user", operations: ["Encrypt"], creationDate: "2025-01-01" }], rotationEnabled: false },
      isLoading: false, isError: false, error: null,
    });
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByText(/KMS Key:/i)).toBeTruthy();
    });
    // Scope queries to within the detail modal to avoid finding page-level tabs
    const dialog = screen.getByRole("dialog");
    const getInModal = within(dialog);
    expect(getInModal.getByRole("tab", { name: /Aliases/i })).toBeTruthy();
    expect(getInModal.getByRole("tab", { name: /Grants/i })).toBeTruthy();
    expect(getInModal.getByRole("tab", { name: /Encrypt \/ Decrypt/i })).toBeTruthy();
  });

  it("shows tags in the key detail modal", async () => {
    const user = userEvent.setup();
    mockKeyDetail.mockReturnValue({
      data: { key: { keyId: "1234-abcd", keyState: "Enabled", description: "My key" }, tags: { env: "prod", team: "core" }, aliases: [], grants: [], rotationEnabled: false },
      isLoading: false, isError: false, error: null,
    });
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByText(/env/)).toBeTruthy();
      expect(screen.getByText(/prod/)).toBeTruthy();
      expect(screen.getByText(/team/)).toBeTruthy();
      expect(screen.getByText(/core/)).toBeTruthy();
    });
  });

  it("shows 'No aliases' for empty aliases tab", async () => {
    const user = userEvent.setup();
    mockKeyDetail.mockReturnValue({
      data: { key: { keyId: "1234-abcd", keyState: "Enabled", description: "My key" }, tags: {}, aliases: [], grants: [], rotationEnabled: false },
      isLoading: false, isError: false, error: null,
    });
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByText(/KMS Key:/i)).toBeTruthy();
    });
    // Scope to within the detail modal to find the right Aliases tab
    const dialog = screen.getByRole("dialog");
    const getInModal = within(dialog);
    await user.click(getInModal.getByRole("tab", { name: /Aliases/i }));
    await waitFor(() => {
      expect(getInModal.getByText("No aliases")).toBeTruthy();
    });
  });

  it("shows 'No grants' for empty grants tab", async () => {
    const user = userEvent.setup();
    mockKeyDetail.mockReturnValue({
      data: { key: { keyId: "1234-abcd", keyState: "Enabled", description: "My key" }, tags: {}, aliases: [], grants: [], rotationEnabled: false },
      isLoading: false, isError: false, error: null,
    });
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByText(/KMS Key:/i)).toBeTruthy();
    });
    await user.click(screen.getByRole("tab", { name: /Grants/i }));
    await waitFor(() => {
      expect(screen.getByText("No grants")).toBeTruthy();
    });
  });

  it("shows Encrypt/Decrypt tab and encrypt button", async () => {
    const user = userEvent.setup();
    mockKeyDetail.mockReturnValue({
      data: { key: { keyId: "1234-abcd", keyState: "Enabled", description: "My key" }, tags: {}, aliases: [], grants: [], rotationEnabled: false },
      isLoading: false, isError: false, error: null,
    });
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByText(/KMS Key:/i)).toBeTruthy();
    });
    await user.click(screen.getByRole("tab", { name: /Encrypt \/ Decrypt/i }));
    await waitFor(() => {
      const encryptBtn = screen.getByRole("button", { name: /Encrypt/i });
      expect(encryptBtn).toBeTruthy();
    });
    expect(screen.getByPlaceholderText("SGVsbG8gV29ybGQ=")).toBeTruthy();
  });

  it("shows aliases tab with alias list and create alias button", async () => {
    const user = userEvent.setup();
    mockAliases.mockReturnValue({
      data: { aliases: [{ name: "alias/my-key", targetKeyId: "1234-abcd" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    render(<KMSPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Aliases/i }));
    await waitFor(() => {
      expect(screen.getByText("alias/my-key")).toBeTruthy();
    });
    expect(screen.getByRole("button", { name: /Create alias/i })).toBeTruthy();
  });

  it("opens create alias modal", async () => {
    const user = userEvent.setup();
    mockAliases.mockReturnValue({
      data: { aliases: [], total: 0 },
      isLoading: false, isError: false, error: null,
    });
    render(<KMSPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Aliases/i }));
    await waitFor(() => {
      expect(screen.getByText("No aliases")).toBeTruthy();
    });
    await user.click(screen.getByRole("button", { name: /Create alias/i }));
    await waitFor(() => {
      // Both the button and modal header say "Create alias" — use getAllByText
      expect(screen.getAllByText("Create alias").length).toBeGreaterThan(0);
    });
  });

  it("shows PendingDeletion badge in key table", () => {
    mockKeys.mockReturnValue({
      data: { keys: [{ keyId: "1234-abcd", keyManager: "CUSTOMER", keyState: "PendingDeletion", description: "My key", keySpec: "SYMMETRIC_DEFAULT" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    render(<KMSPage />, { wrapper: pageWrapper() });
    expect(screen.getByText("PendingDeletion")).toBeTruthy();
  });

  it("shows AWS-managed badge in key table", () => {
    mockKeys.mockReturnValue({
      data: { keys: [{ keyId: "aws-mdk", keyManager: "AWS", keyState: "Enabled", description: "AWS managed", keySpec: "SYMMETRIC_DEFAULT" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    render(<KMSPage />, { wrapper: pageWrapper() });
    expect(screen.getByText("AWS")).toBeTruthy();
  });

  it("shows loading state in key detail modal", async () => {
    const user = userEvent.setup();
    mockKeyDetail.mockReturnValue({
      data: undefined,
      isLoading: true, isError: false, error: null,
    });
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByText("Loading...")).toBeTruthy();
    });
  });

  it("shows key not found when key is null", async () => {
    const user = userEvent.setup();
    mockKeyDetail.mockReturnValue({
      data: { key: null as any },
      isLoading: false, isError: false, error: null,
    });
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByText("Key not found")).toBeTruthy();
    });
  });

  it("shows key detail with creation and deletion dates", async () => {
    const user = userEvent.setup();
    mockKeyDetail.mockReturnValue({
      data: {
        key: { keyId: "1234-abcd", arn: "arn:aws:kms:key/1234-abcd", keyState: "Enabled", keyUsage: "ENCRYPT_DECRYPT", keySpec: "SYMMETRIC_DEFAULT", origin: "AWS_KMS", keyManager: "AWS", creationDate: "2025-01-15T10:00:00Z", deletionDate: "2026-01-15T10:00:00Z", multiRegion: true, description: "With dates" },
        tags: {},
        aliases: [],
        grants: [],
        rotationEnabled: false,
      },
      isLoading: false, isError: false, error: null,
    });
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByText(/KMS Key:/i)).toBeTruthy();
    });
    expect(screen.getByText(/Deletion date/i)).toBeTruthy();
    // AWS manager badge + multi-region Yes
    expect(screen.getAllByText("AWS").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Yes")).toBeTruthy();
  });

  it("shows description placeholder when no description", async () => {
    const user = userEvent.setup();
    mockKeyDetail.mockReturnValue({
      data: { key: { keyId: "1234-abcd", keyState: "Enabled", description: "", keyUsage: "ENCRYPT_DECRYPT" }, tags: {}, aliases: [], grants: [], rotationEnabled: false },
      isLoading: false, isError: false, error: null,
    });
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByText(/KMS Key:/i)).toBeTruthy();
    });
    // "No description" is rendered as a span with class fd-text-muted
    expect(screen.getByText(/No description/i)).toBeTruthy();
  });

  it("shows rotation enabled badge in overview", async () => {
    const user = userEvent.setup();
    mockKeyDetail.mockReturnValue({
      data: { key: { keyId: "1234-abcd", keyState: "Enabled", description: "My key" }, tags: {}, aliases: [], grants: [], rotationEnabled: true },
      isLoading: false, isError: false, error: null,
    });
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByText(/KMS Key:/i)).toBeTruthy();
    });
    expect(screen.getAllByText(/Rotation/i).length).toBeGreaterThan(0);
  });

  it("shows grey state badge for non-Enabled key in overview", async () => {
    const user = userEvent.setup();
    mockKeyDetail.mockReturnValue({
      data: { key: { keyId: "1234-abcd", keyState: "Disabled", description: "My key" }, tags: {}, aliases: [], grants: [], rotationEnabled: false },
      isLoading: false, isError: false, error: null,
    });
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByText(/KMS Key:/i)).toBeTruthy();
    });
    // The overview shows State badge — it exists and is not the "key not found" path
    expect(screen.getByText("Disabled")).toBeTruthy();
  });

  it("encrypt button is disabled when key is not Enabled", async () => {
    const user = userEvent.setup();
    mockKeyDetail.mockReturnValue({
      data: { key: { keyId: "1234-abcd", keyState: "Disabled", description: "My key" }, tags: {}, aliases: [], grants: [], rotationEnabled: false },
      isLoading: false, isError: false, error: null,
    });
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByText(/KMS Key:/i)).toBeTruthy();
    });
    await user.click(screen.getByRole("tab", { name: /Encrypt \/ Decrypt/i }));
    await waitFor(() => {
      const encryptBtn = screen.getByRole("button", { name: /Encrypt$/i });
      expect((encryptBtn as HTMLButtonElement).disabled).toBe(true);
    });
  });

  it("encrypt success shows ciphertext result in detail modal", async () => {
    const user = userEvent.setup();
    mockKeyDetail.mockReturnValue({
      data: { key: { keyId: "1234-abcd", keyState: "Enabled", description: "My key" }, tags: {}, aliases: [], grants: [], rotationEnabled: false },
      isLoading: false, isError: false, error: null,
    });
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByText(/KMS Key:/i)).toBeTruthy();
    });
    await user.click(screen.getByRole("tab", { name: /Encrypt \/ Decrypt/i }));
    await waitFor(() => {
      expect(screen.getByPlaceholderText("SGVsbG8gV29ybGQ=")).toBeTruthy();
    });
    // Type plaintext and encrypt
    const textarea = screen.getByPlaceholderText("SGVsbG8gV29ybGQ=");
    await user.type(textarea, "SGVsbG8=");
    await user.click(screen.getByRole("button", { name: /^Encrypt$/i }));
    const dialog = screen.getByRole("dialog");
    const getInModal = within(dialog);
    await waitFor(() => {
      expect(getInModal.getAllByText(/Ciphertext/i).length).toBeGreaterThan(0);
      expect(getInModal.getAllByText("ZW5jcnlwdGVk").length).toBeGreaterThan(0);
    });
  });

  it("decrypt success shows plaintext result in detail modal", async () => {
    const user = userEvent.setup();
    mockKeyDetail.mockReturnValue({
      data: { key: { keyId: "1234-abcd", keyState: "Enabled", description: "My key" }, tags: {}, aliases: [], grants: [], rotationEnabled: false },
      isLoading: false, isError: false, error: null,
    });
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByText(/KMS Key:/i)).toBeTruthy();
    });
    await user.click(screen.getByRole("tab", { name: /Encrypt \/ Decrypt/i }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Decrypt$/i })).toBeTruthy();
    });
    // Type ciphertext and decrypt
    const decryptTextarea = screen.getAllByRole("textbox")[1];
    await user.type(decryptTextarea, "ZW5jcnlwdGVk");
    await user.click(screen.getByRole("button", { name: /^Decrypt$/i }));
    const dialog = screen.getByRole("dialog");
    const getInModal = within(dialog);
    await waitFor(() => {
      expect(getInModal.getAllByText(/Plaintext/i).length).toBeGreaterThan(0);
      expect(getInModal.getByText("cGxhaW50ZXh0")).toBeTruthy();
    });
  });

  it("shows error toast when encrypt fails", async () => {
    mockEncryptMutateAsync.mockRejectedValueOnce(new Error("encrypt failed"));
    mockKeyDetail.mockReturnValue({
      data: { key: { keyId: "1234-abcd", keyState: "Enabled", description: "My key" }, tags: {}, aliases: [], grants: [], rotationEnabled: false },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByText(/KMS Key:/i)).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /Encrypt \/ Decrypt/i }));
    await waitFor(() => expect(screen.getByPlaceholderText("SGVsbG8gV29ybGQ=")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("SGVsbG8gV29ybGQ="), "SGVsbG8=");
    await user.click(screen.getByRole("button", { name: /^Encrypt$/i }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "encrypt failed"));
  });

  it("shows error toast when decrypt fails", async () => {
    mockDecryptMutateAsync.mockRejectedValueOnce(new Error("decrypt failed"));
    mockKeyDetail.mockReturnValue({
      data: { key: { keyId: "1234-abcd", keyState: "Enabled", description: "My key" }, tags: {}, aliases: [], grants: [], rotationEnabled: false },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByText(/KMS Key:/i)).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /Encrypt \/ Decrypt/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: /Decrypt$/i })).toBeTruthy());
    await user.type(screen.getAllByRole("textbox")[1], "ZW5jcnlwdGVk");
    await user.click(screen.getByRole("button", { name: /^Decrypt$/i }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "decrypt failed"));
  });

  it("renders aliases and grants tables with data in the detail modal", async () => {
    mockKeyDetail.mockReturnValue({
      data: {
        key: { keyId: "1234-abcd", keyState: "Enabled", description: "My key" },
        tags: {},
        aliases: [
          { name: "alias/a", arn: "arn:aws:kms:alias/a", creationDate: "2025-01-01" },
          { name: "alias/b" },
        ],
        grants: [
          { grantId: "g1", name: "gr", granteePrincipal: "user", operations: ["Encrypt"], creationDate: "2025-01-01" },
          // sparse grant -> dash name, no operations badges, dash created
          { grantId: "g2", granteePrincipal: "user2" },
        ],
        rotationEnabled: false,
      },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByText(/KMS Key:/i)).toBeTruthy());
    const dialog = screen.getByRole("dialog");
    const getInModal = within(dialog);

    await user.click(getInModal.getByRole("tab", { name: /Aliases/i }));
    await waitFor(() => {
      expect(getInModal.getByText("alias/a")).toBeTruthy();
      expect(getInModal.getByText("arn:aws:kms:alias/a")).toBeTruthy();
      expect(getInModal.getByText("alias/b")).toBeTruthy();
      // alias/b has no creationDate -> dash
      expect(getInModal.getAllByText("-").length).toBeGreaterThanOrEqual(1);
    });

    await user.click(getInModal.getByRole("tab", { name: /Grants/i }));
    await waitFor(() => {
      expect(getInModal.getByText("g1")).toBeTruthy();
      expect(getInModal.getByText("gr")).toBeTruthy();
      expect(getInModal.getByText("user")).toBeTruthy();
      expect(getInModal.getByText("Encrypt")).toBeTruthy();
      // sparse grant renders dash name + dash created
      expect(getInModal.getByText("g2")).toBeTruthy();
      expect(getInModal.getByText("user2")).toBeTruthy();
      expect(getInModal.getAllByText("-").length).toBeGreaterThanOrEqual(2);
    });
  });

  it("renders aliases when data lacks the array", async () => {
    mockAliases.mockReturnValue({ data: {}, isLoading: false, isError: false, error: null });
    const user = userEvent.setup();
    render(<KMSPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Aliases/i }));
    await waitFor(() => expect(screen.getByText("No aliases")).toBeTruthy());
  });

  it("renders alias creation date when present", async () => {
    mockAliases.mockReturnValue({
      data: { aliases: [{ name: "alias/x", targetKeyId: "k1", creationDate: "2025-06-15" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<KMSPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Aliases/i }));
    await waitFor(() => {
      expect(screen.getByText("alias/x")).toBeTruthy();
      expect(screen.getByText("6/15/2025")).toBeTruthy();
    });
  });

  it("deletes an alias", async () => {
    mockDeleteAlias.mockResolvedValue(undefined);
    mockAliases.mockReturnValue({
      data: { aliases: [{ name: "alias/my-key", targetKeyId: "1234-abcd" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<KMSPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Aliases/i }));
    await waitFor(() => expect(screen.getByText("alias/my-key")).toBeTruthy());

    await clickButton(user, /Delete alias\/my-key/i);
    await waitFor(() => expect(screen.getByText(/Are you sure/i)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => {
      expect(mockDeleteAlias).toHaveBeenCalledWith("alias/my-key");
      expect(mockShowToast).toHaveBeenCalledWith("success", "Alias alias/my-key deleted");
    });
  });

  it("shows error toast when deleting an alias fails", async () => {
    mockDeleteAlias.mockRejectedValueOnce(new Error("delete failed"));
    mockAliases.mockReturnValue({
      data: { aliases: [{ name: "alias/my-key", targetKeyId: "1234-abcd" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<KMSPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Aliases/i }));
    await waitFor(() => expect(screen.getByText("alias/my-key")).toBeTruthy());
    await clickButton(user, /Delete alias\/my-key/i);
    await waitFor(() => expect(screen.getByText(/Are you sure/i)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "delete failed"));
  });

  it("creates an alias", async () => {
    mockCreateAlias.mockImplementation((_body: any, opts: any) => opts?.onSuccess?.());
    mockAliases.mockReturnValue({
      data: { aliases: [], total: 0 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<KMSPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Aliases/i }));
    await waitFor(() => expect(screen.getByText("No aliases")).toBeTruthy());

    await user.click(screen.getByRole("button", { name: /Create alias/i }));
    await waitFor(() => expect(screen.getByPlaceholderText("my-key")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("my-key"), "alias/foo");
    await user.type(screen.getByPlaceholderText("1234abcd-..."), "k1");
    await clickButton(user, /^Create$/);

    await waitFor(() => {
      expect(mockCreateAlias).toHaveBeenCalledWith(
        { aliasName: "alias/foo", targetKeyId: "k1" },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
      expect(mockShowToast).toHaveBeenCalledWith("success", "Alias created");
      expect(screen.queryByPlaceholderText("my-key")).toBeNull();
    });
  });

  it("shows error toast when creating an alias fails", async () => {
    mockCreateAlias.mockImplementation((_body: any, opts: any) => opts?.onError?.(new Error("alias failed")));
    mockAliases.mockReturnValue({
      data: { aliases: [], total: 0 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<KMSPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Aliases/i }));
    await waitFor(() => expect(screen.getByText("No aliases")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Create alias/i }));
    await waitFor(() => expect(screen.getByPlaceholderText("my-key")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("my-key"), "alias/foo");
    await user.type(screen.getByPlaceholderText("1234abcd-..."), "k1");
    await clickButton(user, /^Create$/);
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "alias failed"));
  });

  it("navigates when the breadcrumb is clicked", async () => {
    const user = userEvent.setup();
    render(<KMSPage />, { wrapper: pageWrapper() });
    await user.click(screen.getAllByText("Dashboard")[0]);
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/"));
  });

  it("shows Running status badge when kms is running", () => {
    healthState.data = { services: { kms: "running" } };
    render(<KMSPage />, { wrapper: pageWrapper() });
    expect(screen.getByText("Running")).toBeTruthy();
  });

  it("shows Available status badge when kms is available", () => {
    healthState.data = { services: { kms: "available" } };
    render(<KMSPage />, { wrapper: pageWrapper() });
    expect(screen.getByText("Available")).toBeTruthy();
  });
});

describe("KMSPage — sign/verify and policy tabs", () => {
  async function openTab(tabName: string) {
    mockKeyDetail.mockReturnValue({
      data: { key: { keyId: "1234-abcd", keyState: "Enabled", description: "My key" }, tags: {}, aliases: [], grants: [], rotationEnabled: false },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await user.click(await screen.findByText(tabName));
    return user;
  }

  it("signs a message and shows the signature", async () => {
    mockSign.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.({ signature: "c2ln" }));
    const user = await openTab("Sign / Verify");
    const areas = await screen.findAllByRole("textbox");
    fireEvent.change(areas[0], { target: { value: "hello" } });
    await user.click(screen.getByRole("button", { name: /^Sign$/ }));
    expect(await screen.findByText("c2ln")).toBeTruthy();
  });

  it("shows an error toast when signing fails", async () => {
    mockSign.mockImplementation((_b: any, opts: any) => opts?.onError?.(new Error("sign failed")));
    const user = await openTab("Sign / Verify");
    const areas = await screen.findAllByRole("textbox");
    fireEvent.change(areas[0], { target: { value: "hello" } });
    await user.click(screen.getByRole("button", { name: /^Sign$/ }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "sign failed"));
  });

  it("verifies a signature and shows valid", async () => {
    mockSign.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.({ signature: "c2ln" }));
    mockVerify.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.({ signatureValid: true }));
    const user = await openTab("Sign / Verify");
    const areas = await screen.findAllByRole("textbox");
    fireEvent.change(areas[0], { target: { value: "hello" } });
    fireEvent.change(areas[1], { target: { value: "c2ln" } });
    await user.click(screen.getByRole("button", { name: "Verify" }));
    expect(await screen.findByText("Signature is valid.")).toBeTruthy();
  });

  it("shows invalid verification result", async () => {
    mockVerify.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.({ signatureValid: false }));
    const user = await openTab("Sign / Verify");
    const areas = await screen.findAllByRole("textbox");
    fireEvent.change(areas[0], { target: { value: "hello" } });
    fireEvent.change(areas[1], { target: { value: "c2ln" } });
    await user.click(screen.getByRole("button", { name: "Verify" }));
    expect(await screen.findByText("Signature is NOT valid.")).toBeTruthy();
  });

  it("shows the key policy", async () => {
    mockKeyPolicy.mockReturnValue({ data: { policy: '{"Version":"2012-10-17"}' } });
    await openTab("Key policy");
    expect(await screen.findByText(/"Version":"2012-10-17"/)).toBeTruthy();
  });

  it("shows the no-policy message", async () => {
    mockKeyPolicy.mockReturnValue({ data: { policy: null } });
    await openTab("Key policy");
    expect(await screen.findByText("No policy returned.")).toBeTruthy();
  });

  it("saves an edited key policy", async () => {
    mockPutKeyPolicy.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
    const user = await openTab("Key policy");
    const areas = await screen.findAllByRole("textbox");
    fireEvent.change(areas[0], { target: { value: "{}" } });
    await user.click(screen.getByRole("button", { name: /Save policy/i }));
    await waitFor(() =>
      expect(mockPutKeyPolicy).toHaveBeenCalledWith(
        { keyId: "1234-abcd", policy: "{}" },
        expect.objectContaining({ onSuccess: expect.any(Function) })
      )
    );
  });

  it("keeps Save policy disabled without text", async () => {
    await openTab("Key policy");
    expect((await screen.findByRole("button", { name: /Save policy/i })).hasAttribute("disabled")).toBe(true);
  });

  it("shows an error toast when verify fails", async () => {
    mockVerify.mockImplementation((_b: any, opts: any) => opts?.onError?.(new Error("verify failed")));
    const user = await openTab("Sign / Verify");
    const areas = await screen.findAllByRole("textbox");
    fireEvent.change(areas[0], { target: { value: "hello" } });
    fireEvent.change(areas[1], { target: { value: "c2ln" } });
    await user.click(screen.getByRole("button", { name: "Verify" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "verify failed"));
  });

  it("shows an error toast when saving the policy fails", async () => {
    mockPutKeyPolicy.mockImplementation((_b: any, opts: any) => opts?.onError?.(new Error("policy failed")));
    const user = await openTab("Key policy");
    const areas = await screen.findAllByRole("textbox");
    fireEvent.change(areas[0], { target: { value: "{}" } });
    await user.click(screen.getByRole("button", { name: /Save policy/i }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "policy failed"));
  });

  it("shows an error toast when on-demand rotation fails", async () => {
    mockRotateOnDemand.mockImplementation((_b: any, opts: any) => opts?.onError?.(new Error("rotation failed")));
    const user = await openTab("Key policy");
    await user.click(screen.getByRole("button", { name: /Rotate on demand/i }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "rotation failed"));
  });

  it("keeps an empty signature displayable when sign returns none", async () => {
    mockSign.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.({}));
    const user = await openTab("Sign / Verify");
    const areas = await screen.findAllByRole("textbox");
    fireEvent.change(areas[0], { target: { value: "hello" } });
    await user.click(screen.getByRole("button", { name: /^Sign$/ }));
    await waitFor(() => expect(mockSign).toHaveBeenCalled());
  });

  it("shows fallback error messages when failures carry no message", async () => {
    mockSign.mockImplementation((_b: any, opts: any) => opts?.onError?.(new Error("")));
    const user = await openTab("Sign / Verify");
    const areas = await screen.findAllByRole("textbox");
    fireEvent.change(areas[0], { target: { value: "hello" } });
    await user.click(screen.getByRole("button", { name: /^Sign$/ }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Sign failed"));

    mockVerify.mockImplementation((_b: any, opts: any) => opts?.onError?.(new Error("")));
    fireEvent.change(areas[1], { target: { value: "c2ln" } });
    await user.click(screen.getByRole("button", { name: "Verify" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Verify failed"));
  });

  it("shows fallback policy and rotation error messages", async () => {
    mockPutKeyPolicy.mockImplementation((_b: any, opts: any) => opts?.onError?.(new Error("")));
    const user = await openTab("Key policy");
    const areas = await screen.findAllByRole("textbox");
    fireEvent.change(areas[0], { target: { value: "{}" } });
    await user.click(screen.getByRole("button", { name: /Save policy/i }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to save policy"));

    mockRotateOnDemand.mockImplementation((_b: any, opts: any) => opts?.onError?.(new Error("")));
    await user.click(screen.getByRole("button", { name: /Rotate on demand/i }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Rotation failed"));
  });

  it("rotates the key on demand", async () => {
    mockRotateOnDemand.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
    const user = await openTab("Key policy");
    await user.click(screen.getByRole("button", { name: /Rotate on demand/i }));
    await waitFor(() => expect(mockRotateOnDemand).toHaveBeenCalledWith("1234-abcd", expect.anything()));
  });
});
