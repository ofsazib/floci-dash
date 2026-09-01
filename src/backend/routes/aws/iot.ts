import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { IoTClient } from "@aws-sdk/client-iot";
import { IoTDataPlaneClient } from "@aws-sdk/client-iot-data-plane";
/* istanbul ignore start */
import {
  CreateThingCommand,
  DescribeThingCommand,
  ListThingsCommand,
  UpdateThingCommand,
  DeleteThingCommand,
  CreateKeysAndCertificateCommand,
  CreateCertificateFromCsrCommand,
  DescribeCertificateCommand,
  ListCertificatesCommand,
  UpdateCertificateCommand,
  DeleteCertificateCommand,
  CreatePolicyCommand,
  GetPolicyCommand,
  ListPoliciesCommand,
  DeletePolicyCommand,
  CreatePolicyVersionCommand,
  GetPolicyVersionCommand,
  ListPolicyVersionsCommand,
  SetDefaultPolicyVersionCommand,
  DeletePolicyVersionCommand,
  AttachPolicyCommand,
  DetachPolicyCommand,
  ListAttachedPoliciesCommand,
  ListTargetsForPolicyCommand,
  AttachThingPrincipalCommand,
  DetachThingPrincipalCommand,
  ListThingPrincipalsCommand,
  ListPrincipalThingsCommand,
  CreateTopicRuleCommand,
  GetTopicRuleCommand,
  ListTopicRulesCommand,
  ReplaceTopicRuleCommand,
  DeleteTopicRuleCommand,
  EnableTopicRuleCommand,
  DisableTopicRuleCommand,
  CreateThingTypeCommand,
  DescribeThingTypeCommand,
  ListThingTypesCommand,
  DeprecateThingTypeCommand,
  DeleteThingTypeCommand,
  DescribeEndpointCommand,
  ListTagsForResourceCommand,
  TagResourceCommand,
  UntagResourceCommand,
  ListJobExecutionsForThingCommand,
  DescribeJobExecutionCommand,
  CreateThingGroupCommand,
  DescribeThingGroupCommand,
  ListThingGroupsCommand,
  UpdateThingGroupCommand,
  DeleteThingGroupCommand,
  ListThingsInThingGroupCommand,
  ListThingGroupsForThingCommand,
  AddThingToThingGroupCommand,
  RemoveThingFromThingGroupCommand,
} from "@aws-sdk/client-iot";
import {
  GetThingShadowCommand,
  UpdateThingShadowCommand,
  DeleteThingShadowCommand,
  ListNamedShadowsForThingCommand,
  GetConnectionCommand,
  DeleteConnectionCommand,
  ListSubscriptionsCommand,
  SendDirectMessageCommand,
  PublishCommand,
  ListRetainedMessagesCommand,
  GetRetainedMessageCommand,
} from "@aws-sdk/client-iot-data-plane";
/* istanbul ignore end */

const router = new Hono();
const getClient = () => create(IoTClient);
const getDataClient = () => create(IoTDataPlaneClient);

function mapThing(t: any) {
  return {
    thingName: t.thingName,
    thingTypeName: t.thingTypeName,
    thingArn: t.thingArn,
    attributes: t.attributes || {},
    version: t.version,
    defaultClientId: t.defaultClientId,
  };
}

function mapCertificate(c: any) {
  return {
    certificateId: c.certificateId,
    certificateArn: c.certificateArn,
    status: c.status,
    certificatePem: c.certificatePem,
    caCertificatePem: c.caCertificatePem,
    creationDate: c.creationDate,
    lastModifiedDate: c.lastModifiedDate,
    ownedBy: c.ownedBy,
    previousOwnedBy: c.previousOwnedBy,
    transferData: c.transferData,
  };
}

function mapPolicy(p: any) {
  return {
    policyName: p.policyName,
    policyArn: p.policyArn,
    policyDocument: p.policyDocument,
    defaultVersionId: p.defaultVersionId,
    creationDate: p.creationDate,
    lastModifiedDate: p.lastModifiedDate,
  };
}

