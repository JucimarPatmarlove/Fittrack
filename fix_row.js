import fs from 'fs';

const content = fs.readFileSync('src/components/workout/WorkoutSetRow.tsx', 'utf-8');

const newContent = content.replace(
  /<div style=\{\{ display: "flex", gap: 4, width: "100%" \}\}>[\s\S]*?<\/div>[\s\S]*?<div style=\{\{ display: "flex", gap: 4 \}\}>[\s\S]*?<\/div>/m,
  `{/* INPUT 1 */}
        <div style={{ display: "flex", gap: 4, width: "100%" }}>
          {(s.type === 'timed' || s.type === 'mobility') ? (
            <div style={{ width: "100%", textAlign: "center", color: C.muted }}>-</div>
          ) : (
            <>
              <button onClick={() => upd(ei, si, s.type === 'cardio' || s.type === 'distance' ? "distance" : s.type === 'bodyweight' ? "addedWeight" : "weight", String(Math.max(0, (s.type === 'cardio' || s.type === 'distance' ? (s.distance || 0) : s.type === 'bodyweight' ? (s.addedWeight || 0) : (s.weight || 0)) - (s.type === 'cardio' || s.type === 'distance' ? 0.5 : 2.5))))} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 4, width: 24, cursor: 'pointer' }}>-</button>
              <input type="number" step={s.type === 'cardio' || s.type === 'distance' ? "0.1" : "1"} value={s.type === 'cardio' || s.type === 'distance' ? (s.distance || '') : s.type === 'bodyweight' ? (s.addedWeight || '') : s.weight} onChange={e => upd(ei, si, s.type === 'cardio' || s.type === 'distance' ? "distance" : s.type === 'bodyweight' ? "addedWeight" : "weight", e.target.value)}
                style={{ background: s.isWarmup ? C.bg : C.surface, border: \`1px solid \${s.done ? C.green + "66" : s.isWarmup ? C.accent + "66" : C.border}\`, borderRadius: 6, padding: "8px 5px", color: s.isWarmup ? C.accent : C.text, fontSize: 16, fontFamily: "'DM Mono'", width: "100%", textAlign: "center", minWidth: 0 }} />
              <button onClick={() => upd(ei, si, s.type === 'cardio' || s.type === 'distance' ? "distance" : s.type === 'bodyweight' ? "addedWeight" : "weight", String((s.type === 'cardio' || s.type === 'distance' ? (s.distance || 0) : s.type === 'bodyweight' ? (s.addedWeight || 0) : (s.weight || 0)) + (s.type === 'cardio' || s.type === 'distance' ? 0.5 : 2.5)))} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 4, width: 24, cursor: 'pointer' }}>+</button>
              {(!s.type || s.type === 'weighted') && (
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
          <button onClick={() => upd(ei, si, s.type === 'cardio' || s.type === 'distance' || s.type === 'timed' || s.type === 'mobility' ? "duration" : "reps", String(Math.max(1, (s.type === 'cardio' || s.type === 'distance' || s.type === 'timed' || s.type === 'mobility' ? Math.floor((s.duration || 0) / 60) : (s.reps || 0)) - 1) * (s.type === 'cardio' || s.type === 'distance' || s.type === 'timed' || s.type === 'mobility' ? 60 : 1)))} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 4, width: 24, cursor: 'pointer' }}>-</button>
          <input type="number" value={s.type === 'cardio' || s.type === 'distance' || s.type === 'timed' || s.type === 'mobility' ? ((s.duration || 0) / 60) : s.reps} onChange={e => upd(ei, si, s.type === 'cardio' || s.type === 'distance' || s.type === 'timed' || s.type === 'mobility' ? "duration" : "reps", s.type === 'cardio' || s.type === 'distance' || s.type === 'timed' || s.type === 'mobility' ? String(Number(e.target.value) * 60) : e.target.value)}
            style={{ background: s.isWarmup ? 'rgba(0,0,0,0.2)' : 'transparent', border: \`1px solid \${s.done ? theme.success + "66" : s.isWarmup ? theme.accent + "66" : theme.glassBorder}\`, borderRadius: 6, padding: "8px 5px", color: s.isWarmup ? theme.accent : theme.text, fontSize: 16, fontFamily: "'DM Mono'", width: "100%", textAlign: "center", minWidth: 0 }} />
          <button onClick={() => upd(ei, si, s.type === 'cardio' || s.type === 'distance' || s.type === 'timed' || s.type === 'mobility' ? "duration" : "reps", String(((s.type === 'cardio' || s.type === 'distance' || s.type === 'timed' || s.type === 'mobility' ? Math.floor((s.duration || 0) / 60) : (s.reps || 0)) + 1) * (s.type === 'cardio' || s.type === 'distance' || s.type === 'timed' || s.type === 'mobility' ? 60 : 1)))} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 4, width: 24, cursor: 'pointer' }}>+</button>
        </div>`,
);

const updatedDeps = newContent.replace(
  /prevProps\.s\.weight === nextProps\.s\.weight &&\n\s*prevProps\.s\.reps === nextProps\.s\.reps &&/,
  `prevProps.s.weight === nextProps.s.weight &&
    prevProps.s.reps === nextProps.s.reps &&
    prevProps.s.addedWeight === nextProps.s.addedWeight &&
    prevProps.s.duration === nextProps.s.duration &&
    prevProps.s.distance === nextProps.s.distance &&`,
);

fs.writeFileSync('src/components/workout/WorkoutSetRow.tsx', updatedDeps);
console.log('Done!');
