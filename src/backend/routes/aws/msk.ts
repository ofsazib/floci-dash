import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { KafkaClient } from "@aws-sdk/client-kafka";
import {
  ListClustersV2Command,
  DescribeClusterV2Command,
  CreateClusterV2Command,
  DeleteClusterCommand,
  GetBootstrapBrokersCommand,
  ListConfigurationsCommand,
  DescribeConfigurationCommand,
  CreateConfigurationCommand,
  DeleteConfigurationCommand,
  UpdateConfigurationCommand,
  ListConfigurationRevisionsCommand,
  DescribeConfigurationRevisionCommand,
} from "@aws-sdk/client-kafka";

const router = new Hono();
const getClient = () => create(KafkaClient);

// ── Clusters ─────────────────────────────────────────────

router.get("/clusters", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListClustersV2Command({}));
  const clusters = result.ClusterInfoList || [];
  return c.json({ clusters, total: clusters.length });
});

router.get("/clusters/:arn", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn")!);
  const client = getClient();
  const result = await client.send(new DescribeClusterV2Command({ ClusterArn: arn }));
  return c.json({ cluster: result.ClusterInfo });
});

router.post("/clusters", async (c: Context) => {
  const body = await c.req.json<{
    clusterName: string;
    kafkaVersion?: string;
    brokerNodeCount?: number;
  }>();
  if (!body.clusterName) return c.json({ error: "clusterName is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new CreateClusterV2Command({
      ClusterName: body.clusterName,
      Provisioned: {
        BrokerNodeGroupInfo: {
          InstanceType: "kafka.m5.large",
          ClientSubnets: [],
          BrokerAZDistribution: "DEFAULT",
        },
        KafkaVersion: body.kafkaVersion || "3.5.1",
        NumberOfBrokerNodes: body.brokerNodeCount || 1,
      } as any,
    })
  );
  return c.json({ clusterArn: result.ClusterArn, clusterName: result.ClusterName, state: result.State }, 201);
});

router.delete("/clusters/:arn", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn")!);
  const client = getClient();
  const result = await client.send(new DeleteClusterCommand({ ClusterArn: arn }));
  return c.json({ clusterArn: result.ClusterArn, state: result.State, deleted: true });
});

// ── Bootstrap Brokers ────────────────────────────────────

router.get("/clusters/:arn/bootstrap-brokers", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn")!);
  const client = getClient();
  const result = await client.send(new GetBootstrapBrokersCommand({ ClusterArn: arn }));
  return c.json({
    bootstrapBrokerString: result.BootstrapBrokerString,
    bootstrapBrokerStringTls: result.BootstrapBrokerStringTls,
  });
});

// ── Configurations ──────────────────────────────────────

router.get("/configurations", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListConfigurationsCommand({}));
  return c.json({ configurations: result.Configurations || [] });
});

router.get("/configurations/:arn", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn")!);
  const client = getClient();
  const result = await client.send(new DescribeConfigurationCommand({ Arn: arn }));
  return c.json({ configuration: result });
});

router.post("/configurations", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.Name) return c.json({ error: "Name is required" }, 400);
  const client = getClient();
  const result = await client.send(new CreateConfigurationCommand(body));
  return c.json({ arn: result.Arn, name: result.Name, state: result.State }, 201);
});

router.delete("/configurations/:arn", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn")!);
  const client = getClient();
  const result = await client.send(new DeleteConfigurationCommand({ Arn: arn }));
  return c.json({ arn: result.Arn, state: result.State, deleted: true });
});

router.put("/configurations/:arn", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn")!);
  const body = await c.req.json<any>();
  const client = getClient();
  const result = await client.send(new UpdateConfigurationCommand({ Arn: arn, ...body }));
  return c.json({ arn: result.Arn, latestRevision: result.LatestRevision });
});

router.get("/configurations/:arn/revisions", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn")!);
  const client = getClient();
  const result = await client.send(new ListConfigurationRevisionsCommand({ Arn: arn }));
  return c.json({ revisions: result.Revisions || [] });
});

router.get("/configurations/:arn/revisions/:revision", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn")!);
  const revision = c.req.param("revision")!;
  const client = getClient();
  const result = await client.send(new DescribeConfigurationRevisionCommand({ Arn: arn, Revision: parseInt(revision) }));
  return c.json({ revision: result });
});

export default router;
