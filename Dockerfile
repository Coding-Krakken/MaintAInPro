# Use Node.js 18 as base image
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Handle environment variables - copy if exists, otherwise use example
RUN if [ -f .env.local ]; then \
      echo "Using existing .env.local"; \
    else \
      echo "Creating .env.local from .env.example"; \
      cp .env.example .env.local || echo "No .env.example found, using empty env"; \
    fi

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install serve globally
RUN npm install -g serve

# Set working directory
WORKDIR /app

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership of the app directory
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port (Railway will set the PORT environment variable)
EXPOSE ${PORT:-3000}

# Health check - Railway handles health checks automatically, so we'll disable Docker's built-in health check
# to avoid conflicts with Railway's own health check system
HEALTHCHECK NONE

# Start the application - bind to all interfaces for Railway
CMD ["sh", "-c", "serve -s dist -l ${PORT:-3000} --no-clipboard -H 0.0.0.0"]
