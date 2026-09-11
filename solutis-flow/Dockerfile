# Build stage
FROM node:20-alpine AS builder

WORKDIR /app
ENV CI=true

# Copy package files
COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY tsconfig.json ./
COPY vite.config.ts ./
COPY index.html ./

# Copy source code and assets
COPY src/ ./src/
COPY assets/ ./assets/

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Copy built files to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
