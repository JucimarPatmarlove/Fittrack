import { motion } from "framer-motion";
import { DualWorkoutCalendar } from '../components/planner/DualWorkoutCalendar';
import { Challenge90Days } from '../components/planner/Challenge90Days';
import { C } from "../data/constants";

export const Planner = ({ onStartWorkout }: { onStartWorkout?: any }) => {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} style={{ padding: "18px", maxWidth: 480, margin: "0 auto", paddingBottom: 100 }}>
            <div style={{ marginBottom: 18 }}>
                <p style={{ fontFamily: "'Bebas Neue'", fontSize: 30, letterSpacing: 2, lineHeight: 1, marginTop: 3, color: '#fff' }}>PLANNER & HÁBITOS</p>
                <p style={{ color: C.muted, fontSize: 12 }}>Agenda a tua disciplina brutal e os teus 90 dias.</p>
            </div>

            <button
                onClick={() => window.dispatchEvent(new CustomEvent('OPEN_WEEKLY_PLAN'))}
                style={{
                    width: '100%',
                    padding: '16px',
                    marginBottom: '20px',
                    borderRadius: '12px',
                    border: 'none',
                    background: `linear-gradient(135deg, ${C.accent}, #d4a017)`,
                    color: '#000',
                    fontFamily: '"Bebas Neue", sans-serif',
                    fontSize: '1.2rem',
                    letterSpacing: '1px',
                    cursor: 'pointer',
                    boxShadow: `0 4px 15px rgba(232, 200, 74, 0.3)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                }}
            >
                ⚡ MONTAR TREINO SEMANAL
            </button>

            <DualWorkoutCalendar onStartWorkout={onStartWorkout} />

            <div style={{ marginTop: 20 }}>
                <Challenge90Days />
            </div>

        </motion.div>
    );
};
