import React, { useState, useEffect, useMemo } from 'react';
import { getTodayDateString } from '../services/nutritionEngine';
import { useDualWorkoutStore } from '../stores/useDualWorkoutStore';
import { useHealthStore } from '../stores/useHealthStore';
import { useInjuryStore } from '../stores/useInjuryStore';
import { useNutritionStore } from '../stores/useNutritionStore';
import { usePlanStore } from '../stores/usePlanStore';
import { useProactiveCoachStore } from '../stores/useProactiveCoachStore';

export function useDashboardData(history: any[] = []) {
  const {
    profile,
    meals,
    hydration,
    weightHistory,
    currentDate,
    addWater,
    setWeight,
    loadNutritionData,
    loadAllWeightLogs,
    setCurrentDate,
  } = useNutritionStore();
  const { getWorkoutsForDate, getNextWorkout } = useDualWorkoutStore();
  const { currentPlan } = usePlanStore();
  const [quickWeight, setQuickWeight] = useState(profile?.weight?.toString() || '75');
  const [showP2P, setShowP2P] = useState(false);

  // ── HealthKit Sync (Telemetria Biológica) ──
  const {
    healthKitData,
    dailyAdjustment,
    isSyncing: isHealthSyncing,
    syncHealthKit,
  } = useHealthStore();

  const { lastReport, generateReport } = useInjuryStore();
  const urgentMessages = useProactiveCoachStore((s) => s.getUrgentMessages());

  useEffect(() => {
    if (history && profile) {
      generateReport(history, profile.weight || 75);
    }
  }, [history, profile, generateReport]);

  // Carregar dados no mount
  useEffect(() => {
    const today = getTodayDateString();
    setCurrentDate(today);
    loadNutritionData(today);
    loadAllWeightLogs();
  }, [loadNutritionData, loadAllWeightLogs, setCurrentDate]);

  // ── HealthKit: Sincronizar dados biométricos ao carregar o Dashboard ──
  useEffect(() => {
    syncHealthKit(history, meals, profile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calorias gastas: usar dados reais do dia (treinos registados) ou fallback
  const todayWorkoutsList = history.filter(
    (w: any) => w.date === currentDate || w.startTime?.startsWith(currentDate),
  );
  const caloriesBurned =
    todayWorkoutsList.length > 0
      ? todayWorkoutsList.reduce(
          (sum: number, w: any) => sum + (w.totalCalories || w.caloriesBurned || 0),
          0,
        )
      : 0;

  const todayMealLog = meals.find((m: any) => m.date === currentDate);
  let caloriesConsumed = 0,
    proteinsConsumed = 0,
    carbsConsumed = 0,
    fatsConsumed = 0;

  if (todayMealLog) {
    const allMealItems = [
      ...todayMealLog.breakfast,
      ...todayMealLog.lunch,
      ...todayMealLog.snack,
      ...todayMealLog.dinner,
    ];
    caloriesConsumed = allMealItems.reduce((sum: number, item: any) => sum + item.calories, 0);
    proteinsConsumed = allMealItems.reduce((sum: number, item: any) => sum + item.protein, 0);
    carbsConsumed = allMealItems.reduce((sum: number, item: any) => sum + item.carb, 0);
    fatsConsumed = allMealItems.reduce((sum: number, item: any) => sum + item.fat, 0);
  }

  const targetCal = profile?.targetCalories || 2300;
  const remainingCalories = Math.max(0, targetCal - caloriesConsumed + caloriesBurned);
  const calorieProgressPercent = Math.min(100, Math.round((caloriesConsumed / targetCal) * 100));

  const todayWater = hydration.find((h: any) => h.date === currentDate)?.mlConsumed || 0;
  const waterTarget = 2500;
  const waterProgressPercent = Math.min(100, Math.round((todayWater / waterTarget) * 100));

  const handleWeightSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number.parseFloat(quickWeight);
    if (!isNaN(parsed) && parsed > 0) setWeight(parsed);
  };

  // Detetar se o sistema está vazio (primeiro uso / após factory reset)
  const isSystemEmpty = !todayMealLog && weightHistory.length === 0 && history.length === 0;

  // Extrair o próximo treino planeado (inclui dívidas do passado)
  const nextWorkout = getNextWorkout();
  const plannedWorkoutToday = useMemo(() => {
    if (nextWorkout && !nextWorkout.completed) {
      const wDate = new Date(nextWorkout.date);
      const today = new Date();
      wDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      const isPast = wDate < today;

      return {
        title: nextWorkout.workoutName + (isPast ? ' (Em atraso)' : ''),
        period: nextWorkout.slot === 'morning' ? ('Manhã' as const) : ('Tarde' as const),
        slot: nextWorkout.slot as 'morning' | 'afternoon',
        id: nextWorkout.id,
        date: nextWorkout.date,
      };
    }
    return null;
  }, [nextWorkout]);

  // Gráfico de calorias: dados reais dos últimos 7 dias (sem mock random)
  const chartDataCal = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateString = d.toISOString().split('T')[0] || '';
      const label = dateString.split('-').slice(1).reverse().join('/');
      const dayLog = meals.find((m: any) => m.date === dateString);
      let dayCal = 0,
        dayBurned = 0;
      if (dayLog) {
        const items = [...dayLog.breakfast, ...dayLog.lunch, ...dayLog.snack, ...dayLog.dinner];
        dayCal = items.reduce((s: number, it: any) => s + it.calories, 0);
      }
      // Calorias queimadas: usar histórico de treinos se disponível
      const dayWorkouts = history.filter(
        (w: any) => w.date === dateString || w.startTime?.startsWith(dateString),
      );
      if (dayWorkouts.length > 0) {
        dayBurned = dayWorkouts.reduce(
          (s: number, w: any) => s + (w.totalCalories || w.caloriesBurned || 0),
          0,
        );
      }
      return { name: label, Consumidas: dayCal, Gastas: dayBurned };
    });
  }, [meals, history]);

  const chartDataWeight =
    weightHistory.length === 0
      ? [{ name: 'Hoje', peso: profile?.weight }]
      : [...weightHistory]
          .sort((a: any, b: any) => a.date.localeCompare(b.date))
          .slice(-7)
          .map((w: any) => ({
            name: w.date.split('-').slice(1).reverse().join('/'),
            peso: w.weight,
          }));

  // Calcular ACWR (Acute: 7 dias / Chronic: 28 dias)
  const acwr = useMemo(() => {
    if (!history || history.length === 0) return 1.0;

    const now = Date.now();
    const msInDay = 24 * 60 * 60 * 1000;

    let acuteLoad = 0;
    let chronicLoad = 0;

    history.forEach((w) => {
      const daysAgo = (now - new Date(w.date).getTime()) / msInDay;
      // Carga = Calorias (ou tempo). Usando calorias ou fallback para 300
      const load = w.totalCalories || w.caloriesBurned || 300;

      if (daysAgo <= 7) acuteLoad += load;
      if (daysAgo <= 28) chronicLoad += load;
    });

    const chronicWeekly = chronicLoad / 4;
    if (chronicWeekly === 0) return acuteLoad > 0 ? 1.5 : 1.0;

    return acuteLoad / chronicWeekly;
  }, [history]);

  return {
    showP2P,
    setShowP2P,
    isSystemEmpty,
    lastReport,
    urgentMessages,
    plannedWorkoutToday,
    getWorkoutsForDate,
    currentPlan,
    healthKitData,
    dailyAdjustment,
    isHealthSyncing,
    remainingCalories,
    calorieProgressPercent,
    caloriesConsumed,
    targetCal,
    caloriesBurned,
    proteinsConsumed,
    profile,
    carbsConsumed,
    fatsConsumed,
    todayWater,
    waterTarget,
    waterProgressPercent,
    addWater,
    handleWeightSubmit,
    quickWeight,
    setQuickWeight,
    chartDataCal,
    chartDataWeight,
    acwr,
  };
}
