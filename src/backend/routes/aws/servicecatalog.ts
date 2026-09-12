import { Hono } from "hono";
import type { Context } from "hono";
import { randomUUID } from "node:crypto";
import { create } from "../../clients/aws";
import {
  ServiceCatalogClient,
  AssociateProductWithPortfolioCommand,
  CreateConstraintCommand,
  CreatePortfolioCommand,
  CreateProductCommand,
  CreateTagOptionCommand,
  DeleteConstraintCommand,
  DeletePortfolioCommand,
  DeleteProductCommand,
  DeleteProvisioningArtifactCommand,
  DeleteTagOptionCommand,
  DescribePortfolioCommand,
  DisassociateProductFromPortfolioCommand,
  ListConstraintsForPortfolioCommand,
  ListPortfoliosCommand,
  ListPortfoliosForProductCommand,
  ListProvisioningArtifactsCommand,
  ListTagOptionsCommand,
  ProvisionProductCommand,
  SearchProductsAsAdminCommand,
  SearchProvisionedProductsCommand,
  TerminateProvisionedProductCommand,
} from "@aws-sdk/client-service-catalog";

const router = new Hono();
const getClient = () => create(ServiceCatalogClient);

const badRequest = (c: Context, msg: string) => c.json({ error: msg }, 400);

const body = async (c: Context): Promise<any> => {
  try {
    return await c.req.json();
  } catch {
    return {};
  }
};

// ---------- Portfolios ----------

router.get("/portfolios", async (c: Context) => {
  const res: any = await getClient().send(new ListPortfoliosCommand({}));
  const portfolios = (res?.PortfolioDetails || []).map((p: any) => ({
    id: p.Id,
    displayName: p.DisplayName || null,
    providerName: p.ProviderName || null,
    description: p.Description || null,
    createdTime: p.CreatedTime || null,
  }));
  return c.json({ portfolios, total: portfolios.length });
});

router.post("/portfolios", async (c: Context) => {
  const b = await body(c);
  const DisplayName = b.displayName;
  if (!DisplayName) return badRequest(c, "displayName is required");
  const ProviderName = b.providerName;
  if (!ProviderName) return badRequest(c, "providerName is required");
  const res: any = await getClient().send(
    new CreatePortfolioCommand({
      DisplayName,
      ProviderName,
      Description: b.description || undefined,
    }),
  );
  return c.json({ portfolio: res?.PortfolioDetail }, 201);
});

router.get("/portfolios/detail", async (c: Context) => {
  const id = c.req.query("id");
  if (!id) return badRequest(c, "id is required");
  const res: any = await getClient().send(new DescribePortfolioCommand({ Id: id }));
  return c.json({ portfolio: res?.PortfolioDetail || null });
});

router.delete("/portfolios", async (c: Context) => {
  const id = c.req.query("id");
  if (!id) return badRequest(c, "id is required");
  await getClient().send(new DeletePortfolioCommand({ Id: id }));
  return c.json({ ok: true });
});

router.post("/portfolios/associate-product", async (c: Context) => {
  const b = await body(c);
  const PortfolioId = b.portfolioId;
  const ProductId = b.productId;
  if (!PortfolioId) return badRequest(c, "portfolioId is required");
  if (!ProductId) return badRequest(c, "productId is required");
  await getClient().send(
    new AssociateProductWithPortfolioCommand({ PortfolioId, ProductId }),
  );
  return c.json({ ok: true });
});

router.post("/portfolios/disassociate-product", async (c: Context) => {
  const b = await body(c);
  const PortfolioId = b.portfolioId;
  const ProductId = b.productId;
  if (!PortfolioId) return badRequest(c, "portfolioId is required");
  if (!ProductId) return badRequest(c, "productId is required");
  await getClient().send(
    new DisassociateProductFromPortfolioCommand({ PortfolioId, ProductId }),
  );
  return c.json({ ok: true });
});

