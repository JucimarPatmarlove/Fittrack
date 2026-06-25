import React, { useState } from 'react';
import { C } from '../../data/constants';

// Mapa de tooltips explicativos para conceitos do FitTrack
export const TOOLTIP_TEXTS: Record<string, string> = {
  rpe: 'RPE (Rating of Perceived Exertion) é uma escala de 1 a 10 que mede o quão difícil foi a série. RPE 8 significa que ainda conseguirias fazer 2 repetições. RPE 10 = falha total.',
  '1rm': '1RM (1 Repetition Maximum) é o peso máximo que consegues levantar numa única repetição. É estimado automaticamente com base no peso e repetições que realizaste.',
  fadiga: 'A fadiga compensatória ocorre quando o teu sistema nervoso central está cansado e o corpo compensa com má postura. Reduz a carga em 10-15% quando sentires.',
  readiness: 'O Readiness Score é uma pontuação de 0-100 que indica o quão recuperado estás para treinar. Leva em conta sono, treinos recentes e fadiga acumulada.',
  acwr: 'ACWR (Acute:Chronic Workload Ratio) compara a carga da última semana com a média das últimas 4 semanas. Entre 0.8-1.3 é a zona segura. Acima de 1.5 é risco de lesão.',
  cadencia: 'Cadência é o número de rotações por minuto (rpm) no ciclismo ou passos por minuto na corrida. Cadências entre 80-100 rpm são eficientes para ciclismo.',
  pace: 'Pace é o tempo que levas a percorrer 1 km. Por exemplo, 5:00 min/km significa que corres 1 km em 5 minutos.',
  ghost: 'Ghost Mode permite-te competir contra a melhor versão de ti mesmo. O sistema usa o teu melhor desempenho anterior como alvo e dás XP se bateres o recorde.',
};

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  icon?: boolean;
  small?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({
  text,
  children,
  position = 'top',
  icon = true,
  small = false,
}) => {
  const [show, setShow] = useState(false);

  const getPositionStyles = () => {
    switch (position) {
      case 'bottom':
        return { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 8 };
      case 'left':
        return { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: 8 };
      case 'right':
        return { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: 8 };
      default:
        return { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 8 };
    }
  };

  const getArrowStyles = () => {
    switch (position) {
      case 'bottom':
        return { top: -5, left: '50%', transform: 'translateX(-50%) rotate(45deg)' };
      case 'left':
        return { right: -5, top: '50%', transform: 'translateY(-50%) rotate(45deg)' };
      case 'right':
        return { left: -5, top: '50%', transform: 'translateY(-50%) rotate(45deg)' };
      default:
        return { bottom: -5, left: '50%', transform: 'translateX(-50%) rotate(45deg)' };
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        cursor: 'help',
      }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onTouchStart={() => setShow(!show)}
    >
      {children}
      {icon && (
        <span style={{ color: C.muted, fontSize: small ? 10 : 12, lineHeight: 1, userSelect: 'none' }}>
          ℹ️
        </span>
      )}
      {show && (
        <div
          style={{
            position: 'absolute',
            ...getPositionStyles(),
            width: small ? 180 : 240,
            padding: small ? 8 : 12,
            background: '#1e2832',
            color: '#e2e8f0',
            borderRadius: 8,
            fontSize: small ? 11 : 12,
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            border: `1px solid ${C.border}`,
            zIndex: 1000,
            textAlign: 'center',
            lineHeight: 1.5,
            whiteSpace: 'normal',
            wordBreak: 'break-word',
          }}
        >
          {text}
          <div
            style={{
              position: 'absolute',
              width: 10,
              height: 10,
              background: '#1e2832',
              borderRight: `1px solid ${C.border}`,
              borderBottom: `1px solid ${C.border}`,
              ...getArrowStyles(),
            }}
          />
        </div>
      )}
    </div>
  );
};

// Componente para adicionar tooltip a um label
export const LabelWithTooltip: React.FC<{
  label: string;
  tooltipKey: string;
  style?: React.CSSProperties;
}> = ({ label, tooltipKey, style }) => {
  const text = TOOLTIP_TEXTS[tooltipKey] || tooltipKey;
  return (
    <Tooltip text={text} small>
      <span style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, ...style }}>
        {label}
      </span>
    </Tooltip>
  );
};