// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createWrapper } from "../../test/helpers";
import React from "react";

const mockSecrets = vi.fn();
const mockSecret = vi.fn();
const mockSecretValue = vi.fn();
const mockCreateSecret = vi.fn();
const mockDeleteSecret = vi.fn();
const mockRestoreSecret = vi.fn();
const mockPutSecretValue = vi.fn();
const mockRandomPassword = vi.fn();

vi.mock("../hooks/useSecrets", () => ({
  useSecrets: (...args: any[]) => mockSecrets(...args),
  useSecret: (...args: any[]) => mockSecret(...args),
  useSecretValue: (...args: any[]) => mockSecretValue(...args),
  useCreateSecret: () => ({ mutate: mockCreateSecret, isPending: false, isError: false, error: null }),
  useDeleteSecret: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRestoreSecret: () => ({ mutate: mockRestoreSecret, isPending: false }),
  usePutSecretValue: () => ({ mutate: mockPutSecretValue, isPending: false }),
  useRandomPassword: () => ({ mutate: mockRandomPassword, isPending: false, data: null }),
}));

vi.mock("../components/Toast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));

import SecretsManagerPage from "./SecretsManagerPage";

describe("SecretsManagerPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSecrets.mockReturnValue({
      data: { secrets: [{ name: "my-secret", description: "Test secret", lastChangedDate: new Date("2025-01-01"), tags: [] }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockSecret.mockReturnValue({ data: { secret: { name: "my-secret" }, versions: [], versionIdsToStages: {} }, isLoading: false, isError: false, error: null });
    mockSecretValue.mockReturnValue({ data: { secretString: "secret-value" }, isLoading: false, isError: false, error: null });
  });

  it("renders secret list", () => {
    render(<SecretsManagerPage />, { wrapper: createWrapper() });
    expect(screen.getAllByText("Secrets Manager").length).toBeGreaterThan(0);
    expect(screen.getAllByText("my-secret").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Test secret").length).toBeGreaterThan(0);
  });

  it("renders empty secret list when no data", () => {
    mockSecrets.mockReturnValue({ data: { secrets: [], total: 0 }, isLoading: false, isError: false, error: null });
    render(<SecretsManagerPage />, { wrapper: createWrapper() });
    expect(screen.getByRole("heading", { name: /Secrets Manager/i, level: 1 })).toBeTruthy();
  });

  it("shows create secret button", () => {
    render(<SecretsManagerPage />, { wrapper: createWrapper() });
    expect(screen.getByRole("button", { name: /Create secret/i })).toBeTruthy();
  });

  it("shows loading state", () => {
    mockSecrets.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    render(<SecretsManagerPage />, { wrapper: createWrapper() });
    expect(screen.getByRole("heading", { name: /Secrets Manager/i, level: 1 })).toBeTruthy();
  });
});
