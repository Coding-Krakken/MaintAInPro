FROM node:20-alpine

# Install necessary packages for native dependencies
RUN apk add --no-cache python3 make g++ git

# Install Playwright system dependencies for Alpine
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    curl \
    udev \
    ttf-liberation \
    libx11 \
    libxcb \
    libxrandr2 \
    libxss1 \
    libgtk-3-0 \
    libgconf-2-4 \
    libasound2 \
    libxtst6 \
    libxrandr2 \
    libpangocairo-1.0-0 \
    libatk1.0-0 \
    libcairo-gobject2 \
    libgtk-3-0 \
    libgdk-pixbuf2.0-0

WORKDIR /app

# Copy package files
COPY package*.json ./

# Clear npm cache and install dependencies (including dev dependencies for build)
RUN npm cache clean --force
RUN npm ci --verbose

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port 8080 (Railway's default internal port)
EXPOSE 8080

# Railway will set the PORT environment variable dynamically
# The application will bind to whatever port Railway specifies

# Start the application
CMD ["npm", "start"]
