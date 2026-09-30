import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { readJson } from "../../clients/read-json";
import {
  IdentitystoreClient,
  ListUsersCommand,
  CreateUserCommand,
  DescribeUserCommand,
  UpdateUserCommand,
  DeleteUserCommand,
  ListGroupsCommand,
  CreateGroupCommand,
  DescribeGroupCommand,
  UpdateGroupCommand,
  DeleteGroupCommand,
  ListGroupMembershipsCommand,
  CreateGroupMembershipCommand,
  DeleteGroupMembershipCommand,
} from "@aws-sdk/client-identitystore";

const router = new Hono();
const getClient = () => create(IdentitystoreClient);

const MISSING_STORE = "identityStoreId query parameter is required";

function storeId(c: Context): string {
  const id: string | undefined = c.req.query("identityStoreId");
  if (!id) throw new Error(MISSING_STORE);
  return id;
}

router.onError((err: Error, c: Context) => {
  if (err.message === MISSING_STORE) return c.json({ error: err.message }, 400);
  return c.json({ error: err.message || "Internal server error" }, 500);
});

function handleError(c: Context, err: any) {
  // Validation errors surface as 400s; resource-not-found as 404s. The SDK
  // names them consistently across the Identity Store API.
  // Floci throws ResourceNotFoundException with HTTP 400 — match by name first.
  if (err?.name === "ResourceNotFoundException" || err?.message?.includes("not found"))
    return c.json({ error: err.message || "Not found" }, 404);
  if (err?.name === "ValidationException" || err?.$metadata?.httpStatusCode === 400)
    return c.json({ error: err.message || "Validation error" }, 400);
  if (err?.name === "ConflictException" || err?.$metadata?.httpStatusCode === 409)
    return c.json({ error: err.message || "Conflict" }, 409);
  throw err;
}

// ── Users ────────────────────────────────────────────────

router.get("/users", async (c: Context) => {
  try {
    const result: any = await getClient().send(
      new ListUsersCommand({ IdentityStoreId: storeId(c) })
    );
    return c.json({ users: result.Users || [], total: result.Users?.length || 0 });
  } catch (err: any) {
    return handleError(c, err);
  }
});

router.post("/users", async (c: Context) => {
  try {
    const body: any = await readJson(c);
    if (!body?.userName) return c.json({ error: "userName is required" }, 400);
    const result: any = await getClient().send(
      new CreateUserCommand({
        IdentityStoreId: storeId(c),
        UserName: body.userName,
        DisplayName: body.displayName,
        Name: body.name,
        Emails: body.emails,
      })
    );
    return c.json({ userId: result.UserId }, 201);
  } catch (err: any) {
    return handleError(c, err);
  }
});

router.get("/users/:userId", async (c: Context) => {
  try {
    const result: any = await getClient().send(
      new DescribeUserCommand({
        IdentityStoreId: storeId(c),
        UserId: c.req.param("userId")!,
      })
    );
    return c.json({ user: result || null });
  } catch (err: any) {
    return handleError(c, err);
  }
});

router.put("/users/:userId", async (c: Context) => {
  try {
    const body: any = await readJson(c);
    if (!body?.displayName)
      return c.json({ error: "displayName is required" }, 400);
    // Identity Store updates are AWS operation-lists, not field patches.
    await getClient().send(
      new UpdateUserCommand({
        IdentityStoreId: storeId(c),
        UserId: c.req.param("userId")!,
        Operations: [
          { AttributePath: "displayName", AttributeValue: body.displayName },
        ],
      })
    );
    return c.json({ ok: true });
  } catch (err: any) {
    return handleError(c, err);
  }
});

router.delete("/users/:userId", async (c: Context) => {
  try {
    await getClient().send(
      new DeleteUserCommand({
        IdentityStoreId: storeId(c),
        UserId: c.req.param("userId")!,
      })
    );
    return c.json({ ok: true });
  } catch (err: any) {
    return handleError(c, err);
  }
});

// ── Groups ───────────────────────────────────────────────

router.get("/groups", async (c: Context) => {
  try {
    const result: any = await getClient().send(
      new ListGroupsCommand({ IdentityStoreId: storeId(c) })
    );
    return c.json({ groups: result.Groups || [], total: result.Groups?.length || 0 });
  } catch (err: any) {
    return handleError(c, err);
  }
});

router.post("/groups", async (c: Context) => {
  try {
    const body: any = await readJson(c);
    if (!body?.displayName) return c.json({ error: "displayName is required" }, 400);
    const result: any = await getClient().send(
      new CreateGroupCommand({
        IdentityStoreId: storeId(c),
        DisplayName: body.displayName,
        Description: body.description,
      })
    );
    return c.json({ groupId: result.GroupId }, 201);
  } catch (err: any) {
    return handleError(c, err);
  }
});

router.get("/groups/:groupId", async (c: Context) => {
  try {
    const result: any = await getClient().send(
      new DescribeGroupCommand({
        IdentityStoreId: storeId(c),
        GroupId: c.req.param("groupId")!,
      })
    );
    return c.json({ group: result || null });
  } catch (err: any) {
    return handleError(c, err);
  }
});

router.put("/groups/:groupId", async (c: Context) => {
  try {
    const body: any = await readJson(c);
    if (!body?.description) return c.json({ error: "description is required" }, 400);
    await getClient().send(
      new UpdateGroupCommand({
        IdentityStoreId: storeId(c),
        GroupId: c.req.param("groupId")!,
        Operations: [
          { AttributePath: "description", AttributeValue: body.description },
        ],
      })
    );
    return c.json({ ok: true });
  } catch (err: any) {
    return handleError(c, err);
  }
});

router.delete("/groups/:groupId", async (c: Context) => {
  try {
    await getClient().send(
      new DeleteGroupCommand({
        IdentityStoreId: storeId(c),
        GroupId: c.req.param("groupId")!,
      })
    );
    return c.json({ ok: true });
  } catch (err: any) {
    return handleError(c, err);
  }
});

// ── Memberships ──────────────────────────────────────────

router.get("/groups/:groupId/memberships", async (c: Context) => {
  try {
    const result: any = await getClient().send(
      new ListGroupMembershipsCommand({
        IdentityStoreId: storeId(c),
        GroupId: c.req.param("groupId")!,
      })
    );
    return c.json({
      memberships: result.GroupMemberships || [],
      total: result.GroupMemberships?.length || 0,
    });
  } catch (err: any) {
    return handleError(c, err);
  }
});

router.post("/groups/:groupId/memberships", async (c: Context) => {
  try {
    const body: any = await readJson(c);
    if (!body?.userId) return c.json({ error: "userId is required" }, 400);
    const result: any = await getClient().send(
      new CreateGroupMembershipCommand({
        IdentityStoreId: storeId(c),
        GroupId: c.req.param("groupId")!,
        MemberId: { UserId: body.userId },
      })
    );
    return c.json({ membershipId: result.MembershipId }, 201);
  } catch (err: any) {
    return handleError(c, err);
  }
});

router.delete("/memberships/:membershipId", async (c: Context) => {
  try {
    await getClient().send(
      new DeleteGroupMembershipCommand({
        IdentityStoreId: storeId(c),
        MembershipId: c.req.param("membershipId")!,
      })
    );
    return c.json({ ok: true });
  } catch (err: any) {
    return handleError(c, err);
  }
});

export default router;
