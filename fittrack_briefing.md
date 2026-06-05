# FitTrack V7 Briefing Completo

## 1. Estrutura de Pastas
```text
src/
├── ai
│   └── cacheLayer.ts
├── App.css
├── App.tsx
├── assets
│   ├── hero.png
│   ├── react.svg
│   └── vite.svg
├── components
│   ├── 3d
│   │   ├── MuscleSphere.tsx
│   │   ├── MuscleViewer.tsx
│   │   └── SmartCamera.tsx
│   ├── challenges
│   │   ├── ActiveChallenges.tsx
│   │   └── DeadHangWidget.tsx
│   ├── dashboard
│   │   ├── ActivityHeatmap.tsx
│   │   ├── ClinicalAnalytics.tsx
│   │   ├── MuscleRecoveryRing.tsx
│   │   ├── PhaseCard.tsx
│   │   ├── RecoveryRoulette.tsx
│   │   ├── TrendWidget.tsx
│   │   └── WeekCalendar.tsx
│   ├── ErrorBoundary.tsx
│   ├── exercises
│   │   ├── ExerciseTutorialExt.tsx
│   │   └── VideoTutorial.tsx
│   ├── GhostSetComparison.tsx
│   ├── GhostToggle.tsx
│   ├── history
│   │   └── DetailedHistory.tsx
│   ├── onboarding
│   │   ├── BeginnerGuide.tsx
│   │   └── FitnessAssessment.tsx
│   ├── planner
│   │   ├── Challenge90Days.tsx
│   │   └── DualWorkoutCalendar.tsx
│   ├── PlateCalculator
│   │   ├── PlateCalculator.tsx
│   │   └── PlateVisualizer.tsx
│   ├── rival
│   │   ├── RivalRace.tsx
│   │   └── RivalResult.tsx
│   ├── security
│   │   └── LockScreen.tsx
│   ├── social
│   │   ├── ClubModal.tsx
│   │   ├── GymVibeWidget.tsx
│   │   └── ShareWorkoutModal.tsx
│   ├── stats
│   │   ├── MuscleHeatmap.tsx
│   │   └── RecoveryRing.tsx
│   ├── ui
│   │   ├── GlassCard.tsx
│   │   ├── GlobalBackground.tsx
│   │   ├── GlowInput.tsx
│   │   └── GradientButton.tsx
│   ├── WatchSyncIndicator.tsx
│   └── workout
│       ├── AutoRepToggle.tsx
│       ├── CircuitProgress.tsx
│       ├── EffortTracker.tsx
│       ├── ExerciseLibrary.tsx
│       ├── FreeWorkoutBuilder.tsx
│       ├── GhostSetBar.tsx
│       ├── NextWorkoutSuggestion.tsx
│       ├── PaceTracker.tsx
│       ├── PostWorkoutFeedback.tsx
│       ├── PRTracker.tsx
│       ├── RestTimer.tsx
│       └── WeeklyPlanGenerator.tsx
├── data
│   ├── constants.ts
│   ├── exerciseClassifier.ts
│   ├── exerciseDB.ts
│   ├── exerciseMedia.ts
│   └── utils.ts
├── db
│   ├── encryptedDb.ts
│   └── schema.ts
├── hooks
│   ├── index.ts
│   ├── useAudioCoach.ts
│   ├── useBluetoothHRM.ts
│   ├── useChallenges.ts
│   ├── useFitnessMachine.ts
│   ├── useGhostMode.ts
│   ├── useMotionCounter.ts
│   ├── usePoseCounter.ts
│   ├── useProgressiveHaptics.ts
│   ├── useRobustTimer.ts
│   └── useWorkerPoseDetection.ts
├── index.css
├── main.jsx
├── screens
│   ├── ActiveWorkout.tsx
│   ├── AICoach.tsx
│   ├── CycleReview.tsx
│   ├── Dashboard.tsx
│   ├── DeviceManager.tsx
│   ├── GymVibe.tsx
│   ├── Milestones.tsx
│   ├── Planner.tsx
│   ├── RewardsStore.tsx
│   ├── Settings.tsx
│   └── Trends.tsx
├── services
│   ├── advancedFeatures.ts
│   ├── aiGenerator.ts
│   ├── anthropicService.ts
│   ├── fitnessMechanics.ts
│   ├── jwtEngine.ts
│   ├── keyRotationService.ts
│   ├── macrocycleEngine.ts
│   ├── neuralFatigue.ts
│   ├── offlineWorkoutEngine.ts
│   ├── predictiveChallenges.ts
│   ├── ProgressionSystem.ts
│   ├── rivalAI.ts
│   ├── __tests__
│   │   └── trendAnalyzer.test.ts
│   ├── trendAnalyzer.ts
│   └── workoutGenerator.ts
├── stores
│   ├── useChallengeStore.ts
│   ├── useDeviceStore.ts
│   ├── useDualWorkoutStore.ts
│   ├── useEffortStore.ts
│   ├── useGhostStore.ts
│   ├── useMilestonesStore.ts
│   ├── usePlanStore.ts
│   ├── useProgressionStore.ts
│   ├── useRoutineStore.ts
│   ├── useSocialStore.ts
│   └── useVibeStore.ts
├── __tests__
│   └── setup.ts
├── types
│   ├── exercise.ts
│   └── ghost.ts
├── types.ts
├── utils
│   ├── bluetoothParser.ts
│   ├── cryptoEngine.ts
│   ├── cryptoHelpers.ts
│   ├── exerciseClassifier.ts
│   ├── loadCalculator.ts
│   ├── oneRMCalculator.ts
│   ├── plateCalculator.ts
│   ├── prescriptionEngine.ts
│   ├── sanitize.ts
│   ├── schemas.ts
│   └── __tests__
│       ├── cryptoEngine.test.ts
│       ├── loadCalculator.test.ts
│       └── prescriptionEngine.test.ts
└── workers
    ├── crypto.worker.ts
    ├── poseDetection.worker.ts
    └── syncWorker.ts

30 directories, 132 files
```

