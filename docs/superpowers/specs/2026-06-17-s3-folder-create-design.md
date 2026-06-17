# S3 Folder Create Feature

## Goal
Allow users to create "folders" in S3 buckets from the dashboard UI. S3 emulates folders via zero-byte objects with trailing `/` keys.

## Changes

### 1. Backend Route — `src/backend/routes/aws/s3.ts`

Add `PUT /buckets/:name/folders` endpoint:

```ts
router.put("/buckets/:name/folders", async (c: Context) => {
  const bucket = c.req.param("name");
  const { prefix } = await c.req.json<{ prefix: string }>();
  if (!prefix) return c.json({ error: "prefix is required" }, 400);
  await s3().send(new PutObjectCommand({ Bucket: bucket, Key: prefix, Body: "" }));
  return c.json({ bucket, prefix, created: true });
});
```

- Uses existing `PutObjectCommand` (already imported)
- Zero-byte empty body creates the folder marker
- 400 if prefix missing

### 2. Frontend Hook — `src/frontend/hooks/useS3.ts`

Add `useS3CreateFolder`:

```ts
export function useS3CreateFolder(bucket: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (prefix: string) =>
      api(`/aws/s3/buckets/${bucket}/folders`, {
        method: "PUT",
        body: JSON.stringify({ prefix }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "s3", "objects", bucket] }),
  });
}
```

### 3. Frontend UI — `src/frontend/pages/S3Page.tsx` (`S3ObjectBrowser`)

- Add "Create folder" button in header actions (next to Upload)
- State: `createFolderOpen` boolean, `newFolderName` string
- Modal with input for folder name
- On submit: call `useS3CreateFolder(bucket)` with `prefix + name + "/"`
- After success: refetch, clear input, close modal, show toast

### 4. Tests

**`s3.test.ts`** — 3 tests:
1. PUT happy path → 200, created: true, PutObjectCommand called with empty Body
2. PUT missing prefix → 400
3. PUT SDK error → propagates

**`useS3.test.ts`** — 2 tests:
1. Calls api with correct URL/method/body
2. Invalidates objects query on success

## Files to modify
| File | Action |
|------|--------|
| `src/backend/routes/aws/s3.ts` | Add PUT route |
| `src/frontend/hooks/useS3.ts` | Add useS3CreateFolder hook |
| `src/frontend/pages/S3Page.tsx` | Add Create folder button + modal |
| `src/backend/routes/aws/s3.test.ts` | Add 3 tests |
| `src/frontend/hooks/useS3.test.ts` | Add 2 tests |
| `PLAN.md` | Mark tasks 1.15-1.18 Done |

## Verification
- `make typecheck` passes
- `pnpm run test:unit` passes (1558+ tests)
- `pnpm run build` passes
