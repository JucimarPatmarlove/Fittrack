import React from "react";
import { DynamicRPESlider } from "./DynamicRPESlider";
import { PaceTracker } from "./PaceTracker";
import { initAudio } from "../../utils/audio";

export const WorkoutSetRow = React.memo(({
  s, ei, si, theme, C, upd, toggle, setCurrentExerciseIdx, setCurrentSetIdx, setShowPlateCalc, profile, setStartTimes, tr
}: any) => {
  return (
    <React.Fragment>
      <div style={{ display: "grid", gridTemplateColumns: "26px 1fr 1fr 1fr 38px", gap: 8, marginBottom: 7, alignItems: "center" }}>
        <div style={{ fontFamily: "'DM Mono'", fontSize: 12, color: s.done ? C.green : s.isWarmup ? C.accent : C.muted }}>
          {s.isWarmup ? "AQ" : si + 1}
        </div>
        <div style={{ display: "flex", gap: 4, width: "100%" }}>
          <button onClick={() => upd(ei, si, "weight", String(Math.max(0, s.weight - 2.5)))} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 4, width: 24, cursor: 'pointer' }}>-</button>
          <input type="number" value={s.weight} onChange={e => upd(ei, si, "weight", e.target.value)}
            style={{ background: s.isWarmup ? C.bg : C.surface, border: `1px solid ${s.done ? C.green + "66" : s.isWarmup ? C.accent + "66" : C.border}`, borderRadius: 6, padding: "8px 5px", color: s.isWarmup ? C.accent : C.text, fontSize: 16, fontFamily: "'DM Mono'", width: "100%", textAlign: "center", minWidth: 0 }} />
          <button onClick={() => upd(ei, si, "weight", String(s.weight + 2.5))} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 4, width: 24, cursor: 'pointer' }}>+</button>
          <button
            onClick={() => {
              setCurrentExerciseIdx(ei);
              setCurrentSetIdx(si);
              setShowPlateCalc(true);
            }}
            style={{ background: "#2a2f36", borderRadius: 6, padding: "0 6px", fontSize: 12, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            title="Calculadora de discos"
          >
            🏋️
          </button>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={() => upd(ei, si, "reps", String(Math.max(1, s.reps - 1)))} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 4, width: 24, cursor: 'pointer' }}>-</button>
          <input type="number" value={s.reps} onChange={e => upd(ei, si, "reps", e.target.value)}
            style={{ background: s.isWarmup ? 'rgba(0,0,0,0.2)' : 'transparent', border: `1px solid ${s.done ? theme.success + "66" : s.isWarmup ? theme.accent + "66" : theme.glassBorder}`, borderRadius: 6, padding: "8px 5px", color: s.isWarmup ? theme.accent : theme.text, fontSize: 16, fontFamily: "'DM Mono'", width: "100%", textAlign: "center", minWidth: 0 }} />
          <button onClick={() => upd(ei, si, "reps", String(s.reps + 1))} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 4, width: 24, cursor: 'pointer' }}>+</button>
        </div>
        <div style={{ background: s.isWarmup ? 'rgba(0,0,0,0.2)' : 'transparent', border: `1px solid ${s.done ? theme.success + "66" : s.isWarmup ? theme.accent + "66" : theme.glassBorder}`, borderRadius: 6, padding: "8px 5px" }}>
          <DynamicRPESlider value={s.rpe || 8} onChange={val => upd(ei, si, "rpe", String(val))} theme={theme} />
        </div>
        <button onClick={() => { initAudio(); toggle(ei, si); }}
          style={{
            background: s.done ? theme.success : '#1e2832', border: "none", borderRadius: 6, width: 38, height: 36, cursor: "pointer", fontSize: s.done ? 14 : 11, display: "flex", alignItems: "center", justifyContent: "center",
            color: s.done ? "#000" : theme.muted, transition: "all 0.2s ease",
            boxShadow: s.done ? `0 0 15px ${theme.success}80, inset 0 0 10px rgba(255,255,255,0.5)` : 'none'
          }}>
          {s.done ? "✓" : "○"}
        </button>
      </div>
      {s.done && !profile.proMode && (
        <div style={{ paddingLeft: 34, marginBottom: 12 }}>
          <PaceTracker startTime={setStartTimes[`${ei}-${si}`] || (Date.now() - 30000)} targetReps={tr} currentRep={s.reps} />
        </div>
      )}
    </React.Fragment>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.s.weight === nextProps.s.weight &&
    prevProps.s.reps === nextProps.s.reps &&
    prevProps.s.rpe === nextProps.s.rpe &&
    prevProps.s.done === nextProps.s.done &&
    prevProps.ei === nextProps.ei &&
    prevProps.si === nextProps.si &&
    prevProps.setStartTimes[`${prevProps.ei}-${prevProps.si}`] === nextProps.setStartTimes[`${nextProps.ei}-${nextProps.si}`]
  );
});
