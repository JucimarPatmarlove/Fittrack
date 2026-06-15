// src/utils/dailyAdjustment.ts
// Motor de Ajuste Dinâmico — Análise Interdiária
// Cruza 3 variáveis biométricas (sono × peso × calorias) para recalcular metas diárias.

export interface BiometricContext {
  currentWeight: number;             // Peso atual em kg (RENPHO via HealthKit)
  sleepHours: number;                // Horas de sono da última noite (Apple Watch)
  yesterdayCaloriesBurned: number;    // Calorias gastas ontem (treinos)
  yesterdayCaloriesConsumed: number;  // Calorias consumidas ontem (refeições)
  baselineWeight: number;            // Peso base do perfil (idealmente média 7 dias)
  targetCalories: number;            // Meta calórica padrão do perfil
}

export interface DailyAdjustment {
  suggestedCalories: number;    // Meta calórica recalculada
  workoutType: string;          // Tipo de treino recomendado
  intensityModifier: number;    // Multiplicador de intensidade (0.7 a 1.1)
  sleepInsight: string;         // Nota clínica sobre sono
  weightInsight: string;        // Nota clínica sobre variação de peso
  calorieInsight: string;       // Nota sobre balanço calórico
}

/**
 * Calcula os ajustes diários com base no contexto biométrico.
 * 
 * TABELA DE DECISÃO:
 * ┌──────────────────┬─────────────────┬──────────────────────────────────────────┐
 * │ Variável         │ Threshold       │ Ação                                     │
 * ├──────────────────┼─────────────────┼──────────────────────────────────────────┤
 * │ Sono < 6.5h      │ Fadiga SNC      │ -150 kcal, treino DELOAD / MOBILIDADE    │
 * │ Sono ≥ 8h        │ Superávit neural│ +100 kcal, treino FORÇA MÁXIMA           │
 * │ Peso Δ > 1.2 kg  │ Retenção hídrica│ Cardio regenerativo, -100 kcal           │
 * │ Excesso > 500kcal│ Superávit ontem │ -20% do excesso (máx -300)               │
 * │ Déficit > 500kcal│ Déficit ontem   │ +150 kcal compensação                    │
 * └──────────────────┴─────────────────┴──────────────────────────────────────────┘
 */
export function calculateDailyAdjustments(ctx: BiometricContext): DailyAdjustment {
  let calorieModifier = 0;
  let workoutType = 'TREINO NORMAL';
  let intensityModifier = 1.0;
  let sleepInsight = '';
  let weightInsight = '';
  let calorieInsight = '';

  // ─── 1. ANÁLISE DE SONO (Recuperação do SNC) ────────────────────────────

  if (ctx.sleepHours < 6.5) {
    // Sono restrito → Sensibilidade à insulina alterada + fadiga central acumulada
    calorieModifier -= 150;
    workoutType = 'DELOAD / MOBILIDADE';
    intensityModifier = 0.8;
    sleepInsight = `⚠️ Sono insuficiente (${ctx.sleepHours.toFixed(1)}h). Fadiga do SNC elevada. Meta calórica reduzida e intensidade baixa para proteger articulações.`;
  } else if (ctx.sleepHours >= 8) {
    // Superávit de recuperação neural
    calorieModifier += 100;
    workoutType = 'FORÇA MÁXIMA';
    intensityModifier = 1.1;
    sleepInsight = `✅ Sono excelente (${ctx.sleepHours.toFixed(1)}h). SNC totalmente restaurado. Aproveite o pico hormonal com intensidade máxima.`;
  } else {
    sleepInsight = `🟡 Sono adequado (${ctx.sleepHours.toFixed(1)}h). Recuperação dentro dos padrões.`;
  }

  // ─── 2. ANÁLISE DE PESO (Balanço de Fluidos / Glicogénio) ────────────────

  const weightChange = ctx.currentWeight - ctx.baselineWeight;

  if (Math.abs(weightChange) > 1.2) {
    // Variação > 1.2kg em 24h não é tecido adiposo: é retenção hídrica ou inflamação
    workoutType = 'CARDIO REGENERATIVO';
    intensityModifier = 0.7;
    calorieModifier -= 100;
    const direction = weightChange > 0 ? '+' : '';
    weightInsight = `🌊 Variação brusca de peso (${direction}${weightChange.toFixed(1)}kg). Provável retenção hídrica ou inflamação pós-treino. Cardio leve e boa hidratação recomendados.`;
  } else if (Math.abs(weightChange) > 0.5) {
    weightInsight = `📊 Variação moderada de peso (${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)}kg). Dentro dos padrões fisiológicos.`;
  } else {
    weightInsight = `📊 Peso estável (Δ ${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)}kg). Homeostase mantida.`;
  }

  // ─── 3. AJUSTE DINÂMICO DE CALORIAS (Balanço Interdiário) ────────────────

  const netYesterday = ctx.yesterdayCaloriesConsumed - ctx.yesterdayCaloriesBurned;
  const surplus = netYesterday - ctx.targetCalories;

  if (surplus > 500) {
    // Excesso calórico massivo ontem → Compensação suave (20% do excesso, máx 300)
    const reduction = Math.min(300, Math.round(surplus * 0.2));
    calorieModifier -= reduction;
    calorieInsight = `🍽️ Excedeu ${Math.round(surplus)} kcal ontem. Meta de hoje reduzida em ${reduction} kcal para equilibrar a semana sem quebrar a homeostase.`;
  } else if (surplus < -500) {
    // Déficit excessivo ontem → Compensação para proteger recuperação
    calorieModifier += 150;
    calorieInsight = `🔥 Déficit de ${Math.round(Math.abs(surplus))} kcal ontem. Meta aumentada ligeiramente para proteger a síntese proteica e recuperação muscular.`;
  } else {
    calorieInsight = `⚖️ Balanço calórico equilibrado ontem. Mantenha a consistência.`;
  }

  // ─── CÁLCULO FINAL ──────────────────────────────────────────────────────

  const finalCalories = Math.max(1200, Math.min(3500, Math.round(ctx.targetCalories + calorieModifier)));

  return {
    suggestedCalories: finalCalories,
    workoutType,
    intensityModifier,
    sleepInsight,
    weightInsight,
    calorieInsight,
  };
}
