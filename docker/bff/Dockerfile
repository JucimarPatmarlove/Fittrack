# ════════════════════════════════════════════════════════════════
# FitTrack V7 — BFF Proxy Dockerfile
# ════════════════════════════════════════════════════════════════
# Container leve Node.js 22 Alpine que executa o servidor proxy
# Zero Trust (server.js). A API Key da Anthropic fica APENAS
# neste container, nunca no frontend.
# ════════════════════════════════════════════════════════════════

FROM node:22-alpine

WORKDIR /app

# Copiar apenas o necessário para o BFF
COPY docker/bff/package.json ./
RUN npm install --omit=dev

# Copiar o servidor
COPY server.js ./

# Healthcheck
RUN apk add --no-cache wget

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "server.js"]
