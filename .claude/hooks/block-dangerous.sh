#!/bin/bash
# Lê o input JSON do stdin
INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name')

if [[ "$TOOL_NAME" == "Bash" ]]; then
    COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command')
    # Lista de padrões perigosos
    if [[ "$COMMAND" == *"rm -rf /"* ]] || \
       [[ "$COMMAND" == *"git push --force"* ]] || \
       [[ "$COMMAND" == *"git reset --hard"* ]] || \
       [[ "$COMMAND" == *"sudo "* ]]; then
        echo "🚫 Comando bloqueado por política de segurança: $COMMAND" >&2
        exit 2  # Exit 2 bloqueia a execução
    fi
fi

exit 0  # Exit 0 permite a execução
