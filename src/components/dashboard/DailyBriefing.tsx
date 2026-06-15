import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle, Zap, Dumbbell, CalendarPlus, ChevronRight } from 'lucide-react';
import { format, subDays } from 'date-fns';

interface DailyBriefingProps {
  history: any[];
  plannedWorkoutToday?: { title: string; period: 'Manhã' | 'Tarde' | 'Noite'; slot: 'morning' | 'afternoon' } | null;
  onStartPlannedWorkout: () => void;
  onStartFreeWorkout: () => void;
  onNavigateToPlanner: () => void;
}

export const DailyBriefing: React.FC<DailyBriefingProps> = ({
  history,
  plannedWorkoutToday,
  onStartPlannedWorkout,
  onStartFreeWorkout,
  onNavigateToPlanner
}) => {
  // Lógica para encontrar o treino de ontem corrigindo o bug de timezone
  const yesterdaysWorkout = useMemo(() => {
    const yesterdayString = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    return history.find(w => w.date === yesterdayString || w.startTime?.startsWith(yesterdayString));
  }, [history]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '24px' }}
    >
      {/* BLOCO 1: O Que Foi Feito Ontem */}
      <div 
        style={{
          borderRadius: '16px', padding: '20px', border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden',
          background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(12px)'
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'linear-gradient(to bottom, #a8e000, transparent)', opacity: 0.5 }} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Calendar size={16} color="#9ca3af" />
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px' }}>Resumo de Ontem</span>
        </div>

        {yesterdaysWorkout ? (
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 4px 0' }}>
              <CheckCircle size={20} color="#ccff00" />
              {yesterdaysWorkout.name || 'Treino Concluído'}
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#9ca3af', margin: 0, fontFamily: 'monospace' }}>
              {Math.floor((yesterdaysWorkout.totalCalories || yesterdaysWorkout.caloriesBurned || 300))} kcal • <span style={{ color: '#00ff88' }}>{(yesterdaysWorkout.durationSeconds ? Math.floor(yesterdaysWorkout.durationSeconds / 60) : 45)} min</span>
            </p>
          </div>
        ) : (
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#d1d5db', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 4px 0' }}>
              <Zap size={20} color="#6b7280" />
              Descanso Ativo
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>
              Recuperação do Sistema Nervoso Central.
            </p>
          </div>
        )}
      </div>

      {/* BLOCO 2: A Missão de Hoje */}
      <div 
        style={{
          borderRadius: '16px', padding: '20px', border: `1px solid ${plannedWorkoutToday ? 'rgba(204, 255, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          background: plannedWorkoutToday ? 'rgba(204, 255, 0, 0.05)' : 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(12px)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ position: 'relative', display: 'flex', width: '12px', height: '12px' }}>
            {plannedWorkoutToday && <span style={{ animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite', position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', background: '#ccff00', opacity: 0.75 }} />}
            <span style={{ position: 'relative', display: 'inline-flex', borderRadius: '50%', width: '12px', height: '12px', background: plannedWorkoutToday ? '#ccff00' : '#6b7280' }} />
          </span>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#fff', textTransform: 'uppercase', letterSpacing: '1px' }}>Missão de Hoje</span>
        </div>

        {plannedWorkoutToday ? (
          <>
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ccff00', textTransform: 'uppercase', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>
                {plannedWorkoutToday.title}
              </h4>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '4px 8px', borderRadius: '6px', display: 'inline-block' }}>
                Período da {plannedWorkoutToday.period}
              </span>
            </div>
            <button 
              onClick={onStartPlannedWorkout}
              style={{
                width: '100%', padding: '12px', background: '#ccff00', color: '#000', fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px',
                borderRadius: '12px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: '0 0 15px rgba(204,255,0,0.3)', transition: 'all 0.2s'
              }}
            >
              Iniciar Treino Agendado <ChevronRight size={16} />
            </button>
          </>
        ) : (
          <>
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#d1d5db', margin: 0 }}>Nenhum plano agendado.</h4>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={onStartFreeWorkout}
                style={{
                  flex: 1, padding: '8px', background: 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: 'bold', fontSize: '0.75rem', textTransform: 'uppercase',
                  borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                <Dumbbell size={16} /> Livre
              </button>
              <button 
                onClick={onNavigateToPlanner}
                style={{
                  flex: 1, padding: '8px', background: 'transparent', color: '#ccff00', fontWeight: 'bold', fontSize: '0.75rem', textTransform: 'uppercase',
                  borderRadius: '12px', border: '1px solid rgba(204,255,0,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                <CalendarPlus size={16} /> Montar Semana
              </button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};
