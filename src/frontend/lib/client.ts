import { reportError } from "./globalErrorHandler";

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    const error = new Error(err.message || `API ${res.status}`);
    reportError(error, path);
    throw error;
  }
  return res.json();
}
