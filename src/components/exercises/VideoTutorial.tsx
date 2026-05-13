import React from 'react';

const getMuscleImage = (muscle: string) => {
    const m = muscle.toLowerCase();
    if (m === 'peito') return '/assets/images/peito.png';
    if (m === 'costas') return '/assets/images/costas.png';
    if (m === 'ombros') return '/assets/images/ombros.png';
    if (m === 'bíceps' || m === 'tríceps') return '/assets/images/bracos.png';
    if (m === 'pernas' || m === 'panturrilha') return '/assets/images/pernas.png';
    if (m === 'core' || m === 'abdominais') return '/assets/images/core.png';
    // Fallback genérico
    return '/assets/images/core.png'; 
};

export const VideoTutorial = ({ exerciseName, muscle }: { exerciseName: string; muscle: string }) => {
    const getYouTubeUrl = () => {
        const searchQuery = encodeURIComponent(`como fazer ${exerciseName} ${muscle} musculação tutorial`);
        return `https://www.youtube.com/results?search_query=${searchQuery}`;
    };

    return (
        <div style={{ background: 'linear-gradient(135deg, #131920 0%, #0e1318 100%)', borderRadius: 12, padding: 16, marginBottom: 12, border: '1px solid #1e2832' }}>
            {/* Imagem Demonstrativa */}
            <div style={{ marginBottom: 16, width: '100%', height: 140, borderRadius: 10, overflow: 'hidden', position: 'relative', border: '1px solid #e8c84a44' }}>
                <img 
                    src={getMuscleImage(muscle)} 
                    alt={`Treino de ${muscle}`} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} 
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0e1318, transparent)' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 32 }}>🎥</span>
                <div>
                    <div style={{ fontWeight: 600, fontSize: 16, color: '#eceae4' }}>{exerciseName}</div>
                    <div style={{ fontSize: 12, color: '#e8c84a' }}>{muscle}</div>
                </div>
            </div>

            <div style={{ background: '#080b0f', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                <p style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 8, color: '#eceae4' }}>📝 <strong>Checklist Rápido:</strong></p>
                <ol style={{ marginLeft: 20, fontSize: 12, color: '#55626e', lineHeight: 1.6 }}>
                    <li>Mantém a postura (coluna reta, abdómen contraído)</li>
                    <li>Executa o movimento de forma controlada</li>
                    <li>Expira na fase de força, inspira na volta</li>
                    <li>Não bloqueies as articulações no fim do movimento</li>
                </ol>
            </div>

            <a
                href={getYouTubeUrl()} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#e84a4a', color: 'white', textDecoration: 'none', padding: '10px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600 }}
            >
                ▶️ VER VÍDEO DEMONSTRATIVO
            </a>
        </div>
    );
};