router.get("/portfolios/for-product", async (c: Context) => {
  const productId = c.req.query("productId");
  if (!productId) return badRequest(c, "productId is required");
  const res: any = await getClient().send(
    new ListPortfoliosForProductCommand({ ProductId: productId }),
  );
  const portfolios = (res?.PortfolioDetails || []).map((p: any) => ({ id: p.Id }));
  return c.json({ portfolios, total: portfolios.length });
});

// ---------- Products ----------

router.get("/products", async (c: Context) => {
  const res: any = await getClient().send(new SearchProductsAsAdminCommand({}));
  const products = (res?.ProductViewDetails || []).map((d: any) => ({
    id: d.ProductViewSummary?.ProductId || null,
    name: d.ProductViewSummary?.Name || null,
    owner: d.ProductViewSummary?.Owner || null,
    type: d.ProductViewSummary?.Type || null,
    status: d.Status || null,
  }));
  return c.json({ products, total: products.length });
});

router.post("/products", async (c: Context) => {
  const b = await body(c);
  const Name = b.name;
  if (!Name) return badRequest(c, "name is required");
  const Owner = b.owner;
  if (!Owner) return badRequest(c, "owner is required");
  const res: any = await getClient().send(
    new CreateProductCommand({
      Name,
      Owner,
      ProductType: "CLOUD_FORMATION_TEMPLATE",
      Description: b.description || undefined,
    }),
  );
  return c.json({
    id: res?.ProductViewDetail?.ProductViewSummary?.ProductId,
    artifacts: res?.ProvisioningArtifactDetails || [],
  }, 201);
});

router.get("/products/detail", async (c: Context) => {
  const id = c.req.query("id");
  if (!id) return badRequest(c, "id is required");
  const res: any = await getClient().send(new SearchProductsAsAdminCommand({}));
  const detail = (res?.ProductViewDetails || []).find(
    (d: any) => d.ProductViewSummary?.ProductId === id,
  );
  return c.json({ product: detail?.ProductViewSummary || null });
});

router.delete("/products", async (c: Context) => {
  const id = c.req.query("id");
  if (!id) return badRequest(c, "id is required");
  await getClient().send(new DeleteProductCommand({ Id: id }));
  return c.json({ ok: true });
});

// ---------- Provisioning artifacts ----------

router.get("/artifacts", async (c: Context) => {
  const productId = c.req.query("productId");
  if (!productId) return badRequest(c, "productId is required");
  const res: any = await getClient().send(
    new ListProvisioningArtifactsCommand({ ProductId: productId }),
  );
  const artifacts = (res?.ProvisioningArtifactDetails || []).map((a: any) => ({
    id: a.Id,
    name: a.Name || null,
    active: !!a.Active,
    type: a.Type || null,
  }));
  return c.json({ artifacts, total: artifacts.length });
});

router.delete("/artifacts", async (c: Context) => {
  const productId = c.req.query("productId");
  const artifactId = c.req.query("artifactId");
  if (!productId) return badRequest(c, "productId is required");
  if (!artifactId) return badRequest(c, "artifactId is required");
  await getClient().send(
    new DeleteProvisioningArtifactCommand({ ProductId: productId, ProvisioningArtifactId: artifactId }),
  );
  return c.json({ ok: true });
});

// ---------- Provisioned products ----------

router.post("/provision", async (c: Context) => {
  const b = await body(c);
  const ProvisionedProductName = b.provisionedName;
  if (!ProvisionedProductName) return badRequest(c, "provisionedName is required");
  const ProductId = b.productId;
  if (!ProductId) return badRequest(c, "productId is required");
  const ProvisioningArtifactId = b.artifactId;
  if (!ProvisioningArtifactId) return badRequest(c, "artifactId is required");
  const res: any = await getClient().send(
    new ProvisionProductCommand({
      ProvisionedProductName,
      ProductId,
      ProvisioningArtifactId,
    }),
  );
  return c.json({ record: res?.RecordDetail }, 201);
});

