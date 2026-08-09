// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';
import { RivalState, RivalAI } from '../../services/rivalAI';
import { C } from '../../data/constants';

export const RivalRace = ({ rivalState, elapsed, currentVolume }: { rivalState: RivalState, elapsed: number, currentVolume: number }) => {
    if (!rivalState.found) return null;

    const ghostProgress = RivalAI.getGhostProgress(rivalState, elapsed) * 100;
    const userProgress = RivalAI.getUserProgress(currentVolume, rivalState) * 100;
    const isWinning = userProgress >= ghostProgress;

    return (
        <div style={{ background: C.card, border: `1px solid ${isWinning ? C.green : C.red}`, borderRadius: 12, padding: 12, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 11, fontWeight: 600 }}>
                <span style={{ color: C.muted }}>👻 GHOST RIVAL (TU HÁ 1 SEMANA)</span>
                <span style={{ color: isWinning ? C.green : C.red }}>
                    {isWinning ? 'A GANHAR!' : 'FICA PARA TRÁS...'}
                </span>
            </div>
            
            {/* Pista do Ghost */}
            <div style={{ position: 'relative', height: 28, background: C.bg, borderRadius: 14, overflow: 'hidden', marginBottom: 6 }}>
                <motion.div 
                    animate={{ width: `${ghostProgress}%` }} 
                    transition={{ ease: "linear", duration: 1 }}
                    style={{ position: 'absolute', top: 0, left: 0, height: '100%', background: C.dim, borderRadius: 14, borderRight: `2px solid ${C.muted}` }}
                />
                <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: C.muted, zIndex: 2 }}>{Math.round(ghostProgress)}%</span>
            </div>

            {/* Pista do Utilizador */}
            <div style={{ position: 'relative', height: 28, background: C.bg, borderRadius: 14, overflow: 'hidden' }}>
                <motion.div 
                    animate={{ width: `${userProgress}%` }} 
                    transition={{ ease: "easeOut", duration: 0.5 }}
                    style={{ position: 'absolute', top: 0, left: 0, height: '100%', background: isWinning ? C.green : C.accent, borderRadius: 14 }}
                />
                <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: '#000', fontWeight: 'bold', zIndex: 2 }}>{Math.round(userProgress)}%</span>
            </div>
        </div>
    );
};
