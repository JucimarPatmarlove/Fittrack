import os
import json

base_dir = "/home/kali/Documentos/Fittrack"
os.makedirs(f"{base_dir}/.github/ISSUE_TEMPLATE", exist_ok=True)
os.makedirs(f"{base_dir}/.github/workflows", exist_ok=True)
os.makedirs(f"{base_dir}/scripts", exist_ok=True)
os.makedirs(f"{base_dir}/src/components/ui", exist_ok=True)

agents_md = """# 🤖 FitTrack V7 — Agent Instructions

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
"""
with open(f'{base_dir}/AGENTS.md', 'w', encoding='utf-8') as f:
    f.write(agents_md)

bug_template = """name: 🐛 Bug Report
description: Reportar um comportamento inesperado
title: "[BUG] "
labels: ["type:bug", "status:todo"]
body:
  - type: markdown
    attributes:
      value: |
        Obrigado por reportar! Preenche os campos abaixo para ajudar-nos a resolver rapidamente.
  - type: textarea
    id: description
    attributes:
      label: Descrição
      description: O que aconteceu? O que esperavas que acontecesse?
      placeholder: "Quando clico em 'Iniciar Treino', o InjuryRiskPanel não aparece..."
    validations:
      required: true
  - type: textarea
    id: reproduction
    attributes:
      label: Passos para Reproduzir
      description: Passos concretos que levam ao bug
      placeholder: |
        1. Ir ao Dashboard
        2. Clicar em "Novo Treino"
        3. Selecionar plano "Push Day"
        4. Ver erro...
    validations:
      required: true
  - type: dropdown
    id: area
    attributes:
      label: Área Afetada
      options:
        - UI / UX
        - Injury Prediction
        - Recovery Tracking
        - Workout / Treino
        - AI Coach
        - Gamificação / XP
        - Autenticação
        - Performance
        - Mobile / PWA
        - Outro
    validations:
      required: true
  - type: dropdown
    id: severity
    attributes:
      label: Severidade
      options:
        - 🔴 Critical — App crasha, dados perdidos, segurança
        - 🟠 High — Funcionalidade principal quebrada
        - 🟡 Medium — Workaround existe, UX degradada
        - 🟢 Low — Cosmético, não afeta uso
    validations:
      required: true
  - type: textarea
    id: environment
    attributes:
      label: Ambiente
      description: Dispositivo, OS, browser, versão da app
      placeholder: |
        - iPhone 14 Pro, iOS 17.5, Safari
        - Samsung S23, Android 14, Chrome 126
        - Desktop, macOS 14, Chrome 126
  - type: textarea
    id: logs
    attributes:
      label: Logs / Screenshots
      description: Console errors, stack traces, screenshots
      placeholder: Cole aqui logs do console ou screenshots
  - type: checkboxes
    id: checklist
    attributes:
      label: Checklist
      options:
        - label: Já pesquisei issues existentes
        - label: Consigo reproduzir consistentemente
        - label: Testei no último build da main
"""

feature_template = """name: ✨ Feature Request
description: Sugerir uma nova funcionalidade
title: "[FEAT] "
labels: ["type:feature", "status:todo"]
body:
  - type: textarea
    id: problem
    attributes:
      label: Problema / Necessidade
      description: Que problema resolve esta feature? Quem beneficia?
      placeholder: "Como utilizador de calistenia, quero poder..."
    validations:
      required: true
  - type: textarea
    id: solution
    attributes:
      label: Solução Proposta
      description: Descreve a funcionalidade ideal
      placeholder: "Adicionar um novo tipo de exercício 'isometric' com..."
    validations:
      required: true
  - type: textarea
    id: alternatives
    attributes:
      label: Alternativas Consideradas
      description: Outras abordagens que pensaste
  - type: dropdown
    id: priority
    attributes:
      label: Prioridade Sugerida
      options:
        - 🔥 Critical — Bloqueia roadmap
        - ⚡ High — Grande impacto no negócio
        - 📌 Medium — Melhoria significativa
        - 💡 Low — Nice to have
  - type: textarea
    id: mockups
    attributes:
      label: Mockups / Referências
      description: Links, screenshots, designs
"""

