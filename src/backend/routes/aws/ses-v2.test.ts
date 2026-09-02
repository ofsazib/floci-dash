import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());
const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) { return { __cmdName: name, ...args }; });
  };
});

vi.mock("@aws-sdk/client-sesv2", () => {
  const commands: Record<string, any> = {
    SESv2Client: vi.fn(function () { return { send: mockSend }; }),
  };
  const names = [
    "CreateEmailIdentityCommand", "ListEmailIdentitiesCommand", "GetEmailIdentityCommand",
    "DeleteEmailIdentityCommand", "PutEmailIdentityMailFromAttributesCommand",
    "GetEmailIdentityPoliciesCommand", "CreateEmailIdentityPolicyCommand",
    "UpdateEmailIdentityPolicyCommand", "DeleteEmailIdentityPolicyCommand",
    "SendEmailCommand", "SendBulkEmailCommand",
    "CreateEmailTemplateCommand", "GetEmailTemplateCommand", "ListEmailTemplatesCommand",
    "DeleteEmailTemplateCommand", "UpdateEmailTemplateCommand",
    "GetAccountCommand", "PutAccountSendingAttributesCommand",
    "PutAccountSuppressionAttributesCommand", "PutAccountVdmAttributesCommand",
    "CreateConfigurationSetCommand", "GetConfigurationSetCommand",
    "ListConfigurationSetsCommand", "DeleteConfigurationSetCommand",
    "PutConfigurationSetSendingOptionsCommand", "PutConfigurationSetReputationOptionsCommand",
    "PutConfigurationSetDeliveryOptionsCommand", "PutConfigurationSetTrackingOptionsCommand",
    "PutConfigurationSetSuppressionOptionsCommand", "PutConfigurationSetVdmOptionsCommand",
    "PutConfigurationSetArchivingOptionsCommand",
    "CreateDedicatedIpPoolCommand", "ListDedicatedIpPoolsCommand",
    "GetDedicatedIpPoolCommand", "DeleteDedicatedIpPoolCommand",
    "CreateContactListCommand", "ListContactListsCommand", "GetContactListCommand",
    "DeleteContactListCommand", "CreateContactCommand", "ListContactsCommand",
    "GetContactCommand", "UpdateContactCommand", "DeleteContactCommand",
    "PutSuppressedDestinationCommand", "ListSuppressedDestinationsCommand",
    "GetSuppressedDestinationCommand", "DeleteSuppressedDestinationCommand",
    "ListTagsForResourceCommand", "TagResourceCommand", "UntagResourceCommand",
    "GetConfigurationSetEventDestinationsCommand", "CreateConfigurationSetEventDestinationCommand",
    "UpdateConfigurationSetEventDestinationCommand", "DeleteConfigurationSetEventDestinationCommand",
    "ListCustomVerificationEmailTemplatesCommand", "GetCustomVerificationEmailTemplateCommand",
    "CreateCustomVerificationEmailTemplateCommand", "UpdateCustomVerificationEmailTemplateCommand",
    "DeleteCustomVerificationEmailTemplateCommand",
    "PutEmailIdentityConfigurationSetAttributesCommand", "PutEmailIdentityDkimAttributesCommand",
    "PutEmailIdentityDkimSigningAttributesCommand", "PutEmailIdentityFeedbackAttributesCommand",
    "TestRenderEmailTemplateCommand",
  ];
  for (const n of names) commands[n] = createCmd(n);
  return commands;
});

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./ses-v2";

beforeEach(() => {
  mockSend.mockReset();
});

const AG = "";
const j = async (r: Response) => await r.json();

