// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../test/helpers";
import React from "react";

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
  useDeleteAlias: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useEncrypt: () => ({ mutate: mockEncrypt, mutateAsync: vi.fn(), isPending: false, data: null }),
  useDecrypt: () => ({ mutate: mockDecrypt, mutateAsync: vi.fn(), isPending: false, data: null }),
}));

vi.mock("../components/Toast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));

import KMSPage from "./KMSPage";

describe("KMSPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockKeys.mockReturnValue({
      data: { keys: [{ keyId: "1234-abcd", arn: "arn:aws:kms:us-east-1::key/1234-abcd", keyManager: "CUSTOMER", keyState: "Enabled", description: "My key", keySpec: "SYMMETRIC_DEFAULT" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockKeyDetail.mockReturnValue({
      data: { key: { keyId: "1234-abcd", keyState: "Enabled" }, tags: {}, aliases: [], grants: [], rotationEnabled: false },
      isLoading: false, isError: false, error: null,
    });
    mockAliases.mockReturnValue({
      data: { aliases: [{ name: "alias/my-key", targetKeyId: "1234-abcd" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
  });

  it("renders key list", () => {
    render(<KMSPage />, { wrapper: createWrapper() });
    expect(screen.getAllByText("KMS").length).toBeGreaterThan(0);
    expect(screen.getAllByText("1234-abcd").length).toBeGreaterThan(0);
  });

  it("renders empty key list when no data", () => {
    mockKeys.mockReturnValue({ data: { keys: [], total: 0 }, isLoading: false, isError: false, error: null });
    render(<KMSPage />, { wrapper: createWrapper() });
    expect(screen.getByRole("heading", { name: /KMS Keys/i, level: 2 })).toBeTruthy();
  });

  it("shows create key button", () => {
    render(<KMSPage />, { wrapper: createWrapper() });
    expect(screen.getByRole("button", { name: /Create key/i })).toBeTruthy();
  });

  it("shows loading state", () => {
    mockKeys.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    render(<KMSPage />, { wrapper: createWrapper() });
    expect(screen.getByRole("heading", { name: /KMS Keys/i, level: 2 })).toBeTruthy();
  });

  it("renders without crashing in error state", () => {
    mockKeys.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("Failed to load keys") });
    render(<KMSPage />, { wrapper: createWrapper() });
    expect(screen.getByRole("heading", { name: /KMS Keys/i, level: 2 })).toBeTruthy();
  });

  it("opens key detail modal when View is clicked", async () => {
    const user = userEvent.setup();
    render(<KMSPage />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getAllByText(/KMS Key:/i).length).toBeGreaterThan(0);
    });
  });

  it("renders aliases tab with alias data", async () => {
    const user = userEvent.setup();
    render(<KMSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Aliases/i }));
    await waitFor(() => {
      expect(screen.getAllByText("alias/my-key").length).toBeGreaterThan(0);
    });
  });

  it("opens create key modal when Create key is clicked", async () => {
    const user = userEvent.setup();
    render(<KMSPage />, { wrapper: createWrapper() });
    await clickButton(user, /Create key/i);
    await waitFor(() => {
      expect(screen.getAllByPlaceholderText("My encryption key").length).toBeGreaterThan(0);
    });
  });

  it("shows enable action button for a disabled key in detail modal", async () => {
    const user = userEvent.setup();
    mockKeyDetail.mockReturnValue({
      data: { key: { keyId: "1234-abcd", keyState: "Disabled", description: "My key" }, tags: {}, aliases: [], grants: [], rotationEnabled: false },
      isLoading: false, isError: false, error: null,
    });
    render(<KMSPage />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /Enable/i }).length).toBeGreaterThan(0);
    });
  });
});
