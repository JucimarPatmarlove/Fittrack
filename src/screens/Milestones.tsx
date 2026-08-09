// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';
import { C } from '../data/constants';
import { useMilestonesStore, calculateStreak } from '../stores/useMilestonesStore';

const BADGES = [
  { id: '1_workout', label: '1º Treino', icon: '🥉', check: (h: any[]) => h.length >= 1 },
  { id: '10_workouts', label: '10 Treinos', icon: '🥈', check: (h: any[]) => h.length >= 10 },
  { id: '25_workouts', label: '25 Treinos', icon: '🥇', check: (h: any[]) => h.length >= 25 },
  { id: '50_workouts', label: '50 Treinos', icon: '💎', check: (h: any[]) => h.length >= 50 },
  { id: '100_workouts', label: '100 Treinos', icon: '👑', check: (h: any[]) => h.length >= 100 },
  { id: 'streak_7', label: 'Streak 7 dias', icon: '🔥', check: (h: any[]) => calculateStreak(h) >= 7 },
  { id: 'streak_30', label: 'Streak 30 dias', icon: '⚡', check: (h: any[]) => calculateStreak(h) >= 30 },
  { id: 'first_pr', label: 'Primeiro PR', icon: '💪', check: (h: any[], prs: any) => Object.keys(prs).length > 0 },
  { id: '1000kg_volume', label: '1000kg Volume', icon: '🏋️', check: (h: any[]) => h.some(w => w.totalVolume >= 1000) }
];

export default function Milestones({ history }: any) {
  const { milestones, unlockMilestone, prs } = useMilestonesStore();

  // Re-evaluate milestones
  React.useEffect(() => {
    BADGES.forEach(badge => {
      if (!milestones[badge.id] && badge.check(history, prs)) {
        unlockMilestone(badge.id);
      }
    });
  }, [history, prs, milestones, unlockMilestone]);

  const currentStreak = calculateStreak(history);
  const totalVolumeAllTime = history.reduce((acc: number, w: any) => acc + (w.totalVolume || 0), 0);

  return (
    <div style={{ padding: "18px", maxWidth: 480, margin: "0 auto", paddingBottom: 90 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <p style={{ fontFamily: "'Bebas Neue'", fontSize: 24, letterSpacing: 2, margin: 0, color: C.accent }}>CONQUISTAS 🏆</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <div className="glass" style={{ flex: 1, padding: 16, textAlign: 'center' }}>
            <span style={{ fontSize: 24, display: 'block', marginBottom: 4 }}>🔥</span>
            <span style={{ fontSize: 18, fontWeight: 'bold', color: currentStreak > 0 ? C.accent : C.text }}>{currentStreak}</span>
            <span style={{ fontSize: 10, color: C.muted, display: 'block' }}>DIAS SEGUIDOS</span>
        </div>
        <div className="glass" style={{ flex: 1, padding: 16, textAlign: 'center' }}>
            <span style={{ fontSize: 24, display: 'block', marginBottom: 4 }}>💪</span>
            <span style={{ fontSize: 18, fontWeight: 'bold', color: C.accent }}>{Object.keys(prs).length}</span>
            <span style={{ fontSize: 10, color: C.muted, display: 'block' }}>RECORDES (PRs)</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {BADGES.map((badge, i) => {
          const unlocked = !!milestones[badge.id];
          const unlockDate = unlocked ? new Date(milestones[badge.id]).toLocaleDateString() : '???';
          
          return (
            <motion.div 
              key={badge.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{ 
                background: unlocked ? `${C.accent}11` : C.surface, 
                border: `1px solid ${unlocked ? C.accent : C.border}`, 
                borderRadius: 12, 
                padding: 16, 
                textAlign: 'center',
                filter: unlocked ? 'none' : 'grayscale(100%) opacity(0.5)'
              }}
            >
              <span style={{ fontSize: 32, display: 'block', marginBottom: 8, filter: unlocked ? 'drop-shadow(0 0 10px rgba(232,200,74,0.5))' : 'none' }}>
                {badge.icon}
              </span>
              <span style={{ display: 'block', fontSize: 13, fontWeight: 'bold', color: unlocked ? C.accent : C.muted, marginBottom: 4 }}>
                {badge.label}
              </span>
              <span style={{ display: 'block', fontSize: 10, color: C.muted }}>
                {unlockDate}
              </span>
            </motion.div>
          );
        })}
      </div>
      
      {Object.keys(prs).length > 0 && (
          <div style={{ marginTop: 24 }}>
             <p style={{ fontFamily: "'Bebas Neue'", fontSize: 20, letterSpacing: 1, color: C.text, marginBottom: 12 }}>RECORDES PESSOAIS (1RM)</p>
             <div className="glass" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(prs).map(([exercise, weight]) => (
                    <div key={exercise} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}`, paddingBottom: 8 }}>
                        <span style={{ fontSize: 14, color: C.text }}>{exercise}</span>
                        <span style={{ fontSize: 14, fontWeight: 'bold', color: C.accent, fontFamily: "'DM Mono'" }}>{weight} kg</span>
                    </div>
                ))}
             </div>
          </div>
      )}
    </div>
  );
}