describe("SES v2 — identities", () => {
  it("creates identity", async () => {
    mockSend.mockResolvedValueOnce({ IdentityType: "EMAIL_ADDRESS", VerifiedForSendingStatus: false });
    const res = await router.request(`${AG}/email-identities`, { method: "POST", body: JSON.stringify({ emailIdentity: "x@y.z" }), headers: { "content-type": "application/json" } });
    expect(res.status).toBe(201);
    expect(mockSend.mock.calls[0][0].EmailIdentity).toBe("x@y.z");
  });
  it("400 without emailIdentity", async () => {
    expect((await router.request(`${AG}/email-identities`, { method: "POST", body: "{}", headers: { "content-type": "application/json" } })).status).toBe(400);
  });
  it("lists + gets + deletes", async () => {
    mockSend
      .mockResolvedValueOnce({ EmailIdentities: [{ IdentityName: "x@y.z", IdentityType: "EMAIL_ADDRESS", SendingEnabled: true }] })
      .mockResolvedValueOnce({ IdentityType: "EMAIL_ADDRESS", VerifiedForSendingStatus: true, DkimAttributes: { Status: "SUCCESS" }, MailFromAttributes: {}, Policies: {}, Tags: [] });
    const list = await router.request(`${AG}/email-identities`);
    const lb = await j(list);
    expect(lb.total).toBe(1);
    const one = await router.request(`${AG}/email-identities/x%40y.z`);
    const ob = await j(one);
    expect(ob.identityType).toBe("EMAIL_ADDRESS");
    mockSend.mockResolvedValueOnce({});
    expect((await router.request(`${AG}/email-identities/x%40y.z`, { method: "DELETE" })).status).toBe(200);
  });

  it("sparse identity arms — create with tags + empty list + sparse get", async () => {
    mockSend
      .mockResolvedValueOnce({ IdentityType: "DOMAIN", VerifiedForSendingStatus: undefined, DkimAttributes: undefined })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});
    // create with tags -> Tags mapping arm
    const created = await router.request(`${AG}/email-identities`, { method: "POST", body: JSON.stringify({ emailIdentity: "d.y.z", tags: { env: "test" } }), headers: { "content-type": "application/json" } });
    const cb = await j(created);
    expect(cb.identityType).toBe("DOMAIN");
    expect(cb.verifiedForSendingStatus).toBe(false);
    expect(mockSend.mock.calls[0][0].Tags).toEqual([{ Key: "env", Value: "test" }]);
    // sparse list -> empty
    const list = await router.request(`${AG}/email-identities`);
    expect((await j(list)).total).toBe(0);
    // sparse get -> nulls
    const one = await router.request(`${AG}/email-identities/d.y.z`);
    const ob = await j(one);
    expect(ob.identity).toBe("d.y.z");
    expect(ob.dkim).toBeNull();
    expect(ob.verifiedForSendingStatus).toBe(false);
  });
  it("mail-from PUT + 400", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await router.request(`${AG}/email-identities/x%40y.z/mail-from`, { method: "PUT", body: JSON.stringify({ mailFromDomain: "bounce.y.z" }), headers: { "content-type": "application/json" } });
    expect(res.status).toBe(200);
    expect((await router.request(`${AG}/email-identities/x%40y.z/mail-from`, { method: "PUT", body: "{}", headers: { "content-type": "application/json" } })).status).toBe(400);
  });
  it("identity policies CRUD", async () => {
    mockSend
      .mockResolvedValueOnce({ Policies: { p1: "{}" } })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});
    const list = await router.request(`${AG}/email-identities/x%40y.z/policies`);
    expect((await j(list)).policies).toEqual({ p1: "{}" });
    expect((await router.request(`${AG}/email-identities/x%40y.z/policies/p1`, { method: "PUT", body: JSON.stringify({ policy: "{}" }), headers: { "content-type": "application/json" } })).status).toBe(201);
    expect((await router.request(`${AG}/email-identities/x%40y.z/policies/p1`, { method: "POST", body: JSON.stringify({ policy: "{}" }), headers: { "content-type": "application/json" } })).status).toBe(200);
    expect((await router.request(`${AG}/email-identities/x%40y.z/policies/p1`, { method: "POST", body: "{}", headers: { "content-type": "application/json" } })).status).toBe(400);
    expect((await router.request(`${AG}/email-identities/x%40y.z/policies/p1`, { method: "DELETE" })).status).toBe(200);
    expect((await router.request(`${AG}/email-identities/x%40y.z/policies/p1`, { method: "PUT", body: "{}", headers: { "content-type": "application/json" } })).status).toBe(400);
  });
});