function mapThingType(tt: any) {
  return {
    thingTypeName: tt.thingTypeName,
    thingTypeArn: tt.thingTypeArn,
    thingTypeProperties: tt.thingTypeProperties,
    deprecationDate: tt.deprecationDate,
    creationDate: tt.creationDate,
    lastModifiedDate: tt.lastModifiedDate,
  };
}

// ─── Endpoint ────────────────────────────────────────

router.get("/endpoint", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new DescribeEndpointCommand({ endpointType: c.req.query("endpointType") || undefined }));
  return c.json({ endpointAddress: result.endpointAddress });
});

// ─── Things ──────────────────────────────────────────

router.get("/things", async (c: Context) => {
  const client = getClient();
  const result = await client.send(
    new ListThingsCommand({
      attributeName: c.req.query("attributeName") || undefined,
      attributeValue: c.req.query("attributeValue") || undefined,
      thingTypeName: c.req.query("thingTypeName") || undefined,
      maxResults: c.req.query("maxResults") ? Number(c.req.query("maxResults")) : undefined,
      nextToken: c.req.query("nextToken") || undefined,
    })
  );
  const things = (result.things || []).map(mapThing);
  return c.json({ things, total: things.length, nextToken: result.nextToken });
});

router.get("/things/:thingName", async (c: Context) => {
  const thingName = c.req.param("thingName")!;
  const client = getClient();
  const result = await client.send(new DescribeThingCommand({ thingName }));
  return c.json({ thing: mapThing(result) });
});

router.post("/things", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.thingName) return c.json({ error: "thingName is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateThingCommand({
      thingName: body.thingName,
      thingTypeName: body.thingTypeName,
      attributePayload: body.attributes ? { attributes: body.attributes, merge: body.mergeAttributes } : undefined,
    })
  );
  return c.json({ thingName: result.thingName, thingArn: result.thingArn, thingId: result.thingId, created: true }, 201);
});

router.put("/things/:thingName", async (c: Context) => {
  const thingName = c.req.param("thingName")!;
  const body = await c.req.json<any>();
  const client = getClient();
  const result = await client.send(
    new UpdateThingCommand({
      thingName,
      thingTypeName: body.thingTypeName,
      attributePayload: body.attributes ? { attributes: body.attributes, merge: body.removeAttributes ? false : true } : undefined,
      removeThingType: body.removeThingType,
    })
  );
  return c.json({ updated: true });
});

router.delete("/things/:thingName", async (c: Context) => {
  const thingName = c.req.param("thingName")!;
  const client = getClient();
  await client.send(new DeleteThingCommand({ thingName, expectedVersion: c.req.query("expectedVersion") ? Number(c.req.query("expectedVersion")) : undefined }));
  return c.json({ deleted: true });
});

// ─── Thing Types ─────────────────────────────────────

router.get("/thing-types", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListThingTypesCommand({}));
  const thingTypes = (result.thingTypes || []).map(mapThingType);
  return c.json({ thingTypes, total: thingTypes.length });
});

router.get("/thing-types/:thingTypeName", async (c: Context) => {
  const thingTypeName = c.req.param("thingTypeName")!;
  const client = getClient();
  const result = await client.send(new DescribeThingTypeCommand({ thingTypeName }));
  return c.json({ thingType: mapThingType(result) });
});

router.post("/thing-types", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.thingTypeName) return c.json({ error: "thingTypeName is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateThingTypeCommand({
      thingTypeName: body.thingTypeName,
      thingTypeProperties: body.thingTypeProperties ? { thingTypeDescription: body.thingTypeProperties.thingTypeDescription, searchableAttributes: body.thingTypeProperties.searchableAttributes } : undefined,
    })
  );
  return c.json({ thingTypeName: result.thingTypeName, thingTypeArn: result.thingTypeArn, thingTypeId: result.thingTypeId, created: true }, 201);
});

router.delete("/thing-types/:thingTypeName", async (c: Context) => {
  const thingTypeName = c.req.param("thingTypeName")!;
  const client = getClient();
  await client.send(new DeleteThingTypeCommand({ thingTypeName }));
  return c.json({ deleted: true });
});

