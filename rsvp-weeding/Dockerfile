# ── Stage 1: install ALL dependencies (including devDeps for build) ───────────
FROM node:20-alpine AS deps

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci


# ── Stage 2: build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time env — points to the backend service name in docker-compose
ENV NEXT_PUBLIC_API_URL=http://backend:7777/api

RUN npm run build


# ── Stage 3: production runner ────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public        ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next         ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules  ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json  ./package.json

USER nextjs

EXPOSE 3000

CMD ["npm", "start"]
