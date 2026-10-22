# Regras do Projeto Fittrack

## Memória e Contexto
Antes de começares qualquer tarefa, deves ler o ficheiro de memória mais recente do projeto executando o seguinte comando no terminal:
`cat $(ls -t ~/Documentos/Fittrack/.agents/n8n_files/*.md | head -n 1)`

Usa a informação desse ficheiro como base para o contexto do projeto. Não precisas de ler o projeto todo, apenas o que está na memória ou os ficheiros específicos que eu te pedir.

## Agent skills

### Issue tracker

Issues tracked in GitHub Issues (repo: JucimarPatmarlove/Fittrack) via `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical labels: needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout: GLOSSARY.md + docs/adr/ at repo root. See `docs/agents/domain.md`.
