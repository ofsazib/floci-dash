const DEFAULT_FLOCI_URL = process.env.FLOCI_URL || "http://localhost:4566";

let currentEndpoint = DEFAULT_FLOCI_URL;

export function getFlociEndpoint(): string {
  return currentEndpoint;
}

export function setFlociEndpoint(url: string): void {
  currentEndpoint = url.replace(/\/+$/, "");
}

export function getDefaultFlociEndpoint(): string {
  return DEFAULT_FLOCI_URL;
}

/**
 * Candidate URLs to try when the primary endpoint is unreachable.
 * Ordered by likelihood: the configured URL first, then common Docker
 * hostnames that work on different platforms.
 */
export function getCandidateEndpoints(): string[] {
  const base = getFlociEndpoint();
  const port = base.replace(/^https?:\/\//, "").replace(/\/$/, "").split(":").pop();
  const scheme = base.startsWith("https") ? "https" : "http";
  const seen = new Set<string>([base]);
  const candidates: string[] = [base];
  for (const host of ["host.docker.internal", "172.17.0.1", "127.0.0.1", "localhost"]) {
    const url = `${scheme}://${host}:${port}`;
    if (!seen.has(url)) {
      seen.add(url);
      candidates.push(url);
    }
  }
  return candidates;
}

/**
 * Probe candidate Floci endpoints and return the first one that responds
 * to /_floci/health within the timeout.
 */
export async function discoverFlociEndpoint(
  timeoutMs = 2000,
): Promise<{ working: string; candidates: string[] }> {
  const candidates = getCandidateEndpoints();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs); /* v8 ignore next: abort timer only fires on timeout */

  try {
    for (const url of candidates) {
      try {
        const res = await fetch(`${url}/_floci/health`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (res.ok) {
          setFlociEndpoint(url);
          return { working: url, candidates };
        }
      } catch {
        // try next candidate
      }
    }
  } finally {
    clearTimeout(timer);
  }

  return { working: "", candidates };
}
