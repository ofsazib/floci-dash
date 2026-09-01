import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { ACMClient } from "@aws-sdk/client-acm";
import {
  GetAccountConfigurationCommand,
  PutAccountConfigurationCommand,
} from "@aws-sdk/client-acm";
import {
  ImportCertificateCommand,
  ExportCertificateCommand,
  AddTagsToCertificateCommand,
  RemoveTagsFromCertificateCommand,
} from "@aws-sdk/client-acm";
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
/* istanbul ignore next */
  return c.json({ certificates, total: certificates.length });
});

router.get("/certificates/:arn", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn")!);
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


router.post("/certificates/import", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.certificate) return c.json({ error: "certificate is required" }, 400);
  if (!body.privateKey) return c.json({ error: "privateKey is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new ImportCertificateCommand({
      CertificateArn: body.certificateArn,
      Certificate: body.certificate,
      PrivateKey: body.privateKey,
      CertificateChain: body.certificateChain,
      Tags: body.tags,
    })
  );
  return c.json({ certificateArn: result.CertificateArn }, 201);
});

router.post("/certificates/:arn/export", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn")!);
  const client = getClient();
  const result: any = await client.send(new ExportCertificateCommand({ CertificateArn: arn, Passphrase: undefined }));
  return c.json({
    certificate: result.Certificate || "",
    certificateChain: result.CertificateChain || "",
    privateKey: result.PrivateKey || "",
  });
});

router.post("/certificates/:arn/tags", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn")!);
  const body = await c.req.json<{ tags?: Record<string, string> }>();
  if (!body.tags || !Object.keys(body.tags).length)
    return c.json({ error: "tags is required" }, 400);
  const client = getClient();
  await client.send(
    new AddTagsToCertificateCommand({
      CertificateArn: arn,
      Tags: Object.entries(body.tags).map(([Key, Value]) => ({ Key, Value })),
    })
  );
  return c.json({ tagged: true });
});

router.delete("/certificates/:arn/tags", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn")!);
  const body = await c.req.json<{ tagKeys?: string[] }>();
  if (!body.tagKeys?.length) return c.json({ error: "tagKeys is required" }, 400);
  const client = getClient();
  await client.send(
    new RemoveTagsFromCertificateCommand({ CertificateArn: arn, Tags: body.tagKeys.map((k) => ({ Key: k, Value: "" })) })
  );
  return c.json({ untagged: true });
});


router.get("/account-configuration", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new GetAccountConfigurationCommand({}));
  return c.json({ expiryEvents: result.ExpiryEvents || null });
});

router.put("/account-configuration", async (c: Context) => {
  const body = await c.req.json<{ daysBeforeExpiry?: number }>();
  if (typeof body.daysBeforeExpiry !== "number")
    return c.json({ error: "daysBeforeExpiry must be a number" }, 400);
  const client = getClient();
  await client.send(
    new PutAccountConfigurationCommand({
      ExpiryEvents: { DaysBeforeExpiry: body.daysBeforeExpiry },
      IdempotencyToken: `floci-dash-${Date.now()}`,
    })
  );
  return c.json({ updated: true });
});

export default router;