import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockSend, createCmd } = vi.hoisted(() => {
  const mockSend = vi.fn();
  const createCmd = (name: string) => function (this: any, input: any) { return { __cmd: name, ...(input || {}) }; };
  return { mockSend, createCmd };
});

vi.mock("../../clients/aws", () => ({
  create: vi.fn(() => ({ send: mockSend })),
}));

vi.mock("@aws-sdk/client-service-catalog", () => ({
  ServiceCatalogClient: class {},
  AssociateProductWithPortfolioCommand: createCmd("AssociateProductWithPortfolioCommand"),
  CreateConstraintCommand: createCmd("CreateConstraintCommand"),
  CreatePortfolioCommand: createCmd("CreatePortfolioCommand"),
  CreateProductCommand: createCmd("CreateProductCommand"),
  CreateTagOptionCommand: createCmd("CreateTagOptionCommand"),
  DeleteConstraintCommand: createCmd("DeleteConstraintCommand"),
  DeletePortfolioCommand: createCmd("DeletePortfolioCommand"),
  DeleteProductCommand: createCmd("DeleteProductCommand"),
  DeleteProvisioningArtifactCommand: createCmd("DeleteProvisioningArtifactCommand"),
  DeleteTagOptionCommand: createCmd("DeleteTagOptionCommand"),
  DescribePortfolioCommand: createCmd("DescribePortfolioCommand"),
  DisassociateProductFromPortfolioCommand: createCmd("DisassociateProductFromPortfolioCommand"),
  ListConstraintsForPortfolioCommand: createCmd("ListConstraintsForPortfolioCommand"),
  ListPortfoliosCommand: createCmd("ListPortfoliosCommand"),
  ListPortfoliosForProductCommand: createCmd("ListPortfoliosForProductCommand"),
  ListProvisioningArtifactsCommand: createCmd("ListProvisioningArtifactsCommand"),
  ListTagOptionsCommand: createCmd("ListTagOptionsCommand"),
  ProvisionProductCommand: createCmd("ProvisionProductCommand"),
  SearchProductsAsAdminCommand: createCmd("SearchProductsAsAdminCommand"),
  SearchProvisionedProductsCommand: createCmd("SearchProvisionedProductsCommand"),
  TerminateProvisionedProductCommand: createCmd("TerminateProvisionedProductCommand"),
}));

import servicecatalogRoutes from "./servicecatalog";
import { Hono } from "hono";

const app = new Hono();
app.route("/", servicecatalogRoutes);

const get = (path: string) => app.request(path);
const post = (path: string, json?: any) =>
  app.request(path, json === undefined ? { method: "POST" } : { method: "POST", body: JSON.stringify(json), headers: { "content-type": "application/json" } });
const del = (path: string) => app.request(path, { method: "DELETE" });

