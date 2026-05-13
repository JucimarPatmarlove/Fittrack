import React from 'react';
import { useProgressionStore } from '../stores/useProgressionStore';
import { GlassCard } from '../components/ui/GlassCard';
import { GradientButton } from '../components/ui/GradientButton';
import { C } from '../data/constants';

interface CycleReviewProps {
  history?: any[];
  onClose: () => void;
  onGenerateNewPlan: () => void;
}

export function CycleReview({ history = [], onClose, onGenerateNewPlan }: CycleReviewProps) {
  const { exercises, clearSuggestions } = useProgressionStore();


  const lastWeekVolume = history.filter(w => new Date(w.date).getTime() > Date.now() - 7 * 24 * 3600 * 1000).reduce((sum, w) => sum + (w.totalVolume || 0), 0);
  const previousWeekVolume = history.filter(w => new Date(w.date).getTime() > Date.now() - 14 * 24 * 3600 * 1000 && new Date(w.date).getTime() <= Date.now() - 7 * 24 * 3600 * 1000).reduce((sum, w) => sum + (w.totalVolume || 0), 0);
  
  const volumeDrop = previousWeekVolume > 0 ? (lastWeekVolume / previousWeekVolume) : 1;
  const suggestGlobalDeload = volumeDrop < 0.8 && lastWeekVolume > 0 && previousWeekVolume > 0;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(8,11,15,0.95)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 400, padding: 24, backdropFilter: 'blur(10px)' }}>
        <div style={{ background: C.card, border: `1px solid ${C.accent}`, borderRadius: 14, padding: 26, maxWidth: 500, width: "100%", maxHeight: "85vh", overflowY: "auto" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h1 style={{ fontFamily: "'Bebas Neue'", fontSize: 28, letterSpacing: 2, color: C.accent, margin: 0 }}>REVISÃO DE CICLO</h1>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 24, cursor: 'pointer' }}>×</button>
            </div>

            {suggestGlobalDeload && (
                <GlassCard glow={false} style={{ padding: 16, marginBottom: 20, borderLeft: `4px solid ${C.red}` }}>
                    <p style={{ color: C.red, fontWeight: 'bold', margin: "0 0 8px 0" }}>⚠️ ALERTA: Volume caiu {(100 - volumeDrop * 100).toFixed(0)}% esta semana.</p>
                    <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>Sugiro uma semana de deload estratégico. (Reduzir 20% da carga ou diminuir 1 série por exercício).</p>
                </GlassCard>
            )}

            <h2 style={{ fontSize: 14, color: C.text, marginBottom: 12 }}>Micro-Ajustes Recomendados</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                {Object.entries(exercises).map(([name, data]: [string, any]) => {
                if (!data.suggestedIncrease && !data.deloadSuggested) return null;
                return (
                    <GlassCard key={name} glow={false} style={{ padding: 16 }}>
                        <h3 style={{ fontWeight: 'bold', margin: "0 0 8px 0", fontSize: 15, color: '#fff' }}>{name}</h3>
                        {data.suggestedIncrease && <p style={{ color: C.green, fontSize: 13, margin: 0 }}>✅ Aumente +2.5kg no próximo treino.</p>}
                        {data.deloadSuggested && <p style={{ color: C.red, fontSize: 13, margin: 0 }}>⚠️ Reduza a carga em 10% ou faça menos 1 série.</p>}
                        <button onClick={() => clearSuggestions(name)} style={{ fontSize: 11, background: C.surface, color: C.muted, border: `1px solid ${C.border}`, padding: "4px 12px", borderRadius: 20, marginTop: 12, cursor: 'pointer' }}>
                            Descartar Sugestão
                        </button>
                    </GlassCard>
                );
                })}
                {Object.values(exercises).filter((d: any) => d.suggestedIncrease || d.deloadSuggested).length === 0 && (
                    <p style={{ color: C.muted, fontSize: 13, fontStyle: 'italic' }}>Nenhum ajuste individual pendente.</p>
                )}
            </div>

            <GradientButton onClick={onGenerateNewPlan} variant="primary" style={{ width: "100%", padding: 14, fontSize: 18, display: 'flex', justifyContent: 'center' }}>
                GERAR NOVO PLANO (IA)
            </GradientButton>
        </div>
    </div>
  );
}
