#!/bin/bash

OUT="/home/kali/Documentos/Fittrack/fittrack_briefing.md"
rm -f $OUT

echo "# FitTrack V7 Briefing Completo" >> $OUT
echo "" >> $OUT

echo "## 1. Estrutura de Pastas" >> $OUT
echo '```text' >> $OUT
if command -v tree &> /dev/null; then
    tree src/ -L 3 >> $OUT
else
    find src/ -maxdepth 3 | sort >> $OUT
fi
echo '```' >> $OUT
echo "" >> $OUT

echo "## 2. Código dos Ficheiros" >> $OUT

files=(
  "src/services/macrocycleEngine.ts"
  "src/utils/prescriptionEngine.ts"
  "src/utils/cryptoEngine.ts"
  "src/services/trendAnalyzer.ts"
  "src/utils/oneRMCalculator.ts"
  "src/services/jwtEngine.ts"
  "api/claude.js"
  "src/db/schema.ts"
  "src/types.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
      echo "### $file" >> $OUT
      echo '```typescript' >> $OUT
      cat "$file" >> $OUT
      echo '```' >> $OUT
      echo "" >> $OUT
  else
      echo "### $file" >> $OUT
      echo "*Ficheiro não encontrado!*" >> $OUT
      echo "" >> $OUT
  fi
done

echo "## 3. Output de npx vitest run" >> $OUT
echo '```text' >> $OUT
npx vitest run >> $OUT 2>&1
echo '```' >> $OUT
echo "" >> $OUT

echo "## 4. Output de npm run build (últimas 30 linhas)" >> $OUT
echo '```text' >> $OUT
npm run build 2>&1 | tail -n 30 >> $OUT
echo '```' >> $OUT
echo "" >> $OUT

echo "## 5. FITTRACK_EVOLUTION.md" >> $OUT
echo '```markdown' >> $OUT
cat FITTRACK_EVOLUTION.md >> $OUT
echo '```' >> $OUT
echo "" >> $OUT

echo "## 6. walkthrough.md" >> $OUT
echo '```markdown' >> $OUT
cat /home/kali/.gemini/antigravity/brain/10396d29-5a17-4afe-aba6-e19774449acb/walkthrough.md >> $OUT
echo '```' >> $OUT
echo "" >> $OUT

echo "Briefing gerado com sucesso!"
