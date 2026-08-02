import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { GlobalBackground } from "../components/ui/GlobalBackground";
import { C, ME } from "../data/constants";
import { useExerciseStore } from "../stores/useExerciseStore";
import { useWakeLock, useBeep, useGhostMode } from "../hooks";
import { useBluetoothHRM } from "../hooks/useBluetoothHRM";
import { useFitnessMachine } from "../hooks/useFitnessMachine";
import { useDeviceStore } from "../stores/useDeviceStore";
import { preWorkoutSafetyCheck, InjuryRiskReport } from "../services/injuryPredictionEngine";
import { getPrescription } from "../utils/prescriptionEngine";
import { ProgressionSystem } from "../services/ProgressionSystem";
import { useAudioCoach } from "../hooks/useAudioCoach";
import { DemographicEngine } from "../services/demographicEngine";
import { RivalAI } from "../services/rivalAI";
import { useProgressiveHaptics } from "../hooks/useProgressiveHaptics";

// ── COMPONENTES ────────────────────────────────────────────────────────────
import { WorkoutHeader } from "../components/workout/WorkoutHeader";
import { WorkoutControls } from "../components/workout/WorkoutControls";
import { WorkoutExerciseList } from "../components/workout/WorkoutExerciseList";
import { RestTimer } from "../components/workout/RestTimer";
import { ExerciseLibrary } from "../components/workout/ExerciseLibrary";
import { PRTracker } from "../components/workout/PRTracker";
import { CircuitProgress } from "../components/workout/CircuitProgress";
import { AutoRepToggle } from "../components/workout/AutoRepToggle";
import { MobilityTimer } from "../components/workout/MobilityTimer";
import { WorkoutModeSelector, WorkoutMode } from "../components/workout/WorkoutModeSelector";
import { PlateCalculator } from "../components/PlateCalculator/PlateCalculator";
import { RivalRace } from "../components/rival/RivalRace";
import { RivalResult } from "../components/rival/RivalResult";
import { GhostToggle } from "../components/GhostToggle";
import { ShareWorkoutModal } from "../components/social/ShareWorkoutModal";
import Confetti from 'react-confetti';

// ── HOOKS & STORES ─────────────────────────────────────────────────────────
import { useGhostStore } from "../stores/useGhostStore";
import { useProgressionStore } from "../stores/useProgressionStore";
import { useMilestonesStore } from "../stores/useMilestonesStore";
import { saveSetLog, saveWorkoutSession, updatePersonalRecord, generateId } from "../db/encryptedDb";
import { analyzeExerciseTrend, TrendAnalysis } from "../services/trendAnalyzer";
import { getExerciseCategory } from "../data/exerciseClassifier";
import { getWarmupSets } from "../services/fitnessMechanics";
import { checkAutoProgression } from "../data/utils";

// ── TYPES ──────────────────────────────────────────────────────────────────
export interface ActiveWorkoutProps {
  todayPlan: any;
  profile: any;
  history: any[];
  onFinish: (data: any) => void;
  onCancel: () => void;
}

type SetArray = Array<Array<{ reps: number; weight: number; rpe: number; done: boolean }>>;
type LocalExercise = { name: string; muscle: string; [key: string]: any };

// ── HELPERS PUROS (extraídos com complexidade baixa) ──────────────────────

/** Get historical PR for an exercise */
function findHistoricalPR(history: any[], exerciseName: string) {
  const pastWorkouts = [...(history || [])].reverse();
  const lastWorkout = pastWorkouts.find((w: any) =>
    w.exercises?.some((e: any) => e.name === exerciseName)
  );
  if (!lastWorkout) return null;
  const lastEx = lastWorkout.exercises.find((e: any) => e.name === exerciseName);
  if (!lastEx || !lastEx.sets?.length) return null;
  const bestSet = lastEx.sets.reduce((prev: any, cur: any) =>
    (prev.weight || 0) > (cur.weight || 0) ? prev : cur
  );
  return { weight: bestSet.weight, reps: bestSet.reps };
}

/** Initialize sets from exercises */
function initSets(exercises: LocalExercise[], profile: any, todayPlan: any, history: any[]): SetArray {
  return exercises.map((ex: any) => {
    const pr = findHistoricalPR(history, ex.name);
    const prescription = getPrescription(profile, ex.name, pr, todayPlan.phase, history);
    const startW = prescription.suggestedWeight ||
      ProgressionSystem.calculateNextWeight((pr?.weight || 0), (pr?.reps || 10), 10);
    return Array.from({ length: 3 }, () => ({
      reps: prescription.repsSuggested,
      weight: startW,
      rpe: prescription.rpeTarget,
      done: false,
      type: ex.type || 'weighted',
      duration: 0,
      distance: 0,
      addedWeight: 0,
    }));
  });
}