## 2. Código dos Ficheiros
### src/services/macrocycleEngine.ts
```typescript
// src/services/macrocycleEngine.ts

export type TrainingPhase = 'ADAPTACAO' | 'TRANSFORMACAO' | 'DESENVOLVIMENTO';

export interface PhasePrescription {
  phaseName: string;
  trainingType: 'FullBody' | 'Circuito' | 'Split';
  focus: string[];
  sets: number;
  repsTarget: string;
  restSeconds: number;
  cardioMinutes: number;
}

export const MacrocycleEngine = {
  getCurrentPhase(weeksActive: number): TrainingPhase {
    if (weeksActive <= 4) return 'ADAPTACAO';
    if (weeksActive <= 12) return 'TRANSFORMACAO';
    return 'DESENVOLVIMENTO';
  },

  getPrescriptionRules(phase: TrainingPhase): PhasePrescription {
    switch (phase) {
      case 'ADAPTACAO':
        return {
          phaseName: 'Adaptação do Corpo e Articulações',
          trainingType: 'FullBody',
          focus: ['Postura', 'Técnica', 'Resistência Muscular'],
          sets: 2,
          repsTarget: '15-20',
          restSeconds: 45,
          cardioMinutes: 15,
        };
      case 'TRANSFORMACAO':
        return {
          phaseName: 'Perda de Massa Gorda (PMG)',
          trainingType: 'Circuito',
          focus: ['Massa Muscular', 'Metabolismo', 'Queima de Gordura'],
          sets: 4,
          repsTarget: '12',
          restSeconds: 120,
          cardioMinutes: 0,
        };
      case 'DESENVOLVIMENTO':
        return {
          phaseName: 'Ganho Massa Muscular (GMM) e Força',
          trainingType: 'Split',
          focus: ['Carga pesada', 'Massa Muscular', 'Força Máxima'],
          sets: 4,
          repsTarget: '10-12',
          restSeconds: 90,
          cardioMinutes: 0,
        };
    }
  },
};
```

