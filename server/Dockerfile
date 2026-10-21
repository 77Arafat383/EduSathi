# ==========================================
# EduSathi Server - Multi-Stage Production Build
# ==========================================

# 1. Build Stage
FROM node:22-alpine AS builder
WORKDIR /app

# Install native compilation dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

# Install all dependencies (including devDependencies for TypeScript build)
COPY package*.json ./
RUN npm ci

# Copy source code and compile TypeScript to JavaScript
COPY . .
RUN npm run build

# 2. Production Runner Stage
FROM node:22-alpine AS runner
WORKDIR /app

# Install native dependencies temporarily for production modules, then clean up
RUN apk add --no-cache python3 make g++

ENV NODE_ENV=production
ENV PORT=5000

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev && \
    apk del python3 make g++

# Copy compiled code from builder stage
COPY --from=builder /app/dist ./dist

# Create SQLite data storage folder and assign ownership to non-root node user
RUN mkdir -p /app/data && chown -R node:node /app

USER node

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

CMD ["node", "dist/server.js"]
