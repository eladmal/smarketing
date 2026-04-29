# ── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer cache)
COPY package*.json ./
RUN npm ci --frozen-lockfile

# Copy source & build
COPY . .
RUN npm run build

# Prune dev dependencies
RUN npm prune --production

# ── Stage 2: Production image ─────────────────────────────────────────────────
FROM node:20-alpine AS production

# Security: run as non-root
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

WORKDIR /app

# Copy compiled output and prod node_modules only
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json

# Create upload directories owned by app user
RUN mkdir -p uploads exports && chown -R nestjs:nodejs uploads exports

USER nestjs

EXPOSE 8000

# Graceful shutdown support
CMD ["node", "dist/main"]
