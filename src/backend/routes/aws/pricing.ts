import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { PricingClient } from "@aws-sdk/client-pricing";
import {
  DescribeServicesCommand,
  GetAttributeValuesCommand,
  GetProductsCommand,
  ListPriceListsCommand,
  GetPriceListFileUrlCommand,
} from "@aws-sdk/client-pricing";

const router = new Hono();
const getClient = () => create(PricingClient);

router.get("/services", async (c: Context) => {
  const formatVersion = c.req.query("formatVersion") || "aws_v1";
  const maxResults = Number(c.req.query("maxResults")) || 100;
  const serviceCode = c.req.query("serviceCode") || undefined;

  const client = getClient();
  const result = await client.send(
    new DescribeServicesCommand({ FormatVersion: formatVersion, MaxResults: maxResults, ServiceCode: serviceCode })
  );
  return c.json({
    services: result.Services || [],
    total: (result.Services || []).length,
    formatVersion: result.FormatVersion,
  });
});

router.get("/services/:serviceCode/attributes", async (c: Context) => {
  const serviceCode = c.req.param("serviceCode");
  const attributeName = c.req.query("attributeName") || "";
  const maxResults = Number(c.req.query("maxResults")) || 100;

  const client = getClient();
  const result = await client.send(
    new GetAttributeValuesCommand({ ServiceCode: serviceCode, AttributeName: attributeName, MaxResults: maxResults })
  );
  return c.json({
    attributeValues: result.AttributeValues || [],
    total: (result.AttributeValues || []).length,
  });
});

router.get("/products", async (c: Context) => {
  const serviceCode = c.req.query("serviceCode") || "";
  const filters = c.req.query("filters") ? JSON.parse(c.req.query("filters")!) : undefined;
  const maxResults = Number(c.req.query("maxResults")) || 100;
  const formatVersion = c.req.query("formatVersion") || "aws_v1";

  if (!serviceCode) return c.json({ error: "serviceCode query param is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new GetProductsCommand({ ServiceCode: serviceCode, Filters: filters, MaxResults: maxResults, FormatVersion: formatVersion })
  );
  return c.json({
    priceList: result.PriceList || [],
    total: (result.PriceList || []).length,
    formatVersion: result.FormatVersion,
  });
});

router.get("/price-lists", async (c: Context) => {
  const serviceCode = c.req.query("serviceCode") || "";
  const currencyCode = c.req.query("currencyCode") || "USD";
  const effectiveDate = c.req.query("effectiveDate");
  const regionCode = c.req.query("regionCode");
  const maxResults = Number(c.req.query("maxResults")) || 100;

  if (!serviceCode) return c.json({ error: "serviceCode query param is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new ListPriceListsCommand({
      ServiceCode: serviceCode,
      CurrencyCode: currencyCode,
      EffectiveDate: effectiveDate ? new Date(effectiveDate) : undefined,
      RegionCode: regionCode,
      MaxResults: maxResults,
    })
  );
  return c.json({
    priceLists: result.PriceLists || [],
    total: (result.PriceLists || []).length,
  });
});

router.get("/price-list-file-url", async (c: Context) => {
  const priceListArn = c.req.query("priceListArn") || "";
  const fileFormat = c.req.query("fileFormat") || "";
  if (!priceListArn) return c.json({ error: "priceListArn query param is required" }, 400);
  if (!fileFormat) return c.json({ error: "fileFormat query param is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new GetPriceListFileUrlCommand({ PriceListArn: priceListArn, FileFormat: fileFormat })
  );
  return c.json({ url: result.Url });
});

export default router;
