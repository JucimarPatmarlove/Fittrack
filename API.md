# FitTrack V7 – API BFF

Este documento descreve os endpoints do Backend For Frontend (BFF) que servem a aplicação FitTrack V7. O BFF corre na porta `3000` (ou `3001` se a porta estiver ocupada) e é acessível via `/api/*`.

---

## Autenticação

Os endpoints protegidos requerem um **token JWT** no header `Authorization: Bearer <token>`.

### Obter token

**POST** `/api/request-token`

**Body:**
```json
{
  "nonce": "string (mín. 16 caracteres)",
  "timestamp": 1234567890
}
```

Resposta:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
O token é válido por 5 minutos.

## Endpoints de IA

### 1. Gerar plano de treino

**POST** `/api/generate-workout`

Headers: `Authorization: Bearer <token>`

Body:
```json
{
  "profile": { "goal": "hipertrofia", "level": "intermediate" },
  "readiness": 85,
  "history": [],
  "targetDurationMinutes": 60,
  "workoutType": "hypertrophy"
}
```

Resposta:
```json
{
  "id": "ai_gen_predictive",
  "label": "Motor Preditivo V7",
  "reasoning": "...",
  "exercises": [
    { "name": "Supino", "sets": 4, "reps": 10, "rest": 90 }
  ]
}
```

### 2. Chat com AI Coach

**POST** `/api/claude`

Headers: `Authorization: Bearer <token>`

Body:
```json
{
  "system": "Instruções do sistema",
  "messages": [{ "role": "user", "content": "Como melhorar o agachamento?" }],
  "temperature": 0.3
}
```

Resposta:
```json
{
  "content": [{ "text": "Resposta do AI Coach..." }]
}
```

## Endpoint de Saúde

**GET** `/api/health`

Resposta:
```json
{
  "status": "ok",
  "uptime": 12345,
  "hasApiKey": true,
  "timestamp": 1234567890
}
```

## Códigos de Erro

| Código | Significado |
|---|---|
| 401 | Token JWT ausente |
| 403 | Token JWT inválido ou expirado |
| 400 | Pedido malformado (ex: timestamp dessincronizado) |
| 500 | Erro interno (ex: chave API não configurada) |
| 405 | Método não permitido |

## Variáveis de Ambiente

| Variável | Onde é usada | Finalidade |
|---|---|---|
| GEMINI_API_KEY | server.ts | Chave da API Gemini (Google) |
| API_SHARED_SECRET | server.ts | Segredo para assinar JWT |
| PORT | server.ts | Porta do servidor (defeito: 3000) |
