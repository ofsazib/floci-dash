import { getFlociEndpoint } from "./config";

export async function flociFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${getFlociEndpoint()}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) throw new Error(`Floci ${res.status}: ${res.statusText}`);
  return res.json();
}
