#!/bin/bash
# scripts/check-jwt-secret.sh
# Verifica se VITE_API_SHARED_SECRET foi exposto no bundle de produção.
# Deve ser executado após npm run build.
# Uso: bash scripts/check-jwt-secret.sh
# CI: adicionar ao package.json como "check-jwt": "bash scripts/check-jwt-secret.sh"

set -e

DIST_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)/dist"

if [ ! -d "$DIST_DIR" ]; then
  echo "⚠️  Pasta dist/ não encontrada. A executar o build primeiro..."
  npm run build
fi

echo ""
echo "🔍 Verificando exposição de segredos no bundle..."
echo "   Pasta: $DIST_DIR"
echo ""

FOUND=0

# 1. VITE_API_SHARED_SECRET
if grep -qr 'VITE_API_SHARED_SECRET' "$DIST_DIR/" 2>/dev/null; then
  echo "❌ VITE_API_SHARED_SECRET encontrado no bundle!"
  FOUND=1
else
  echo "✅ VITE_API_SHARED_SECRET — não exposto"
fi

# 2. Chave Anthropic
if grep -qr 'sk-ant' "$DIST_DIR/" 2>/dev/null; then
  echo "❌ CHAVE ANTHROPIC (sk-ant) encontrada no bundle!"
  FOUND=1
else
  echo "✅ Chave Anthropic (sk-ant) — não exposta"
fi

# 3. Chaves genéricas de API que não deviam estar no frontend
if grep -qrE '"[A-Za-z0-9_]{32,}"' "$DIST_DIR/" 2>/dev/null | grep -qi 'secret\|private\|api_key'; then
  echo "⚠️  Possível segredo de API detectado (auditoria manual recomendada)"
else
  echo "✅ Padrões de segredo genérico — não detectados"
fi

echo ""
if [ $FOUND -eq 1 ]; then
  echo "🚨 FALHA DE SEGURANÇA: Segredos expostos no bundle!"
  echo "   Verifica o jwtEngine.ts e remove qualquer fallbackLocalToken em produção."
  exit 1
else
  echo "✅ Zero Trust OK: Bundle limpo. Nenhum segredo exposto."
  exit 0
fi
