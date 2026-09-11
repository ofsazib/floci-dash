import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { Route53ResolverClient } from "@aws-sdk/client-route53resolver";
import {
  CreateFirewallDomainListCommand,
  CreateResolverEndpointCommand,
  CreateResolverRuleCommand,
  DeleteFirewallDomainListCommand,
  DeleteResolverEndpointCommand,
  DeleteResolverRuleCommand,
  GetFirewallDomainListCommand,
  GetResolverEndpointCommand,
  GetResolverRuleAssociationCommand,
  GetResolverRuleCommand,
  ListFirewallDomainListsCommand,
  ListResolverEndpointsCommand,
  ListResolverRuleAssociationsCommand,
  ListResolverRulesCommand,
  UpdateResolverEndpointCommand,
  UpdateResolverRuleCommand,
  AssociateResolverRuleCommand,
  DisassociateResolverRuleCommand,
} from "@aws-sdk/client-route53resolver";

const router = new Hono();
const getClient = () => create(Route53ResolverClient);

const badRequest = (c: Context, msg: string) => c.json({ error: msg }, 400);

const body = async (c: Context): Promise<any> => {
  try {
    return await c.req.json();
  } catch {
    return {};
  }
};

// ---------- Firewall domain lists ----------

router.get("/firewall-domain-lists", async (c: Context) => {
  const result: any = await getClient().send(new ListFirewallDomainListsCommand({}));
  const lists = (result?.FirewallDomainLists || []).map((l: any) => ({
    id: l.Id,
    arn: l.Arn,
    name: l.Name,
    managedOwnerName: l.ManagedOwnerName || null,
    creatorRequestId: l.CreatorRequestId || null,
    domainCount: l.DomainCount ?? null,
    status: l.Status || null,
  }));
  return c.json({ domainLists: lists, total: lists.length });
});

router.post("/firewall-domain-lists", async (c: Context) => {
  const b = await body(c);
  const Name = b.name;
  if (!Name) return badRequest(c, "name is required");
  const result: any = await getClient().send(
    new CreateFirewallDomainListCommand({ Name, CreatorRequestId: b.creatorRequestId }),
  );
  const l = result?.FirewallDomainList || {};
  return c.json({ id: l.Id, name: l.Name, status: l.Status, arn: l.Arn }, 201);
});

router.get("/firewall-domain-lists/:id", async (c: Context) => {
  const result: any = await getClient().send(
    new GetFirewallDomainListCommand({ FirewallDomainListId: c.req.param("id") }),
  );
  const l = result?.FirewallDomainList;
  if (!l) return c.json({ domainList: null });
  return c.json({
    domainList: {
      id: l.Id,
      arn: l.Arn,
      name: l.Name,
      managedOwnerName: l.ManagedOwnerName || null,
      domainCount: l.DomainCount ?? null,
      status: l.Status || null,
    },
  });
});

router.delete("/firewall-domain-lists/:id", async (c: Context) => {
  const result: any = await getClient().send(
    new DeleteFirewallDomainListCommand({ FirewallDomainListId: c.req.param("id") }),
  );
  const l = result?.FirewallDomainList || {};
  return c.json({ id: l.Id, status: l.Status });
});

// ---------- Resolver endpoints ----------

router.get("/endpoints", async (c: Context) => {
  const result: any = await getClient().send(new ListResolverEndpointsCommand({}));
  const endpoints = (result?.ResolverEndpoints || []).map((e: any) => ({
    id: e.Id,
    arn: e.Arn,
    name: e.Name || null,
    direction: e.Direction || null,
    status: e.Status || null,
    ipAddressCount: e.IpAddressCount ?? 0,
    hostVpcId: e.HostVPCId || null,
    securityGroupIds: e.SecurityGroupIds || [],
    endpointType: e.ResolverEndpointType || null,
  }));
  return c.json({ endpoints, total: endpoints.length });
});

router.post("/endpoints", async (c: Context) => {
  const b = await body(c);
  const Name = b.name;
  const Direction = b.direction;
  const IpAddresses = b.ipAddresses;
  if (!Name) return badRequest(c, "name is required");
  if (!Direction) return badRequest(c, "direction is required");
  if (!Array.isArray(IpAddresses) || IpAddresses.length === 0)
    return badRequest(c, "at least one IP address is required");
  const result: any = await getClient().send(
    new CreateResolverEndpointCommand({
      Name,
      Direction,
      IpAddresses,
      SecurityGroupIds: b.securityGroupIds || [],
      CreatorRequestId: b.creatorRequestId,
    }),
  );
  const e = result?.ResolverEndpoint || {};
  return c.json({ id: e.Id, name: e.Name, status: e.Status, direction: e.Direction }, 201);
});

router.get("/endpoints/:id", async (c: Context) => {
  const result: any = await getClient().send(
    new GetResolverEndpointCommand({ ResolverEndpointId: c.req.param("id") }),
  );
  const e = result?.ResolverEndpoint;
  if (!e) return c.json({ endpoint: null });
  return c.json({
    endpoint: {
      id: e.Id,
      arn: e.Arn,
      name: e.Name || null,
      direction: e.Direction || null,
      status: e.Status || null,
      ipAddressCount: e.IpAddressCount ?? 0,
      hostVpcId: e.HostVPCId || null,
    },
  });
});

router.patch("/endpoints/:id", async (c: Context) => {
  const b = await body(c);
  const input: any = { ResolverEndpointId: c.req.param("id") };
  if (b.name) input.Name = b.name;
  if (b.endpointType) input.ResolverEndpointType = b.endpointType;
  const result: any = await getClient().send(new UpdateResolverEndpointCommand(input));
  const e = result?.ResolverEndpoint || {};
  return c.json({ id: e.Id, name: e.Name, status: e.Status });
});

