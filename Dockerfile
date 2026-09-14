FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-slim AS builder
WORKDIR /app

# Docker-based production deployments (DigitalOcean App Platform and Cloud Run)
# run Vinext as a normal Node HTTP server. This flag tells vite.config.ts to
# omit the Cloudflare Workers plugin so the build emits Node-compatible output.
ENV DEPLOY_TARGET=node

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/scripts ./scripts

EXPOSE 8080
CMD ["npm", "run", "start:cloudrun"]
