# ==========================================
# EduSathi Server - Multi-Stage Production Build
# ==========================================

# 1. Build Stage
FROM node:22-bookworm-slim AS builder
WORKDIR /app

# Install build tools if compilation is needed
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*

# Install all dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and compile TypeScript
COPY . .
RUN npm run build

# 2. Production Runner Stage
FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install production dependencies only
COPY package*.json ./
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && \
    npm ci --omit=dev && \
    apt-get purge -y python3 make g++ && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*

# Copy compiled code from builder stage
COPY --from=builder /app/dist ./dist

# Create data storage folder and set ownership
RUN mkdir -p /app/data && chown -R node:node /app

USER node

EXPOSE 5000

# Health check using native Node.js fetch
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:5000/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "dist/server.js"]
