# syntax=docker/dockerfile:1

# Base image with Node.js 20 on Alpine Linux
FROM node:20-alpine AS base

# Install system dependencies and set up working directory
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies stage
FROM base AS deps

# Copy package files for dependency installation
COPY package.json package-lock.json* ./

# Install all dependencies (needed for build)
RUN npm ci

# Build stage
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source code
COPY . .

# Set build-time environment variables (these won't be in the final image unless re-set)
ARG NEXT_PUBLIC_APPWRITE_ENDPOINT
ARG NEXT_PUBLIC_APPWRITE_PROJECT_ID
ARG NEXT_PUBLIC_APPWRITE_DATABASE_ID
ARG NEXT_PUBLIC_APPWRITE_CHATS_COLLECTION_ID
ARG NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID
ARG GEMINI_API_KEY
ARG MONGODB_URI
ARG SENDGRID_API_KEY

# Set environment variables for the build
ENV NEXT_PUBLIC_APPWRITE_ENDPOINT=$NEXT_PUBLIC_APPWRITE_ENDPOINT \
    NEXT_PUBLIC_APPWRITE_PROJECT_ID=$NEXT_PUBLIC_APPWRITE_PROJECT_ID \
    NEXT_PUBLIC_APPWRITE_DATABASE_ID=$NEXT_PUBLIC_APPWRITE_DATABASE_ID \
    NEXT_PUBLIC_APPWRITE_CHATS_COLLECTION_ID=$NEXT_PUBLIC_APPWRITE_CHATS_COLLECTION_ID \
    NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID=$NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID \
    NEXT_TELEMETRY_DISABLED=1

# Build the Next.js application
RUN npm run build

# Production runtime stage
FROM base AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json* ./

# Install production dependencies only
RUN npm ci --only=production && \
    chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose the application port
EXPOSE 3000

# Health check to ensure the container is running properly
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the Next.js production server
CMD ["npm", "run", "start"]