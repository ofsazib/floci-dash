import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockPricing = vi.hoisted(() =>
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

vi.mock("@aws-sdk/client-pricing", () => ({
  PricingClient: mockPricing,
  DescribeServicesCommand: createCmd("DescribeServicesCommand"),
  GetAttributeValuesCommand: createCmd("GetAttributeValuesCommand"),
  GetProductsCommand: createCmd("GetProductsCommand"),
  ListPriceListsCommand: createCmd("ListPriceListsCommand"),
  GetPriceListFileUrlCommand: createCmd("GetPriceListFileUrlCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./pricing";

async function get(path: string) {
  return router.request(path, { method: "GET" });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSend.mockReset();
});

describe("Pricing Routes", () => {
  describe("GET /services", () => {
    it("returns services", async () => {
      mockSend.mockResolvedValueOnce({
        Services: [{ serviceCode: "AmazonEC2" }],
        FormatVersion: "aws_v1",
      });
      const res = await get("/services");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.services).toHaveLength(1);
      expect(body.total).toBe(1);
      expect(body.formatVersion).toBe("aws_v1");
    });

    it("returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ Services: [], FormatVersion: "aws_v1" });
      const res = await get("/services");
      const body = await res.json();
      expect(body.services).toEqual([]);
      expect(body.total).toBe(0);
    });
  });

  describe("GET /services/:serviceCode/attributes", () => {
    it("returns attribute values", async () => {
      mockSend.mockResolvedValueOnce({
        AttributeValues: [{ value: "Linux" }],
      });
      const res = await get("/services/AmazonEC2/attributes");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.attributeValues).toHaveLength(1);
      expect(body.total).toBe(1);
    });
  });

  describe("GET /products", () => {
    it("returns products", async () => {
      mockSend.mockResolvedValueOnce({
        PriceList: ['{"product":{"sku":"ABC123"}}'],
        FormatVersion: "aws_v1",
      });
      const res = await get("/products?serviceCode=AmazonEC2");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.priceList).toHaveLength(1);
      expect(body.total).toBe(1);
    });

    it("returns 400 when serviceCode is missing", async () => {
      const res = await get("/products");
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("serviceCode query param is required");
    });

    it("returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ PriceList: [], FormatVersion: "aws_v1" });
      const res = await get("/products?serviceCode=AmazonEC2");
      const body = await res.json();
      expect(body.priceList).toEqual([]);
      expect(body.total).toBe(0);
    });
  });

  describe("GET /price-lists", () => {
    it("returns price lists", async () => {
      mockSend.mockResolvedValueOnce({
        PriceLists: [{ priceListArn: "arn:aws:pricing::aws:price-list/1" }],
      });
      const res = await get("/price-lists?serviceCode=AmazonEC2");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.priceLists).toHaveLength(1);
      expect(body.total).toBe(1);
    });

    it("returns 400 when serviceCode is missing", async () => {
      const res = await get("/price-lists");
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("serviceCode query param is required");
    });

    it("returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ PriceLists: [] });
      const res = await get("/price-lists?serviceCode=AmazonEC2");
      const body = await res.json();
      expect(body.priceLists).toEqual([]);
      expect(body.total).toBe(0);
    });
  });

  describe("GET /price-list-file-url", () => {
    it("returns file URL", async () => {
      mockSend.mockResolvedValueOnce({
        Url: "https://pricing.us-east-1.amazonaws.com/price-list.json",
      });
      const res = await get("/price-list-file-url?priceListArn=arn:aws:pricing::aws:price-list/1&fileFormat=json");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.url).toBe("https://pricing.us-east-1.amazonaws.com/price-list.json");
    });

    it("returns 400 when priceListArn is missing", async () => {
      const res = await get("/price-list-file-url?fileFormat=json");
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("priceListArn query param is required");
    });

    it("returns 400 when fileFormat is missing", async () => {
      const res = await get("/price-list-file-url?priceListArn=arn:aws:pricing::aws:price-list/1");
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("fileFormat query param is required");
    });
  });
});