beforeEach(() => {
  mockSend.mockReset();
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("servicecatalog — portfolios", () => {
  it("GET /portfolios maps and handles sparse/undefined", async () => {
    mockSend.mockResolvedValueOnce({
      PortfolioDetails: [{ Id: "port-1", DisplayName: "Dev", ProviderName: "it", Description: "d" }],
    });
    const b = await (await get("/portfolios")).json();
    expect(b.total).toBe(1);
    expect(b.portfolios[0]).toEqual({
      id: "port-1", displayName: "Dev", providerName: "it", description: "d", createdTime: null,
    });
    mockSend.mockResolvedValueOnce({});
    expect((await (await get("/portfolios")).json()).portfolios).toEqual([]);
    mockSend.mockResolvedValueOnce({ PortfolioDetails: [{}] });
    const b2 = await (await get("/portfolios")).json();
    expect(b2.portfolios[0]).toEqual({ id: undefined, displayName: null, providerName: null, description: null, createdTime: null });
  });

  it("POST /portfolios creates and validates", async () => {
    mockSend.mockResolvedValueOnce({ PortfolioDetail: { Id: "port-1" } });
    const res = await post("/portfolios", { displayName: "Dev", providerName: "it", description: "d" });
    expect(res.status).toBe(201);
    expect(mockSend.mock.calls[0][0]).toMatchObject({ DisplayName: "Dev", ProviderName: "it", Description: "d" });
    expect((await post("/portfolios", { providerName: "it" })).status).toBe(400);
    expect((await post("/portfolios", { displayName: "Dev" })).status).toBe(400);
  });

  it("GET /portfolios/detail requires id", async () => {
    mockSend.mockResolvedValueOnce({ PortfolioDetail: { Id: "port-1" } });
    const b = await (await get("/portfolios/detail?id=port-1")).json();
    expect(b.portfolio).toMatchObject({ Id: "port-1" });
    mockSend.mockResolvedValueOnce({ PortfolioDetail: null });
    const b2 = await (await get("/portfolios/detail?id=x")).json();
    expect(b2.portfolio).toBeNull();
    expect((await get("/portfolios/detail")).status).toBe(400);
  });

  it("DELETE /portfolios requires id", async () => {
    expect(await (await del("/portfolios?id=port-1")).json()).toEqual({ ok: true });
    expect((await del("/portfolios")).status).toBe(400);
  });

  it("product association validates", async () => {
    mockSend.mockResolvedValue({});
    expect(await (await post("/portfolios/associate-product", { portfolioId: "p", productId: "d" })).json()).toEqual({ ok: true });
    expect(await (await post("/portfolios/disassociate-product", { portfolioId: "p", productId: "d" })).json()).toEqual({ ok: true });
    expect((await post("/portfolios/associate-product", { productId: "d" })).status).toBe(400);
    expect((await post("/portfolios/associate-product", { portfolioId: "p" })).status).toBe(400);
    expect((await post("/portfolios/disassociate-product", { productId: "d" })).status).toBe(400);
    expect((await post("/portfolios/disassociate-product", { portfolioId: "p" })).status).toBe(400);
  });

  it("GET /portfolios/for-product requires productId", async () => {
    mockSend.mockResolvedValueOnce({ PortfolioDetails: [{ Id: "port-1" }] });
    const b = await (await get("/portfolios/for-product?productId=prod-1")).json();
    expect(b.total).toBe(1);
    expect((await get("/portfolios/for-product")).status).toBe(400);
  });
});

describe("servicecatalog — products", () => {
  it("GET /products maps summaries and handles undefined", async () => {
    mockSend.mockResolvedValueOnce({
      ProductViewDetails: [{ ProductViewSummary: { ProductId: "prod-1", Name: "n", Owner: "o" }, Status: "AVAILABLE" }],
    });
    const b = await (await get("/products")).json();
    expect(b.total).toBe(1);
    expect(b.products[0]).toEqual({ id: "prod-1", name: "n", owner: "o", type: null, status: "AVAILABLE" });
    mockSend.mockResolvedValueOnce({});
    expect((await (await get("/products")).json()).products).toEqual([]);
  });

  it("POST /products creates and validates", async () => {
    mockSend.mockResolvedValueOnce({
      ProductViewDetail: { ProductViewSummary: { ProductId: "prod-1" } },
      ProvisioningArtifactDetails: [{ Id: "pa-1" }],
    });
    const res = await post("/products", { name: "n", owner: "o", description: "d" });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: "prod-1", artifacts: [{ Id: "pa-1" }] });
    expect(mockSend.mock.calls[0][0]).toMatchObject({ Name: "n", Owner: "o", Description: "d" });
    expect((await post("/products", { owner: "o" })).status).toBe(400);
    expect((await post("/products", { name: "n" })).status).toBe(400);
  });

  it("GET /products/detail requires id", async () => {
    mockSend.mockResolvedValueOnce({
      ProductViewDetails: [{ ProductViewSummary: { ProductId: "prod-1", Name: "n" } }],
    });
    const b = await (await get("/products/detail?id=prod-1")).json();
    expect(b.product).toMatchObject({ ProductId: "prod-1" });
    mockSend.mockResolvedValueOnce({ ProductViewDetails: [] });
    const b2 = await (await get("/products/detail?id=x")).json();
    expect(b2.product).toBeNull();
    expect((await get("/products/detail")).status).toBe(400);
  });

  it("DELETE /products requires id", async () => {
    expect(await (await del("/products?id=prod-1")).json()).toEqual({ ok: true });
    expect((await del("/products")).status).toBe(400);
  });
});