router.post("/thing-types/:thingTypeName/deprecate", async (c: Context) => {
  const thingTypeName = c.req.param("thingTypeName")!;
  const body = await c.req.json<any>();
  const client = getClient();
  await client.send(new DeprecateThingTypeCommand({ thingTypeName, undoDeprecate: body.undoDeprecate }));
  return c.json({ deprecated: true });
});

// ─── Certificates ────────────────────────────────────

router.get("/certificates", async (c: Context) => {
  const client = getClient();
  const result = await client.send(
    new ListCertificatesCommand({
      pageSize: c.req.query("pageSize") ? Number(c.req.query("pageSize")) : undefined,
      marker: c.req.query("marker") || undefined,
      ascendingOrder: c.req.query("ascendingOrder") === "true" || undefined,
    })
  );
  const certificates = (result.certificates || []).map(mapCertificate);
  return c.json({ certificates, total: certificates.length, nextMarker: result.nextMarker });
});

router.get("/certificates/:certificateId", async (c: Context) => {
  const certificateId = c.req.param("certificateId")!;
  const client = getClient();
  const result = await client.send(new DescribeCertificateCommand({ certificateId }));
  return c.json({ certificate: result.certificateDescription ? mapCertificate(result.certificateDescription) : null });
});

router.post("/certificates/keys-and-certificate", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new CreateKeysAndCertificateCommand({ setAsActive: true }));
  return c.json({
    certificateArn: result.certificateArn,
    certificateId: result.certificateId,
    certificatePem: result.certificatePem,
    keyPair: result.keyPair,
    created: true,
  }, 201);
});

router.post("/certificates/csr", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.certificateSigningRequest) return c.json({ error: "certificateSigningRequest is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateCertificateFromCsrCommand({
      certificateSigningRequest: body.certificateSigningRequest,
      setAsActive: body.setAsActive !== false,
    })
  );
  return c.json({ certificateId: result.certificateId, certificateArn: result.certificateArn, certificatePem: result.certificatePem, created: true }, 201);
});

router.put("/certificates/:certificateId", async (c: Context) => {
  const certificateId = c.req.param("certificateId")!;
  const body = await c.req.json<any>();
  if (!body.newStatus) return c.json({ error: "newStatus is required" }, 400);
  const client = getClient();
  await client.send(new UpdateCertificateCommand({ certificateId, newStatus: body.newStatus }));
  return c.json({ updated: true });
});

router.delete("/certificates/:certificateId", async (c: Context) => {
  const certificateId = c.req.param("certificateId")!;
  const client = getClient();
  await client.send(new DeleteCertificateCommand({ certificateId, forceDelete: c.req.query("forceDelete") === "true" }));
  return c.json({ deleted: true });
});

// ─── Policies ────────────────────────────────────────

router.get("/policies", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListPoliciesCommand({}));
  const policies = (result.policies || []).map(mapPolicy);
  return c.json({ policies, total: policies.length });
});

router.get("/policies/:policyName", async (c: Context) => {
  const policyName = c.req.param("policyName")!;
  const client = getClient();
  const result = await client.send(new GetPolicyCommand({ policyName }));
  return c.json({ policy: mapPolicy(result) });
});

router.post("/policies", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.policyName || !body.policyDocument) return c.json({ error: "policyName and policyDocument are required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreatePolicyCommand({
      policyName: body.policyName,
      policyDocument: typeof body.policyDocument === "string" ? body.policyDocument : JSON.stringify(body.policyDocument),
    })
  );
  return c.json({ policyName: result.policyName, policyArn: result.policyArn, policyDocument: result.policyDocument, created: true }, 201);
});

router.delete("/policies/:policyName", async (c: Context) => {
  const policyName = c.req.param("policyName")!;
  const client = getClient();
  await client.send(new DeletePolicyCommand({ policyName }));
  return c.json({ deleted: true });
});

// ─── Policy Versions ─────────────────────────────────

