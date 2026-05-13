export function calculateEPLEY(weight: number, reps: number): number {
  if (weight <= 0 || reps < 1) return 0;
  const repsClamped = Math.min(reps, 30);
  const oneRM = weight * (1 + repsClamped / 30);
  return Math.round(oneRM * 100) / 100;
}
