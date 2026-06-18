import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { ACMClient } from "@aws-sdk/client-acm";
import {
  ListCertificatesCommand,
  DescribeCertificateCommand,
  RequestCertificateCommand,
  DeleteCertificateCommand,
  GetCertificateCommand,
  ListTagsForCertificateCommand,
} from "@aws-sdk/client-acm";

const router = new Hono();
const getClient = () => create(ACMClient);

// ── Certificates ─────────────────────────────────────────

router.get("/certificates", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListCertificatesCommand({}));
  const certificates = result.CertificateSummaryList || [];
  return c.json({ certificates, total: certificates.length });
});

router.get("/certificates/:arn", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn")!!);
  const client = getClient();
  const result = await client.send(new DescribeCertificateCommand({ CertificateArn: arn }));
  return c.json({ certificate: result.Certificate });
});

router.get("/certificates/:arn/pem", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn")!);
  const client = getClient();
  const result = await client.send(new GetCertificateCommand({ CertificateArn: arn }));
  return c.json({
    certificate: result.Certificate,
    certificateChain: result.CertificateChain,
  });
});

router.post("/certificates", async (c: Context) => {
  const body = await c.req.json<{
    domainName: string;
    subjectAlternativeNames?: string[];
    validationMethod?: string;
    keyAlgorithm?: string;
    tags?: { Key: string; Value: string }[];
  }>();
  if (!body.domainName) return c.json({ error: "domainName is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new RequestCertificateCommand({
      DomainName: body.domainName,
      SubjectAlternativeNames: body.subjectAlternativeNames,
      ValidationMethod: body.validationMethod as any,
      KeyAlgorithm: body.keyAlgorithm as any,
      Tags: body.tags,
    })
  );
  return c.json({ certificateArn: result.CertificateArn }, 201);
});

router.delete("/certificates/:arn", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn")!);
  const client = getClient();
  await client.send(new DeleteCertificateCommand({ CertificateArn: arn }));
  return c.json({ deleted: true });
});

// ── Tags ─────────────────────────────────────────────────

router.get("/certificates/:arn/tags", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn")!);
  const client = getClient();
  const result = await client.send(new ListTagsForCertificateCommand({ CertificateArn: arn }));
  return c.json({ tags: result.Tags || [] });
});

export default router;