router.get("/policies/:policyName/versions", async (c: Context) => {
  const policyName = c.req.param("policyName")!;
  const client = getClient();
  const result = await client.send(new ListPolicyVersionsCommand({ policyName }));
  return c.json({ policyVersions: result.policyVersions || [], total: (result.policyVersions || []).length });
});

router.get("/policies/:policyName/versions/:versionId", async (c: Context) => {
  const policyName = c.req.param("policyName")!;
  const versionId = c.req.param("versionId")!;
  const client = getClient();
  const result = await client.send(new GetPolicyVersionCommand({ policyName, policyVersionId: versionId }));
  return c.json({ policyVersion: result });
});

router.post("/policies/:policyName/versions", async (c: Context) => {
  const policyName = c.req.param("policyName")!;
  const body = await c.req.json<any>();
  if (!body.policyDocument) return c.json({ error: "policyDocument is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreatePolicyVersionCommand({
      policyName,
      policyDocument: typeof body.policyDocument === "string" ? body.policyDocument : JSON.stringify(body.policyDocument),
      setAsDefault: body.setAsDefault !== false,
    })
  );
  return c.json({ policyVersion: result, created: true }, 201);
});

router.put("/policies/:policyName/versions/:versionId/set-default", async (c: Context) => {
  const policyName = c.req.param("policyName")!;
  const versionId = c.req.param("versionId")!;
  const client = getClient();
  await client.send(new SetDefaultPolicyVersionCommand({ policyName, policyVersionId: versionId }));
  return c.json({ updated: true });
});

router.delete("/policies/:policyName/versions/:versionId", async (c: Context) => {
  const policyName = c.req.param("policyName")!;
  const versionId = c.req.param("versionId")!;
  const client = getClient();
  await client.send(new DeletePolicyVersionCommand({ policyName, policyVersionId: versionId }));
  return c.json({ deleted: true });
});

// ─── Policy Attachments ──────────────────────────────

router.get("/policies/:policyName/targets", async (c: Context) => {
  const policyName = c.req.param("policyName")!;
  const client = getClient();
  const result = await client.send(new ListTargetsForPolicyCommand({ policyName }));
  return c.json({ targets: result.targets || [] });
});

router.get("/targets/:target/attached-policies", async (c: Context) => {
  const target = c.req.param("target")!;
  const client = getClient();
  const result = await client.send(new ListAttachedPoliciesCommand({ target }));
  return c.json({ policies: result.policies || [] });
});

router.post("/policies/:policyName/attach", async (c: Context) => {
  const policyName = c.req.param("policyName")!;
  const body = await c.req.json<any>();
  if (!body.target) return c.json({ error: "target is required" }, 400);
  const client = getClient();
  await client.send(new AttachPolicyCommand({ policyName, target: body.target }));
  return c.json({ attached: true });
});

router.post("/policies/:policyName/detach", async (c: Context) => {
  const policyName = c.req.param("policyName")!;
  const body = await c.req.json<any>();
  if (!body.target) return c.json({ error: "target is required" }, 400);
  const client = getClient();
  await client.send(new DetachPolicyCommand({ policyName, target: body.target }));
  return c.json({ detached: true });
});

// ─── Thing Principals ────────────────────────────────

router.get("/things/:thingName/principals", async (c: Context) => {
  const thingName = c.req.param("thingName")!;
  const client = getClient();
  const result = await client.send(new ListThingPrincipalsCommand({ thingName }));
  return c.json({ principals: result.principals || [] });
});

router.post("/things/:thingName/principals", async (c: Context) => {
  const thingName = c.req.param("thingName")!;
  const body = await c.req.json<any>();
  if (!body.principal) return c.json({ error: "principal is required" }, 400);
  const client = getClient();
  await client.send(new AttachThingPrincipalCommand({ thingName, principal: body.principal }));
  return c.json({ attached: true });
});

router.delete("/things/:thingName/principals", async (c: Context) => {
  const thingName = c.req.param("thingName")!;
  const client = getClient();
  const queryPrincipal = c.req.query("principal");
  if (!queryPrincipal) return c.json({ error: "principal query param is required" }, 400);
  await client.send(new DetachThingPrincipalCommand({ thingName, principal: queryPrincipal }));
  return c.json({ detached: true });
});

