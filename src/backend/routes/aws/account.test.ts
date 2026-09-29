import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockAccount = vi.hoisted(() =>
  vi.fn(function () {
    return { send: mockSend };
  })
);

const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) {
      return { __cmdName: name, ...args };
    });
  };
});

vi.mock("@aws-sdk/client-account", () => ({
  AccountClient: mockAccount,
  GetAlternateContactCommand: createCmd("GetAlternateContactCommand"),
  PutAlternateContactCommand: createCmd("PutAlternateContactCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./account";

async function get(path: string) {
  return router.request(path, { method: "GET" });
}

async function put(path: string, body?: any) {
  return router.request(path, {
    method: "PUT",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSend.mockReset();
});

describe("GET /alternate-contact", () => {
  it("returns the contact when set", async () => {
    mockSend.mockResolvedValueOnce({
      AlternateContact: {
        AlternateContactType: "BILLING",
        Name: "Jane Doe",
        Title: "CFO",
        EmailAddress: "jane@example.com",
        PhoneNumber: "+1 555 0100",
      },
    });
    const res = await get("/alternate-contact?type=BILLING");
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.contact.Name).toBe("Jane Doe");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "GetAlternateContactCommand",
        AlternateContactType: "BILLING",
      })
    );
  });

  it("maps ResourceNotFoundException to contact null", async () => {
    mockSend.mockRejectedValueOnce(
      Object.assign(new Error("not found"), { name: "ResourceNotFoundException" })
    );
    const res = await get("/alternate-contact?type=OPERATIONS");
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.contact).toBeNull();
  });

  it("maps a 404 status code to contact null", async () => {
    mockSend.mockRejectedValueOnce(
      Object.assign(new Error("not found"), { $metadata: { httpStatusCode: 404 } })
    );
    const res = await get("/alternate-contact?type=SECURITY");
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.contact).toBeNull();
  });

  it("rethrows other SDK errors", async () => {
    mockSend.mockRejectedValueOnce(
      Object.assign(new Error("boom"), { name: "InternalServerError" })
    );
    const res = await get("/alternate-contact?type=BILLING");
    expect(res.status).toBe(500);
  });

  it("400 when type missing", async () => {
    const res = await get("/alternate-contact");
    expect(res.status).toBe(400);
  });

  it("400 when type invalid", async () => {
    const res = await get("/alternate-contact?type=PLAN");
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toContain("BILLING, OPERATIONS, SECURITY");
  });

  it("returns null contact when AlternateContact absent in response", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/alternate-contact?type=BILLING");
    const json = await res.json();
    expect(json.contact).toBeNull();
  });
});

describe("PUT /alternate-contact", () => {
  it("saves the contact and passes all fields", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/alternate-contact", {
      type: "BILLING",
      name: "Jane Doe",
      title: "CFO",
      emailAddress: "jane@example.com",
      phoneNumber: "+1 555 0100",
    });
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "PutAlternateContactCommand",
        AlternateContactType: "BILLING",
        Name: "Jane Doe",
        Title: "CFO",
        EmailAddress: "jane@example.com",
        PhoneNumber: "+1 555 0100",
      })
    );
  });

  it("400 when type invalid", async () => {
    const res = await put("/alternate-contact", {
      type: "PLAN", name: "n", title: "t", emailAddress: "e@x.com", phoneNumber: "1",
    });
    expect(res.status).toBe(400);
  });

  it("400 when a required field is missing", async () => {
    const res = await put("/alternate-contact", {
      type: "BILLING", name: "n", title: "t", emailAddress: "e@x.com",
    });
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toContain("name, title, emailAddress and phoneNumber");
  });

  it("treats an unparseable body as an empty object and 400s", async () => {
    const res = await router.request("/alternate-contact", {
      method: "PUT",
      body: "{not json",
      headers: { "content-type": "application/json" },
    });
    expect(res.status).toBe(400);
  });

  it("treats a null JSON body as an empty object and 400s", async () => {
    const res = await router.request("/alternate-contact", {
      method: "PUT",
      body: "null",
      headers: { "content-type": "application/json" },
    });
    expect(res.status).toBe(400);
  });

  it("propagates SDK errors", async () => {
    mockSend.mockRejectedValueOnce(new Error("boom"));
    const res = await put("/alternate-contact", {
      type: "BILLING", name: "n", title: "t", emailAddress: "e@x.com", phoneNumber: "1",
    });
    expect(res.status).toBe(500);
  });
});
