/**
 * Exemplo de Cloudflare Worker / Backend Proxy
 * FASE 3: Zero-Trust na Cloud
 * 
 * Este ficheiro NUNCA corre no browser. Fica no servidor (ex: Cloudflare).
 * O Frontend envia o payload para `/api/claude`, e este Worker anexa
 * a API KEY de forma segura, comunicando com a Anthropic.
 */

export default {
    async fetch(request: Request, env: any) {
        // Apenas permite POST
        if (request.method !== 'POST') {
            return new Response('Method Not Allowed', { status: 405 });
        }

        try {
            // Recebe o payload do Frontend (sem a API KEY)
            const body = await request.json();

            // Anexa a API KEY que está guardada em segredo nas variáveis de ambiente do servidor
            const apiKey = env.ANTHROPIC_API_KEY;

            if (!apiKey) {
                return new Response(JSON.stringify({ error: { message: "Server configuration error: Missing API Key" } }), { status: 500 });
            }

            // Faz o pedido verdadeiro à Anthropic
            const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                    "x-api-key": apiKey,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json"
                },
                body: JSON.stringify(body)
            });

            const data = await anthropicResponse.json();

            // Devolve a resposta ao nosso Frontend PWA
            return new Response(JSON.stringify(data), {
                headers: { 'Content-Type': 'application/json' },
                status: anthropicResponse.status
            });

        } catch (error: any) {
            return new Response(JSON.stringify({ error: { message: error.message } }), { status: 500 });
        }
    }
};
