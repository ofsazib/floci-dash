import { Hono } from "hono";
import type { Context } from "hono";
import {
  CloudWatchClient,
  PutMetricDataCommand,
  ListMetricsCommand,
  GetMetricStatisticsCommand,
  GetMetricDataCommand,
  PutMetricAlarmCommand,
  DescribeAlarmsCommand,
  DeleteAlarmsCommand,
  SetAlarmStateCommand,
  ListTagsForResourceCommand,
  TagResourceCommand,
  UntagResourceCommand,
} from "@aws-sdk/client-cloudwatch";
import { getAwsConfig } from "../../clients/aws";

const router = new Hono();

function cw() {
  return new CloudWatchClient(getAwsConfig());
}

function mapAlarm(a: any) {
  return {
    name: a.AlarmName,
    arn: a.AlarmArn,
    description: a.AlarmDescription,
    metricName: a.MetricName,
    namespace: a.Namespace,
    statistic: a.Statistic,
    period: a.Period,
    unit: a.Unit,
    evaluationPeriods: a.EvaluationPeriods,
    datapointsToAlarm: a.DatapointsToAlarm,
    threshold: a.Threshold,
    comparisonOperator: a.ComparisonOperator,
    treatMissingData: a.TreatMissingData,
    actionsEnabled: a.ActionsEnabled,
    state: a.StateValue,
    stateReason: a.StateReason,
    stateUpdatedTimestamp: a.StateUpdatedTimestamp,
    alarmActions: a.AlarmActions || [],
    okActions: a.OKActions || [],
    insufficientDataActions: a.InsufficientDataActions || [],
    dimensions: (a.Dimensions || []).map((d: any) => ({ name: d.Name, value: d.Value })),
    configurationUpdatedTimestamp: a.AlarmConfigurationUpdatedTimestamp,
  };
}

// ─── METRICS ─────────────────────────────────────────────

router.get("/metrics", async (c: Context) => {
  const namespace = c.req.query("namespace");
  const metricName = c.req.query("metricName");

  const result = await cw().send(
    new ListMetricsCommand({
      Namespace: namespace || undefined,
      MetricName: metricName || undefined,
    })
  );

  const metrics = (result.Metrics || []).map((m: any) => ({
    namespace: m.Namespace,
    metricName: m.MetricName,
    dimensions: (m.Dimensions || []).map((d: any) => ({ name: d.Name, value: d.Value })),
  }));

  const namespaces = [...new Set(metrics.map((m) => m.namespace))].sort();

  return c.json({ metrics, namespaces, total: metrics.length });
});

router.post("/metrics/data", async (c: Context) => {
  const body = await c.req.json<any>();
  await cw().send(
    new PutMetricDataCommand({
      Namespace: body.namespace,
      MetricData: (body.metricData || []).map((d: any) => ({
        MetricName: d.metricName,
        Value: d.value,
        Unit: d.unit,
        Timestamp: d.timestamp ? new Date(d.timestamp) : undefined,
        Dimensions: (d.dimensions || []).map((dim: any) => ({ Name: dim.name, Value: dim.value })),
        StatisticValues: d.statisticValues
          ? {
              SampleCount: d.statisticValues.sampleCount,
              Sum: d.statisticValues.sum,
              Minimum: d.statisticValues.minimum,
              Maximum: d.statisticValues.maximum,
            }
          : undefined,
      })),
    })
  );
  return c.json({ put: true });
});

router.get("/metrics/statistics", async (c: Context) => {
  const namespace = c.req.query("namespace");
  const metricName = c.req.query("metricName");
  const period = parseInt(c.req.query("period") || "60");
  const statistics = (c.req.query("statistics") || "Average").split(",");
  const startTime = c.req.query("startTime") || new Date(Date.now() - 3600000).toISOString();
  const endTime = c.req.query("endTime") || new Date().toISOString();
  const dimsParam = c.req.query("dimensions");

  let dimensions: any[] = [];
  if (dimsParam) {
    try {
      const parsed = JSON.parse(dimsParam);
      dimensions = parsed.map((d: any) => ({ Name: d.name, Value: d.value }));
    } catch { /* ignore */ }
  }

  const result = await cw().send(
    new GetMetricStatisticsCommand({
      Namespace: namespace,
      MetricName: metricName,
      Period: period,
      Statistics: statistics as any,
      StartTime: new Date(startTime),
      EndTime: new Date(endTime),
      Dimensions: dimensions,
    })
  );

  const datapoints = (result.Datapoints || []).map((dp: any) => ({
    timestamp: dp.Timestamp?.getTime(),
    average: dp.Average,
    sum: dp.Sum,
    minimum: dp.Minimum,
    maximum: dp.Maximum,
    sampleCount: dp.SampleCount,
    unit: dp.Unit,
  }));

  datapoints.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

  return c.json({ label: result.Label || metricName, datapoints });
});

