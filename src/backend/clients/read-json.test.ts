import { describe, it, expect } from "vitest";
import { readJson } from "./read-json";

function fakeContext(body: unknown, jsonImpl?: () => Promise<unknown>) {
  return {
    req: {
      json: jsonImpl ?? (() => Promise.resolve(body)),
    },
  } as any;
}

describe("readJson", () => {
  it("returns the parsed JSON body", async () => {
    const body = await readJson(fakeContext({ name: "app" }));
    expect(body).toEqual({ name: "app" });
  });

  it("returns an empty object when parsing throws", async () => {
    const body = await readJson(
      fakeContext(undefined, () => Promise.reject(new Error("bad json")))
    );
    expect(body).toEqual({});
  });
});
