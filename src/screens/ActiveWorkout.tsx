import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { GlobalBackground } from "../components/ui/GlobalBackground";
import { GlassCard } from "../components/ui/GlassCard";
import { GradientButton } from "../components/ui/GradientButton";

// --- STYLES CYBERPUNK ---
const theme = {
  bg: '#080b0f',
  glass: 'rgba(19, 25, 32, 0.65)',
  glassBorder: 'rgba(232, 200, 74, 0.15)',
  accent: '#e8c84a',
  accentGlow: 'drop-shadow(0 0 8px rgba(232,200,74,0.6))',
  danger: '#e84a4a',
  success: '#3dd68c',
  text: '#eceae4',
  muted: '#55626e',
};

const DynamicRPESlider = ({ value, onChange }: { value: number, onChange: (v: number) => void }) => {
  const getRPEColor = (rpe: number) => {
    if (rpe <= 6) return theme.success;
    if (rpe <= 8) return theme.accent;
    return theme.danger;
  };
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    onChange(val);
    if (navigator.vibrate) navigator.vibrate(10);
  };
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
      <input
        type="range"
        min="1" max="10" step="0.5"
        value={value || 8}
        onChange={handleSliderChange}
        style={{
          width: '100%',
          accentColor: getRPEColor(value || 8),
          background: `linear-gradient(to right, ${getRPEColor(value || 8)} ${(value || 8) * 10}%, #1e2832 ${(value || 8) * 10}%)`,
          height: '4px', borderRadius: '4px', outline: 'none', appearance: 'none'
        }}
      />
      <div style={{ position: 'absolute', top: -15, right: 0, fontSize: 10, color: getRPEColor(value || 8), fontWeight: 'bold' }}>{value || 8}</div>
    </div>
  );
};
import { RestTimer } from "../components/workout/RestTimer";
import { PaceTracker } from "../components/workout/PaceTracker";
import { GhostSetBar } from "../components/workout/GhostSetBar";
import { ExerciseLibrary } from "../components/workout/ExerciseLibrary";
import { VideoTutorial } from "../components/exercises/VideoTutorial";
import { C, EXERCISE_DB, ME } from "../data/constants";
import { useWakeLock, useBeep, useGhostMode } from "../hooks";
import { useBluetoothHRM } from "../hooks/useBluetoothHRM";
import { useFitnessMachine } from "../hooks/useFitnessMachine";
import { useDeviceStore } from "../stores/useDeviceStore";
import { getWarmupSets } from "../services/fitnessMechanics";
import { ProgressionSystem } from "../services/ProgressionSystem";
import { RivalAI, RivalState } from "../services/rivalAI";
import { RivalRace } from "../components/rival/RivalRace";
import { RivalResult } from "../components/rival/RivalResult";
import { SmartCamera } from "../components/3d/SmartCamera";
import { checkAutoProgression } from "../data/utils";
import { MuscleViewer } from "../components/3d/MuscleViewer";
import Confetti from 'react-confetti';
import { useGhostStore } from "../stores/useGhostStore";
import { GhostToggle } from "../components/GhostToggle";
import { GhostSetComparison } from "../components/GhostSetComparison";
import { useProgressionStore } from "../stores/useProgressionStore";
import { CircuitProgress } from "../components/workout/CircuitProgress";
import { ExerciseTutorialExt } from "../components/exercises/ExerciseTutorialExt";
import { useProgressiveHaptics } from "../hooks/useProgressiveHaptics";
import { PlateCalculator } from "../components/PlateCalculator/PlateCalculator";
import { useMilestonesStore } from "../stores/useMilestonesStore";
import { calculateEPLEY } from "../utils/oneRMCalculator";
import { PRTracker } from "../components/workout/PRTracker";
import { getPrescription } from "../utils/prescriptionEngine";
import { ShareWorkoutModal } from "../components/social/ShareWorkoutModal";
import { AutoRepToggle } from "../components/workout/AutoRepToggle";
import { useAudioCoach } from "../hooks/useAudioCoach";
import { saveSetLog, saveWorkoutSession, updatePersonalRecord, generateId } from "../db/encryptedDb";
import { analyzeExerciseTrend, TrendAnalysis } from "../services/trendAnalyzer";
import { getExerciseCategory } from "../data/exerciseClassifier";