describe("SES v2 — sending", () => {
  it("POST /send", async () => {
    mockSend.mockResolvedValueOnce({ MessageId: "mid-1" });
    const res = await router.request(`${AG}/send`, { method: "POST", body: JSON.stringify({ from: "a@b.c", destination: { ToAddresses: ["d@e.f"] }, content: { Simple: {} } }), headers: { "content-type": "application/json" } });
    expect(res.status).toBe(201);
    expect((await j(res)).messageId).toBe("mid-1");
  });
  it("POST /send 400s", async () => {
    expect((await router.request(`${AG}/send`, { method: "POST", body: "{}", headers: { "content-type": "application/json" } })).status).toBe(400);
    expect((await router.request(`${AG}/send`, { method: "POST", body: JSON.stringify({ from: "a@b.c" }), headers: { "content-type": "application/json" } })).status).toBe(400);
  });
  it("POST /send-bulk + results mapping", async () => {
    mockSend.mockResolvedValueOnce({ BulkEmailEntryResults: [{ Status: "SUCCESS", MessageId: "m1" }, { Status: "FAILED", Error: "bad" }] });
    const res = await router.request(`${AG}/send-bulk`, { method: "POST", body: JSON.stringify({ from: "a@b.c", bulkEmailEntries: [{ Destination: { ToAddresses: ["d@e.f"] } }, { Destination: { ToAddresses: ["g@h.i"] } }], defaultContent: {} }), headers: { "content-type": "application/json" } });
    expect(res.status).toBe(201);
    const body = await j(res);
    expect(body.results[0].status).toBe("SUCCESS");
    expect(body.results[1].error).toBe("bad");
  });
  it("send-bulk 400 without entries", async () => {
    expect((await router.request(`${AG}/send-bulk`, { method: "POST", body: JSON.stringify({ from: "a@b.c" }), headers: { "content-type": "application/json" } })).status).toBe(400);
  });
  it("send-bulk 400 without from", async () => {
    expect((await router.request(`${AG}/send-bulk`, { method: "POST", body: JSON.stringify({ bulkEmailEntries: [{ Destination: {} }] }), headers: { "content-type": "application/json" } })).status).toBe(400);
  });
});

describe("SES v2 — templates", () => {
  it("create/list/get/update/delete", async () => {
    mockSend
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ TemplatesMetadata: [{ TemplateName: "t1", CreatedTimestamp: new Date("2026-01-01") }] })
      .mockResolvedValueOnce({ TemplateName: "t1", TemplateContent: { Subject: "s", Html: "<p/>", Text: "t" } })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});
    expect((await router.request(`${AG}/templates`, { method: "POST", body: JSON.stringify({ templateName: "t1", subject: "s" }), headers: { "content-type": "application/json" } })).status).toBe(201);
    const list = await router.request(`${AG}/templates`);
    expect((await j(list)).total).toBe(1);
    const one = await router.request(`${AG}/templates/t1`);
    expect((await j(one)).subject).toBe("s");
    expect((await router.request(`${AG}/templates/t1`, { method: "PUT", body: JSON.stringify({ subject: "s2" }), headers: { "content-type": "application/json" } })).status).toBe(200);
    expect((await router.request(`${AG}/templates/t1`, { method: "DELETE" })).status).toBe(200);
    expect((await router.request(`${AG}/templates`, { method: "POST", body: "{}", headers: { "content-type": "application/json" } })).status).toBe(400);
  });
});

describe("SES v2 — account attributes", () => {
  it("sending get/put", async () => {
    mockSend
      .mockResolvedValueOnce({ SendingEnabled: true })
      .mockResolvedValueOnce({});
    expect((await j(await router.request(`${AG}/account/sending`))).sendingEnabled).toBe(true);
    expect((await router.request(`${AG}/account/sending`, { method: "PUT", body: JSON.stringify({ sendingEnabled: false }), headers: { "content-type": "application/json" } })).status).toBe(200);
  });
  it("suppression get/put", async () => {
    mockSend
      .mockResolvedValueOnce({ SuppressionAttributes: { SuppressedReasons: ["BOUNCE"] } })
      .mockResolvedValueOnce({});
    expect((await j(await router.request(`${AG}/account/suppression`))).suppressionAttributes).toEqual({ SuppressedReasons: ["BOUNCE"] });
    expect((await router.request(`${AG}/account/suppression`, { method: "PUT", body: "{}", headers: { "content-type": "application/json" } })).status).toBe(200);
  });
  it("vdm get/put", async () => {
    mockSend
      .mockResolvedValueOnce({ VdmAttributes: {} })
      .mockResolvedValueOnce({});
    expect((await router.request(`${AG}/account/vdm`)).status).toBe(200);
    expect((await router.request(`${AG}/account/vdm`, { method: "PUT", body: "{}", headers: { "content-type": "application/json" } })).status).toBe(200);
  });
});

