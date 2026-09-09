# ── Etapa 1: compilación ────────────────────────────────────────────────────
FROM node:20-bookworm AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── Etapa 2: Chromium ya viene en la imagen de Playwright (Cloudflare) ──────
FROM mcr.microsoft.com/playwright:v1.63.0-noble AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
# La imagen oficial ya exporta PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

COPY package*.json ./
RUN npm ci --omit=dev \
  && chown -R pwuser:pwuser /app

COPY --from=builder --chown=pwuser:pwuser /app/dist ./dist

USER pwuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]
