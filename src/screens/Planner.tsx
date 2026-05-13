import { motion } from "framer-motion";
import { DualWorkoutCalendar } from '../components/planner/DualWorkoutCalendar';
import { Challenge90Days } from '../components/planner/Challenge90Days';
import { C } from "../data/constants";

export const Planner = () => {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} style={{ padding: "18px", maxWidth: 480, margin: "0 auto", paddingBottom: 100 }}>
            <div style={{ marginBottom: 18 }}>
                <p style={{ fontFamily: "'Bebas Neue'", fontSize: 30, letterSpacing: 2, lineHeight: 1, marginTop: 3, color: '#fff' }}>PLANNER & HÁBITOS</p>
                <p style={{ color: C.muted, fontSize: 12 }}>Agenda a tua disciplina brutal e os teus 90 dias.</p>
            </div>

            <DualWorkoutCalendar />

            <div style={{ marginTop: 20 }}>
                <Challenge90Days />
            </div>

        </motion.div>
    );
};