describe("SES v2 — configuration sets", () => {
  it("create/list/get/delete", async () => {
    mockSend
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ ConfigurationSets: [{ ConfigurationSetName: "cs1" }] })
      .mockResolvedValueOnce({ ConfigurationSetName: "cs1" })
      .mockResolvedValueOnce({});
    expect((await router.request(`${AG}/configuration-sets`, { method: "POST", body: JSON.stringify({ name: "cs1" }), headers: { "content-type": "application/json" } })).status).toBe(201);
    const list = await router.request(`${AG}/configuration-sets`);
    expect((await j(list)).configurationSets).toEqual(["cs1"]);
    expect((await router.request(`${AG}/configuration-sets/cs1`)).status).toBe(200);
    expect((await router.request(`${AG}/configuration-sets/cs1`, { method: "DELETE" })).status).toBe(200);
    expect((await router.request(`${AG}/configuration-sets`, { method: "POST", body: "{}", headers: { "content-type": "application/json" } })).status).toBe(400);
  });
  it("option-group PUTs route to correct commands", async () => {
    mockSend.mockResolvedValue({});
    for (const [route, cmd] of [
      ["sending", "PutConfigurationSetSendingOptionsCommand"],
      ["reputation", "PutConfigurationSetReputationOptionsCommand"],
      ["delivery", "PutConfigurationSetDeliveryOptionsCommand"],
      ["tracking", "PutConfigurationSetTrackingOptionsCommand"],
      ["suppression", "PutConfigurationSetSuppressionOptionsCommand"],
      ["vdm", "PutConfigurationSetVdmOptionsCommand"],
      ["archiving", "PutConfigurationSetArchivingOptionsCommand"],
    ] as const) {
      const res = await router.request(`${AG}/configuration-sets/cs1/${route}`, { method: "PUT", body: "{}", headers: { "content-type": "application/json" } });
      expect(res.status).toBe(200);
    }
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("PutConfigurationSetSendingOptionsCommand");
    expect(mockSend.mock.calls[6][0].__cmdName).toBe("PutConfigurationSetArchivingOptionsCommand");
    expect(mockSend.mock.calls[0][0].ConfigurationSetName).toBe("cs1");
  });
});

describe("SES v2 — dedicated IP pools", () => {
  it("create/list/get/delete", async () => {
    mockSend
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ DedicatedIpPools: [{ PoolName: "pool1" }] })
      .mockResolvedValueOnce({ DedicatedIpPool: { PoolName: "pool1" } })
      .mockResolvedValueOnce({});
    expect((await router.request(`${AG}/dedicated-ip-pools`, { method: "POST", body: JSON.stringify({ poolName: "pool1" }), headers: { "content-type": "application/json" } })).status).toBe(201);
    expect((await j(await router.request(`${AG}/dedicated-ip-pools`))).pools).toEqual(["pool1"]);
    expect((await j(await router.request(`${AG}/dedicated-ip-pools/pool1`))).pool.PoolName).toBe("pool1");
    expect((await router.request(`${AG}/dedicated-ip-pools/pool1`, { method: "DELETE" })).status).toBe(200);
    expect((await router.request(`${AG}/dedicated-ip-pools`, { method: "POST", body: "{}", headers: { "content-type": "application/json" } })).status).toBe(400);
  });
});

