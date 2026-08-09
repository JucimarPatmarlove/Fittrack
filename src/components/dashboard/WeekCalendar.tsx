// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';
import { C } from '../../data/constants';
import { WorkoutSession } from "../../db/schema";;

export const WeekCalendar = ({ history }: { history: WorkoutSession[] }) => {
    // Obter data base
    const today = new Date();
    const currentDayIndex = today.getDay(); // 0(Dom) a 6(Sab)
    
    // Calcular os 7 dias da semana corrente (Domingo a Sábado)
    const weekDays = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - currentDayIndex + i);
        return d;
    });

    const isSameDate = (d1: Date, d2: Date) => 
        d1.getFullYear() === d2.getFullYear() && 
        d1.getMonth() === d2.getMonth() && 
        d1.getDate() === d2.getDate();

    const shortDays = ['Do', 'Se', 'Te', 'Qa', 'Qi', 'Se', 'Sa'];

    return (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px", marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {weekDays.map((date, i) => {
                    const isToday = isSameDate(date, today);
                    // Ver se treinou neste dia
                    const trainedThisDay = history.some(w => isSameDate(new Date(w.date), date));
                    const isFuture = date.getTime() > today.getTime() && !isToday;

                    return (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: isFuture ? 0.4 : 1 }}>
                            <span style={{ fontSize: 10, color: C.muted }}>{shortDays[i]}</span>
                            <motion.div 
                                whileHover={{ scale: 1.1 }}
                                style={{ 
                                    width: 32, height: 32, borderRadius: 16, 
                                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                                    fontSize: 12, fontWeight: 'bold',
                                    background: trainedThisDay ? C.accent : (isToday ? C.surface : 'transparent'),
                                    color: trainedThisDay ? '#000' : (isToday ? C.text : C.muted),
                                    border: isToday && !trainedThisDay ? `1px solid ${C.accent}` : `1px solid transparent`
                                }}
                            >
                                {date.getDate()}
                            </motion.div>
                            {trainedThisDay && (
                                <div style={{ width: 4, height: 4, borderRadius: 2, background: C.green }} />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
