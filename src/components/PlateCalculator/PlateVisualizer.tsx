// @ts-nocheck
import { motion } from 'framer-motion';
import type { PlateResult } from '../../utils/plateCalculator';

interface Props {
  plates: PlateResult[];
  barWeight: number;
}

const BAR_WIDTH = 200;
const BAR_HEIGHT = 12;
const DISC_WIDTH = 20;
const DISC_MAX_RADIUS = 22;

export function PlateVisualizer({ plates, barWeight }: Props) {
  // Ordena do maior para o menor (aparência real)
  const sorted = [...plates].sort((a, b) => b.disc - a.disc);

  // Calcula posições X acumuladas (da ponta para o centro)
  let currentX = BAR_WIDTH / 2;
  const discElements: JSX.Element[] = [];

  for (const plate of sorted) {
    for (let i = 0; i < plate.quantityPerSide; i++) {
      const radius = 10 + (plate.disc / 25) * 12; // quanto maior o disco, maior o raio
      const y = BAR_HEIGHT / 2;
      discElements.push(
        <motion.rect
          key={`${plate.disc}-${i}`}
          x={currentX}
          y={y - radius}
          width={DISC_WIDTH}
          height={radius * 2}
          rx={4}
          fill={plate.color}
          stroke="#222"
          strokeWidth={1}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.2, delay: i * 0.03 }}
        />,
      );
      currentX += DISC_WIDTH;
    }
  }

  // Espelha para o outro lado
  const mirror = discElements.map((el, idx) => {
    const originalX = Number.parseFloat(el.props.x);
    const mirroredX = BAR_WIDTH - originalX - DISC_WIDTH;
    return (
      <rect
        key={`mirror-${idx}`}
        x={mirroredX}
        y={el.props.y}
        width={DISC_WIDTH}
        height={el.props.height}
        rx={4}
        fill={el.props.fill}
        stroke="#222"
        strokeWidth={1}
      />
    );
  });

  return (
    <svg
      width="100%"
      height="100"
      viewBox={`0 0 ${BAR_WIDTH + 40} 80`}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Barra */}
      <rect x="10" y={BAR_HEIGHT / 2 - 4} width={BAR_WIDTH + 20} height={8} fill="#aaa" rx={4} />
      {/* Zona central (pegada) */}
      <rect
        x={BAR_WIDTH / 2 - 20}
        y={BAR_HEIGHT / 2 - 8}
        width={40}
        height={16}
        fill="#ccc"
        rx={3}
      />
      {/* Discos do lado esquerdo */}
      {discElements}
      {/* Discos do lado direito (espelhados) */}
      {mirror}
    </svg>
  );
}
