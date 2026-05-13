import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Calendar as CalendarIcon, CheckCircle } from 'lucide-react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useDualWorkoutStore } from '../../stores/useDualWorkoutStore';
import { C } from '../../data/constants';

const NextWorkoutWidget = () => {
    const { getNextWorkout } = useDualWorkoutStore();
    const next = getNextWorkout();
    
    if (!next) return null;
    
    return (
      <div style={{ marginTop: 16, padding: 12, background: 'linear-gradient(to right, rgba(232,200,74,0.1), transparent)', borderRadius: 8 }}>
        <p style={{ fontSize: 10, color: C.muted, fontFamily: "'DM Mono'" }}>PRÓXIMO TREINO</p>
        <p style={{ fontWeight: 'bold', fontSize: 14, color: '#fff' }}>{next.workoutName}</p>
        <p style={{ fontSize: 12, color: C.accent }}>
          {next.slot === 'morning' ? '🌅 Manhã' : '🌙 Tarde'} • {new Date(next.date).toLocaleDateString()}
        </p>
      </div>
    );
  };

export const DualWorkoutCalendar = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { getWorkoutsForDate, completeWorkout } = useDualWorkoutStore();
  const dateStr = selectedDate.toISOString().split('T')[0];
  const workouts = getWorkoutsForDate(dateStr);

  const workoutsList = [
    { slot: 'morning' as const, icon: Sun, label: 'Manhã', color: '#f59e0b' },
    { slot: 'afternoon' as const, icon: Moon, label: 'Tarde', color: '#8b5cf6' },
  ];

  return (
    <div style={{ background: C.card, borderRadius: 12, padding: 16, border: `1px solid ${C.accent}44`, marginBottom: 20 }}>
      <h3 style={{ color: C.accent, fontFamily: "'Bebas Neue'", fontSize: 22, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
        <CalendarIcon size={20} /> AGENDA DE TREINOS
      </h3>

      <div style={{ background: C.bg, borderRadius: 8, padding: 8, marginBottom: 16 }}>
          <Calendar
            onChange={(date: any) => setSelectedDate(date)}
            value={selectedDate}
            className="fittrack-calendar"
          />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {workoutsList.map(({ slot, icon: Icon, label, color }) => {
          const workout = workouts[slot];
          return (
            <motion.div
              key={slot}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: C.bg, borderRadius: 8 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Icon size={20} style={{ color }} />
                <div>
                  <p style={{ fontSize: 14, fontWeight: 'bold', margin: 0, color: '#fff' }}>{label}</p>
                  {workout ? (
                    <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>
                      {workout.workoutName} • {workout.completed ? '✔️ Concluído' : '⏳ Pendente'}
                    </p>
                  ) : (
                    <p style={{ fontSize: 11, color: '#555', margin: 0 }}>Nenhum treino agendado</p>
                  )}
                </div>
              </div>
              
              {workout && !workout.completed && (
                <button
                  onClick={() => completeWorkout(workout.date, workout.slot)}
                  style={{ padding: '4px 12px', background: `${C.accent}22`, color: C.accent, borderRadius: 6, fontSize: 12, border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Concluir
                </button>
              )}
              {workout?.completed && <CheckCircle size={20} style={{ color: '#10b981' }} />}
            </motion.div>
          );
        })}
      </div>

      <NextWorkoutWidget />
    </div>
  );
};