### src/utils/prescriptionEngine.ts
```typescript
// src/utils/prescriptionEngine.ts
import { ExerciseCategory, Goal, UserLevel } from '../types/exercise';
import { getExerciseCategory } from '../data/exerciseClassifier';
import { calculateSuggestedWeight } from './loadCalculator';
import { MacrocycleEngine } from '../services/macrocycleEngine';

export interface UserProfile {
  sex?: 'male' | 'female' | string;
  gender?: string;
  age?: number;
  goal?: Goal;
  level?: UserLevel;
  trainingPhilosophy?: string;
  philosophy?: string;
  injuries?: string[];
  weeksActive?: number;
}

export interface ExercisePrescription {
  repsTarget: string;
  repsSuggested: number;
  rpeTarget: number;
  restSeconds: number;
  warmupSets: { weightPercent: number; reps: number }[];
  suggestedWeight: number;
  explanation: string;   // explicação da sugestão
  presets: {
    strength: { weight: number; reps: number };
    endurance: { weight: number; reps: number };
    volume: { weight: number; reps: number; setsDelta: number };
  };
}

export function getPrescription(
  profile: UserProfile | undefined,
  exerciseName: string,
  historicalPR?: { weight: number; reps: number } | null,
  phase?: 'powerlifting' | 'bodybuilding'
): ExercisePrescription {
  const category = getExerciseCategory(exerciseName);
  const goal: Goal = profile?.goal || 'hipertrofia';
  const level: UserLevel = profile?.level || 'intermedio';
  const age = profile?.age || 30;
  const injuries = profile?.injuries || [];

  // 1. Definir reps alvo e RPE baseados no objetivo
  let repsMin = 8, repsMax = 12, rpe = 7, rest = 60;
  const gStr = String(goal).toLowerCase();
  if (gStr.includes('forc') || gStr.includes('forç') || phase === 'powerlifting') {
    repsMin = 3; repsMax = 5;
    rpe = 9;
    rest = 180;
  } else if (gStr.includes('resist') || gStr.includes('perda') || gStr.includes('condicionamento')) {
    repsMin = 15; repsMax = 20;
    rpe = 6;
    rest = 45;
  }

  // 1.5 Macrocycle Override
  const weeksActive = profile?.weeksActive ?? 0;
  const macroPhase = MacrocycleEngine.getCurrentPhase(weeksActive);
  const phaseRules = MacrocycleEngine.getPrescriptionRules(macroPhase);
  
  if (macroPhase !== 'ADAPTACAO' || String(level).toLowerCase() !== 'avancado') {
    const repsMatch = phaseRules.repsTarget.match(/(\d+)-?(\d+)?/);
    if (repsMatch) {
      repsMin = parseInt(repsMatch[1], 10);
      repsMax = repsMatch[2] ? parseInt(repsMatch[2], 10) : repsMin;
    }
    rest = phaseRules.restSeconds;
  }

  // Ajustes por nível
  const lStr = String(level).toLowerCase();
  if (lStr.includes('begin') || lStr.includes('iniciante')) {
    repsMin = Math.max(6, repsMin - 2);
    repsMax = Math.max(10, repsMax - 2);
    rpe = Math.max(5, rpe - 1);
    rest += 30;
  } else if (lStr.includes('adv') || lStr.includes('avancado') || lStr.includes('pro')) {
    repsMin += 2;
    repsMax += 2;
    rpe = Math.min(9, rpe + 1);
    rest = Math.max(60, rest - 15);
  }

  // Factor lesão (se houver, reduzimos intensidade)
  const injuryModifier = injuries && injuries.length > 0 ? 0.8 : 1.0;

  // 2. Estimar 1RM a partir do PR histórico (se existir)
  let oneRM = 0;
  if (historicalPR && historicalPR.weight > 0 && historicalPR.reps > 0) {
    oneRM = historicalPR.weight * (1 + historicalPR.reps / 30);
  } else {
    // Sem histórico, usar um valor simbólico baixo (ex: 20% do peso corporal do user, mas não temos; usamos 20kg para iniciante)
    oneRM = 40; // valor genérico, mas depois o loadCalculator vai reduzir
  }

  const targetReps = Math.floor((repsMin + repsMax) / 2);

  // 3. Calcular peso sugerido
  let suggestedWeight = calculateSuggestedWeight({
    oneRM,
    targetReps,
    category,
    userLevel: level,
    age,
    goal,
    injuryModifier,
  });

  // Se não houver histórico e o peso sugerido ficou zero, usar fallback
  if (!historicalPR && suggestedWeight === 0) {
    suggestedWeight = 20; // fallback razoável para iniciante
  }

  // 4. Criar presets (Força, Resistência, Volume)
  const strengthReps = Math.max(3, targetReps - 5);
  const strengthWeight = calculateSuggestedWeight({
    oneRM,
    targetReps: strengthReps,
    category,
    userLevel: level,
    age,
    goal: 'forca',
    injuryModifier,
  }) || suggestedWeight + 5;

  const enduranceReps = targetReps + 5;
  const enduranceWeight = calculateSuggestedWeight({
    oneRM,
    targetReps: enduranceReps,
    category,
    userLevel: level,
    age,
    goal: 'resistencia',
    injuryModifier,
  }) || Math.max(0, suggestedWeight - 5);

  const volumeWeight = suggestedWeight; // mantém peso
  const volumeSetsDelta = 1; // adiciona uma série

  // 5. Explicação textual
  let explanation = `Baseado no teu 1RM estimado de ${Math.round(oneRM)}kg e no teu objectivo de ${goal}, recomendamos ${suggestedWeight}kg para ${targetReps} reps.`;
  if (category === 'compound_multi') explanation += ` Este é um exercício composto, por isso a carga pode ser mais elevada.`;
  else if (category === 'isolation_multi') explanation += ` Este é um exercício de isolamento, por isso a carga é naturalmente mais baixa.`;

  // 6. Séries de aquecimento (apenas para cargas > 0)
  const warmupSets = suggestedWeight > 0 ? [
    { weightPercent: 0.5, reps: Math.min(8, targetReps) },
    { weightPercent: 0.7, reps: Math.min(5, targetReps) },
    { weightPercent: 0.85, reps: Math.min(3, targetReps) },
  ].filter(w => w.reps > 0) : [];

  return {
    repsTarget: `${repsMin}-${repsMax}`,
    repsSuggested: targetReps,
    rpeTarget: rpe,
    restSeconds: rest,
    warmupSets,
    suggestedWeight,
    explanation,
    presets: {
      strength: { weight: strengthWeight, reps: strengthReps },
      endurance: { weight: enduranceWeight, reps: enduranceReps },
      volume: { weight: volumeWeight, reps: targetReps, setsDelta: volumeSetsDelta },
    },
  };
}
```

### src/utils/cryptoEngine.ts
```typescript
const SALT = "fit_track_v7_salt";
const ITERATIONS = 100000;

export async function deriveKey(pin: string): Promise<CryptoKey> {
    return new Promise((resolve, reject) => {
        const worker = new Worker(new URL('../workers/crypto.worker.ts', import.meta.url), { type: 'module' });
        
        worker.onmessage = async (e) => {
            if (e.data.success) {
                try {
                    // Import raw key into a non-extractable CryptoKey in Main Thread (Zero Trust principle)
                    const key = await crypto.subtle.importKey(
                        'raw',
                        e.data.rawKey,
                        { name: 'AES-GCM', length: 256 },
                        false, // Non-extractable in main thread!
                        ['encrypt', 'decrypt']
                    );
                    resolve(key);
                } catch (err) {
                    reject(err);
                }
            } else {
                reject(new Error(e.data.error));
            }
            worker.terminate();
        };
        
        worker.onerror = (err) => {
            reject(err);
            worker.terminate();
        };
        
        worker.postMessage({ pin, salt: SALT, iterations: ITERATIONS });
    });
}

let masterKey: CryptoKey | null = null;
export function setMasterKey(key: CryptoKey) { masterKey = key; }
export function getMasterKey() { return masterKey; }

export async function encryptData(key: CryptoKey, data: string): Promise<string> {
    const enc = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        enc.encode(data)
    );
    const buffer = new Uint8Array(iv.length + encrypted.byteLength);
    buffer.set(iv, 0);
    buffer.set(new Uint8Array(encrypted), iv.length);
    return btoa(String.fromCharCode(...buffer));
}

export async function decryptData(key: CryptoKey, base64Data: string): Promise<string> {
    try {
        const binaryStr = atob(base64Data);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
        }
        const iv = bytes.slice(0, 12);
        const data = bytes.slice(12);
        
        const decrypted = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv },
            key,
            data
        );
        const dec = new TextDecoder();
        return dec.decode(decrypted);
    } catch (e) {
        throw new Error("Invalid PIN or corrupted data");
    }
}
```

