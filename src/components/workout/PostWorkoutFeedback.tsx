// @ts-nocheck
import React, { useState } from 'react';
import { estimateCaloriesBurned } from '../../services/fitnessMechanics';
import { ProgressionSystem } from '../../services/ProgressionSystem';
import { EffortTracker } from './EffortTracker';

export const PostWorkoutFeedback = ({ onSubmit, profile, workoutData }: { onSubmit: (feedback: any) => void, profile?: any, workoutData?: any }) => {
    const [feedback, setFeedback] = useState({
        difficulty: 'good',
        energy: 3,
        pain: false,
        enjoyment: 4,
        notes: ''
    } as any);

    const calories = workoutData ? estimateCaloriesBurned(workoutData, profile || { weight: 70 }) : 0;
    const adaptation = ProgressionSystem.adaptFromFeedback(feedback);

    return (
        <div className="glass" style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: 400, padding: 24, zIndex: 500 }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <h3 style={{ color: '#eceae4', fontFamily: "'Bebas Neue'", fontSize: 28, letterSpacing: 1 }}>TREINO CONCLUÍDO! 🎉</h3>
                <p style={{ color: '#e8c84a', fontSize: 16, fontWeight: 'bold' }}>🔥 {calories} kcal queimadas</p>
            </div>

            <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: '#55626e' }}>Dificuldade</label>
                <div style={{ display: 'flex', gap: 10, marginTop: 5 }}>
                    {['easy', 'good', 'hard'].map(level => (
                        <button
                            key={level}
                            onClick={() => setFeedback({ ...feedback, difficulty: level })}
                            style={{ flex: 1, background: feedback.difficulty === level ? '#e8c84a22' : '#080b0f', border: `1px solid ${feedback.difficulty === level ? '#e8c84a' : '#1e2832'}`, borderRadius: 8, padding: 8, cursor: 'pointer', color: '#eceae4', fontSize: 12 }}
                        >
                            {level === 'easy' && '😊 Fácil'}
                            {level === 'good' && '👍 Ideal'}
                            {level === 'hard' && '😅 Pesado'}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: '#55626e' }}>Nível de energia (1 a 5)</label>
                <input
                    type="range" min="1" max="5" value={feedback.energy}
                    onChange={(e) => setFeedback({ ...feedback, energy: parseInt(e.target.value) })}
                    style={{ width: '100%', marginTop: 8 }}
                />
            </div>

            {/* AI SUGGESTION BOX */}
            <div style={{ background: '#080b0f', border: `1px solid ${adaptation.action === 'increase' ? '#3dd68c' : adaptation.action === 'change' ? '#e84a4a' : '#4a9ee8'}`, borderRadius: 8, padding: 12, marginBottom: 20 }}>
                <p style={{ color: '#eceae4', fontSize: 13, fontWeight: 'bold', marginBottom: 4 }}>🤖 Feedback da IA Fittrack:</p>
                <p style={{ color: '#55626e', fontSize: 12 }}>{adaptation.suggestion}</p>
            </div>

            <div style={{ marginBottom: 20 }}>
                <EffortTracker 
                    workoutDurationMinutes={workoutData?.durationMinutes || 45} 
                    onEffortLogged={() => onSubmit(feedback)} 
                />
            </div>
        </div>
    );
};