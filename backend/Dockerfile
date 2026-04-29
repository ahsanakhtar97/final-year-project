# syntax=docker/dockerfile:1.6
#
# GrowFlow backend (NestJS) -- multi-stage build.
#
# Stage 1 ("deps") installs full dependencies and produces a compiled dist/.
# Stage 2 ("runtime") is a slim image that only carries node_modules + dist.

# ---------- Stage 1: build ----------
FROM node:20-bookworm-slim AS deps

WORKDIR /app

# bcrypt needs a C toolchain to rebuild its native binding from source on
# arm64 / unusual platforms. The Debian slim base is missing it by default.
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Drop devDependencies to slim down what we copy into runtime.
RUN npm prune --omit=dev


# ---------- Stage 2: runtime ----------
FROM node:20-bookworm-slim AS runtime

ENV NODE_ENV=production
WORKDIR /app

# Create a non-root user so the running process isn't UID 0.
RUN groupadd -r app && useradd -r -g app app

COPY --from=deps --chown=app:app /app/node_modules ./node_modules
COPY --from=deps --chown=app:app /app/dist ./dist
COPY --from=deps --chown=app:app /app/package.json ./package.json

USER app

EXPOSE 3000
CMD ["node", "dist/main.js"]
