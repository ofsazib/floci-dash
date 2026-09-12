import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import {
  NetworkFirewallClient,
  AssociateAvailabilityZonesCommand,
  AssociateFirewallPolicyCommand,
  AssociateSubnetsCommand,
  CreateFirewallCommand,
  CreateFirewallPolicyCommand,
  CreateRuleGroupCommand,
  DeleteFirewallCommand,
  DeleteFirewallPolicyCommand,
  DeleteRuleGroupCommand,
  DescribeFirewallCommand,
  DescribeFirewallPolicyCommand,
  DescribeLoggingConfigurationCommand,
  DescribeRuleGroupCommand,
  DisassociateAvailabilityZonesCommand,
  DisassociateSubnetsCommand,
  ListFirewallPoliciesCommand,
  ListFirewallsCommand,
  ListRuleGroupsCommand,
  UpdateAvailabilityZoneChangeProtectionCommand,
  UpdateFirewallAnalysisSettingsCommand,
  UpdateFirewallDeleteProtectionCommand,
  UpdateFirewallDescriptionCommand,
  UpdateFirewallPolicyChangeProtectionCommand,
  UpdateFirewallPolicyCommand,
  UpdateLoggingConfigurationCommand,
  UpdateRuleGroupCommand,
  UpdateSubnetChangeProtectionCommand,
} from "@aws-sdk/client-network-firewall";

const router = new Hono();
const getClient = () => create(NetworkFirewallClient);

const badRequest = (c: Context, msg: string) => c.json({ error: msg }, 400);

const body = async (c: Context): Promise<any> => {
  try {
    return await c.req.json();
  } catch {
    return {};
  }
};

/** FirewallArn/FirewallName pair resolved from the body (arn or name, at least one). */
const firewallRef = (b: any) => ({
  FirewallArn: b.arn || undefined,
  FirewallName: b.name || undefined,
});

const ruleGroupRef = (b: any) => ({
  RuleGroupArn: b.arn || undefined,
  RuleGroupName: b.name || undefined,
});

const policyRef = (b: any) => ({
  FirewallPolicyArn: b.arn || undefined,
  FirewallPolicyName: b.name || undefined,
});

const hasRef = (ref: Record<string, string | undefined>) =>
  !!Object.values(ref).some(Boolean);

const updateFirewallCommands: Record<string, any> = {
  "delete-protection": UpdateFirewallDeleteProtectionCommand,
  "policy-change-protection": UpdateFirewallPolicyChangeProtectionCommand,
  "subnet-change-protection": UpdateSubnetChangeProtectionCommand,
  "az-change-protection": UpdateAvailabilityZoneChangeProtectionCommand,
  description: UpdateFirewallDescriptionCommand,
};

const protectionRoute = (kind: string, enabledFlag: boolean) => async (c: Context) => {
  const b = await body(c);
  const ref = firewallRef(b);
  if (!hasRef(ref)) return badRequest(c, "arn or name is required");
  const Cmd = updateFirewallCommands[kind];
  const input: any = enabledFlag ? { ...ref, Enabled: !!b.enabled } : { ...ref };
  if (kind === "description") input.Description = b.description === undefined ? "" : b.description;
  const res: any = await getClient().send(new Cmd(input));
  return c.json({ firewallArn: res?.FirewallArn, updateToken: res?.UpdateToken });
};

const analysisRoute = async (c: Context) => {
  const b = await body(c);
  const ref = firewallRef(b);
  if (!hasRef(ref)) return badRequest(c, "arn or name is required");
  const { parsed, error } = parseJsonField(b.analysisSettings);
  if (error) return badRequest(c, `analysisSettings ${error}`);
  const res: any = await getClient().send(
    new UpdateFirewallAnalysisSettingsCommand({
      ...ref,
      EnabledAnalysisTypes: Array.isArray(parsed) ? parsed : undefined,
    }),
  );
  return c.json({ firewallArn: res?.FirewallArn, analysisSettings: res?.FirewallAnalysisSettings });
};

function parseJsonField(value: unknown): { parsed?: any; error?: string } {
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
}

// ---------- Firewalls ----------

router.get("/firewalls", async (c: Context) => {
  const res: any = await getClient().send(new ListFirewallsCommand({}));
  const firewalls = (res?.Firewalls || []).map((f: any) => ({
    name: f.FirewallName || null,
    arn: f.Arn,
    policyArn: f.FirewallPolicyArn || null,
    vpcId: f.VpcId || null,
    subnetMappings: f.SubnetMappings || [],
  }));
  return c.json({ firewalls, total: firewalls.length });
});

router.post("/firewalls", async (c: Context) => {
  const b = await body(c);
  const FirewallName = b.name;
  if (!FirewallName) return badRequest(c, "name is required");
  if (!b.vpcId) return badRequest(c, "vpcId is required");
  if (!Array.isArray(b.subnetMappings) || !b.subnetMappings.length) {
    return badRequest(c, "at least one subnet mapping is required");
  }
  const res: any = await getClient().send(
    new CreateFirewallCommand({
      FirewallName,
      VpcId: b.vpcId,
      SubnetMappings: b.subnetMappings.map((s: any) =>
        typeof s === "string" ? { SubnetId: s } : s,
      ),
      FirewallPolicyArn: b.policyArn || undefined,
      Description: b.description || undefined,
    }),
  );
  return c.json({ firewall: res?.Firewall, firewallStatus: res?.FirewallStatus }, 201);
});

