import { Hono } from "hono";
import type { Context } from "hono";

const router = new Hono();

// Service routes registered as each service is implemented.
// Example:
// import s3Routes from "./s3";
// router.route("/s3", s3Routes);

router.get("/", (c: Context) => {
  return c.json({ message: "AWS routes available. Register services as they are implemented." });
});

export default router;