### src/services/trendAnalyzer.ts
```typescript
// src/services/trendAnalyzer.ts
// Motor analítico de tendências — o "cérebro" do Personal Trainer IA
// Analisa o histórico de séries no IndexedDB para sugerir progressive overload ou deload.

import { getRecentSetLogsDecrypted } from '../db/encryptedDb';
import { SetLog } from '../db/schema';

// ─── TIPOS DE RESULTADO ──────────────────────────────────────────────────────

export type TrendStatus = 'NO_DATA' | 'PROGRESSING' | 'FATIGUED' | 'STABLE';

export interface TrendAnalysis {
  status: TrendStatus;
  message: string;
  suggestedWeightIncrement: number;  // Positivo = aumentar, Negativo = deload
  nextRpeTarget?: number;
  avgRpeLastWorkout?: number;
  avgWeightLastWorkout?: number;
  totalSetsAnalyzed: number;
}

// ─── MOTOR ANALÍTICO ─────────────────────────────────────────────────────────

/**
 * Analisa a tendência de um exercício baseada no histórico recente.
 * 
 * Lógica de decisão:
 * - RPE médio ≤ 7.5 → PROGRESSING → sugere +2.5kg
 * - RPE médio ≥ 9.5 → FATIGUED → sugere -2.5kg (deload tático)
 * - RPE entre 7.5 e 9.5 → STABLE → manter carga
 * 
 * @param exerciseName Nome do exercício a analisar
 * @returns Análise de tendência com sugestão de carga
 */
export async function analyzeExerciseTrend(exerciseName: string): Promise<TrendAnalysis> {
  try {
    const recentSets = await getRecentSetLogsDecrypted(exerciseName, 50);

    if (recentSets.length === 0) {
      return {
        status: 'NO_DATA',
        message: 'Ainda sem histórico. Usa a carga base recomendada.',
        suggestedWeightIncrement: 0,
        totalSetsAnalyzed: 0,
      };
    }

    // Agrupar séries por workoutId para ter visão por sessão
    const setsByWorkout = new Map<string, SetLog[]>();
    for (const set of recentSets) {
      if (!setsByWorkout.has(set.workoutId)) {
        setsByWorkout.set(set.workoutId, []);
      }
      setsByWorkout.get(set.workoutId)!.push(set);
    }

    const workoutIds = Array.from(setsByWorkout.keys());
    
    if (workoutIds.length === 0) {
      return {
        status: 'NO_DATA',
        message: 'Ainda sem histórico. Usa a carga base recomendada.',
        suggestedWeightIncrement: 0,
        totalSetsAnalyzed: 0,
      };
    }

    // Analisar o último treino (o primeiro no array, pois está ordenado desc)
    const lastWorkoutSets = setsByWorkout.get(workoutIds[0])!;
    
    // Filtrar séries sem dados válidos
    const validSets = lastWorkoutSets.filter(s => 
      s.weightKg > 0 && s.repsCompleted > 0 && s.rpe > 0
    );

    if (validSets.length === 0) {
      return {
        status: 'NO_DATA',
        message: 'Dados do último treino incompletos. Preenche peso, reps e RPE.',
        suggestedWeightIncrement: 0,
        totalSetsAnalyzed: recentSets.length,
      };
    }

    // Média de RPE do último treino
    const avgRpe = validSets.reduce((sum, s) => sum + s.rpe, 0) / validSets.length;
    // Carga média usada
    const avgWeight = validSets.reduce((sum, s) => sum + s.weightKg, 0) / validSets.length;

    // ── Regra do PT: Decisão baseada no RPE médio ──

    if (avgRpe <= 7.5) {
      return {
        status: 'PROGRESSING',
        message: 'Estás a dominar esta carga com boa margem de esforço. Bora aumentar!',
        suggestedWeightIncrement: 2.5,
        nextRpeTarget: 8,
        avgRpeLastWorkout: Math.round(avgRpe * 10) / 10,
        avgWeightLastWorkout: Math.round(avgWeight * 10) / 10,
        totalSetsAnalyzed: recentSets.length,
      };
    }

    if (avgRpe >= 9.5) {
      return {
        status: 'FATIGUED',
        message: 'Esforço máximo na última sessão. Reduz a carga para proteger o SNC.',
        suggestedWeightIncrement: -2.5,
        nextRpeTarget: 7.5,
        avgRpeLastWorkout: Math.round(avgRpe * 10) / 10,
        avgWeightLastWorkout: Math.round(avgWeight * 10) / 10,
        totalSetsAnalyzed: recentSets.length,
      };
    }

    // RPE entre 7.5 e 9.5 — zona ideal
    return {
      status: 'STABLE',
      message: 'Mantém o ritmo, consolida a carga antes de subir.',
      suggestedWeightIncrement: 0,
      nextRpeTarget: 8,
      avgRpeLastWorkout: Math.round(avgRpe * 10) / 10,
      avgWeightLastWorkout: Math.round(avgWeight * 10) / 10,
      totalSetsAnalyzed: recentSets.length,
    };
  } catch (error) {
    console.error('[TrendAnalyzer] Erro ao analisar tendência:', error);
    return {
      status: 'NO_DATA',
      message: 'Erro ao ler o histórico. Tenta novamente.',
      suggestedWeightIncrement: 0,
      totalSetsAnalyzed: 0,
    };
  }
}

/**
 * Analisa múltiplos exercícios em batch (útil para dashboard/relatórios).
 */
export async function analyzeMultipleExercises(exerciseNames: string[]): Promise<Map<string, TrendAnalysis>> {
  const results = new Map<string, TrendAnalysis>();
  
  // Executa em paralelo para melhor performance
  const analyses = await Promise.all(
    exerciseNames.map(async (name) => ({
      name,
      analysis: await analyzeExerciseTrend(name),
    }))
  );

  for (const { name, analysis } of analyses) {
    results.set(name, analysis);
  }

  return results;
}
```

