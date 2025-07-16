# Use Node.js 18 as base image
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

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
COPY --from=builder /app/package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership of the app directory
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port (Railway will set the PORT environment variable)
EXPOSE $PORT

# Start the application
CMD ["sh", "-c", "serve -s dist -l ${PORT:-3000}"]
