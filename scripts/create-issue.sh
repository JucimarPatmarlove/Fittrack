#!/bin/bash
# ============================================================
# FitTrack V7 — Issue Creator Script
# ============================================================
# Uso: ./scripts/create-issue.sh <type> <title> [description]
# Exemplo: ./scripts/create-issue.sh feat "Adicionar Dark Mode"
#
# Tipos: bug | feat | impr | docs | sec | chore
# ============================================================

set -e

TYPE=$1
TITLE=$2
DESCRIPTION=${3:-""}

if [ -z "$TYPE" ] || [ -z "$TITLE" ]; then
  echo "❌ Uso: ./scripts/create-issue.sh <type> <title> [description]"
  echo "   Tipos: bug | feat | impr | docs | sec | chore"
  exit 1
fi

case $TYPE in
  bug) LABEL="type:bug"; PREFIX="[BUG]" ;;
  feat) LABEL="type:feature"; PREFIX="[FEAT]" ;;
  impr) LABEL="type:improvement"; PREFIX="[IMPR]" ;;
  docs) LABEL="type:docs"; PREFIX="[DOCS]" ;;
  sec) LABEL="type:security"; PREFIX="[SEC]" ;;
  chore) LABEL="type:chore"; PREFIX="[CHORE]" ;;
  *) echo "❌ Tipo desconhecido: $TYPE"; exit 1 ;;
esac

if command -v gh &> /dev/null; then
  BODY="## Descrição\n${DESCRIPTION}\n\n## Critérios de Aceitação\n- [ ] Critério 1\n- [ ] Critério 2\n- [ ] Critério 3\n\n## Contexto Técnico\n- Criado automaticamente via script"
  
  gh issue create     --repo JucimarPatmarlove/Fittrack     --title "${PREFIX} ${TITLE}"     --body "$BODY"     --label "$LABEL,status:todo"
  
  echo "✅ Issue criada com sucesso!"
else
  echo "⚠️ GitHub CLI (gh) não instalado."
fi
