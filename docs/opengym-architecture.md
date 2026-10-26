# openGym Architectural Analysis Report

## Executive Summary

This report documents the architectural patterns, design decisions, and technical implementations observed in the **openGym** open-source repository. The analysis focuses on two main components:

1. **Frontend** — React/Vite application with Zustand state management
2. **Backend** — Node.js HTTP server with JSON file-based storage and WebAuthn passkey authentication

The goal is to extract reusable architectural patterns for adaptation in the **FitTrack** project, avoiding direct code copying while preserving proven solutions.

---

## 1. Frontend Architecture

### 1.1 State Management

- **Library**: Zustand (single store, `useStore.js` ~124KB)
- **Persistence**: `localStorage` (`gym_state_v1`) + mobile mirror (`opengym-state.json`)
- **Sync mechanism**: Revision-based (`_rev`, `_ts`) + write-ids (`_wid`, `_wids`) for conflict resolution
- **Merge strategy**: Last-write-wins per field with timestamps (`_ts`), arrays merged by `id`
- **Key insight**: State + sync metadata in same object — simplifies offline-first design

### 1.2 Module Architecture (`src/lib/`)

All business logic resides in **pure functions** (no React, no side effects):

| File | Purpose |
|------|---------|
| `progression.js` | Motor de progressão (linear, double, triple, greyskull, time) |
| `structuralBalance.js` | Mapa muscular / rácios força (Poliquin/ATG) |
| `history.js` | Leitura honesta de sessões passadas |
| `dumbbells.js` | Inventário de halteres, significado do peso (each/total/as) |
| `plates.js`, `bar.js` | Cálculos de discos/barras |
| `workout-model.js` | Modelo de treino (warmups, dropsets, sides, clusters) |
| `exercises.js` + `exercises-data.js` | Catálogo 4000+ exercícios com músculos |
| `exercise-muscle-map.json` | Músculos primários/secundários + muscleWeights |

**Key principle**: `import { ... } from './lib/*.js'` — modules can be imported by history.js, progression.js, etc. without cycles.

### 1.3 UI Layer

- **Framework**: React 19 + Vite + React Router 7
- **State**: `zustand` for global, `useUI` for ephemeral (toasts, modals, timers)
- **Composition**: Components delegate business logic to `lib/` functions; UI only handles rendering

---

## 2. Backend Architecture

### 2.1 Stack

- **Runtime**: Node.js (native HTTP, sem framework)
- **Auth**: `@simplewebauthn/server` (WebAuthn/Passkeys)
- **Storage**: JSON files + `atomicWrite` + `fsync` for durability
- **Push**: web-push (VAPID) + health checks

### 2.2 Data Layer

**File structure** (`DATA/`):
```
├── secret              # 32 bytes HMAC key for session cookies
├── db.json             # { users[], creds[], subs[], invites[], deviceLinks[] } — 0600
├── db.json.bak         # Cópia da última escrita (fallback boot)
├── state-{uid}.json    # Estado por utilizador (treinos, rotinas, etc.)
├── vapid.json          # Chaves Web Push
└── uploads/{uid}/      # Mídia (fotos/vídeos) — opcional
```

**Atomic writes** (`durable.js`):
```javascript
export function atomicWrite(file, content, mode) {
  const tmp = file + '.tmp';
  const fd = fs.openSync(tmp, 'w', mode);
  fs.writeFileSync(fd, content); fs.fsyncSync(fd); fs.closeSync(fd);
  fs.renameSync(tmp, file);
  fs.fsyncSync(path.dirname(file)); // fsync do diretório
}
```

**Boot resilience** (`loadDb`):
1. Tenta ler `db.json` → parse JSON
2. Se falhar: copia para `db.json.unreadable-{ts}`, tenta `db.json.bak`
3. Se ambos falharem: **recusa arrancar** (exit 1) — evita "nova instância vazia"

### 2.3 Authentication (Passkeys/WebAuthn)

**Flow**:
1. `POST /api/register/options` → challenge + opções WebAuthn
2. Cliente cria credencial → `POST /api/register/verify` → verifica + cria user + guarda credencial em `db.creds`
3. `POST /api/login/options` → challenge
4. `POST /api/login/verify` → verifica assertion, atualiza counter + lastUsed
5. Cookie de sessão HttpOnly (`gym_session`)

