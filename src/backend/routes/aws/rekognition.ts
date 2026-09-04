import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import {
  RekognitionClient,
  DetectLabelsCommand,
  DetectFacesCommand,
  DetectTextCommand,
  DetectModerationLabelsCommand,
  CompareFacesCommand,
} from "@aws-sdk/client-rekognition";

const router = new Hono();
const getClient = () => create(RekognitionClient);

/**
 * Convert the camelCase image payload sent by the dashboard into the SDK's
 * PascalCase Image shape. Bytes arrive as a base64 string (the JSON-1.1 blob
 * wire format) and are decoded to bytes; S3Object is kept when provided.
 */
function toSdkImage(image: any) {
  // Callers reject a missing image first, so `image` is always an object here.
  if (image.bytes != null) {
    return { Bytes: Buffer.from(image.bytes, "base64") };
  }
  if (image.s3Object) {
    return {
      S3Object: {
        Bucket: image.s3Object.bucket,
        Name: image.s3Object.name,
      },
    };
  }
  return undefined;
}

router.post("/detect-labels", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body?.image) return c.json({ error: "image is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new DetectLabelsCommand({ Image: toSdkImage(body.image), MaxLabels: body.maxLabels, MinConfidence: body.minConfidence })
  );
  return c.json({
    labels: (result.Labels || []).map((l: any) => ({
      name: l.Name,
      confidence: l.Confidence,
    })),
    labelModelVersion: result.LabelModelVersion ?? null,
  });
});

router.post("/detect-faces", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body?.image) return c.json({ error: "image is required" }, 400);
  const client = getClient();
  const result = await client.send(new DetectFacesCommand({ Image: toSdkImage(body.image) }));
  return c.json({
    faceDetails: result.FaceDetails || [],
  });
});

router.post("/detect-text", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body?.image) return c.json({ error: "image is required" }, 400);
  const client = getClient();
  const result = await client.send(new DetectTextCommand({ Image: toSdkImage(body.image) }));
  return c.json({
    textDetections: result.TextDetections || [],
    textModelVersion: result.TextModelVersion ?? null,
  });
});

router.post("/detect-moderation-labels", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body?.image) return c.json({ error: "image is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new DetectModerationLabelsCommand({ Image: toSdkImage(body.image) })
  );
  return c.json({
    moderationLabels: result.ModerationLabels || [],
    moderationModelVersion: result.ModerationModelVersion ?? null,
  });
});

router.post("/compare-faces", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body?.sourceImage) return c.json({ error: "sourceImage is required" }, 400);
  if (!body?.targetImage) return c.json({ error: "targetImage is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CompareFacesCommand({
      SourceImage: toSdkImage(body.sourceImage),
      TargetImage: toSdkImage(body.targetImage),
      SimilarityThreshold: body.similarityThreshold,
    })
  );
  return c.json({
    sourceImageFace: result.SourceImageFace ?? null,
    faceMatches: result.FaceMatches || [],
    unmatchedFaces: result.UnmatchedFaces || [],
  });
});

export default router;