// ─── Topic Rules ─────────────────────────────────────

router.get("/topic-rules", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListTopicRulesCommand({}));
  return c.json({
    rules: result.rules || [],
    total: (result.rules || []).length,
  });
});

router.get("/topic-rules/:ruleName", async (c: Context) => {
  const ruleName = c.req.param("ruleName")!;
  const client = getClient();
  const result = await client.send(new GetTopicRuleCommand({ ruleName }));
  return c.json({ rule: result.rule || null, ruleArn: result.ruleArn });
});

router.post("/topic-rules", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.ruleName || !body.topicRulePayload) return c.json({ error: "ruleName and topicRulePayload are required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateTopicRuleCommand({
      ruleName: body.ruleName,
      topicRulePayload: {
        sql: body.topicRulePayload.sql,
        description: body.topicRulePayload.description,
        actions: body.topicRulePayload.actions,
        ruleDisabled: body.topicRulePayload.ruleDisabled,
        awsIotSqlVersion: body.topicRulePayload.awsIotSqlVersion,
        errorAction: body.topicRulePayload.errorAction,
      },
      tags: body.tags,
    })
  );
  return c.json({ created: true }, 201);
});

router.put("/topic-rules/:ruleName", async (c: Context) => {
  const ruleName = c.req.param("ruleName")!;
  const body = await c.req.json<any>();
  if (!body.topicRulePayload) return c.json({ error: "topicRulePayload is required" }, 400);
  const client = getClient();
  await client.send(
    new ReplaceTopicRuleCommand({
      ruleName,
      topicRulePayload: {
        sql: body.topicRulePayload.sql,
        description: body.topicRulePayload.description,
        actions: body.topicRulePayload.actions,
        ruleDisabled: body.topicRulePayload.ruleDisabled,
        awsIotSqlVersion: body.topicRulePayload.awsIotSqlVersion,
        errorAction: body.topicRulePayload.errorAction,
      },
    })
  );
  return c.json({ updated: true });
});

router.delete("/topic-rules/:ruleName", async (c: Context) => {
  const ruleName = c.req.param("ruleName")!;
  const client = getClient();
  await client.send(new DeleteTopicRuleCommand({ ruleName }));
  return c.json({ deleted: true });
});

router.post("/topic-rules/:ruleName/enable", async (c: Context) => {
  const ruleName = c.req.param("ruleName")!;
  const client = getClient();
  await client.send(new EnableTopicRuleCommand({ ruleName }));
  return c.json({ enabled: true });
});

router.post("/topic-rules/:ruleName/disable", async (c: Context) => {
  const ruleName = c.req.param("ruleName")!;
  const client = getClient();
  await client.send(new DisableTopicRuleCommand({ ruleName }));
  return c.json({ disabled: true });
});

// ─── Shadows (Data Plane) ───────────────────────────

router.get("/things/:thingName/shadow", async (c: Context) => {
  const thingName = c.req.param("thingName")!;
  const shadowName = c.req.query("name") || undefined;
  const client = getDataClient();
  const result = await client.send(new GetThingShadowCommand({ thingName, shadowName }));
  const payload = result.payload ? JSON.parse(new TextDecoder().decode(result.payload)) : null;
  return c.json({ shadow: payload });
});

router.post("/things/:thingName/shadow", async (c: Context) => {
  const thingName = c.req.param("thingName")!;
  const shadowName = c.req.query("name") || undefined;
  const body = await c.req.json<any>();
  const client = getDataClient();
  const result = await client.send(
    new UpdateThingShadowCommand({
      thingName,
      shadowName,
      payload: new TextEncoder().encode(JSON.stringify(body.state ? body : { state: body })),
    })
  );
  const payload = result.payload ? JSON.parse(new TextDecoder().decode(result.payload)) : null;
  return c.json({ shadow: payload, updated: true });
});

