# Use specific Node.js version with Alpine
FROM node:slim@sha256:bbfe63937f1938e0f61f6e1cbc811d772ba6559babb41820b441bd70e57628b2 AS base

# Create app directory
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package*.json ./
RUN npm ci

# Build the app
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Production image, copy all files and run
FROM base AS runner
WORKDIR /app

# Set to production environment
ENV NODE_ENV production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 appuser

# Copy only necessary files
COPY --from=builder --chown=appuser:nodejs /app/package*.json ./
COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /app/app.js ./
COPY --from=builder --chown=appuser:nodejs /app/server.js ./
COPY --from=builder --chown=appuser:nodejs /app/db.js ./
COPY --from=builder --chown=appuser:nodejs /app/socketInstance.js ./
COPY --from=builder --chown=appuser:nodejs /app/config ./config
COPY --from=builder --chown=appuser:nodejs /app/controllers ./controllers
COPY --from=builder --chown=appuser:nodejs /app/helpers ./helpers
COPY --from=builder --chown=appuser:nodejs /app/html ./html
COPY --from=builder --chown=appuser:nodejs /app/middleware ./middleware
COPY --from=builder --chown=appuser:nodejs /app/routes ./routes
COPY --from=builder --chown=appuser:nodejs /app/services ./services
COPY --from=builder --chown=appuser:nodejs /app/utils ./utils

# Switch to non-root user
USER appuser

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["node", "server.js"]