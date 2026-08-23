// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

const mockFirehoseStreams = vi.fn();
const mockDeleteStream = vi.fn();
const mockTags = vi.fn();
const mockAddTagsMutate = vi.fn();
const mockRemoveTagsMutate = vi.fn();

const addTagsState = vi.hoisted(() => ({ isPending: false }));
const removeTagsState = vi.hoisted(() => ({ isPending: false, variables: null as any }));

const deleteStreamState = vi.hoisted(() => ({ isPending: false, variables: null as string | null }));

vi.mock("../../hooks/useFirehose", () => ({
  useFirehoseStreams: (...args: any[]) => mockFirehoseStreams(...args),
  useDeleteFirehoseStream: () => ({
    mutateAsync: mockDeleteStream,
    isPending: deleteStreamState.isPending,
    variables: deleteStreamState.variables,
  }),
  useFirehoseStreamTags: (...args: any[]) => mockTags(...args),
  useTagFirehoseStream: () => ({
    mutateAsync: mockAddTagsMutate,
    get isPending() { return addTagsState.isPending; },
  }),
  useUntagFirehoseStream: () => ({
    mutateAsync: mockRemoveTagsMutate,
    get isPending() { return removeTagsState.isPending; },
    get variables() { return removeTagsState.variables; },
  }),
}));

import { FirehoseDashboard } from "./FirehoseDashboard";

beforeEach(() => {
  vi.clearAllMocks();
  deleteStreamState.isPending = false;
  deleteStreamState.variables = null;
  addTagsState.isPending = false;
  removeTagsState.isPending = false;
  removeTagsState.variables = null;
  mockTags.mockReturnValue({ data: undefined });
  mockFirehoseStreams.mockReturnValue({
    data: { streams: [], total: 0 },
    isLoading: false,
  });
});

