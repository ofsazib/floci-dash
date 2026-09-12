import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import {
  ResourceExplorer2Client,
  AssociateDefaultViewCommand,
  BatchGetViewCommand,
  CreateIndexCommand,
  CreateResourceExplorerSetupCommand,
  CreateViewCommand,
  DeleteIndexCommand,
  DeleteResourceExplorerSetupCommand,
  DeleteViewCommand,
  DisassociateDefaultViewCommand,
  GetAccountLevelServiceConfigurationCommand,
  GetDefaultViewCommand,
  GetIndexCommand,
  GetManagedViewCommand,
  GetResourceExplorerSetupCommand,
  GetServiceIndexCommand,
  GetServiceViewCommand,
  GetViewCommand,
  ListIndexesCommand,
  ListIndexesForMembersCommand,
  ListManagedViewsCommand,
  ListResourcesCommand,
  ListServiceIndexesCommand,
  ListServiceViewsCommand,
  ListStreamingAccessForServicesCommand,
  ListSupportedResourceTypesCommand,
  ListViewsCommand,
  SearchCommand,
  UpdateIndexTypeCommand,
  UpdateViewCommand,
} from "@aws-sdk/client-resource-explorer-2";

const router = new Hono();
const getClient = () => create(ResourceExplorer2Client);

const badRequest = (c: Context, msg: string) => c.json({ error: msg }, 400);

const body = async (c: Context): Promise<any> => {
  try {
    return await c.req.json();
  } catch {
    return {};
  }
};

/** Parses an optional JSON string/object field. */
const parseJsonField = (value: unknown): { parsed?: any; error?: string } => {
  if (value === undefined || value === null || value === "") {
    return {};
  }
  if (typeof value === "object") {
    return { parsed: value };
  }
  try {
    return { parsed: JSON.parse(String(value)) };
  } catch {
    return { error: "must be valid JSON" };
  }
};

