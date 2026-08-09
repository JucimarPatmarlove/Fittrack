# 🤖 FitTrack V7 — Agent Instructions

> **Versão:** 1.0.0  
> **Última atualização:** 2026-08-09  
> **Propósito:** Este documento define padrões, workflows e convenções que TODO agente AI (qualquer modelo) deve seguir ao trabalhar no FitTrack V7.

---

## 📋 Sumário Executivo

FitTrack V7 é uma aplicação fitness PWA/mobile (React 19 + Vite 8 + TypeScript) com:
- Tracking de treinos multi-modal (peso, calistenia, cardio, mobilidade)
- Injury Prediction Engine (ACWR, stress por região, recovery scoring)
- AI Coach (Anthropic + Google Generative AI + Pinecone RAG)
- Gamificação re-balanceada (Effort Score normalizado)
- Social/Clubs (futuro)

**Stack:** React 19, Vite 8, TypeScript, Zustand, Zod, Tailwind CSS v4, Framer Motion, Recharts, Three.js/R3F, MediaPipe, Capacitor, Supabase, IDB, Sentry, PostHog.

---

## 🏗️ Arquitetura do Projeto

```
src/
  App.tsx              ← Router principal com Suspense + Lazy Loading
  main.tsx             ← Entry point (NUNCA main.jsx)
  screens/             ← Páginas completas (Dashboard, ActiveWorkout, Recovery, etc.)
  components/          ← Componentes reutilizáveis
    injury/            ← BodyMap, InjuryRiskPanel, RiskBadge, WorkoutModifications
    recovery/          ← SorenessMap, SleepInput, MoodTracker, HRVInput
    workout/           ← WorkoutSetRow, ExerciseCard, Timer, etc.
    ui/                ← Button, Input, Card, Modal, Skeleton (design system)
  hooks/               ← Custom hooks (useFitnessData, useLocalStorage, etc.)
  stores/              ← Zustand stores (useInjuryStore, useWorkoutStore, etc.)
  services/            ← Lógica de negócio pesada
    injuryPrediction/  ← Engine preditivo completo
    aiCoach/           ← Integrações Anthropic + Google AI
    progression/       ← Algoritmos de progressão automática
  utils/               ← Helpers puros
    schemas.ts         ← Zod schemas (DISCRIMINATED UNION obrigatório)
    xpCalculator.ts    ← Effort Score normalizado
    calculators.ts     ← Cálculos diversos
  types/               ← Tipos TypeScript globais
    injury.ts          ← Tipos do sistema de lesões
  data/                ← Dados estáticos
    constants.ts       ← EXERCISE_LIBRARY com type por exercício
```

---

## 🔄 Workflow GitHub (OBRIGATÓRIO)

### 1. Issues — Toda tarefa começa aqui

**NUNCA** comece a trabalhar sem uma Issue correspondente.

#### Tipos de Issue

| Label | Prefixo | Quando usar |
|---|---|---|
| `type:bug` | `[BUG]` | Comportamento inesperado, crash, regressão |
| `type:feature` | `[FEAT]` | Nova funcionalidade |
| `type:improvement` | `[IMPR]` | Refactor, otimização, melhoria de UX |
| `type:docs` | `[DOCS]` | Documentação, README, comentários |
| `type:security` | `[SEC]` | Vulnerabilidade, hardening |
| `type:chore` | `[CHORE]` | Dependências, configuração, CI/CD |

#### Template de Issue

```markdown
## Descrição
[Contexto claro do problema ou necessidade]

## Critérios de Aceitação
- [ ] Critério 1
- [ ] Critério 2
- [ ] Critério 3

## Contexto Técnico
[Links para código relevante, decisões arquiteturais, dependências]

## Screenshots / Mockups
[Se aplicável]

## Relacionado
Closes #[outra issue] | Blocks #[outra issue] | Part of #[epic]
```

#### Labels Obrigatórias

