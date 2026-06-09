import React from 'react';
import { GlassCard } from '../ui/GlassCard';
import { C } from '../../data/constants';

interface VTaperWidgetProps {
  profile: any;
}

export const VTaperWidget: React.FC<VTaperWidgetProps> = ({ profile }) => {
  if (profile?.goal !== 'v_taper_aesthetics') return null;
  
  return (
    <GlassCard glow style={{ padding: 16, marginBottom: 20, borderLeft: `4px solid ${C.accent}` }}>
      <h3 style={{ fontFamily: "'Bebas Neue'", fontSize: 20, color: C.accent, marginBottom: 4, letterSpacing: 1 }}>🎯 MODO V-TAPER</h3>
      <p style={{ fontSize: 13, color: '#e0e0e0', lineHeight: 1.4, margin: 0 }}>
        Foco em <strong style={{ color: '#ccff00' }}>largura de ombros</strong> e <strong style={{ color: '#00d4ff' }}>dorsais</strong>. Evita hipertrofia de oblíquos.
      </p>
      <div style={{ marginTop: 12, padding: 8, background: '#0a0f15', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
        <p style={{ fontSize: 11, color: C.muted, marginBottom: 2, fontWeight: 'bold' }}>📐 RÁCIO RECOMENDADO</p>
        <p style={{ fontSize: 12, fontFamily: 'monospace', color: '#fff', margin: 0 }}>Elevações laterais + Puxadas | 3:1 vs peito</p>
      </div>
      <button 
        onClick={() => { alert('STOMACH VACUUM:\n\n1. Expira todo o ar dos pulmões.\n2. Puxa o umbigo para dentro e para cima (em direção à coluna).\n3. Mantém a contração por 15-30s.\n4. Repete 3-5 vezes diariamente.') }}
        style={{
          marginTop: 12, width: '100%', background: 'rgba(232, 200, 74, 0.1)', border: `1px solid rgba(232, 200, 74, 0.3)`,
          padding: '10px 8px', borderRadius: 8, color: C.accent, fontSize: 13, cursor: 'pointer', fontFamily: "'Outfit'", fontWeight: 500
        }}
      >
        🔍 COMO FAZER STOMACH VACUUM
      </button>
    </GlassCard>
  );
};
