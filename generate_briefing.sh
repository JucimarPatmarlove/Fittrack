#!/bin/bash
# generate_briefing.sh
# Gera fittrack_briefing.md com estado real do projecto.
# Uso: bash generate_briefing.sh (a partir da raiz do repositório)
#
# Correcções desta versão:
#   - Usa git rev-parse --show-toplevel para obter o caminho absoluto da raiz
#   - Inclui exerciseDB.ts, package.json, vite.config.js e types/exercise.ts
#   - Lê o walkthrough.md de docs/walkthrough.md (caminho relativo ao repo)
#   - Usa caminhos absolutos em todas as operações de ficheiro
#   - Não falha se ficheiros opcionais não existirem

set -e

PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
OUT="$PROJECT_ROOT/fittrack_briefing.md"

echo "📋 Gerando briefing em: $OUT"
rm -f "$OUT"

# ── Cabeçalho ──────────────────────────────────────────────────────────────
cat >> "$OUT" << 'HEADER'
# FitTrack V7 Briefing Completo

> Gerado automaticamente por generate_briefing.sh — não editar manualmente.

HEADER

echo "Gerado em: $(date '+%Y-%m-%d %H:%M:%S')" >> "$OUT"
echo "" >> "$OUT"

# ── 1. Estrutura de Pastas ─────────────────────────────────────────────────
echo "## 1. Estrutura de Pastas" >> "$OUT"
echo '```text' >> "$OUT"
if command -v tree &> /dev/null; then
    tree "$PROJECT_ROOT/src/" -L 3 --noreport >> "$OUT"
else
    find "$PROJECT_ROOT/src/" -maxdepth 3 | sort >> "$OUT"
fi
echo '```' >> "$OUT"
echo "" >> "$OUT"

# ── 2. Código dos Ficheiros Críticos ──────────────────────────────────────
echo "## 2. Código dos Ficheiros Críticos" >> "$OUT"

files=(
  "src/services/macrocycleEngine.ts"
  "src/utils/prescriptionEngine.ts"
  "src/utils/cryptoEngine.ts"
  "src/services/trendAnalyzer.ts"
  "src/utils/oneRMCalculator.ts"
  "src/services/jwtEngine.ts"
  "src/services/demographicEngine.ts"
  "api/claude.js"
  "src/db/schema.ts"
  "src/types.ts"
  "src/types/exercise.ts"
  "src/data/exerciseDB.ts"
  "src/data/exerciseClassifier.ts"
  "package.json"
  "vite.config.js"
)

for file in "${files[@]}"; do
  full_path="$PROJECT_ROOT/$file"
  ext="${file##*.}"

  echo "### $file" >> "$OUT"

  if [ -f "$full_path" ]; then
    case "$ext" in
      ts|tsx|js|jsx) echo '```typescript' >> "$OUT" ;;
      json)          echo '```json' >> "$OUT" ;;
      sh)            echo '```bash' >> "$OUT" ;;
      *)             echo '```text' >> "$OUT" ;;
    esac
    cat "$full_path" >> "$OUT"
    echo '```' >> "$OUT"
  else
    echo "_Ficheiro não encontrado: \`$file\`_" >> "$OUT"
  fi
  echo "" >> "$OUT"
done

# ── 3. Testes Unitários ────────────────────────────────────────────────────
echo "## 3. Output de npx vitest run" >> "$OUT"
echo '```text' >> "$OUT"
cd "$PROJECT_ROOT" && npx vitest run --reporter=verbose 2>&1 >> "$OUT" || true
echo '```' >> "$OUT"
echo "" >> "$OUT"

# ── 4. Build de Produção ───────────────────────────────────────────────────
echo "## 4. Output de npm run build (últimas 40 linhas)" >> "$OUT"
echo '```text' >> "$OUT"
cd "$PROJECT_ROOT" && npm run build 2>&1 | tail -n 40 >> "$OUT" || true
echo '```' >> "$OUT"
echo "" >> "$OUT"

# ── 5. Verificação de Segurança ────────────────────────────────────────────
echo "## 5. Verificação de Segurança (Bundle)" >> "$OUT"
echo '```text' >> "$OUT"
if [ -d "$PROJECT_ROOT/dist" ]; then
  if grep -qr 'VITE_API_SHARED_SECRET' "$PROJECT_ROOT/dist/" 2>/dev/null; then
    echo "❌ VITE_API_SHARED_SECRET EXPOSTO NO BUNDLE!" >> "$OUT"
  else
    echo "✅ VITE_API_SHARED_SECRET — não exposto" >> "$OUT"
  fi
  if grep -qr 'sk-ant' "$PROJECT_ROOT/dist/" 2>/dev/null; then
    echo "❌ CHAVE ANTHROPIC EXPOSTA NO BUNDLE!" >> "$OUT"
  else
    echo "✅ Chave Anthropic (sk-ant) — não exposta" >> "$OUT"
  fi
else
  echo "⚠️  dist/ não encontrado — executar npm run build primeiro" >> "$OUT"
fi
echo '```' >> "$OUT"
echo "" >> "$OUT"

# ── 6. Validação exerciseDB vs exerciseClassifier ─────────────────────────
echo "## 6. Validação exerciseDB vs exerciseClassifier" >> "$OUT"
echo '```text' >> "$OUT"
cd "$PROJECT_ROOT" && node scripts/validate-exercise-db.js 2>&1 >> "$OUT" || true
echo '```' >> "$OUT"
echo "" >> "$OUT"

# ── 7. FITTRACK_EVOLUTION.md ──────────────────────────────────────────────
echo "## 7. FITTRACK_EVOLUTION.md" >> "$OUT"
evo_path="$PROJECT_ROOT/FITTRACK_EVOLUTION.md"
if [ -f "$evo_path" ]; then
  echo '```markdown' >> "$OUT"
  cat "$evo_path" >> "$OUT"
  echo '```' >> "$OUT"
else
  echo "_FITTRACK_EVOLUTION.md não encontrado._" >> "$OUT"
fi
echo "" >> "$OUT"

# ── 8. Walkthrough (opcional) ─────────────────────────────────────────────
walkthrough_path="$PROJECT_ROOT/docs/walkthrough.md"
if [ -f "$walkthrough_path" ]; then
  echo "## 8. docs/walkthrough.md" >> "$OUT"
  echo '```markdown' >> "$OUT"
  cat "$walkthrough_path" >> "$OUT"
  echo '```' >> "$OUT"
  echo "" >> "$OUT"
fi

echo ""
echo "✅ Briefing gerado com sucesso!"
echo "   Ficheiro: $OUT"
echo "   Tamanho:  $(du -sh "$OUT" | cut -f1)"
