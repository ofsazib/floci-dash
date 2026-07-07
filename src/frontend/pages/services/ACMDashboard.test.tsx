// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

// ─── Mock hooks ─────────────────────────────────────────

vi.mock("../../components/ConfirmDialog", () => ({
  useConfirmDialog: () => ({
    confirm: vi.fn(() => Promise.resolve(true)),
    dialog: null,
  }),
}));

const mockCertificates = vi.fn();
const mockDeleteCert = vi.fn();

vi.mock("../../hooks/useACM", () => ({
  useACMCertificates: (...args: any[]) => mockCertificates(...args),
  useRequestACMCertificate: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteACMCertificate: () => ({
    mutateAsync: mockDeleteCert,
    isPending: false,
  }),
}));

import { ACMDashboard } from "./ACMDashboard";

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();

  mockCertificates.mockReturnValue({
    data: { certificates: [], total: 0 },
    isLoading: false,
  });
});

// ─── Tests ──────────────────────────────────────────────

describe("ACMDashboard — rendering", () => {
  it("shows loading skeleton when loading", () => {
    mockCertificates.mockReturnValue({
      data: undefined,
      isLoading: true,
    });
    const { container } = render(<ACMDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("renders the table header", () => {
    render(<ACMDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("ACM Certificates")).toBeTruthy();
  });

  it("shows empty message when no certificates", () => {
    render(<ACMDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No certificates/i)).toBeTruthy();
  });
});

describe("ACMDashboard — data", () => {
  it("renders certificates with data", () => {
    mockCertificates.mockReturnValue({
      data: {
        certificates: [
          {
            CertificateArn: "arn:aws:acm:us-east-1::certificate/abc123",
            DomainName: "example.com",
            Status: "ISSUED",
            Type: "AMAZON_ISSUED",
            KeyAlgorithm: "RSA-2048",
            InUse: true,
            NotAfter: 1800000000,
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<ACMDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("example.com")).toBeTruthy();
    expect(screen.getByText("ISSUED")).toBeTruthy();
    expect(screen.getByText("Yes")).toBeTruthy();
  });

  it("renders certificates with null/undefined fields gracefully", () => {
    mockCertificates.mockReturnValue({
      data: {
        certificates: [
          {
            CertificateArn: "arn:aws:acm:us-east-1::certificate/minimal",
            DomainName: "minimal.example.com",
            Status: "PENDING_VALIDATION",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<ACMDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("minimal.example.com")).toBeTruthy();
    expect(screen.getByText("PENDING_VALIDATION")).toBeTruthy();
    // Missing fields should show "-"
    expect(screen.getAllByText("-").length).toBeGreaterThan(0);
  });

  it("renders with null data gracefully", () => {
    mockCertificates.mockReturnValue({
      data: null,
      isLoading: false,
    });
    render(<ACMDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No certificates/i)).toBeTruthy();
  });

  it("calls deleteCertificate when delete is clicked", async () => {
    mockCertificates.mockReturnValue({
      data: {
        certificates: [
          {
            CertificateArn: "arn:aws:acm:us-east-1::certificate/abc123",
            DomainName: "example.com",
            Status: "ISSUED",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });

    const user = userEvent.setup();
    render(<ACMDashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("example.com")).toBeTruthy();
    });

    const deleteBtn = screen.getByRole("button", { name: /Delete example.com/i });
    await user.click(deleteBtn);

    await waitFor(() => {
      expect(mockDeleteCert).toHaveBeenCalledWith(
        "arn:aws:acm:us-east-1::certificate/abc123",
      );
    });
  });
});
