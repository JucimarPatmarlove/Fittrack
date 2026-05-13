import { motion } from 'framer-motion';
import { Flame, Target, Calendar, CheckCircle, Circle, Trophy } from 'lucide-react';
import { useChallengeStore } from '../../stores/useChallengeStore';
import { C } from '../../data/constants';

const MEALS = [
  { key: 'breakfast', label: '🍳 Pequeno Almoço', time: '07:00-09:00' },
  { key: 'morningSnack', label: '🍎 Pré-Almoço', time: '10:30-11:30' },
  { key: 'lunch', label: '🥗 Almoço', time: '12:30-14:00' },
  { key: 'afternoonSnack', label: '🍌 Lanche', time: '16:00-17:30' },
  { key: 'dinner', label: '🍽️ Jantar', time: '19:00-21:00' },
];

export const Challenge90Days = () => {
  const { 
    startDate, 
    currentDay, 
    startChallenge, 
    toggleMeal, 
    getTodayChecklist,
    currentStreak,
    longestStreak,
    getCompletionRate 
  } = useChallengeStore();
  
  const todayChecklist = getTodayChecklist();
  const completionRate = getCompletionRate();
  const daysRemaining = startDate ? Math.max(0, 90 - currentDay) : 0;
  
  if (!startDate) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ background: C.card, borderRadius: 12, padding: 24, textAlign: 'center', border: `1px solid ${C.accent}44` }}
      >
        <Trophy size={64} style={{ color: C.accent, margin: '0 auto 16px auto' }} />
        <h3 style={{ fontSize: 24, fontFamily: "'Bebas Neue'", color: C.accent, margin: '0 0 8px 0' }}>DESAFIO 90 DIAS</h3>
        <p style={{ color: C.muted, fontSize: 13, marginBottom: 24 }}>Transforme seus hábitos com checklists diários de refeições.</p>
        <button
          onClick={startChallenge}
          style={{ padding: '12px 24px', background: C.accent, color: C.bg, fontWeight: 'bold', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 16 }}
        >
          🚀 INICIAR DESAFIO
        </button>
      </motion.div>
    );
  }
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ background: C.card, borderRadius: 12, overflow: 'hidden', border: `1px solid ${C.accent}44` }}
    >
      <div style={{ background: `linear-gradient(to right, ${C.accent}33, transparent)`, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ fontSize: 24, fontFamily: "'Bebas Neue'", color: C.accent, margin: 0 }}>🔥 DESAFIO 90 DIAS</h3>
          <span style={{ fontSize: 24, fontWeight: 'bold', color: '#fff' }}>{currentDay}/90</span>
        </div>
        
        <div style={{ height: 8, background: C.bg, borderRadius: 4, overflow: 'hidden' }}>
          <motion.div 
            style={{ height: '100%', background: C.accent }}
            initial={{ width: 0 }}
            animate={{ width: `${(currentDay / 90) * 100}%` }}
          />
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 12, color: '#ccc' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Flame size={14} color="#f97316"/> {currentStreak} dias</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Target size={14} color={C.accent}/> {Math.floor(completionRate)}%</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={14} color="#3b82f6"/> Faltam {daysRemaining}</span>
        </div>
      </div>
      
      <div style={{ padding: 16 }}>
        <p style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 12, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
           <CheckCircle size={16} /> CHECKLIST DE HOJE
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {MEALS.map(({ key, label, time }) => {
            const isDone = todayChecklist?.meals[key as keyof typeof todayChecklist.meals];
            return (
                <motion.button
                key={key}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleMeal(key as any)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: C.bg, borderRadius: 8, border: 'none', cursor: 'pointer' }}
                >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {isDone ? <CheckCircle size={20} color="#10b981" /> : <Circle size={20} color="#555" />}
                    <div style={{ textAlign: 'left' }}>
                    <p style={{ fontSize: 14, fontWeight: 'bold', color: '#fff', margin: 0 }}>{label}</p>
                    <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>{time}</p>
                    </div>
                </div>
                </motion.button>
            );
          })}
        </div>
        
        <div style={{ marginTop: 16, padding: 12, background: C.bg, borderRadius: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#fff' }}>
            <span>🏆 Melhor sequência</span>
            <span style={{ color: C.accent, fontWeight: 'bold' }}>{longestStreak} dias</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
