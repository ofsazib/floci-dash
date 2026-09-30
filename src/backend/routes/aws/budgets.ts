import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import {
  BudgetsClient,
  DescribeBudgetsCommand,
  DescribeBudgetCommand,
  CreateBudgetCommand,
  UpdateBudgetCommand,
  DeleteBudgetCommand,
  DescribeNotificationsForBudgetCommand,
  CreateNotificationCommand,
  DeleteNotificationCommand,
  DescribeSubscribersForNotificationCommand,
  CreateSubscriberCommand,
  DeleteSubscriberCommand,
  DescribeBudgetActionsForBudgetCommand,
  CreateBudgetActionCommand,
  DeleteBudgetActionCommand,
  ExecuteBudgetActionCommand,
  ListTagsForResourceCommand,
  TagResourceCommand,
  UntagResourceCommand,
} from "@aws-sdk/client-budgets";
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";

const router = new Hono();
const getClient = () => create(BudgetsClient);

// The Budgets SDK (and Floci) require AccountId on every command; resolve the
// caller account via STS so it matches whatever account Floci reports.
async function accountId(): Promise<string> {
  const sts = create(STSClient);
  const identity: any = await sts.send(new GetCallerIdentityCommand({}));
  return identity.Account;
}

async function budgetArn(name: string): Promise<string> {
  return `arn:aws:budgets::${await accountId()}:budget/${name}`;
}

router.get("/", async (c: Context) => {
  const result: any = await getClient().send(
    new DescribeBudgetsCommand({ AccountId: await accountId() })
  );
  return c.json({
    budgets: result.Budgets || [],
    total: result.Budgets?.length || 0,
  });
});

router.get("/:name", async (c: Context) => {
  const name = c.req.param("name")!;
  const result: any = await getClient().send(
    new DescribeBudgetCommand({ AccountId: await accountId(), BudgetName: name })
  );
  return c.json({ budget: result.Budget || null });
});

router.post("/", async (c: Context) => {
  const body: any = await c.req.json().catch(() => ({}));
  if (!body?.budget)
    return c.json({ error: "budget is required" }, 400);
  await getClient().send(
    new CreateBudgetCommand({ AccountId: await accountId(), Budget: body.budget })
  );
  return c.json({ ok: true }, 201);
});

router.put("/:name", async (c: Context) => {
  const name = c.req.param("name")!;
  const body: any = await c.req.json().catch(() => ({}));
  if (!body?.budget)
    return c.json({ error: "budget is required" }, 400);
  await getClient().send(
    new UpdateBudgetCommand({
      AccountId: await accountId(),
      NewBudget: { ...body.budget, BudgetName: name },
    })
  );
  return c.json({ ok: true });
});

router.delete("/:name", async (c: Context) => {
  const name = c.req.param("name")!;
  await getClient().send(
    new DeleteBudgetCommand({ AccountId: await accountId(), BudgetName: name })
  );
  return c.json({ ok: true });
});

// ── Tags ─────────────────────────────────────────────────

router.get("/:name/tags", async (c: Context) => {
  const arn = await budgetArn(c.req.param("name")!);
  const result: any = await getClient().send(
    new ListTagsForResourceCommand({ ResourceARN: arn })
  );
  return c.json({ tags: result.ResourceTags || [] });
});

router.post("/:name/tags", async (c: Context) => {
  const arn = await budgetArn(c.req.param("name")!);
  const body: any = await c.req.json().catch(() => ({}));
  if (!Array.isArray(body?.tags) || body.tags.length === 0)
    return c.json({ error: "tags array with at least one tag is required" }, 400);
  await getClient().send(
    new TagResourceCommand({ ResourceARN: arn, ResourceTags: body.tags })
  );
  return c.json({ ok: true });
});

router.post("/:name/tags/untag", async (c: Context) => {
  const arn = await budgetArn(c.req.param("name")!);
  const body: any = await c.req.json().catch(() => ({}));
  if (!Array.isArray(body?.tagKeys) || body.tagKeys.length === 0)
    return c.json({ error: "tagKeys array with at least one key is required" }, 400);
  await getClient().send(
    new UntagResourceCommand({ ResourceARN: arn, ResourceTagKeys: body.tagKeys })
  );
  return c.json({ ok: true });
});

// ── Notifications ────────────────────────────────────────

router.get("/:name/notifications", async (c: Context) => {
  const name = c.req.param("name")!;
  const result: any = await getClient().send(
    new DescribeNotificationsForBudgetCommand({
      AccountId: await accountId(),
      BudgetName: name,
    })
  );
  return c.json({
    notifications: result.Notifications || [],
    total: result.Notifications?.length || 0,
  });
});

