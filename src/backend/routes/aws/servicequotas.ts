import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import {
  ServiceQuotasClient,
  ListServiceQuotasCommand,
  ListAWSDefaultServiceQuotasCommand,
  GetServiceQuotaCommand,
  GetAWSDefaultServiceQuotaCommand,
  RequestServiceQuotaIncreaseCommand,
} from "@aws-sdk/client-service-quotas";

const router = new Hono();
const getClient = () => create(ServiceQuotasClient);

function mapQuota(q: any) {
  return {
    serviceCode: q.ServiceCode,
    serviceName: q.ServiceName,
    quotaArn: q.QuotaArn,
    quotaCode: q.QuotaCode,
    quotaName: q.QuotaName,
    value: q.Value,
    unit: q.Unit,
    adjustable: q.Adjustable,
    globalQuota: q.GlobalQuota,
    quotaAppliedAtLevel: q.QuotaAppliedAtLevel,
  };
}

router.get("/quotas", async (c: Context) => {
  const serviceCode = c.req.query("serviceCode");
  if (!serviceCode) return c.json({ error: "serviceCode is required" }, 400);
  const defaults = c.req.query("defaults") === "true";
  const client = getClient();
  const shared = {
    ServiceCode: serviceCode,
    QuotaCode: c.req.query("quotaCode") || undefined,
    NextToken: c.req.query("nextToken") || undefined,
    MaxResults: c.req.query("maxResults") ? Number(c.req.query("maxResults")) : undefined,
  };
  const result = defaults
    ? await client.send(new ListAWSDefaultServiceQuotasCommand(shared))
    : await client.send(new ListServiceQuotasCommand(shared));
  const quotas = (result.Quotas || []).map(mapQuota);
  return c.json({ quotas, total: quotas.length, nextToken: result.NextToken ?? null, defaults });
});

router.get("/quotas/:serviceCode/:quotaCode", async (c: Context) => {
  const serviceCode = c.req.param("serviceCode")!;
  const quotaCode = c.req.param("quotaCode")!;
  const defaults = c.req.query("defaults") === "true";
  const client = getClient();
  const params = { ServiceCode: serviceCode, QuotaCode: quotaCode };
  const result = defaults
    ? await client.send(new GetAWSDefaultServiceQuotaCommand(params))
    : await client.send(new GetServiceQuotaCommand(params));
  const quota = result.Quota ? mapQuota(result.Quota) : null;
  return c.json({ quota, defaults });
});

router.post("/quotas/request-increase", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.serviceCode) return c.json({ error: "serviceCode is required" }, 400);
  if (!body.quotaCode) return c.json({ error: "quotaCode is required" }, 400);
  if (body.desiredValue === undefined || body.desiredValue === null || Number.isNaN(Number(body.desiredValue))) {
    return c.json({ error: "desiredValue is required" }, 400);
  }
  const client = getClient();
  const result = await client.send(
    new RequestServiceQuotaIncreaseCommand({
      ServiceCode: body.serviceCode,
      QuotaCode: body.quotaCode,
      DesiredValue: Number(body.desiredValue),
      ContextId: body.contextId,
    })
  );
  const rq = result.RequestedQuota;
  return c.json({
    requestedQuota: rq
      ? {
          id: rq.Id,
          serviceCode: rq.ServiceCode,
          serviceName: rq.ServiceName,
          quotaCode: rq.QuotaCode,
          quotaName: rq.QuotaName,
          quotaArn: rq.QuotaArn,
          desiredValue: rq.DesiredValue,
          status: rq.Status,
          requester: rq.Requester,
          created: rq.Created,
          contextId: rq.QuotaContext?.ContextId,
        }
      : null,
  });
});

export default router;
