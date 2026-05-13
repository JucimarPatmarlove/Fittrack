export interface GhostSetRecord {
  id: string;
  exerciseId: string;
  date: string; // ISO
  bestVolume: number; // kg * reps
  bestWeight: number;
  bestReps: number;
  defeated: boolean; // se bateu o recorde
  xpGained: number;
}

export interface DailyGhostStats {
  date: string;
  attempts: number;
  failures: number; // máx 1 por dia
  totalXPGained: number;
}