/** Save PR and set log to database */
async function savePRAndSetLog(
  exName: string,
  ei: number,
  si: number,
  currentSet: any,
  workoutId: string
) {
  const oneRM = Math.round(currentSet.weight * (1 + currentSet.reps / 30));
  const currentPR = useMilestonesStore.getState().getPR(exName);
  const isNewPR = oneRM > currentPR;
  if (isNewPR) {
    useMilestonesStore.getState().setPR(exName, oneRM);
  }

  const exerciseCategory = (() => {
    try { return getExerciseCategory(exName); } catch { return 'compound_multi'; }
  })();

  await saveSetLog({
    workoutId,
    exerciseName: exName,
    category: exerciseCategory,
    setNumber: si + 1,
    weightKg: currentSet.weight,
    repsCompleted: currentSet.reps,
    rpe: currentSet.rpe || 8,
    estimated1RM: oneRM,
    timestamp: Date.now(),
  }).catch(e => console.warn('[IDB] Falha ao gravar SetLog:', e));

  await updatePersonalRecord(exName, oneRM, currentSet.weight, currentSet.reps)
    .catch(e => console.warn('[IDB] Falha ao atualizar PR:', e));

  return isNewPR ? { exerciseName: exName, weight: oneRM } : null;
}

/** Update trend analysis message */
async function updateTrendMessage(
  exName: string,
  setAutoregulationMessage: React.Dispatch<React.SetStateAction<{ text: string; type: string } | null>>
) {
  try {
    const trend = await analyzeExerciseTrend(exName);
    if (trend.status === 'PROGRESSING') {
      setAutoregulationMessage({
        text: `💪 ${trend.message} +${trend.suggestedWeightIncrement}kg na próxima sessão!`,
        type: 'success',
      });
    } else if (trend.status === 'FATIGUED') {
      setAutoregulationMessage({
        text: `⚠️ ${trend.message} Reduz ${Math.abs(trend.suggestedWeightIncrement)}kg.`,
        type: 'danger',
      });
    }
  } catch { /* silent */ }
}

/** Format seconds as MM:SS */
function fmt(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/** Calculate total volume from sets */
function calcVolume(sets: SetArray) {
  return sets.flat().filter((s: any) => s.done).reduce((a: any, s: any) => {
    switch (s.type) {
      case 'bodyweight':
        return a + (s.reps || 0) + ((s.addedWeight || 0) * (s.reps || 0));
      case 'cardio':
        return a + ((s.distance || 0) * 100) + Math.floor((s.duration || 0) / 60) * 10;
      case 'timed':
        return a + Math.floor((s.duration || 0) / 60) * 5;
      default:
        return a + ((s.weight || 0) * (s.reps || 0));
    }
  }, 0);
}

/** Clones sets nested array immutably */
function cloneSets(sets: SetArray): SetArray {
  return sets.map((e: any) => e.map((s: any) => ({ ...s })));
}

// ── SUB-COMPONENTES ────────────────────────────────────────────────────────

function ConfirmCancelModal({ onBack, onConfirm }: { onBack: () => void; onConfirm: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(8,11,15,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 150, padding: 24 }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 26, maxWidth: 300, width: "100%", textAlign: "center" }}>
        <p style={{ fontFamily: "'Bebas Neue'", fontSize: 22, letterSpacing: 2, marginBottom: 8 }}>ABANDONAR?</p>
        <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>O progresso não será guardado.</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onBack} style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, color: C.text, cursor: "pointer", fontWeight: 600, fontSize: 16 }}>Voltar</button>
          <button onClick={onConfirm} style={{ flex: 1, background: C.red, border: "none", borderRadius: 12, padding: 20, color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 16 }}>Sair</button>
        </div>
      </div>
    </div>
  );
}