describe("SES v2 — contact lists + contacts", () => {
  it("contact list create/list/get/delete", async () => {
    mockSend
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ ContactLists: [{ ContactListName: "cl1" }] })
      .mockResolvedValueOnce({ ContactListName: "cl1" })
      .mockResolvedValueOnce({});
    expect((await router.request(`${AG}/contact-lists`, { method: "POST", body: JSON.stringify({ listName: "cl1" }), headers: { "content-type": "application/json" } })).status).toBe(201);
    expect((await j(await router.request(`${AG}/contact-lists`))).contactLists).toEqual(["cl1"]);
    expect((await router.request(`${AG}/contact-lists/cl1`)).status).toBe(200);
    expect((await router.request(`${AG}/contact-lists/cl1`, { method: "DELETE" })).status).toBe(200);
    expect((await router.request(`${AG}/contact-lists`, { method: "POST", body: "{}", headers: { "content-type": "application/json" } })).status).toBe(400);
  });
  it("contacts create/list/get/update/delete", async () => {
    mockSend
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ Contacts: [{ Email: "c@x.y", UnsubscribeAll: false, LastUpdateTimestamp: new Date("2026-01-01") }] })
      .mockResolvedValueOnce({ Email: "c@x.y" })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});
    expect((await router.request(`${AG}/contact-lists/cl1/contacts`, { method: "POST", body: JSON.stringify({ email: "c@x.y" }), headers: { "content-type": "application/json" } })).status).toBe(201);
    const list = await router.request(`${AG}/contact-lists/cl1/contacts`);
    const lb = await j(list);
    expect(lb.contacts[0].email).toBe("c@x.y");
    expect((await router.request(`${AG}/contact-lists/cl1/contacts/c%40x.y`)).status).toBe(200);
    expect((await router.request(`${AG}/contact-lists/cl1/contacts/c%40x.y`, { method: "PUT", body: "{}", headers: { "content-type": "application/json" } })).status).toBe(200);
    expect((await router.request(`${AG}/contact-lists/cl1/contacts/c%40x.y`, { method: "DELETE" })).status).toBe(200);
    expect((await router.request(`${AG}/contact-lists/cl1/contacts`, { method: "POST", body: "{}", headers: { "content-type": "application/json" } })).status).toBe(400);
  });
});

describe("SES v2 — suppression list", () => {
  it("put/list/get/delete", async () => {
    mockSend
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ SuppressedDestinationSummaries: [{ EmailAddress: "b@x.y", Reason: "BOUNCE", LastUpdateTime: new Date("2026-01-01") }] })
      .mockResolvedValueOnce({ SuppressedDestination: { EmailAddress: "b@x.y" } })
      .mockResolvedValueOnce({});
    expect((await router.request(`${AG}/suppressed-destinations`, { method: "PUT", body: JSON.stringify({ email: "b@x.y" }), headers: { "content-type": "application/json" } })).status).toBe(201);
    const list = await router.request(`${AG}/suppressed-destinations`);
    const lb = await j(list);
    expect(lb.suppressed[0].email).toBe("b@x.y");
    expect((await router.request(`${AG}/suppressed-destinations/b%40x.y`)).status).toBe(200);
    expect((await router.request(`${AG}/suppressed-destinations/b%40x.y`, { method: "DELETE" })).status).toBe(200);
    expect((await router.request(`${AG}/suppressed-destinations`, { method: "PUT", body: "{}", headers: { "content-type": "application/json" } })).status).toBe(400);
  });
});

