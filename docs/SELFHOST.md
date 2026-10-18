# 🐳 FitTrack V7 — Self-Hosted Deployment Guide

> **Corre o FitTrack V7 na tua própria máquina, sem enviar um único byte para a internet.**

## Requisitos

| Componente | Mínimo |
|---|---|
| **Docker** | v24+ com Docker Compose V2 |
| **RAM** | 2 GB disponíveis |
| **Disco** | 1 GB para imagens + dados |
| **Portas** | 8090 (PWA), 3001 (API), 5432 (PostgreSQL) |

## Quick Start

```bash
# 1. Clonar o repositório
git clone https://github.com/JucimarPatmarlove/Fittrack.git
cd Fittrack

# 2. Correr o script de setup (gera segredos, configura .env, constrói tudo)
chmod +x scripts/selfhost-setup.sh
./scripts/selfhost-setup.sh

# 3. Abrir no browser
open http://localhost:8090
```

Isso é tudo. O script trata do resto automaticamente.

---

## Arquitectura

```
┌──────────────────────────────────────────────────────────┐
│                   Docker Network (fittrack-net)            │
│                                                            │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐  │
│  │   Nginx      │     │   Node.js   │     │ PostgreSQL  │  │
│  │  (Frontend)  │────▶│   (BFF)     │     │   (DB)      │  │
│  │  :8090       │     │  :3001      │     │  :5432      │  │
│  │              │     │             │     │             │  │
│  │  PWA Estática│     │  AI Coach   │     │  Social     │  │
│  │  React 19    │     │  JWT Auth   │     │  Clubs      │  │
│  │  Vite Build  │     │  Anthropic  │     │  Compete    │  │
│  └─────────────┘     └─────────────┘     └─────────────┘  │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

**Nota:** Os dados de treino (sets, PRs, nutrição) ficam no **IndexedDB encriptado** do browser — nunca tocam no PostgreSQL. A base de dados armazena apenas funcionalidades sociais (perfis, leaderboards, desafios).

---

## Configuração Manual

Se preferires configurar manualmente sem o script:

### 1. Criar o ficheiro `.env`

```bash
cp .env.example .env
```

### 2. Preencher os valores obrigatórios

```env
# Segredo para JWT (gera um com: openssl rand -hex 32)
API_SHARED_SECRET=a-tua-string-aleatoria-de-64-caracteres

# Password do PostgreSQL
POSTGRES_PASSWORD=uma-password-forte

# [Opcional] Chave API do Anthropic (para AI Coach)
ANTHROPIC_API_KEY=sk-ant-api03-...
```

### 3. Construir e levantar

```bash
docker compose build
docker compose up -d
```

### 4. Verificar o estado

```bash
# Ver estado dos containers
docker compose ps

# Health check do BFF
curl http://localhost:3001/api/health

# Logs em tempo real
docker compose logs -f
```

---

## Portas Customizáveis

Todas as portas podem ser alteradas no `.env`:

```env
FRONTEND_PORT=8090    # PWA (default: 8090)
BFF_PORT=4001         # API Proxy (default: 3001)
DB_PORT=5433          # PostgreSQL (default: 5432)
```

---

## Funcionalidades por Modo

| Funcionalidade | Cloud (Vercel) | Self-Hosted |
|---|---|---|
| Tracking de treinos | ✅ IndexedDB | ✅ IndexedDB |
| Nutrição & Hidratação | ✅ IndexedDB | ✅ IndexedDB |
| Heatmap de Consistência | ✅ | ✅ |
| Injury Prediction (ACWR) | ✅ | ✅ |
| AI Coach (Claude) | ✅ Cloudflare Worker | ✅ BFF local (precisa de API key) |
| Arena Competitiva | ✅ Supabase Cloud | ⚠️ PostgreSQL local (sem Auth) |
| Clubs & Social | ✅ Supabase Realtime | ⚠️ PostgreSQL local (sem Realtime) |
| Telemetria (PostHog) | ✅ | ❌ Desativado |
| Error Tracking (Sentry) | ✅ | ❌ Desativado |
| PWA Offline | ✅ | ✅ Service Worker |

---

## Backup e Restore

### Backup do PostgreSQL

```bash
docker compose exec supabase-db pg_dump -U fittrack fittrack_v7 > backup_$(date +%Y%m%d).sql
```

### Restore

```bash
cat backup_20260822.sql | docker compose exec -T supabase-db psql -U fittrack fittrack_v7
```

### Backup dos dados do browser (IndexedDB)

Os dados de treino estão no browser. Usa a funcionalidade de **Backup** integrada na app (Settings → Backup) para exportar/importar.

---

## Atualização

```bash
# 1. Parar os containers
docker compose down

# 2. Puxar as últimas alterações
git pull origin main

# 3. Reconstruir e levantar
docker compose build --no-cache
docker compose up -d
```

---

## Troubleshooting

### Container não arranca

```bash
# Ver logs de um serviço específico
docker compose logs frontend
docker compose logs bff
docker compose logs supabase-db
```

### Porta já em uso

```
Error: bind: address already in use
```

Altera a porta no `.env`:
```env
FRONTEND_PORT=9090
```

### Build falha (out of memory)

Aumenta a memória alocada ao Docker:
- **Docker Desktop**: Settings → Resources → Memory → 4 GB
- **Linux**: Verifica `docker info | grep Memory`

### PostgreSQL não inicializa

```bash
# Apagar dados e recomeçar
docker compose down -v
docker compose up -d
```

### AI Coach não responde

Verifica que a `ANTHROPIC_API_KEY` está configurada no `.env`:
```bash
docker compose exec bff env | grep ANTHROPIC
```

---

## Segurança

- 🔒 A **API Key do Anthropic** nunca sai do container BFF
- 🔐 Os dados de treino ficam encriptados com **AES-GCM** no browser
- 🛡️ O Nginx aplica **CSP, HSTS, X-Frame-Options** em todas as respostas
- 🔑 As comunicações BFF usam **JWT efémeros (60s)**
- 🐘 O PostgreSQL aceita conexões apenas da rede Docker interna