function AmrapHUD({
  amrapTimeLeft, amrapDuration, roundsCompleted,
  amrapRunning, setAmrapRunning, setRoundsCompleted,
  setAmrapTimeLeft,
}: {
  amrapTimeLeft: number; amrapDuration: number; roundsCompleted: number;
  amrapRunning: boolean; setAmrapRunning: (v: boolean) => void;
  setRoundsCompleted: React.Dispatch<React.SetStateAction<number>>;
  setAmrapTimeLeft: React.Dispatch<React.SetStateAction<number>>;
}) {
  return (
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
        <button onClick={() => setAmrapRunning(r => !r)} disabled={amrapTimeLeft <= 0}
          style={{ flex: 2, background: amrapRunning ? 'rgba(239,68,68,0.2)' : 'rgba(249,115,22,0.2)', border: `1px solid ${amrapRunning ? '#ef4444' : '#f97316'}`, borderRadius: 10, padding: 20, color: amrapRunning ? '#fca5a5' : '#f97316', fontFamily: "'Bebas Neue'", fontSize: 16, letterSpacing: 1, cursor: 'pointer' }}>
          {amrapRunning ? '⏸ PAUSAR' : amrapTimeLeft <= 0 ? '✓ FIM' : '▶ INICIAR'}
        </button>
        <button onClick={() => setRoundsCompleted(r => r + 1)}
          style={{ flex: 1, background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 10, padding: 20, color: '#f97316', fontFamily: "'Bebas Neue'", fontSize: 14, letterSpacing: 1, cursor: 'pointer' }}>
          + RONDA
        </button>
        <button onClick={() => { setAmrapTimeLeft(amrapDuration); setAmrapRunning(false); setRoundsCompleted(0); }}
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', color: '#55626e', fontFamily: "'Bebas Neue'", fontSize: 14, cursor: 'pointer' }}>
          ↺
        </button>
      </div>
    </div>
  );
}

function EmomHUD({
  emomRemainingSeconds, emomRound, emomRunning,
  setEmomRunning, setEmomRemainingSeconds, setEmomRound,
}: {
  emomRemainingSeconds: number; emomRound: number; emomRunning: boolean;
  setEmomRunning: (v: boolean) => void;
  setEmomRemainingSeconds: React.Dispatch<React.SetStateAction<number>>;
  setEmomRound: React.Dispatch<React.SetStateAction<number>>;
}) {
  return (
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
      <div style={{ width: '100%', height: 4, background: 'rgba(0,0,0,0.4)', borderRadius: 2, overflow: 'hidden', marginBottom: 10 }}>
        <div style={{ height: '100%', width: `${((60 - emomRemainingSeconds) / 60) * 100}%`, background: 'linear-gradient(90deg, #38bdf8, #0ea5e9)', borderRadius: 2, transition: 'width 1s linear' }} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => setEmomRunning(r => !r)}
          style={{ flex: 2, background: emomRunning ? 'rgba(239,68,68,0.2)' : 'rgba(56,189,248,0.2)', border: `1px solid ${emomRunning ? '#ef4444' : '#38bdf8'}`, borderRadius: 10, padding: 20, color: emomRunning ? '#fca5a5' : '#38bdf8', fontFamily: "'Bebas Neue'", fontSize: 16, letterSpacing: 1, cursor: 'pointer' }}>
          {emomRunning ? '⏸ PAUSAR' : '▶ INICIAR'}
        </button>
        <button onClick={() => { setEmomRunning(false); setEmomRemainingSeconds(60); setEmomRound(1); }}
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', color: '#55626e', fontFamily: "'Bebas Neue'", fontSize: 14, cursor: 'pointer' }}>
          ↺
        </button>
      </div>
    </div>
  );
}

function InjuryRiskModal({
  injuryRisk, onDismiss, onCancel,
}: {
  injuryRisk: InjuryRiskReport; onDismiss: () => void; onCancel: () => void;
}) {
  return (
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
            <button onClick={onDismiss} style={{ background: 'transparent', border: '1px solid #475569', borderRadius: 12, padding: 20, color: '#94a3b8', cursor: "pointer", fontWeight: 600, fontSize: 16 }}>
              Estou ciente, assumir risco e treinar
            </button>
          )}
          <button onClick={onCancel} style={{ background: injuryRisk.overallRisk === 'critical' ? '#ef4444' : '#f97316', border: "none", borderRadius: 12, padding: 20, color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 18 }}>
            {injuryRisk.overallRisk === 'critical' ? 'Aceitar Recomendação e Descansar' : 'Cancelar Treino'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AutoregulationBanner({
  message, onClose,
}: {
  message: { text: string; type: string } | null;
  onClose: () => void;
}) {
  if (!message) return null;
  const isDanger = message.type === 'danger';
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{
        marginBottom: 16,
        padding: '12px 16px',
        borderRadius: 8,
        background: isDanger
          ? 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(153,27,27,0.25))'
          : 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(20,83,45,0.25))',
        border: `1px solid ${isDanger ? '#ef4444' : '#22c55e'}`,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: `0 4px 20px ${isDanger ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`
      }}
    >
      <span style={{ fontSize: 20 }}>{isDanger ? '⚡' : '✨'}</span>
      <div style={{ flex: 1 }}>
        <p style={{ fontFamily: "'Bebas Neue'", fontSize: 14, letterSpacing: 1, margin: 0, color: isDanger ? '#fca5a5' : '#86efac' }}>
          {isDanger ? 'AUTORREGULAÇÃO ATIVADA' : 'FEEDBACK DE PERFORMANCE'}
        </p>
        <p style={{ fontSize: 11, color: '#f8fafc', margin: '2px 0 0', lineHeight: 1.3 }}>{message.text}</p>
      </div>
      <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#cbd5e1', fontSize: 16, cursor: 'pointer', padding: 4 }}>×</button>
    </motion.div>
  );
}

