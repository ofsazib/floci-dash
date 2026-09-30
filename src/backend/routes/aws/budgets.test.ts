import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());
const mockStsSend = vi.hoisted(() => vi.fn());

const mockBudgets = vi.hoisted(() =>
  vi.fn(function () {
    return { send: mockSend };
  })
);

const mockSTS = vi.hoisted(() =>
  vi.fn(function () {
    return { send: mockStsSend };
  })
);

const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) {
      return { __cmdName: name, ...args };
    });
  };
});

vi.mock("@aws-sdk/client-budgets", () => ({
  BudgetsClient: mockBudgets,
  DescribeBudgetsCommand: createCmd("DescribeBudgetsCommand"),
  DescribeBudgetCommand: createCmd("DescribeBudgetCommand"),
  CreateBudgetCommand: createCmd("CreateBudgetCommand"),
  UpdateBudgetCommand: createCmd("UpdateBudgetCommand"),
  DeleteBudgetCommand: createCmd("DeleteBudgetCommand"),
  DescribeNotificationsForBudgetCommand: createCmd("DescribeNotificationsForBudgetCommand"),
  CreateNotificationCommand: createCmd("CreateNotificationCommand"),
  DeleteNotificationCommand: createCmd("DeleteNotificationCommand"),
  DescribeSubscribersForNotificationCommand: createCmd("DescribeSubscribersForNotificationCommand"),
  CreateSubscriberCommand: createCmd("CreateSubscriberCommand"),
  DeleteSubscriberCommand: createCmd("DeleteSubscriberCommand"),
  DescribeBudgetActionsForBudgetCommand: createCmd("DescribeBudgetActionsForBudgetCommand"),
  CreateBudgetActionCommand: createCmd("CreateBudgetActionCommand"),
  DeleteBudgetActionCommand: createCmd("DeleteBudgetActionCommand"),
  ExecuteBudgetActionCommand: createCmd("ExecuteBudgetActionCommand"),
  ListTagsForResourceCommand: createCmd("ListTagsForResourceCommand"),
  TagResourceCommand: createCmd("TagResourceCommand"),
  UntagResourceCommand: createCmd("UntagResourceCommand"),
}));

vi.mock("@aws-sdk/client-sts", () => ({
  STSClient: mockSTS,
  GetCallerIdentityCommand: createCmd("GetCallerIdentityCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: (Client: any) =>
    Client === mockSTS ? { send: mockStsSend } : { send: mockSend },
}));

import router from "./budgets";

async function get(path: string) {
  return router.request(path, { method: "GET" });
}

async function post(path: string, body?: any) {
  return router.request(path, {
    method: "POST",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}

async function put(path: string, body?: any) {
  return router.request(path, {
    method: "PUT",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}

async function del(path: string, body?: any) {
  return router.request(path, {
    method: "DELETE",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}

const NOTIFICATION = {
  NotificationType: "ACTUAL",
  ComparisonOperator: "GREATER_THAN",
  Threshold: 80,
  ThresholdType: "PERCENTAGE",
};
const SUBSCRIBER = { SubscriptionType: "EMAIL", Address: "ops@example.com" };

beforeEach(() => {
  vi.clearAllMocks();
  mockSend.mockReset();
  mockStsSend.mockReset();
  mockStsSend.mockResolvedValue({ Account: "123456789012" });
});

describe("GET /budgets", () => {
  it("lists budgets", async () => {
    mockSend.mockResolvedValueOnce({
      Budgets: [{ BudgetName: "monthly", BudgetType: "COST" }],
    });
    const res = await get("/");
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.total).toBe(1);
    expect(json.budgets[0].BudgetName).toBe("monthly");
  });

  it("returns sparse arrays when no budgets", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/");
    const json = await res.json();
    expect(json.budgets).toEqual([]);
    expect(json.total).toBe(0);
  });
});

describe("GET /budgets/:name", () => {
  it("describes a budget", async () => {
    mockSend.mockResolvedValueOnce({
      Budget: { BudgetName: "monthly", BudgetType: "COST" },
    });
    const res = await get("/monthly");
    const json = await res.json();
    expect(json.budget.BudgetName).toBe("monthly");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "DescribeBudgetCommand",
        BudgetName: "monthly",
      })
    );
  });

  it("returns null when Budget absent", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/missing");
    const json = await res.json();
    expect(json.budget).toBeNull();
  });
});

describe("POST /budgets", () => {
  it("creates a budget", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/", {
      budget: { BudgetName: "monthly", BudgetType: "COST", TimeUnit: "MONTHLY" },
    });
    expect(res.status).toBe(201);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "CreateBudgetCommand",
        Budget: { BudgetName: "monthly", BudgetType: "COST", TimeUnit: "MONTHLY" },
      })
    );
  });

  it("400 when budget missing", async () => {
    const res = await post("/", {});
    expect(res.status).toBe(400);
  });
});

