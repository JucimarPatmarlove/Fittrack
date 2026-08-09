import { motion } from 'framer-motion';
import { Activity, Brain, Droplets, Scale } from 'lucide-react';
// @ts-nocheck
import type React from 'react';
import type { UnifiedHealthMetrics } from '../../services/healthBridge';

interface MetricBoxProps {
  label: string;
  value: number | null;
  unit: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  precision?: number;
}

const MetricBox: React.FC<MetricBoxProps> = ({
  label,
  value,
  unit,
  icon: Icon,
  trend = 'neutral',
  precision = 1,
}) => {
  const isPositive = trend === 'up';
  const isNegative = trend === 'down';
  const color = isPositive ? '#00ff88' : isNegative ? '#ff4444' : '#00d4ff';

  return (
    <div
      style={{
        background: 'rgba(0,0,0,0.4)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '12px',
        padding: '16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <Icon size={16} color="rgba(255,255,255,0.5)" />
        <span
          style={{
            fontSize: '10px',
            color: 'rgba(255,255,255,0.5)',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '2px',
          }}
        >
          {label}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        <span
          style={{
            fontSize: '1.5rem',
            fontWeight: 900,
            fontFamily: 'monospace',
            color: '#fff',
            letterSpacing: '-1px',
          }}
        >
          {value !== null ? value.toFixed(precision) : '--'}
        </span>
        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 'bold' }}>
          {unit}
        </span>
      </div>
      {trend !== 'neutral' && value !== null && (
        <div
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            color,
            fontWeight: 'bold',
            textShadow: `0 0 10px ${color}80`,
          }}
        >
          {isPositive ? '↑' : '↓'}
        </div>
      )}
    </div>
  );
};

interface BiometricDeltaCardProps {
  healthData: UnifiedHealthMetrics | null;
  isLoading?: boolean;
}

export const BiometricDeltaCard: React.FC<BiometricDeltaCardProps> = ({
  healthData,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span
            style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              animation: 'pulse 2s infinite',
            }}
          >
            A calibrar sensores biométricos...
          </span>
        </div>
      </div>
    );
  }

  if (!healthData) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(12px)',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid rgba(0, 255, 136, 0.2)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '128px',
          height: '128px',
          background: '#00ff88',
          borderRadius: '50%',
          filter: 'blur(80px)',
          opacity: 0.1,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <h3
          style={{
            fontFamily: '"Bebas Neue", sans-serif',
            letterSpacing: '2px',
            fontSize: '1.25rem',
            color: '#fff',
            margin: 0,
          }}
        >
          BIOIMPEDÂNCIA (RENPHO)
        </h3>
        <span
          style={{
            fontSize: '9px',
            background: 'rgba(0, 255, 136, 0.1)',
            border: '1px solid rgba(0, 255, 136, 0.3)',
            padding: '4px 8px',
            borderRadius: '6px',
            color: '#00ff88',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '2px',
          }}
        >
          {healthData.platform === 'mock'
            ? healthData.weight !== null
              ? 'MOCK'
              : 'SEM DADOS'
            : healthData.platform}
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '16px',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <MetricBox
          label="Massa Total"
          value={healthData.weight}
          unit="kg"
          icon={Scale}
          trend={healthData.weight && healthData.weight > 79 ? 'up' : 'down'}
        />
        <MetricBox
          label="Gordura"
          value={healthData.bodyFat}
          unit="%"
          icon={Droplets}
          trend={healthData.bodyFat && healthData.bodyFat > 25 ? 'up' : 'down'}
          precision={1}
        />
        <MetricBox
          label="Massa Magra"
          value={healthData.leanMass}
          unit="kg"
          icon={Activity}
          trend={healthData.leanMass && healthData.leanMass > 59 ? 'up' : 'down'}
        />
        <MetricBox
          label="IMC"
          value={healthData.bmi}
          unit=""
          icon={Brain}
          trend="neutral"
          precision={1}
        />
      </div>

      <div
        style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.75rem',
          color: 'rgba(255,255,255,0.5)',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <span>Sync: {new Date(healthData.lastSync).toLocaleTimeString()}</span>
        <span>
          Origem:{' '}
          {healthData.platform === 'apple'
            ? 'Apple Health'
            : healthData.platform === 'google'
              ? 'Google Fit'
              : healthData.weight !== null
                ? 'Sensor Simulado'
                : 'A aguardar dados...'}
        </span>
      </div>
    </motion.div>
  );
};