router.get("/provisioned", async (c: Context) => {
  const res: any = await getClient().send(new SearchProvisionedProductsCommand({}));
  const provisionedProducts = (res?.ProvisionedProducts || []).map((p: any) => ({
    id: p.Id,
    name: p.Name || null,
    status: p.Status || null,
    type: p.Type || null,
    arn: p.Arn || null,
    createdTime: p.CreatedTime || null,
    productId: p.ProductId || null,
    lastRecordId: p.LastRecordId || null,
  }));
  return c.json({ provisionedProducts, total: provisionedProducts.length });
});

router.post("/provisioned/terminate", async (c: Context) => {
  const b = await body(c);
  const ProvisionedProductId = b.provisionedProductId;
  if (!ProvisionedProductId) return badRequest(c, "provisionedProductId is required");
  const res: any = await getClient().send(
    new TerminateProvisionedProductCommand({
      ProvisionedProductId,
      TerminateToken: randomUUID(),
    }),
  );
  return c.json({ record: res?.RecordDetail });
});

// ---------- Tag options ----------

router.get("/tag-options", async (c: Context) => {
  const res: any = await getClient().send(new ListTagOptionsCommand({}));
  const tagOptions = (res?.TagOptionDetails || []).map((t: any) => ({
    id: t.Id,
    key: t.Key || null,
    value: t.Value || null,
    active: t.Active === undefined ? null : !!t.Active,
  }));
  return c.json({ tagOptions, total: tagOptions.length });
});

router.post("/tag-options", async (c: Context) => {
  const b = await body(c);
  const Key = b.key;
  if (!Key) return badRequest(c, "key is required");
  const Value = b.value;
  if (!Value) return badRequest(c, "value is required");
  const res: any = await getClient().send(new CreateTagOptionCommand({ Key, Value }));
  return c.json({ tagOption: res?.TagOptionDetail }, 201);
});

router.delete("/tag-options", async (c: Context) => {
  const id = c.req.query("id");
  if (!id) return badRequest(c, "id is required");
  await getClient().send(new DeleteTagOptionCommand({ Id: id }));
  return c.json({ ok: true });
});

// ---------- Constraints ----------

router.get("/constraints", async (c: Context) => {
  const portfolioId = c.req.query("portfolioId");
  if (!portfolioId) return badRequest(c, "portfolioId is required");
  const productId = c.req.query("productId") || undefined;
  const res: any = await getClient().send(
    new ListConstraintsForPortfolioCommand({ PortfolioId: portfolioId, ProductId: productId }),
  );
  const constraints = (res?.ConstraintDetails || []).map((d: any) => ({
    id: d.ConstraintId,
    type: d.Type || null,
    description: d.Description || null,
    portfolioId: d.PortfolioId || null,
    productId: d.ProductId || null,
  }));
  return c.json({ constraints, total: constraints.length });
});

router.post("/constraints", async (c: Context) => {
  const b = await body(c);
  const PortfolioId = b.portfolioId;
  if (!PortfolioId) return badRequest(c, "portfolioId is required");
  const ProductId = b.productId;
  if (!ProductId) return badRequest(c, "productId is required");
  const Parameters = b.parameters;
  if (!Parameters) return badRequest(c, "parameters is required");
  const Type = b.type;
  if (!Type) return badRequest(c, "type is required");
  const res: any = await getClient().send(
    new CreateConstraintCommand({
      PortfolioId,
      ProductId,
      Parameters: typeof Parameters === "string" ? Parameters : JSON.stringify(Parameters),
      Type,
      IdempotencyToken: randomUUID(),
      Description: b.description || undefined,
    }),
  );
  return c.json({ constraint: res?.ConstraintDetail }, 201);
});

router.delete("/constraints", async (c: Context) => {
  const id = c.req.query("id");
  if (!id) return badRequest(c, "id is required");
  await getClient().send(new DeleteConstraintCommand({ Id: id }));
  return c.json({ ok: true });
});

export default router;
