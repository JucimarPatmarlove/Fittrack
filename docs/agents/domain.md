# Domain Docs

**Layout: single-context**

- `GLOSSARY.md` — shared glossary at repo root
- `docs/adr/` — Architecture Decision Records at repo root

## Consumer Rules

Agents and scripts reading domain docs MUST:
1. Read `GLOSSARY.md` first for terminology
2. Check `docs/adr/` for relevant ADRs before proposing changes
3. Never assume terms — always verify against the glossary