const FLOCI_URL = process.env.FLOCI_URL || "http://localhost:4566";

export async function flociFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${FLOCI_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) throw new Error(`Floci ${res.status}: ${res.statusText}`);
  return res.json();
}
