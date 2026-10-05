# Fly.io Dockerfile for RISKY-DEX Backend
# Multi-stage build - uses esbuild for fast transpilation (no type checking)

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Create prisma directory and copy schema
RUN mkdir -p prisma
COPY backend/prisma/schema.prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma Client with linux-musl binary target
ENV PRISMA_CLI_BINARY_TARGETS=linux-musl-openssl-3.0.x
RUN npx prisma generate

# Copy source code
COPY backend/ .

# Install esbuild for fast transpilation
RUN npm install --save-dev esbuild

# Transpile TypeScript to JavaScript using esbuild (no type checking)
RUN npx esbuild src/index.ts \
  --platform=node \
  --target=node20 \
  --format=cjs \
  --outdir=dist \
  --bundle \
  --external:@prisma/client \
  --external:ws \
  --external:express \
  --external:cors \
  --external:helmet \
  --external:morgan \
  --external:zod \
  --external:bcryptjs \
  --external:jsonwebtoken \
  --external:express-rate-limit \
  --external:crypto-js \
  --alias:@config=src/config \
  --alias:@adapters=src/adapters \
  --alias:@services=src/services \
  --alias:@routes=src/routes \
  --alias:@middleware=src/middleware \
  --alias:@utils=src/utils \
  --alias:@types=src/types \
  --alias:@type=src/types/index.ts

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install dumb-init and openssl for Prisma
RUN apk add --no-cache dumb-init openssl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy compiled JavaScript and dependencies
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma

# Switch to non-root user
USER nodejs

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]