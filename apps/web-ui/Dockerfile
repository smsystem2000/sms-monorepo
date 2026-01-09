# Stage 1: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package file only (no lock file required)
COPY package.json ./

# Install all dependencies
RUN npm install

# Copy source code
COPY . .

# Build the Vite application
RUN npm run build

# Stage 2: Production server
FROM nginx:alpine AS runner

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config (optional - for SPA routing)
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