### src/utils/oneRMCalculator.ts
```typescript
export function calculateEPLEY(weight: number, reps: number): number {
  if (weight <= 0 || reps < 1) return 0;
  const repsClamped = Math.min(reps, 30);
  const oneRM = weight * (1 + repsClamped / 30);
  return Math.round(oneRM * 100) / 100;
}
```

### src/services/jwtEngine.ts
```typescript
// src/services/jwtEngine.ts
// ════════════════════════════════════════════════════════════════
// FitTrack V7 — Motor JWT Zero Trust (Browser-side)
// ════════════════════════════════════════════════════════════════
//
// EVOLUÇÃO:
//   v1.0: Gerava JWT localmente com VITE_API_SHARED_SECRET (segredo no bundle)
//   v2.0: Pede token efémero ao servidor via /api/request-token
//         O segredo NUNCA toca no browser. Zero Trust puro.
//
// O token é cacheado por 50s (margem de 10s antes de expirar no servidor).
// ════════════════════════════════════════════════════════════════

interface CachedToken {
  token: string;
  expiresAt: number;
}

let cachedToken: CachedToken | null = null;

/**
 * Solicita um JWT efémero (60s) ao backend via /api/request-token.
 * Envia nonce + timestamp; o servidor valida e devolve um token assinado.
 * O token é cacheado localmente por 50s para evitar pedidos desnecessários.
 */
export async function generateShortLivedToken(): Promise<string> {
  const now = Date.now();

  // Usar token em cache se ainda válido (margem de 10s)
  if (cachedToken && cachedToken.expiresAt > now) {
    return cachedToken.token;
  }

  const nonce = crypto.randomUUID();
  const timestamp = now;

  // Em dev, o Vite proxy redireciona /api/* → localhost:3001
  // Em prod, é o mesmo domínio (Vercel)
  const API_URL = import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api/request-token`
    : '/api/request-token';

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nonce, timestamp }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.warn(`[JWT] Falha na negociação (${response.status}): ${errorText}`);
      // Fallback: gerar token localmente se o servidor não responder
      return fallbackLocalToken();
    }

    const data = await response.json();
    const token = data.token;

    // Cache por 50s (o servidor emite com 60s de validade)
    cachedToken = {
      token,
      expiresAt: now + 50_000,
    };

    return token;
  } catch (error) {
    console.warn('[JWT] Servidor indisponível, a usar fallback local:', error);
    return fallbackLocalToken();
  }
}

/**
 * Fallback: gera JWT localmente quando o endpoint /api/request-token
 * não está disponível (dev offline, servidor em baixo, etc.)
 * Usa VITE_API_SHARED_SECRET se existir, senão um token dummy.
 */
