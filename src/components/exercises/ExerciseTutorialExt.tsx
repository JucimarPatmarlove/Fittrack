import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X, Play, FileText } from 'lucide-react';
import { C } from '../../data/constants';

interface ExerciseTutorialProps {
  exercise: {
    name: string;
    tutorial: string;
    videoUrl: string;
  };
}

export const ExerciseTutorialExt = ({ exercise }: ExerciseTutorialProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showVideo, setShowVideo] = useState(true);
  
  if (!exercise || (!exercise.tutorial && !exercise.videoUrl)) return null;

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
        style={{ padding: 8, borderRadius: '50%', background: `${C.accent}22`, color: C.accent, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <HelpCircle size={18} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(5px)' }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{ background: C.card, borderRadius: 12, width: '90%', maxWidth: 500, maxHeight: '80vh', overflowY: 'auto' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ position: 'sticky', top: 0, background: C.card, padding: 16, borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 20, fontFamily: "'Bebas Neue'", color: C.accent, margin: 0 }}>{exercise.name}</h3>
                <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: C.text, cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>
              
              <div style={{ padding: 16 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <button
                    onClick={() => setShowVideo(true)}
                    style={{ flex: 1, padding: '10px', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: 'none', cursor: 'pointer', fontWeight: 'bold', background: showVideo ? C.accent : C.bg, color: showVideo ? C.bg : C.text }}
                  >
                    <Play size={16} /> Vídeo
                  </button>
                  <button
                    onClick={() => setShowVideo(false)}
                    style={{ flex: 1, padding: '10px', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: 'none', cursor: 'pointer', fontWeight: 'bold', background: !showVideo ? C.accent : C.bg, color: !showVideo ? C.bg : C.text }}
                  >
                    <FileText size={16} /> Detalhes
                  </button>
                </div>
                
                {showVideo && exercise.videoUrl ? (
                  <div style={{ aspectRatio: '16/9', background: '#000', borderRadius: 8, overflow: 'hidden' }}>
                    <iframe
                      src={exercise.videoUrl.replace('watch?v=', 'embed/')}
                      style={{ width: '100%', height: '100%', border: 'none' }}
                      allowFullScreen
                      allow="autoplay; encrypted-media"
                    />
                  </div>
                ) : (
                  <div style={{ background: C.bg, padding: 16, borderRadius: 8 }}>
                    <pre style={{ whiteSpace: 'pre-wrap', fontSize: 14, fontFamily: 'sans-serif', lineHeight: 1.6, color: C.text, margin: 0 }}>
                      {exercise.tutorial || "Sem doc escrita."}
                    </pre>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
