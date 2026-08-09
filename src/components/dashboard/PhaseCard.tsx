// @ts-nocheck
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { MacrocycleEngine } from '../../services/macrocycleEngine';
import { UserProfile } from '../../types';

const theme = {
  bg: '#080b0f', glass: 'rgba(19, 25, 32, 0.8)', accent: '#e8c84a',
  danger: '#e84a4a', success: '#3dd68c', text: '#eceae4', muted: '#55626e'
};

export const PhaseCard = ({ history, profile }: { history: any[], profile: UserProfile }) => {
  const weeksActive = useMemo(() => {
    if (profile.weeksActive !== undefined) return profile.weeksActive;
    if (!history || history.length === 0) return 0;
    const firstDate = Math.min(...history.map((w: any) => new Date(w.date).getTime()));
    const daysActive = Math.floor((Date.now() - firstDate) / (1000 * 3600 * 24));
    return Math.floor(daysActive / 7);
  }, [history, profile]);

  const currentPhase = MacrocycleEngine.getCurrentPhase(weeksActive);
  const rules = MacrocycleEngine.getPrescriptionRules(currentPhase);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ background: theme.glass, borderRadius: '16px', padding: '20px', border: `1px solid #1e2832`, marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ color: theme.accent, fontFamily: 'Bebas Neue', margin: 0, fontSize: '22px' }}>FASE: {currentPhase}</h3>
        <span style={{ background: theme.success, color: '#000', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>Semana {weeksActive + 1}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div style={{ background: theme.bg, padding: '12px', borderRadius: '8px' }}><span style={{ color: theme.muted, fontSize: '11px', display: 'block' }}>ESTRUTURA</span><strong>{rules.trainingType}</strong></div>
        <div style={{ background: theme.bg, padding: '12px', borderRadius: '8px' }}><span style={{ color: theme.muted, fontSize: '11px', display: 'block' }}>PROTOCOLO</span><strong>{rules.sets}x{rules.repsTarget} reps</strong></div>
        <div style={{ background: theme.bg, padding: '12px', borderRadius: '8px' }}><span style={{ color: theme.muted, fontSize: '11px', display: 'block' }}>DESCANSO</span><strong style={{ color: theme.danger }}>{rules.restSeconds}s</strong></div>
        <div style={{ background: theme.bg, padding: '12px', borderRadius: '8px' }}><span style={{ color: theme.muted, fontSize: '11px', display: 'block' }}>FOCO</span><strong>{rules.focus[0]}</strong></div>
      </div>
      <p style={{ color: theme.muted, fontSize: '13px', margin: 0 }}><strong>Objetivo:</strong> {rules.phaseName}</p>
    </motion.div>
  );
};