describe("SES v2 — sparse response defaults", () => {
  it("returns nulls/empties when SDK omits fields", async () => {
    mockSend.mockResolvedValue({});
    // policies sparse
    expect((await j(await router.request(`${AG}/email-identities/x%40y.z/policies`))).policies).toEqual({});
    // send sparse
    const sent = await router.request(`${AG}/send`, { method: "POST", body: JSON.stringify({ from: "a@b.c", destination: {}, content: {} }), headers: { "content-type": "application/json" } });
    expect((await j(sent)).messageId).toBeNull();
    // bulk sparse
    const bulk = await router.request(`${AG}/send-bulk`, { method: "POST", body: JSON.stringify({ from: "a@b.c", bulkEmailEntries: [{ Destination: {} }], defaultContent: {} }), headers: { "content-type": "application/json" } });
    expect((await j(bulk)).results).toEqual([]);
    // template get sparse
    const tpl = await router.request(`${AG}/templates/t1`);
    const tb = await j(tpl);
    expect(tb.subject).toBeNull();
    expect(tb.html).toBeNull();
    expect(tb.text).toBeNull();
    // template create with empty subject -> "" fallback
    expect((await router.request(`${AG}/templates`, { method: "POST", body: JSON.stringify({ templateName: "t2" }), headers: { "content-type": "application/json" } })).status).toBe(201);
    // account get sparse
    expect((await j(await router.request(`${AG}/account/sending`))).sendingEnabled).toBe(false);
    expect((await j(await router.request(`${AG}/account/suppression`))).suppressionAttributes).toBeNull();
    expect((await j(await router.request(`${AG}/account/vdm`))).vdmAttributes).toBeNull();
    // config set get sparse
    expect((await j(await router.request(`${AG}/configuration-sets/cs1`))).configurationSet).toEqual({});
    // contact list get sparse
    expect((await router.request(`${AG}/contact-lists/cl1`)).status).toBe(200);
    // contacts sparse
    const contacts = await router.request(`${AG}/contact-lists/cl1/contacts`);
    const cb = await j(contacts);
    expect(cb.total).toBe(0);
    expect(cb.contacts).toEqual([]);
    // suppression get sparse
    expect((await j(await router.request(`${AG}/suppressed-destinations/b%40x.y`))).suppressedDestination).toBeNull();
    // tags sparse
    expect((await j(await router.request(`${AG}/resources/tags?arn=arn%3Ai`))).tags).toEqual([]);
    // identity mail-from PUT happy
    expect((await router.request(`${AG}/email-identities/x%40y.z/mail-from`, { method: "PUT", body: JSON.stringify({ mailFromDomain: "b.y.z" }), headers: { "content-type": "application/json" } })).status).toBe(200);
  });
});

describe("SES v2 — tags", () => {
  it("list/tag/untag by arn", async () => {
    mockSend
      .mockResolvedValueOnce({ Tags: [{ Key: "k", Value: "v" }] })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});
    const res = await router.request(`${AG}/resources/tags?arn=arn%3Aidentity`);
    expect((await j(res)).tags).toEqual([{ Key: "k", Value: "v" }]);
    expect((await router.request(`${AG}/resources/tags`, { method: "POST", body: JSON.stringify({ arn: "arn:i", tags: { a: "b" } }), headers: { "content-type": "application/json" } })).status).toBe(200);
    expect((await router.request(`${AG}/resources/tags?arn=arn%3Ai&tagKeys=a`, { method: "DELETE" })).status).toBe(200);
    expect((await router.request(`${AG}/resources/tags`, { method: "POST", body: "{}", headers: { "content-type": "application/json" } })).status).toBe(400);
    expect((await router.request(`${AG}/resources/tags`, { method: "DELETE" })).status).toBe(400);
  });
});

describe("SES v2 — configuration set event destinations", () => {
  it("GET /configuration-sets/:name/event-destinations", async () => {
    mockSend.mockResolvedValueOnce({ EventDestinationConfiguration: { SNS: { TopicArn: "arn:topic" } } });
    const res = await router.request(`${AG}/configuration-sets/cs1/event-destinations`);
    const body = await res.json();
    expect(body.eventDestinations).toBeDefined();
  });

  it("POST /configuration-sets/:name/event-destinations", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await router.request(`${AG}/configuration-sets/cs1/event-destinations`, {
      method: "POST",
      body: JSON.stringify({ EventDestinationName: "ed1", EventDestination: { SNS: { TopicArn: "arn:topic" } } }),
      headers: { "content-type": "application/json" },
    });
    expect(res.status).toBe(201);
  });

  it("POST /configuration-sets/:name/event-destinations — 400 without fields", async () => {
    const res = await router.request(`${AG}/configuration-sets/cs1/event-destinations`, {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
    });
    expect(res.status).toBe(400);
  });

  it("PUT /configuration-sets/:name/event-destinations/:edName", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await router.request(`${AG}/configuration-sets/cs1/event-destinations/ed1`, {
      method: "PUT",
      body: JSON.stringify({ EventDestination: { SNS: { TopicArn: "arn:topic" } } }),
      headers: { "content-type": "application/json" },
    });
    expect((await res.json()).updated).toBe(true);
  });

  it("PUT /configuration-sets/:name/event-destinations/:edName — 400 without EventDestination", async () => {
    const res = await router.request(`${AG}/configuration-sets/cs1/event-destinations/ed1`, {
      method: "PUT",
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
    });
    expect(res.status).toBe(400);
  });

  it("DELETE /configuration-sets/:name/event-destinations/:edName", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await router.request(`${AG}/configuration-sets/cs1/event-destinations/ed1`, { method: "DELETE" });
    expect((await res.json()).deleted).toBe(true);
  });
});

