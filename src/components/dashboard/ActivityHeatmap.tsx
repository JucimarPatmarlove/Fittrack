import React from 'react';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { WorkoutSession } from '../../types';

interface HeatmapProps {
  history: WorkoutSession[];
}

export const ActivityHeatmap = ({ history }: HeatmapProps) => {
  const lastYear = eachDayOfInterval({
    start: subDays(new Date(), 365),
    end: new Date()
  });
  
  const getWorkoutsForDate = (date: Date) => {
    const dStr = format(date, 'yyyy-MM-dd');
    return history.filter(w => w.date.startsWith(dStr));
  };

  const getIntensityColor = (date: Date) => {
    const workouts = getWorkoutsForDate(date);
    const volume = workouts.reduce((sum, w) => sum + (w.totalVolume || 0), 0);
    
    if (volume === 0) return '#1a1f25'; // sem treino
    if (volume < 5000) return '#2a5a2a'; // baixo volume / recuperação
    if (volume < 15000) return '#e8c84a'; // médio / foco
    return '#ff6b35'; // volume muito alto / PR day
  };
  
  const getVolumeForDate = (date: Date) => {
    const workouts = getWorkoutsForDate(date);
    return workouts.reduce((sum, w) => sum + (w.totalVolume || 0), 0);
  };
  
  return (
    <div style={{ marginTop: 24, marginBottom: 24, overflowX: 'auto', paddingBottom: 10 }}>
       <p style={{ fontFamily: "'Bebas Neue'", fontSize: 16, letterSpacing: 2, color: '#9ca3af', marginBottom: 12 }}>CONSISTÊNCIA ANUAL</p>
       <div style={{ display: 'grid', gridTemplateRows: 'repeat(7, 1fr)', gridAutoFlow: 'column', gap: 4, width: 'max-content' }}>
        {lastYear.map((date, i) => (
            <div
            key={i}
            style={{
                width: 12, height: 12, borderRadius: 2, transition: 'background-color 0.2s',
                backgroundColor: getIntensityColor(date)
            }}
            title={`${format(date, 'dd/MM/yyyy')}: ${getVolumeForDate(date)}kg levantados em volume`}
            />
        ))}
       </div>
    </div>
  );
};
