/**
 * FitTrack V7 - Serverless Cloudflare Worker Proxy
 * 
 * OBJETIVO: Proteger a API Key da Anthropic (Claude 3.5 Sonnet / Haiku).
 * O frontend PWA envia os pedidos para a rota configurada neste worker sem credenciais.
 * O Worker injeta a chave de forma totalmente segura no lado do servidor e devolve o stream/JSON.
 * 
 * INSTRUÇÕES DE DEPLOY:
 * 1. Cria um novo Worker na Cloudflare (ex: fittrack-ai-proxy).
 * 2. Cola este código no ficheiro `worker.js`.
 * 3. Nas definições do Worker na Cloudflare, adiciona a Variável de Ambiente (Encrypted/Secret):
 *    - Nome: ANTHROPIC_API_KEY
 *    - Valor: sk-ant-api03-... (a tua chave real)
 * 4. Configura o teu Frontend (em dev, o Vite proxy faz o roteamento para "/api/claude").
 *    Em produção, aponta o VITE_CLAUDE_PROXY_URL para a URL final do teu worker.
 */

export default {
  async fetch(request, env, ctx) {
    // Configuração de CORS estrita para o teu domínio
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*", // Em produção, muda para "https://teu-dominio-fittrack.com"
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-api-key, anthropic-version",
    };

    // Resposta rápida a pedidos preflight (OPTIONS)
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Apenas aceita POST
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      // Ler payload do cliente PWA
      const body = await request.json();

      // Garantir que a API Key foi configurada no painel da Cloudflare
      if (!env.ANTHROPIC_API_KEY) {
        throw new Error("ANTHROPIC_API_KEY não está configurada no servidor Cloudflare.");
      }

      // Reencaminhar o pedido assinado para a Anthropic
      const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify(body)
      });

      // Ler resposta original
      const data = await anthropicResponse.text();

      // Devolver ao cliente com cabeçalhos CORS limpos
      return new Response(data, {
        status: anthropicResponse.status,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: { message: err.message } }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
};