router.post("/:name/notifications", async (c: Context) => {
  const name = c.req.param("name")!;
  const body: any = await c.req.json().catch(() => ({}));
  if (!body?.notification)
    return c.json({ error: "notification is required" }, 400);
  if (!Array.isArray(body?.subscribers) || body.subscribers.length === 0)
    return c.json({ error: "subscribers array with at least one subscriber is required" }, 400);
  await getClient().send(
    new CreateNotificationCommand({
      AccountId: await accountId(),
      BudgetName: name,
      Notification: body.notification,
      Subscribers: body.subscribers,
    })
  );
  return c.json({ ok: true }, 201);
});

router.delete("/:name/notifications", async (c: Context) => {
  const name = c.req.param("name")!;
  const body: any = await c.req.json().catch(() => ({}));
  if (!body?.notification)
    return c.json({ error: "notification is required" }, 400);
  await getClient().send(
    new DeleteNotificationCommand({
      AccountId: await accountId(),
      BudgetName: name,
      Notification: body.notification,
    })
  );
  return c.json({ ok: true });
});

// ── Subscribers ──────────────────────────────────────────

router.get("/:name/subscribers", async (c: Context) => {
  const name = c.req.param("name")!;
  const notification = c.req.query("notification");
  if (!notification)
    return c.json({ error: "notification query parameter (JSON) is required" }, 400);
  let parsed: unknown;
  try {
    parsed = JSON.parse(notification);
  } catch {
    return c.json({ error: "notification query parameter must be valid JSON" }, 400);
  }
  const result: any = await getClient().send(
    new DescribeSubscribersForNotificationCommand({
      AccountId: await accountId(),
      BudgetName: name,
      Notification: parsed as any,
    })
  );
  return c.json({
    subscribers: result.Subscribers || [],
    total: result.Subscribers?.length || 0,
  });
});

router.post("/:name/subscribers", async (c: Context) => {
  const name = c.req.param("name")!;
  const body: any = await c.req.json().catch(() => ({}));
  if (!body?.notification)
    return c.json({ error: "notification is required" }, 400);
  if (!body?.subscriber)
    return c.json({ error: "subscriber is required" }, 400);
  await getClient().send(
    new CreateSubscriberCommand({
      AccountId: await accountId(),
      BudgetName: name,
      Notification: body.notification,
      Subscriber: body.subscriber,
    })
  );
  return c.json({ ok: true }, 201);
});

router.delete("/:name/subscribers", async (c: Context) => {
  const name = c.req.param("name")!;
  const body: any = await c.req.json().catch(() => ({}));
  if (!body?.notification)
    return c.json({ error: "notification is required" }, 400);
  if (!body?.subscriber)
    return c.json({ error: "subscriber is required" }, 400);
  await getClient().send(
    new DeleteSubscriberCommand({
      AccountId: await accountId(),
      BudgetName: name,
      Notification: body.notification,
      Subscriber: body.subscriber,
    })
  );
  return c.json({ ok: true });
});

// ── Actions ──────────────────────────────────────────────

router.get("/:name/actions", async (c: Context) => {
  const name = c.req.param("name")!;
  const result: any = await getClient().send(
    new DescribeBudgetActionsForBudgetCommand({
      AccountId: await accountId(),
      BudgetName: name,
    })
  );
  return c.json({
    actions: result.Actions || [],
    total: result.Actions?.length || 0,
  });
});

router.post("/:name/actions", async (c: Context) => {
  const name = c.req.param("name")!;
  const body: any = await c.req.json().catch(() => ({}));
  if (!body?.actionType)
    return c.json({ error: "actionType is required" }, 400);
  const result: any = await getClient().send(
    new CreateBudgetActionCommand({
      AccountId: await accountId(),
      BudgetName: name,
      NotificationType: body.notificationType,
      ActionType: body.actionType,
      ActionThreshold: body.actionThreshold,
      Definition: body.definition,
      ExecutionRoleArn: body.executionRoleArn,
      ApprovalModel: body.approvalModel,
      Subscribers: body.subscribers,
    })
  );
  return c.json(
    {
      accountId: result.AccountId,
      budgetName: result.BudgetName,
      actionId: result.ActionId,
    },
    201
  );
});

router.delete("/:name/actions/:actionId", async (c: Context) => {
  const name = c.req.param("name")!;
  const actionId = c.req.param("actionId");
  const result: any = await getClient().send(
    new DeleteBudgetActionCommand({
      AccountId: await accountId(),
      BudgetName: name,
      ActionId: actionId,
    })
  );
  return c.json({ ok: true, action: result.Action || null });
});

router.post("/:name/actions/:actionId/execute", async (c: Context) => {
  const name = c.req.param("name")!;
  const actionId = c.req.param("actionId");
  const body: any = await c.req.json().catch(() => ({}));
  if (!body?.executionType)
    return c.json({ error: "executionType is required" }, 400);
  const result: any = await getClient().send(
    new ExecuteBudgetActionCommand({
      AccountId: await accountId(),
      BudgetName: name,
      ActionId: actionId,
      ExecutionType: body.executionType,
    })
  );
  return c.json({
    accountId: result.AccountId,
    budgetName: result.BudgetName,
    actionId: result.ActionId,
    executionType: result.ExecutionType,
  });
});

export default router;