router.delete("/things/:thingName/shadow", async (c: Context) => {
  const thingName = c.req.param("thingName")!;
  const shadowName = c.req.query("name") || undefined;
  const client = getDataClient();
  await client.send(new DeleteThingShadowCommand({ thingName, shadowName }));
  return c.json({ deleted: true });
});

router.get("/things/:thingName/named-shadows", async (c: Context) => {
  const thingName = c.req.param("thingName")!;
  const client = getDataClient();
  const result = await client.send(
    new ListNamedShadowsForThingCommand({
      thingName,
      nextToken: c.req.query("nextToken") || undefined,
      pageSize: c.req.query("pageSize") ? Number(c.req.query("pageSize")) : undefined,
    })
  );
  return c.json({ results: result.results || [], nextToken: result.nextToken });
});

// ─── MQTT Broker (Data Plane) ───────────────────────

router.get("/connections/:clientId", async (c: Context) => {
  const clientId = c.req.param("clientId")!;
  const client = getDataClient();
  const result = await client.send(
    new GetConnectionCommand({ clientId, includeSocketInformation: true } as any)
  );
  return c.json({ connection: result });
});

router.get("/connections/:clientId/subscriptions", async (c: Context) => {
  const clientId = c.req.param("clientId")!;
  const client = getDataClient();
  const result = await client.send(
    new ListSubscriptionsCommand({
      clientId,
      maxResults: c.req.query("maxResults") ? Number(c.req.query("maxResults")) : undefined,
      nextToken: c.req.query("nextToken") || undefined,
    } as any)
  );
  return c.json({ subscriptions: result.subscriptions || [], nextToken: result.nextToken });
});

router.delete("/connections/:clientId", async (c: Context) => {
  const clientId = c.req.param("clientId")!;
  const client = getDataClient();
  await client.send(
    new DeleteConnectionCommand({
      clientId,
      cleanSession: c.req.query("cleanSession") === "true" || undefined,
      preventWillMessage: c.req.query("preventWillMessage") === "true" || undefined,
    } as any)
  );
  return c.json({ disconnected: true });
});

router.post("/connections/:clientId/messages", async (c: Context) => {
  const clientId = c.req.param("clientId")!;
  const body = await c.req.json<{ topic: string; payload?: string }>();
  if (!body.topic) return c.json({ error: "topic is required" }, 400);
  const client = getDataClient();
  const result = await client.send(
    new SendDirectMessageCommand({
      clientId,
      topic: body.topic,
      payload: new TextEncoder().encode(body.payload || ""),
    } as any)
  );
  return c.json({ sent: true, ...result });
});

router.post("/publish", async (c: Context) => {
  const body = await c.req.json<{ topic: string; payload?: string; qos?: number; retain?: boolean }>();
  if (!body.topic) return c.json({ error: "topic is required" }, 400);
  const client = getDataClient();
  await client.send(
    new PublishCommand({
      topic: body.topic,
      payload: new TextEncoder().encode(body.payload || ""),
      qos: body.qos ?? undefined,
      retain: body.retain ?? undefined,
    })
  );
  return c.json({ published: true });
});

// ─── Retained Messages (Data Plane) ─────────────────

router.get("/retained-messages", async (c: Context) => {
  const client = getDataClient();
  const result = await client.send(
    new ListRetainedMessagesCommand({
      maxResults: c.req.query("maxResults") ? Number(c.req.query("maxResults")) : undefined,
      nextToken: c.req.query("nextToken") || undefined,
    })
  );
  return c.json({ retainedTopics: result.retainedTopics || [], nextToken: result.nextToken });
});

router.get("/retained-messages/:topic{.+}", async (c: Context) => {
  const topic = c.req.param("topic")!;
  const client = getDataClient();
  const result = await client.send(new GetRetainedMessageCommand({ topic }));
  const payload = result.payload ? new TextDecoder().decode(result.payload) : null;
  return c.json({ topic: result.topic, payload, qos: result.qos, lastModifiedTime: result.lastModifiedTime });
});

// ─── Tags ────────────────────────────────────────────

