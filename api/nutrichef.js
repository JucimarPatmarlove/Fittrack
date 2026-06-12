import { createHmac, timingSafeEqual } from 'crypto';

/**
 * FitTrack V7 — Vercel Serverless: /api/nutrichef
 * ══════════════════════════════════════════════
 * 
 * Nutrition & Health Holistic Merge AI Endpoint.
 * Protected by Zero Trust JWT.
 */

function verifyJWT(token, secret) {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    const expectedSignature = createHmac('sha256', secret)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');
    const sigBuf = Buffer.from(signatureB64);
    const expBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expBuf.length) return false;
    if (!timingSafeEqual(sigBuf, expBuf)) return false;
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    const now = Math.floor(Date.now() / 1000);
    return !(payload.exp && payload.exp < now);
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  // JWT Gateway
  const secret = process.env.API_SHARED_SECRET;
  if (secret) {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ') || !verifyJWT(auth.slice(7), secret)) {
      return res.status(403).json({ error: 'Token inválido ou expirado.' });
    }
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.json({
      text: "### Nota: Modo de Demonstração Ativo\n\nConfigure a sua chave **GEMINI_API_KEY** nos segredos do Vercel para ativar o Chef Nutritivo real.\n\n**Sugestão de Plano Demonstrativo (1800kcal):**\n- **Café da Manhã (350kcal):** Tapioca com ovos mexidos e café sem açúcar.\n- **Almoço (600kcal):** Peito de frango grelhado, arroz integral, feijão e salada colorida.\n- **Lanche da Tarde (250kcal):** Iogurte natural, sementes de aveia e morangos.\n- **Jantar (500kcal):** Filé de peixe assado com batata-doce e brócolis cozido ao vapor."
    });
  }

  const { goal, restrictions, currentMeals, targetCalories, targetMacros, userMessage } = req.body;

  const macrosText = targetMacros ? 
    `Carboidratos: ${targetMacros.carb}g, Proteínas: ${targetMacros.protein}g, Gorduras: ${targetMacros.fat}g` :
    "Proporções equilibradas padrão";

  const prompt = `Você é um Nutricionista e Chef Saudável IA de elite chamado NutriChef.
O usuário quer melhorar seu plano alimentar ou precisa de receitas criativas.
Aqui estão os dados metabólicos e de dieta dele:
- Objetivo Corporal: ${goal || "Manter peso saudável"}
- Restrições alimentares / Alergias: ${restrictions || "Nenhuma"}
- Meta de Calorias Diárias: ${targetCalories ? targetCalories + " kcal" : "Calcular recomendável"}
- Metas de Macronutrientes estimadas: ${macrosText}
- Plano de refeições atual registrado hoje ou alimentos disponíveis: ${currentMeals || "Não registrado ainda"}

Mensagem ou pergunta do usuário para você responder: "${userMessage || "Crie um plano alimentar diário baseado nos meus dados e restrições."}"

Por favor, forneça uma resposta compreensiva e calorosa em formato Markdown com:
1. Recomendações dietéticas fundamentadas e práticas.
2. Uma ideia de receita rápida, saudável e incrível adequada às restrições.
3. Dicas de suplementação básica e hidratação.
Escreva tudo em português brasileiro amigável e focado em resultados reais.`;

  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;
    
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
        }
      })
    });

    if (!geminiRes.ok) {
        const errorText = await geminiRes.text();
        throw new Error(errorText);
    }

    const data = await geminiRes.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Erro ao gerar resposta.";

    return res.status(200).json({ text: responseText });
  } catch (error) {
    console.error('[Vercel] Gemini API error:', error);
    return res.status(500).json({ error: "Erro ao processar plano nutricional com a IA", details: error.message });
  }
}
