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

export default router;