// ── HOOK PRINCIPAL ─────────────────────────────────────────────────────────

export default function ActiveWorkout({ todayPlan, profile, history, onFinish, onCancel }: ActiveWorkoutProps) {
  const { exercises: EXERCISE_DB, isLoading: isDbLoading, fetchExercises } = useExerciseStore();
  useEffect(() => { fetchExercises(); }, [fetchExercises]);

  // Estado principal
  const [localExs, setLocalExs] = useState<LocalExercise[]>(() =>
    todayPlan.exercises.map((n: string) => ({
      name: n, muscle: "Treino", ...(EXERCISE_DB[n] || {})
    }))
  );
  const [sets, setSets] = useState<SetArray>(() => initSets(localExs, profile, todayPlan, history));
  const [openIdx, setOpenIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showPlateCalc, setShowPlateCalc] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showRivalResult, setShowRivalResult] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [finalVolume, setFinalVolume] = useState(0);
  const [injuryRisk, setInjuryRisk] = useState<InjuryRiskReport | null>(null);
  const [newPRData, setNewPRData] = useState<{ exerciseName: string; weight: number } | null>(null);
  const [autoregulationMessage, setAutoregulationMessage] = useState<{ text: string; type: string } | null>(null);
  const [autoRepActive, setAutoRepActive] = useState(false);
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  const [currentSetIdx, setCurrentSetIdx] = useState(0);
  const [setStartTimes, setSetStartTimes] = useState<Record<string, number>>({});
  const [ghostPRs, setGhostPRs] = useState<Record<string, boolean>>({});
  const [rivalState] = useState(() => RivalAI.findRival(history, todayPlan.label));
  const [isCircuit, setIsCircuit] = useState(todayPlan.type === 'circuit');
  const [currentRound, setCurrentRound] = useState(1);
  const [roundRestRemaining, setRoundRestRemaining] = useState<number | null>(null);
  const [roundExercisesCompleted, setRoundExercisesCompleted] = useState<string[]>([]);

  // Modos de treino
  const [workoutMode, setWorkoutMode] = useState<WorkoutMode>('classic');
  const [amrapDuration, setAmrapDuration] = useState(15 * 60);
  const [amrapTimeLeft, setAmrapTimeLeft] = useState(15 * 60);
  const [amrapRunning, setAmrapRunning] = useState(false);
  const [roundsCompleted, setRoundsCompleted] = useState(0);
  const [emomRemainingSeconds, setEmomRemainingSeconds] = useState(60);
  const [emomRound, setEmomRound] = useState(1);
  const [emomRunning, setEmomRunning] = useState(false);

  const workoutIdRef = useRef<string>(generateId());
  const { beep } = useBeep();
  const hrm = useBluetoothHRM();
  const { bpm, status: btStatus, connect: btConnect } = hrm;
  const ftms = useFitnessMachine();
  const { autoSync } = useDeviceStore();
  const { triggerRepCompletionHaptic } = useProgressiveHaptics();
  const { active: ghostActive, registerAttempt, currentGhost } = useGhostStore();
  const { getRecommendedReps, recordSession, recordSuccess, recordFailure } = useProgressionStore();
  const { speak } = useAudioCoach();

  // Demographics
  const demographicProfile = DemographicEngine.getProfileType(
    profile.age || 30, profile.gender || 'other', profile.wantsCycleSyncing || false
  );
  const demoFeatures = DemographicEngine.getFeatures(demographicProfile);
  const [jointPain, setJointPain] = useState(0);
  const isHighImpactPainful = demoFeatures.autoReplaceImpact && jointPain >= 7;

  // Efeitos
  useWakeLock(true);

  useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    preWorkoutSafetyCheck().then(res => {
      if (res.overrideRequired) setInjuryRisk(res.report);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (workoutMode !== 'amrap' || !amrapRunning) return;
    if (amrapTimeLeft <= 0) { setAmrapRunning(false); navigator.vibrate?.([300, 100, 300, 100, 300]); return; }
    const interval = setInterval(() => setAmrapTimeLeft(p => p - 1), 1000);
    return () => clearInterval(interval);
  }, [workoutMode, amrapRunning, amrapTimeLeft]);

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

  useEffect(() => {
    if (Object.keys(EXERCISE_DB).length > 0 && localExs.some(e => !e.equipment)) {
      setLocalExs((prev) => prev.map((e) => ({ ...e, ...(EXERCISE_DB[e.name] || {}) })));
    }
  }, [EXERCISE_DB]);

  // Handlers
  const handleRepDetected = () => {
    if (!profile.proMode && navigator.vibrate) navigator.vibrate(20);
    if (openIdx !== -1) {
      const activeSetIdx = sets[openIdx]?.findIndex((s: any) => !s.done);
      if (activeSetIdx !== -1) {
        const currentReps = sets[openIdx][activeSetIdx].reps;
        upd(openIdx, activeSetIdx, "reps", String(currentReps + 1));
      }
    }
  };

  const handlePRAndSaveLog = async (ei: number, si: number, currentSet: any, exName: string) => {
    const prResult = await savePRAndSetLog(exName, ei, si, currentSet, workoutIdRef.current);
    if (prResult) setNewPRData(prResult);
    updateTrendMessage(exName, setAutoregulationMessage);
  };

  const handleGhostMode = (ei: number, currentSet: any) => {
    if (!ghostActive || profile.proMode) return false;
    const isGhostSuccess = currentSet.reps >= (currentGhost?.bestReps || 0);
    const xpGain = registerAttempt(localExs[ei].name, currentSet.weight, currentSet.reps, isGhostSuccess);
    if (xpGain > 0) { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 3000); }
    return isGhostSuccess;
  };

  const handleCircuitCompletion = (ei: number) => {
    if (!isCircuit) return;
    const newCompleted = [...roundExercisesCompleted, localExs[ei].name];
    if (roundExercisesCompleted.includes(localExs[ei].name)) return;
    setRoundExercisesCompleted(newCompleted);
    if (newCompleted.length === localExs.length && currentRound < (todayPlan.rounds || 1)) {
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
  };

  const handleProgressionEvaluation = (ei: number, currentSet: any) => {
    const tr = getRecommendedReps(localExs[ei].name, localExs[ei].base?.hipertrofia?.[2] || 10);
    const rpeVal = currentSet.rpe ? Number(currentSet.rpe) : 8;
    if (currentSet.reps < tr * 0.8 || rpeVal >= 9.5) {
      recordFailure(localExs[ei].name);
    } else {
      recordSuccess(localExs[ei].name, currentSet.reps, tr, rpeVal);
    }
    speak(`Série completada com ${currentSet.weight} quilos. Descansa.`);
  };

  // Toggle simplificado (extraído lógica para funções auxiliares)
  const toggle = (ei: number, si: number) => {
    const currentSet = sets[ei][si];
    if (!currentSet.done && currentSet.weight > 0 && currentSet.reps > 0) {
      handlePRAndSaveLog(ei, si, currentSet, localExs[ei].name);
    }
    setSets((prev) => {
      const n = cloneSets(prev);
      if (!n[ei][si].done) {
        if (!profile.proMode) beep(880, 0.07);
        setShowTimer(true);
        const isGhostSuccess = handleGhostMode(ei, n[ei][si]);
        triggerRepCompletionHaptic(isGhostSuccess);
        handleCircuitCompletion(ei);
        handleProgressionEvaluation(ei, currentSet);
      }
      n[ei][si].done = !n[ei][si].done;
      if (!n[ei][si].done) {
        const nst = { ...setStartTimes };
        delete nst[`${ei}-${si}`];
        setSetStartTimes(nst);
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
    setSets((prev) => {
      const n = cloneSets(prev);
      n[ei][si][f] = valNum;
      if (f === 'reps' && !setStartTimes[`${ei}-${si}`]) {
        setSetStartTimes(p => ({ ...p, [`${ei}-${si}`]: Date.now() - 5000 }));
      }
      return n;
    });
  };

  const addWarmups = (ei: number) => {
    setSets((prev) => {
      const n = cloneSets(prev);
      const workingWeight = Math.max(...n[ei].map((s) => s.weight)) || 20;
      const warmups = getWarmupSets(workingWeight).map(w => ({ ...w, done: false }));
      n[ei] = [...warmups, ...n[ei]];
      return n;
    });
  };

  const applyPreset = (ei: number, mode: 'strength' | 'endurance') => {
    const pr = findHistoricalPR(history, localExs[ei].name);
    const prescription = getPrescription(profile, localExs[ei].name, pr, todayPlan.phase);
    const preset = prescription.presets[mode];
    setSets((prev) => {
      const n = cloneSets(prev);
      n[ei] = n[ei].map(s => ({ ...s, weight: preset.weight, reps: preset.reps }));
      return n;
    });
  };

  const applyVolumePreset = (ei: number) => {
    const pr = findHistoricalPR(history, localExs[ei].name);
    const prescription = getPrescription(profile, localExs[ei].name, pr, todayPlan.phase);
    const delta = prescription.presets.volume.setsDelta || 1;
    setSets((prev) => {
      const n = cloneSets(prev);
      const newSets = [...n[ei]];
      for (let i = 0; i < delta; i++) newSets.push({ ...newSets[0], done: false });
      n[ei] = newSets;
      return n;
    });
  };

  const finish = () => {
    const totalVolume = calcVolume(sets);
    setFinalVolume(totalVolume);
    localExs.forEach((ex, idx) => {
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
    const doneSetsArr = sets.flat().filter((s) => s.done);
    const totalRpe = doneSetsArr.reduce((sum, s) => sum + (s.rpe || 8), 0);
    const avgRPE = doneSetsArr.length > 0 ? Math.round((totalRpe / doneSetsArr.length) * 10) / 10 : 0;
    const payload = {
      id: workoutIdRef.current,
      date: new Date().toISOString(),
      dayLabel: todayPlan.label || 'Treino Livre',
      duration: elapsed,
      exercises: localExs.map((ex, ei) => ({
        name: ex.name, muscle: ex.muscle, type: ex.type || 'weighted',
        sets: sets[ei].filter((s) => s.done).map(s => ({
          weight: s.weight, reps: s.reps, rpe: s.rpe || 8,
          duration: s.duration, distance: s.distance, addedWeight: s.addedWeight, type: s.type || ex.type || 'weighted'
        })),
      })).filter((e) => e.sets.length > 0),
      totalVolume: vol, avgRPE, isCustom,
      customExercisesList: isCustom ? todayPlan.exercises : [],
    };
    saveWorkoutSession({
      id: workoutIdRef.current, date: Date.now(), name: todayPlan.label || 'Treino Livre',
      durationSeconds: elapsed, readinessScore: 85, totalVolumeKg: vol, avgRPE, isCompleted: true,
    } as any).catch(e => console.warn('[IDB] Falha ao gravar WorkoutSession:', e));
    onFinish(payload);
  };

  const totalSets = sets.flat().length;
  const doneSets = sets.flat().filter((s) => s.done).length;
  const currentVolume = calcVolume(sets);

  // Render
  return (
    <GlobalBackground>
      <div style={{ minHeight: "100vh", paddingBottom: 90 }}>
        {newPRData && <PRTracker exerciseName={newPRData.exerciseName} weight={newPRData.weight} onClose={() => setNewPRData(null)} />}
        {showConfetti && !profile.proMode && <Confetti colors={['#e8c84a', '#d4b03a']} />}
        {!profile.proMode && (
          <div style={{ position: 'fixed', bottom: 90, right: 16, zIndex: 50 }}><GhostToggle /></div>
        )}
        {ghostActive && currentGhost && !profile.proMode && (
          <div style={{ position: 'fixed', top: 80, right: 16, background: 'rgba(26, 31, 37, 0.9)', backdropFilter: 'blur(10px)', padding: 12, borderRadius: 8, borderLeft: '4px solid #e8c84a', zIndex: 40 }}>
            <p style={{ fontSize: 10, color: C.accent, fontFamily: "'DM Mono'" }}>GHOST TARGET</p>
            <p style={{ fontSize: 14, fontWeight: 'bold', color: '#fff' }}>{currentGhost.bestWeight}kg x {currentGhost.bestReps}</p>
            <p style={{ fontSize: 10, color: C.muted }}>+250 XP se vencer</p>
          </div>
        )}

        {/* MODAIS */}
        {showLibrary && (
          <ExerciseLibrary
            onClose={() => setShowLibrary(false)}
            onCreateWorkout={(names) => {
              const newExs = names.map((n: string) => ({ name: n, ...(EXERCISE_DB[n] || { muscle: 'Outro' }) }));
              setLocalExs((prev) => [...prev, ...newExs]);
              setSets((prev) => {
                const newSets = newExs.map(ex => {
                  const pr = findHistoricalPR(history, ex.name);
                  const prescription = getPrescription(profile, ex.name, pr, todayPlan.phase, history);
                  const startW = prescription.suggestedWeight || ProgressionSystem.calculateNextWeight((pr?.weight || 0), (pr?.reps || 10), 10);
                  return Array.from({ length: 3 }, () => ({
                    reps: prescription.repsSuggested,
                    weight: startW,
                    rpe: prescription.rpeTarget,
                    done: false,
                    type: ex.type || 'weighted',
                    duration: 0, distance: 0, addedWeight: 0
                  }));
                });
                return [...prev, ...newSets];
              });
              setShowLibrary(false);
            }}
          />
        )}
        {showTimer && <RestTimer onClose={() => setShowTimer(false)} />}
        <PlateCalculator isOpen={showPlateCalc} onClose={() => setShowPlateCalc(false)}
          initialWeight={sets[currentExerciseIdx]?.[currentSetIdx]?.weight || 0}
          onSelectWeight={(newWeight) => upd(currentExerciseIdx, currentSetIdx, "weight", String(newWeight))} />
        {confirmCancel && <ConfirmCancelModal onBack={() => setConfirmCancel(false)} onConfirm={onCancel} />}
        {injuryRisk && <InjuryRiskModal injuryRisk={injuryRisk} onDismiss={() => setInjuryRisk(null)} onCancel={onCancel} />}
        {showRivalResult && (
          <RivalResult isWinner={finalVolume >= rivalState.rivalVolume} rivalVolume={rivalState.rivalVolume}
            userVolume={finalVolume} onContinue={() => commitFinish(finalVolume)} />
        )}
        {showShareModal && (
          <ShareWorkoutModal workoutPlan={todayPlan} onClose={() => setShowShareModal(false)}
            onImport={(importedPlan) => {
              if (importedPlan.exercises?.length > 0) {
                const newExs = importedPlan.exercises.map((n: string) => ({ name: n, muscle: "Treino", ...(EXERCISE_DB[n] || {}) }));
                setLocalExs(newExs);
                setSets(newExs.map(() => Array.from({ length: 3 }, () => ({ reps: 10, weight: 40, rpe: 8, done: false }))));
              }
            }} />
        )}

        <WorkoutHeader theme={{
          bg: '#080b0f', glass: 'rgba(19, 25, 32, 0.65)',
          glassBorder: 'rgba(232, 200, 74, 0.15)', accent: '#e8c84a',
          accentGlow: 'drop-shadow(0 0 8px rgba(232,200,74,0.6))',
          danger: '#e84a4a', success: '#3dd68c', text: '#eceae4', muted: '#55626e',
        }} C={C} todayPlan={todayPlan} elapsed={elapsed} fmt={fmt}
          ftms={ftms} btStatus={btStatus} btConnect={btConnect} bpm={bpm}
          doneSets={doneSets} totalSets={totalSets}
          setShowShareModal={setShowShareModal} setShowTimer={setShowTimer}
          setConfirmCancel={setConfirmCancel} />

        <div style={{ maxWidth: 480, margin: "0 auto", padding: "14px 18px" }}>
          <div style={{ marginBottom: 16 }}>
            <AutoRepToggle isActive={autoRepActive} onToggle={setAutoRepActive} onRepDetected={handleRepDetected} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <WorkoutModeSelector mode={workoutMode} onChange={(m) => {
              setWorkoutMode(m);
              if (m === 'amrap') { setAmrapTimeLeft(amrapDuration); setAmrapRunning(false); }
              if (m === 'emom') { setEmomRemainingSeconds(60); setEmomRound(1); setEmomRunning(false); }
            }} />
            {workoutMode === 'amrap' && (
              <AmrapHUD amrapTimeLeft={amrapTimeLeft} amrapDuration={amrapDuration}
                roundsCompleted={roundsCompleted} amrapRunning={amrapRunning}
                setAmrapRunning={setAmrapRunning} setRoundsCompleted={setRoundsCompleted}
                setAmrapTimeLeft={setAmrapTimeLeft} />
            )}
            {workoutMode === 'emom' && (
              <EmomHUD emomRemainingSeconds={emomRemainingSeconds} emomRound={emomRound}
                emomRunning={emomRunning} setEmomRunning={setEmomRunning}
                setEmomRemainingSeconds={setEmomRemainingSeconds} setEmomRound={setEmomRound} />
            )}
            {demoFeatures.rpeType === 'joint_pain_scale' && (
              <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: 14, marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <p style={{ fontSize: 11, color: '#fca5a5', fontFamily: "'DM Mono'", letterSpacing: 1 }}>🦴 DOR ARTICULAR</p>
                  <span style={{ fontFamily: "'DM Mono'", fontSize: 16, color: jointPain >= 7 ? '#ef4444' : jointPain >= 4 ? '#f97316' : '#3dd68c', fontWeight: 700 }}>{jointPain}/10</span>
                </div>
                <input type="range" min={0} max={10} value={jointPain} onChange={(e) => setJointPain(Number(e.target.value))}
                  style={{ width: '100%', accentColor: jointPain >= 7 ? '#ef4444' : jointPain >= 4 ? '#f97316' : '#3dd68c', cursor: 'pointer' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span style={{ fontSize: 9, color: '#3dd68c' }}>Nenhuma</span>
                  <span style={{ fontSize: 9, color: '#f97316' }}>Moderada</span>
                  <span style={{ fontSize: 9, color: '#ef4444' }}>Máxima</span>
                </div>
                {isHighImpactPainful && (
                  <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8 }}>
                    <p style={{ fontSize: 11, color: '#fca5a5', lineHeight: 1.4 }}>⚠️ Dor elevada detetada! Os exercícios de alto impacto foram adaptados.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <RivalRace rivalState={rivalState} elapsed={elapsed} currentVolume={currentVolume} />

          <AnimatePresence>
            <AutoregulationBanner message={autoregulationMessage} onClose={() => setAutoregulationMessage(null)} />
          </AnimatePresence>

          {isCircuit && (
            <CircuitProgress currentRound={currentRound} totalRounds={todayPlan.rounds || 1}
              restRemaining={roundRestRemaining} onRestComplete={() => setRoundRestRemaining(null)} />
          )}

          {workoutMode === 'mobility' ? (
            <div>
              <p style={{ fontSize: 10, color: '#a78bfa', fontFamily: "'DM Mono'", letterSpacing: 2, marginBottom: 12 }}>🧘 EXERCÍCIOS DE MOBILIDADE</p>
              {localExs.map((ex, i) => <MobilityTimer key={i} exerciseName={ex.name} defaultSeconds={30} />)}
            </div>
          ) : (
            <WorkoutExerciseList
              localExs={isHighImpactPainful ? localExs.map((ex) => ({ ...ex, name: DemographicEngine.replaceHighImpactExercise(ex.name), _originalName: ex.name })) : localExs}
              sets={sets} todayPlan={todayPlan} profile={profile} history={history}
              openIdx={openIdx} setOpenIdx={setOpenIdx} C={C} theme={{
                bg: '#080b0f', glass: 'rgba(19, 25, 32, 0.65)',
                glassBorder: 'rgba(232, 200, 74, 0.15)', accent: '#e8c84a',
                accentGlow: 'drop-shadow(0 0 8px rgba(232,200,74,0.6))',
                danger: '#e84a4a', success: '#3dd68c', text: '#eceae4', muted: '#55626e',
              }}
              getRecommendedReps={getRecommendedReps} getHistoricalPR={findHistoricalPR}
              checkAutoProgression={checkAutoProgression} ME={ME} speak={speak}
              getPrescription={getPrescription}
              applyStrengthPreset={(ei) => applyPreset(ei, 'strength')}
              applyEndurancePreset={(ei) => applyPreset(ei, 'endurance')}
              applyVolumePreset={applyVolumePreset}
              addWarmups={addWarmups} upd={upd} toggle={toggle}
              setCurrentExerciseIdx={setCurrentExerciseIdx} setCurrentSetIdx={setCurrentSetIdx}
              setShowPlateCalc={setShowPlateCalc} setStartTimes={setSetStartTimes}
              setGhostPRs={setGhostPRs} hideWeight={demoFeatures.hideWeight} />
          )}

          <button onClick={() => setShowLibrary(true)}
            style={{ width: "100%", background: "none", border: `2px dashed ${C.border}`, borderRadius: 12, padding: 18, color: C.accent, fontFamily: "'Bebas Neue'", fontSize: 18, letterSpacing: 2, cursor: "pointer", marginTop: 10 }}>
            + ADICIONAR EXERCÍCIO
          </button>
        </div>

        <WorkoutControls finish={finish} doneSets={doneSets} totalSets={totalSets} />
      </div>
    </GlobalBackground>
  );
}