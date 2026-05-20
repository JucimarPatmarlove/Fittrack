import React, { useState, useEffect, useRef } from 'react';
import { getExerciseMedia } from '../../data/exerciseMedia';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { useAudioCoach } from '../../hooks/useAudioCoach';

export const VideoTutorial = ({ exerciseName, muscle }: { exerciseName: string; muscle: string }) => {
    const media = getExerciseMedia(exerciseName);
    const svgUrl = media.imageUrl.replace('.jpg', '.svg');
    const [mediaState, setMediaState] = useState<'loading' | 'gif' | 'svg' | 'error'>('loading');

    // Audio Coaching Integration
    const { speak } = useAudioCoach(true);
    const hasSpoken = useRef(false);

    useEffect(() => {
        if (!hasSpoken.current) {
            speak(`Análise Cinética iniciada. Foco muscular: ${muscle}.`, true);
            hasSpoken.current = true;
        }
    }, [exerciseName, muscle, speak]);

    // Framer Motion 3D Parallax logic
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 });
    const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 });
    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['10deg', '-10deg']);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-10deg', '10deg']);
    const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ['100%', '0%']);
    const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ['100%', '0%']);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    useEffect(() => {
        setMediaState('loading');
        const imgSvg = new Image();
        imgSvg.src = svgUrl;
        imgSvg.onload = () => setMediaState('svg');
        imgSvg.onerror = () => {
            if (media.gifUrl) {
                const imgGif = new Image();
                imgGif.src = media.gifUrl;
                imgGif.onload = () => setMediaState('gif');
                imgGif.onerror = () => setMediaState('error');
            } else {
                setMediaState('error');
            }
        };
    }, [exerciseName, media.gifUrl, svgUrl]);

    const getYouTubeUrl = () => {
        const searchQuery = encodeURIComponent(`como fazer ${exerciseName} ${muscle} musculação tutorial`);
        return `https://www.youtube.com/results?search_query=${searchQuery}`;
    };

    return (
        <div style={{ paddingBottom: 16 }}>
            <motion.div
                style={{
                    background: 'linear-gradient(135deg, #131920 0%, #0e1318 100%)',
                    borderRadius: 12,
                    padding: 16,
                    border: '1px solid #1e2832',
                    position: 'relative',
                    perspective: 1000,
                    transformStyle: 'preserve-3d',
                    rotateX,
                    rotateY,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
                {/* Dynamic Glare Overlay */}
                <motion.div
                    style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        borderRadius: 12,
                        background: 'radial-gradient(circle at var(--gx) var(--gy), rgba(255,255,255,0.08) 0%, transparent 60%)',
                        pointerEvents: 'none',
                        zIndex: 10,
                        // @ts-ignore
                        '--gx': glareX,
                        '--gy': glareY
                    }}
                />

                {/* Media Container */}
                <div style={{ transform: 'translateZ(30px)' }}>
                    {mediaState === 'loading' && (
                        <div style={{ marginBottom: 16, width: '100%', height: 200, borderRadius: 10, background: '#0e1318', border: '1px solid #e8c84a44', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <p style={{ color: '#55626e', fontFamily: 'monospace' }}>Sincronizando Sistema Neural...</p>
                        </div>
                    )}
                    {mediaState === 'gif' && (
                        <div style={{ marginBottom: 16, width: '100%', height: 'auto', borderRadius: 10, overflow: 'hidden', border: '1px solid #e8c84a44', background: '#131920' }}>
                            <img src={media.gifUrl} alt={`Execução de ${exerciseName}`} style={{ width: '100%', height: 'auto', display: 'block' }} />
                        </div>
                    )}
                    {mediaState === 'svg' && (
                        <div style={{ marginBottom: 16, width: '100%', height: 'auto', borderRadius: 10, overflow: 'hidden', border: '1px solid #38bdf844', background: '#131920', boxShadow: '0 0 15px rgba(56, 189, 248, 0.1)' }}>
                            <img src={svgUrl} alt={`Execução de ${exerciseName}`} style={{ width: '100%', height: 'auto', display: 'block' }} />
                        </div>
                    )}
                    {mediaState === 'error' && (
                        <div style={{ marginBottom: 16, width: '100%', height: 200, borderRadius: 10, background: '#0e1318', border: '1px dashed #ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <p style={{ color: '#ef4444', fontFamily: 'monospace' }}>Falha na Matriz de Dados</p>
                        </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <span style={{ fontSize: 32 }}>🦾</span>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: 16, color: '#eceae4' }}>{exerciseName}</div>
                            <div style={{ fontSize: 12, color: '#e8c84a', letterSpacing: 1, fontFamily: 'monospace' }}>ALVO KINETIC: {muscle.toUpperCase()}</div>
                        </div>
                    </div>

                    <div style={{ background: '#080b0f', borderRadius: 8, padding: 12, marginBottom: 12, borderLeft: '2px solid #e8c84a' }}>
                        <p style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 8, color: '#38bdf8', fontFamily: 'monospace' }}>[+] Parâmetros de Execução:</p>
                        <ol style={{ marginLeft: 20, fontSize: 12, color: '#eceae4', lineHeight: 1.6, opacity: 0.8 }}>
                            <li>Alinhamento biomecânico (coluna reta, core ativo)</li>
                            <li>Fase concêntrica explosiva, excêntrica controlada</li>
                            <li>Respiração sistêmica sincronizada</li>
                            <li>Amplitude de movimento completa requerida</li>
                        </ol>
                    </div>

                    <a
                        href={getYouTubeUrl()} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', textDecoration: 'none', padding: '10px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, letterSpacing: 1, transition: 'all 0.2s' }}
                    >
                        [ ACESSAR BANCO DE VÍDEO EXTERNO ]
                    </a>
                </div>
            </motion.div>
        </div>
    );
};