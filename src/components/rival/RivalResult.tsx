import React from 'react';
import { motion } from 'framer-motion';
import { C } from '../../data/constants';

export const RivalResult = ({ isWinner, rivalVolume, userVolume, onContinue }: { isWinner: boolean, rivalVolume: number, userVolume: number, onContinue: () => void }) => {
    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(8,11,15,0.95)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24 }}>
            <motion.div 
                initial={{ scale: 0.8, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                transition={{ type: "spring", bounce: 0.5 }}
                style={{ background: C.surface, border: `1px solid ${isWinner ? C.green : C.red}`, borderRadius: 16, padding: 30, maxWidth: 360, width: "100%", textAlign: "center", boxShadow: `0 0 30px ${isWinner ? C.green : C.red}22` }}
            >
                <div style={{ fontSize: 60, marginBottom: 10 }}>{isWinner ? '👑' : '💀'}</div>
                <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 32, color: isWinner ? C.green : C.red, letterSpacing: 2 }}>
                    {isWinner ? 'FANTASMA DERROTADO!' : 'FANTASMA INVICTO!'}
                </h2>
                
                <p style={{ color: C.muted, fontSize: 14, marginTop: 10, marginBottom: 24, lineHeight: 1.4 }}>
                    {isWinner 
                        ? 'Destruíste o treino que fizeste há semanas. Superaste os teus limites com sucesso!' 
                        : 'O teu "eu" do passado provou ser mais forte desta vez. A recuperação é chave!'}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
                    <div style={{ background: C.bg, padding: 12, borderRadius: 8 }}>
                        <p style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>O TEU FANTASMA</p>
                        <p style={{ fontFamily: "'DM Mono'", fontSize: 18, color: C.text }}>{rivalVolume} <span style={{fontSize:10}}>kg/reps</span></p>
                    </div>
                    <div style={{ background: C.bg, padding: 12, borderRadius: 8, border: `1px solid ${isWinner ? C.green : C.red}` }}>
                        <p style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>HOJE</p>
                        <p style={{ fontFamily: "'DM Mono'", fontSize: 18, color: isWinner ? C.green : C.red }}>{userVolume} <span style={{fontSize:10}}>kg/reps</span></p>
                    </div>
                </div>

                <button 
                    onClick={onContinue} 
                    style={{ width: "100%", background: isWinner ? C.green : C.card, color: isWinner ? "#000" : C.text, border: `1px solid ${isWinner ? C.green : C.border}`, borderRadius: 8, padding: 14, fontFamily: "'Bebas Neue'", fontSize: 18, letterSpacing: 1, cursor: "pointer" }}
                >
                    {isWinner ? '+100 XP (RECLAMAR)' : 'ACEITAR DERROTA'}
                </button>
            </motion.div>
        </div>
    );
};
