import { WorkoutSession } from "../db/schema";;

export interface MissedDayInfo {
  date: string;
  dayOfWeek: string;
  wasPlanned: boolean;
}

export function getMissedDays(
  history: WorkoutSession[],
  plannedDays: number[] = [],
  daysToCheck = 7
): MissedDayInfo[] {
  const missed: MissedDayInfo[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const workoutDates = new Set(
    history.map(w => new Date(w.date).toISOString().slice(0, 10))
  );

  for (let i = 1; i <= daysToCheck; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    const dateStr = checkDate.toISOString().slice(0, 10);
    const dayOfWeek = checkDate.getDay();
    const isPlanned = plannedDays.length === 0 || plannedDays.includes(dayOfWeek);
    if (!workoutDates.has(dateStr) && isPlanned) {
      missed.push({
        date: dateStr,
        dayOfWeek: getDayName(dayOfWeek),
        wasPlanned: true,
      });
    }
  }
  return missed;
}

export function getCurrentStreak(history: WorkoutSession[]): number {
  const workoutDates = new Set(
    history.map(w => new Date(w.date).toISOString().slice(0, 10))
  );
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 30; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    const dateStr = checkDate.toISOString().slice(0, 10);
    if (workoutDates.has(dateStr)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function getDayName(day: number): string {
  const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  return days[day];
}
