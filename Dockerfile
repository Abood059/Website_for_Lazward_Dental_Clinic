# Multi-stage Dockerfile for Lazward Dental Clinic Website
# Optimized for low-resource VPS (1 CPU, 0.5 RAM, 25 GB storage)

# Stage 1: Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application files
COPY . .

# Stage 2: Production stage
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production --no-audit --no-fund && \
    npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app ./app

# Copy necessary files
COPY --chown=nodejs:nodejs server.js .
COPY --chown=nodejs:nodejs app.js .
COPY --chown=nodejs:nodejs config ./config
COPY --chown=nodejs:nodejs routes ./routes
COPY --chown=nodejs:nodejs controllers ./controllers
COPY --chown=nodejs:nodejs models ./models
COPY --chown=nodejs:nodejs services ./services
COPY --chown=nodejs:nodejs middleware ./middleware
COPY --chown=nodejs:nodejs validations ./validations
COPY --chown=nodejs:nodejs utils ./utils

# Copy static files (HTML, CSS, JS)
COPY --chown=nodejs:nodejs *.html .
COPY --chown=nodejs:nodejs *.css .
COPY --chown=nodejs:nodejs *.js .
COPY --chown=nodejs:nodejs images ./images

# Create uploads directory
RUN mkdir -p uploads && chown -R nodejs:nodejs uploads

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/api/stats', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application with memory optimizations
CMD ["sh", "-c", "NODE_OPTIONS=--max-old-space-size=256 UV_THREADPOOL_SIZE=2 node server.js"]
