type Props = { totalVolume: number; duration: number };

export function WorkoutSummaryCard({ totalVolume, duration }: Props) {
  const volumeKg = totalVolume.toLocaleString('pt-PT');
  const mins = Math.floor(duration / 60);
  const secs = duration % 60;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Último Treino</h3>
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/60">
          <p className="text-xs text-zinc-500">Volume Total</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{volumeKg} kg</p>
        </div>

        <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/60">
          <p className="text-xs text-zinc-500">Duração</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {mins}m {secs.toString().padStart(2, '0')}s
          </p>
        </div>
      </div>
    </div>
  );
}
