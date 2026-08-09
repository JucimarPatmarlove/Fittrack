// @ts-nocheck
import React, { useState, useEffect } from "react";

interface Props {
  startTime: number;
  targetReps: number;
  currentRep: number;
}

export const PaceTracker = ({ startTime, targetReps, currentRep }: Props) => {
  const [pace, setPace] = useState<number | null>(null);

  useEffect(() => {
    if (currentRep > 0) {
      const elapsed = (Date.now() - startTime) / 1000;
      const currentPace = elapsed / currentRep;
      setPace(currentPace);
    }
  }, [currentRep, startTime]);

  if (!pace) return null;

  // Feedback visual se pace está muito rápido (>1.5s/rep para hipertrofia/força)
  const isTooFast = pace < 1.0 && targetReps > 5;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      <div style={{ fontSize: 11, color: '#9ca3af', fontFamily: "'DM Mono'" }}>
        {pace.toFixed(1)} s/rep
      </div>
      {isTooFast && (
        <div style={{ color: '#eab308', fontSize: 10, marginTop: 2, fontWeight: 'bold' }} className="animate-pulse">
          ⚡ Muito rápido! Controla a excêntrica
        </div>
      )}
    </div>
  );
};
