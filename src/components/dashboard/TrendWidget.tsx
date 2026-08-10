import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { C } from '../../data/constants';
import { type TrendAnalysis, analyzeMultipleExercises } from '../../services/trendAnalyzer';
import { GlassCard } from '../ui/GlassCard';

interface TrendWidgetProps {
  history: any[];
}

export function TrendWidget({ history }: TrendWidgetProps) {
  const [trends, setTrends] = useState<Map<string, TrendAnalysis> | null>(null);
  const [loading, setLoading] = useState(true);

  // Determinar os 3 exercícios mais frequentes no histórico
  const topExercises = useMemo(() => {
    const counts = new Map<string, number>();
    history.forEach((w) => {
      w.exercises?.forEach((ex: any) => {
        if (ex.name) {
          counts.set(ex.name, (counts.get(ex.name) || 0) + 1);
        }
      });
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map((entry) => entry[0]);
  }, [history]);

  useEffect(() => {
    if (topExercises.length === 0) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    analyzeMultipleExercises(topExercises)
      .then((results) => {
        if (isMounted) {
          setTrends(results);
          setLoading(false);
        }
      })
      .catch((e) => {
        console.warn('[TrendWidget] Erro ao carregar trends:', e);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [topExercises]);

  if (topExercises.length === 0) return null;

  return (
    <GlassCard style={{ padding: 16, marginBottom: 20 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <h3
          style={{
            fontSize: 18,
            color: C.text,
            fontFamily: "'Bebas Neue'",
            letterSpacing: 1,
            margin: 0,
          }}
        >
          ⚡ RADAR DE TENDÊNCIAS
        </h3>
        <span
          style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}
        >
          Top {topExercises.length} Exercícios
        </span>
      </div>

      {loading ? (
        <div style={{ padding: '20px 0', textAlign: 'center', color: C.muted, fontSize: 12 }}>
          A analisar dados biométricos...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <AnimatePresence>
            {topExercises.map((exName, index) => {
              const trend = trends?.get(exName);
              if (!trend || trend.status === 'NO_DATA') return null;

              // Estilos baseados no status
              let statusColor = C.muted;
              let icon = '•';
              let badgeText = '';

              if (trend.status === 'PROGRESSING') {
                statusColor = C.green;
                icon = '📈';
                badgeText = `+${trend.suggestedWeightIncrement}kg`;
              } else if (trend.status === 'FATIGUED') {
                statusColor = C.red;
                icon = '📉';
                badgeText = `-${Math.abs(trend.suggestedWeightIncrement)}kg`;
              } else {
                statusColor = C.accent;
                icon = '⚖️';
                badgeText = 'Manter';
              }

              return (
                <motion.div
                  key={exName}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 8,
                    borderLeft: `3px solid ${statusColor}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 16 }}>{icon}</span>
                    <span style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{exName}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        background: `${statusColor}22`,
                        color: statusColor,
                        padding: '4px 8px',
                        borderRadius: 4,
                        fontSize: 12,
                        fontFamily: "'DM Mono'",
                        fontWeight: 'bold',
                      }}
                    >
                      {badgeText}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </GlassCard>
  );
}
