// src/hooks/usePoseCounter.ts
import { useCallback, useRef, useState } from 'react';

function calculateAngle(a: any, b: any, c: any): number {
  if (!a || !b || !c) return 0;
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) {
    angle = 360.0 - angle;
  }
  return angle;
}

export function usePoseCounter(mode: 'squat' | 'push' = 'squat') {
  const [reps, setReps] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Guardar estado interno sem forçar re-render a cada micro-frame
  const stageRef = useRef<'up' | 'down'>('up');
  const lastRepTimeRef = useRef<number>(0);

  const processLandmarks = useCallback(
    (landmarks: any[]) => {
      if (!landmarks || landmarks.length < 28) return;

      try {
        let angle = 0;

        if (mode === 'squat') {
          // Rastrear lado esquerdo (Anca: 23, Joelho: 25, Tornozelo: 27)
          const hip = landmarks[23];
          const knee = landmarks[25];
          const ankle = landmarks[27];

          // Garantir visibilidade mínima
          if (hip?.visibility < 0.5 || knee?.visibility < 0.5) return;

          angle = calculateAngle(hip, knee, ankle);

          // Lógica de Estado de Agachamento
          if (angle > 160) {
            if (stageRef.current === 'down') {
              const now = Date.now();
              if (now - lastRepTimeRef.current > 1000) {
                // Evitar duplicação instantânea
                setReps((r) => r + 1);
                setFeedback('✓ BOA PROFUNDIDADE!');
                lastRepTimeRef.current = now;
              }
            }
            stageRef.current = 'up';
          }
          if (angle < 100) {
            // Passou o paralelo
            stageRef.current = 'down';
            setFeedback('⬇ SOBE FORTE!');
          }
        } else {
          // Rastrear Pushes (Ombro: 11, Cotovelo: 13, Pulso: 15)
          const shoulder = landmarks[11];
          const elbow = landmarks[13];
          const wrist = landmarks[15];

          if (shoulder?.visibility < 0.5 || elbow?.visibility < 0.5) return;

          angle = calculateAngle(shoulder, elbow, wrist);

          if (angle > 160) {
            if (stageRef.current === 'down') {
              const now = Date.now();
              if (now - lastRepTimeRef.current > 800) {
                setReps((r) => r + 1);
                setFeedback('✓ CONTRAÇÃO MÁXIMA!');
                lastRepTimeRef.current = now;
              }
            }
            stageRef.current = 'up';
          }
          if (angle < 75) {
            // Braço dobrado
            stageRef.current = 'down';
            setFeedback('⬆ EMPURRA!');
          }
        }
      } catch (e) {
        // Ignorar erros de frames corrompidas
      }
    },
    [mode],
  );

  const resetReps = useCallback(() => {
    setReps(0);
    setFeedback(null);
    stageRef.current = 'up';
  }, []);

  return {
    reps,
    feedback,
    processLandmarks,
    resetReps,
  };
}
