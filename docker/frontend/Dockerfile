# ════════════════════════════════════════════════════════════════
# FitTrack V7 — Frontend Dockerfile (Multi-Stage Build)
# ════════════════════════════════════════════════════════════════
# Stage 1: Compilação com Vite (Node.js)
# Stage 2: Serving com Nginx (Alpine)
# ════════════════════════════════════════════════════════════════

# ── STAGE 1: BUILD ─────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Instalar dependências primeiro (layer cache optimization)
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copiar código-fonte
COPY src/ ./src/
COPY public/ ./public/
COPY index.html tsconfig.json vite.config.js ./

# Variáveis VITE_* injetadas no bundle durante o build
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_POSTHOG_KEY
ARG VITE_POSTHOG_HOST
ARG VITE_SENTRY_DSN

ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
ENV VITE_POSTHOG_KEY=${VITE_POSTHOG_KEY}
ENV VITE_POSTHOG_HOST=${VITE_POSTHOG_HOST}
ENV VITE_SENTRY_DSN=${VITE_SENTRY_DSN}

# Build de produção
RUN npm run build

# ── STAGE 2: SERVE ─────────────────────────────────────────────
FROM nginx:1.27-alpine

# Remover config default do Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copiar o build estático
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar a nossa config customizada
COPY docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Healthcheck
RUN apk add --no-cache wget

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
