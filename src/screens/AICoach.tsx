// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { C } from '../data/constants';
import { AnthropicService } from '../services/anthropicService';
import { useLS } from '../hooks';
import { sanitizeText } from '../utils/sanitize';
import { NeuralFatigue } from '../services/neuralFatigue';
import { useMilestonesStore } from '../stores/useMilestonesStore';

export default function AICoach({ history, profile }: any) {
    const [messages, setMessages] = useLS<any[]>('coach_chat', [
        { role: 'assistant', text: 'Eu sou a Inteligência Tática Fittrack (Motor Claude). Partilha as tuas dores ou pede re-periodização baseada no teu histórico.' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;
        
        const userMsg = sanitizeText(input.trim());
        setInput('');
        
        const newMsgs = [...messages, { role: 'user', text: userMsg }];
        setMessages(newMsgs);
        setLoading(true);

        const responseText = await AnthropicService.askCoach(userMsg, history);
        
        setMessages([...newMsgs, { role: 'assistant', text: responseText }]);
        setLoading(false);
    };

    const handleExportPrompt = () => {
        const lastWorkouts = history.slice(-5).map((w: any) => `${w.dayLabel}`).join(', ');
        const totalVolume = history.slice(-7).reduce((a: any, w: any) => a + (w.totalVolume || 0), 0);
        const readiness = NeuralFatigue.calculateReadiness(history);
        const prs = useMilestonesStore.getState().personalRecords || {};
        const prText = Object.entries(prs).map(([k, v]) => `${k} = ${v}kg`).join(', ');

        const promptText = `Sou utilizador do FitTrack V7. Os meus dados:

- Género: ${profile?.gender || 'Não especificado'}
- Idade: ${profile?.age || 25}
- Objetivo: ${profile?.goal || 'Hipertrofia'}
- Nível: ${profile?.level || 'Iniciante'}
- Filosofia de Treino: ${profile?.philosophy || 'Clássico'}
- Últimos treinos: ${lastWorkouts || 'Nenhum'}
- Volume acumulado recente: ${totalVolume}kg
- Readiness Score (fadiga neural): ${readiness.score} (${readiness.label})

Os meus PRs: ${prText || 'Nenhum registado'}.

Com base nestes dados, recomenda-me:
- Devo aumentar carga em algum exercício?
- Preciso de um deload?
- Qual a melhor periodização para as próximas 4 semanas?

(Responde em markdown, com justificação científica.)`;
        
        navigator.clipboard.writeText(promptText);
        alert('Prompt copiado para a área de transferência! Cola no ChatGPT, Claude ou Gemini.');
    };

    return (
        <div style={{ padding: "18px", maxWidth: 480, margin: "0 auto", height: "calc(100vh - 80px)", display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 30 }}>🧠</span>
                    <div>
                        <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 24, letterSpacing: 2, margin: 0, color: C.accent }}>NEURAL COACH</h2>
                        <p style={{ fontSize: 10, color: C.muted, margin: 0 }}>INTEGRAÇÃO CLAUDE DE ANÁLISE DE HISTÓRICO</p>
                    </div>
                </div>
                <button onClick={handleExportPrompt} style={{ background: C.card, color: '#fff', border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    📋 Exportar Prompt
                </button>
            </div>

            {/* API Key agora gerida no servidor BFF — sem necessidade de configuração no cliente */}

            <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 20 }}>
                {messages.map((m, i) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        key={i} 
                        style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}
                    >
                        <div style={{ 
                            background: m.role === 'user' ? C.accent : C.card, 
                            color: m.role === 'user' ? '#000' : C.text,
                            padding: '12px 16px', borderRadius: 16, borderBottomRightRadius: m.role === 'user' ? 4 : 16, borderBottomLeftRadius: m.role === 'assistant' ? 4 : 16,
                            fontSize: 14, border: m.role === 'assistant' ? `1px solid ${C.border}` : 'none',
                            lineHeight: 1.4
                        }}>
                            {m.text}
                        </div>
                    </motion.div>
                ))}
                {loading && (
                    <div style={{ alignSelf: 'flex-start', background: C.card, padding: '12px 16px', borderRadius: 16, borderBottomLeftRadius: 4, color: C.accent }}>
                        <span style={{ fontFamily: "'DM Mono'" }}>Processando telemetria...</span>
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
                <input 
                    value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder="Quais exercícios deves trocar?"
                    style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 24, padding: '0 16px', color: C.text, fontSize: 14 }}
                />
                <button 
                    onClick={handleSend} disabled={loading}
                    style={{ background: C.accent, color: '#000', border: 'none', width: 44, height: 44, borderRadius: 22, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', opacity: loading ? 0.5 : 1 }}
                >
                    ➤
                </button>
            </div>
        </div>
    );
}
