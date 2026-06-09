import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { GlobalBackground } from "../components/ui/GlobalBackground";
import { GlassCard } from "../components/ui/GlassCard";
import { GradientButton } from "../components/ui/GradientButton";
import { WorkoutModeSelector, WorkoutMode } from "../components/workout/WorkoutModeSelector";
import { MobilityTimer } from "../components/workout/MobilityTimer";
import { DemographicEngine } from "../services/demographicEngine";

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

import { DynamicRPESlider } from "../components/workout/DynamicRPESlider";
import { WorkoutHeader } from "../components/workout/WorkoutHeader";
import { WorkoutControls } from "../components/workout/WorkoutControls";
import { WorkoutExerciseList } from "../components/workout/WorkoutExerciseList";
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
const SmartCamera = React.lazy(() => import('../components/3d/SmartCamera').then(module => ({ default: module.SmartCamera })));
import { checkAutoProgression } from "../data/utils";
const MuscleViewer = React.lazy(() => import('../components/3d/MuscleViewer').then(module => ({ default: module.MuscleViewer })));
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
import { preWorkoutSafetyCheck, InjuryRiskReport } from "../services/injuryPredictionEngine";
import { WorkoutSetRow } from "../components/workout/WorkoutSetRow";

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
    const prescription = getPrescription(profile, ex.name, pr, todayPlan.phase, history);
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

  const [injuryRisk, setInjuryRisk] = useState<InjuryRiskReport | null>(null);

  useEffect(() => {
    preWorkoutSafetyCheck().then(res => {
      if (res.overrideRequired) {
        setInjuryRisk(res.report);
      }
    }).catch(e => console.warn('[InjuryPrediction] Erro:', e));
  }, []);

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

  // ── MODO DE TREINO (AMRAP / EMOM / Mobilidade / Clássico) ──
  const [workoutMode, setWorkoutMode] = useState<WorkoutMode>('classic');

  // AMRAP: tempo total fixo (15 min por defeito)
  const [amrapDuration, setAmrapDuration] = useState(15 * 60);
  const [amrapTimeLeft, setAmrapTimeLeft] = useState(15 * 60);
  const [amrapRunning, setAmrapRunning] = useState(false);
  const [roundsCompleted, setRoundsCompleted] = useState(0);

  // EMOM: intervalo de 1 minuto
  const [emomRemainingSeconds, setEmomRemainingSeconds] = useState(60);
  const [emomRound, setEmomRound] = useState(1);
  const [emomRunning, setEmomRunning] = useState(false);

  // ── PERFIL DEMOGRÁFICO ──
  const demographicProfile = DemographicEngine.getProfileType(
    profile.age || 30,
    profile.gender || 'other',
    profile.wantsCycleSyncing || false
  );
  const demoFeatures = DemographicEngine.getFeatures(demographicProfile);

  // Slider de dor articular (para idosos)
  const [jointPain, setJointPain] = useState(0);
  const isHighImpactPainful = demoFeatures.autoReplaceImpact && jointPain >= 7;

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

  // ── AMRAP Timer ──
  useEffect(() => {
    if (workoutMode !== 'amrap' || !amrapRunning) return;
    if (amrapTimeLeft <= 0) {
      setAmrapRunning(false);
      navigator.vibrate?.([300, 100, 300, 100, 300]);
      return;
    }
    const interval = setInterval(() => setAmrapTimeLeft(p => p - 1), 1000);
    return () => clearInterval(interval);
  }, [workoutMode, amrapRunning, amrapTimeLeft]);

  // ── EMOM Timer ──
  useEffect(() => {
    if (workoutMode !== 'emom' || !emomRunning) return;
    if (emomRemainingSeconds <= 0) {
      navigator.vibrate?.(500);
      setEmomRemainingSeconds(60);
      setEmomRound(r => r + 1);
      return;
    }
    const interval = setInterval(() => setEmomRemainingSeconds(p => p - 1), 1000);
    return () => clearInterval(interval);
  }, [workoutMode, emomRunning, emomRemainingSeconds]);

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

    // Calcular RPE médio das séries concluídas
    const doneSetsArr = sets.flat().filter((s: any) => s.done);
    const totalRpe = doneSetsArr.reduce((sum: number, s: any) => sum + (s.rpe || 8), 0);
    const avgRPE = doneSetsArr.length > 0
      ? Math.round((totalRpe / doneSetsArr.length) * 10) / 10
      : 0;

    const payload = {
      id: workoutIdRef.current,
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
      avgRPE,
      isCustom: isCustom,
      customExercisesList: isCustom ? todayPlan.exercises : [],
    };

    // ── IndexedDB: Gravar WorkoutSession ──
    saveWorkoutSession({
      id: workoutIdRef.current,
      date: Date.now(),
      name: todayPlan.label || 'Treino Livre',
      durationSeconds: elapsed,
      readinessScore: 85, // Default, pode ser ligado ao useEffortStore no futuro
      totalVolumeKg: vol,
      avgRPE,
      isCompleted: true,
    } as any).catch(e => console.warn('[IDB] Falha ao gravar WorkoutSession:', e));

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
                  const prescription = getPrescription(profile, ex.name, pr, todayPlan.phase, history);
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
        
        {injuryRisk && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 24 }}>
            <div style={{ background: '#1a1f26', border: `2px solid ${injuryRisk.overallRisk === 'critical' ? '#ef4444' : '#f97316'}`, borderRadius: 16, padding: 30, maxWidth: 400, width: "100%" }}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <span style={{ fontSize: 40 }}>{injuryRisk.overallRisk === 'critical' ? '🛑' : '⚠️'}</span>
                <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 28, color: injuryRisk.overallRisk === 'critical' ? '#ef4444' : '#f97316', margin: '10px 0 5px' }}>
                  RISCO DE LESÃO DETETADO
                </h2>
                <p style={{ color: '#94a3b8', fontSize: 14 }}>O sistema de segurança clínica identificou anomalias no teu padrão de treino.</p>
              </div>
              
              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 16, marginBottom: 20 }}>
                {injuryRisk.flags.slice(0, 2).map((flag, i) => (
                  <div key={i} style={{ marginBottom: i === 0 ? 12 : 0, display: 'flex', gap: 10 }}>
                    <span style={{ color: flag.severity === 'critical' ? '#ef4444' : '#f97316' }}>•</span>
                    <span style={{ color: '#e2e8f0', fontSize: 13, lineHeight: 1.4 }}>{flag.message}</span>
                  </div>
                ))}
              </div>
              
              <div style={{ marginBottom: 24 }}>
                <p style={{ color: '#86efac', fontSize: 12, fontWeight: 'bold', marginBottom: 8 }}>RECOMENDAÇÃO CLÍNICA:</p>
                {injuryRisk.recommendations.map((rec, i) => (
                  <p key={i} style={{ color: '#cbd5e1', fontSize: 13, margin: '0 0 4px', paddingLeft: 10, borderLeft: '2px solid #86efac' }}>{rec}</p>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: 'column', gap: 10 }}>
                {injuryRisk.overallRisk !== 'critical' && (
                  <button onClick={() => setInjuryRisk(null)} style={{ background: 'transparent', border: `1px solid #475569`, borderRadius: 8, padding: 14, color: '#94a3b8', cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
                    Estou ciente, assumir risco e treinar
                  </button>
                )}
                <button onClick={onCancel} style={{ background: injuryRisk.overallRisk === 'critical' ? '#ef4444' : '#f97316', border: "none", borderRadius: 8, padding: 14, color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 16 }}>
                  {injuryRisk.overallRisk === 'critical' ? 'Aceitar Recomendação e Descansar' : 'Cancelar Treino'}
                </button>
              </div>
            </div>
          </div>
        )}

        <WorkoutHeader 
          theme={theme} C={C} todayPlan={todayPlan} elapsed={elapsed} fmt={fmt}
          ftms={ftms} btStatus={btStatus} btConnect={btConnect} bpm={bpm}
          doneSets={doneSets} totalSets={totalSets} setShowShareModal={setShowShareModal}
          setShowTimer={setShowTimer} setConfirmCancel={setConfirmCancel}
        />

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

          {/* ── SELETOR DE MODO DE TREINO ── */}
          <div style={{ marginBottom: 16 }}>
            <WorkoutModeSelector mode={workoutMode} onChange={(m) => {
              setWorkoutMode(m);
              if (m === 'amrap') { setAmrapTimeLeft(amrapDuration); setAmrapRunning(false); }
              if (m === 'emom') { setEmomRemainingSeconds(60); setEmomRound(1); setEmomRunning(false); }
            }} />

            {/* HUD AMRAP */}
            {workoutMode === 'amrap' && (
              <div style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 14, padding: 16, marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div>
                    <p style={{ fontSize: 10, color: '#f97316', fontFamily: "'DM Mono'", letterSpacing: 2 }}>TEMPO RESTANTE</p>
                    <p style={{ fontFamily: "'DM Mono'", fontSize: 32, color: amrapTimeLeft < 60 ? '#ef4444' : '#f97316', fontWeight: 700 }}>
                      {Math.floor(amrapTimeLeft / 60)}:{(amrapTimeLeft % 60).toString().padStart(2, '0')}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 10, color: '#55626e', fontFamily: "'DM Mono'", letterSpacing: 2 }}>RONDAS</p>
                    <p style={{ fontFamily: "'Bebas Neue'", fontSize: 32, color: '#f97316' }}>{roundsCompleted}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setAmrapRunning(r => !r)}
                    disabled={amrapTimeLeft <= 0}
                    style={{ flex: 2, background: amrapRunning ? 'rgba(239,68,68,0.2)' : 'rgba(249,115,22,0.2)', border: `1px solid ${amrapRunning ? '#ef4444' : '#f97316'}`, borderRadius: 10, padding: 10, color: amrapRunning ? '#fca5a5' : '#f97316', fontFamily: "'Bebas Neue'", fontSize: 16, letterSpacing: 1, cursor: 'pointer' }}
                  >
                    {amrapRunning ? '⏸ PAUSAR' : amrapTimeLeft <= 0 ? '✓ FIM' : '▶ INICIAR'}
                  </button>
                  <button
                    onClick={() => setRoundsCompleted(r => r + 1)}
                    style={{ flex: 1, background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 10, padding: 10, color: '#f97316', fontFamily: "'Bebas Neue'", fontSize: 14, letterSpacing: 1, cursor: 'pointer' }}
                  >
                    + RONDA
                  </button>
                  <button
                    onClick={() => { setAmrapTimeLeft(amrapDuration); setAmrapRunning(false); setRoundsCompleted(0); }}
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', color: '#55626e', fontFamily: "'Bebas Neue'", fontSize: 14, cursor: 'pointer' }}
                  >
                    ↺
                  </button>
                </div>
              </div>
            )}

            {/* HUD EMOM */}
            {workoutMode === 'emom' && (
              <div style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: 14, padding: 16, marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div>
                    <p style={{ fontSize: 10, color: '#38bdf8', fontFamily: "'DM Mono'", letterSpacing: 2 }}>TEMPO P/ PRÓXIMA RONDA</p>
                    <p style={{ fontFamily: "'DM Mono'", fontSize: 40, color: emomRemainingSeconds <= 10 ? '#ef4444' : '#38bdf8', fontWeight: 700, lineHeight: 1 }}>
                      {emomRemainingSeconds}<span style={{ fontSize: 16 }}>s</span>
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 10, color: '#55626e', fontFamily: "'DM Mono'", letterSpacing: 2 }}>RONDA</p>
                    <p style={{ fontFamily: "'Bebas Neue'", fontSize: 32, color: '#38bdf8' }}>#{emomRound}</p>
                  </div>
                </div>
                {/* Barra de progresso do minuto */}
                <div style={{ width: '100%', height: 4, background: 'rgba(0,0,0,0.4)', borderRadius: 2, overflow: 'hidden', marginBottom: 10 }}>
                  <div style={{ height: '100%', width: `${((60 - emomRemainingSeconds) / 60) * 100}%`, background: 'linear-gradient(90deg, #38bdf8, #0ea5e9)', borderRadius: 2, transition: 'width 1s linear' }} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setEmomRunning(r => !r)}
                    style={{ flex: 2, background: emomRunning ? 'rgba(239,68,68,0.2)' : 'rgba(56,189,248,0.2)', border: `1px solid ${emomRunning ? '#ef4444' : '#38bdf8'}`, borderRadius: 10, padding: 10, color: emomRunning ? '#fca5a5' : '#38bdf8', fontFamily: "'Bebas Neue'", fontSize: 16, letterSpacing: 1, cursor: 'pointer' }}
                  >
                    {emomRunning ? '⏸ PAUSAR' : '▶ INICIAR'}
                  </button>
                  <button
                    onClick={() => { setEmomRunning(false); setEmomRemainingSeconds(60); setEmomRound(1); }}
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', color: '#55626e', fontFamily: "'Bebas Neue'", fontSize: 14, cursor: 'pointer' }}
                  >
                    ↺
                  </button>
                </div>
              </div>
            )}

            {/* SLIDER DOR ARTICULAR (Idosos) */}
            {demoFeatures.rpeType === 'joint_pain_scale' && (
              <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: 14, marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <p style={{ fontSize: 11, color: '#fca5a5', fontFamily: "'DM Mono'", letterSpacing: 1 }}>🦴 DOR ARTICULAR</p>
                  <span style={{ fontFamily: "'DM Mono'", fontSize: 16, color: jointPain >= 7 ? '#ef4444' : jointPain >= 4 ? '#f97316' : '#3dd68c', fontWeight: 700 }}>
                    {jointPain}/10
                  </span>
                </div>
                <input
                  type="range" min={0} max={10} value={jointPain}
                  onChange={(e) => setJointPain(Number(e.target.value))}
                  style={{ width: '100%', accentColor: jointPain >= 7 ? '#ef4444' : jointPain >= 4 ? '#f97316' : '#3dd68c', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span style={{ fontSize: 9, color: '#3dd68c' }}>Nenhuma</span>
                  <span style={{ fontSize: 9, color: '#f97316' }}>Moderada</span>
                  <span style={{ fontSize: 9, color: '#ef4444' }}>Máxima</span>
                </div>
                {isHighImpactPainful && (
                  <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8 }}>
                    <p style={{ fontSize: 11, color: '#fca5a5', lineHeight: 1.4 }}>
                      ⚠️ Dor elevada detetada! Os exercícios de alto impacto foram adaptados para proteger as tuas articulações.
                    </p>
                  </div>
                )}
              </div>
            )}
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
        <React.Suspense fallback={null}>
          <SmartCamera onLandmarks={(lm) => { liveLandmarksRef.current = lm; }} />
        </React.Suspense>
        <div style={{ marginBottom: 16 }}>
             <React.Suspense fallback={null}>
               <MuscleViewer fatigueStats={{}} landmarksRef={liveLandmarksRef} />
             </React.Suspense>
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

          {/* MODO MOBILIDADE: substitui a lista por temporizadores */}
          {workoutMode === 'mobility' ? (
            <div>
              <p style={{ fontSize: 10, color: '#a78bfa', fontFamily: "'DM Mono'", letterSpacing: 2, marginBottom: 12 }}>🧘 EXERCÍCIOS DE MOBILIDADE</p>
              {localExs.map((ex: any, i: number) => (
                <MobilityTimer key={i} exerciseName={ex.name} defaultSeconds={30} />
              ))}
            </div>
          ) : (
            <WorkoutExerciseList
              localExs={isHighImpactPainful ? localExs.map((ex: any) => ({ ...ex, name: DemographicEngine.replaceHighImpactExercise(ex.name), _originalName: ex.name })) : localExs}
              sets={sets} todayPlan={todayPlan} profile={profile}
              history={history} theme={theme} C={C} openIdx={openIdx} setOpenIdx={setOpenIdx}
              getRecommendedReps={getRecommendedReps} getHistoricalPR={getHistoricalPR}
              getPrescription={getPrescription} checkAutoProgression={checkAutoProgression}
              ME={ME} speak={speak} applyStrengthPreset={applyStrengthPreset}
              applyEndurancePreset={applyEndurancePreset} applyVolumePreset={applyVolumePreset}
              addWarmups={addWarmups} upd={upd} toggle={toggle} setCurrentExerciseIdx={setCurrentExerciseIdx}
              setCurrentSetIdx={setCurrentSetIdx} setShowPlateCalc={setShowPlateCalc}
              setStartTimes={setStartTimes} setGhostPRs={setGhostPRs}
              hideWeight={demoFeatures.hideWeight}
            />
          )}

          <button onClick={() => setShowLibrary(true)} style={{ width: "100%", background: "none", border: `2px dashed ${C.border}`, borderRadius: 12, padding: 18, color: C.accent, fontFamily: "'Bebas Neue'", fontSize: 18, letterSpacing: 2, cursor: "pointer", marginTop: 10 }}>
            + ADICIONAR EXERCÍCIO
          </button>
        </div>

        <WorkoutControls finish={finish} doneSets={doneSets} totalSets={totalSets} />
      </div>
    </GlobalBackground>
  );
}
