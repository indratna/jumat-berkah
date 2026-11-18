FROM node:22-alpine AS deps

WORKDIR /app

# prisma/ + prisma.config.ts must be present before `npm ci`: the root
# postinstall script runs `prisma generate`.
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci

FROM node:22-alpine AS builder

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# NEXT_PUBLIC_* values are inlined at build time, so they must be supplied as
# build args. Compose passes them from .env.production (see docker-compose).
ARG NEXT_PUBLIC_APP_URL=""
ARG NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=""
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=$NEXT_PUBLIC_MIDTRANS_CLIENT_KEY

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Next copies .env* into .next/standalone when it finds them. The build context
# excludes those files, but delete any leftovers so a local build can never bake
# secrets into the shipped artifact.
RUN rm -f .env .env.local .env.production .env.development .env.test .env.*

# Migration runner. The runtime image is a standalone build without the Prisma
# CLI, so schema changes are applied with this target instead. It prunes the
# deps stage and copies the result into a clean image: pruning in place would
# keep the removed devDependencies (and npm's cache) in the earlier layer.
FROM deps AS migrator-deps

RUN npm prune --omit=dev

FROM node:22-alpine AS migrator

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=migrator-deps /app/node_modules ./node_modules
COPY --from=migrator-deps /app/package.json ./package.json
COPY prisma ./prisma
COPY prisma.config.ts ./

CMD ["npx", "--no-install", "prisma", "migrate", "deploy"]

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Run as the unprivileged `node` user. The copies are chowned because the app
# writes uploaded receipts and distribution photos under public/uploads.
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

RUN mkdir -p /app/public/uploads/receipts /app/public/uploads/distribution \
  && chown -R node:node /app/public/uploads

USER node

EXPOSE 3000

# Liveness only: /login is prerendered and does not touch the database.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/login').then((res) => process.exit(res.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "server.js"]