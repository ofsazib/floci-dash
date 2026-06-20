# ─── Dev Stage (hot reload, typecheck, test) ───
FROM node:22-alpine AS dev
RUN corepack enable && corepack prepare pnpm@11.8.0 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile
COPY . .
CMD ["pnpm", "run", "dev"]

# ─── Build Stage ───
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@11.8.0 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# Remove devDependencies — only keep production dependencies
# This is critical: without pruning, the production image would carry
# all dev dependencies (test runners, type definitions, etc.),
# doubling or tripling the image size.
RUN pnpm prune --prod

# ─── Production Stage ───
FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app

# Copy production-only dependencies from the pruned builder.
# We skip a separate `pnpm install --prod` here, avoiding the need for
# corepack/pnpm metadata in the production image (~30-50 MB saved).
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Public assets (favicon, etc.)
COPY --from=builder /app/public ./public

EXPOSE 3000

# Health check using Node.js built-in http module (no curl/wget needed)
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/healthz', r => { process.exit(r.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

CMD ["node", "dist/backend/index.js"]
