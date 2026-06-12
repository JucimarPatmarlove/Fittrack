import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    if (!apiKey) {
      console.warn("WARN: GEMINI_API_KEY environment variable is not set. AI features might be fallback-only.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", aiEnabled: !!apiKey });
});

// AI personal trainer advice endpoint
app.post("/api/ai/workout", async (req, res) => {
  const { goal, fitnessLevel, preferences, currentPlan, userMessage } = req.body;
  
  if (!apiKey) {
    return res.json({
      text: "### Nota: Modo de Demonstração Ativo\n\nConfigure a sua chave **GEMINI_API_KEY** no painel de Segredos (Secrets) do Google AI Studio para ativar as respostas de IA reais.\n\n**Sugestão de Treino Demonstrativa:**\n- **Aquecimento (5-10 min):** Mobilidade articular e caminhada leve.\n- **Exercício Principal:** Agachamento livre (3 séries de 10-12 repetições) e Flexão de braço estruturada (3 séries de 8-10 repetições).\n- **Resfriamento:** Alongamento de pernas e tronco."
    });
  }

  try {
    const ai = getAiClient();
    const prompt = `Você é um Personal Trainer IA de elite chamado FitTrainer.
O usuário quer analisar ou montar um programa de treinamento.
Aqui estão os dados do usuário:
- Objetivo de Fitness: ${goal || "Condicionamento Geral / Saudável"}
- Nível de Experiência: ${fitnessLevel || "Iniciante"}
- Preferências / Restrições: ${preferences || "Nenhuma"}
- Treino atual ou dúvida: ${currentPlan || "Não especificado"}

Mensagem específica inserida pelo usuário para você responder: "${userMessage || "Sugira um treino ideal para mim."}"

Forneça uma resposta detalhada, inspiradora e profissional estruturada com formatação Markdown impecável sobre o treinamento.
Dê recomendações práticas sobre frequência, controle de volume, hidratação e como monitorar o progresso usando aplicativos como o FitTrack. Escreva em português brasileiro fluido.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini API Error in workout endpoint:", error);
    res.status(500).json({ error: "Erro ao processar requisição com a IA", details: error.message });
  }
});

// AI nutrition planning / chef endpoint
app.post("/api/ai/nutrition", async (req, res) => {
  const { goal, restrictions, currentMeals, targetCalories, targetMacros, userMessage } = req.body;

  if (!apiKey) {
    return res.json({
      text: "### Nota: Modo de Demonstração Ativo\n\nConfigure a sua chave **GEMINI_API_KEY** nos segredos do Google AI Studio para ativar o Chef Nutritivo real.\n\n**Sugestão de Plano Demonstrativo (1800kcal):**\n- **Café da Manhã (350kcal):** Tapioca com ovos mexidos e café sem açúcar.\n- **Almoço (600kcal):** Peito de frango grelhado, arroz integral, feijão e salada colorida.\n- **Lanche da Tarde (250kcal):** Iogurte natural, sementes de aveia e morangos.\n- **Jantar (500kcal):** Filé de peixe assado com batata-doce e brócolis cozido ao vapor."
    });
  }

  try {
    const ai = getAiClient();
    
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

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini API Error in nutrition endpoint:", error);
    res.status(500).json({ error: "Erro ao processar plano nutricional com a IA", details: error.message });
  }
});

// Configure Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode with Vite HMR integration...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode serving static dist...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

startServer();
