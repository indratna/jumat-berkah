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
# CLI, so schema changes are applied with this target instead.
FROM node:22-alpine AS migrator

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci --omit=dev

CMD ["npx", "prisma", "migrate", "deploy"]

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]