#!/bin/bash
# Uso: ./save_memory.sh "Texto que quero guardar"
curl -s -X POST http://localhost:5678/webhook/4d7de017-7800-40d9-bcab-462f76c71e3e \
-H "Content-Type: application/json" \
-d "{\"memoria\": \"$1\"}"
echo "Guardado na memória!"
