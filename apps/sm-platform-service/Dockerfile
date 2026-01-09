# Stage 1: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy shared package first
COPY packages/shared ./packages/shared

# Copy this service's package.json
COPY apps/sm-platform-service/package.json ./package.json

# Remove @sms/shared from dependencies (it's not on npm, we'll copy it manually)
RUN sed -i '/"@sms\/shared"/d' package.json

# Install dependencies
RUN npm install

# Copy shared package into node_modules
RUN mkdir -p node_modules/@sms && cp -r packages/shared node_modules/@sms/shared

# Copy service source code
COPY apps/sm-platform-service/ ./

# Stage 2: Production
FROM node:20-alpine AS runner
WORKDIR /app

# Copy from builder
COPY --from=builder /app ./

# Expose port
EXPOSE 5002

# Start the server
CMD ["node", "index.js"]
