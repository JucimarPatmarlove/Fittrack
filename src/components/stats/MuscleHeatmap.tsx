import React, { useMemo, Suspense } from 'react';
import { WorkoutSession } from '../../types';
const MuscleViewer = React.lazy(() => import('../3d/MuscleViewer').then(module => ({ default: module.MuscleViewer })));

export const MuscleHeatmap = ({ workouts }: { workouts: WorkoutSession[] }) => {
    // useMemo protege a RAM de recalcular isto a cada renderização desnecessária
    const muscleStats = useMemo(() => {
        const stats: Record<string, { sets: number; volume: number }> = {
            'Peito': { sets: 0, volume: 0 }, 'Costas': { sets: 0, volume: 0 },
            'Pernas': { sets: 0, volume: 0 }, 'Ombros': { sets: 0, volume: 0 },
            'Bíceps': { sets: 0, volume: 0 }, 'Tríceps': { sets: 0, volume: 0 },
            'Core': { sets: 0, volume: 0 }
        };

        workouts.forEach(w => {
            w.exercises.forEach(ex => {
                if (stats[ex.muscle]) {
                    stats[ex.muscle].sets += ex.sets.length;
                    stats[ex.muscle].volume += ex.sets.reduce((sum, set) => sum + (set.weight * set.reps), 0);
                }
            });
        });
        return stats;
    }, [workouts]);

    const maxVolume = Math.max(...Object.values(muscleStats).map(v => v.volume), 1); // Evita divisão por zero

    // Preparar objeto de fadiga para o modelo 3D (valores de 0.0 a 1.0)
    const fatigueStats = useMemo(() => {
        const stats: Record<string, number> = {};
        for (const [key, val] of Object.entries(muscleStats)) {
            stats[key] = val.volume / maxVolume;
        }
        return stats;
    }, [muscleStats, maxVolume]);

    return (
        <div style={{ background: '#131920', border: '1px solid #1e2832', borderRadius: 12, padding: 16 }}>
            <h3 style={{ fontFamily: "'Bebas Neue'", fontSize: 20, color: '#e8c84a', letterSpacing: 1, marginBottom: 16 }}>
                🔥 DESGASTE MUSCULAR (HEATMAP)
            </h3>

            {/* Muscle 3D Holographic Viewer */}
            <div style={{ marginBottom: 20 }}>
                <Suspense fallback={<div style={{height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#55626e'}}>A carregar mapa muscular...</div>}>
                    <MuscleViewer fatigueStats={fatigueStats} />
                </Suspense>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Object.entries(muscleStats).map(([muscle, stats]) => {
                    const intensity = stats.volume / maxVolume;
                    return (
                        <div key={muscle}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                                <span style={{ color: '#eceae4', fontWeight: 600 }}>{muscle}</span>
                                <span style={{ color: '#55626e', fontFamily: "'DM Mono'" }}>
                                    {stats.sets} séries · {Math.round(stats.volume)}kg
                                </span>
                            </div>
                            <div style={{ width: '100%', background: '#080b0f', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                                <div style={{
                                    width: `${intensity * 100}%`,
                                    height: '100%',
                                    background: `linear-gradient(90deg, #e8c84a22, ${intensity > 0.7 ? '#e84a4a' : '#e8c84a'})`,
                                    transition: 'width 0.5s ease-out'
                                }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};