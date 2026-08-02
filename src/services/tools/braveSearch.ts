/// <reference types="node" />
// ════════════════════════════════════════════════════════════════
// FitTrack V7 — Arsenal MCP: Brave Search (Radar Web)
// ════════════════════════════════════════════════════════════════
//
// Dá ao AI Coach acesso à internet em tempo real.
// Usado para: meteorologia, estudos científicos, notícias de saúde.
//
// API: https://api.search.brave.com/res/v1/web/search
// Pricing: $5/mês crédito grátis ≈ 1000 queries
// ════════════════════════════════════════════════════════════════

const BRAVE_API_URL = 'https://api.search.brave.com/res/v1/web/search';

interface BraveWebResult {
  title: string;
  url: string;
  description: string;
}

interface BraveSearchResponse {
  web?: {
    results?: BraveWebResult[];
  };
  query?: {
    original: string;
  };
}

/**
 * Executa uma pesquisa na Brave Search API e devolve um resumo
 * dos top 3 resultados formatado para o Gemini processar.
 *
 * @param query - A pesquisa a realizar (em qualquer idioma)
 * @returns String formatada com os resultados ou mensagem de erro
 */
export async function executeBraveSearch(query: string): Promise<string> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;

  if (!apiKey) {
    console.warn('[Brave Search] API key ausente. Ferramenta desativada.');
    return 'A pesquisa na internet não está disponível de momento (chave API não configurada). Responde com base no teu conhecimento interno.';
  }

  try {
    const params = new URLSearchParams({
      q: query,
      count: '5',           // Pedir 5 para ter margem de filtragem
      search_lang: 'pt',    // Preferência por resultados em português
      text_decorations: '0', // Sem HTML nos snippets
    });

    const response = await fetch(`${BRAVE_API_URL}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': apiKey,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      console.error(`[Brave Search] HTTP ${response.status}: ${errorBody}`);
      return `Erro na pesquisa web (HTTP ${response.status}). Responde com base no teu conhecimento interno.`;
    }

    const data: BraveSearchResponse = await response.json();
    const results = data.web?.results || [];

    if (results.length === 0) {
      return `Nenhum resultado encontrado para "${query}". Responde com base no teu conhecimento interno.`;
    }

    // Formatar os top 3 resultados de forma concisa para o modelo
    const formattedResults = results
      .slice(0, 3)
      .map((r, i) => `[${i + 1}] ${r.title}\n    ${r.description}\n    Fonte: ${r.url}`)
      .join('\n\n');

    return `Resultados da pesquisa web para "${query}":\n\n${formattedResults}\n\nUsa estes dados para construir a tua resposta ao utilizador.`;
  } catch (error) {
    console.error('[Brave Search] Falha na execução:', error);
    return 'Falha na ligação à internet. Responde com base no teu conhecimento interno.';
  }
}
