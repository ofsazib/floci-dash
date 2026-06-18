import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());
const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) { return { __cmdName: name, ...args }; });
  };
});

vi.mock("@aws-sdk/client-acm", () => ({
  ACMClient: vi.fn(function () { return { send: mockSend }; }),
  ListCertificatesCommand: createCmd("ListCertificatesCommand"),
  DescribeCertificateCommand: createCmd("DescribeCertificateCommand"),
  RequestCertificateCommand: createCmd("RequestCertificateCommand"),
  DeleteCertificateCommand: createCmd("DeleteCertificateCommand"),
  GetCertificateCommand: createCmd("GetCertificateCommand"),
  ListTagsForCertificateCommand: createCmd("ListTagsForCertificateCommand"),
}));

vi.mock("../../clients/aws", () => ({ create: (Ctor: any, extra?: any) => new Ctor(extra) }));

import router from "./acm";

async function get(p: string) { return router.request(p, { method: "GET" }); }
async function post(p: string, b?: any) {
  return router.request(p, { method: "POST", body: b != null ? JSON.stringify(b) : undefined, headers: b != null ? { "content-type": "application/json" } : undefined });
}
async function del(p: string) { return router.request(p, { method: "DELETE" }); }

beforeEach(() => mockSend.mockReset());

const ARN = "arn:aws:acm:us-east-1:123:certificate/abc-123";
const ARN_ENCODED = encodeURIComponent(ARN);

describe("ACM Routes", () => {
  it("GET /certificates — lists certs", async () => {
    mockSend.mockResolvedValueOnce({ CertificateSummaryList: [{ CertificateArn: ARN, DomainName: "example.com", Status: "ISSUED" }] });
    const res = await get("/certificates");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
  });

  it("GET /certificates — empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/certificates");
    const body = await res.json();
    expect(body.total).toBe(0);
  });

  it("GET /certificates/:arn — describes cert", async () => {
    mockSend.mockResolvedValueOnce({ Certificate: { CertificateArn: ARN, DomainName: "example.com" } });
    const res = await get(`/certificates/${ARN_ENCODED}`);
    expect(res.status).toBe(200);
  });

  it("GET /certificates/:arn/pem — gets PEM", async () => {
    mockSend.mockResolvedValueOnce({ Certificate: "-----BEGIN CERTIFICATE-----", CertificateChain: "chain" });
    const res = await get(`/certificates/${ARN_ENCODED}/pem`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.certificate).toContain("CERTIFICATE");
  });

  it("POST /certificates — requests cert (201)", async () => {
    mockSend.mockResolvedValueOnce({ CertificateArn: ARN });
    const res = await post("/certificates", { domainName: "example.com" });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.certificateArn).toBe(ARN);
  });

  it("POST /certificates — 400 if domainName missing", async () => {
    const res = await post("/certificates", {});
    expect(res.status).toBe(400);
  });

  it("DELETE /certificates/:arn — deletes cert", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del(`/certificates/${ARN_ENCODED}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });

  it("GET /certificates/:arn/tags — lists tags", async () => {
    mockSend.mockResolvedValueOnce({ Tags: [{ Key: "env", Value: "prod" }] });
    const res = await get(`/certificates/${ARN_ENCODED}/tags`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tags.length).toBe(1);
  });
});
