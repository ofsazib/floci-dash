const FLOCI_URL = process.env.FLOCI_URL || "http://localhost:4566";
const REGION = process.env.AWS_REGION || "us-east-1";
const CREDS = { accessKeyId: "test", secretAccessKey: "test" };

function create<T>(Ctor: new (c: any) => T, extra?: any): T {
  return new Ctor({ endpoint: FLOCI_URL, region: REGION, credentials: CREDS, ...extra });
}

export { create };

export function getAwsConfig() {
  return { endpoint: FLOCI_URL, region: REGION, credentials: CREDS };
}