**Multi-passkey** (#95):
- `db.creds[]` — uma linha por credencial
- **Golden rule**: *A profile never loses its last way in*
- `passkeyRemovalRefused()`: verifica `mine - 1 + otherWays >= 1`
- `otherWays` = password activa (se `PASSWORD_LOGIN=on`)

**Device linking** (mobile app):
- Browser assinado gera código one-shot 5 min (`/api/pair/create`)
- App resgata código → `POST /api/pair/redeem` → devolve Bearer token

### 2.4 Sync Mechanism

**Revision system**:
- `GET /api/data` → `{ state, rev }`
- `PUT /api/data` → `{ state, baseRev? }`
- `baseRev !== curRev` → **409 Conflict** + estado atual para merge
- `baseWid` provided but `_wid` differs → **409** (documento divergente)

**Merge client-side** (`sync-merge.js`):
- Campo-a-campo com timestamps (`_ts`) — last-write-wins
- Arrays merged by `id` + `_ts`
- `resetAt`/`resetIds` só avança (nunca recua)

---

## 3. Architectural Patterns for FitTrack

### 3.1 Reusable Patterns

| openGym Pattern | FitTrack Application | Benefit |
|----------------|--------------------|---------|
| **Pure functions in `lib/`** | Extrair lógica de progressão, 1RM, volume, muscle map para `/lib` | Testável, portátil, SSR-ready |
| **Honest session reading** | `readSession()` único ponto de verdade para "hit/miss" | Elimina bugs de contadores desfasados |
| **Named policies + `why`** | `nextPrescription()` devolve `{ kind, weight, reps, why: [...] }` | UX de confiança: utilizador vê *porquê* |
| **Epley deload + owned weights** | Usar inventário de equipamento para deloads realistas | Evita "deload para 61.3 kg" quando só tens 60/62.5 |
| **Structural Balance with roles** | Definir roles (ex: "Knee Dominant", "Vertical Pull") com âncoras e targets | Feedback acionável: "O teu row está 15% abaixo do bench" |
| **Atomic JSON + fsync** | Backend simples, ficheiros por user, `atomicWrite` | Zero-dependency, survive power loss, fácil backup |
| **Revision + write-ids sync** | `baseRev`/`baseWid` no PUT, merge client-side | Offline-first, multi-device sem conflitos silenciosos |
| **Passkeys multi-dispositivo + device link** | Auth moderna sem passwords, mobile app via QR/code | Segurança + UX mobile nativa |
| **Single Zustand store + sync meta** | Um store, meta `_rev/_wid/_wids` junto ao estado | Simplicidade: sync é apenas mais um reducer |

### 3.2 Anti-Patterns to Avoid

| openGym Pattern | Why Avoid |
|----------------|-----------|
| Global mutable state without revision tracking | Leads to silent data loss on sync |
| Storing counters that can drift | Progressão depends on honest reading, not persisted counters |
| Hard-coded "add 2.5kg" rule | Replace with policy engine for flexibility |

---

## 4. Code Examples

### 4.1 Honest Session Reading (openGym → FitTrack)

```typescript
// openGOM principle: session is what happened, next prescription derived every time
export function readSession(session: Session): SessionJudgement {
  const workSets = session.sets.filter(s => !s.isWarmup);
  const prescribedSets = session.config.sets;

  if (workSets.length < prescribedSets) {
    return { ok: false, reason: `Apenas ${workSets.length} de ${prescribedSets} séries` };
  }

  const relevantSets = workSets.slice(0, prescribedSets);
  const allHit = relevantSets.every(s => s.done && s.completedReps >= s.targetReps);

  if (!allHit) {
    const failed = relevantSets.find(s => !s.done || s.completedReps < s.targetReps);
    return { ok: false, reason: `Falhou: ${failed.completedReps}/${failed.targetReps} reps` };
  }

  return { ok: true, reason: `Todas as ${prescribedSets} séries completadas` };
}
```

### 4.2 Double Progression (openGOM → FitTrack)

```typescript
export function nextPrescription(sessions: Session[], config: ExerciseConfig): Prescription {
  if (sessions.length === 0) {
    return { kind: 'first', weight: config.currentWeight, reps: config.repsMin, sets: config.sets, reason: 'Primeira sessão', policy: 'double' };
  }

  const last = sessions[sessions.length - 1];
  const judgement = readSession(last);
  const stalls = countStalls(sessions, config);

  // Bodyweight: progress in reps, not weight
  if (config.isBodyweight) {
    if (!judgement.ok) return { kind: 'hold', weight: 0, reps: config.repsMin, sets: config.sets, reason: judgement.reason, policy: 'double' };
    return { kind: 'up', weight: 0, reps: Math.min(config.reps, judgement.weight + 1), sets: config.sets, reason: `Bodyweight: subiu para ${judgement.weight + 1} reps`, policy: 'double' };
  }

  // Deload after stalls
  if (stalls >= 3) {
    const newWeight = Math.max(config.weightIncrement, Math.round(config.currentWeight * 0.9 * 10) / 10);
    return { kind: 'deload', weight: newWeight, reps: config.repsMin, sets: config.sets, reason: `Estagnou ${stalls}x — deload para ${newWeight}kg`, policy: 'double' };
  }

  // Top of range → increase weight
  const lastWorkSets = last.sets.filter(s => !s.isWarmup && s.done);
  const hitTop = judgement.ok && judgement.weight === config.currentWeight && lastWorkSets.every(s => s.completedReps >= config.reps);

  if (hitTop) {
    return { kind: 'up', weight: config.currentWeight + config.weightIncrement, reps: config.repsMin, sets: config.sets, reason: `Topo do intervalo (${config.reps} reps) — +${config.weightIncrement}kg, volta a ${config.repsMin} reps`, policy: 'double' };
  }

  // Hold: maintain weight, gradually increase reps
  const lowReps = lastWorkSets.length > 0 ? Math.min(...lastWorkSets.map(s => s.completedReps)) : config.repsMin;
  return { kind: 'hold', weight: config.currentWeight, reps: Math.min(config.reps, lowReps + 1), sets: config.sets, reason: judgement.ok ? `Mantém ${config.currentWeight}kg, alvo ${Math.min(config.reps, lowReps + 1)} reps` : `Falhou — mantém ${config.currentWeight}kg, alvo ${Math.min(config.reps, lowReps + 1)} reps`, policy: 'double' };
}
```

### 4.3 Structural Balance Roles

```typescript
type EvaluationMode = 'LOAD_RATIO' | 'BODYWEIGHT_RATIO' | 'REP_COUNT';

interface Role {
  id: string;
  evaluationMode: EvaluationMode;
  anchorRoleId?: string;
  exerciseIds: string[]; // whitelist
  targetPct: number; // for LOAD_RATIO/BODYWEIGHT_RATIO
  repsTarget: number; // for REP_COUNT
  repsTargetFemale?: number; // for REP_COUNT
}

function resolveCurrent(S: State, exerciseIds: string[], bodyweightKg: number | null, reps?: number): { estKg: number; w: number; r: number; d: string; t: string; exId: string } | null {
  // Scans history, reads sets, uses estimate1RM / loadAtReps
  // Handles assisted machines: load = BW - help
  // Handles unilateral: reads best side only
  // Returns null if no data available
}
```

---

## 5. Key Files Reference

```
/openGym/
├── frontend/src/lib/
│   ├── progression.js           # 950 lines — progression engine
│   ├── structuralBalance.js    # 400 lines — muscle ratios
│   ├── structuralBalanceTemplates.js  # Poliquin/ATG templates
│   ├── history.js              # Honest session reading
│   ├── dumbbells.js            # Inventory + weight meaning
│   ├── exercises.js + exercises-data.js  # 4000+ exercises catalogue
│   ├── exercise-muscle-map.json  # Muscles + weights
│   ├── workout-model.js        # Model: warmups, drops, clusters, sides
│   ├── sync-merge.js           # Bidirectional merge with timestamps
│   └── sync-stamps.js          # Stamps for edits/removals
├── frontend/src/store/
│   └── useStore.js             # Zustand store (124KB) + _rev/_wid/_wids/_ts
└── api/
    ├── server.js               # Full backend (2800 lines)
    ├── durable.js              # Atomic write + fsync
    ├── passkeys-store.js       # Multi-passkey bookkeeping
    ├── password.js             # Hash/verify/scrypt + reset codes
    └── sync-stamps.js          # Server-side: stampPut, notePrior
```

---

## 6. Conclusion

The openGym architecture demonstrates several proven patterns worth adapting:

1. **Honest data over persisted counters** — the log is the source of truth; prescriptions are derived every time
2. **Policy engine over hard-coded rules** — named policies with `why` output for UX transparency
3. **Pure functions + modular imports** — testable, composable, cycle-free code
4. **Atomic file operations + revision sync** — offline-first, power-loss resistant, multi-device
5. **Passkeys + device linking** — modern auth without password managament burden

For FitTrack, the most valuable adaptations are:
- The `readSession()` honest-reading pattern
- The `nextPrescription()` policy engine with `why` output
- The structural balance role system
- The atomic write + revision sync approach (or switch to PostgreSQL/Supabase for scalability)
- Passkey authentication for modern login flow

---

*Report generated from analysis of openGym repository (DuarteSantos8/openGym) on 2026-10-26.*