describe("PUT /budgets/:name", () => {
  it("updates and forces BudgetName from the path", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/monthly", {
      budget: { BudgetName: "ignored", BudgetType: "COST", TimeUnit: "MONTHLY" },
    });
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "UpdateBudgetCommand",
        NewBudget: { BudgetName: "monthly", BudgetType: "COST", TimeUnit: "MONTHLY" },
      })
    );
  });

  it("400 when budget missing", async () => {
    const res = await put("/monthly", {});
    expect(res.status).toBe(400);
  });
});

describe("DELETE /budgets/:name", () => {
  it("deletes a budget", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/monthly");
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "DeleteBudgetCommand",
        BudgetName: "monthly",
      })
    );
  });
});

describe("tags", () => {
  it("lists tags by resolved ARN", async () => {
    mockSend.mockResolvedValueOnce({
      ResourceTags: [{ Key: "env", Value: "dev" }],
    });
    const res = await get("/monthly/tags");
    const json = await res.json();
    expect(json.tags).toEqual([{ Key: "env", Value: "dev" }]);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "ListTagsForResourceCommand",
        ResourceARN: "arn:aws:budgets::123456789012:budget/monthly",
      })
    );
  });

  it("returns sparse tags", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/monthly/tags");
    const json = await res.json();
    expect(json.tags).toEqual([]);
  });

  it("adds tags", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/monthly/tags", {
      tags: [{ Key: "env", Value: "dev" }],
    });
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "TagResourceCommand",
        ResourceTags: [{ Key: "env", Value: "dev" }],
      })
    );
  });

  it("400 when tags missing or empty", async () => {
    expect((await post("/monthly/tags", {})).status).toBe(400);
    expect((await post("/monthly/tags", { tags: [] })).status).toBe(400);
  });

  it("removes tags", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/monthly/tags/untag", { tagKeys: ["env"] });
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "UntagResourceCommand",
        ResourceTagKeys: ["env"],
      })
    );
  });

  it("400 when tagKeys missing or empty", async () => {
    expect((await post("/monthly/tags/untag", {})).status).toBe(400);
    expect((await post("/monthly/tags/untag", { tagKeys: [] })).status).toBe(400);
  });
});

describe("notifications", () => {
  it("lists notifications", async () => {
    mockSend.mockResolvedValueOnce({ Notifications: [NOTIFICATION] });
    const res = await get("/monthly/notifications");
    const json = await res.json();
    expect(json.total).toBe(1);
    expect(json.notifications[0].NotificationType).toBe("ACTUAL");
  });

  it("returns sparse notifications", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/monthly/notifications");
    const json = await res.json();
    expect(json.notifications).toEqual([]);
    expect(json.total).toBe(0);
  });

  it("creates a notification with subscribers", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/monthly/notifications", {
      notification: NOTIFICATION,
      subscribers: [SUBSCRIBER],
    });
    expect(res.status).toBe(201);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "CreateNotificationCommand",
        BudgetName: "monthly",
        Notification: NOTIFICATION,
        Subscribers: [SUBSCRIBER],
      })
    );
  });

  it("400 when notification missing", async () => {
    expect((await post("/monthly/notifications", {})).status).toBe(400);
  });

  it("400 when subscribers missing or empty", async () => {
    expect(
      (await post("/monthly/notifications", { notification: NOTIFICATION })).status
    ).toBe(400);
    expect(
      (await post("/monthly/notifications", { notification: NOTIFICATION, subscribers: [] })).status
    ).toBe(400);
  });

  it("deletes a notification", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/monthly/notifications", { notification: NOTIFICATION });
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "DeleteNotificationCommand",
        Notification: NOTIFICATION,
      })
    );
  });

  it("400 deleting without notification", async () => {
    expect((await del("/monthly/notifications", {})).status).toBe(400);
  });
});