```
priority:critical    ← Bloqueia deploy, dados em risco
priority:high        ← Deve ser feito esta sprint
priority:medium      ← Backlog normal
priority:low         ← Nice to have

status:todo          ← Ainda não iniciado
status:in-progress   ← Alguém está a trabalhar
status:review        ← PR aberto, aguarda review
status:done          ← Mergeado na main

area:ui              ← Interface / UX
area:backend         ← API / Banco de dados
area:ai              ← AI Coach / ML
area:injury          ← Injury Prediction
area:recovery        ← Recovery Tracking
area:gamification    ← XP / Rewards
area:infrastructure  ← DevOps / CI/CD / Observability
area:mobile          ← Capacitor / PWA / Mobile-specific
```

### 2. Pull Requests — Todo código passa por PR

**NUNCA** faças push direto para `main`.

#### Regras de PR

| Regra | Descrição |
|---|---|
| **Branch naming** | `feat/123-nome-curto`, `fix/456-descricao`, `impr/789-refactor` |
| **Título** | `[#123] type: Descrição clara do que muda` |
| **Descrição** | Deve conter: motivação, o que mudou, como testar, screenshots se UI |
| **Issue link** | `Closes #123` obrigatório no corpo do PR |
| **Review** | Mínimo 1 aprovação (mesmo que sejas só tu, usa self-review checklist) |
| **CI pass** | Build, lint, testes, type-check devem passar antes de merge |
| **Squash merge** | Sempre squash para manter histórico limpo |

#### Template de PR

```markdown
## [#123] type: Título descritivo

### Motivação
[Por que esta mudança é necessária]

### O que mudou
- [ ] Alteração 1
- [ ] Alteração 2

### Como testar
1. Passo 1
2. Passo 2
3. Verificar resultado X

### Screenshots
[Se UI mudou]

### Checklist
- [ ] Build passa (`npm run build`)
- [ ] Testes passam (`npm run test`)
- [ ] Lint passa (`npm run lint`)
- [ ] TypeScript strict (`npx tsc --noEmit`)
- [ ] Issue referenciada (`Closes #123`)
```

### 3. Commits — Conventional Commits

```
<type>(<scope>): <descrição curta>

[corpo opcional com detalhes]