router.delete("/endpoints/:id", async (c: Context) => {
  const result: any = await getClient().send(
    new DeleteResolverEndpointCommand({ ResolverEndpointId: c.req.param("id") }),
  );
  const e = result?.ResolverEndpoint || {};
  return c.json({ id: e.Id, status: e.Status });
});

// ---------- Resolver rules ----------

router.get("/rules", async (c: Context) => {
  const result: any = await getClient().send(new ListResolverRulesCommand({}));
  const rules = (result?.ResolverRules || []).map((r: any) => ({
    id: r.Id,
    arn: r.Arn,
    name: r.Name || null,
    domainName: r.DomainName || null,
    ruleType: r.RuleType || null,
    status: r.Status || null,
    resolverEndpointId: r.ResolverEndpointId || null,
    targetIps: r.TargetIps || [],
    shareStatus: r.ShareStatus || null,
  }));
  return c.json({ rules, total: rules.length });
});

router.post("/rules", async (c: Context) => {
  const b = await body(c);
  const Name = b.name;
  const RuleType = b.ruleType;
  const DomainName = b.domainName;
  const TargetIps = b.targetIps;
  if (!Name) return badRequest(c, "name is required");
  if (!RuleType) return badRequest(c, "ruleType is required");
  if (Array.isArray(TargetIps) && TargetIps.length === 0)
    return badRequest(c, "targetIps must contain at least one address when provided");
  const result: any = await getClient().send(
    new CreateResolverRuleCommand({
      Name,
      RuleType,
      DomainName,
      TargetIps,
      ResolverEndpointId: b.resolverEndpointId,
      CreatorRequestId: b.creatorRequestId,
    }),
  );
  const r = result?.ResolverRule || {};
  return c.json({ id: r.Id, name: r.Name, ruleType: r.RuleType, status: r.Status }, 201);
});

router.get("/rules/:id", async (c: Context) => {
  const result: any = await getClient().send(
    new GetResolverRuleCommand({ ResolverRuleId: c.req.param("id") }),
  );
  const r = result?.ResolverRule;
  if (!r) return c.json({ rule: null });
  return c.json({
    rule: {
      id: r.Id,
      arn: r.Arn,
      name: r.Name || null,
      domainName: r.DomainName || null,
      ruleType: r.RuleType || null,
      status: r.Status || null,
      targetIps: r.TargetIps || [],
    },
  });
});

router.patch("/rules/:id", async (c: Context) => {
  const b = await body(c);
  const Config: any = {};
  if (b.name) Config.Name = b.name;
  if (b.targetIps) Config.TargetIps = b.targetIps;
  if (b.resolverEndpointId)
    Config.ResolverEndpointId = b.resolverEndpointId;
  const result: any = await getClient().send(
    new UpdateResolverRuleCommand({ ResolverRuleId: c.req.param("id"), Config }),
  );
  const r = result?.ResolverRule || {};
  return c.json({ id: r.Id, name: r.Name, status: r.Status });
});

router.delete("/rules/:id", async (c: Context) => {
  const result: any = await getClient().send(
    new DeleteResolverRuleCommand({ ResolverRuleId: c.req.param("id") }),
  );
  const r = result?.ResolverRule || {};
  return c.json({ id: r.Id, status: r.Status });
});

// ---------- Resolver rule associations ----------

router.get("/rule-associations", async (c: Context) => {
  const result: any = await getClient().send(new ListResolverRuleAssociationsCommand({}));
  const associations = (result?.ResolverRuleAssociations || []).map((a: any) => ({
    id: a.Id,
    resolverRuleId: a.ResolverRuleId || null,
    name: a.Name || null,
    vpcId: a.VPCId || null,
    status: a.Status || null,
  }));
  return c.json({ associations, total: associations.length });
});

router.post("/rule-associations", async (c: Context) => {
  const b = await body(c);
  const ResolverRuleId = b.resolverRuleId;
  const VPCId = b.vpcId;
  if (!ResolverRuleId) return badRequest(c, "resolverRuleId is required");
  if (!VPCId) return badRequest(c, "vpcId is required");
  const result: any = await getClient().send(
    new AssociateResolverRuleCommand({ ResolverRuleId, VPCId, Name: b.name }),
  );
  const a = result?.ResolverRuleAssociation || {};
  return c.json({ id: a.Id, status: a.Status, vpcId: a.VPCId }, 201);
});

router.post("/rule-associations/disassociate", async (c: Context) => {
  const b = await body(c);
  const ResolverRuleId = b.resolverRuleId;
  const VPCId = b.vpcId;
  if (!ResolverRuleId) return badRequest(c, "resolverRuleId is required");
  if (!VPCId) return badRequest(c, "vpcId is required");
  const result: any = await getClient().send(
    new DisassociateResolverRuleCommand({ ResolverRuleId, VPCId }),
  );
  const a = result?.ResolverRuleAssociation || {};
  return c.json({ id: a.Id, status: a.Status });
});

router.get("/rule-associations/:id", async (c: Context) => {
  const result: any = await getClient().send(
    new GetResolverRuleAssociationCommand({ ResolverRuleAssociationId: c.req.param("id") }),
  );
  const a = result?.ResolverRuleAssociation;
  if (!a) return c.json({ association: null });
  return c.json({
    association: {
      id: a.Id,
      resolverRuleId: a.ResolverRuleId || null,
      name: a.Name || null,
      vpcId: a.VPCId || null,
      status: a.Status || null,
    },
  });
});

export default router;
