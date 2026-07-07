// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

const mockJobs = vi.fn();
const mockDeleteJob = vi.fn();

vi.mock("../../hooks/useTranscribe", () => ({
  useTranscriptionJobs: (...args: any[]) => mockJobs(...args),
  useDeleteTranscriptionJob: () => ({ mutateAsync: mockDeleteJob, isPending: false, variables: null }),
}));

import { TranscribeDashboard } from "./TranscribeDashboard";

beforeEach(() => {
  vi.clearAllMocks();
  mockJobs.mockReturnValue({ data: { jobs: [], total: 0 }, isLoading: false });
});

describe("TranscribeDashboard", () => {
  it("shows loading skeleton", () => {
    mockJobs.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = render(<TranscribeDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("shows empty message", () => {
    render(<TranscribeDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No transcription jobs/i)).toBeTruthy();
  });

  it("renders jobs with data", () => {
    mockJobs.mockReturnValue({
      data: {
        jobs: [{
          TranscriptionJobName: "my-job",
          TranscriptionJobStatus: "COMPLETED",
          LanguageCode: "en-US",
          CreationTime: "2024-01-15T00:00:00Z",
          CompletionTime: "2024-01-15T01:00:00Z",
        }],
        total: 1,
      },
      isLoading: false,
    });
    render(<TranscribeDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-job")).toBeTruthy();
    expect(screen.getByText("COMPLETED")).toBeTruthy();
    expect(screen.getByText("en-US")).toBeTruthy();
  });

  it("shows dash for missing language", () => {
    mockJobs.mockReturnValue({
      data: { jobs: [{ TranscriptionJobName: "test", TranscriptionJobStatus: "COMPLETED" }], total: 1 },
      isLoading: false,
    });
    render(<TranscribeDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("test")).toBeTruthy();
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(1);
  });

  it("deletes a job", async () => {
    mockJobs.mockReturnValue({
      data: { jobs: [{ TranscriptionJobName: "delete-me", TranscriptionJobStatus: "COMPLETED" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<TranscribeDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("delete-me")).toBeTruthy());

    const deleteBtn = screen.getByRole("button", { name: /Delete delete-me/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteJob).toHaveBeenCalledWith("delete-me"));
  });

  it("filters jobs by name", async () => {
    mockJobs.mockReturnValue({
      data: {
        jobs: [
          { TranscriptionJobName: "alpha-job", TranscriptionJobStatus: "COMPLETED" },
          { TranscriptionJobName: "beta-job", TranscriptionJobStatus: "IN_PROGRESS" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<TranscribeDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("alpha-job")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find jobs by name");
    await user.type(filterInput, "beta");
    await waitFor(() => {
      expect(screen.queryByText("alpha-job")).toBeNull();
    });
  });
});