describe("subscribers", () => {
  it("lists subscribers for an encoded notification", async () => {
    mockSend.mockResolvedValueOnce({ Subscribers: [SUBSCRIBER] });
    const res = await get(
      `/monthly/subscribers?notification=${encodeURIComponent(JSON.stringify(NOTIFICATION))}`
    );
    const json = await res.json();
    expect(json.total).toBe(1);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "DescribeSubscribersForNotificationCommand",
        Notification: NOTIFICATION,
      })
    );
  });

  it("400 when notification query param missing", async () => {
    expect((await get("/monthly/subscribers")).status).toBe(400);
  });

  it("400 when notification query param is not JSON", async () => {
    expect((await get("/monthly/subscribers?notification=not-json")).status).toBe(400);
  });

  it("returns sparse subscribers", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get(
      `/monthly/subscribers?notification=${encodeURIComponent(JSON.stringify(NOTIFICATION))}`
    );
    const json = await res.json();
    expect(json.subscribers).toEqual([]);
  });

  it("creates a subscriber", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/monthly/subscribers", {
      notification: NOTIFICATION,
      subscriber: SUBSCRIBER,
    });
    expect(res.status).toBe(201);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "CreateSubscriberCommand",
        Subscriber: SUBSCRIBER,
      })
    );
  });

  it("400s creating without notification or subscriber", async () => {
    expect(
      (await post("/monthly/subscribers", { subscriber: SUBSCRIBER })).status
    ).toBe(400);
    expect(
      (await post("/monthly/subscribers", { notification: NOTIFICATION })).status
    ).toBe(400);
  });

  it("deletes a subscriber", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/monthly/subscribers", {
      notification: NOTIFICATION,
      subscriber: SUBSCRIBER,
    });
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "DeleteSubscriberCommand",
        Subscriber: SUBSCRIBER,
      })
    );
  });

  it("400s deleting without notification or subscriber", async () => {
    expect(
      (await del("/monthly/subscribers", { subscriber: SUBSCRIBER })).status
    ).toBe(400);
    expect(
      (await del("/monthly/subscribers", { notification: NOTIFICATION })).status
    ).toBe(400);
  });
});

describe("actions", () => {
  it("lists actions", async () => {
    mockSend.mockResolvedValueOnce({
      Actions: [{ ActionId: "a-1", ActionType: "APPLY_IAM_POLICY", Status: "STANDBY" }],
    });
    const res = await get("/monthly/actions");
    const json = await res.json();
    expect(json.total).toBe(1);
    expect(json.actions[0].ActionId).toBe("a-1");
  });

  it("returns sparse actions", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/monthly/actions");
    const json = await res.json();
    expect(json.actions).toEqual([]);
  });

  it("creates an action and returns ids", async () => {
    mockSend.mockResolvedValueOnce({
      AccountId: "123456789012",
      BudgetName: "monthly",
      ActionId: "a-1",
    });
    const res = await post("/monthly/actions", {
      actionType: "APPLY_IAM_POLICY",
      notificationType: "ACTUAL",
      actionThreshold: { ActionThresholdValue: 100, ActionThresholdType: "PERCENTAGE" },
      definition: { IamActionDefinition: { PolicyArn: "arn:aws:iam::123456789012:policy/p" } },
      executionRoleArn: "arn:aws:iam::123456789012:role/r",
      approvalModel: "AUTOMATIC",
      subscribers: [SUBSCRIBER],
    });
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.actionId).toBe("a-1");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "CreateBudgetActionCommand",
        BudgetName: "monthly",
        ActionType: "APPLY_IAM_POLICY",
      })
    );
  });

  it("400 when actionType missing", async () => {
    expect((await post("/monthly/actions", {})).status).toBe(400);
  });

  it("deletes an action", async () => {
    mockSend.mockResolvedValueOnce({ Action: { ActionId: "a-1" } });
    const res = await del("/monthly/actions/a-1");
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.action.ActionId).toBe("a-1");
  });

  it("returns null action when absent on delete", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/monthly/actions/a-1");
    const json = await res.json();
    expect(json.action).toBeNull();
  });

  it("executes an action", async () => {
    mockSend.mockResolvedValueOnce({
      AccountId: "123456789012",
      BudgetName: "monthly",
      ActionId: "a-1",
      ExecutionType: "APPROVE_BUDGET_ACTION",
    });
    const res = await post("/monthly/actions/a-1/execute", {
      executionType: "APPROVE_BUDGET_ACTION",
    });
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.executionType).toBe("APPROVE_BUDGET_ACTION");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "ExecuteBudgetActionCommand",
        ExecutionType: "APPROVE_BUDGET_ACTION",
      })
    );
  });

  it("400 when executionType missing", async () => {
    expect((await post("/monthly/actions/a-1/execute", {})).status).toBe(400);
  });
});