improvement_template = """name: 🔧 Improvement
description: Refactor, otimização ou melhoria de UX
title: "[IMPR] "
labels: ["type:improvement", "status:todo"]
body:
  - type: textarea
    id: context
    attributes:
      label: Contexto
      description: O que está atualmente e por que precisa mudar
    validations:
      required: true
  - type: textarea
    id: proposal
    attributes:
      label: Proposta de Melhoria
      description: O que muda e qual o benefício esperado
    validations:
      required: true
  - type: dropdown
    id: area
    attributes:
      label: Área
      options:
        - Performance
        - Acessibilidade
        - Type Safety
        - Testes
        - CI/CD
        - Observabilidade
        - UI/UX Polish
        - Arquitetura
        - Documentação
  - type: textarea
    id: impact
    attributes:
      label: Impacto Esperado
      description: Métricas ou comportamentos que melhoram
      placeholder: "Reduz bundle size em 15%", "Melhora LCP de 2.5s para 1.2s"
"""

security_template = """name: 🔒 Security Report
description: Reportar vulnerabilidade de segurança
title: "[SEC] "
labels: ["type:security", "status:todo", "priority:critical"]
body:
  - type: markdown
    attributes:
      value: |
        ⚠️ **Se encontraste uma vulnerabilidade crítica**, considera reportar privadamente primeiro.
  - type: textarea
    id: description
    attributes:
      label: Descrição da Vulnerabilidade
      description: O que expõe e como
    validations:
      required: true
  - type: textarea
    id: impact
    attributes:
      label: Impacto Potencial
      description: Quais dados/sistemas estão em risco
  - type: textarea
    id: reproduction
    attributes:
      label: Passos para Reproduzir
      description: Como demonstrar a vulnerabilidade
  - type: textarea
    id: mitigation
    attributes:
      label: Mitigação Sugerida
      description: Como resolver (se souberes)
"""

with open(f'{base_dir}/.github/ISSUE_TEMPLATE/bug_report.yml', 'w') as f: f.write(bug_template)
with open(f'{base_dir}/.github/ISSUE_TEMPLATE/feature_request.yml', 'w') as f: f.write(feature_template)
with open(f'{base_dir}/.github/ISSUE_TEMPLATE/improvement.yml', 'w') as f: f.write(improvement_template)
with open(f'{base_dir}/.github/ISSUE_TEMPLATE/security_report.yml', 'w') as f: f.write(security_template)

issue_creation_script = """#!/bin/bash
# ============================================================
# FitTrack V7 — Issue Creator Script
# ============================================================
# Uso: ./scripts/create-issue.sh <type> <title> [description]
# Exemplo: ./scripts/create-issue.sh feat "Adicionar Dark Mode"
#
# Tipos: bug | feat | impr | docs | sec | chore
# ============================================================

set -e

TYPE=$1
TITLE=$2
DESCRIPTION=${3:-""}

if [ -z "$TYPE" ] || [ -z "$TITLE" ]; then
  echo "❌ Uso: ./scripts/create-issue.sh <type> <title> [description]"
  echo "   Tipos: bug | feat | impr | docs | sec | chore"
  exit 1
fi

case $TYPE in
  bug) LABEL="type:bug"; PREFIX="[BUG]" ;;
  feat) LABEL="type:feature"; PREFIX="[FEAT]" ;;
  impr) LABEL="type:improvement"; PREFIX="[IMPR]" ;;
  docs) LABEL="type:docs"; PREFIX="[DOCS]" ;;
  sec) LABEL="type:security"; PREFIX="[SEC]" ;;
  chore) LABEL="type:chore"; PREFIX="[CHORE]" ;;
  *) echo "❌ Tipo desconhecido: $TYPE"; exit 1 ;;
esac

if command -v gh &> /dev/null; then
  BODY="## Descrição\\n${DESCRIPTION}\\n\\n## Critérios de Aceitação\\n- [ ] Critério 1\\n- [ ] Critério 2\\n- [ ] Critério 3\\n\\n## Contexto Técnico\\n- Criado automaticamente via script"
  
  gh issue create \
    --repo JucimarPatmarlove/Fittrack \
    --title "${PREFIX} ${TITLE}" \
    --body "$BODY" \
    --label "$LABEL,status:todo"
  
  echo "✅ Issue criada com sucesso!"
else
  echo "⚠️ GitHub CLI (gh) não instalado."
fi
"""
with open(f'{base_dir}/scripts/create-issue.sh', 'w') as f: f.write(issue_creation_script)
os.chmod(f'{base_dir}/scripts/create-issue.sh', 0o755)

