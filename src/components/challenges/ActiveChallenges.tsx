import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Challenge } from '../../services/predictiveChallenges';
import { C } from '../../data/constants';
import { DeadHangWidget } from './DeadHangWidget';

export const ActiveChallenges = ({ challenges, onChallengeComplete }: { challenges: Challenge[], onChallengeComplete?: (id: string) => void }) => {
    const activeCs = challenges.filter(c => c.status === 'active');
    
    if (activeCs.length === 0) return null;

    const getTimeLeft = (isoString: string) => {
        const hrs = Math.max(0, (new Date(isoString).getTime() - new Date().getTime()) / 3600000);
        if (hrs > 24) return `${Math.floor(hrs / 24)} dias`;
        return `${Math.floor(hrs)} horas`;
    };

    return (
        <div style={{ marginBottom: 20 }}>
            <p style={{ fontFamily: "'Bebas Neue'", fontSize: 16, letterSpacing: 2, color: C.muted, marginBottom: 10 }}>DESAFIOS DA IA PREDITIVA</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {activeCs.map((c, i) => (
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                        key={c.id} className="glass" style={{ padding: 14, borderLeft: `3px solid ${C.accent}` }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 20 }}>{c.type === 'strength' ? '🏋️' : c.type === 'trending' ? '🔥' : '⏱️'}</span>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <h4 style={{ fontSize: 15, color: C.text, margin: 0 }}>{c.title}</h4>
                                        {c.type === 'trending' && (
                                            <span style={{ background: '#ff4d4d22', color: '#ff4d4d', fontSize: 9, fontWeight: 'bold', padding: '2px 6px', borderRadius: 4, fontFamily: "'DM Mono'" }}>
                                                TRENDING 2026
                                            </span>
                                        )}
                                    </div>
                                    <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{c.description}</p>
                                </div>
                            </div>
                            <div style={{ background: C.accentLow, color: C.accent, padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 'bold' }}>
                                +{c.xpReward} XP
                            </div>
                        </div>
                        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.muted }}>
                            <span>Expira em: <strong style={{ color: C.red }}>{getTimeLeft(c.deadline)}</strong></span>
                        </div>
                        
                        {c.targetExercise === 'Dead Hang' && (
                            <DeadHangWidget 
                                targetSeconds={c.targetValue} 
                                onSuccess={() => onChallengeComplete && onChallengeComplete(c.id)} 
                            />
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