router.get("/tags", async (c: Context) => {
  const resourceArn = c.req.query("resourceArn");
  if (!resourceArn) return c.json({ error: "resourceArn query param is required" }, 400);
  const client = getClient();
  const result = await client.send(new ListTagsForResourceCommand({ resourceArn }));
  return c.json({ tags: result.tags || [] });
});

router.post("/tags", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.resourceArn || !body.tags) return c.json({ error: "resourceArn and tags are required" }, 400);
  const client = getClient();
  await client.send(new TagResourceCommand({ resourceArn: body.resourceArn, tags: body.tags }));
  return c.json({ tagged: true });
});

router.delete("/tags", async (c: Context) => {
  const resourceArn = c.req.query("resourceArn");
  const tagKeys = c.req.query("tagKeys");
  if (!resourceArn || !tagKeys) return c.json({ error: "resourceArn and tagKeys are required" }, 400);
  const client = getClient();
  await client.send(new UntagResourceCommand({ resourceArn, tagKeys: tagKeys.split(",") }));
  return c.json({ untagged: true });
});

// ─── Thing Groups ─────────────────────────────────────

router.get("/thing-groups", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListThingGroupsCommand({}));
  return c.json({ thingGroups: result.thingGroups || [] });
});

router.get("/thing-groups/:groupName", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new DescribeThingGroupCommand({ thingGroupName: c.req.param("groupName")! }));
  return c.json({ thingGroup: result });
});

router.post("/thing-groups", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.thingGroupName) return c.json({ error: "thingGroupName is required" }, 400);
  const client = getClient();
  const result = await client.send(new CreateThingGroupCommand(body));
  return c.json({ thingGroupArn: result.thingGroupArn }, 201);
});

router.put("/thing-groups/:groupName", async (c: Context) => {
  const body = await c.req.json<any>();
  const client = getClient();
  const result = await client.send(new UpdateThingGroupCommand({ thingGroupName: c.req.param("groupName")!, ...body }));
  return c.json({ version: result.version });
});

router.delete("/thing-groups/:groupName", async (c: Context) => {
  const client = getClient();
  await client.send(new DeleteThingGroupCommand({ thingGroupName: c.req.param("groupName")! }));
  return c.json({ deleted: true });
});

router.get("/thing-groups/:groupName/things", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListThingsInThingGroupCommand({ thingGroupName: c.req.param("groupName")! }));
  return c.json({ things: result.things || [] });
});

router.get("/things/:thingName/thing-groups", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListThingGroupsForThingCommand({ thingName: c.req.param("thingName")! }));
  return c.json({ thingGroups: result.thingGroups || [] });
});

router.post("/thing-groups/add-thing", async (c: Context) => {
  const body = await c.req.json<{ thingName: string; thingGroupName: string }>();
  if (!body.thingName) return c.json({ error: "thingName is required" }, 400);
  if (!body.thingGroupName) return c.json({ error: "thingGroupName is required" }, 400);
  const client = getClient();
  await client.send(new AddThingToThingGroupCommand(body));
  return c.json({ added: true });
});

router.post("/thing-groups/remove-thing", async (c: Context) => {
  const body = await c.req.json<{ thingName: string; thingGroupName: string }>();
  if (!body.thingName) return c.json({ error: "thingName is required" }, 400);
  if (!body.thingGroupName) return c.json({ error: "thingGroupName is required" }, 400);
  const client = getClient();
  await client.send(new RemoveThingFromThingGroupCommand(body));
  return c.json({ removed: true });
});

// ─── Jobs ────────────────────────────────────────────

router.get("/things/:thingName/jobs", async (c: Context) => {
  const thingName = c.req.param("thingName")!;
  const client = getClient();
  const result = await client.send(new ListJobExecutionsForThingCommand({ thingName }));
  return c.json({ executionSummaries: result.executionSummaries || [] });
});

router.get("/things/:thingName/jobs/:jobId", async (c: Context) => {
  const thingName = c.req.param("thingName")!;
  const jobId = c.req.param("jobId")!;
  const client = getClient();
  const result = await client.send(new DescribeJobExecutionCommand({ thingName, jobId }));
  return c.json({ execution: result.execution || null });
});

export default router;