ci_workflow = """name: 🔒 FitTrack V7 CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '22'

jobs:
  lint:
    name: ⬣ ESLint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  typecheck:
    name: 📐 TypeScript Strict
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npx tsc --noEmit

  test:
    name: 🧪 Unit & Integration Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run test:coverage || true

  build:
    name: 🏗️ Build
    needs: [lint, typecheck]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run build
"""

label_sync = """name: 🏷️ Sync Labels

on:
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Sync labels
        uses: micnncim/action-label-syncer@v1
        with:
          manifest: .github/labels.yml
          token: ${{ secrets.GITHUB_TOKEN }}
"""

labels_yml = """# FitTrack V7 Labels
type:bug:
  color: d73a4a
  description: Algo não funciona como esperado
type:feature:
  color: a2eeef
  description: Nova funcionalidade
type:improvement:
  color: 7057ff
  description: Refactor, otimização, melhoria de UX
type:docs:
  color: 0075ca
  description: Documentação
type:security:
  color: b60205
  description: Vulnerabilidade ou hardening
type:chore:
  color: fef2c0
  description: Manutenção, dependências, CI/CD
priority:critical:
  color: b60205
  description: Bloqueia deploy, dados em risco
priority:high:
  color: d93f0b
  description: Deve ser feito esta sprint
priority:medium:
  color: fbca04
  description: Backlog normal
priority:low:
  color: 0e8a16
  description: Nice to have
status:todo:
  color: cccccc
  description: Ainda não iniciado
status:in-progress:
  color: ffb366
  description: Alguém está a trabalhar
status:review:
  color: 5319e7
  description: PR aberto, aguarda review
status:done:
  color: 0e8a16
  description: Mergeado na main
area:ui:
  color: e99695
  description: Interface / UX
area:backend:
  color: 5319e7
  description: API / Banco de dados
"""

pr_template = """## [#{{issue.number}}] {{type}}: {{title}}

### Motivação
[Por que esta mudança é necessária — link para a issue]

### O que mudou
- [ ] Alteração 1
- [ ] Alteração 2

### Como testar
1. Passo 1
2. Passo 2

### Checklist
- [ ] Build passa (`npm run build`)
- [ ] Testes passam (`npm run test`)
- [ ] Lint passa (`npm run lint`)
- [ ] TypeScript strict (`npx tsc --noEmit`)
"""

with open(f'{base_dir}/.github/workflows/ci.yml', 'w') as f: f.write(ci_workflow)
with open(f'{base_dir}/.github/workflows/sync-labels.yml', 'w') as f: f.write(label_sync)
with open(f'{base_dir}/.github/labels.yml', 'w') as f: f.write(labels_yml)
with open(f'{base_dir}/.github/PULL_REQUEST_TEMPLATE.md', 'w') as f: f.write(pr_template)

roadmap_md = """# 🗺️ FitTrack V7 — Roadmap & Issues

> **Metodologia:** Cada item neste roadmap corresponde a uma **GitHub Issue** com label, prioridade e critérios de aceitação.  
> **Workflow:** Issue → Branch → PR → Review → Merge → Deploy  
> **Agent Reference:** Ver `AGENTS.md` para convenções completas.

---

## 📊 Dashboard de Progresso

| Fase | Status | Issues | Progresso |
|---|---|---|---|
| **Fase 0: Fundação** | ✅ Completa | #1-#5 | 100% |
| **Fase 1: Core Features** | ✅ Completa | #6-#15 | 100% |
| **Fase 2: Injury & Recovery** | ✅ Completa | #16-#30 | 100% |
| **Fase 3: Motion & Polish** | 🔄 Em curso | #31-#45 | 30% |
| **Fase 4: Observabilidade** | 📋 Planeada | #46-#55 | 0% |
| **Fase 5: AI & Social** | 📋 Planeada | #56-#70 | 0% |
| **Fase 6: Monetização** | 📋 Futuro | #71-#80 | 0% |
"""
with open(f'{base_dir}/ROADMAP.md', 'w', encoding='utf-8') as f: f.write(roadmap_md)