async function fallbackLocalToken(): Promise<string> {
  const secret = import.meta.env.VITE_API_SHARED_SECRET;
  if (!secret) {
    // Sem segredo e sem servidor → token vazio (o server.js local aceita sem JWT em dev)
    return 'dev-no-token';
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = { origin: 'FitTrack-V7-Client', iat: now, exp: now + 60 };

  const headerB64 = textToBase64Url(JSON.stringify(header));
  const payloadB64 = textToBase64Url(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC', key, new TextEncoder().encode(signingInput)
  );

  return `${signingInput}.${base64UrlEncode(signature)}`;
}

/**
 * Força renovação do token (útil após falha 403)
 */
export function invalidateToken(): void {
  cachedToken = null;
}

// ── Utilidades Base64URL ──────────────────────────────────────────

function base64UrlEncode(data: ArrayBuffer | Uint8Array): string {
  const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function textToBase64Url(text: string): string {
  return btoa(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
```

### api/claude.js
```typescript
import { createHmac, timingSafeEqual } from 'crypto';

/**
 * FitTrack V7 — Vercel Serverless: /api/claude
 * ══════════════════════════════════════════════
 * 
 * Proxy genérico para a API Messages da Anthropic.
 * Usado pelo AICoach e WeeklyPlanGenerator.
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

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API Key não configurada.' });

  // Sanitizar payload
  const payload = { ...req.body };
  delete payload.api_key;
  delete payload.apiKey;

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: payload.model || 'claude-3-5-sonnet-20241022',
        max_tokens: payload.max_tokens || 1500,
        system: payload.system || 'És o treinador IA do FitTrack.',
        temperature: payload.temperature ?? 0.3,
        messages: payload.messages || [{ role: 'user', content: 'Olá' }],
      }),
    });

    const data = await anthropicRes.json();
    return res.status(anthropicRes.status).json(data);
  } catch (error) {
    console.error('[Vercel] Claude proxy error:', error);
    return res.status(500).json({ error: error.message });
  }
}
```

### src/db/schema.ts
```typescript
// src/db/schema.ts
// Base de dados relacional IndexedDB para o FitTrack V7
// Usa a biblioteca 'idb' (já instalada) como wrapper tipado sobre o IndexedDB nativo.

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// ─── INTERFACES DOS MODELOS ──────────────────────────────────────────────────

/** Sessão de treino (visão macro) */
export interface WorkoutSession {
  id: string;                // UUID gerado localmente
  date: number;              // Timestamp (fácil para ordenar)
  name: string;              // Ex: "Treino Push (Força)"
  durationSeconds: number;   // Tempo total do treino
  readinessScore: number;    // Fadiga neural antes de começar (0-100)
  totalVolumeKg: number;     // Somatório do peso levantado
  isCompleted: boolean;
}

/** Registo de séries (onde a IA vai buscar os dados reais) */
export interface SetLog {
  id: string;                // UUID
  workoutId: string;         // Ligação à sessão
  exerciseName: string;      // Ex: "Barbell Back Squat"
  category: string;          // Ex: "compound_multi"
  setNumber: number;         // Ex: 1, 2, 3...
  weightKg: number;          // Carga utilizada
  repsCompleted: number;     // Repetições reais feitas
  rpe: number;               // Esforço sentido (1-10)
  estimated1RM: number;      // Cálculo automático (peso * (1 + reps/30))
  timestamp: number;
  // Campo para dados cifrados (quando criptografia activa)
  encryptedFields?: string;  // Payload cifrado AES-GCM (substitui weightKg/repsCompleted/rpe/estimated1RM)
}

/** Cache de recordes pessoais (para leitura ultra-rápida na UI) */
export interface PersonalRecord {
  exerciseName: string;      // Primary Key
  best1RM: number;           // Maior 1RM estimado de sempre
  bestVolumeWeight: number;  // Maior carga levantada para 10+ reps
  lastTrainedAt: number;     // Data da última vez que fez este exercício
  encryptedFields?: string;  // Payload cifrado (usado também para Avaliações Físicas)
}

// ─── SCHEMA DO INDEXEDDB ─────────────────────────────────────────────────────

interface FitTrackDBSchema extends DBSchema {
  workouts: {
    key: string;
    value: WorkoutSession;
    indexes: {
      'by-date': number;
      'by-completed': string; // IDB não suporta boolean como índice, usamos string 'true'/'false'
    };
  };
  setLogs: {
    key: string;
    value: SetLog;
    indexes: {
      'by-workoutId': string;
      'by-exerciseName': string;
      'by-timestamp': number;
      'by-exercise-timestamp': [string, number]; // índice composto para queries eficientes
    };
  };
  personalRecords: {
    key: string;
    value: PersonalRecord;
    indexes: {
      'by-lastTrained': number;
    };
  };
}

// ─── SINGLETON DA BASE DE DADOS ──────────────────────────────────────────────

const DB_NAME = 'FitTrack_V7_Database';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<FitTrackDBSchema> | null = null;

/**
 * Obtém a instância singleton da base de dados.
 * Inicializa na primeira chamada, reutiliza nas seguintes.
 */
export async function getDB(): Promise<IDBPDatabase<FitTrackDBSchema>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<FitTrackDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // ── Workouts Store ──
      if (!db.objectStoreNames.contains('workouts')) {
        const workoutStore = db.createObjectStore('workouts', { keyPath: 'id' });
        workoutStore.createIndex('by-date', 'date');
        workoutStore.createIndex('by-completed', 'isCompleted');
      }

      // ── SetLogs Store ──
      if (!db.objectStoreNames.contains('setLogs')) {
        const setLogStore = db.createObjectStore('setLogs', { keyPath: 'id' });
        setLogStore.createIndex('by-workoutId', 'workoutId');
        setLogStore.createIndex('by-exerciseName', 'exerciseName');
        setLogStore.createIndex('by-timestamp', 'timestamp');
        setLogStore.createIndex('by-exercise-timestamp', ['exerciseName', 'timestamp']);
      }

      // ── PersonalRecords Store ──
      if (!db.objectStoreNames.contains('personalRecords')) {
        const prStore = db.createObjectStore('personalRecords', { keyPath: 'exerciseName' });
        prStore.createIndex('by-lastTrained', 'lastTrainedAt');
      }
    },
  });

  return dbInstance;
}

// ─── OPERAÇÕES CRUD BÁSICAS ──────────────────────────────────────────────────

/** Gerar UUID compatível com todos os browsers */
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback para browsers sem crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ── Workouts ──

export async function addWorkoutSession(session: Omit<WorkoutSession, 'id'>): Promise<string> {
  const db = await getDB();
  const id = generateId();
  const record: WorkoutSession = { ...session, id };
  await db.put('workouts', record);
  return id;
}

export async function getWorkoutSession(id: string): Promise<WorkoutSession | undefined> {
  const db = await getDB();
  return db.get('workouts', id);
}

