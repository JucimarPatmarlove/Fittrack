export function calculate1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps < 1) return 0;
  const oneRM = weight * (1 + reps / 30);
  return Math.round(oneRM * 10) / 10;
}