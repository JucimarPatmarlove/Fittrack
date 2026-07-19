import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Calendar as CalendarIcon, CheckCircle, Play } from 'lucide-react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useDualWorkoutStore } from '../../stores/useDualWorkoutStore';
import { usePlanStore } from '../../stores/usePlanStore';
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

export const DualWorkoutCalendar = ({ onStartWorkout }: { onStartWorkout?: any }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { getWorkoutsForDate, completeWorkout } = useDualWorkoutStore();
  const { currentPlan } = usePlanStore();
  const year = selectedDate.getFullYear();
  const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
  const day = String(selectedDate.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
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
          let exercisesList: string[] = [];
          let rawDayPlan: any = null;
          
          if (workout && currentPlan && workout.workoutId === currentPlan.id) {
            rawDayPlan = currentPlan.workouts.find(w => workout.workoutName.includes(w.focus));
            if (rawDayPlan) {
              exercisesList = rawDayPlan.exercises || [];
            }
          }

          return (
            <motion.div
              key={slot}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: C.bg, borderRadius: 8 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                <Icon size={20} style={{ color }} />
                <div>
                  <p style={{ fontSize: 14, fontWeight: 'bold', margin: 0, color: '#fff' }}>{label}</p>
                  {workout ? (
                    <div>
                      <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>
                        {workout.workoutName} • {workout.completed ? '✔️ Concluído' : '⏳ Pendente'}
                      </p>
                      {exercisesList.length > 0 && (
                        <p style={{ fontSize: 10, color: '#888', marginTop: 4, maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {exercisesList.join(', ')}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p style={{ fontSize: 11, color: '#555', margin: 0 }}>Nenhum treino agendado</p>
                  )}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 6 }}>
                {workout && !workout.completed && onStartWorkout && rawDayPlan && (
                  <button
                    onClick={() => onStartWorkout({ id: `day_${workout.id}`, label: `${rawDayPlan.day}: ${rawDayPlan.focus}`, exercises: rawDayPlan.exercises })}
                    style={{ padding: '4px 8px', background: C.accent, color: '#000', borderRadius: 6, fontSize: 12, border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <Play size={12} /> Iniciar
                  </button>
                )}
                {workout && !workout.completed && (
                  <button
                    onClick={() => completeWorkout(workout.date, workout.slot)}
                    style={{ padding: '4px 12px', background: `${C.accent}22`, color: C.accent, borderRadius: 6, fontSize: 12, border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Concluir
                  </button>
                )}
                {workout?.completed && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {onStartWorkout && rawDayPlan && (
                      <button
                        onClick={() => onStartWorkout({ id: `day_${workout.id}_redo`, label: `${rawDayPlan.day}: ${rawDayPlan.focus} (Refazer)`, exercises: rawDayPlan.exercises })}
                        style={{ padding: '4px 8px', background: 'transparent', border: `1px solid ${C.accent}`, color: C.accent, borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        Ver / Refazer
                      </button>
                    )}
                    <CheckCircle size={20} style={{ color: '#10b981' }} />
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <NextWorkoutWidget />
    </div>
  );
};
