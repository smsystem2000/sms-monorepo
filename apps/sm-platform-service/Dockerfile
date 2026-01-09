# Stage 1: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package file only (no lock file required)
COPY package.json ./

# Install all dependencies
RUN npm install

# Copy source code
COPY . .

# Stage 2: Production
FROM node:20-alpine AS runner
WORKDIR /app

# Copy node_modules and source from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app .

# Expose port
EXPOSE 5000

# Start the server
CMD ["node", "index.js"]
