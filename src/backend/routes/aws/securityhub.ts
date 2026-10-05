import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { readJson } from "../../clients/read-json";
import {
  SecurityHubClient,
  DescribeHubCommand,
  EnableSecurityHubCommand,
  UpdateSecurityHubConfigurationCommand,
  ListOrganizationAdminAccountsCommand,
  EnableOrganizationAdminAccountCommand,
  DescribeOrganizationConfigurationCommand,
  UpdateOrganizationConfigurationCommand,
  ListFindingAggregatorsCommand,
  CreateFindingAggregatorCommand,
  GetFindingAggregatorCommand,
  UpdateFindingAggregatorCommand,
  ListConfigurationPoliciesCommand,
  CreateConfigurationPolicyCommand,
  GetConfigurationPolicyCommand,
  UpdateConfigurationPolicyCommand,
  StartConfigurationPolicyAssociationCommand,
  GetConfigurationPolicyAssociationCommand,
  StartConfigurationPolicyDisassociationCommand,
  ListConfigurationPolicyAssociationsCommand,
} from "@aws-sdk/client-securityhub";

const router = new Hono();
const getClient = () => create(SecurityHubClient);

// Floci emits Security Hub responses in PascalCase wire casing, which the
// schema-based SDK deserializer passes through unmapped. Normalize keys to
// camelCase so callers always see SDK-style names.
function camelize(value: any): any {
  if (Array.isArray(value)) return value.map(camelize);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, v]) => [
        key.charAt(0).toLowerCase() + key.slice(1),
        camelize(v),
      ])
    );
  }
  return value;
}

// ── Hub ──────────────────────────────────────────────────

router.get("/hub", async (c: Context) => {
  try {
    const result: any = camelize(await getClient().send(new DescribeHubCommand({})));
    return c.json({
      enabled: true,
      hubArn: result.hubArn,
      autoEnableControls: result.autoEnableControls ?? false,
      controlFindingGenerator: result.controlFindingGenerator,
    });
  } catch (err: any) {
    if (err?.name === "ResourceNotFoundException") return c.json({ enabled: false });
    throw err;
  }
});

router.post("/hub/enable", async (c: Context) => {
  const body: any = await readJson(c);
  await getClient().send(
    new EnableSecurityHubCommand({
      ControlFindingGenerator: body?.controlFindingGenerator,
      Tags: body?.tags,
    })
  );
  return c.json({ enabled: true }, 201);
});

router.patch("/hub", async (c: Context) => {
  const body: any = await readJson(c);
  const input: Record<string, unknown> = {};
  if (body?.autoEnableControls !== undefined) input.AutoEnableControls = body.autoEnableControls;
  if (body?.controlFindingGenerator) input.ControlFindingGenerator = body.controlFindingGenerator;
  await getClient().send(new UpdateSecurityHubConfigurationCommand(input as any));
  return c.json({ updated: true });
});

// ── Organization admin ───────────────────────────────────

router.get("/organization/admins", async (c: Context) => {
  const result: any = camelize(
    await getClient().send(new ListOrganizationAdminAccountsCommand({}))
  );
  return c.json({
    adminAccounts: result.adminAccounts || [],
    feature: result.feature,
  });
});

router.post("/organization/admins/enable", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.accountId) return c.json({ error: "accountId is required" }, 400);
  const result: any = camelize(
    await getClient().send(
      new EnableOrganizationAdminAccountCommand({
        AdminAccountId: body.accountId,
        Feature: body.feature,
      })
    )
  );
  return c.json({ adminAccountId: result.adminAccountId, feature: result.feature }, 201);
});

// ── Organization configuration ───────────────────────────

router.get("/organization/configuration", async (c: Context) => {
  const result: any = camelize(
    await getClient().send(new DescribeOrganizationConfigurationCommand({}))
  );
  return c.json({
    autoEnable: result.autoEnable ?? false,
    autoEnableStandards: result.autoEnableStandards,
    organizationConfiguration: result.organizationConfiguration || null,
  });
});

router.post("/organization/configuration", async (c: Context) => {
  const body: any = await readJson(c);
  if (typeof body?.autoEnable !== "boolean")
    return c.json({ error: "autoEnable boolean is required" }, 400);
  await getClient().send(
    new UpdateOrganizationConfigurationCommand({
      AutoEnable: body.autoEnable,
      AutoEnableStandards: body.autoEnableStandards,
      OrganizationConfiguration: body.configurationType
        ? { ConfigurationType: body.configurationType }
        : undefined,
    })
  );
  return c.json({ updated: true });
});

// ── Finding aggregators ──────────────────────────────────

router.get("/finding-aggregators", async (c: Context) => {
  const result: any = camelize(await getClient().send(new ListFindingAggregatorsCommand({})));
  return c.json({ findingAggregators: result.findingAggregators || [] });
});

router.post("/finding-aggregators", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.regionLinkingMode) return c.json({ error: "regionLinkingMode is required" }, 400);
  const result: any = camelize(
    await getClient().send(
      new CreateFindingAggregatorCommand({
        RegionLinkingMode: body.regionLinkingMode,
        Regions: body.regions,
      })
    )
  );
  return c.json(
    {
      findingAggregatorArn: result.findingAggregatorArn,
      findingAggregationRegion: result.findingAggregationRegion,
      regionLinkingMode: result.regionLinkingMode,
      regions: result.regions || [],
    },
    201
  );
});

router.post("/finding-aggregators/get", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.findingAggregatorArn)
    return c.json({ error: "findingAggregatorArn is required" }, 400);
  const result: any = camelize(
    await getClient().send(
      new GetFindingAggregatorCommand({ FindingAggregatorArn: body.findingAggregatorArn })
    )
  );
  return c.json({
    findingAggregatorArn: result.findingAggregatorArn,
    regionLinkingMode: result.regionLinkingMode,
    regions: result.regions || [],
  });
});

