#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════
# FitTrack V7 — Self-Hosted Setup Script
# ════════════════════════════════════════════════════════════════
# Uso: ./scripts/selfhost-setup.sh
# ════════════════════════════════════════════════════════════════

set -euo pipefail

# ── Cores ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}  ${BOLD}🐳 FitTrack V7 — Self-Hosted Setup${NC}                   ${CYAN}║${NC}"
echo -e "${CYAN}╠══════════════════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║${NC}  Este script prepara o ambiente para correr o        ${CYAN}║${NC}"
echo -e "${CYAN}║${NC}  FitTrack V7 100% localmente com Docker Compose.    ${CYAN}║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# ── 1. Verificar Docker ──
if ! command -v docker &> /dev/null; then
  echo -e "${RED}❌ Docker não encontrado.${NC}"
  echo "   Instala em: https://docs.docker.com/get-docker/"
  exit 1
fi

if ! docker compose version &> /dev/null; then
  echo -e "${RED}❌ Docker Compose (V2) não encontrado.${NC}"
  echo "   Atualiza o Docker Desktop ou instala o plugin compose."
  exit 1
fi

echo -e "${GREEN}✅ Docker $(docker --version | grep -oP '\d+\.\d+\.\d+') detetado${NC}"
echo -e "${GREEN}✅ $(docker compose version)${NC}"
echo ""

# ── 2. Mudar para a raiz do projeto ──
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

echo -e "${CYAN}📂 Diretório do projeto: ${PROJECT_ROOT}${NC}"
echo ""

# ── 3. Gerar .env se não existir ──
if [ -f ".env" ]; then
  echo -e "${YELLOW}⚠️  Ficheiro .env já existe. A manter valores actuais.${NC}"
  echo -e "   (Apaga o .env e corre novamente para gerar um novo.)"
  echo ""
else
  echo -e "${CYAN}🔧 A gerar .env com segredos aleatórios...${NC}"

  # Gerar segredos criptográficos
  API_SECRET=$(openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | xxd -p -c 64)
  DB_PASSWORD=$(openssl rand -hex 16 2>/dev/null || head -c 16 /dev/urandom | xxd -p -c 32)

  cat > .env << EOF
# ═══════════════════════════════════════════════════════════════
# FitTrack V7 — Self-Hosted Environment
# ═══════════════════════════════════════════════════════════════
# Gerado automaticamente em $(date '+%Y-%m-%d %H:%M:%S')
# ═══════════════════════════════════════════════════════════════

# ── Servidor BFF (API Proxy) ──
API_SHARED_SECRET=${API_SECRET}
PORT=3001

# ── Base de Dados PostgreSQL ──
POSTGRES_USER=fittrack
POSTGRES_PASSWORD=${DB_PASSWORD}
POSTGRES_DB=fittrack_v7

# ── Portas (altera se houver conflitos) ──
FRONTEND_PORT=8090
BFF_PORT=3001
DB_PORT=5432

# ── API Keys (Opcionais — preenche para ativar funcionalidades) ──
# Anthropic Claude (AI Coach)
ANTHROPIC_API_KEY=

# Pinecone (Memória Vetorial RAG)
PINECONE_API_KEY=

# Brave Search (Pesquisa em tempo real)
BRAVE_SEARCH_API_KEY=

# ── Frontend VITE_* (injetadas no build) ──
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_POSTHOG_KEY=
VITE_POSTHOG_HOST=
VITE_SENTRY_DSN=
EOF

  echo -e "${GREEN}✅ .env criado com segredos aleatórios${NC}"
  echo ""
fi

# ── 4. Perguntar pela API Key do Anthropic (opcional) ──
CURRENT_KEY=$(grep -oP 'ANTHROPIC_API_KEY=\K.*' .env 2>/dev/null || echo "")
if [ -z "$CURRENT_KEY" ]; then
  echo -e "${YELLOW}🤖 Queres configurar a chave API do Anthropic (AI Coach)?${NC}"
  echo -e "   (Podes fazer isto mais tarde editando o .env)"
  echo -n "   Cole a tua sk-ant-... key (ou ENTER para saltar): "
  read -r ANTHROPIC_KEY

  if [ -n "$ANTHROPIC_KEY" ]; then
    sed -i "s|^ANTHROPIC_API_KEY=.*|ANTHROPIC_API_KEY=${ANTHROPIC_KEY}|" .env
    echo -e "${GREEN}✅ API Key configurada${NC}"
  else
    echo -e "${CYAN}⏭️  A saltar (AI Coach ficará desativado)${NC}"
  fi
  echo ""
fi

# ── 5. Construir e levantar ──
echo -e "${BOLD}${CYAN}🚀 A construir os containers...${NC}"
echo ""

docker compose build --progress=plain 2>&1 | tail -5

echo ""
echo -e "${BOLD}${CYAN}🚀 A levantar o stack...${NC}"
echo ""

docker compose up -d

echo ""

# ── 6. Aguardar que os serviços estejam prontos ──
echo -e "${CYAN}⏳ A aguardar que os serviços fiquem prontos...${NC}"

MAX_WAIT=60
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
  DB_READY=$(docker compose exec -T supabase-db pg_isready -U fittrack 2>/dev/null && echo "yes" || echo "no")
  if [ "$DB_READY" = "yes" ]; then
    break
  fi
  sleep 2
  WAITED=$((WAITED + 2))
  echo -ne "\r   ⏳ ${WAITED}s / ${MAX_WAIT}s..."
done
echo ""

# ── 7. Status final ──
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║${NC}  ${BOLD}✅ FitTrack V7 — Self-Hosted ATIVO${NC}                   ${GREEN}║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════════════════╣${NC}"

FRONTEND_PORT=$(grep -oP 'FRONTEND_PORT=\K.*' .env 2>/dev/null || echo "8090")
BFF_PORT_VAL=$(grep -oP 'BFF_PORT=\K.*' .env 2>/dev/null || echo "3001")

echo -e "${GREEN}║${NC}  🌐 PWA:       ${BOLD}http://localhost:${FRONTEND_PORT}${NC}               ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  🔐 BFF API:   ${BOLD}http://localhost:${BFF_PORT_VAL}/api/health${NC}    ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  🐘 Database:  ${BOLD}localhost:5432${NC}                        ${GREEN}║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║${NC}  Comandos úteis:                                     ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}    docker compose logs -f      → Ver logs             ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}    docker compose down          → Parar               ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}    docker compose down -v       → Parar + apagar BD   ${GREEN}║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
