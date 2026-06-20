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