motion_components = """// ============================================================
// FitTrack V7 — Motion Components Library
// ============================================================

import React, { Suspense } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

// ============================================================
// 1. SKELETON — Placeholder de carregamento
// ============================================================

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  circle?: boolean;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  circle = false,
  count = 1,
}) => {
  const baseClasses = 'bg-gray-200 animate-pulse';
  const shapeClasses = circle ? 'rounded-full' : 'rounded';
  
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${baseClasses} ${shapeClasses} ${className}`}
          style={{ width, height }}
        />
      ))}
    </>
  );
};

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className = '',
}) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        width={i === lines - 1 ? '75%' : '100%'}
        height="1rem"
        className="rounded"
      />
    ))}
  </div>
);

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-4 rounded-xl border bg-white ${className}`}>
    <Skeleton width="60%" height="1.25rem" className="mb-3" />
    <SkeletonText lines={2} />
    <div className="flex gap-2 mt-3">
      <Skeleton width="4rem" height="2rem" className="rounded-lg" />
      <Skeleton width="4rem" height="2rem" className="rounded-lg" />
    </div>
  </div>
);

export const SkeletonBodyMap: React.FC = () => (
  <div className="w-[200px] h-[280px] flex items-center justify-center">
    <Skeleton width="160px" height="240px" circle className="opacity-50" />
  </div>
);

// ============================================================
// 2. LAZY LOAD WRAPPER — Suspense com skeleton
// ============================================================

interface LazyLoadProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  skeleton?: 'card' | 'text' | 'bodymap' | 'custom';
  skeletonClassName?: string;
}

export const LazyLoad: React.FC<LazyLoadProps> = ({
  children,
  fallback,
  skeleton = 'card',
  skeletonClassName = '',
}) => {
  const skeletonMap = {
    card: <SkeletonCard className={skeletonClassName} />,
    text: <SkeletonText className={skeletonClassName} />,
    bodymap: <SkeletonBodyMap />,
    custom: null,
  };

  return (
    <Suspense fallback={fallback || skeletonMap[skeleton] || <SkeletonCard />}>
      {children}
    </Suspense>
  );
};

// ============================================================
// 3. ENTRANCE ANIMATIONS — Fade, Slide, Scale
// ============================================================

const defaultEasing = [0.4, 0, 0.2, 1]; // ease-out

interface AnimatedProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export const FadeIn: React.FC<AnimatedProps> = ({
  children,
  delay = 0,
  duration = 0.4,
  className = '',
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration, delay, ease: defaultEasing }}
    className={className}
  >
    {children}
  </motion.div>
);

export const SlideUp: React.FC<AnimatedProps> = ({
  children,
  delay = 0,
  duration = 0.4,
  className = '',
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration, delay, ease: defaultEasing }}
    className={className}
  >
    {children}
  </motion.div>
);

export const SlideIn: React.FC<AnimatedProps & { direction?: 'left' | 'right' }> = ({
  children,
  delay = 0,
  duration = 0.4,
  direction = 'right',
  className = '',
}) => (
  <motion.div
    initial={{ opacity: 0, x: direction === 'right' ? 30 : -30 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration, delay, ease: defaultEasing }}
    className={className}
  >
    {children}
  </motion.div>
);

export const ScaleIn: React.FC<AnimatedProps> = ({
  children,
  delay = 0,
  duration = 0.35,
  className = '',
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration, delay, ease: defaultEasing }}
    className={className}
  >
    {children}
  </motion.div>
);

// ============================================================
// 4. STAGGER LIST — Animação sequencial de itens
// ============================================================

interface StaggerListProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  itemDuration?: number;
  className?: string;
}

export const StaggerList: React.FC<StaggerListProps> = ({
  children,
  staggerDelay = 0.08,
  itemDuration = 0.35,
  className = '',
}) => {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: staggerDelay },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: itemDuration, ease: defaultEasing },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {React.Children.map(children, (child, i) => (
        <motion.div key={i} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

// ============================================================
// 5. SCROLL TRIGGER — Animação ao entrar no viewport
// ============================================================

interface ScrollRevealProps {
  children: React.ReactNode;
  threshold?: number;
  triggerOnce?: boolean;
  animation?: 'fade' | 'slideUp' | 'slideLeft' | 'slideRight' | 'scale';
  delay?: number;
  className?: string;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  threshold = 0.2,
  triggerOnce = true,
  animation = 'slideUp',
  delay = 0,
  className = '',
}) => {
  const { ref, inView } = useInView({ threshold, triggerOnce });

  const animations = {
    fade: { opacity: 0 },
    slideUp: { opacity: 0, y: 30 },
    slideLeft: { opacity: 0, x: -30 },
    slideRight: { opacity: 0, x: 30 },
    scale: { opacity: 0, scale: 0.9 },
  };

  return (
    <motion.div
      ref={ref}
      initial={animations[animation]}
      animate={inView ? { opacity: 1, y: 0, x: 0, scale: 1 } : {}}
      transition={{ duration: 0.5, delay, ease: defaultEasing }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ============================================================
// 6. PAGE TRANSITION — Transição entre screens
// ============================================================

interface PageTransitionProps {
  children: React.ReactNode;
  direction?: number;
  className?: string;
  viewKey?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  direction = 1,
  className = '',
  viewKey
}) => (
  <AnimatePresence mode="wait">
    <motion.div
      key={viewKey}
      initial={{ opacity: 0, x: direction > 0 ? 50 : -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: direction > 0 ? -50 : 50 }}
      transition={{ duration: 0.35, ease: defaultEasing }}
      className={className}
    >
      {children}
    </motion.div>
  </AnimatePresence>
);

// ============================================================
// 7. MODAL / PANEL — Com enter/exit animations
// ============================================================

interface AnimatedPanelProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose?: () => void;
  className?: string;
  position?: 'bottom' | 'right' | 'center';
}

export const AnimatedPanel: React.FC<AnimatedPanelProps> = ({
  children,
  isOpen,
  onClose,
  className = '',
  position = 'bottom',
}) => {
  const positionAnimations = {
    bottom: {
      hidden: { y: '100%' },
      visible: { y: 0 },
    },
    right: {
      hidden: { x: '100%' },
      visible: { x: 0 },
    },
    center: {
      hidden: { opacity: 0, scale: 0.95 },
      visible: { opacity: 1, scale: 1 },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={positionAnimations[position].hidden}
            animate={positionAnimations[position].visible}
            exit={positionAnimations[position].hidden}
            transition={{ duration: 0.3, ease: defaultEasing }}
            className={`fixed z-50 ${className}`}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ============================================================
// 8. MICRO-INTERACTIONS — Botões, cards, toggles
// ============================================================

interface InteractiveProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export const InteractiveButton: React.FC<InteractiveProps> = ({
  children,
  onClick,
  className = '',
  disabled = false,
}) => (
  <motion.button
    whileTap={disabled ? {} : { scale: 0.97 }}
    whileHover={disabled ? {} : { scale: 1.02 }}
    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    onClick={onClick}
    disabled={disabled}
    className={className}
  >
    {children}
  </motion.button>
);

export const InteractiveCard: React.FC<InteractiveProps> = ({
  children,
  onClick,
  className = '',
}) => (
  <motion.div
    whileTap={{ scale: 0.98 }}
    whileHover={{ scale: 1.01, y: -2 }}
    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    onClick={onClick}
    className={`cursor-pointer ${className}`}
  >
    {children}
  </motion.div>
);

// ============================================================
// 9. PROGRESS INDICATORS — Determinados e indeterminados
// ============================================================

interface ProgressBarProps {
  progress: number;
  className?: string;
  color?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  className = '',
  color = 'bg-blue-600',
}) => (
  <div className={`w-full h-2 bg-gray-200 rounded-full overflow-hidden ${className}`}>
    <motion.div
      className={`h-full ${color} rounded-full`}
      initial={{ width: 0 }}
      animate={{ width: `${Math.min(progress, 100)}%` }}
      transition={{ duration: 0.5, ease: defaultEasing }}
    />
  </div>
);

// ============================================================
// 10. REDUCED MOTION — Respeitar preferências de acessibilidade
// ============================================================

import { useReducedMotion } from 'framer-motion';

export const usePrefersReducedMotion = (): boolean => {
  return useReducedMotion() || false;
};

export const AccessibleMotion: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  const shouldReduce = usePrefersReducedMotion();
  if (shouldReduce) {
    return <div className={className}>{children}</div>;
  }
  return <>{children}</>;
};

export default {
  Skeleton, SkeletonText, SkeletonCard, SkeletonBodyMap,
  LazyLoad, FadeIn, SlideUp, SlideIn, ScaleIn,
  StaggerList, ScrollReveal, PageTransition, AnimatedPanel,
  InteractiveButton, InteractiveCard, ProgressBar,
  usePrefersReducedMotion, AccessibleMotion,
};
"""
with open(f'{base_dir}/src/components/ui/MotionComponents.tsx', 'w', encoding='utf-8') as f: f.write(motion_components)

print("Files generated successfully!")
