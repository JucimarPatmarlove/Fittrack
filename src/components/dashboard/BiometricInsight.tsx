import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Flame, Moon, Scale, Zap } from 'lucide-react';
import { HealthKitData } from '../../services/healthKitService';
import { DailyAdjustment } from '../../utils/dailyAdjustment';
import { Capacitor } from '@capacitor/core';

interface Props {
  healthData: HealthKitData | null;
  adjustment: DailyAdjustment | null;
  isSyncing: boolean;
}

export const BiometricInsight: React.FC<Props> = ({ healthData, adjustment, isSyncing }) => {
  if (isSyncing) {
    return (
      <div style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
        <Zap color="#00d4ff" size={20} />
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px' }}>Sincronizando Sensores...</span>
      </div>
    );
  }

  if (!healthData || !adjustment) return null;

  const isMock = !Capacitor.isNativePlatform();

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{ 
        background: 'rgba(255, 255, 255, 0.03)', 
        backdropFilter: 'blur(12px)',
        borderColor: 'rgba(0, 212, 255, 0.2)',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid rgba(0, 212, 255, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background Glow */}
      <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '128px', height: '128px', background: '#00d4ff', borderRadius: '50%', filter: 'blur(80px)', opacity: 0.2, pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={20} color="#00d4ff" />
          <h3 style={{ fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '2px', fontSize: '1.25rem', color: '#fff', margin: 0 }}>TELEMETRIA BIOMÉTRICA</h3>
        </div>
        {isMock && healthData.weight !== null && (
          <span style={{ fontSize: '9px', background: 'rgba(0, 212, 255, 0.1)', border: '1px solid rgba(0, 212, 255, 0.3)', padding: '4px 8px', borderRadius: '6px', color: '#00d4ff', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Simulação
          </span>
        )}
      </div>

      {/* Métricas (Peso e Sono) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px', position: 'relative', zIndex: 10 }}>
        <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Scale size={16} color="rgba(255,255,255,0.5)" style={{ marginBottom: '4px' }} />
          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '4px', margin: 0 }}>Massa (RENPHO)</p>
          <p style={{ fontSize: '1.875rem', fontWeight: 900, color: '#fff', fontFamily: 'monospace', letterSpacing: '-1px', margin: 0 }}>
            {healthData.weight?.toFixed(1) ?? '—'}<span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', marginLeft: '4px' }}>kg</span>
          </p>
        </div>
        <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Moon size={16} color="rgba(255,255,255,0.5)" style={{ marginBottom: '4px' }} />
          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '4px', margin: 0 }}>Sono (Watch)</p>
          <p style={{ fontSize: '1.875rem', fontWeight: 900, color: '#fff', fontFamily: 'monospace', letterSpacing: '-1px', margin: 0 }}>
            {healthData.sleepHours?.toFixed(1) ?? '—'}<span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', marginLeft: '4px' }}>h</span>
          </p>
        </div>
      </div>

      {/* Insights da IA (Motor Preditivo) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.75rem', marginBottom: '24px', position: 'relative', zIndex: 10 }}>
        {adjustment.sleepInsight && (
          <p style={{ color: 'rgba(255,255,255,0.8)', borderLeft: '2px solid #ffaa00', paddingLeft: '12px', paddingBottom: '4px', paddingTop: '4px', margin: 0, background: 'linear-gradient(90deg, rgba(255,170,0,0.1) 0%, rgba(255,170,0,0) 100%)' }}>
            {adjustment.sleepInsight}
          </p>
        )}
        {adjustment.calorieInsight && (
          <p style={{ color: 'rgba(255,255,255,0.8)', borderLeft: '2px solid #00ff88', paddingLeft: '12px', paddingBottom: '4px', paddingTop: '4px', margin: 0, background: 'linear-gradient(90deg, rgba(0,255,136,0.1) 0%, rgba(0,255,136,0) 100%)' }}>
            {adjustment.calorieInsight}
          </p>
        )}
      </div>

      {/* Linha Inferior: Decisão do Sistema */}
      <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 10 }}>
        <div>
          <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', margin: 0 }}>Protocolo Sugerido</p>
          <p style={{ fontWeight: 900, color: '#ccff00', fontSize: '0.875rem', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '1px', textShadow: '0 0 8px rgba(204,255,0,0.5)', margin: '4px 0 0 0' }}>
            {adjustment.workoutType}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', margin: 0 }}>Alvo Calórico</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'monospace', color: '#00ff88', textShadow: '0 0 10px rgba(0,255,136,0.3)', margin: '4px 0 0 0' }}>
            {adjustment.suggestedCalories} <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>kcal</span>
          </p>
        </div>
      </div>
    </motion.div>
  );
};

