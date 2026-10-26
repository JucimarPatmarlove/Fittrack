import { C } from '../../data/constants';

type PrescriptionKind = 'first' | 'up' | 'hold' | 'deload' | 'off';

interface ProgressionBadgeProps {
  kind: PrescriptionKind;
  weight: number;
  reps: number;
  reason: string;
  isBodyweight?: boolean;
}

/**
 * Badge de sugestão de progressão — mostra a próxima prescrição calculada
 */
export const ProgressionBadge = ({ kind, weight, reps, reason, isBodyweight }: ProgressionBadgeProps) => {
  const getBadgeStyle = () => {
    switch (kind) {
      case 'up':
        return {
          bg: 'rgba(61, 214, 140, 0.12)',
          border: 'rgba(61, 214, 140, 0.4)',
          accent: '#3dd68c',
          icon: '📈',
          label: 'PROGRESSÃO',
        };
      case 'hold':
        return {
          bg: 'rgba(232, 200, 74, 0.12)',
          border: 'rgba(232, 200, 74, 0.4)',
          accent: '#e8c84a',
          icon: '⏸️',
          label: 'MANTÉM',
        };
      case 'first':
        return {
          bg: 'rgba(56, 189, 248, 0.12)',
          border: 'rgba(56, 189, 248, 0.4)',
          accent: '#38bdf8',
          icon: '🎯',
          label: 'PRIMEIRA VEZ',
        };
      case 'deload':
        return {
          bg: 'rgba(232, 74, 74, 0.12)',
          border: 'rgba(232, 74, 74, 0.4)',
          accent: '#e84a4a',
          icon: '🔻',
          label: 'DELOAD',
        };
      default:
        return {
          bg: 'rgba(85, 98, 110, 0.12)',
          border: 'rgba(85, 98, 110, 0.4)',
          accent: '#55626e',
          icon: '➖',
          label: 'OFF',
        };
    }
  };

  const style = getBadgeStyle();

  // Texto principal da sugestão
  const getMainText = () => {
    if (isBodyweight) {
      switch (kind) {
        case 'up': return `Sobe para ${reps} reps`;
        case 'hold': return `Mantém ${reps} reps`;
        case 'first': return `Começa com ${reps} reps`;
        case 'deload': return `Reduz para ${reps} reps`;
        default: return '';
      }
    }

    switch (kind) {
      case 'up': return `Sobe para ${weight}kg × ${reps} reps`;
      case 'hold': return `Mantém ${weight}kg, tenta ${reps} reps`;
      case 'first': return `Primeira vez: começa com ${weight}kg × ${reps} reps`;
      case 'deload': return `Deload para ${weight}kg × ${reps} reps`;
      default: return 'Progressão desligada';
    }
  };

  return (
    <div
      style={{
        marginBottom: 12,
        padding: '10px 12px',
        background: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: 8,
        borderLeft: `3px solid ${style.accent}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <span style={{ fontSize: 14, lineHeight: 1 }}>{style.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: 1,
                color: style.accent,
                textTransform: 'uppercase',
                fontFamily: "'DM Mono'",
              }}
            >
              {style.label}
            </span>
            {kind !== 'off' && (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#eceae4',
                }}
              >
                {getMainText()}
              </span>
            )}
          </div>
          {reason && (
            <div
              style={{
                marginTop: 6,
                fontSize: 10,
                color: C.muted,
                lineHeight: 1.4,
                fontFamily: "'DM Mono'",
              }}
            >
              {reason}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};