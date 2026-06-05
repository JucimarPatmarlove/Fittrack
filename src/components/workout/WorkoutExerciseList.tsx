import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from "../ui/GlassCard";
import { ExerciseTutorialExt } from "../exercises/ExerciseTutorialExt";
import { VideoTutorial } from "../exercises/VideoTutorial";
import { WorkoutSetRow } from "./WorkoutSetRow";
import { GhostSetComparison } from "../GhostSetComparison";

export const WorkoutExerciseList = ({
  localExs, sets, todayPlan, profile, history, theme, C, openIdx, setOpenIdx,
  getRecommendedReps, getHistoricalPR, getPrescription, checkAutoProgression, ME,
  speak, applyStrengthPreset, applyEndurancePreset, applyVolumePreset,
  addWarmups, upd, toggle, setCurrentExerciseIdx, setCurrentSetIdx, setShowPlateCalc, setStartTimes, setGhostPRs
}: any) => {

  return (
    <>
      {localExs.map((ex: any, ei: number) => {
        const allDone = sets[ei].every((s: any) => s.done);
        const isOpen = openIdx === ei;
        const tr = getRecommendedReps(ex.name, ex.base?.hipertrofia?.[2] || 10);
        const pr = getHistoricalPR(ex.name);
        const prescription = getPrescription(profile, ex.name, pr);

        const handleOpen = () => {
          const nextState = isOpen ? -1 : ei;
          setOpenIdx(nextState);
          if (nextState !== -1) {
            const activeSetIdx = sets[ei].findIndex((s: any) => !s.done && !s.isWarmup);
            if (activeSetIdx !== -1) {
              const targetSet = sets[ei][activeSetIdx];
              speak({
                text: `${ex.name}. Série ${activeSetIdx + 1}, ${targetSet.weight} quilos. Mantém a forma.`,
                rate: 0.95,
                pitch: 1.05
              });
            }
          }
        };

        return (
          <GlassCard key={ei} style={{ marginBottom: 10, overflow: "hidden", border: `1px solid ${allDone ? theme.success : theme.glassBorder}`, boxShadow: isOpen ? `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${theme.accent}40` : '0 4px 16px rgba(0,0,0,0.3)' }}>
            <div onClick={handleOpen} style={{ width: "100%", background: "none", border: "none", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
              <div style={{ textAlign: "left" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <ExerciseTutorialExt exercise={ex} />
                  <span style={{ color: allDone ? C.green : C.text, fontWeight: 600, fontSize: 14 }}>{ex.name}</span>
                  {allDone && <span style={{ color: C.green, fontSize: 11 }}>✓</span>}
                </div>
                {checkAutoProgression(history, ex.name, 10) && (
                  <div style={{ background: C.accentLow, color: C.accent, padding: "2px 6px", borderRadius: 4, fontSize: 9, fontWeight: "bold", marginLeft: 8, marginTop: 4, display: "inline-block" }}>
                    ⬆ +2.5kg sugerido
                  </div>
                )}
                {tr !== (ex.base?.hipertrofia?.[2] || 10) && (
                  <div style={{ background: C.accent, color: '#000', padding: "2px 6px", borderRadius: 4, fontSize: 9, fontWeight: "bold", marginLeft: 8, marginTop: 4, display: "inline-block" }}>
                    🎯 {tr} reps recomendadas
                  </div>
                )}
                <div style={{ color: C.muted, fontSize: 11, marginTop: 4, marginLeft: 8 }}>
                  {ME[ex.muscle] || "🏋️"} {ex.muscle} · {sets[ei].filter((s: any) => s.done).length}/{sets[ei].length} séries
                </div>
              </div>
              <motion.span animate={{ rotate: isOpen ? 180 : 0 }} style={{ color: theme.accent, fontSize: 14 }}>▼</motion.span>
            </div>

            <AnimatePresence>
              {isOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ padding: "0 16px 16px" }}>
                  <VideoTutorial exerciseName={ex.name} muscle={ex.muscle} />

                  <div style={{ marginTop: 8, marginBottom: 12, padding: 12, borderRadius: 8, background: '#0a0f15', border: `1px solid #2a2f36` }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, fontSize: 10, color: theme.muted, marginBottom: 8 }}>
                      <div>⚡ REPS</div>
                      <div>🏋️ KG SUG.</div>
                      <div>🎯 RPE</div>
                      <div>⏱️ DESC</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, fontSize: 14, fontFamily: "'DM Mono'" }}>
                      <div style={{ color: theme.accent }}>{prescription.repsTarget}</div>
                      <div>
                        {prescription.suggestedWeight ? `${prescription.suggestedWeight}kg` : `${sets[ei].find((s: any) => !s.isWarmup)?.weight || 20}kg`}
                        <div style={{ fontSize: 8, color: theme.muted, marginTop: 2, whiteSpace: 'nowrap' }}>
                          ✅ {profile?.goal === 'forca' ? 'Para força' : profile?.goal === 'hipertrofia' ? 'Para hipertrofia' : 'Baseado no teu nível'}
                        </div>
                      </div>
                      <div style={{ color: theme.danger }}>{prescription.rpeTarget}/10</div>
                      <div>{prescription.restSeconds}s</div>
                    </div>
                    {prescription.warmupSets.length > 0 && (
                      <div style={{ marginTop: 8, fontSize: 10, color: theme.muted }}>
                        🔥 Aquecimento: {prescription.warmupSets.map((w: any) => `${w.weightPercent * 100}% × ${w.reps}`).join(' → ')}
                      </div>
                    )}
                    <div style={{ marginTop: 8, fontSize: 10, color: theme.muted, display: 'flex', justifyContent: 'space-between' }}>
                      <span>⚡ RPE = Taxa de Esforço Percebida (1=fácil, 10=falha)</span>
                    </div>
                    {prescription.explanation && (
                      <div style={{ marginTop: 10, padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderLeft: `3px solid ${theme.accent}`, borderRadius: 4, fontSize: 11, color: '#e2e8f0', lineHeight: 1.4 }}>
                        {prescription.explanation}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                      <button onClick={() => applyStrengthPreset(ei)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.accent}4d`, borderRadius: 6, padding: '6px 2px', color: C.accent, fontSize: 9, fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}>
                        ⚡ FORÇA
                      </button>
                      <button onClick={() => applyEndurancePreset(ei)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: `1px solid #38bdf84d`, borderRadius: 6, padding: '6px 2px', color: '#38bdf8', fontSize: 9, fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}>
                        💧 RESISTÊNCIA
                      </button>
                      <button onClick={() => applyVolumePreset(ei)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.green}4d`, borderRadius: 6, padding: '6px 2px', color: C.green, fontSize: 9, fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}>
                        📈 VOLUME
                      </button>
                    </div>
                    <p style={{ fontSize: 9, color: theme.muted, textAlign: 'center', marginTop: 8 }}>
                      Podes ajustar livremente as séries em baixo se quiseres.
                    </p>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 7 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "26px 1fr 1fr 1fr 38px", gap: 8, flex: 1 }}>
                      {["#", todayPlan.type === 'hiit' || todayPlan.type === 'functional' ? "CARGA" : "KG", todayPlan.type === 'hiit' || todayPlan.type === 'functional' ? "TEMPO/REP" : "REPS", "INTENS.", ""].map((h, i) => (
                        <div key={i} style={{ color: theme.muted, fontSize: 9, fontFamily: "'DM Mono'", textAlign: i > 0 && i < 4 ? "center" : "left" }}>{h}</div>
                      ))}
                    </div>
                    <button onClick={() => addWarmups(ei)} style={{ background: C.accentLow, color: C.accent, border: `1px solid ${C.accent}`, borderRadius: 6, fontSize: 10, padding: "4px 8px", cursor: "pointer", whiteSpace: "nowrap", marginLeft: 12 }}>+ AQUECIMENTO</button>
                  </div>
                  {/* Ghost Mode: Show last set comparison */}
                  <GhostSetComparison exerciseName={localExs[ei].name} currentSets={sets[ei]} history={history} theme={theme} onPRDetected={(isPR: boolean) => setGhostPRs((prev: any) => ({ ...prev, [localExs[ei].name]: isPR }))} />
                  {sets[ei].map((s: any, si: number) => (
                    <WorkoutSetRow key={si} s={s} ei={ei} si={si} theme={theme} C={C} upd={upd} toggle={toggle} setCurrentExerciseIdx={setCurrentExerciseIdx} setCurrentSetIdx={setCurrentSetIdx} setShowPlateCalc={setShowPlateCalc} profile={profile} setStartTimes={setStartTimes} tr={tr} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        );
      })}
    </>
  );
};
