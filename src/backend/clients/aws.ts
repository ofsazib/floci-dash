import { getFlociEndpoint } from "./config";

const REGION = process.env.AWS_REGION || "us-east-1";
const CREDS = { accessKeyId: "test", secretAccessKey: "test" };

function create<T>(Ctor: new (c: any) => T, extra?: any): T {
  return new Ctor({ endpoint: getFlociEndpoint(), region: REGION, credentials: CREDS, ...extra });
}

export { create };

export function getAwsConfig() {
  return { endpoint: getFlociEndpoint(), region: REGION, credentials: CREDS };
}
