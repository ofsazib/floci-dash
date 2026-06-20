import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockClient = vi.hoisted(() =>
  vi.fn(function () {
    return { send: mockSend };
  })
);

const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) {
      return { __cmdName: name, ...args };
    });
  };
});

vi.mock("@aws-sdk/client-scheduler", () => ({
  SchedulerClient: mockClient,
  ListScheduleGroupsCommand: createCmd("ListScheduleGroupsCommand"),
  CreateScheduleGroupCommand: createCmd("CreateScheduleGroupCommand"),
  DeleteScheduleGroupCommand: createCmd("DeleteScheduleGroupCommand"),
  ListSchedulesCommand: createCmd("ListSchedulesCommand"),
  GetScheduleCommand: createCmd("GetScheduleCommand"),
  CreateScheduleCommand: createCmd("CreateScheduleCommand"),
  UpdateScheduleCommand: createCmd("UpdateScheduleCommand"),
  DeleteScheduleCommand: createCmd("DeleteScheduleCommand"),
}));

import app from "../../index";

beforeEach(() => {
  mockSend.mockReset();
});

// ─── Schedule Groups ─────────────────────────────────────

describe("GET /api/aws/scheduler/groups", () => {
  it("returns list of schedule groups", async () => {
    mockSend.mockResolvedValue({
      ScheduleGroups: [{ Name: "default", State: "ACTIVE" }],
    });
    const res = await app.request("/api/aws/scheduler/groups");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.groups).toHaveLength(1);
    expect(body.groups[0].Name).toBe("default");
    expect(body.total).toBe(1);
  });

  it("returns empty list when no groups exist", async () => {
    mockSend.mockResolvedValue({ ScheduleGroups: undefined });
    const res = await app.request("/api/aws/scheduler/groups");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.groups).toHaveLength(0);
    expect(body.total).toBe(0);
  });
});

describe("POST /api/aws/scheduler/groups", () => {
  it("creates a schedule group", async () => {
    mockSend.mockResolvedValue({ ScheduleGroupArn: "arn:aws:scheduler:us-east-1:123:schedule-group/my-group" });
    const res = await app.request("/api/aws/scheduler/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "my-group" }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.groupArn).toContain("my-group");
  });

  it("returns 400 if name is missing", async () => {
    const res = await app.request("/api/aws/scheduler/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/aws/scheduler/groups/:name", () => {
  it("deletes a schedule group", async () => {
    mockSend.mockResolvedValue({});
    const res = await app.request("/api/aws/scheduler/groups/my-group", {
      method: "DELETE",
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });
});

// ─── Schedules ───────────────────────────────────────────

describe("GET /api/aws/scheduler/schedules", () => {
  it("returns list of schedules", async () => {
    mockSend.mockResolvedValue({
      Schedules: [{ Name: "my-schedule", ScheduleExpression: "rate(1 minute)", State: "ENABLED" }],
    });
    const res = await app.request("/api/aws/scheduler/schedules");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.schedules).toHaveLength(1);
    expect(body.schedules[0].Name).toBe("my-schedule");
    expect(body.total).toBe(1);
  });

  it("passes group query param", async () => {
    mockSend.mockResolvedValue({ Schedules: [] });
    await app.request("/api/aws/scheduler/schedules?group=my-group");
    expect(mockSend).toHaveBeenCalled();
  });

  it("returns empty list when no schedules exist", async () => {
    mockSend.mockResolvedValue({ Schedules: undefined });
    const res = await app.request("/api/aws/scheduler/schedules");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.schedules).toHaveLength(0);
  });
});

describe("GET /api/aws/scheduler/schedules/:name", () => {
  it("returns a single schedule", async () => {
    mockSend.mockResolvedValue({ Name: "my-schedule", ScheduleExpression: "rate(1 minute)" });
    const res = await app.request("/api/aws/scheduler/schedules/my-schedule");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.schedule.Name).toBe("my-schedule");
  });
});

describe("POST /api/aws/scheduler/schedules", () => {
  it("creates a schedule", async () => {
    mockSend.mockResolvedValue({ ScheduleArn: "arn:aws:scheduler:us-east-1:123:schedule/default/new-schedule" });
    const res = await app.request("/api/aws/scheduler/schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "new-schedule",
        scheduleExpression: "rate(5 minutes)",
        target: { Arn: "arn:aws:lambda:us-east-1:123:function:fn" },
      }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.scheduleArn).toContain("new-schedule");
  });

  it("returns 400 if name is missing", async () => {
    const res = await app.request("/api/aws/scheduler/schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduleExpression: "rate(1 minute)" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 if scheduleExpression is missing", async () => {
    const res = await app.request("/api/aws/scheduler/schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "my-schedule" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 if target.Arn is missing", async () => {
    const res = await app.request("/api/aws/scheduler/schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "my-schedule", scheduleExpression: "rate(1 minute)" }),
    });
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/aws/scheduler/schedules/:name", () => {
  it("deletes a schedule", async () => {
    mockSend.mockResolvedValue({});
    const res = await app.request("/api/aws/scheduler/schedules/my-schedule", {
      method: "DELETE",
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });
});
