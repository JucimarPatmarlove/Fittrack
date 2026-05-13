import React, { useState } from 'react';

export interface AssessmentData {
    fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
    availableEquipment: string[];
    injuries: string[];
    weeklyAvailability: number;
    preferredWorkoutDuration: number;
    mainLimitation: 'time' | 'equipment' | 'knowledge' | 'injury' | 'motivation';
}

export const FitnessAssessment = ({ onComplete }: { onComplete: (data: AssessmentData) => void }) => {
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<Partial<AssessmentData>>({});

    const questions: any[] = [
        {
            key: "fitnessLevel",
            question: "Qual o teu nível de experiência com exercícios?",
            options: [
                { value: "beginner", label: "Iniciante", desc: "Nunca treinei ou menos de 3 meses" },
                { value: "intermediate", label: "Intermédio", desc: "Treino há 6-12 meses" },
                { value: "advanced", label: "Avançado", desc: "Treino há mais de 1 ano" }
            ]
        },
        {
            key: "availableEquipment",
            question: "A que equipamentos tens acesso?",
            multiple: true,
            options: [
                { value: "bodyweight", label: "Apenas peso corporal", icon: "🧘" },
                { value: "dumbbells", label: "Halteres", icon: "🏋️" },
                { value: "barbell", label: "Barra", icon: "🏋️‍♂️" },
                { value: "bands", label: "Elásticos", icon: "🪢" },
                { value: "machine", label: "Máquinas de ginásio", icon: "🏭" }
            ]
        },
        {
            key: "preferredWorkoutDuration",
            question: "Quanto tempo tens por treino?",
            options: [
                { value: 20, label: "20 minutos", desc: "Treinos rápidos" },
                { value: 30, label: "30 minutos", desc: "Treinos eficientes" },
                { value: 45, label: "45 minutos", desc: "Treinos completos" },
                { value: 60, label: "60+ minutos", desc: "Treinos extensos" }
            ]
        },
        {
            key: "mainLimitation",
            question: "Qual a tua maior dificuldade?",
            options: [
                { value: "time", label: "Falta de tempo", icon: "⏰" },
                { value: "equipment", label: "Poucos equipamentos", icon: "🔧" },
                { value: "knowledge", label: "Não sei os exercícios", icon: "📚" },
                { value: "injury", label: "Lesões/dores", icon: "🤕" },
                { value: "motivation", label: "Motivação/consistência", icon: "💪" }
            ]
        },
        {
            key: "injuries",
            question: "Tens alguma lesão ou limitação?",
            type: "text",
            placeholder: "Ex: dor no ombro, problemas na coluna..."
        }];

    const currentQuestion = questions[step];

    const handleNext = () => {
        if (step < questions.length - 1) {
            setStep(step + 1);
        } else {
            onComplete(answers as AssessmentData);
        }
    };

    const handleSelect = (value: any) => {
        if (currentQuestion.multiple) {
            const currentAnswers = (answers as any)[currentQuestion.key] as string[] || [];
            if (currentAnswers.includes(value)) {
                setAnswers({ ...answers, [currentQuestion.key]: currentAnswers.filter(a => a !== value) });
            } else {
                setAnswers({ ...answers, [currentQuestion.key]: [...currentAnswers, value] });
            }
        } else {
            setAnswers({ ...answers, [currentQuestion.key]: value });
            if (currentQuestion.type !== 'text') {
                // optionally auto-next
            }
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: '#080b0f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 200 }}>
            <div style={{ maxWidth: 480, width: '100%' }}>
                <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 24, color: '#e8c84a', marginBottom: 16 }}>
                    {currentQuestion.question}
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {currentQuestion.type === 'text' ? (
                        <input
                            type="text"
                            placeholder={currentQuestion.placeholder}
                            value={((answers as any)[currentQuestion.key] as string[])?.[0] || ''}
                            onChange={(e) => setAnswers({ ...answers, [currentQuestion.key]: [e.target.value] })}
                            style={{ padding: 12, borderRadius: 8, border: '1px solid #1e2832', background: '#131920', color: '#eceae4', width: '100%' }}
                        />
                    ) : (
                        currentQuestion.options?.map((opt: any) => {
                            const isSelected = currentQuestion.multiple 
                                ? ((answers as any)[currentQuestion.key] || []).includes(opt.value)
                                : (answers as any)[currentQuestion.key] === opt.value;

                            return (
                                <button
                                    key={opt.value}
                                    onClick={() => handleSelect(opt.value)}
                                    style={{
                                        padding: 16, 
                                        borderRadius: 8, 
                                        background: isSelected ? '#1e2832' : '#131920', 
                                        border: `1px solid ${isSelected ? '#e8c84a' : '#1e2832'}`, 
                                        color: '#eceae4', 
                                        textAlign: 'left', 
                                        cursor: 'pointer'
                                    }}
                                >
                                    {opt.icon && <span style={{ marginRight: 8 }}>{opt.icon}</span>}
                                    {opt.label}
                                    {opt.desc && <div style={{ fontSize: 12, color: '#55626e', marginTop: 4 }}>{opt.desc}</div>}
                                </button>
                            );
                        })
                    )}
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                    {step > 0 && (
                        <button
                            onClick={() => setStep(step - 1)}
                            style={{ flex: 1, padding: 12, background: 'transparent', color: '#55626e', border: '1px solid #1e2832', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}
                        >
                            Voltar
                        </button>
                    )}
                    <button
                        onClick={handleNext}
                        style={{ flex: 2, padding: 12, background: '#e8c84a', color: '#000', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        {step < questions.length - 1 ? 'Próximo' : 'Concluir'}
                    </button>
                </div>
            </div>
        </div>
    );
};