router.patch("/finding-aggregators", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.findingAggregatorArn)
    return c.json({ error: "findingAggregatorArn is required" }, 400);
  if (!body?.regionLinkingMode) return c.json({ error: "regionLinkingMode is required" }, 400);
  const result: any = camelize(
    await getClient().send(
      new UpdateFindingAggregatorCommand({
        FindingAggregatorArn: body.findingAggregatorArn,
        RegionLinkingMode: body.regionLinkingMode,
        Regions: body.regions,
      })
    )
  );
  return c.json({ findingAggregatorArn: result.findingAggregatorArn });
});

// ── Configuration policies ───────────────────────────────

router.get("/configuration-policies", async (c: Context) => {
  const result: any = camelize(await getClient().send(new ListConfigurationPoliciesCommand({})));
  return c.json({
    configurationPolicySummaries: result.configurationPolicySummaries || [],
    nextToken: result.nextToken,
  });
});

router.post("/configuration-policies", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.name) return c.json({ error: "name is required" }, 400);
  if (!body?.configurationPolicy)
    return c.json({ error: "configurationPolicy is required" }, 400);
  const result: any = camelize(
    await getClient().send(
      new CreateConfigurationPolicyCommand({
        Name: body.name,
        Description: body.description,
        ConfigurationPolicy: body.configurationPolicy,
      })
    )
  );
  return c.json(
    {
      arn: result.arn,
      id: result.id,
      name: result.name,
      description: result.description,
      serviceEnabled: result.serviceEnabled,
    },
    201
  );
});

router.post("/configuration-policies/get", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.id) return c.json({ error: "id is required" }, 400);
  const raw: any = await getClient().send(new GetConfigurationPolicyCommand({ Identifier: body.id }));
  const result: any = camelize(raw);
  return c.json({
    arn: result.arn,
    id: result.id,
    name: result.name,
    description: result.description,
    serviceEnabled: result.serviceEnabled,
    // The policy document is opaque user-defined content, not a response shape —
    // pass it through in its original casing (wire key ConfigurationPolicy).
    configurationPolicy: raw.configurationPolicy ?? raw.ConfigurationPolicy ?? null,
  });
});

router.post("/configuration-policies/update", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.id) return c.json({ error: "id is required" }, 400);
  const result: any = camelize(
    await getClient().send(
      new UpdateConfigurationPolicyCommand({
        Identifier: body.id,
        Name: body.name,
        Description: body.description,
        ConfigurationPolicy: body.configurationPolicy,
      })
    )
  );
  return c.json({
    arn: result.arn,
    id: result.id,
    name: result.name,
    description: result.description,
    serviceEnabled: result.serviceEnabled,
  });
});

// ── Configuration policy associations ────────────────────

// The SDK models Target as a single-member union; build the one-key object directly.
function targetOf(body: any): any {
  if (body?.targetAccountId) return { AccountId: body.targetAccountId };
  if (body?.targetOrganizationalUnitId) return { OrganizationalUnitId: body.targetOrganizationalUnitId };
  if (body?.targetRootId) return { RootId: body.targetRootId };
  return null;
}

router.post("/associations/associate", async (c: Context) => {
  const body: any = await readJson(c);
  const target = targetOf(body);
  if (!target) return c.json({ error: "one of targetAccountId, targetOrganizationalUnitId, targetRootId is required" }, 400);
  if (!body?.configurationPolicyIdentifier)
    return c.json({ error: "configurationPolicyIdentifier is required" }, 400);
  const result: any = camelize(
    await getClient().send(
      new StartConfigurationPolicyAssociationCommand({
        Target: target,
        ConfigurationPolicyIdentifier: body.configurationPolicyIdentifier,
      })
    )
  );
  return c.json({
    associationStatus: result.associationStatus,
    associationType: result.associationType,
    configurationPolicyId: result.configurationPolicyId,
    targetId: result.targetId,
    targetType: result.targetType,
    updatedAt: result.updatedAt,
  });
});

router.post("/associations/get", async (c: Context) => {
  const body: any = await readJson(c);
  const target = targetOf(body);
  if (!target) return c.json({ error: "one of targetAccountId, targetOrganizationalUnitId, targetRootId is required" }, 400);
  const result: any = camelize(
    await getClient().send(new GetConfigurationPolicyAssociationCommand({ Target: target }))
  );
  return c.json({
    associationStatus: result.associationStatus,
    associationType: result.associationType,
    configurationPolicyId: result.configurationPolicyId,
    targetId: result.targetId,
    targetType: result.targetType,
    updatedAt: result.updatedAt,
  });
});

router.post("/associations/disassociate", async (c: Context) => {
  const body: any = await readJson(c);
  const target = targetOf(body);
  if (!target) return c.json({ error: "one of targetAccountId, targetOrganizationalUnitId, targetRootId is required" }, 400);
  if (!body?.configurationPolicyIdentifier)
    return c.json({ error: "configurationPolicyIdentifier is required" }, 400);
  await getClient().send(
    new StartConfigurationPolicyDisassociationCommand({
      Target: target,
      ConfigurationPolicyIdentifier: body.configurationPolicyIdentifier,
    })
  );
  return c.json({ disassociating: true });
});

router.post("/associations/list", async (c: Context) => {
  const result: any = camelize(
    await getClient().send(new ListConfigurationPolicyAssociationsCommand({}))
  );
  return c.json({
    configurationPolicyAssociationSummaries: result.configurationPolicyAssociationSummaries || [],
    nextToken: result.nextToken,
  });
});

export default router;
