// @ts-nocheck
import React from 'react';
import { GradientButton } from '../ui/GradientButton';

export const WorkoutControls = ({ finish, doneSets, totalSets }: any) => {
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "12px 18px", background: `linear-gradient(to top, #080b0f, transparent)` }}>
      <GradientButton onClick={finish} variant="primary" style={{ width: "100%", maxWidth: 480, display: "flex", justifyContent: "center", margin: "0 auto", padding: 14, fontSize: 18 }}>
        TERMINAR · {doneSets}/{totalSets} SÉRIES
      </GradientButton>
    </div>
  );
};
