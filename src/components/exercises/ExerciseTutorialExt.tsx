import { AnimatePresence, motion } from 'framer-motion';
import { HelpCircle, Info, Play, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { C } from '../../data/constants';
import { getExerciseMedia } from '../../data/exerciseMedia';

interface ExerciseTutorialProps {
  exercise: {
    name: string;
    tutorial?: string;
    videoUrl?: string;
  };
}

export const ExerciseTutorialExt = ({ exercise }: ExerciseTutorialProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const media = getExerciseMedia(exercise.name);
  const svgUrl = media.imageUrl.replace('.jpg', '.svg');

  // 'loading' -> 'gif' -> 'svg' -> 'error'
  const [mediaState, setMediaState] = useState<'loading' | 'gif' | 'svg' | 'error'>('loading');

  useEffect(() => {
    if (!isOpen) return;
    setMediaState('loading');

    // Testa o GIF
    const imgGif = new Image();
    imgGif.src = media.gifUrl || '';
    imgGif.onload = () => setMediaState('gif');
    imgGif.onerror = () => {
      // Falhou o GIF, tenta o SVG
      const imgSvg = new Image();
      imgSvg.src = svgUrl;
      imgSvg.onload = () => setMediaState('svg');
      imgSvg.onerror = () => setMediaState('error');
    };
  }, [isOpen, exercise.name, media.gifUrl, svgUrl]);

  const handleOpen = (e: any) => {
    e.stopPropagation();
    setIsOpen(true);
  };

  if (!exercise) return null;

  return (
    <>
      <button
        onClick={handleOpen}
        style={{
          padding: 8,
          borderRadius: '50%',
          background: `${C.accent}22`,
          color: C.accent,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <HelpCircle size={18} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 300,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.85)',
              backdropFilter: 'blur(8px)',
              padding: 16,
            }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              style={{
                background: '#0e1318',
                border: `1px solid ${C.border}`,
                borderRadius: 16,
                width: '100%',
                maxWidth: 450,
                maxHeight: '90vh',
                overflowY: 'auto',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  position: 'sticky',
                  top: 0,
                  background: '#0e1318',
                  padding: '16px 20px',
                  borderBottom: `1px solid ${C.border}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  zIndex: 10,
                }}
              >
                <h3
                  style={{
                    fontSize: 24,
                    fontFamily: "'Bebas Neue'",
                    color: C.accent,
                    margin: 0,
                    letterSpacing: 1,
                  }}
                >
                  {exercise.name}
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  style={{
                    background: `${C.bg}88`,
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    color: C.muted,
                    cursor: 'pointer',
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ padding: 20 }}>
                {mediaState === 'loading' && (
                  <div
                    style={{
                      width: '100%',
                      height: 200,
                      borderRadius: 12,
                      overflow: 'hidden',
                      marginBottom: 20,
                      background: '#131920',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `1px solid ${C.border}`,
                    }}
                  >
                    <p style={{ color: C.muted, fontFamily: 'monospace' }}>Carregando media...</p>
                  </div>
                )}

                {mediaState === 'gif' && (
                  <div
                    style={{
                      width: '100%',
                      borderRadius: 12,
                      overflow: 'hidden',
                      marginBottom: 20,
                      background: '#131920',
                      border: `1px solid ${C.border}`,
                    }}
                  >
                    <img
                      src={media.gifUrl}
                      alt={`${exercise.name} execução`}
                      style={{ width: '100%', height: 'auto', display: 'block' }}
                    />
                  </div>
                )}

                {mediaState === 'svg' && (
                  <div
                    style={{
                      width: '100%',
                      height: 200,
                      borderRadius: 12,
                      overflow: 'hidden',
                      marginBottom: 20,
                      position: 'relative',
                    }}
                  >
                    <img
                      src={svgUrl}
                      alt={exercise.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, #0e1318, transparent)',
                      }}
                    />
                  </div>
                )}

                {mediaState === 'error' && (
                  <div
                    style={{
                      width: '100%',
                      height: 200,
                      borderRadius: 12,
                      overflow: 'hidden',
                      marginBottom: 20,
                      background: '#1a1a2e',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `1px dashed ${C.muted}`,
                    }}
                  >
                    <p style={{ color: C.muted, fontFamily: 'monospace' }}>Sem mídia disponível</p>
                  </div>
                )}

                <div style={{ marginBottom: 20 }}>
                  <h4
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      color: '#fff',
                      fontSize: 16,
                      marginBottom: 8,
                      marginTop: 0,
                    }}
                  >
                    <Info size={16} color={C.accent} /> Como executar
                  </h4>
                  <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                    {media.instructions}
                  </p>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <h4 style={{ color: '#fff', fontSize: 16, marginBottom: 8, marginTop: 0 }}>
                    💡 Dicas de Ouro
                  </h4>
                  <ul
                    style={{
                      color: C.muted,
                      fontSize: 13,
                      lineHeight: 1.6,
                      paddingLeft: 20,
                      margin: 0,
                    }}
                  >
                    {media.tips.map((tip, idx) => (
                      <li key={idx} style={{ marginBottom: 4 }}>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <h4
                    style={{
                      color: '#fff',
                      fontSize: 14,
                      marginBottom: 6,
                      marginTop: 0,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                    }}
                  >
                    🎯 Foco Muscular
                  </h4>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {media.muscleGroups.map((m, i) => (
                      <span
                        key={i}
                        style={{
                          background: `${C.accent}15`,
                          color: C.accent,
                          padding: '4px 10px',
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 'bold',
                        }}
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                {(media.videoUrl || exercise.videoUrl) && (
                  <a
                    href={media.videoUrl || exercise.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      background: C.red,
                      color: 'white',
                      textDecoration: 'none',
                      padding: '14px',
                      borderRadius: 12,
                      fontSize: 15,
                      fontWeight: 'bold',
                      width: '100%',
                      boxSizing: 'border-box',
                    }}
                  >
                    <Play size={18} fill="currentColor" /> Ver Demonstração no YouTube
                  </a>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