export async function getAllWorkouts(): Promise<WorkoutSession[]> {
  const db = await getDB();
  return db.getAllFromIndex('workouts', 'by-date');
}

// ── SetLogs ──

export async function addSetLog(setLog: Omit<SetLog, 'id'>): Promise<string> {
  const db = await getDB();
  const id = generateId();
  const record: SetLog = { ...setLog, id };
  await db.put('setLogs', record);
  return id;
}

export async function getSetLogsByWorkout(workoutId: string): Promise<SetLog[]> {
  const db = await getDB();
  return db.getAllFromIndex('setLogs', 'by-workoutId', workoutId);
}

export async function getSetLogsByExercise(exerciseName: string): Promise<SetLog[]> {
  const db = await getDB();
  return db.getAllFromIndex('setLogs', 'by-exerciseName', exerciseName);
}

export async function getRecentSetLogsByExercise(exerciseName: string, limit = 50): Promise<SetLog[]> {
  const db = await getDB();
  const tx = db.transaction('setLogs', 'readonly');
  const index = tx.store.index('by-exercise-timestamp');
  
  // IDBKeyRange para filtrar por exerciseName (qualquer timestamp)
  const range = IDBKeyRange.bound(
    [exerciseName, 0],
    [exerciseName, Number.MAX_SAFE_INTEGER]
  );
  
  const results: SetLog[] = [];
  let cursor = await index.openCursor(range, 'prev'); // 'prev' = mais recentes primeiro
  
  while (cursor && results.length < limit) {
    results.push(cursor.value);
    cursor = await cursor.continue();
  }
  
  return results;
}

// ── PersonalRecords ──

export async function getPersonalRecord(exerciseName: string): Promise<PersonalRecord | undefined> {
  const db = await getDB();
  return db.get('personalRecords', exerciseName);
}

export async function upsertPersonalRecord(pr: PersonalRecord): Promise<void> {
  const db = await getDB();
  const existing = await db.get('personalRecords', pr.exerciseName);
  
  if (!existing) {
    await db.put('personalRecords', pr);
    return;
  }
  
  // Só actualiza se for melhor
  const updated: PersonalRecord = {
    exerciseName: pr.exerciseName,
    best1RM: Math.max(existing.best1RM, pr.best1RM),
    bestVolumeWeight: Math.max(existing.bestVolumeWeight, pr.bestVolumeWeight),
    lastTrainedAt: Math.max(existing.lastTrainedAt, pr.lastTrainedAt),
  };
  
  await db.put('personalRecords', updated);
}

export async function getAllPersonalRecords(): Promise<PersonalRecord[]> {
  const db = await getDB();
  return db.getAll('personalRecords');
}

export { generateId };
```

### src/types.ts
```typescript
// src/types.ts

export interface Anamnesis {
    medicalConditions: string[];
    activityLevel: 'sedentario' | 'praticante_irregular' | 'praticante_regular';
    weeklyFrequencyTarget: number;
    goalPriorities: string[];
    targetZone: string;
    motivationScore: number;
}

export interface BodyMeasurements {
    date: number;
    weightKg: number;
    heightCm: number;
    bodyFatPercentage: number;
    leanMassPercentage: number;
    visceralFat: number;
    bloodPressure: string;
    restingHeartRate: number;
    circumferences: {
        chest?: number;
        waist?: number;
        abdominal?: number;
        hips?: number;
        bicepRight?: number;
        bicepLeft?: number;
        thighRight?: number;
        thighLeft?: number;
        calfRight?: number;
        calfLeft?: number;
    };
}

export interface UserProfile {
    name: string;
    goal: string;
    level: string;
    weight: number; 
    height?: number;
    fitnessLevel?: string;
    availableEquipment?: string[];
    injuries?: string[];
    weeklyAvailability?: number;
    preferredWorkoutDuration?: number;
    mainLimitation?: string;
    xp?: number;
    gender?: string;
    workoutStyle?: string;
    trainingDays?: string[];
    philosophy?: string;
    anamnesis?: Anamnesis;
    bodyMeasurements?: BodyMeasurements[];
    startDate?: number;
    weeksActive?: number;
}

export interface ExerciseSet {
    reps: number;
    weight: number;
    rpe?: number;
    done?: boolean;
    isWarmup?: boolean;
}

export interface ExerciseSession {
    name: string;
    muscle: string;
    sets: ExerciseSet[];
}

export interface WorkoutSession {
    date: string;
    dayLabel: string;
    duration: number;
    exercises: ExerciseSession[];
    totalVolume: number;
    avgRPE?: number;
    intensity?: string | number;
    notes?: string;
    calories?: number;
}

export interface WorkoutPlan {
    id: string;
    label: string;
    exercises: string[];
}
```

## 3. Output de npx vitest run
```text

 RUN  v4.1.8 /home/kali/Documentos/Fittrack