const includedProperties = (value: unknown): string[] | undefined => {
  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

// ---------- Indexes ----------

router.get("/indexes", async (c: Context) => {
  const res: any = await getClient().send(new ListIndexesCommand({}));
  const indexes = (res?.Indexes || []).map((i: any) => ({
    arn: i.Arn,
    region: i.Region || null,
    type: i.Type || null,
  }));
  return c.json({ indexes, total: indexes.length });
});

router.post("/indexes", async (c: Context) => {
  const b = await body(c);
  const { parsed: tags, error } = parseJsonField(b.tags);
  if (error) return badRequest(c, `tags ${error}`);
  const res: any = await getClient().send(new CreateIndexCommand({ Tags: tags }));
  return c.json(
    { arn: res?.Arn, createdAt: res?.CreatedAt, state: res?.State },
    201,
  );
});

router.get("/indexes/detail", async (c: Context) => {
  const res: any = await getClient().send(new GetIndexCommand({}));
  return c.json({ index: res });
});

router.delete("/indexes", async (c: Context) => {
  const arn = c.req.query("arn");
  if (!arn) return badRequest(c, "arn is required");
  const res: any = await getClient().send(new DeleteIndexCommand({ Arn: arn }));
  return c.json({ arn: res?.Arn, lastUpdatedAt: res?.LastUpdatedAt, state: res?.State });
});

router.post("/indexes/type", async (c: Context) => {
  const b = await body(c);
  const Arn = b.arn;
  if (!Arn) return badRequest(c, "arn is required");
  const Type = b.type;
  if (!Type) return badRequest(c, "type is required");
  const res: any = await getClient().send(new UpdateIndexTypeCommand({ Arn, Type }));
  return c.json({
    arn: res?.Arn,
    lastUpdatedAt: res?.LastUpdatedAt,
    state: res?.State,
    type: res?.Type,
  });
});

// ---------- Views ----------

router.get("/views", async (c: Context) => {
  const res: any = await getClient().send(new ListViewsCommand({}));
  const views = (res?.Views || []).map((arn: string) => ({ arn }));
  return c.json({ views, total: views.length });
});

router.post("/views", async (c: Context) => {
  const b = await body(c);
  const ViewName = b.viewName;
  if (!ViewName) return badRequest(c, "viewName is required");
  const props = includedProperties(b.includedProperties);
  const res: any = await getClient().send(
    new CreateViewCommand({
      ViewName,
      Filters: b.filters ? { FilterString: b.filters } : undefined,
      IncludedProperties: props ? props.map((Name) => ({ Name })) : undefined,
      Scope: b.scope || undefined,
      Tags: b.tags,
    }),
  );
  return c.json({ view: res?.View }, 201);
});

router.get("/views/detail", async (c: Context) => {
  const arn = c.req.query("arn");
  if (!arn) return badRequest(c, "arn is required");
  const res: any = await getClient().send(new GetViewCommand({ ViewArn: arn }));
  return c.json({ view: res?.View, tags: res?.Tags || {} });
});

router.put("/views/update", async (c: Context) => {
  const b = await body(c);
  const ViewArn = b.viewArn;
  if (!ViewArn) return badRequest(c, "viewArn is required");
  const props = includedProperties(b.includedProperties);
  const res: any = await getClient().send(
    new UpdateViewCommand({
      ViewArn,
      Filters: b.filters ? { FilterString: b.filters } : undefined,
      IncludedProperties: props ? props.map((Name) => ({ Name })) : undefined,
    }),
  );
  return c.json({ view: res?.View });
});

router.delete("/views", async (c: Context) => {
  const arn = c.req.query("arn");
  if (!arn) return badRequest(c, "arn is required");
  await getClient().send(new DeleteViewCommand({ ViewArn: arn }));
  return c.json({ viewArn: arn });
});

router.post("/views/batch-get", async (c: Context) => {
  const b = await body(c);
  const res: any = await getClient().send(new BatchGetViewCommand({ ViewArns: b.viewArns || [] }));
  return c.json({ views: res?.Views || [], errors: res?.Errors || [] });
});

router.post("/views/associate-default", async (c: Context) => {
  const b = await body(c);
  const ViewArn = b.viewArn;
  if (!ViewArn) return badRequest(c, "viewArn is required");
  await getClient().send(new AssociateDefaultViewCommand({ ViewArn }));
  return c.json({ viewArn: ViewArn });
});

router.post("/views/disassociate-default", async (c: Context) => {
  await getClient().send(new DisassociateDefaultViewCommand({}));
  return c.json({ ok: true });
});

router.get("/views/default", async (c: Context) => {
  const res: any = await getClient().send(new GetDefaultViewCommand({}));
  return c.json({ viewArn: res?.ViewArn || null });
});

// ---------- Search and resources ----------

router.get("/resources", async (c: Context) => {
  const filter = c.req.query("filter");
  const res: any = await getClient().send(
    filter ? new ListResourcesCommand({ Filters: { FilterString: filter } }) : new ListResourcesCommand({}),
  );
  const resources = (res?.Resources || []).map((r: any) => ({
    arn: r.Arn,
    resourceType: r.ResourceType || null,
    region: r.Region || null,
    service: r.Service || null,
    owningAccountId: r.OwningAccountId || null,
    lastReportedAt: r.LastReportedAt || null,
  }));
  return c.json({ resources, viewArn: res?.ViewArn || null, total: resources.length });
});

router.post("/search", async (c: Context) => {
  const b = await body(c);
  const QueryString = b.queryString;
  if (!QueryString) return badRequest(c, "queryString is required");
  const res: any = await getClient().send(
    new SearchCommand({
      QueryString,
      ViewArn: b.viewArn || undefined,
      MaxResults: b.maxResults || undefined,
    }),
  );
  const resources = (res?.Resources || []).map((r: any) => ({
    arn: r.Arn,
    resourceType: r.ResourceType || null,
    region: r.Region || null,
    service: r.Service || null,
    owningAccountId: r.OwningAccountId || null,
  }));
  return c.json({ resources, viewArn: res?.ViewArn || null, total: resources.length });
});

router.get("/resource-types", async (c: Context) => {
  const res: any = await getClient().send(new ListSupportedResourceTypesCommand({}));
  const types = (res?.Types || []).map((t: any) => ({
    resourceType: t.ResourceType || null,
    service: t.Service || null,
  }));
  return c.json({ types, total: types.length });
});

router.get("/service-config", async (c: Context) => {
  const res: any = await getClient().send(new GetAccountLevelServiceConfigurationCommand({}));
  return c.json(res);
});

// ---------- Member and service-scoped surfaces ----------

router.get("/member-indexes", async (c: Context) => {
  const accounts = (c.req.query("accounts") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!accounts.length) return badRequest(c, "accounts is required");
  const res: any = await getClient().send(
    new ListIndexesForMembersCommand({ AccountIdList: accounts }),
  );
  return c.json(res);
});

router.get("/managed-views", async (c: Context) => {
  const res: any = await getClient().send(new ListManagedViewsCommand({}));
  return c.json(res);
});

router.get("/managed-views/detail", async (c: Context) => {
  const arn = c.req.query("arn");
  if (!arn) return badRequest(c, "arn is required");
  const res: any = await getClient().send(new GetManagedViewCommand({ ManagedViewArn: arn }));
  return c.json(res);
});

router.get("/service-views", async (c: Context) => {
  const res: any = await getClient().send(new ListServiceViewsCommand({}));
  return c.json(res);
});

router.get("/service-views/detail", async (c: Context) => {
  const arn = c.req.query("arn");
  if (!arn) return badRequest(c, "arn is required");
  const res: any = await getClient().send(new GetServiceViewCommand({ ServiceViewArn: arn }));
  return c.json(res);
});

router.get("/service-indexes", async (c: Context) => {
  const res: any = await getClient().send(new ListServiceIndexesCommand({}));
  return c.json(res);
});

router.get("/service-index", async (c: Context) => {
  const res: any = await getClient().send(new GetServiceIndexCommand({}));
  return c.json(res);
});

router.get("/streaming-access", async (c: Context) => {
  const res: any = await getClient().send(new ListStreamingAccessForServicesCommand({}));
  return c.json(res);
});

// ---------- Setup tasks ----------

router.post("/setup", async (c: Context) => {
  const b = await body(c);
  const RegionList = Array.isArray(b.regionList) ? b.regionList : [];
  if (!RegionList.length) return badRequest(c, "regionList is required");
  const res: any = await getClient().send(
    new CreateResourceExplorerSetupCommand({
      RegionList,
      ViewName: b.viewName || undefined,
      AggregatorRegions: Array.isArray(b.aggregatorRegions) ? b.aggregatorRegions : undefined,
    }),
  );
  return c.json({ taskId: res?.TaskId }, 201);
});

router.post("/setup/delete", async (c: Context) => {
  const b = await body(c);
  const RegionList = Array.isArray(b.regionList) ? b.regionList : [];
  if (!RegionList.length) return badRequest(c, "regionList is required");
  const res: any = await getClient().send(
    new DeleteResourceExplorerSetupCommand({
      DeleteInAllRegions: !!b.deleteInAllRegions,
      RegionList,
    }),
  );
  return c.json({ taskId: res?.TaskId });
});

router.get("/setup", async (c: Context) => {
  const taskId = c.req.query("taskId");
  if (!taskId) return badRequest(c, "taskId is required");
  const res: any = await getClient().send(new GetResourceExplorerSetupCommand({ TaskId: taskId }));
  return c.json(res);
});

export default router;
