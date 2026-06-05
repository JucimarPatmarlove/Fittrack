import React from 'react';
import { motion } from 'framer-motion';

export const WorkoutHeader = ({
  theme, C, todayPlan, elapsed, fmt, ftms, btStatus, btConnect, bpm, doneSets, totalSets,
  setShowShareModal, setShowTimer, setConfirmCancel
}: any) => {
  return (
    <div style={{ background: "rgba(8, 11, 15, 0.8)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${theme.glassBorder}`, padding: "12px 18px", position: "sticky", top: 0, zIndex: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: 480, margin: "0 auto" }}>
        <div>
          <p style={{ fontFamily: "'Bebas Neue'", fontSize: 11, letterSpacing: 3, color: C.muted }}>{todayPlan?.label?.toUpperCase()}</p>
          <motion.p style={{ fontFamily: "'DM Mono'", fontSize: 17, color: C.accent, fontVariantNumeric: 'tabular-nums' }}>{fmt(elapsed)}</motion.p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {ftms?.isConnected && ftms?.machineData && (
            <div style={{ display: 'flex', alignItems: 'center', background: C.card, border: `1px solid ${C.green}`, borderRadius: 7, padding: "0 6px", color: C.green, fontSize: 10, fontWeight: 'bold', height: 32 }}>
              ⚡ {ftms.machineData.instantSpeed?.toFixed(1) || 0}km/h
            </div>
          )}
          {btStatus !== 'CONNECTED' ? (
            <button onClick={btConnect} style={{ background: "transparent", border: `1px solid ${C.blue}`, borderRadius: 7, padding: "6px", color: C.blue, fontSize: 11, cursor: "pointer", fontFamily: "'Bebas Neue'" }}>{btStatus === 'CONNECTING' ? '...' : '+ HR'}</button>
          ) : (
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '50%', background: bpm > 171 ? C.red : C.card, border: `2px solid ${bpm > 171 ? C.red : C.accent}`, color: bpm > 171 ? '#FFF' : C.accent, fontSize: 11, fontWeight: 'bold' }}>
              {bpm > 0 ? bpm : '--'}
            </div>
          )}
          <span style={{ fontFamily: "'DM Mono'", fontSize: 11, color: C.muted }}>{doneSets}/{totalSets}</span>
          <button onClick={() => setShowShareModal(true)} style={{ background: C.card, border: `1px solid ${C.blue}`, borderRadius: 7, padding: "6px 9px", color: C.blue, fontSize: 11, cursor: "pointer", fontWeight: "bold" }}>🖧 P2P</button>
          <button onClick={() => setShowTimer(true)} style={{ background: C.card, border: `1px solid ${C.accent}`, borderRadius: 7, padding: "6px 11px", color: C.accent, fontSize: 15, cursor: "pointer" }}>⏱</button>
          <button onClick={() => setConfirmCancel(true)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 7, padding: "6px 11px", color: C.muted, fontSize: 13, cursor: "pointer" }}>✕</button>
        </div>
      </div>
      <div style={{ maxWidth: 480, margin: "9px auto 0", background: C.dim, borderRadius: 2, height: 3 }}>
        <div style={{ width: `${(doneSets / totalSets) * 100 || 0}%`, height: "100%", background: C.accent, borderRadius: 2, transition: "width 0.4s" }} />
      </div>
    </div>
  );
};
