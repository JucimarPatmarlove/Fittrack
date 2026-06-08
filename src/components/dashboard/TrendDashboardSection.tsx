import React, { useEffect, useState } from 'react';
import { analyzeMultipleExercises, TrendAnalysis } from '../../services/trendAnalyzer';
import { TrendStatusBadge } from './TrendStatusBadge';
import { GlassCard } from '../ui/GlassCard';

export const TrendDashboardSection = ({ recentExercises, maxItems = 4 }: { recentExercises: string[], maxItems?: number }) => {
  const [trends, setTrends] = useState<Map<string, TrendAnalysis>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (recentExercises.length > 0) {
      setLoading(true);
      analyzeMultipleExercises(recentExercises.slice(0, maxItems)).then(results => {
        setTrends(results);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [recentExercises, maxItems]);

  if (recentExercises.length === 0) return null;

  return (
    <GlassCard glow style={{ padding: 16, marginBottom: 20 }}>
      <h3 style={{ fontFamily: "'Bebas Neue'", fontSize: 20, color: '#eceae4', marginBottom: 12, letterSpacing: 1 }}>
        TENDÊNCIAS RECENTES
      </h3>
      {loading ? (
        <div style={{ fontSize: 12, color: '#55626e', fontFamily: 'monospace' }}>Analisando SNC...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from(trends.entries()).map(([exercise, analysis]) => (
            <div key={exercise} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: 8 }}>
              <span style={{ fontSize: 14, color: '#eceae4', fontWeight: 600 }}>{exercise}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {analysis.suggestedWeightIncrement !== 0 && (
                  <span style={{ fontSize: 11, color: analysis.suggestedWeightIncrement > 0 ? '#ccff00' : '#ff6b35', fontFamily: 'monospace' }}>
                    {analysis.suggestedWeightIncrement > 0 ? '+' : ''}{analysis.suggestedWeightIncrement}kg
                  </span>
                )}
                <TrendStatusBadge status={analysis.status} compact />
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
};