router.get("/firewalls/detail", async (c: Context) => {
  const ref = firewallRef({
    arn: c.req.query("arn") || undefined,
    name: c.req.query("name") || undefined,
  });
  if (!hasRef(ref)) return badRequest(c, "arn or name is required");
  const res: any = await getClient().send(new DescribeFirewallCommand(ref));
  return c.json({ firewall: res?.Firewall || null, firewallStatus: res?.FirewallStatus || null });
});

router.delete("/firewalls", async (c: Context) => {
  const ref = firewallRef({
    arn: c.req.query("arn") || undefined,
    name: c.req.query("name") || undefined,
  });
  if (!hasRef(ref)) return badRequest(c, "arn or name is required");
  const res: any = await getClient().send(new DeleteFirewallCommand(ref));
  return c.json({ firewall: res?.Firewall });
});

router.put("/firewalls/delete-protection", protectionRoute("delete-protection", true));
router.put("/firewalls/policy-change-protection", protectionRoute("policy-change-protection", true));
router.put("/firewalls/subnet-change-protection", protectionRoute("subnet-change-protection", true));
router.put("/firewalls/az-change-protection", protectionRoute("az-change-protection", true));
router.put("/firewalls/description", protectionRoute("description", false));
router.put("/firewalls/analysis-settings", analysisRoute);

const subnetsRoute = (Cmd: any) => async (c: Context) => {
  const b = await body(c);
  const ref = firewallRef(b);
  if (!hasRef(ref)) return badRequest(c, "arn or name is required");
  if (!Array.isArray(b.subnetIds) || !b.subnetIds.length) {
    return badRequest(c, "at least one subnet id is required");
  }
  const res: any = await getClient().send(new Cmd({ ...ref, SubnetIds: b.subnetIds }));
  return c.json({ subnets: res?.Subnets || [], updateToken: res?.UpdateToken });
};

const zonesRoute = (Cmd: any) => async (c: Context) => {
  const b = await body(c);
  const ref = firewallRef(b);
  if (!hasRef(ref)) return badRequest(c, "arn or name is required");
  const res: any = await getClient().send(
    new Cmd({ ...ref, AvailabilityZoneMappings: b.zoneMappings || [] }),
  );
  return c.json({ availabilityZones: res?.AvailabilityZones || [] });
};

router.post("/firewalls/subnets/associate", subnetsRoute(AssociateSubnetsCommand));
router.post("/firewalls/subnets/disassociate", subnetsRoute(DisassociateSubnetsCommand));
router.post("/firewalls/zones/associate", zonesRoute(AssociateAvailabilityZonesCommand));
router.post("/firewalls/zones/disassociate", zonesRoute(DisassociateAvailabilityZonesCommand));

router.put("/firewalls/policy", async (c: Context) => {
  const b = await body(c);
  const ref = firewallRef(b);
  if (!hasRef(ref)) return badRequest(c, "arn or name is required");
  if (!b.policyArn) return badRequest(c, "policyArn is required");
  const res: any = await getClient().send(
    new AssociateFirewallPolicyCommand({ ...ref, FirewallPolicyArn: b.policyArn }),
  );
  return c.json({ firewallArn: res?.FirewallArn, firewallPolicyArn: res?.FirewallPolicyArn });
});

router.put("/firewalls/logging", async (c: Context) => {
  const b = await body(c);
  const ref = firewallRef(b);
  if (!hasRef(ref)) return badRequest(c, "arn or name is required");
  const { parsed, error } = parseJsonField(b.loggingConfiguration);
  if (error) return badRequest(c, `loggingConfiguration ${error}`);
  const res: any = await getClient().send(
    new UpdateLoggingConfigurationCommand({ ...ref, LoggingConfiguration: parsed }),
  );
  return c.json({ loggingConfiguration: res?.LoggingConfiguration || null });
});

router.get("/firewalls/logging", async (c: Context) => {
  const ref = firewallRef({
    arn: c.req.query("arn") || undefined,
    name: c.req.query("name") || undefined,
  });
  if (!hasRef(ref)) return badRequest(c, "arn or name is required");
  const res: any = await getClient().send(new DescribeLoggingConfigurationCommand(ref));
  return c.json({ loggingConfiguration: res?.LoggingConfiguration || null });
});

// ---------- Firewall policies ----------

router.get("/policies", async (c: Context) => {
  const res: any = await getClient().send(new ListFirewallPoliciesCommand({}));
  const policies = (res?.FirewallPolicies || []).map((p: any) => ({
    name: p.Name || null,
    arn: p.Arn,
  }));
  return c.json({ policies, total: policies.length });
});

