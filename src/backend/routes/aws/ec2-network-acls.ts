import { Hono } from "hono";
import type { Context } from "hono";
import {
  EC2Client,
  CreateNetworkAclCommand,
  DescribeNetworkAclsCommand,
  DeleteNetworkAclCommand,
  CreateNetworkAclEntryCommand,
  ReplaceNetworkAclEntryCommand,
  DeleteNetworkAclEntryCommand,
  ReplaceNetworkAclAssociationCommand,
} from "@aws-sdk/client-ec2";
import { getAwsConfig } from "../../clients/aws";
import { sanitizeName } from "../../clients/sanitize";

const router = new Hono();

function ec2(): EC2Client {
  return new EC2Client(getAwsConfig());
}

// ─── List Network ACLs ────────────────────────────────────────────

router.get("/network-acls", async (c: Context) => {
  const filterVpc = c.req.query("vpcId");
  const params: any = {};
  if (filterVpc) {
/* istanbul ignore next */
    params.Filters = [{ Name: "vpc-id", Values: [filterVpc] }];
  }

  const result = await ec2().send(new DescribeNetworkAclsCommand(params));
  const acls = (result.NetworkAcls || []).map((acl: any) => ({
    networkAclId: acl.NetworkAclId,
    vpcId: acl.VpcId,
    isDefault: acl.IsDefault,
    ownerId: acl.OwnerId,
    entries: (acl.Entries || []).map((e: any) => ({
      ruleNumber: e.RuleNumber,
      protocol: e.Protocol,
      ruleAction: e.RuleAction,
      egress: e.Egress,
      cidrBlock: e.CidrBlock,
      portRange: e.PortRange
        ? { from: e.PortRange.From, to: e.PortRange.To }
        : null,
    })),
    associations: (acl.Associations || []).map((a: any) => ({
      networkAclAssociationId: a.NetworkAclAssociationId,
      networkAclId: a.NetworkAclId,
      subnetId: a.SubnetId,
    })),
    tags: (acl.Tags || []).map((t: any) => ({ key: t.Key, value: t.Value })),
  }));
  return c.json({ networkAcls: acls, total: acls.length });
});

// ─── Create Network ACL ───────────────────────────────────────────

router.post("/network-acls", async (c: Context) => {
  const { vpcId } = await c.req.json<{ vpcId: string }>();
  if (!vpcId) return c.json({ error: "vpcId is required" }, 400);

  const result = await ec2().send(
    new CreateNetworkAclCommand({
      VpcId: sanitizeName(vpcId, 256),
    })
  );
  return c.json({
    networkAclId: result.NetworkAcl?.NetworkAclId,
    vpcId: result.NetworkAcl?.VpcId,
    created: true,
  });
});

// ─── Delete Network ACL ───────────────────────────────────────────

router.delete("/network-acls/:id", async (c: Context) => {
  const id = c.req.param("id");
  await ec2().send(new DeleteNetworkAclCommand({ NetworkAclId: id! }));
  return c.json({ id, deleted: true });
});

// ─── Create Network ACL Entry ─────────────────────────────────────

router.post("/network-acls/:id/entries", async (c: Context) => {
  const networkAclId = c.req.param("id");
  const body = await c.req.json<{
    ruleNumber: number;
    protocol: string;
    ruleAction: string;
    egress: boolean;
    cidrBlock: string;
    portRangeFrom?: number;
    portRangeTo?: number;
  }>();

  if (!body.protocol || !body.ruleAction || !body.cidrBlock) {
    return c.json(
      { error: "protocol, ruleAction, and cidrBlock are required" },
      400
    );
  }

  const params: any = {
    NetworkAclId: networkAclId!,
    RuleNumber: body.ruleNumber ?? 100,
    Protocol: body.protocol,
    RuleAction: body.ruleAction,
    Egress: body.egress ?? false,
    CidrBlock: body.cidrBlock,
  };
  if (body.portRangeFrom !== undefined && body.portRangeTo !== undefined) {
    params.PortRange = { From: body.portRangeFrom, To: body.portRangeTo };
  }

  await ec2().send(new CreateNetworkAclEntryCommand(params));
  return c.json({ networkAclId, ruleAdded: true });
});

// ─── Replace Network ACL Entry ────────────────────────────────────

router.put("/network-acls/:id/entries/:ruleNumber", async (c: Context) => {
  const networkAclId = c.req.param("id");
  const ruleNumber = parseInt(c.req.param("ruleNumber")!);
  const body = await c.req.json<{
    protocol: string;
    ruleAction: string;
    egress: boolean;
    cidrBlock: string;
    portRangeFrom?: number;
    portRangeTo?: number;
  }>();

  if (!body.protocol || !body.ruleAction || !body.cidrBlock) {
    return c.json(
      { error: "protocol, ruleAction, and cidrBlock are required" },
      400
    );
  }

  const params: any = {
    NetworkAclId: networkAclId!,
    RuleNumber: ruleNumber,
    Protocol: body.protocol,
    RuleAction: body.ruleAction,
    Egress: body.egress ?? false,
    CidrBlock: body.cidrBlock,
  };
  if (body.portRangeFrom !== undefined && body.portRangeTo !== undefined) {
    params.PortRange = { From: body.portRangeFrom, To: body.portRangeTo };
  }

  await ec2().send(new ReplaceNetworkAclEntryCommand(params));
  return c.json({ networkAclId, ruleNumber, replaced: true });
});

// ─── Delete Network ACL Entry ─────────────────────────────────────

router.delete(
  "/network-acls/:id/entries/:ruleNumber",
  async (c: Context) => {
    const networkAclId = c.req.param("id");
    const ruleNumber = parseInt(c.req.param("ruleNumber")!);
    const egress = c.req.query("egress") === "true";

    await ec2().send(
      new DeleteNetworkAclEntryCommand({
        NetworkAclId: networkAclId!,
        RuleNumber: ruleNumber,
        Egress: egress,
      })
    );
    return c.json({ networkAclId, ruleNumber, egress, deleted: true });
  }
);

// ─── Replace Network ACL Association ──────────────────────────────

router.post("/network-acls/:id/associations", async (c: Context) => {
  const networkAclId = c.req.param("id");
  const { associationId } = await c.req.json<{ associationId: string }>();
  if (!associationId) {
    return c.json({ error: "associationId is required" }, 400);
  }

  const result = await ec2().send(
    new ReplaceNetworkAclAssociationCommand({
      AssociationId: associationId,
      NetworkAclId: networkAclId!,
    })
  );
  return c.json({
    newAssociationId: result.NewAssociationId,
    replaced: true,
  });
});

export default router;
