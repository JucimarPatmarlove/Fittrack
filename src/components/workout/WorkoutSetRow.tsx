import React from "react";
import { DynamicRPESlider } from "./DynamicRPESlider";
import { PaceTracker } from "./PaceTracker";
import { initAudio } from "../../utils/audio";

export const WorkoutSetRow = React.memo(({
  s, ei, si, theme, C, upd, toggle, setCurrentExerciseIdx, setCurrentSetIdx, setShowPlateCalc, profile, setStartTimes, tr, equipment
}: any) => {

  const isCardio = s.type === 'cardio' || s.type === 'distance';
  const isTimed = s.type === 'timed' || s.type === 'mobility';
  const isBodyweight = s.type === 'bodyweight';

  // INPUT 1 Logic (KM, +KG, KG, or empty)
  let input1Field = "weight";
  let input1Value = s.weight || 0;
  let input1Step = 2.5;

  if (isCardio) {
    input1Field = "distance";
    input1Value = s.distance || 0;
    input1Step = 0.5;
  } else if (isBodyweight) {
    input1Field = "addedWeight";
    input1Value = s.addedWeight || 0;
    input1Step = 2.5;
  }

  // INPUT 2 Logic (MIN, SEGS, or REPS)
  let input2Field = "reps";
  let input2Value = s.reps || 0;
  let input2Step = 1;

  if (isCardio || isTimed) {
    input2Field = "duration";
    input2Value = Math.floor((s.duration || 0) / 60);
    input2Step = 1; // 1 min per click
  }

  const handleInput2Change = (val: string) => {
    if (isCardio || isTimed) {
      upd(ei, si, "duration", String(Number(val) * 60));
    } else {
      upd(ei, si, "reps", val);
    }
  };

  const handleInput2Step = (direction: 1 | -1) => {
    const newValue = Math.max(0, input2Value + (direction * input2Step));
    if (isCardio || isTimed) {
      upd(ei, si, "duration", String(newValue * 60));
    } else {
      upd(ei, si, "reps", String(newValue));
    }
  };

  return (
    <React.Fragment>
      <div style={{ display: "grid", gridTemplateColumns: "26px 1fr 1fr 1fr 38px", gap: 8, marginBottom: 7, alignItems: "center" }}>
        <div style={{ fontFamily: "'DM Mono'", fontSize: 12, color: s.done ? C.green : s.isWarmup ? C.accent : C.muted }}>
          {s.isWarmup ? "AQ" : si + 1}
        </div>
        
        {/* INPUT 1 */}
        <div style={{ display: "flex", gap: 4, width: "100%" }}>
          {isTimed ? (
            <div style={{ width: "100%", textAlign: "center", color: C.muted }}>-</div>
          ) : (
            <>
              <button onClick={() => upd(ei, si, input1Field, String(Math.max(0, input1Value - input1Step)))} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 4, width: 24, cursor: 'pointer' }}>-</button>
              <input type="number" step={isCardio ? "0.1" : "1"} value={input1Value || ''} onChange={e => upd(ei, si, input1Field, e.target.value)}
                style={{ background: s.isWarmup ? C.bg : C.surface, border: `1px solid ${s.done ? C.green + "66" : s.isWarmup ? C.accent + "66" : C.border}`, borderRadius: 6, padding: "8px 5px", color: s.isWarmup ? C.accent : C.text, fontSize: 16, fontFamily: "'DM Mono'", width: "100%", textAlign: "center", minWidth: 0 }} />
              <button onClick={() => upd(ei, si, input1Field, String(input1Value + input1Step))} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 4, width: 24, cursor: 'pointer' }}>+</button>
              {(!s.type || s.type === 'weighted') && (equipment === 'Barra' || equipment === 'Máquinas' || !equipment) && (
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
              )}
            </>
          )}
        </div>

        {/* INPUT 2 */}
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={() => handleInput2Step(-1)} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 4, width: 24, cursor: 'pointer' }}>-</button>
          <input type="number" value={input2Value || ''} onChange={e => handleInput2Change(e.target.value)}
            style={{ background: s.isWarmup ? 'rgba(0,0,0,0.2)' : 'transparent', border: `1px solid ${s.done ? theme.success + "66" : s.isWarmup ? theme.accent + "66" : theme.glassBorder}`, borderRadius: 6, padding: "8px 5px", color: s.isWarmup ? theme.accent : theme.text, fontSize: 16, fontFamily: "'DM Mono'", width: "100%", textAlign: "center", minWidth: 0 }} />
          <button onClick={() => handleInput2Step(1)} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 4, width: 24, cursor: 'pointer' }}>+</button>
        </div>

        {/* RPE SLIDER */}
        <div style={{ background: s.isWarmup ? 'rgba(0,0,0,0.2)' : 'transparent', border: `1px solid ${s.done ? theme.success + "66" : s.isWarmup ? theme.accent + "66" : theme.glassBorder}`, borderRadius: 6, padding: "8px 5px" }}>
          <DynamicRPESlider value={s.rpe || 8} onChange={(val: number) => upd(ei, si, "rpe", String(val))} theme={theme} />
        </div>

        {/* DONE BUTTON */}
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
    prevProps.s.addedWeight === nextProps.s.addedWeight &&
    prevProps.s.duration === nextProps.s.duration &&
    prevProps.s.distance === nextProps.s.distance &&
    prevProps.s.rpe === nextProps.s.rpe &&
    prevProps.s.done === nextProps.s.done &&
    prevProps.ei === nextProps.ei &&
    prevProps.si === nextProps.si &&
    prevProps.setStartTimes[`${prevProps.ei}-${prevProps.si}`] === nextProps.setStartTimes[`${nextProps.ei}-${nextProps.si}`]
  );
});
