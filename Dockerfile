# Base image with Bun
FROM oven/bun:debian AS base

# Install necessary packages
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    libcairo2-dev \
    libjpeg-dev \
    libpango1.0-dev \
    libgif-dev \
    supervisor \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Dependencies stage
FROM base AS deps
WORKDIR /app

# Copy package files for both main app and whatsapp-service
COPY package.json bun.lock ./
COPY whatsapp-service/package.json whatsapp-service/bun.lock ./whatsapp-service/
COPY prisma ./prisma

# Install dependencies
RUN bun install --frozen-lockfile && \
    cd whatsapp-service && bun install --frozen-lockfile

# Builder stage
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/whatsapp-service/node_modules ./whatsapp-service/node_modules

# Copy application code
COPY . .

# Generate Prisma Client
RUN bun run db:generate

# Build Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user (as root first)
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 -g nodejs nextjs

# Copy built Next.js application
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy whatsapp-service source code
COPY --from=builder --chown=nextjs:nodejs /app/whatsapp-service ./whatsapp-service

# Copy Prisma files
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts

# Copy all node_modules from deps stage
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=deps --chown=nextjs:nodejs /app/whatsapp-service/node_modules ./whatsapp-service/node_modules

# Copy package.json files
COPY --chown=nextjs:nodejs package.json bun.lock ./
COPY --chown=nextjs:nodejs whatsapp-service/package.json ./whatsapp-service/

# Create necessary directories and set permissions
RUN mkdir -p /app/data /app/auth_info /app/logs && \
    chown -R nextjs:nodejs /app/data /app/auth_info /app/logs

# Copy supervisord configuration
COPY supervisord.conf /etc/supervisord.conf

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh && \
    chown nextjs:nodejs /usr/local/bin/docker-entrypoint.sh

# Expose ports
EXPOSE 3000 3001

# Use entrypoint script (runs as root to setup DB, then switches to nextjs user)
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
