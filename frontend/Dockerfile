# syntax=docker/dockerfile:1.6
#
# GrowFlow frontend (Next.js 15) -- multi-stage build.
#
# Stage 1 builds the Next.js standalone output.
# Stage 2 runs only the standalone server.

# ---------- Stage 1: build ----------
FROM node:20-bookworm-slim AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# NEXT_PUBLIC_* values must be present at build time so they're inlined into
# the client bundle. Pass them as build args from docker compose.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN npm run build


# ---------- Stage 2: runtime ----------
FROM node:20-bookworm-slim AS runtime

ENV NODE_ENV=production
ENV PORT=4000
WORKDIR /app

RUN groupadd -r app && useradd -r -g app app

# Standalone output bundles only the deps Next.js actually uses.
COPY --from=deps --chown=app:app /app/.next/standalone ./
COPY --from=deps --chown=app:app /app/.next/static ./.next/static
COPY --from=deps --chown=app:app /app/public ./public

USER app

EXPOSE 4000
CMD ["node", "server.js"]