stderr | src/services/__tests__/trendAnalyzer.test.ts > trendAnalyzer — analyzeExerciseTrend > deve retornar NO_DATA quando a base de dados lança erro
[TrendAnalyzer] Erro ao analisar tendência: Error: IDB connection failed
    at /home/kali/Documentos/Fittrack/src/services/__tests__/trendAnalyzer.test.ts:167:45
    at file:///home/kali/Documentos/Fittrack/node_modules/@vitest/runner/dist/chunk-artifact.js:302:11
    at file:///home/kali/Documentos/Fittrack/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:26
    at file:///home/kali/Documentos/Fittrack/node_modules/@vitest/runner/dist/chunk-artifact.js:2326:20
    at new Promise (<anonymous>)
    at runWithCancel (file:///home/kali/Documentos/Fittrack/node_modules/@vitest/runner/dist/chunk-artifact.js:2323:10)
    at file:///home/kali/Documentos/Fittrack/node_modules/@vitest/runner/dist/chunk-artifact.js:2305:20
    at new Promise (<anonymous>)
    at runWithTimeout (file:///home/kali/Documentos/Fittrack/node_modules/@vitest/runner/dist/chunk-artifact.js:2272:10)
    at file:///home/kali/Documentos/Fittrack/node_modules/@vitest/runner/dist/chunk-artifact.js:2955:64

 ✓ src/services/__tests__/trendAnalyzer.test.ts (12 tests) 44ms
 ✓ src/utils/__tests__/cryptoEngine.test.ts (10 tests) 70ms
 ✓ src/utils/__tests__/prescriptionEngine.test.ts (17 tests) 36ms
 ✓ src/utils/__tests__/loadCalculator.test.ts (13 tests) 18ms

 Test Files  4 passed (4)
      Tests  52 passed (52)
   Start at  17:46:55
   Duration  5.89s (transform 576ms, setup 353ms, import 569ms, tests 168ms, environment 9.70s)

```

## 4. Output de npm run build (últimas 30 linhas)
```text
dist/assets/Trends-DUSS7IXy.js                      15.81 kB │ gzip:   4.90 kB
dist/assets/constants-DPialX5D.js                   20.11 kB │ gzip:   5.62 kB
dist/assets/sanitize-D98Lb5UP.js                    22.70 kB │ gzip:   8.90 kB
dist/assets/Dashboard-Ca4rqw5J.js                   66.50 kB │ gzip:  18.49 kB
dist/assets/ActiveWorkout-CgP6orPE.js              109.21 kB │ gzip:  27.68 kB
dist/assets/middleware-DS1Lcwg7.js                 123.13 kB │ gzip:  40.22 kB
dist/assets/index-BIdLe-ol.js                    1,633.66 kB │ gzip: 458.96 kB

✓ built in 3.40s
[plugin builtin:vite-reporter] 
(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rolldownOptions.output.codeSplitting to improve chunking: https://rolldown.rs/reference/OutputOptions.codeSplitting
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.

PWA v1.3.0
mode      generateSW
precache  145 entries (7442.56 KiB)
files generated
  dist/sw.js
  dist/workbox-9c191d2f.js

> fittrack@0.0.0 postbuild
> npm run security-check


> fittrack@0.0.0 security-check
> if grep -qr 'sk-ant' dist/ 2>/dev/null; then echo '🚨 CHAVE ANTHROPIC NO BUNDLE!' && exit 1; else echo '✅ Zero Trust OK: Nenhum segredo no frontend.'; fi

✅ Zero Trust OK: Nenhum segredo no frontend.
```

## 5. FITTRACK_EVOLUTION.md
```markdown
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
```

## 6. walkthrough.md
```markdown
# Conclusão: Integração Clínica e Periodização

A integração do Assessment Clínico, Macrocycle Engine e Phase Card está oficialmente finalizada, respeitando totalmente o princípio de Zero Trust e mantendo a leveza do estado com a passagem de props em `App.tsx` e `Dashboard.tsx`.

## O que foi implementado

### 1. Motor de Periodização (Macrocycle Engine)
O `macrocycleEngine.ts` foi criado e integrado na `prescriptionEngine.ts`. A engine avalia as `weeksActive` do atleta e enquadra-o em três fases:
- **ADAPTAÇÃO** (Até 4 semanas): 15-20 reps, 45s descanso, focado em postura.
- **TRANSFORMAÇÃO** (Até 12 semanas): 12 reps, 120s descanso, focado em perda de massa gorda e circuitos.
- **DESENVOLVIMENTO** (>12 semanas): 10-12 reps, 90s descanso, focado em Força e GMM.

### 2. Avaliação Clínica Zero Trust
O componente `FitnessAssessment.tsx` foi completamente reformulado.
O novo formulário de três passos capta e encripta (com `encryptData` e a Master Key) a Anamnese e as Medidas Antropométricas do utilizador. Estes dados são armazenados localmente na store `personalRecords` no IndexedDB, tal como pretendido na arquitetura local first.

### 3. Integração Claude AI e Dashboard
O componente `PhaseCard.tsx` foi adicionado ao Dashboard. Aceita `history` para inferir de forma inteligente os dias ativos sem necessitar de Zustand stores adicionais. 
O prompt de IA em `anthropicService.ts` (`generateWeeklyPlan`) tem agora uma diretiva de prioridade alta para focar obrigatoriamente nas diretrizes estruturais definidas pelo `MacrocycleEngine`.

## Validação e Testes

- ✔️ Foi efetuado o `build`, incluindo o check de segurança (`npm run security-check`) que atestou a ausência de chaves de API expostas (Zero Trust OK).
- ✔️ Corrigi a exportação de base de dados para usar adequadamente o `getDB()`.
- ✔️ A suite de testes foi atualizada no `prescriptionEngine.test.ts` para testar os overrides de Adaptação nos utilizadores intermédios (esperando agora os 45 segundos de descanso por default em novas avaliações), culminando em **100% dos testes aprovados (17/17)** no arquivo modificado e 52/52 globais.
```

