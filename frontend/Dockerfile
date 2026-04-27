# ─────────────────────────────────────────────
# Stage 1 — Dependencies
# ─────────────────────────────────────────────
FROM node:22-alpine AS deps

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --include=dev

# ─────────────────────────────────────────────
# Stage 2 — Builder
# ─────────────────────────────────────────────
FROM node:22-alpine AS builder

RUN apk update && apk upgrade

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# NEXT_PUBLIC_API_URL is intentionally NOT set here.
# Next.js will read it from the runtime environment via
# the instrumentation / rewrites approach in next.config.ts.
# This means the same Docker image works in every environment
# (local, staging, prod) — no rebuild needed per environment.
RUN npm run build

# ─────────────────────────────────────────────
# Stage 3 — Runner
# ─────────────────────────────────────────────
FROM node:22-alpine AS runner

RUN apk add --no-cache dumb-init

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create a non-root user — never run as root in production
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 --ingroup nodejs nextjs

# Copy only what Next.js standalone output needs:
# 1. public/          — static assets served directly
# 2. .next/standalone — the self-contained Node server (no node_modules needed)
# 3. .next/static     — hashed JS/CSS chunks (served by the standalone server)
COPY --from=builder /app/public                          ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static     ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]