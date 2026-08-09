// ════════════════════════════════════════════════════════════════
// FitTrack V7 — Arsenal MCP: Definições de Ferramentas (Tools)
// ════════════════════════════════════════════════════════════════
//
// Estas declarações são passadas ao Gemini via `tools` para que
// o modelo saiba que ferramentas tem disponíveis e quando usá-las.
//
// O Gemini NÃO executa as funções — devolve um `functionCall` com
// o nome e argumentos. O agentLoop.ts executa e devolve o resultado.
// ════════════════════════════════════════════════════════════════

import { type Tool } from '@google/generative-ai';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SchemaType: Record<string, any> = {
  OBJECT: 'OBJECT',
  STRING: 'STRING',
  NUMBER: 'NUMBER',
};

/**
 * Arsenal completo de ferramentas do AI Coach.
 * Passado diretamente ao `getGenerativeModel({ tools: COACH_TOOLS })`.
 */
export const COACH_TOOLS: Tool[] = [
  {
    functionDeclarations: [
      // ── 🌍 RADAR WEB (Brave Search) ──────────────────────────────
      {
        name: 'pesquisar_internet',
        description:
          'Pesquisa na internet em tempo real. Usa para meteorologia atual, ' +
          'estudos científicos de fitness recentes, notícias de saúde, preços de suplementos, ' +
          'ou qualquer dado que muda frequentemente e não está no teu treino interno. ' +
          'NÃO uses para perguntas que consegues responder com conhecimento geral.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            query: {
              type: SchemaType.STRING,
              description: 'A pesquisa a realizar na internet (em português ou inglês)',
            },
          },
          required: ['query'],
        },
      },

      // ── 🗄️ ANALISTA DE DADOS (Supabase SQL) ─────────────────────
      {
        name: 'consultar_metricas',
        description:
          'Consulta métricas EXATAS de treino na base de dados do utilizador. ' +
          'Usa para calcular volume total de carga, frequência de treinos, ' +
          'recordes pessoais (PRs), histórico de peso corporal, e tendências numéricas. ' +
          'NÃO uses para perguntas qualitativas — apenas para números concretos.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            metric_type: {
              type: SchemaType.STRING,
              enum: [
                'volume_total',
                'frequencia_treinos',
                'pr_exercicio',
                'historico_peso',
                'treinos_por_grupo_muscular',
              ],
              description:
                'O tipo de métrica a calcular. ' +
                'volume_total = soma de (séries × reps × carga) num período. ' +
                'frequencia_treinos = contagem de sessões num período. ' +
                'pr_exercicio = carga máxima histórica num exercício. ' +
                'historico_peso = evolução do peso corporal. ' +
                'treinos_por_grupo_muscular = distribuição de treinos por grupo.',
            },
            exercise_name: {
              type: SchemaType.STRING,
              description:
                'Nome do exercício (ex: "Supino Plano", "Agachamento"). Opcional para métricas globais.',
            },
            period_days: {
              type: SchemaType.NUMBER,
              description:
                'Período em dias para a consulta (ex: 7 = última semana, 30 = último mês). Default: 30.',
            },
          },
          required: ['metric_type'],
        },
      },

      // ── 🐙 ENGENHEIRO DE SEGURANÇA (GitHub) ─────────────────────
      {
        name: 'auditar_repositorio',
        description:
          'Lê dados do repositório GitHub do FitTrack. Usa APENAS quando o utilizador ' +
          'perguntar sobre código, commits, issues, ou segurança do projeto. ' +
          'Esta ferramenta é para DevOps/administração técnica.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            action: {
              type: SchemaType.STRING,
              enum: ['recent_commits', 'file_content', 'open_issues'],
              description:
                'recent_commits = últimos commits na branch. ' +
                'file_content = ler conteúdo de um ficheiro específico. ' +
                'open_issues = listar issues abertas no repositório.',
            },
            file_path: {
              type: SchemaType.STRING,
              description:
                'Caminho do ficheiro a ler (ex: "src/services/vectorMemory.ts"). Só para action=file_content.',
            },
            branch: {
              type: SchemaType.STRING,
              description: 'Nome da branch (default: "main").',
            },
          },
          required: ['action'],
        },
      },
    ],
  },
];
