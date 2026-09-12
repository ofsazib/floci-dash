import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface ScPortfolio {
  id: string;
  displayName: string | null;
  providerName: string | null;
  description: string | null;
  createdTime: string | null;
}

export interface ScProduct {
  id: string | null;
  name: string | null;
  owner: string | null;
  type: string | null;
  status: string | null;
}

export interface ScProvisionedProduct {
  id: string;
  name: string | null;
  status: string | null;
  type: string | null;
  arn: string | null;
  createdTime: string | null;
  productId: string | null;
  lastRecordId: string | null;
}

export interface ScTagOption {
  id: string;
  key: string | null;
  value: string | null;
  active: boolean | null;
}

export interface ScConstraint {
  id: string;
  type: string | null;
  description: string | null;
  portfolioId: string | null;
  productId: string | null;
}

const BASE = "/aws/servicecatalog";

// ---------- Portfolios ----------

export function useScPortfolios() {
  return useQuery({
    queryKey: ["servicecatalog", "portfolios"],
    queryFn: () => api<{ portfolios: ScPortfolio[]; total: number }>(`${BASE}/portfolios`),
  });
}

export function useScCreatePortfolio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { displayName: string; providerName: string; description?: string }) =>
      api(`${BASE}/portfolios`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["servicecatalog"] }),
  });
}

export function useScDeletePortfolio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`${BASE}/portfolios?id=${encodeURIComponent(id)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["servicecatalog"] }),
  });
}

export function useScAssociateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { portfolioId: string; productId: string }) =>
      api(`${BASE}/portfolios/associate-product`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["servicecatalog"] }),
  });
}

// ---------- Products ----------

export function useScProducts() {
  return useQuery({
    queryKey: ["servicecatalog", "products"],
    queryFn: () => api<{ products: ScProduct[]; total: number }>(`${BASE}/products`),
  });
}

export function useScCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; owner: string; description?: string }) =>
      api(`${BASE}/products`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["servicecatalog"] }),
  });
}

export function useScDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`${BASE}/products?id=${encodeURIComponent(id)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["servicecatalog"] }),
  });
}

// ---------- Artifacts ----------

export function useScArtifacts(productId: string | null) {
  return useQuery({
    queryKey: ["servicecatalog", "artifacts", productId],
    queryFn: () =>
      api<{ artifacts: { id: string; name: string | null; active: boolean; type: string | null }[]; total: number }>(
        `${BASE}/artifacts?productId=${encodeURIComponent(productId!)}`,
      ),
    enabled: !!productId,
  });
}

// ---------- Provisioned products ----------

export function useScProvisioned() {
  return useQuery({
    queryKey: ["servicecatalog", "provisioned"],
    queryFn: () =>
      api<{ provisionedProducts: ScProvisionedProduct[]; total: number }>(`${BASE}/provisioned`),
  });
}

export function useScProvision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { provisionedName: string; productId: string; artifactId: string }) =>
      api(`${BASE}/provision`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["servicecatalog"] }),
  });
}

export function useScTerminateProvisioned() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (provisionedProductId: string) =>
      api(`${BASE}/provisioned/terminate`, {
        method: "POST",
        body: JSON.stringify({ provisionedProductId }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["servicecatalog"] }),
  });
}

// ---------- Tag options ----------

export function useScTagOptions() {
  return useQuery({
    queryKey: ["servicecatalog", "tag-options"],
    queryFn: () => api<{ tagOptions: ScTagOption[]; total: number }>(`${BASE}/tag-options`),
  });
}

export function useScCreateTagOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { key: string; value: string }) =>
      api(`${BASE}/tag-options`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["servicecatalog"] }),
  });
}

export function useScDeleteTagOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`${BASE}/tag-options?id=${encodeURIComponent(id)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["servicecatalog"] }),
  });
}

// ---------- Constraints ----------

export function useScConstraints(portfolioId: string | null) {
  return useQuery({
    queryKey: ["servicecatalog", "constraints", portfolioId],
    queryFn: () =>
      api<{ constraints: ScConstraint[]; total: number }>(
        `${BASE}/constraints?portfolioId=${encodeURIComponent(portfolioId!)}`,
      ),
    enabled: !!portfolioId,
  });
}

export function useScCreateConstraint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      portfolioId: string;
      productId: string;
      parameters: string;
      type: string;
      description?: string;
    }) => api(`${BASE}/constraints`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["servicecatalog"] }),
  });
}

export function useScDeleteConstraint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`${BASE}/constraints?id=${encodeURIComponent(id)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["servicecatalog"] }),
  });
}