describe("FirehoseDashboard — rendering", () => {
  it("shows loading skeleton", () => {
    mockFirehoseStreams.mockReturnValue({
      data: undefined,
      isLoading: true,
    });
    const { container } = render(<FirehoseDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("shows empty state", () => {
    render(<FirehoseDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("No delivery streams")).toBeTruthy();
  });

  it("renders stream data with destination details", () => {
    mockFirehoseStreams.mockReturnValue({
      data: {
        streams: [
          {
            DeliveryStreamName: "my-stream",
            DeliveryStreamARN: "arn:aws:firehose:us-east-1::delivery-stream/my-stream",
            DeliveryStreamStatus: "ACTIVE",
            Destinations: [
              {
                S3DestinationDescription: {
                  BucketARN: "arn:aws:s3:::my-bucket",
                  Prefix: "logs/",
                },
              },
            ],
            CreateTimestamp: 1700000000000,
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<FirehoseDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-stream")).toBeTruthy();
    expect(screen.getByText("ACTIVE")).toBeTruthy();
    expect(screen.getByText("arn:aws:s3:::my-bucket")).toBeTruthy();
    expect(screen.getByText("logs/")).toBeTruthy();
  });

  it("shows dash for missing destinations and created date", () => {
    mockFirehoseStreams.mockReturnValue({
      data: {
        streams: [
          {
            DeliveryStreamName: "minimal-stream",
            DeliveryStreamARN: "arn:1",
            DeliveryStreamStatus: "CREATING",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<FirehoseDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("minimal-stream")).toBeTruthy();
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(2);
  });
});

describe("FirehoseDashboard — delete", () => {
  it("deletes a delivery stream", async () => {
    const user = userEvent.setup();
    mockFirehoseStreams.mockReturnValue({
      data: {
        streams: [
          {
            DeliveryStreamName: "my-stream",
            DeliveryStreamARN: "arn:aws:firehose:us-east-1::delivery-stream/my-stream",
            DeliveryStreamStatus: "ACTIVE",
            CreateTimestamp: 1700000000000,
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<FirehoseDashboard />, { wrapper: createWrapper() });
    const deleteBtn = screen.getByRole("button", { name: /Delete my-stream/i });
    await user.click(deleteBtn);
    await waitFor(() => {
      expect(screen.getByText(/Are you sure/)).toBeTruthy();
    });
    await clickButton(user, /^Delete$/i);
    await waitFor(() => {
      expect(mockDeleteStream).toHaveBeenCalledWith("my-stream");
    });
  });

  it("renders delete loading state", () => {
    deleteStreamState.isPending = true;
    deleteStreamState.variables = "my-stream";
    mockFirehoseStreams.mockReturnValue({
      data: { streams: [{ DeliveryStreamName: "my-stream", DeliveryStreamARN: "arn:1", DeliveryStreamStatus: "ACTIVE", CreateTimestamp: 1700000000000 }], total: 1 },
      isLoading: false,
    });
    render(<FirehoseDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-stream")).toBeTruthy();
  });
});

describe("FirehoseDashboard — filtering", () => {
  it("filters streams by name", async () => {
    mockFirehoseStreams.mockReturnValue({
      data: {
        streams: [
          { DeliveryStreamName: "alpha-stream", DeliveryStreamStatus: "ACTIVE" },
          { DeliveryStreamName: "beta-stream", DeliveryStreamStatus: "ACTIVE" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<FirehoseDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("alpha-stream")).toBeTruthy());
    expect(screen.getByText("beta-stream")).toBeTruthy();

    const filterInput = screen.getByPlaceholderText("Find streams by name");
    await user.type(filterInput, "alpha");
    await waitFor(() => {
      expect(screen.queryByText("beta-stream")).toBeNull();
    });
  });

  it("filters out all streams when no match", async () => {
    mockFirehoseStreams.mockReturnValue({
      data: {
        streams: [
          { DeliveryStreamName: "visible-stream", DeliveryStreamStatus: "ACTIVE" },
        ],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<FirehoseDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("visible-stream")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find streams by name");
    await user.type(filterInput, "nonexistent");
    await waitFor(() => {
      expect(screen.queryByText("visible-stream")).toBeNull();
    });
  });


  // ── Sparse data ─────────────────────────────────────

  it("renders empty when data lacks the streams array", () => {
    mockFirehoseStreams.mockReturnValue({ data: { total: 0 }, isLoading: false });
    render(<FirehoseDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("No delivery streams")).toBeTruthy();
  });
});

describe("FirehoseDashboard — stream tags", () => {
  function setupStream() {
    mockFirehoseStreams.mockReturnValue({
      data: { streams: [{ DeliveryStreamName: "s1", DeliveryStreamStatus: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
  }

  it("opens the tags modal and renders tags", async () => {
    setupStream();
    mockTags.mockReturnValue({ data: { tags: [{ Key: "env", Value: "prod" }] } });
    const user = userEvent.setup();
    render(<FirehoseDashboard />, { wrapper: createWrapper() });
    await user.click((await screen.findAllByRole("button", { name: "Tags" }))[0]);
    expect(await screen.findByText("env")).toBeTruthy();
    expect(mockTags).toHaveBeenCalledWith("s1");
  });

  it("shows No tags for an empty list", async () => {
    setupStream();
    mockTags.mockReturnValue({ data: { tags: [] } });
    const user = userEvent.setup();
    render(<FirehoseDashboard />, { wrapper: createWrapper() });
    await user.click((await screen.findAllByRole("button", { name: "Tags" }))[0]);
    expect(await screen.findByText("No tags")).toBeTruthy();
  });

  it("adds a tag and clears inputs", async () => {
    setupStream();
    mockTags.mockReturnValue({ data: { tags: [] } });
    mockAddTagsMutate.mockResolvedValue({});
    const user = userEvent.setup();
    render(<FirehoseDashboard />, { wrapper: createWrapper() });
    await user.click((await screen.findAllByRole("button", { name: "Tags" }))[0]);
    await screen.findByText("No tags");
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "team");
    await user.type(inputs[1], "data");
    await user.click(screen.getByRole("button", { name: /Add tag/i }));
    await waitFor(() => expect(mockAddTagsMutate).toHaveBeenCalledWith({ name: "s1", tags: { team: "data" } }));
    await waitFor(() => expect((screen.getAllByRole("textbox")[0] as HTMLInputElement).value).toBe(""));
  });

  it("removes a tag after confirmation", async () => {
    setupStream();
    mockTags.mockReturnValue({ data: { tags: [{ Key: "env", Value: "prod" }] } });
    mockRemoveTagsMutate.mockResolvedValue({});
    const user = userEvent.setup();
    render(<FirehoseDashboard />, { wrapper: createWrapper() });
    await user.click((await screen.findAllByRole("button", { name: "Tags" }))[0]);
    await screen.findByText("env");
    await user.click(screen.getByRole("button", { name: /Delete env/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockRemoveTagsMutate).toHaveBeenCalledWith({ name: "s1", tagKeys: ["env"] }));
  });

  it("disables the tag delete while pending", async () => {
    setupStream();
    mockTags.mockReturnValue({ data: { tags: [{ Key: "env", Value: "prod" }] } });
    removeTagsState.isPending = true;
    removeTagsState.variables = { tagKeys: ["env"] };
    const user = userEvent.setup();
    render(<FirehoseDashboard />, { wrapper: createWrapper() });
    await user.click((await screen.findAllByRole("button", { name: "Tags" }))[0]);
    const btn = await screen.findByRole("button", { name: /Delete env/i });
    expect(btn.className).toMatch(/disabled/);
  });

  it("closes the tags modal", async () => {
    setupStream();
    const user = userEvent.setup();
    render(<FirehoseDashboard />, { wrapper: createWrapper() });
    await user.click((await screen.findAllByRole("button", { name: "Tags" }))[0]);
    await screen.findByText(/Tags \(/);
    await user.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("button", { name: /Add tag/i })).toBeNull());
  });
});