describe("SES v2 — custom verification email templates", () => {
  it("GET /custom-verification-email-templates", async () => {
    mockSend.mockResolvedValueOnce({ CustomVerificationEmailTemplates: [{ TemplateName: "t1" }] });
    const res = await router.request(`${AG}/custom-verification-email-templates`);
    const body = await res.json();
    expect(body.templates).toHaveLength(1);
  });

  it("GET /custom-verification-email-templates/:name", async () => {
    mockSend.mockResolvedValueOnce({ TemplateName: "t1", TemplateSubject: "Hi" });
    const res = await router.request(`${AG}/custom-verification-email-templates/t1`);
    const body = await res.json();
    expect(body.template.TemplateName).toBe("t1");
  });

  it("POST /custom-verification-email-templates", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await router.request(`${AG}/custom-verification-email-templates`, {
      method: "POST",
      body: JSON.stringify({ TemplateName: "t1" }),
      headers: { "content-type": "application/json" },
    });
    expect(res.status).toBe(201);
  });

  it("POST /custom-verification-email-templates — 400 without TemplateName", async () => {
    const res = await router.request(`${AG}/custom-verification-email-templates`, {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
    });
    expect(res.status).toBe(400);
  });

  it("PUT /custom-verification-email-templates/:name", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await router.request(`${AG}/custom-verification-email-templates/t1`, {
      method: "PUT",
      body: JSON.stringify({ TemplateSubject: "Hi" }),
      headers: { "content-type": "application/json" },
    });
    expect((await res.json()).updated).toBe(true);
  });

  it("DELETE /custom-verification-email-templates/:name", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await router.request(`${AG}/custom-verification-email-templates/t1`, { method: "DELETE" });
    expect((await res.json()).deleted).toBe(true);
  });
});

describe("SES v2 — email identity attributes", () => {
  it("PUT /email-identities/:identity/configuration-set", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await router.request(`${AG}/email-identities/id1/configuration-set`, {
      method: "PUT",
      body: JSON.stringify({ ConfigurationSetName: "cs1" }),
      headers: { "content-type": "application/json" },
    });
    expect((await res.json()).updated).toBe(true);
  });

  it("PUT /email-identities/:identity/dkim", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await router.request(`${AG}/email-identities/id1/dkim`, {
      method: "PUT",
      body: JSON.stringify({ SigningEnabled: true }),
      headers: { "content-type": "application/json" },
    });
    expect((await res.json()).updated).toBe(true);
  });

  it("PUT /email-identities/:identity/dkim/signing", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await router.request(`${AG}/email-identities/id1/dkim/signing`, {
      method: "PUT",
      body: JSON.stringify({ SigningAttributesOrigin: "AWS_SES" }),
      headers: { "content-type": "application/json" },
    });
    expect((await res.json()).updated).toBe(true);
  });

  it("PUT /email-identities/:identity/feedback", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await router.request(`${AG}/email-identities/id1/feedback`, {
      method: "PUT",
      body: JSON.stringify({ EmailForwardingEnabled: true }),
      headers: { "content-type": "application/json" },
    });
    expect((await res.json()).updated).toBe(true);
  });
});