describe("servicecatalog — artifacts and provisioning", () => {
  it("GET /artifacts requires productId and maps", async () => {
    mockSend.mockResolvedValueOnce({ ProvisioningArtifactDetails: [{ Id: "pa-1", Name: "v1", Active: true }] });
    const b = await (await get("/artifacts?productId=prod-1")).json();
    expect(b.total).toBe(1);
    expect(b.artifacts[0]).toEqual({ id: "pa-1", name: "v1", active: true, type: null });
    expect((await get("/artifacts")).status).toBe(400);
  });

  it("DELETE /artifacts requires both ids", async () => {
    expect(await (await del("/artifacts?productId=p&artifactId=a")).json()).toEqual({ ok: true });
    expect((await del("/artifacts?productId=p")).status).toBe(400);
    expect((await del("/artifacts?artifactId=a")).status).toBe(400);
  });

  it("POST /provision provisions and validates", async () => {
    mockSend.mockResolvedValueOnce({ RecordDetail: { RecordId: "rec-1" } });
    const res = await post("/provision", { provisionedName: "pp-1", productId: "prod-1", artifactId: "pa-1" });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ record: { RecordId: "rec-1" } });
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      ProvisionedProductName: "pp-1", ProductId: "prod-1", ProvisioningArtifactId: "pa-1",
    });
    expect((await post("/provision", { productId: "p", artifactId: "a" })).status).toBe(400);
    expect((await post("/provision", { provisionedName: "n", artifactId: "a" })).status).toBe(400);
    expect((await post("/provision", { provisionedName: "n", productId: "p" })).status).toBe(400);
  });

  it("GET /provisioned maps and handles undefined", async () => {
    mockSend.mockResolvedValueOnce({
      ProvisionedProducts: [{ Id: "pp-1", Name: "n", Status: "AVAILABLE", Type: "CFN_STACK", Arn: "arn", CreatedTime: 1, ProductId: "p", LastRecordId: "r" }],
    });
    const b = await (await get("/provisioned")).json();
    expect(b.total).toBe(1);
    expect(b.provisionedProducts[0]).toEqual({
      id: "pp-1", name: "n", status: "AVAILABLE", type: "CFN_STACK", arn: "arn",
      createdTime: 1, productId: "p", lastRecordId: "r",
    });
    mockSend.mockResolvedValueOnce(undefined);
    const b2 = await (await get("/provisioned")).json();
    expect(b2.provisionedProducts).toEqual([]);
    expect(b2.total).toBe(0);
  });

  it("POST /provisioned/terminate requires id", async () => {
    mockSend.mockResolvedValueOnce({ RecordDetail: { RecordId: "r" } });
    const res = await post("/provisioned/terminate", { provisionedProductId: "pp-1", reason: "cleanup" });
    expect(mockSend.mock.calls[0][0].ProvisionedProductId).toBe("pp-1");
    expect(mockSend.mock.calls[0][0].TerminateToken).toBeTruthy();
    expect((await post("/provisioned/terminate", { reason: "x" })).status).toBe(400);
  });
});

describe("servicecatalog — tag options", () => {
  it("GET /tag-options maps and handles sparse", async () => {
    mockSend.mockResolvedValueOnce({ TagOptionDetails: [{ Id: "to-1", Key: "env", Value: "dev", Active: true }] });
    const b = await (await get("/tag-options")).json();
    expect(b.total).toBe(1);
    expect(b.tagOptions[0]).toEqual({ id: "to-1", key: "env", value: "dev", active: true });
    mockSend.mockResolvedValueOnce({ TagOptionDetails: [{}] });
    const b2 = await (await get("/tag-options")).json();
    expect(b2.tagOptions[0]).toEqual({ id: undefined, key: null, value: null, active: null });
  });

  it("POST /tag-options creates and validates", async () => {
    mockSend.mockResolvedValueOnce({ TagOptionDetail: { Id: "to-1" } });
    const res = await post("/tag-options", { key: "env", value: "dev" });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ tagOption: { Id: "to-1" } });
    expect((await post("/tag-options", { value: "dev" })).status).toBe(400);
    expect((await post("/tag-options", { key: "env" })).status).toBe(400);
  });

  it("DELETE /tag-options requires id", async () => {
    expect(await (await del("/tag-options?id=to-1")).json()).toEqual({ ok: true });
    expect((await del("/tag-options")).status).toBe(400);
  });
});

