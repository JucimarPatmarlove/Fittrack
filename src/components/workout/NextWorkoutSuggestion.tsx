// src/components/workout/NextWorkoutSuggestion.tsx
import React, { useMemo } from 'react';
import { WorkoutSession, UserProfile } from '../../types';
import { calculateRecovery } from '../../services/fitnessMechanics';
import { AIWorkoutGenerator } from '../../services/aiGenerator';

interface Props {
    history: WorkoutSession[];
    profile: UserProfile;
    onStartWorkout: (plan: any) => void;
}

export const NextWorkoutSuggestion = ({ history, profile, onStartWorkout }: Props) => {
    // Avalia a recuperação usando a matemática que criámos antes
    const recovery = useMemo(() => calculateRecovery(history), [history]);

    // Gera o plano com base nos músculos recuperados e no histórico (DUP)
    const suggestion = useMemo(() => AIWorkoutGenerator.generateWorkout(recovery, profile, history), [recovery, profile, history]);

    if (!suggestion) {
        return (
            <div style={{ background: '#131920', border: '1px solid #1e2832', borderRadius: 12, padding: 20, textAlign: 'center', marginBottom: 20 }}>
                <span style={{ fontSize: 40, display: 'block', marginBottom: 10 }}>🛌</span>
                <h3 style={{ color: '#eceae4', fontFamily: "'Bebas Neue'", fontSize: 22, letterSpacing: 1 }}>DIA DE DESCANSO</h3>
                <p style={{ color: '#55626e', fontSize: 13, marginTop: 5 }}>Os teus músculos estão em recuperação. Faz um cardio leve ou descansa.</p>
            </div>
        );
    }

    return (
        <div style={{ background: 'linear-gradient(135deg, #131920 0%, #0e1318 100%)', border: '1px solid #e8c84a', borderRadius: 12, padding: 16, marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, background: '#e8c84a', color: '#000', padding: '4px 12px', fontSize: 10, fontWeight: 800, fontFamily: "'DM Mono'", borderBottomLeftRadius: 8 }}>
                💡 IA RECOMENDA
            </div>

            <h3 style={{ color: '#e8c84a', fontSize: 18, marginBottom: 8, marginTop: 10 }}>{suggestion.label}</h3>
            <p style={{ color: '#eceae4', fontSize: 13, marginBottom: 16 }}>
                {suggestion.exercises.join(' · ')}
            </p>

            <button
                onClick={() => onStartWorkout(suggestion)}
                style={{ width: '100%', background: '#e8c84a', color: '#000', border: 'none', borderRadius: 8, padding: '12px', fontFamily: "'Bebas Neue'", fontSize: 18, cursor: 'pointer', letterSpacing: 1 }}
            >
                COMEÇAR TREINO IA →
            </button>
        </div>
    );
};