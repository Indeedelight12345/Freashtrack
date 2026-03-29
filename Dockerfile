# Use Node.js for building and serving
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy source files
COPY . .

# Build the frontend
RUN npm run build

# Final stage
FROM node:20-slim

WORKDIR /app

# Copy built assets and server code
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/tsconfig.json ./

# Install only production dependencies
RUN npm install --omit=dev && npm install -g tsx

# Expose the port (Note: AI Studio uses 3000, but we'll expose 8080 as requested for the Dockerfile context)
EXPOSE 8080

# Start the server
CMD ["tsx", "server.ts"]