[footer com refs: Closes #123, BREAKING CHANGE: etc.]
```

**Tipos:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`

**Scopes:** `ui`, `injury`, `recovery`, `workout`, `ai`, `auth`, `api`, `deps`, `config`

**Exemplos:**
```
feat(injury): adicionar recovery score ao ACWR calculation
fix(ui): corrigir touch target no SorenessMap para iOS
refactor(workout): migrar SetRow para discriminated union types
deps: atualizar @anthropic-ai/sdk para v0.90.0
```

### 4. Deploy — Fluxo Controlado

```
[feature branch] → PR → Review → Merge to main → CI/CD → Staging → QA → Production
```

| Ambiente | Trigger | URL |
|---|---|---|
| **Local** | `npm run dev` | `https://localhost:5173` |
| **Preview (Vercel)** | Cada PR | `https://fittrack-git-feat-123-jucimar.vercel.app` |
| **Staging** | Merge na main | `https://staging.fittrack.app` |
| **Production** | Tag release | `https://fittrack.app` |

---

## 🎨 Motion Design Principles (OBRIGATÓRIO em toda UI)

> Baseado em principles de Kyle Zantos e best practices de motion design para interfaces fitness.

### 1. Skeleton Loading — Todo carregamento precisa de placeholder

**REGRA:** Nunca mostrar ecrã em branco ou spinner genérico. Usar skeletons que mimetam a estrutura do conteúdo final.

```tsx
// ✅ CORRETO
<Skeleton className="h-4 w-3/4 rounded" />   // Linha de texto
<Skeleton className="h-32 w-full rounded-lg" /> // Card

// ❌ ERRADO
<div>Loading...</div>
<Spinner /> // só em ações específicas, nunca em page load
```

**Duração:** 200-400ms fade-in quando dados chegam.

### 2. Lazy Loading — Componentes pesados só carregam quando necessários

```tsx
// ✅ CORRETO
const InjuryRiskPanel = lazy(() => import('./components/injury/InjuryRiskPanel'));
const ThreeDAnatomy = lazy(() => import('./components/3d/ThreeDAnatomy'));

<Suspense fallback={<Skeleton height="400px" />}>
  <InjuryRiskPanel />
</Suspense>
```

### 3. Smooth Entrance Animations — Tudo entra com propósito

**Princípios:**
- **Stagger:** Elementos entram sequencialmente (delay 50-100ms entre cada)
- **Direction:** Conteúdo entra da direção do scroll (baixo → cima em scroll down)
- **Easing:** Usar `cubic-bezier(0.4, 0, 0.2, 1)` (ease-out) para entrances
- **Duration:** 300-500ms para elementos, 600-800ms para páginas

```tsx
// ✅ CORRETO — Framer Motion
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
>
  {content}
</motion.div>

// Stagger children
<motion.div variants={containerVariants} initial="hidden" animate="visible">
  {items.map((item, i) => (
    <motion.div key={i} variants={itemVariants}>
      {item}
    </motion.div>
  ))}
</motion.div>

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } }
};
```

### 4. Exit Animations — Elementos saem tão suavemente como entram

```tsx
<AnimatePresence mode="wait">
  {showPanel && (
    <motion.div
      key="panel"
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      transition={{ duration: 0.3 }}
    >
      <InjuryRiskPanel />
    </motion.div>
  )}
</AnimatePresence>
```

### 5. Progress Indicators — Feedback contínuo em ações longas

```tsx
// ✅ CORRETO — Progresso determinado
<motion.div
  className="progress-bar"
  initial={{ width: 0 }}
  animate={{ width: `${progress}%` }}
  transition={{ duration: 0.5, ease: "easeOut" }}
/>

// ✅ CORRETO — Micro-interaction em botão
<motion.button
  whileTap={{ scale: 0.97 }}
  whileHover={{ scale: 1.02 }}
  transition={{ type: "spring", stiffness: 400, damping: 17 }}
>
  Iniciar Treino
</motion.button>
```

### 6. Page Transitions — Navegação fluida entre ecrãs

```tsx
// No router/App.tsx
<AnimatePresence mode="wait">
  <motion.div
    key={currentView}
    initial={{ opacity: 0, x: direction > 0 ? 100 : -100 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: direction > 0 ? -100 : 100 }}
    transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
  >
    <CurrentScreen />
  </motion.div>
</AnimatePresence>
```

### 7. Scroll-triggered Animations — Conteúdo revela-se no scroll

```tsx
// ✅ CORRETO
const { ref, inView } = useInView({ threshold: 0.2, triggerOnce: true });

<motion.div
  ref={ref}
  initial={{ opacity: 0, y: 30 }}
  animate={inView ? { opacity: 1, y: 0 } : {}}
  transition={{ duration: 0.5 }}
>
  {content}
</motion.div>
```

### 8. Reduced Motion — Respeitar preferências de acessibilidade

```tsx
const prefersReducedMotion = usePrefersReducedMotion();

<motion.div
  initial={prefersReducedMotion ? false : { opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.4 }}
>
```

---

## 📊 Observabilidade (OBRIGATÓRIO)

### Stack de Observabilidade

| Ferramenta | Propósito | Status |
|---|---|---|
| **Sentry** | Error tracking, performance monitoring, session replay | ✅ Configurado (`@sentry/react`) |
| **PostHog** | Product analytics, funnels, feature flags | ✅ Configurado (`posthog-js`) |
| **OpenTelemetry** | Distributed tracing, métricas customizadas | 🔄 A implementar |
| **Datadog RUM** | Real User Monitoring (alternativa ao PostHog) | 🔄 Futuro |

### Instrumentação Obrigatória

#### 1. Error Boundaries com Tracing

```tsx
// src/components/ErrorBoundary.tsx
import * as Sentry from '@sentry/react';
import { createErrorBoundarySpan } from '../utils/telemetry';

export class FitTrackErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Sentry
    Sentry.captureException(error, { extra: errorInfo });
    
    // OpenTelemetry span
    const span = createErrorBoundarySpan(error, errorInfo);
    span.end();
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback onReport={() => Sentry.showReportDialog()} />;
    }
    return this.props.children;
  }
}
```

#### 2. Performance Tracking — Core Web Vitals

```tsx
// src/utils/telemetry.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

export function reportWebVitals(metric: any) {
  // Enviar para PostHog
  posthog.capture('web_vital', {
    name: metric.name,
    value: metric.value,
    rating: metric.rating, // 'good' | 'needs-improvement' | 'poor'
  });
  
  // Enviar para Sentry
  Sentry.addBreadcrumb({
    category: 'web-vitals',
    message: `${metric.name}: ${metric.value}`,
    level: metric.rating === 'poor' ? 'warning' : 'info',
  });
}

// No main.tsx
getCLS(reportWebVitals);
getFID(reportWebVitals);
getFCP(reportWebVitals);
getLCP(reportWebVitals);
getTTFB(reportWebVitals);
```

#### 3. Custom Tracing — AI Coach, Injury Prediction

```tsx
// Exemplo: tracing do Injury Prediction Engine
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('fittrack-injury');

export function runInjuryPrediction(input: InjuryEngineInput) {
  return tracer.startActiveSpan('injury.predict', async (span) => {
    span.setAttribute('user.bodyweight', input.userBodyweight);
    span.setAttribute('workout.count', input.workoutHistory.length);
    
    try {
      const result = await calculateRisk(input);
      span.setAttribute('risk.level', result.overallRisk);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      throw error;
    } finally {
      span.end();
    }
  });
}
```

#### 4. Feature Usage Analytics

```tsx
// Toda ação significativa deve ser tracked
posthog.capture('workout_started', {
  workout_type: plan.type,
  exercise_count: plan.exercises.length,
  injury_risk: report.overallRisk,
});

posthog.capture('recovery_submitted', {
  sleep_hours: data.sleepHours,
  sleep_quality: data.sleepQuality,
  soreness_regions: Object.keys(data.muscleSoreness).length,
  recovery_score: score,
});

posthog.capture('injury_warning_shown', {
  risk_level: report.overallRisk,
  flagged_regions: report.flaggedRegions.length,
  modifications_suggested: report.suggestedModifications.length,
});
```

---

## 🧪 Qualidade de Código (OBRIGATÓRIO)

### Stack de Qualidade

| Ferramenta | Propósito | Comando |
|---|---|---|
| **ESLint** + `typescript-eslint` | Linting TypeScript/React | `npm run lint` |
| **Biome** (futuro) | Lint + Format ultra-rápido | `npx biome check` |
| **Commitlint** | Validação de mensagens de commit | `commit-msg` hook |
| **Knip** | Deteção de código morto | `npx knip` |
| **Stryker** | Mutation testing | `npx stryker run` |
| **Vitest** | Testes unitários + integração | `npm run test` |
| **Playwright** | Testes E2E | `npm run test:e2e` |
| **Codecov** | Coverage reporting | CI/CD |
| **TypeScript Strict** | Type-checking máximo | `npx tsc --noEmit` |

### Regras de TypeScript (Strict Mode)

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Regras de Linting (ESLint)

```javascript
// eslint.config.js
export default [
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    }
  }
];
```

### Coverage Mínimo

| Tipo | Threshold |
|---|---|
| Linhas | ≥ 80% |
| Funções | ≥ 85% |
| Branches | ≥ 75% |
| Statements | ≥ 80% |

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npm run test:coverage
      - run: npm run build
      - run: npx knip
      - uses: codecov/codecov-action@v4
```

---

## 🗄️ Convenções de Código

### Nomenclatura

| Tipo | Convenção | Exemplo |
|---|---|---|
| Componentes React | PascalCase | `InjuryRiskPanel.tsx` |
| Hooks custom | camelCase com prefixo `use` | `useInjuryStore.ts` |
| Stores Zustand | camelCase com prefixo `use` | `useWorkoutStore.ts` |
| Utils/Helpers | camelCase | `xpCalculator.ts` |
| Tipos/Interfaces | PascalCase com sufixo descritivo | `InjuryRiskReport`, `RecoveryInput` |
| Constants | UPPER_SNAKE_CASE | `EXERCISE_REGION_MAP` |
| Enums | PascalCase | `BodyRegion`, `RiskLevel` |

### Zod Schemas — SEMPRE discriminated union

```typescript
// ✅ CORRETO
const WeightedSetSchema = z.object({
  type: z.literal('weighted'),
  reps: z.number(),
  weight: z.number(),
});

const BodyweightSetSchema = z.object({
  type: z.literal('bodyweight'),
  reps: z.number(),
  addedWeight: z.number().optional(),
});

export const SetSchema = z.discriminatedUnion('type', [
  WeightedSetSchema,
  BodyweightSetSchema,
  // ...
]);

// ❌ ERRADO — nunca object genérico com tudo optional
const SetSchema = z.object({
  reps: z.number().optional(),
  weight: z.number().optional(),
  // ... tudo optional = dados inválidos passam
});
```

### Stores Zustand — SEMPRE com TypeScript

```typescript
// ✅ CORRETO
interface InjuryState {
  lastReport: InjuryRiskReport | null;
  generateReport: (history: WorkoutSession[], bodyweight: number) => InjuryRiskReport;
}

export const useInjuryStore = create<InjuryState>((set, get) => ({
  // ...
}));

// ❌ ERRADO — sem tipos
export const useInjuryStore = create((set, get) => ({
  // ... any everywhere
}));
```

---

## 📱 Mobile-First Constraints

| Constraint | Valor | Porquê |
|---|---|---|
| Touch target mínimo | 44×44px | Apple HIG / Android Material |
| Font size mínimo | 16px | Evitar zoom automático em inputs |
| Viewport | `width=device-width, initial-scale=1` | Responsive base |
| Safe areas | `env(safe-area-inset-*)` | iPhone notch / Dynamic Island |
| Scroll | `-webkit-overflow-scrolling: touch` | Momentum scroll iOS |
| Select | `user-select: none` em UI elements | Evitar seleção acidental |
| Tap highlight | `-webkit-tap-highlight-color: transparent` | Feedback customizado |

---

## 🚨 Checklist Pré-Deploy (OBRIGATÓRIO)

Antes de qualquer merge para `main`:

- [ ] Issue criada e referenciada no PR (`Closes #123`)
- [ ] Código segue conventional commits
- [ ] Build passa (`npm run build`)
- [ ] TypeScript strict passa (`npx tsc --noEmit`)
- [ ] Lint passa (`npm run lint`)
- [ ] Testes unitários passam (`npm run test`)
- [ ] Testes E2E passam (`npm run test:e2e`)
- [ ] Coverage não desceu (Codecov report)
- [ ] Knip não detetou código morto novo
- [ ] Sentry não tem novos erros no preview deploy
- [ ] PostHog events estão a chegar (verificar em realtime)
- [ ] PWA manifest válido (Chrome DevTools → Application)
- [ ] Lighthouse score ≥ 90 (Performance, Accessibility, Best Practices)
- [ ] Mobile testado (iOS Safari + Android Chrome)
- [ ] Reduced motion testado (Settings → Accessibility)

---

## 📞 Quando Pedir Ajuda

Se encontrares algo que quebra estas regras ou não está documentado:

1. Cria uma Issue com label `type:docs` ou `type:improvement`
2. Menciona `@JucimarPatmarlove` no PR
3. Atualiza este ficheiro (`AGENTS.md`) com a nova convenção

---

*Este documento é vivo. Atualiza-o sempre que novas convenções emergirem ou ferramentas mudarem.*