describe("servicecatalog — sparse and optional-arm fallbacks", () => {
  it("covers optional-field arms across routes", async () => {
    mockSend.mockResolvedValue({});

    // portfolios: description omitted (67), undefined data (39 via invalid body), sparse for-product
    await post("/portfolios", { displayName: "D", providerName: "P" });
    expect(mockSend.mock.calls.at(-1)![0].Description).toBeUndefined();
    const bad = await app.request("/portfolios", { method: "POST", body: "not-json", headers: { "content-type": "application/json" } });
    expect(bad.status).toBe(400);
    mockSend.mockResolvedValueOnce({ PortfolioDetails: [{}] });
    expect((await (await get("/portfolios/for-product?productId=x")).json()).total).toBe(1);

    // products: description omitted (146), artifacts default [] (151), undefined view details (159)
    await post("/products", { name: "n", owner: "o" });
    expect(mockSend.mock.calls.at(-1)![0].Description).toBeUndefined();
    mockSend.mockResolvedValueOnce(undefined);
    const b2 = await (await get("/products")).json();
    expect(b2.products).toEqual([]);

    // artifacts: undefined list (180), sparse Name (182)
    mockSend.mockResolvedValueOnce(undefined);
    expect((await (await get("/artifacts?productId=p")).json()).artifacts).toEqual([]);
    mockSend.mockResolvedValueOnce({ ProvisioningArtifactDetails: [{}] });
    const b3 = await (await get("/artifacts?productId=p")).json();
    expect(b3.artifacts[0]).toEqual({ id: undefined, name: null, active: false, type: null });

    // provisioned: sparse row (224-230)
    mockSend.mockResolvedValueOnce({ ProvisionedProducts: [{}] });
    const b4 = await (await get("/provisioned")).json();
    expect(b4.provisionedProducts[0]).toEqual({
      id: undefined, name: null, status: null, type: null, arn: null,
      createdTime: null, productId: null, lastRecordId: null,
    });

    // terminate: reason omitted (242)
    mockSend.mockResolvedValueOnce({ RecordDetail: { RecordId: "r" } });
    await post("/provisioned/terminate", { provisionedProductId: "pp-1" });
    expect(mockSend.mock.calls.at(-1)![0].TerminateReason).toBeUndefined();

    // for-product: undefined PortfolioDetails arm (117)
    mockSend.mockResolvedValueOnce({});
    expect((await (await get("/portfolios/for-product?productId=x")).json()).portfolios).toEqual([]);

    // products: sparse rows without summary or status (126-130)
    mockSend.mockResolvedValueOnce({ ProductViewDetails: [{}] });
    const b7 = await (await get("/products")).json();
    expect(b7.products[0]).toEqual({ id: null, name: null, owner: null, type: null, status: null });

    // products detail: undefined result (159)
    mockSend.mockResolvedValueOnce(undefined);
    const b8 = await (await get("/products/detail?id=x")).json();
    expect(b8.product).toBeNull();

    // tag options: undefined TagOptionDetails arm (252)
    mockSend.mockResolvedValueOnce(undefined);
    expect((await (await get("/tag-options")).json()).tagOptions).toEqual([]);

    // constraints: no productId (283), undefined + sparse ConstraintDetails (287-292)
    mockSend.mockResolvedValueOnce(undefined);
    const b5 = await (await get("/constraints?portfolioId=p")).json();
    expect(b5.constraints).toEqual([]);
    mockSend.mockResolvedValueOnce({ ConstraintDetails: [{}] });
    const b6 = await (await get("/constraints?portfolioId=p")).json();
    expect(b6.constraints[0]).toEqual({
      id: undefined, type: null, description: null, portfolioId: null, productId: null,
    });

    // constraints create: parameters as object (311), description omitted (314)
    mockSend.mockResolvedValueOnce({ ConstraintDetail: {} });
    await post("/constraints", {
      portfolioId: "p", productId: "pr", parameters: { LocalRoleName: "r" }, type: "LAUNCH",
    });
    expect(mockSend.mock.calls.at(-1)![0].Parameters).toEqual('{"LocalRoleName":"r"}');
    expect(mockSend.mock.calls.at(-1)![0].Description).toBeUndefined();
  });
});

describe("servicecatalog — constraints", () => {
  it("GET /constraints requires portfolioId and maps", async () => {
    mockSend.mockResolvedValueOnce({
      ConstraintDetails: [{ ConstraintId: "c-1", Type: "LAUNCH", Description: "d", PortfolioId: "p", ProductId: "pr" }],
    });
    const b = await (await get("/constraints?portfolioId=p&productId=pr")).json();
    expect(b.total).toBe(1);
    expect(b.constraints[0]).toEqual({ id: "c-1", type: "LAUNCH", description: "d", portfolioId: "p", productId: "pr" });
    expect((await get("/constraints")).status).toBe(400);
  });

  it("POST /constraints creates and validates", async () => {
    mockSend.mockResolvedValueOnce({ ConstraintDetail: { ConstraintId: "c-1" } });
    const res = await post("/constraints", {
      portfolioId: "p", productId: "pr", parameters: '{"LocalRoleName":"r"}', type: "LAUNCH", description: "d",
    });
    expect(res.status).toBe(201);
    expect(mockSend.mock.calls[0][0].IdempotencyToken).toBeTruthy();
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      PortfolioId: "p", Parameters: '{"LocalRoleName":"r"}', Type: "LAUNCH", Description: "d",
    });
    expect((await post("/constraints", { productId: "pr", type: "LAUNCH", parameters: "{}" })).status).toBe(400);
    expect((await post("/constraints", { portfolioId: "p", type: "LAUNCH", parameters: "{}" })).status).toBe(400);
    expect((await post("/constraints", { portfolioId: "p", productId: "pr", type: "LAUNCH" })).status).toBe(400);
    expect((await post("/constraints", { portfolioId: "p", productId: "pr", parameters: "{}" })).status).toBe(400);
  });

  it("DELETE /constraints requires id", async () => {
    expect(await (await del("/constraints?id=c-1")).json()).toEqual({ ok: true });
    expect((await del("/constraints")).status).toBe(400);
  });
});
