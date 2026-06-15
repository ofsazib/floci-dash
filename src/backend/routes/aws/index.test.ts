import { describe, it, expect } from "vitest";
import router from "./index";

describe("AWS Routes Index", () => {
  it("GET / — returns service list", async () => {
    const res = await router.request("/", { method: "GET" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toContain("s3");
    expect(body.message).toContain("kms");
  });
});