const WorkoutSetRow = React.memo(({
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
          <DynamicRPESlider value={s.rpe || 8} onChange={val => upd(ei, si, "rpe", String(val))} />
        </div>
        <button onClick={() => toggle(ei, si)}
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

export default function ActiveWorkout({ todayPlan, profile, history, onFinish, onCancel }: any) {
  const [localExs, setLocalExs] = useState(() => todayPlan.exercises.map((n: string) => ({ name: n, muscle: "Treino", ...(EXERCISE_DB[n] || {}) })));

  const getHistoricalPR = (exerciseName: string) => {
    if (!history) return null;
    const pastWorkouts = [...history].reverse();
    const lastWorkout = pastWorkouts.find((w: any) => w.exercises.some((e: any) => e.name === exerciseName));
    if (!lastWorkout) return null;
    const lastEx = lastWorkout.exercises.find((e: any) => e.name === exerciseName);
    if (!lastEx || lastEx.sets.length === 0) return null;
    const bestSet = lastEx.sets.reduce((prev: any, current: any) => (prev.weight > current.weight) ? prev : current);
    return { weight: bestSet.weight, reps: bestSet.reps };
  };

  const [sets, setSets] = useState(() => localExs.map((ex: any) => {
    const pr = getHistoricalPR(ex.name);
    const prescription = getPrescription(profile, ex.name, pr, todayPlan.phase);
    const startW = prescription.suggestedWeight || ProgressionSystem.calculateNextWeight((pr?.weight || 0), (pr?.reps || 10), 10);
    return Array.from({ length: 3 }, () => ({ reps: prescription.repsSuggested, weight: startW, rpe: prescription.rpeTarget, done: false }));
  }));
  const [showLibrary, setShowLibrary] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [openIdx, setOpenIdx] = useState(0);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [setStartTimes, setSetStartTimes] = useState<Record<string, number>>({});
  const [rivalState] = useState(() => RivalAI.findRival(history, todayPlan.label));
  const [showRivalResult, setShowRivalResult] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [finalVolume, setFinalVolume] = useState(0);
  const [ghostPRs, setGhostPRs] = useState<Record<string, boolean>>({}); // Track PRs for each exercise
  const liveLandmarksRef = React.useRef<any[]>([]);
  const { beep } = useBeep();
  const hrm = useBluetoothHRM();
  const { bpm, status: btStatus, connect: btConnect } = hrm;
  const ftms = useFitnessMachine();
  const { autoSync } = useDeviceStore();
  const syncWorker = React.useRef<Worker | null>(null);

  useEffect(() => {
    try {
      syncWorker.current = new Worker(new URL('../workers/syncWorker.ts', import.meta.url), { type: 'module' });
      return () => {
        syncWorker.current?.terminate();
      };
    } catch (e) { }
  }, []);

  useEffect(() => {
    if (!autoSync) return;
    try {
      const paired = useDeviceStore.getState().pairedDevices;
      for (const dev of paired) {
        if (dev.type === 'hrm' && !hrm.isConnected && !dev.id.startsWith('mock_')) hrm.connect();
        if (dev.type === 'ftms' && !ftms.isConnected && !dev.id.startsWith('mock_')) ftms.connect();
      }
    } catch (e) { }
  }, [autoSync]);
  const { active: ghostActive, registerAttempt, currentGhost, calculateGhostTarget } = useGhostStore();
  const [showConfetti, setShowConfetti] = useState(false);
  const { getRecommendedReps, recordSession, recordSuccess, recordFailure } = useProgressionStore();
  const { triggerRepCompletionHaptic } = useProgressiveHaptics();

  const [isCircuit, setIsCircuit] = useState(todayPlan.type === 'circuit');
  const [currentRound, setCurrentRound] = useState(1);
  const [roundRestRemaining, setRoundRestRemaining] = useState<number | null>(null);
  const [roundExercisesCompleted, setRoundExercisesCompleted] = useState<string[]>([]);
  const { speak } = useAudioCoach();

  const [showPlateCalc, setShowPlateCalc] = useState(false);
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  const [currentSetIdx, setCurrentSetIdx] = useState(0);
  const [newPRData, setNewPRData] = useState<{ exerciseName: string, weight: number } | null>(null);
  const [autoregulationMessage, setAutoregulationMessage] = useState<{ text: string, type: string } | null>(null);
  const [autoRepActive, setAutoRepActive] = useState(false);
  const workoutIdRef = useRef<string>(generateId()); // UUID persistente para esta sessão

  const handleRepDetected = () => {
    if (!profile.proMode && navigator.vibrate) navigator.vibrate(20);
    // Auto-increment logic for the currently open exercise's active set
    if (openIdx !== -1) {
      const activeSetIdx = sets[openIdx].findIndex((s: any) => !s.done);
      if (activeSetIdx !== -1) {
        const currentReps = sets[openIdx][activeSetIdx].reps;
        upd(openIdx, activeSetIdx, "reps", String(currentReps + 1));
      }
    }
  };

  useWakeLock(true);

  useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const totalSets = sets.flat().length;
  const doneSets = sets.flat().filter((s: any) => s.done).length;

  const addWarmups = (ei: number) => {
    setSets((prev: any) => {
      const n = prev.map((e: any) => e.map((s: any) => ({ ...s })));
      const workingWeight = Math.max(...n[ei].map((s: any) => s.weight)) || 20;
      const warmups = getWarmupSets(workingWeight).map(w => ({ ...w, done: false }));
      n[ei] = [...warmups, ...n[ei]];
      return n;
    });
  };

  const toggle = (ei: number, si: number) => {
    const currentSet = sets[ei][si];
    if (!currentSet.done && currentSet.weight > 0 && currentSet.reps > 0) {
      const exName = localExs[ei].name;
      const oneRM = calculateEPLEY(currentSet.weight, currentSet.reps);
      const currentPR = useMilestonesStore.getState().getPR(exName);
      if (oneRM > currentPR) {
        useMilestonesStore.getState().setPR(exName, oneRM);
        setNewPRData({ exerciseName: exName, weight: oneRM });
      }

      // ── IndexedDB: Gravar SetLog cifrado ──
      const exerciseCategory = (() => { try { return getExerciseCategory(exName); } catch { return 'compound_multi'; } })();
      saveSetLog({
        workoutId: workoutIdRef.current,
        exerciseName: exName,
        category: exerciseCategory,
        setNumber: si + 1,
        weightKg: currentSet.weight,
        repsCompleted: currentSet.reps,
        rpe: currentSet.rpe || 8,
        estimated1RM: oneRM,
        timestamp: Date.now(),
      }).catch(e => console.warn('[IDB] Falha ao gravar SetLog:', e));

      // ── IndexedDB: Actualizar PR na DB relacional ──
      updatePersonalRecord(exName, oneRM, currentSet.weight, currentSet.reps)
        .catch(e => console.warn('[IDB] Falha ao actualizar PR:', e));

      // ── Trend Analyzer: Analisar tendência após gravar ──
      analyzeExerciseTrend(exName).then((trend: TrendAnalysis) => {
        if (trend.status === 'PROGRESSING') {
          setAutoregulationMessage({
            text: `💪 ${trend.message} +${trend.suggestedWeightIncrement}kg na próxima sessão!`,
            type: 'success'
          });
        } else if (trend.status === 'FATIGUED') {
          setAutoregulationMessage({
            text: `⚠️ ${trend.message} Reduz ${Math.abs(trend.suggestedWeightIncrement)}kg.`,
            type: 'danger'
          });
        }
        // STABLE e NO_DATA — não mostram mensagem (não interromper o fluxo)
      }).catch(e => console.warn('[TrendAnalyzer] Erro:', e));
    }

    setSets((prev: any) => {
      const n = prev.map((e: any) => e.map((s: any) => ({ ...s })));
      if (!n[ei][si].done) {
        const currentSetStartTime = setStartTimes[`${ei}-${si}`] || (Date.now() - 30000); // 30s dummy fallback se falhar

        if (!profile.proMode) {
          beep(880, 0.07);
        }
        setShowTimer(true);

        // Lógica Gamificação Ghost (Desativada no ProMode)
        let isGhostSuccess = false;
        if (ghostActive && !profile.proMode) {
          const currentSet = n[ei][si];
          isGhostSuccess = currentSet.reps >= (currentGhost?.bestReps || 0);
          const xpGain = registerAttempt(localExs[ei].name, currentSet.weight, currentSet.reps, isGhostSuccess);
          if (xpGain > 0) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 3000);
          }
        }
        triggerRepCompletionHaptic(isGhostSuccess);

        if (isCircuit) {
          const newCompleted = [...roundExercisesCompleted, localExs[ei].name];
          if (!roundExercisesCompleted.includes(localExs[ei].name)) {
            setRoundExercisesCompleted(newCompleted);
            if (newCompleted.length === localExs.length) {
              if (currentRound < (todayPlan.rounds || 1)) {
                setRoundRestRemaining(todayPlan.restBetweenRounds || 60);
                const timer = setInterval(() => {
                  setRoundRestRemaining(prev => {
                    if (prev === null || prev <= 1) {
                      clearInterval(timer);
                      setCurrentRound(r => r + 1);
                      setRoundExercisesCompleted([]);
                      return null;
                    }
                    return prev - 1;
                  });
                }, 1000);
              }
            }
          }
        }

        // Evaluate progression
        const tr = getRecommendedReps(localExs[ei].name, localExs[ei].base?.hipertrofia?.[2] || 10);
        const rpeVal = currentSet.rpe ? Number(currentSet.rpe) : 8; // default to 8
        if (currentSet.reps < tr * 0.8 || rpeVal >= 9.5) {
          recordFailure(localExs[ei].name);
        } else {
          recordSuccess(localExs[ei].name, currentSet.reps, tr, rpeVal);
        }
        speak(`Série completada com ${currentSet.weight} quilos. Descansa.`);
      }
      n[ei][si].done = !n[ei][si].done;
      if (!n[ei][si].done) {
        // Se desmarcou, reset timing
        const nst = { ...setStartTimes }; delete nst[`${ei}-${si}`]; setSetStartTimes(nst);
      }
      return n;
    });
  };
  const upd = (ei: number, si: number, f: string, v: string) => {
    const valNum = Number(v);
    if (f === 'rpe') {
      if (valNum >= 9.5) {
        setAutoregulationMessage({ text: "⚠️ Fadiga Elevada Detetada! Sugerimos reduzir a carga em 5% a 10% na próxima série para manter a boa execução e proteger o SNC.", type: 'danger' });
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      } else if (valNum <= 6) {
        setAutoregulationMessage({ text: "🚀 Estás a voar! Podes aumentar a carga em 2.5kg na próxima série se te sentires confiante.", type: 'success' });
      } else {
        setAutoregulationMessage(null);
      }
    }
    setSets((prev: any) => {
      const n = prev.map((e: any) => e.map((s: any) => ({ ...s })));
      n[ei][si][f] = valNum;
      if (f === 'reps' && !setStartTimes[`${ei}-${si}`]) {
        setSetStartTimes(p => ({ ...p, [`${ei}-${si}`]: Date.now() - 5000 }));
      }
      return n;
    });
  };

  const applyStrengthPreset = (ei: number) => {
    const pr = getHistoricalPR(localExs[ei].name);
    const prescription = getPrescription(profile, localExs[ei].name, pr, todayPlan.phase);
    const preset = prescription.presets.strength;
    setSets((prev: any) => {
      const n = prev.map((e: any) => e.map((s: any) => ({ ...s })));
      n[ei] = n[ei].map((s: any) => ({ ...s, weight: preset.weight, reps: preset.reps }));
      return n;
    });
  };

  const applyEndurancePreset = (ei: number) => {
    const pr = getHistoricalPR(localExs[ei].name);
    const prescription = getPrescription(profile, localExs[ei].name, pr, todayPlan.phase);
    const preset = prescription.presets.endurance;
    setSets((prev: any) => {
      const n = prev.map((e: any) => e.map((s: any) => ({ ...s })));
      n[ei] = n[ei].map((s: any) => ({ ...s, weight: preset.weight, reps: preset.reps }));
      return n;
    });
  };

  const applyVolumePreset = (ei: number) => {
    const pr = getHistoricalPR(localExs[ei].name);
    const prescription = getPrescription(profile, localExs[ei].name, pr, todayPlan.phase);
    const delta = prescription.presets.volume.setsDelta || 1;
    setSets((prev: any) => {
      const n = prev.map((e: any) => e.map((s: any) => ({ ...s })));
      const currentSets = n[ei];
      const newSets = [...currentSets];
      for (let i = 0; i < delta; i++) {
        newSets.push({ ...currentSets[0], done: false });
      }
      n[ei] = newSets;
      return n;
    });
  };

  const finish = () => {
    const totalVolume = sets.flat().filter((s: any) => s.done).reduce((a: any, s: any) => a + s.weight * s.reps, 0);
    setFinalVolume(totalVolume);

    localExs.forEach((ex: any, idx: number) => {
      const tr = getRecommendedReps(ex.name, ex.base?.hipertrofia?.[2] || 10);
      recordSession(ex.name, sets[idx], tr);
    });

    if (rivalState.found) {
      setShowRivalResult(true);
    } else {
      commitFinish(totalVolume);
    }
  };

  const commitFinish = (vol: number) => {
    const isCustom = todayPlan.id?.startsWith('free_') || !!todayPlan.isCustom;
    const payload = {
      date: new Date().toISOString(),
      dayLabel: todayPlan.label || 'Treino Livre',
      duration: elapsed,
      exercises: localExs.map((ex: any, ei: number) => ({
        name: ex.name,
        muscle: ex.muscle,
        sets: sets[ei].filter((s: any) => s.done).map((s: any) => ({
          weight: s.weight,
          reps: s.reps,
          rpe: s.rpe || 8
        }))
      })).filter((e: any) => e.sets.length > 0),
      totalVolume: vol,
      isCustom: isCustom,
      customExercisesList: isCustom ? todayPlan.exercises : [],
    };

    // ── IndexedDB: Gravar WorkoutSession ──
    saveWorkoutSession({
      date: Date.now(),
      name: todayPlan.label || 'Treino Livre',
      durationSeconds: elapsed,
      readinessScore: 85, // Default, pode ser ligado ao useEffortStore no futuro
      totalVolumeKg: vol,
      isCompleted: true,
    }).catch(e => console.warn('[IDB] Falha ao gravar WorkoutSession:', e));

    try {
      if (autoSync && syncWorker.current) {
        syncWorker.current.postMessage({
          type: 'enqueue',
          payload: { type: 'workout', data: payload },
        });
      }
    } catch (e) { }
    onFinish(payload);
  };

  const currentVolume = sets.flat().filter((s: any) => s.done).reduce((a: any, s: any) => a + s.weight * s.reps, 0);

  return (
    <GlobalBackground>
      <div style={{ minHeight: "100vh", paddingBottom: 90 }}>
        {newPRData && (
          <PRTracker
            exerciseName={newPRData.exerciseName}
            weight={newPRData.weight}
            onClose={() => setNewPRData(null)}
          />
        )}
        {showConfetti && !profile.proMode && <Confetti colors={['#e8c84a', '#d4b03a']} />}
        {!profile.proMode && (
          <div style={{ position: 'fixed', bottom: 90, right: 16, zIndex: 50 }}>
            <GhostToggle />
          </div>
        )}
        {ghostActive && currentGhost && !profile.proMode && (
          <div style={{ position: 'fixed', top: 80, right: 16, background: 'rgba(26, 31, 37, 0.9)', backdropFilter: 'blur(10px)', padding: 12, borderRadius: 8, borderLeft: '4px solid #e8c84a', zIndex: 40 }}>
            <p style={{ fontSize: 10, color: C.accent, fontFamily: "'DM Mono'" }}>GHOST TARGET</p>
            <p style={{ fontSize: 14, fontWeight: 'bold', color: '#fff' }}>{currentGhost.bestWeight}kg x {currentGhost.bestReps}</p>
            <p style={{ fontSize: 10, color: C.muted }}>+250 XP se vencer</p>
          </div>
        )}
        {showLibrary && (
          <ExerciseLibrary
            onClose={() => setShowLibrary(false)}
            onCreateWorkout={(names) => {
              const newExs = names.map((n: string) => ({ name: n, ...(EXERCISE_DB[n] || { muscle: 'Outro' }) }));
              setLocalExs((prev: any) => [...prev, ...newExs]);
              setSets((prev: any) => {
                const newSets = newExs.map(ex => {
                  const pr = getHistoricalPR(ex.name);
                  const prescription = getPrescription(profile, ex.name, pr, todayPlan.phase);
                  const startW = prescription.suggestedWeight || ProgressionSystem.calculateNextWeight((pr?.weight || 0), (pr?.reps || 10), 10);
                  return Array.from({ length: 3 }, () => ({ reps: prescription.repsSuggested, weight: startW, rpe: prescription.rpeTarget, done: false }));
                });
                return [...prev, ...newSets];
              });
              setShowLibrary(false);
            }}
          />
        )}
        {showTimer && <RestTimer onClose={() => setShowTimer(false)} />}
        <PlateCalculator
          isOpen={showPlateCalc}
          onClose={() => setShowPlateCalc(false)}
          initialWeight={sets[currentExerciseIdx]?.[currentSetIdx]?.weight || 0}
          onSelectWeight={(newWeight) => {
            upd(currentExerciseIdx, currentSetIdx, "weight", String(newWeight));
          }}
        />
        {confirmCancel && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(8,11,15,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 150, padding: 24 }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 26, maxWidth: 300, width: "100%", textAlign: "center" }}>
              <p style={{ fontFamily: "'Bebas Neue'", fontSize: 22, letterSpacing: 2, marginBottom: 8 }}>ABANDONAR?</p>
              <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>O progresso não será guardado.</p>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setConfirmCancel(false)} style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 11, color: C.text, cursor: "pointer", fontWeight: 600 }}>Voltar</button>
                <button onClick={onCancel} style={{ flex: 1, background: C.red, border: "none", borderRadius: 8, padding: 11, color: "#fff", cursor: "pointer", fontWeight: 700 }}>Sair</button>
              </div>
            </div>
          </div>
        )}

        <div style={{ background: "rgba(8, 11, 15, 0.8)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${theme.glassBorder}`, padding: "12px 18px", position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: 480, margin: "0 auto" }}>
            <div>
              <p style={{ fontFamily: "'Bebas Neue'", fontSize: 11, letterSpacing: 3, color: C.muted }}>{todayPlan.label.toUpperCase()}</p>
              <motion.p style={{ fontFamily: "'DM Mono'", fontSize: 17, color: C.accent, fontVariantNumeric: 'tabular-nums' }}>{fmt(elapsed)}</motion.p>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {ftms.isConnected && ftms.machineData && (
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
            <div style={{ width: `${(doneSets / totalSets) * 100}%`, height: "100%", background: C.accent, borderRadius: 2, transition: "width 0.4s" }} />
          </div>
        </div>

        {showRivalResult && (
          <RivalResult
            isWinner={finalVolume >= rivalState.rivalVolume}
            rivalVolume={rivalState.rivalVolume}
            userVolume={finalVolume}
            onContinue={() => commitFinish(finalVolume)}
          />
        )}

        {showShareModal && (
          <ShareWorkoutModal
            workoutPlan={todayPlan}
            onClose={() => setShowShareModal(false)}
            onImport={(importedPlan) => {
              if (importedPlan.exercises && importedPlan.exercises.length > 0) {
                const newExs = importedPlan.exercises.map((n: string) => ({ name: n, muscle: "Treino", ...(EXERCISE_DB[n] || {}) }));
                setLocalExs(newExs);
                // @ts-ignore
                setSets(newExs.map(() => Array.from({ length: 3 }, () => ({ reps: 10, weight: 40, rpe: 8, done: false }))));
              }
            }}
          />
        )}

        <div style={{ maxWidth: 480, margin: "0 auto", padding: "14px 18px" }}>

          <div style={{ marginBottom: 16 }}>
            <AutoRepToggle
              isActive={autoRepActive}
              onToggle={setAutoRepActive}
              onRepDetected={handleRepDetected}
            />
          </div>

          <RivalRace rivalState={rivalState} elapsed={elapsed} currentVolume={currentVolume} />

          <AnimatePresence>
            {autoregulationMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{
                  marginBottom: 16,
                  padding: '12px 16px',
                  borderRadius: 8,
                  background: autoregulationMessage.type === 'danger' ? 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(153,27,27,0.25))' : 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(20,83,45,0.25))',
                  border: `1px solid ${autoregulationMessage.type === 'danger' ? '#ef4444' : '#22c55e'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  boxShadow: `0 4px 20px ${autoregulationMessage.type === 'danger' ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`
                }}
              >
                <span style={{ fontSize: 20 }}>{autoregulationMessage.type === 'danger' ? '⚡' : '✨'}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: "'Bebas Neue'", fontSize: 14, letterSpacing: 1, margin: 0, color: autoregulationMessage.type === 'danger' ? '#fca5a5' : '#86efac' }}>
                    {autoregulationMessage.type === 'danger' ? 'AUTORREGULAÇÃO ATIVADA' : 'FEEDBACK DE PERFORMANCE'}
                  </p>
                  <p style={{ fontSize: 11, color: '#f8fafc', margin: '2px 0 0', lineHeight: 1.3 }}>
                    {autoregulationMessage.text}
                  </p>
                </div>
                <button
                  onClick={() => setAutoregulationMessage(null)}
                  style={{ background: 'transparent', border: 'none', color: '#cbd5e1', fontSize: 16, cursor: 'pointer', padding: 4 }}
                >
                  ×
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 
        <SmartCamera onLandmarks={(lm) => { liveLandmarksRef.current = lm; }} />
        <div style={{ marginBottom: 16 }}>
             <MuscleViewer fatigueStats={{}} landmarksRef={liveLandmarksRef} />
        </div>
        */}

          {isCircuit && (
            <CircuitProgress
              currentRound={currentRound}
              totalRounds={todayPlan.rounds || 1}
              restRemaining={roundRestRemaining}
              onRestComplete={() => setRoundRestRemaining(null)}
            />
          )}

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

                      {/* Painel Tático de Prescrição */}
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
                            🔥 Aquecimento: {prescription.warmupSets.map(w => `${w.weightPercent * 100}% × ${w.reps}`).join(' → ')}
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
                      <GhostSetComparison exerciseName={localExs[ei].name} currentSets={sets[ei]} history={history} theme={theme} onPRDetected={(isPR) => setGhostPRs(prev => ({ ...prev, [localExs[ei].name]: isPR }))} />
                      {sets[ei].map((s: any, si: number) => (
                        <WorkoutSetRow key={si} s={s} ei={ei} si={si} theme={theme} C={C} upd={upd} toggle={toggle} setCurrentExerciseIdx={setCurrentExerciseIdx} setCurrentSetIdx={setCurrentSetIdx} setShowPlateCalc={setShowPlateCalc} profile={profile} setStartTimes={setStartTimes} tr={tr} />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>
            );
          })}

          <button onClick={() => setShowLibrary(true)} style={{ width: "100%", background: "none", border: `2px dashed ${C.border}`, borderRadius: 12, padding: 18, color: C.accent, fontFamily: "'Bebas Neue'", fontSize: 18, letterSpacing: 2, cursor: "pointer", marginTop: 10 }}>
            + ADICIONAR EXERCÍCIO
          </button>
        </div>

        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "12px 18px", background: `linear-gradient(to top, #080b0f, transparent)` }}>
          <GradientButton onClick={finish} variant="primary" style={{ width: "100%", maxWidth: 480, display: "flex", justifyContent: "center", margin: "0 auto", padding: 14, fontSize: 18 }}>
            TERMINAR · {doneSets}/{totalSets} SÉRIES
          </GradientButton>
        </div>
      </div>
    </GlobalBackground>
  );
}
