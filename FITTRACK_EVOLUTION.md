# FitTrack V7 — Documento Vivo de Evolução

> **Versão:** `v1.2.0`  
> **Última Actualização:** 2026-06-04 (Vercel Serverless + Auditoria)  
> **Mantido por:** Equipa FitTrack + IAs colaboradoras  

---

## Índice

1. [Visão Geral do Projecto](#1-visão-geral-do-projecto)
2. [Arquitectura Actual](#2-arquitectura-actual)
3. [Estado de Implementação](#3-estado-de-implementação)
4. [Decisões Técnicas Importantes](#4-decisões-técnicas-importantes)
5. [Base de Dados e Modelos de Dados](#5-base-de-dados-e-modelos-de-dados)
6. [Integrações Externas](#6-integrações-externas)
7. [Segurança e Privacidade](#7-segurança-e-privacidade)
8. [Roadmap](#8-roadmap-próximos-3-meses)
9. [Lições Aprendidas / Troubleshooting](#9-lições-aprendidas--troubleshooting)
10. [Como Outras IAs Podem Ajudar](#10-como-outras-ias-podem-ajudar)
11. [Zustand Stores](#11-zustand-stores-estado-global)
12. [Testes](#12-testes)
13. [Changelog](#13-changelog)

---

## 1. Visão Geral do Projecto

**FitTrack V7** é uma PWA (Progressive Web App) de fitness **offline-first** com treino inteligente, gamificação, segurança Zero Trust e integração de hardware.

| Atributo | Detalhe |
|---|---|
| **Propósito** | Personal Trainer IA no bolso — prescrição de carga autoregulada, análise de tendências, e progressão baseada em evidência científica |
| **Público-alvo** | Atletas intermédios a avançados que treinam musculação, powerbuilding, HIIT ou funcional |
| **Diferenciais** | Criptografia local AES-GCM dos dados, motor de prescrição RPE-based, proxy BFF Zero Trust, gamificação Ghost Mode + Rival AI, integração Bluetooth HRM/FTMS, Audio Coach, contagem automática de reps via DeviceMotion/MediaPipe |

### Métricas do Codebase
- **115 ficheiros fonte** (`.ts` / `.tsx`)
- **~13.000 linhas de código**
- **77 exercícios** na base de dados (`exerciseDB.ts`) com metadados de músculo e equipamento
- **83 exercícios classificados** biomecanicamente (`exerciseClassifier.ts`)

---

## 2. Arquitectura Actual

### 2.1 Stack Tecnológica

| Camada | Tecnologias |
|---|---|
| **Frontend** | React 19, TypeScript, Vite 8 |
| **Estado** | Zustand 5 (11 stores), `useLS` hook (localStorage tipado com Zod) |
| **Base de Dados** | IndexedDB via `idb` 8 (3 object stores relacionais) |
| **Estilos** | CSS-in-JS inline, Framer Motion 12, glassmorphism cyberpunk |
| **3D** | Three.js + React Three Fiber (MuscleViewer, MuscleSphere) |
| **IA** | Anthropic Claude 3.5 via proxy BFF (SDK `@anthropic-ai/sdk` no servidor) |
| **PWA** | `vite-plugin-pwa` + Workbox (service worker, manifest, offline) |
| **Segurança** | AES-GCM (WebCrypto API), PBKDF2, DOMPurify, CSP |
| **Gráficos** | Recharts 3 |
| **Validação** | Zod 4, React Hook Form |

### 2.2 Padrões Arquitectónicos

```
┌─────────────────────────────────────────────────┐
│                 BROWSER (PWA)                    │
│  React → Zustand → localStorage + IndexedDB     │
│  AES-GCM cifra dados sensíveis localmente        │
│  Service Worker → Cache offline                  │
└──────────────────┬──────────────────────────────┘
                   │ fetch /api/*
                   ▼
┌──────────────────────────────────────────────────┐
│          server.js (Node.js BFF, porta 3001)     │
│  @anthropic-ai/sdk → API Key isolada             │
│  Rate Limiting (15 req/min) + CORS + Sanitização │
└──────────────────┬───────────────────────────────┘
                   │ x-api-key: sk-ant-...
                   ▼
┌──────────────────────────────────────────────────┐
│          Anthropic API (api.anthropic.com)        │
│          Claude 3.5 Sonnet / Haiku               │
└──────────────────────────────────────────────────┘
```

### 2.3 Estrutura de Pastas

```
./
├── server.js              # Proxy BFF local (Node.js nativo + Anthropic SDK)
├── vercel.json            # Config Vercel (rewrites, functions)
├── api/                   # Vercel serverless functions
│   ├── claude.js          # Proxy genérico /api/claude
│   └── generate-workout.js # Endpoint especializado /api/generate-workout
├── .env.example           # Template de variáveis de ambiente
└── src/
    ├── ai/                    # Cache layer para respostas IA
    ├── components/
    │   ├── 3d/                # MuscleViewer, SmartCamera, MuscleSphere
    │   ├── challenges/        # ActiveChallenges, DeadHangWidget
    │   ├── dashboard/         # ActivityHeatmap, MuscleRecoveryRing, WeekCalendar
    │   ├── exercises/         # VideoTutorial, ExerciseTutorialExt
    │   ├── history/           # Histórico de treinos
    │   ├── onboarding/        # BeginnerGuide, FitnessAssessment
    │   ├── PlateCalculator/   # Calculadora de anilhas
    │   ├── planner/           # Planeamento semanal
    │   ├── rival/             # RivalRace, RivalResult (gamificação PvP)
    │   ├── security/          # LockScreen (PIN + PBKDF2)
    │   ├── social/            # ClubModal, ShareWorkoutModal, GymVibeWidget
    │   ├── stats/             # Estatísticas
    │   ├── ui/                # GlassCard, GlobalBackground, GlowInput, GradientButton
    │   └── workout/           # RestTimer, FreeWorkoutBuilder, WeeklyPlanGenerator, etc.
    ├── data/                  # exerciseDB (77 exercícios), exerciseClassifier, constants
    ├── db/                    # IndexedDB schema + encrypted layer
    ├── hooks/                 # useBluetoothHRM, useAudioCoach, useMotionCounter, etc.
    ├── screens/               # Dashboard, ActiveWorkout, AICoach, Trends, Settings, etc.
    ├── services/              # anthropicService, jwtEngine, trendAnalyzer, rivalAI
    ├── stores/                # Zustand (11 stores)
    ├── types/                 # Interfaces globais
    └── utils/                 # cryptoEngine, prescriptionEngine, loadCalculator, sanitize
```

---

## 3. Estado de Implementação

### 3.1 Funcionalidades Concluídas ✅

| Categoria | Feature | Ficheiro(s) Principal(is) |
|---|---|---|
| **Treino** | ActiveWorkout com séries, RPE slider, timer de descanso | `ActiveWorkout.tsx`, `RestTimer.tsx` |
| **Treino** | Free Workout Builder (treino personalizado ad-hoc) | `FreeWorkoutBuilder.tsx` |
| **Treino** | Warmup Sets automáticos | `fitnessMechanics.ts` |
| **Treino** | Plate Calculator (visualização de anilhas) | `PlateCalculator/` |
| **Treino** | Circuit Mode (rondas com descanso entre rondas) | `CircuitProgress.tsx` |
| **IA** | Neural Coach (chat com Claude) | `AICoach.tsx`, `anthropicService.ts` |
| **IA** | Geração de treinos preditivos | `anthropicService.generateWorkout()` |
| **IA** | Plano semanal IA (7 dias, adaptado a filosofia) | `WeeklyPlanGenerator.tsx` |
| **IA** | Motor offline de fallback | `offlineWorkoutEngine.ts` |
| **Prescrição** | Motor RPE-based com DUP e autoregulação | `prescriptionEngine.ts` |
| **Prescrição** | Classificador biomecânico (compound/isolation) | `exerciseClassifier.ts` |
| **Prescrição** | Load Calculator (Epley, Brzycki, Lombardi) | `loadCalculator.ts`, `oneRMCalculator.ts` |
| **Análise** | Trend Analyzer (PROGRESSING/FATIGUED/STABLE) | `trendAnalyzer.ts` |
| **Análise** | Neural Fatigue calculator | `neuralFatigue.ts` |
| **Análise** | Effort Tracker (pontos de esforço semanal) | `EffortTracker.tsx`, `useEffortStore.ts` |
| **DB** | IndexedDB relacional (WorkoutSession, SetLog, PersonalRecord) | `db/schema.ts` |
| **DB** | Criptografia transparente AES-GCM | `db/encryptedDb.ts` |
| **Gamificação** | Ghost Mode (competir contra ti mesmo) | `useGhostStore.ts`, `GhostSetBar.tsx` |
| **Gamificação** | Rival AI (adversário virtual baseado no histórico) | `rivalAI.ts`, `RivalRace.tsx` |
| **Gamificação** | Milestones / PR Tracker | `Milestones.tsx`, `useMilestonesStore.ts` |
| **Gamificação** | Desafios preditivos | `predictiveChallenges.ts`, `ActiveChallenges.tsx` |
| **Gamificação** | Rewards Store (XP) | `RewardsStore.tsx` |
| **Social** | Share Workout Modal (Base64 token P2P) | `ShareWorkoutModal.tsx` |
| **Social** | Gym Vibe / Club | `GymVibe.tsx`, `ClubModal.tsx` |
| **Hardware** | Web Bluetooth HRM (Heart Rate Monitor) | `useBluetoothHRM.ts` |
| **Hardware** | FTMS (Fitness Machine Service) | `useFitnessMachine.ts` |
| **Hardware** | Auto-Rep via DeviceMotion | `useMotionCounter.ts`, `AutoRepToggle.tsx` |
| **Hardware** | Auto-Rep via MediaPipe Pose | `usePoseCounter.ts`, `SmartCamera.tsx` |
| **UX** | Audio Coach (Web Speech API TTS) | `useAudioCoach.ts` |
| **UX** | Progressive Haptics | `useProgressiveHaptics.ts` |
| **UX** | Wake Lock (ecrã sempre ligado) | `hooks/index.ts` |
| **UX** | Tutoriais de exercícios (SVG + GIF offline) | `VideoTutorial.tsx`, `ExerciseTutorialExt.tsx` |
| **Segurança** | LockScreen com PIN (PBKDF2 → AES-GCM) | `LockScreen.tsx`, `cryptoEngine.ts` |
| **Segurança** | Proxy BFF para API Anthropic | `server.js` |
| **Segurança** | DOMPurify sanitização de inputs | `sanitize.ts` |
| **Dashboard** | Activity Heatmap | `ActivityHeatmap.tsx` |
| **Dashboard** | Muscle Recovery Ring | `MuscleRecoveryRing.tsx` |
| **Dashboard** | Recovery Roulette | `RecoveryRoulette.tsx` |
| **Dashboard** | Week Calendar | `WeekCalendar.tsx` |
| **Ecrãs** | Trends (gráficos Recharts) | `Trends.tsx` |
| **Ecrãs** | Settings (perfil, lesões, equipamento, dias) | `Settings.tsx` |
| **Ecrãs** | Cycle Review | `CycleReview.tsx` |
| **Ecrãs** | Device Manager (BLE) | `DeviceManager.tsx` |
| **Onboarding** | Fitness Assessment + Beginner Guide | `FitnessAssessment.tsx`, `BeginnerGuide.tsx` |
| **Infra** | PWA (manifest, service worker, offline) | `vite.config.js` |
| **Infra** | Code Splitting (React.lazy para todos os ecrãs) | `App.tsx` |
| **Infra** | Error Boundary | `ErrorBoundary.tsx` |
| **Infra** | Zod schema validation (profile, history) | `schemas.ts` |

### 3.2 Em Progresso 🔄

| Feature | Estado | Notas |
|---|---|---|
| Testes com dispositivos BLE reais | Parcial | HRM testado, FTMS pendente |
| Integração plena do TrendAnalyzer na UI | 80% | Feedback no `toggle()` do ActiveWorkout, falta dashboard |
| Deploy do proxy BFF em produção | Pronto | `server.js` criado, falta deploy (Vercel/Cloudflare) |

### 3.3 Planeadas 📋

| Feature | Prioridade |
|---|---|
| Apple Health / Google Fit bridge | Média |
| Sync P2P entre dispositivos (WebRTC) | Média |
| Treino com RA (Realidade Aumentada) | Baixa |
| Análises preditivas de lesão | Média |
| Migration para Dexie.js (quando npm disponível) | Baixa (idb funciona) |

---

## 4. Decisões Técnicas Importantes

### 4.1 IndexedDB com `idb` em vez de Dexie.js
**Porquê:** O npm registry ficou indisponível durante a implementação. O `idb` (já era dependência do projecto) oferece uma API tipada equivalente sobre o IndexedDB nativo. A migração para Dexie é trivial se desejada — basta reescrever `schema.ts`.

### 4.2 Criptografia transparente (cryptoEngine + encryptedDb)
**Porquê:** Modelo Zero Trust — o utilizador é dono dos seus dados. Campos sensíveis (`weightKg`, `repsCompleted`, `rpe`, `estimated1RM`) são cifrados num blob único `encryptedFields` com AES-GCM. Campos de índice (IDs, timestamps, nomes) ficam em claro para permitir queries eficientes.

### 4.3 Motor de prescrição baseado em RPE
**Porquê:** O RPE (Rate of Perceived Exertion) é mais adaptativo que %1RM fixa. Permite autoregulação — se o atleta está fatigado, a carga ajusta-se automaticamente. O `prescriptionEngine.ts` combina DUP (Daily Undulating Periodization) com classificação biomecânica do exercício.

### 4.4 Proxy BFF para API Key da Anthropic
**Porquê:** A API Key exposta no browser é uma vulnerabilidade crítica. O `server.js` usa o SDK oficial `@anthropic-ai/sdk` no servidor, com rate limiting (15 req/min), sanitização de payloads, e CORS whitelisting.

### 4.5 Tema Cyberpunk
**Porquê:** Diferenciação visual. Paleta escura (`#080b0f` fundo, `#e8c84a` acento, `#3dd68c` sucesso, `#e84a4a` perigo). Fontes: Bebas Neue (títulos), Outfit (corpo), DM Mono (dados), Inter (labels). Glassmorphism com `backdrop-filter: blur(12px)`.

---

## 5. Base de Dados e Modelos de Dados

### 5.1 IndexedDB Schema (`FitTrack_V7_Database`, versão 1)

```
workouts (WorkoutSession)
├── id: string (PK, UUID)
├── date: number (timestamp)
├── name: string
├── durationSeconds: number
├── readinessScore: number (0-100)
├── totalVolumeKg: number
├── isCompleted: boolean
└── Índices: by-date, by-completed

setLogs (SetLog)
├── id: string (PK, UUID)
├── workoutId: string (FK → workouts)
├── exerciseName: string
├── category: string (compound_multi, isolation_uni, etc.)
├── setNumber: number
├── weightKg: number ←── CIFRADO
├── repsCompleted: number ←── CIFRADO
├── rpe: number ←── CIFRADO
├── estimated1RM: number ←── CIFRADO
├── timestamp: number
├── encryptedFields?: string (blob AES-GCM Base64)
└── Índices: by-workoutId, by-exerciseName, by-timestamp, by-exercise-timestamp (composto)

personalRecords (PersonalRecord)
├── exerciseName: string (PK)
├── best1RM: number
├── bestVolumeWeight: number
├── lastTrainedAt: number
└── Índice: by-lastTrained
```

### 5.2 Fluxo de Dados (durante o treino)

```
Atleta completa série → toggle() no ActiveWorkout
  ├── 1. Calcula 1RM (Epley)
  ├── 2. saveSetLog() → IndexedDB (cifrado se PIN activo)
  ├── 3. updatePersonalRecord() → upsert no IndexedDB
  ├── 4. analyzeExerciseTrend() → lê últimas 50 séries
  │       └── RPE ≤7.5 → PROGRESSING (+2.5kg)
  │       └── RPE ≥9.5 → FATIGUED (-2.5kg)
  │       └── 7.5-9.5 → STABLE (manter)
  └── 5. Mostra feedback no autoregulationMessage (UI)
```

---

## 6. Integrações Externas

| Integração | API/Protocolo | Estado | Ficheiro |
|---|---|---|---|
| **Anthropic Claude 3.5** | REST via SDK (servidor) | ✅ Produção | `server.js`, `anthropicService.ts` |
| **Web Bluetooth HRM** | GATT Heart Rate Service | ✅ Funcional | `useBluetoothHRM.ts` |
| **Web Bluetooth FTMS** | GATT Fitness Machine | ✅ Funcional | `useFitnessMachine.ts` |
| **MediaPipe Vision** | Pose Landmark Detection | ✅ Funcional | `usePoseCounter.ts`, `SmartCamera.tsx` |
| **Web Speech API** | SpeechSynthesis (TTS) | ✅ Funcional | `useAudioCoach.ts` |
| **DeviceMotion** | Acelerómetro (contagem reps) | ✅ Funcional | `useMotionCounter.ts` |
| **Workbox/PWA** | Service Worker + Cache | ✅ Produção | `vite.config.js` |

---

## 7. Segurança e Privacidade

| Controlo | Implementação |
|---|---|
| **API Key Protection** | Proxy BFF (`server.js`) — chave nunca no bundle do cliente |
| **JWT Authentication** | Token HS256 de curta duração (60s) via Web Crypto API nativa. `jwtEngine.ts` (frontend) + `verifyJWT()` (server.js). Zero dependências externas |
| **Data Encryption** | AES-GCM 256-bit (WebCrypto API) para dados sensíveis no IndexedDB |
| **Key Derivation** | PBKDF2 com 100.000 iterações a partir do PIN do utilizador |
| **XSS Prevention** | DOMPurify + `sanitize.ts` em todos os inputs |
| **Input Validation** | Zod schemas (`schemas.ts`) para profile e history |
| **Rate Limiting** | 15 req/min por IP no proxy BFF |
| **CORS** | Whitelist de origens + IPs locais (192.168.x.x) para dev |
| **Payload Sanitization** | Remoção de `api_key`/`apiKey` em payloads do cliente |
| **Anti-Replay** | JWT `exp` a 60s + validação de `iat` (clock skew máx 5s) |
| **Data Ownership** | Modelo Zero Trust — dados cifrados localmente, utilizador é dono |

> **Nota sobre o Shared Secret:** O segredo JWT (`VITE_API_SHARED_SECRET`) está no bundle do cliente. Mitigação: token expira em 60s. Evolução futura: endpoint `/api/request-token` para eliminar o segredo do cliente.

### 7.1 Variáveis de Ambiente

| Variável | Onde é usada | Finalidade |
|---|---|---|
| `ANTHROPIC_API_KEY` | `server.js`, `api/*.js` (Vercel) | Chave da API Claude 3.5 — **SÓ no servidor** |
| `API_SHARED_SECRET` | `server.js`, `api/*.js` (Vercel) | Segredo para verificação JWT (lado servidor) |
| `VITE_API_SHARED_SECRET` | `jwtEngine.ts` (browser) | Segredo para geração JWT (lado cliente, exp 60s) |
| `VITE_API_URL` | `anthropicService.ts` | Override do endpoint API (dev: vazio, prod: URL Vercel) |
| `PORT` | `server.js` | Porta do proxy BFF local (defeito: 3001) |

> ⚠️ `ANTHROPIC_API_KEY` e `API_SHARED_SECRET` **nunca** usam prefixo `VITE_`. Variáveis sem prefixo ficam apenas no Node.js.
---

## 8. Roadmap (próximos 3 meses)

### Curto Prazo (Junho 2026)
- [ ] Deploy do proxy BFF em Vercel/Cloudflare Workers
- [ ] Testes end-to-end com dispositivos BLE reais (Polar H10, Wahoo)
- [ ] Dashboard com análise de tendências por exercício (usar `analyzeMultipleExercises`)
- [ ] Instalar `express`, `cors`, `dotenv` quando npm voltar (opcional)

### Médio Prazo (Julho–Agosto 2026)
- [ ] Sincronização P2P entre dispositivos (WebRTC DataChannel)
- [ ] Bridge Apple Health / Google Fit (via Capacitor ou TWA)
- [ ] Exportação de dados (CSV/JSON) com decifragem
- [ ] Modo offline completo para o AI Coach (modelo compacto local)

### Longo Prazo (Q4 2026)
- [ ] Treino com Realidade Aumentada (WebXR + MediaPipe)
- [ ] Análises preditivas de lesão (regressão sobre RPE + volume)
- [ ] Social feed com treinos partilhados (IPFS ou Supabase)
- [ ] Marketplace de planos de treino (criadores de conteúdo)

---

## 9. Lições Aprendidas / Troubleshooting

### 9.1 Web Bluetooth em iOS
**Problema:** Safari não suporta Web Bluetooth. Apenas Chrome no Android.  
**Workaround:** O `DeviceManager.tsx` detecta suporte e mostra aviso. Para iOS, considerar Capacitor plugin nativo.

### 9.2 MediaPipe Performance
**Problema:** Pose detection no main thread causa jank (30ms+ por frame).  
**Solução:** `useWorkerPoseDetection.ts` move o processamento para Web Worker. Throttling a 10 FPS para mobile.

### 9.3 Imagens Offline
**Problema:** GIFs de exercícios não carregavam offline (CDN inacessível).  
**Solução:** Pipeline de download para `public/assets/exercises/` via `scripts/downloadAllExerciseMedia.js`. Fallback para SVG placeholders gerados por `scripts/generateSvgPlaceholders.js`.

### 9.4 npm Registry Offline
**Problema:** `EAI_AGAIN` ao tentar `npm install` (DNS failure).  
**Solução:** Usar dependências já instaladas. `idb` substituiu Dexie, módulos nativos Node.js substituíram Express/cors/dotenv. Zero impacto funcional.

### 9.5 `useEffect is not defined`
**Causa:** Import de React não inclui hooks.  
**Fix:** Garantir `import React, { useState, useEffect } from 'react'` em todos os componentes.

### 9.6 IndexedDB boolean indexes
**Problema:** IndexedDB não suporta boolean como chave de índice.  
**Solução:** Usar string `'true'`/`'false'` nos índices, ou cast para number.

---

## 10. Como Outras IAs Podem Ajudar

### 10.1 Optimizações de Performance
- **Memoização** em `WorkoutSetRow` (já usa `React.memo`, mas o `upd` callback recria em cada render)
- **Virtualização** da lista de séries no ActiveWorkout (770+ linhas de componente)
- **Code splitting** mais granular (o chunk `index.js` tem 1.6MB)

### 10.2 Melhorias UI/UX
- Micro-animações nos cards de PR (confetti mais subtil)
- Transições de ecrã com `AnimatePresence` (parcialmente implementado)
- Dark/Light mode toggle (actualmente só dark)

### 10.3 Segurança
- Auditoria do fluxo de cifra (verificar que não há key leaks em error logs)
- CSP headers no service worker
- Rotação de chaves (re-encrypt quando o PIN muda)

### 10.4 Ciência Desportiva
- Implementar RIR (Reps in Reserve) como alternativa ao RPE
- Modelo de fadiga acumulada (SFR — Stimulus-Fatigue-Recovery)
- Periodização por blocos (acumulação → transmutação → realização)
- Auto-detection de plateaus (>3 sessões sem progressão)

### 10.5 Ficheiros-Chave para Contexto Rápido
| Para entender... | Lê... |
|---|---|
| Fluxo principal do app | `App.tsx` (227 linhas) |
| Lógica de treino activo | `ActiveWorkout.tsx` (770 linhas) |
| Motor de prescrição | `prescriptionEngine.ts` (154 linhas) |
| Criptografia | `cryptoEngine.ts` + `encryptedDb.ts` |
| Base de dados | `db/schema.ts` |
| Serviço IA | `anthropicService.ts` |
| Proxy BFF | `server.js` (raiz) |

---

## 11. Zustand Stores (Estado Global)

| Store | Responsabilidade |
|---|---|
| `useGhostStore` | Ghost Mode — histórico de performance para competir contra ti mesmo |
| `useProgressionStore` | Tracking de sucesso/falha por exercício para auto-progressão |
| `useEffortStore` | Pontos de esforço semanal (overtraining detection) |
| `useMilestonesStore` | Personal Records (PRs) — cache rápido |
| `useDeviceStore` | Estado de dispositivos Bluetooth conectados |
| `useChallengeStore` | Desafios activos e completados |
| `useSocialStore` | Dados sociais (club, amigos) |
| `useVibeStore` | Gym Vibe — ambiente do ginásio |
| `usePlanStore` | Plano semanal activo |
| `useRoutineStore` | Rotinas salvas pelo utilizador |
| `useDualWorkoutStore` | Treino dual (parceiro) |

---

## 12. Testes

| Tipo | Ferramenta | Estado |
|---|---|---|
| **Unit Tests** | Vitest (planeado) | ❌ Não implementado |
| **E2E** | Playwright (planeado) | ❌ Não implementado |
| **Build Validation** | `vite build` | ✅ Passa sem erros |
| **Server Validation** | `node server.js` | ✅ Arranca correctamente |
| **Validação Manual** | iPhone via rede local (`http://IP:5173`) | ✅ Funcional |
| **Segurança** | `grep -r sk-ant dist/` (zero matches) | ✅ API Key ausente do bundle |

### Testar no Telemóvel (rede local)
```bash
# Terminal 1 — Backend:
npm run server

# Terminal 2 — Frontend:
npm run dev          # já corre com --host

# No telemóvel, abrir:
# http://<IP-DO-PC>:5173
# (descobrir IP com: ip a | grep 192)
```

---

## 13. Changelog

| Versão | Data | Alterações |
|---|---|---|
| `v1.2.0` | 2026-06-04 | Vercel serverless (`api/claude.js`, `api/generate-workout.js`), `vercel.json`, secções Índice, Variáveis de Ambiente, Testes e Changelog |
| `v1.1.0` | 2026-06-04 | JWT HS256 (60s) via Web Crypto API nativa, `jwtEngine.ts`, gateway JWT no `server.js` |
| `v1.0.0` | 2026-06-04 | Documento inicial — IndexedDB relacional, proxy BFF, motor analítico RPE, criptografia AES-GCM |

---

*Este documento deve ser actualizado a cada feature significativa. Versão semântica: major.minor.patch.*
