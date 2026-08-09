export const DISCS = [25, 20, 15, 10, 5, 2.5, 1.25] as const;
export type DiscKg = (typeof DISCS)[number];

export const DISC_COLORS: Record<DiscKg, string> = {
  25: '#e84a4a', // vermelho
  20: '#4a9ee8', // azul
  15: '#e8c84a', // amarelo (gold)
  10: '#4ae87a', // verde
  5: '#f0ede8', // branco
  2.5: '#222222', // preto
  1.25: '#888888', // cinza
};

export interface PlateResult {
  disc: DiscKg;
  quantityPerSide: number;
  color: string;
}

export function calculatePlates(totalKg: number, barKg = 20): PlateResult[] | { error: string } {
  const weightPerSide = (totalKg - barKg) / 2;

  if (weightPerSide < 1.25) {
    return { error: `Mínimo: ${barKg + 2.5}kg (barra + 2×1.25kg)` };
  }

  let remaining = weightPerSide;
  const result: PlateResult[] = [];

  for (const disc of DISCS) {
    const count = Math.floor(remaining / disc);
    if (count > 0) {
      result.push({
        disc,
        quantityPerSide: count,
        color: DISC_COLORS[disc],
      });
      remaining = Number((remaining - count * disc).toFixed(2));
    }
  }

  if (remaining > 0.01) {
    return {
      error: `Não é possível combinar exactamente. Sobram ${remaining}kg por lado. Experimente um peso múltiplo de 2.5kg.`,
    };
  }

  return result;
}