router.post("/policies", async (c: Context) => {
  const b = await body(c);
  const FirewallPolicyName = b.name;
  if (!FirewallPolicyName) return badRequest(c, "name is required");
  const policy = b.firewallPolicy || {};
  const res: any = await getClient().send(
    new CreateFirewallPolicyCommand({
      FirewallPolicyName,
      FirewallPolicy: {
        StatelessDefaultActions: policy.statelessDefaultActions || ["aws:forward_to_sfe"],
        StatelessFragmentDefaultActions: policy.statelessFragmentDefaultActions || [
          "aws:forward_to_sfe",
        ],
      },
    }),
  );
  return c.json({ policy: res?.FirewallPolicyResponse }, 201);
});

router.get("/policies/detail", async (c: Context) => {
  const ref = policyRef({
    arn: c.req.query("arn") || undefined,
    name: c.req.query("name") || undefined,
  });
  if (!(ref.FirewallPolicyArn || ref.FirewallPolicyName)) {
    return badRequest(c, "arn or name is required");
  }
  const res: any = await getClient().send(new DescribeFirewallPolicyCommand(ref));
  return c.json({
    policyResponse: res?.FirewallPolicyResponse || null,
    policy: res?.FirewallPolicy || null,
  });
});

router.put("/policies", async (c: Context) => {
  const b = await body(c);
  const ref = policyRef(b);
  if (!(ref.FirewallPolicyArn || ref.FirewallPolicyName)) {
    return badRequest(c, "arn or name is required");
  }
  const res: any = await getClient().send(
    new UpdateFirewallPolicyCommand({
      ...ref,
      FirewallPolicy: b.firewallPolicy || undefined,
    } as any),
  );
  return c.json({ policyResponse: res?.FirewallPolicyResponse });
});

router.delete("/policies", async (c: Context) => {
  const ref = policyRef({
    arn: c.req.query("arn") || undefined,
    name: c.req.query("name") || undefined,
  });
  if (!(ref.FirewallPolicyArn || ref.FirewallPolicyName)) {
    return badRequest(c, "arn or name is required");
  }
  await getClient().send(new DeleteFirewallPolicyCommand(ref));
  return c.json({ ok: true });
});

// ---------- Rule groups ----------

router.get("/rule-groups", async (c: Context) => {
  const type = c.req.query("type") || undefined;
  const res: any = await getClient().send(
    new ListRuleGroupsCommand({ Type: type as any }),
  );
  const ruleGroups = (res?.RuleGroups || []).map((g: any) => ({
    name: g.Name || null,
    arn: g.Arn,
    type: g.Type || null,
  }));
  return c.json({ ruleGroups, total: ruleGroups.length });
});

router.post("/rule-groups", async (c: Context) => {
  const b = await body(c);
  const RuleGroupName = b.name;
  if (!RuleGroupName) return badRequest(c, "name is required");
  const Type = b.type;
  if (!Type) return badRequest(c, "type is required");
  if (!b.capacity) return badRequest(c, "capacity is required");
  const { parsed: ruleGroup, error } = parseJsonField(b.ruleGroup);
  if (error) return badRequest(c, `ruleGroup ${error}`);
  const res: any = await getClient().send(
    new CreateRuleGroupCommand({
      RuleGroupName,
      Type,
      Capacity: Number(b.capacity),
      RuleGroup: ruleGroup || undefined,
    }),
  );
  return c.json({ ruleGroupResponse: res?.RuleGroupResponse }, 201);
});

router.get("/rule-groups/detail", async (c: Context) => {
  const ref = ruleGroupRef({
    arn: c.req.query("arn") || undefined,
    name: c.req.query("name") || undefined,
  });
  if (!(ref.RuleGroupArn || ref.RuleGroupName)) return badRequest(c, "arn or name is required");
  const res: any = await getClient().send(new DescribeRuleGroupCommand(ref));
  return c.json({
    ruleGroupResponse: res?.RuleGroupResponse || null,
    ruleGroup: res?.RuleGroup || null,
  });
});

router.put("/rule-groups", async (c: Context) => {
  const b = await body(c);
  const ref = ruleGroupRef(b);
  if (!(ref.RuleGroupArn || ref.RuleGroupName)) return badRequest(c, "arn or name is required");
  const { parsed: ruleGroup, error } = parseJsonField(b.ruleGroup);
  if (error) return badRequest(c, `ruleGroup ${error}`);
  const res: any = await getClient().send(
    new UpdateRuleGroupCommand({
      ...ref,
      RuleGroup: ruleGroup || undefined,
    } as any),
  );
  return c.json({ ruleGroupResponse: res?.RuleGroupResponse });
});

router.delete("/rule-groups", async (c: Context) => {
  const ref = ruleGroupRef({
    arn: c.req.query("arn") || undefined,
    name: c.req.query("name") || undefined,
  });
  if (!(ref.RuleGroupArn || ref.RuleGroupName)) return badRequest(c, "arn or name is required");
  await getClient().send(new DeleteRuleGroupCommand(ref));
  return c.json({ ok: true });
});

export default router;
