import React from 'react';
import { motion } from 'framer-motion';
import { C } from '../../data/constants';

interface GhostSetBarProps {
    ghostSet: { exerciseName: string; weight: number; reps: number; date: string } | null;
    currentWeight: number;
    currentReps: number;
    isPR: boolean;
    celebrationTrigger: boolean;
    theme: any;
}

/**
 * GhostSetBar
 * Renders a subtle bar showing the user's previous set (ghost) for comparison
 * Highlights if the current set beats the previous one
 */
export const GhostSetBar: React.FC<GhostSetBarProps> = ({
    ghostSet,
    currentWeight,
    currentReps,
    isPR,
    celebrationTrigger,
    theme,
}) => {
    if (!ghostSet) return null;

    const bettersWeight = currentWeight > ghostSet.weight;
    const bettersReps = currentReps > ghostSet.reps;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{
                background: isPR ? 'rgba(232, 200, 74, 0.1)' : 'rgba(136, 136, 136, 0.08)',
                border: isPR ? '1px solid rgba(232, 200, 74, 0.4)' : '1px solid rgba(136, 136, 136, 0.2)',
                borderRadius: 8,
                padding: 12,
                marginBottom: 12,
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Background glow if PR */}
            {isPR && celebrationTrigger && (
                <motion.div
                    initial={{ opacity: 1, scale: 0.8 }}
                    animate={{ opacity: 0, scale: 1.2 }}
                    transition={{ duration: 0.6 }}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'radial-gradient(circle, rgba(232, 200, 74, 0.2) 0%, transparent 70%)',
                        pointerEvents: 'none',
                    }}
                />
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: 10, color: theme.muted, fontFamily: "'Bebas Neue'" }}>
                    👻 ÚLTIMO TREINO ({ghostSet.date})
                </div>

                <div style={{ display: 'flex', gap: 16, alignItems: 'center', flex: 1 }}>
                    {/* Ghost Weight */}
                    <div style={{ textAlign: 'center' }}>
                        <div
                            style={{
                                fontSize: 11,
                                color: theme.muted,
                                marginBottom: 4,
                            }}
                        >
                            KG
                        </div>
                        <div
                            style={{
                                fontSize: 16,
                                fontFamily: "'DM Mono'",
                                fontWeight: 'bold',
                                color: bettersWeight ? C.green : theme.muted,
                                textDecoration: bettersWeight ? 'none' : 'line-through',
                                opacity: bettersWeight ? 1 : 0.6,
                            }}
                        >
                            {ghostSet.weight}
                        </div>
                    </div>

                    {/* Ghost Reps */}
                    <div style={{ textAlign: 'center' }}>
                        <div
                            style={{
                                fontSize: 11,
                                color: theme.muted,
                                marginBottom: 4,
                            }}
                        >
                            REPS
                        </div>
                        <div
                            style={{
                                fontSize: 16,
                                fontFamily: "'DM Mono'",
                                fontWeight: 'bold',
                                color: bettersReps ? C.green : theme.muted,
                                textDecoration: bettersReps ? 'none' : 'line-through',
                                opacity: bettersReps ? 1 : 0.6,
                            }}
                        >
                            {ghostSet.reps}
                        </div>
                    </div>

                    {/* Status */}
                    {isPR && (
                        <motion.div
                            animate={{ scale: celebrationTrigger ? 1.1 : 1 }}
                            transition={{ type: 'spring', stiffness: 300 }}
                            style={{
                                marginLeft: 'auto',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                background: 'rgba(232, 200, 74, 0.2)',
                                padding: '6px 12px',
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 'bold',
                                color: C.accent,
                                whiteSpace: 'nowrap',
                            }}
                        >
                            🏆 NOVO PR!
                        </motion.div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