describe("SES v2 — template render", () => {
  it("POST /templates/:name/render", async () => {
    mockSend.mockResolvedValueOnce({ RenderedTemplate: "<h1>Hello</h1>" });
    const res = await router.request(`${AG}/templates/t1/render`, {
      method: "POST",
      body: JSON.stringify({ TemplateData: "{\"name\":\"John\"}" }),
      headers: { "content-type": "application/json" },
    });
    const body = await res.json();
    expect(body.renderedTemplate).toBe("<h1>Hello</h1>");
  });

  it("POST /templates/:name/render — defaults TemplateData to {}", async () => {
    mockSend.mockResolvedValueOnce({ RenderedTemplate: "rendered" });
    const res = await router.request(`${AG}/templates/t1/render`, {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
    });
    expect((await res.json()).renderedTemplate).toBe("rendered");
  });
});

describe("SES v2 — account", () => {
  it("GET /account", async () => {
    mockSend.mockResolvedValueOnce({ ProductionAccessEnabled: true, EnforcementStatus: "ENABLED" });
    const res = await router.request(`${AG}/account`);
    const body = await res.json();
    expect(body.account.ProductionAccessEnabled).toBe(true);
    expect(body.account.EnforcementStatus).toBe("ENABLED");
  });
});

describe("SES v2 — edge arms", () => {
  it("400s for policy/content/from + empty-list arms + tag 400s", async () => {
    // policy PUT 400 without policy
    expect((await router.request(`${AG}/email-identities/x%40y.z/policies/p1`, { method: "PUT", body: "{}", headers: { "content-type": "application/json" } })).status).toBe(400);
    // send 400s: content missing / from missing
    expect((await router.request(`${AG}/send`, { method: "POST", body: JSON.stringify({ from: "a@b.c", destination: {} }), headers: { "content-type": "application/json" } })).status).toBe(400);
    expect((await router.request(`${AG}/send`, { method: "POST", body: JSON.stringify({ destination: {}, content: {} }), headers: { "content-type": "application/json" } })).status).toBe(400);
    // empty-list arms
    mockSend.mockResolvedValue({});
    expect((await j(await router.request(`${AG}/templates`))).total).toBe(0);
    expect((await j(await router.request(`${AG}/configuration-sets`))).total).toBe(0);
    expect((await j(await router.request(`${AG}/dedicated-ip-pools`))).total).toBe(0);
    expect((await j(await router.request(`${AG}/contact-lists`))).total).toBe(0);
    expect((await j(await router.request(`${AG}/suppressed-destinations`))).total).toBe(0);
    // pool get sparse
    expect((await j(await router.request(`${AG}/dedicated-ip-pools/pool1`))).pool).toBeNull();
    // contact list create WITH topicName
    mockSend.mockResolvedValueOnce({});
    expect((await router.request(`${AG}/contact-lists`, { method: "POST", body: JSON.stringify({ listName: "cl2", topicName: "news" }), headers: { "content-type": "application/json" } })).status).toBe(201);
    // contacts list item without UnsubscribeAll
    mockSend.mockResolvedValueOnce({ Contacts: [{ Email: "n@x.y" }] });
    const contacts = await router.request(`${AG}/contact-lists/cl1/contacts`);
    expect((await j(contacts)).contacts[0].unsubscribeAll).toBe(false);
    // identity create without identityType in response
    mockSend.mockResolvedValueOnce({});
    const ident = await router.request(`${AG}/email-identities`, { method: "POST", body: JSON.stringify({ emailIdentity: "n@x.y" }), headers: { "content-type": "application/json" } });
    expect((await j(ident)).identityType).toBeNull();
    // identities list item without SendingEnabled
    mockSend.mockResolvedValueOnce({ EmailIdentities: [{ IdentityName: "n@x.y" }] });
    const idlist = await router.request(`${AG}/email-identities`);
    expect((await j(idlist)).identities[0].sendingEnabled).toBe(false);
    // template create without subject -> ""
    mockSend.mockResolvedValueOnce({});
    expect((await router.request(`${AG}/templates`, { method: "POST", body: JSON.stringify({ templateName: "t3" }), headers: { "content-type": "application/json" } })).status).toBe(201);
    // tags GET without arn -> 400
    expect((await router.request(`${AG}/resources/tags`, { method: "GET" })).status).toBe(400);
    // tags DELETE without arn -> 400
    expect((await router.request(`${AG}/resources/tags?tagKeys=a`, { method: "DELETE" })).status).toBe(400);
  });
});
