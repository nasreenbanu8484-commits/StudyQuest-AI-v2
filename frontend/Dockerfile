# Stage 1: Install dependencies and build Next.js
FROM node:18-alpine AS builder

WORKDIR /app

# Copy lockfiles and metadata
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application sources
COPY . .

# Build argument for the public API gateway URL
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}

# Build production bundle
RUN npm run build

# Stage 2: Serve Next.js in production
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy necessary files from builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

# Run as non-root user
USER node

EXPOSE 3000

CMD ["npm", "run", "start"]
