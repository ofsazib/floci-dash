import { Hono } from "hono";
import type { Context } from "hono";
import s3Routes from "./s3";
import dynamodbRoutes from "./dynamodb";

const router = new Hono();

router.route("/s3", s3Routes);
router.route("/dynamodb", dynamodbRoutes);

router.get("/", (c: Context) => {
  return c.json({ message: "AWS routes available. Services registered: s3, dynamodb" });
});

export default router;