router.post("/metrics/data/query", async (c: Context) => {
  const body = await c.req.json<any>();
  const result = await cw().send(
    new GetMetricDataCommand({
      StartTime: new Date(body.startTime || Date.now() - 3600000),
      EndTime: new Date(body.endTime || Date.now()),
      MetricDataQueries: (body.queries || []).map((q: any) => ({
        Id: q.id,
        Label: q.label,
        ReturnData: q.returnData !== false,
        MetricStat: q.metricStat
          ? {
              Period: q.metricStat.period || 60,
              Stat: q.metricStat.stat,
              Unit: q.metricStat.unit,
              Metric: {
                Namespace: q.metricStat.namespace,
                MetricName: q.metricStat.metricName,
                Dimensions: (q.metricStat.dimensions || []).map((d: any) => ({ Name: d.name, Value: d.value })),
              },
            }
          : undefined,
        Expression: q.expression,
      })),
    })
  );

  const results = (result.MetricDataResults || []).map((r: any) => ({
    id: r.Id,
    label: r.Label,
    statusCode: r.StatusCode,
    timestamps: (r.Timestamps || []).map((t: Date) => t.getTime()),
    values: r.Values || [],
  }));

  return c.json({ results });
});

// ─── ALARMS ──────────────────────────────────────────────

router.get("/alarms", async (c: Context) => {
  const alarmNamePrefix = c.req.query("prefix");
  const state = c.req.query("state");

  const result = await cw().send(
    new DescribeAlarmsCommand({
      AlarmNamePrefix: alarmNamePrefix || undefined,
    })
  );

  let alarms = (result.MetricAlarms || []).map(mapAlarm);

  if (state) {
    alarms = alarms.filter((a) => a.state === state);
  }

  return c.json({ alarms, total: alarms.length });
});

router.post("/alarms", async (c: Context) => {
  const body = await c.req.json<any>();
  await cw().send(
    new PutMetricAlarmCommand({
      AlarmName: body.name,
      AlarmDescription: body.description,
      MetricName: body.metricName,
      Namespace: body.namespace,
      Statistic: body.statistic,
      Period: body.period || 60,
      EvaluationPeriods: body.evaluationPeriods || 1,
      DatapointsToAlarm: body.datapointsToAlarm,
      Threshold: body.threshold || 0,
      ComparisonOperator: body.comparisonOperator,
      TreatMissingData: body.treatMissingData,
      ActionsEnabled: body.actionsEnabled !== false,
      AlarmActions: body.alarmActions,
      OKActions: body.okActions,
      Dimensions: (body.dimensions || []).map((d: any) => ({ Name: d.name, Value: d.value })),
      Unit: body.unit,
      Tags: (body.tags || []).map((t: any) => ({ Key: t.key, Value: t.value })),
    })
  );
  return c.json({ name: body.name, created: true });
});

router.delete("/alarms/:name", async (c: Context) => {
  const name = c.req.param("name");
  await cw().send(new DeleteAlarmsCommand({ AlarmNames: [name!] }));
  return c.json({ name, deleted: true });
});

router.put("/alarms/:name/state", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<any>();
  await cw().send(
    new SetAlarmStateCommand({
      AlarmName: name,
      StateValue: body.state,
      StateReason: body.reason,
      StateReasonData: body.reasonData,
    })
  );
  return c.json({ name, state: body.state });
});

// ─── TAGS ────────────────────────────────────────────────

router.get("/tags/:arn", async (c: Context) => {
  const arn = c.req.param("arn");
  const result = await cw().send(new ListTagsForResourceCommand({ ResourceARN: arn }));
  const tags: Record<string, string> = {};
  (result.Tags || []).forEach((t: any) => { tags[t.Key] = t.Value; });
  return c.json({ tags });
});

router.post("/tags/:arn", async (c: Context) => {
  const arn = c.req.param("arn");
  const body = await c.req.json<any>();
  await cw().send(
    new TagResourceCommand({
      ResourceARN: arn,
      Tags: Object.entries(body.tags || {}).map(([k, v]) => ({ Key: k, Value: v as string })),
    })
  );
  return c.json({ tagged: true });
});

router.delete("/tags/:arn", async (c: Context) => {
  const arn = c.req.param("arn");
  const keys = c.req.query("keys")?.split(",") || [];
  await cw().send(new UntagResourceCommand({ ResourceARN: arn, TagKeys: keys }));
  return c.json({ untagged: true });
});

export default router;
