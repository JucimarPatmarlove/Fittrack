import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { C } from '../../data/constants';
import { DemographicEngine } from '../../services/demographicEngine';
import { type InjuryAssessment, analyzeInjuryRisk } from '../../services/injuryPredictor';
import type { SyncData } from '../../services/p2pSync';
import { useExerciseStore } from '../../stores/useExerciseStore';
import { QRSyncModal } from '../social/QRSyncModal';
import { ExerciseLibrary } from './ExerciseLibrary';

interface FreeWorkoutBuilderProps {
  profile?: any;
  onClose: () => void;
  onStart: (plan: any) => void;
}

const MUSCLES = [
  { id: 'Peito', label: 'Peito', emoji: '🫁' },
  { id: 'Costas', label: 'Costas', emoji: '🔙' },
  { id: 'Pernas', label: 'Pernas', emoji: '🦵' },
  { id: 'Ombros', label: 'Ombros', emoji: '🤷' },
  { id: 'Braços', label: 'Braços', emoji: '💪' },
  { id: 'Core', label: 'Core', emoji: '⭕' },
  { id: 'Full Body', label: 'Full Body', emoji: '⚡' },
];

const EQUIPMENT = [
  { id: 'Barra', label: 'Barra', emoji: '🏋️' },
  { id: 'Halteres', label: 'Halteres', emoji: '💪' },
  { id: 'Máquinas', label: 'Máquinas', emoji: '🔧' },
  { id: 'Cabos', label: 'Cabos', emoji: '〰️' },
  { id: 'Peso Corporal', label: 'Peso Corporal', emoji: '🤸' },
  { id: 'Outros', label: 'Outros', emoji: '📦' },
];

const MUSCLE_EMOJIS: Record<string, string> = {
  Peito: '🫁',
  Costas: '🔙',
  Pernas: '🦵',
  Ombros: '🤷',
  Braços: '💪',
  Tríceps: '🦾',
  Core: '⭕',
  'Full Body': '⚡',
};

const EQUIPMENT_EMOJIS: Record<string, string> = {
  Barra: '🏋️',
  Halteres: '💪',
  Máquinas: '🔧',
  'Máquina de Cabos': '〰️',
  PesoCorporal: '🤸',
  Kettlebell: '📦',
  'Bola medicinal': '🏀',
  Outros: '📦',
};

export function FreeWorkoutBuilder({ profile, onClose, onStart }: FreeWorkoutBuilderProps) {
  const { exercises: EXERCISE_DB, isLoading: isDbLoading, fetchExercises } = useExerciseStore();

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  const [step, setStep] = useState(1);
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);

  // Customization step states
  const [workoutDuration, setWorkoutDuration] = useState<number>(5);
  const [workoutFormat, setWorkoutFormat] = useState<'standard' | 'circuit'>('standard');
  const [circuitRounds, setCircuitRounds] = useState<number>(3);
  const [circuitRest, setCircuitRest] = useState<number>(120);

  // Selected exercises list state
  const [exercisesList, setExercisesList] = useState<string[]>([]);
  const [showLibraryModal, setShowLibraryModal] = useState(false);

  // Exercise Selector states
  const [selectingExerciseIndex, setSelectingExerciseIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllPool, setShowAllPool] = useState(false);
  const [injuryData, setInjuryData] = useState<InjuryAssessment | null>(null);

  // P2P states
  const [showP2P, setShowP2P] = useState(false);
  const [p2pData, setP2pData] = useState<SyncData | null>(null);

  useEffect(() => {
    const loadRisk = async () => {
      const demographicProfile = DemographicEngine.getProfileType(
        profile?.age || 30,
        profile?.gender || 'other',
        profile?.wantsCycleSyncing || false,
      );
      const userId = profile?.id || 'default';
      const risk = await analyzeInjuryRisk(userId, demographicProfile);
      setInjuryData(risk);
    };
    if (profile) loadRisk();
  }, [profile]);

  // Filter pool based on choices
  const fullPool = useMemo(() => {
    let pool = Object.keys(EXERCISE_DB).map((key) => ({
      name: key,
      ...EXERCISE_DB[key],
    }));

    if (injuryData?.restrictedExercises) {
      pool = pool.filter((ex) => !injuryData.restrictedExercises!.includes(ex.name.toLowerCase()));
    }

    // Filter by Muscle
    if (selectedMuscles.length > 0) {
      pool = pool.filter((ex) => {
        return selectedMuscles.some((m) => {
          if (m === 'Braços') {
            return ex.muscle === 'Braços' || ex.muscle === 'Tríceps';
          }
          return ex.muscle === m;
        });
      });
    }

    // Filter by Equipment
    if (selectedEquipment.length > 0) {
      pool = pool.filter((ex) => {
        return selectedEquipment.some((eq) => {
          if (eq === 'Barra' && ex.equipment === 'Barra') return true;
          if (eq === 'Halteres' && ex.equipment === 'Halteres') return true;
          if (eq === 'Máquinas' && ex.equipment === 'Máquinas') return true;
          if (eq === 'Cabos' && ex.equipment === 'Máquina de Cabos') return true;
          if (eq === 'Peso Corporal' && ex.equipment === 'PesoCorporal') return true;
          if (eq === 'Outros' && (['Kettlebell', 'Bola medicinal', 'Outros'] as string[]).includes(ex.equipment || ''))
            return true;
          return false;
        });
      });
    }

    return pool;
  }, [selectedMuscles, selectedEquipment]);

  // Handle generating initial list when entering step 3 if empty
  useEffect(() => {
    if (step === 3 && exercisesList.length === 0 && fullPool.length > 0) {
      const shuffled = [...fullPool].sort(() => 0.5 - Math.random());
      setExercisesList(
        shuffled.slice(0, Math.min(workoutDuration, shuffled.length)).map((ex) => ex.name),
      );
    }
  }, [step, fullPool, workoutDuration, exercisesList.length]);

  // Reset list if filters change
  useEffect(() => {
    setExercisesList([]);
  }, [selectedMuscles, selectedEquipment]);

  const toggleSelection = (item: string, list: string[], setList: any) => {
    if (isDbLoading || Object.keys(EXERCISE_DB).length === 0) {
      alert('A carregar base de dados biomecânica...');
      return;
    }
    if (injuryData?.restrictedExercises?.includes(item.toLowerCase()) && !list.includes(item)) {
      alert(
        `⚠️ Exercício de alto risco (${item}) não recomendado. Escolha uma alternativa de baixo impacto.`,
      );
      return;
    }
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  // Swap a single exercise from the remaining pool
  const swapExercise = (index: number) => {
    const currentNames = new Set(exercisesList);
    const available = fullPool.filter((ex) => !currentNames.has(ex.name));
    if (available.length > 0) {
      const randomEx = available[Math.floor(Math.random() * available.length)];
      if (!randomEx) return;
      const newList = [...exercisesList];
      newList[index] = randomEx.name;
      setExercisesList(newList);
      if (navigator.vibrate) navigator.vibrate(15);
    }
  };

  // Resize the workoutDuration and adjust exercise list preserving customized slots
  const changeWorkoutDuration = (newSize: number) => {
    setWorkoutDuration(newSize);

    if (newSize > exercisesList.length) {
      const currentNames = new Set(exercisesList);
      const available = fullPool.filter((ex) => !currentNames.has(ex.name));
      const neededCount = newSize - exercisesList.length;

      const newItems: string[] = [];
      const shuffledAvailable = [...available].sort(() => 0.5 - Math.random());

      for (let i = 0; i < neededCount; i++) {
        const item = shuffledAvailable[i];
        if (item) {
          newItems.push(item.name);
        } else {
          // Fallback to random non-duplicate exercise from full DB
          const allDb = Object.keys(EXERCISE_DB).filter(
            (name) => !currentNames.has(name) && !newItems.includes(name),
          );
          if (allDb.length > 0) {
            const randomDb = allDb[Math.floor(Math.random() * allDb.length)];
            if (randomDb) newItems.push(randomDb);
          }
        }
      }
      setExercisesList([...exercisesList, ...newItems]);
    } else if (newSize < exercisesList.length) {
      setExercisesList(exercisesList.slice(0, newSize));
    }
  };

  const regenerateAll = () => {
    if (fullPool.length > 0) {
      const shuffled = [...fullPool].sort(() => 0.5 - Math.random());
      setExercisesList(
        shuffled.slice(0, Math.min(workoutDuration, shuffled.length)).map((ex) => ex.name),
      );
      if (navigator.vibrate) navigator.vibrate(30);
    }
  };

  // Calculate exercises matching selector criteria
  const selectorExercises = useMemo(() => {
    let pool = showAllPool
      ? Object.keys(EXERCISE_DB).map((key) => ({ name: key, ...EXERCISE_DB[key] }))
      : fullPool;

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      pool = pool.filter(
        (ex) =>
          ex.name.toLowerCase().includes(term) ||
          (ex.muscle && ex.muscle.toLowerCase().includes(term)) ||
          (ex.equipment && ex.equipment.toLowerCase().includes(term)),
      );
    }

    return [...pool].sort((a, b) => a.name.localeCompare(b.name));
  }, [showAllPool, fullPool, searchTerm]);

  const CardBtn = ({ item, isSelected, onClick }: any) => (
    <motion.button
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      style={{
        background: isSelected
          ? 'linear-gradient(135deg, #e8c84a, #d4b83a)'
          : 'rgba(18, 25, 35, 0.65)',
        color: isSelected ? '#000' : C.text,
        border: `1px solid ${isSelected ? C.accent : C.border}`,
        borderRadius: '12px',
        padding: '16px 12px',
        fontSize: '14px',
        fontWeight: isSelected ? 'bold' : 'normal',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        minHeight: '85px',
        boxShadow: isSelected ? '0 0 15px rgba(232, 200, 74, 0.4)' : 'none',
        transition: 'border-color 0.2s, background-color 0.2s, box-shadow 0.2s',
        backdropFilter: 'blur(8px)',
      }}
    >
      <span style={{ fontSize: '24px' }}>{item.emoji}</span>
      <span
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: '13px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        {item.label}
      </span>
    </motion.button>
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(8,11,15,0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 300,
        padding: 16,
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.accent}`,
          borderRadius: 16,
          padding: 20,
          maxWidth: 440,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          boxShadow: '0 10px 40px rgba(0,0,0,0.6), 0 0 20px rgba(232, 200, 74, 0.15)',
        }}
      >
        {selectingExerciseIndex !== null ? (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '350px' }}>
            {/* HEADER */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <button
                onClick={() => setSelectingExerciseIndex(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: C.muted,
                  fontSize: '24px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                }}
              >
                ←
              </button>
              <h2
                style={{
                  fontFamily: "'Bebas Neue'",
                  fontSize: '24px',
                  color: C.accent,
                  letterSpacing: '1px',
                  margin: 0,
                }}
              >
                ESCOLHER EXERCÍCIO {selectingExerciseIndex + 1}
              </h2>
              <button
                onClick={() => setSelectingExerciseIndex(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: C.muted,
                  fontSize: '24px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                }}
              >
                ×
              </button>
            </div>

            {/* SEARCH & FILTERS */}
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: 16 }}
            >
              <input
                type="text"
                placeholder="Pesquisar exercício..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  border: `1px solid ${C.border}`,
                  borderRadius: '8px',
                  padding: '12px 14px',
                  color: C.text,
                  fontSize: '14px',
                  outline: 'none',
                  width: '100%',
                }}
                autoFocus
              />

              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span style={{ fontSize: '11px', color: C.muted }}>
                  {showAllPool
                    ? 'A mostrar todos os exercícios'
                    : `A mostrar filtros (${selectedMuscles.join(', ') || 'Todos'} / ${selectedEquipment.join(', ') || 'Todos'})`}
                </span>
                <button
                  onClick={() => setShowAllPool(!showAllPool)}
                  style={{
                    background: showAllPool
                      ? 'rgba(232, 200, 74, 0.15)'
                      : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${showAllPool ? C.accent : C.border}`,
                    color: showAllPool ? C.accent : C.muted,
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: "'Outfit', sans-serif",
                  }}
                >
                  {showAllPool ? 'Filtrar por Grupo/Equip' : 'Ver Todos'}
                </button>
              </div>
            </div>

            {/* EXERCISE LIST */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                maxHeight: '45vh',
                overflowY: 'auto',
                paddingRight: '4px',
              }}
            >
              {selectorExercises.length > 0 ? (
                selectorExercises.map((ex) => {
                  const isAlreadySelected = exercisesList.includes(ex.name);
                  const isCurrent = exercisesList[selectingExerciseIndex] === ex.name;
                  const muscleEmoji = (ex.muscle ? MUSCLE_EMOJIS[ex.muscle] : null) || '🏋️';
                  const equipEmoji = (ex.equipment ? EQUIPMENT_EMOJIS[ex.equipment] : null) || '📦';

                  return (
                    <button
                      key={ex.name}
                      onClick={() => {
                        const newList = [...exercisesList];
                        newList[selectingExerciseIndex] = ex.name;
                        setExercisesList(newList);
                        setSelectingExerciseIndex(null);
                        if (navigator.vibrate) navigator.vibrate(15);
                      }}
                      style={{
                        background: isCurrent
                          ? 'linear-gradient(135deg, rgba(232, 200, 74, 0.15), rgba(232, 200, 74, 0.05))'
                          : isAlreadySelected
                            ? 'rgba(255, 255, 255, 0.01)'
                            : 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${isCurrent ? C.accent : isAlreadySelected ? 'rgba(255,255,255,0.05)' : C.border}`,
                        borderRadius: '10px',
                        padding: '12px 14px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s',
                        width: '100%',
                        opacity: isAlreadySelected && !isCurrent ? 0.5 : 1,
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <p
                          style={{
                            color: isCurrent ? C.accent : C.text,
                            fontSize: '13px',
                            fontWeight: 600,
                            margin: 0,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {ex.name}
                        </p>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                          <span
                            style={{
                              fontSize: '9px',
                              color: C.muted,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px',
                            }}
                          >
                            <span>{muscleEmoji}</span> {ex.muscle}
                          </span>
                          <span
                            style={{
                              fontSize: '9px',
                              color: C.muted,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px',
                            }}
                          >
                            <span>{equipEmoji}</span> {ex.equipment}
                          </span>
                        </div>
                      </div>
                      {isCurrent ? (
                        <span
                          style={{
                            fontSize: '10px',
                            color: C.accent,
                            fontWeight: 'bold',
                            fontFamily: "'DM Mono'",
                          }}
                        >
                          ATUAL
                        </span>
                      ) : isAlreadySelected ? (
                        <span style={{ fontSize: '10px', color: C.muted, fontFamily: "'DM Mono'" }}>
                          EM USO
                        </span>
                      ) : null}
                    </button>
                  );
                })
              ) : (
                <div
                  style={{
                    textAlign: 'center',
                    color: C.muted,
                    padding: '30px 0',
                    fontSize: '13px',
                  }}
                >
                  Nenhum exercício encontrado para "{searchTerm}".
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* HEADER */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <button
                onClick={step === 1 ? onClose : () => setStep(step - 1)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: C.muted,
                  fontSize: '24px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                }}
              >
                ←
              </button>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: '32px',
                      height: '4px',
                      background: step >= i ? C.accent : C.border,
                      borderRadius: '2px',
                      transition: 'background 0.3s',
                      boxShadow: step >= i ? '0 0 8px rgba(232,200,74,0.5)' : 'none',
                    }}
                  />
                ))}
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  color: C.muted,
                  fontSize: '24px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                }}
              >
                ×
              </button>
            </div>

            <AnimatePresence mode="wait">
              {/* PASSO 1: MÚSCULOS */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  style={{ flex: 1 }}
                >
                  <h2
                    style={{
                      fontFamily: "'Bebas Neue'",
                      fontSize: '28px',
                      color: C.accent,
                      letterSpacing: '1px',
                      marginBottom: '4px',
                    }}
                  >
                    O QUE VAMOS TREINAR?
                  </h2>
                  <p style={{ color: C.muted, fontSize: '13px', marginBottom: '20px' }}>
                    Seleciona os grupos musculares que queres trabalhar hoje.
                  </p>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '12px',
                      maxHeight: '45vh',
                      overflowY: 'auto',
                      paddingRight: '4px',
                    }}
                  >
                    {MUSCLES.map((m) => (
                      <CardBtn
                        key={m.id}
                        item={m}
                        isSelected={selectedMuscles.includes(m.id)}
                        onClick={() => toggleSelection(m.id, selectedMuscles, setSelectedMuscles)}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* PASSO 2: EQUIPAMENTO */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  style={{ flex: 1 }}
                >
                  <h2
                    style={{
                      fontFamily: "'Bebas Neue'",
                      fontSize: '28px',
                      color: C.accent,
                      letterSpacing: '1px',
                      marginBottom: '4px',
                    }}
                  >
                    O QUE TENS DISPONÍVEL?
                  </h2>
                  <p style={{ color: C.muted, fontSize: '13px', marginBottom: '20px' }}>
                    Filtra pelo equipamento que tens à disposição hoje.
                  </p>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '12px',
                      maxHeight: '45vh',
                      overflowY: 'auto',
                      paddingRight: '4px',
                    }}
                  >
                    {EQUIPMENT.map((eq) => (
                      <CardBtn
                        key={eq.id}
                        item={eq}
                        isSelected={selectedEquipment.includes(eq.id)}
                        onClick={() =>
                          toggleSelection(eq.id, selectedEquipment, setSelectedEquipment)
                        }
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* PASSO 3: RESULTADO E PERSONALIZAÇÃO */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{ flex: 1 }}
                >
                  <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <span
                      style={{
                        fontSize: '36px',
                        display: 'block',
                        marginBottom: '4px',
                        filter: 'drop-shadow(0 0 10px rgba(232,200,74,0.4))',
                      }}
                    >
                      ⚡
                    </span>
                    <h2
                      style={{
                        fontFamily: "'Bebas Neue'",
                        fontSize: '28px',
                        color: C.text,
                        letterSpacing: '1px',
                        marginBottom: '2px',
                      }}
                    >
                      CONFIGURAÇÃO DO TREINO
                    </h2>
                    <p
                      style={{
                        color: exercisesList.length > 0 ? C.green : C.red,
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                    >
                      {exercisesList.length > 0
                        ? `Encontrámos ${fullPool.length} exercícios compatíveis!`
                        : 'Nenhum exercício encontrado com estes filtros.'}
                    </p>
                  </div>

                  {exercisesList.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {/* CONFIGURAÇÃO DE SESSÃO */}
                      <div
                        style={{
                          background: 'rgba(255,255,255,0.02)',
                          border: `1px solid ${C.border}`,
                          borderRadius: '12px',
                          padding: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '11px',
                              color: C.muted,
                              fontWeight: 'bold',
                              fontFamily: "'DM Mono'",
                            }}
                          >
                            QUANTIDADE:
                          </span>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {[3, 4, 5, 6, 7].map((num) => (
                              <button
                                key={num}
                                onClick={() => changeWorkoutDuration(num)}
                                style={{
                                  background:
                                    workoutDuration === num ? C.accent : 'rgba(0,0,0,0.3)',
                                  color: workoutDuration === num ? '#000' : C.text,
                                  border: `1px solid ${workoutDuration === num ? C.accent : C.border}`,
                                  borderRadius: '6px',
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  cursor: 'pointer',
                                }}
                              >
                                {num}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '11px',
                              color: C.muted,
                              fontWeight: 'bold',
                              fontFamily: "'DM Mono'",
                            }}
                          >
                            FORMATO:
                          </span>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => setWorkoutFormat('standard')}
                              style={{
                                background:
                                  workoutFormat === 'standard' ? C.accent : 'rgba(0,0,0,0.3)',
                                color: workoutFormat === 'standard' ? '#000' : C.text,
                                border: `1px solid ${workoutFormat === 'standard' ? C.accent : C.border}`,
                                borderRadius: '6px',
                                padding: '4px 8px',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                              }}
                            >
                              Séries Tradicionais
                            </button>
                            <button
                              onClick={() => setWorkoutFormat('circuit')}
                              style={{
                                background:
                                  workoutFormat === 'circuit' ? C.accent : 'rgba(0,0,0,0.3)',
                                color: workoutFormat === 'circuit' ? '#000' : C.text,
                                border: `1px solid ${workoutFormat === 'circuit' ? C.accent : C.border}`,
                                borderRadius: '6px',
                                padding: '4px 8px',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                              }}
                            >
                              Circuito
                            </button>
                          </div>
                        </div>

                        {workoutFormat === 'circuit' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            style={{
                              borderTop: `1px solid ${C.border}`,
                              paddingTop: '10px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}
                            >
                              <span
                                style={{
                                  fontSize: '11px',
                                  color: C.muted,
                                  fontFamily: "'DM Mono'",
                                }}
                              >
                                Rondas:
                              </span>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                {[2, 3, 4, 5].map((r) => (
                                  <button
                                    key={r}
                                    onClick={() => setCircuitRounds(r)}
                                    style={{
                                      background:
                                        circuitRounds === r ? C.accent : 'rgba(0,0,0,0.3)',
                                      color: circuitRounds === r ? '#000' : C.text,
                                      border: `1px solid ${circuitRounds === r ? C.accent : C.border}`,
                                      borderRadius: '6px',
                                      padding: '2px 6px',
                                      fontSize: '10px',
                                      fontWeight: 'bold',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    {r}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}
                            >
                              <span
                                style={{
                                  fontSize: '11px',
                                  color: C.muted,
                                  fontFamily: "'DM Mono'",
                                }}
                              >
                                Descanso entre rondas:
                              </span>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                {[60, 90, 120, 180].map((sec) => (
                                  <button
                                    key={sec}
                                    onClick={() => setCircuitRest(sec)}
                                    style={{
                                      background:
                                        circuitRest === sec ? C.accent : 'rgba(0,0,0,0.3)',
                                      color: circuitRest === sec ? '#000' : C.text,
                                      border: `1px solid ${circuitRest === sec ? C.accent : C.border}`,
                                      borderRadius: '6px',
                                      padding: '2px 6px',
                                      fontSize: '10px',
                                      fontWeight: 'bold',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    {sec}s
                                  </button>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>

                      {/* LISTA DE EXERCÍCIOS GERADOS */}
                      <div
                        style={{
                          background: 'rgba(14, 19, 24, 0.8)',
                          borderRadius: '12px',
                          padding: '12px',
                          border: `1px solid ${C.border}`,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          maxHeight: '28vh',
                          overflowY: 'auto',
                        }}
                      >
                        {exercisesList.map((name, idx) => {
                          const detail = EXERCISE_DB[name];
                          const muscleEmoji = (detail?.muscle ? MUSCLE_EMOJIS[detail.muscle] : null) || '🏋️';
                          const equipEmoji = (detail?.equipment ? EQUIPMENT_EMOJIS[detail.equipment] : null) || '📦';

                          return (
                            <div
                              key={idx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                borderBottom:
                                  idx < exercisesList.length - 1
                                    ? `1px solid ${C.border}44`
                                    : 'none',
                                paddingBottom: idx < exercisesList.length - 1 ? '8px' : '0',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  minWidth: 0,
                                }}
                              >
                                <div
                                  style={{
                                    width: '22px',
                                    height: '22px',
                                    borderRadius: '50%',
                                    background: C.border,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '11px',
                                    fontFamily: "'DM Mono'",
                                    color: C.accent,
                                  }}
                                >
                                  {idx + 1}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <p
                                    style={{
                                      color: C.text,
                                      fontSize: '13px',
                                      fontWeight: 600,
                                      margin: 0,
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    }}
                                  >
                                    {name}
                                  </p>
                                  <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                                    <span
                                      style={{
                                        fontSize: '9px',
                                        background: 'rgba(255,255,255,0.05)',
                                        color: C.muted,
                                        padding: '1px 4px',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '3px',
                                      }}
                                    >
                                      <span>{muscleEmoji}</span> {detail?.muscle}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: '9px',
                                        background: 'rgba(255,255,255,0.05)',
                                        color: C.muted,
                                        padding: '1px 4px',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '3px',
                                      }}
                                    >
                                      <span>{equipEmoji}</span> {detail?.equipment}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  onClick={() => {
                                    setSelectingExerciseIndex(idx);
                                    setSearchTerm('');
                                    setShowAllPool(false);
                                  }}
                                  title="Escolher exercício"
                                  style={{
                                    background: 'rgba(232, 200, 74, 0.1)',
                                    border: `1px solid rgba(232, 200, 74, 0.25)`,
                                    borderRadius: '6px',
                                    width: '28px',
                                    height: '28px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: C.accent,
                                    fontSize: '14px',
                                    transition: 'all 0.2s',
                                  }}
                                >
                                  🔍
                                </button>
                                <button
                                  onClick={() => swapExercise(idx)}
                                  title="Trocar este exercício"
                                  style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: `1px solid ${C.border}`,
                                    borderRadius: '6px',
                                    width: '28px',
                                    height: '28px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: C.text,
                                    fontSize: '14px',
                                    transition: 'all 0.2s',
                                  }}
                                >
                                  🔄
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* SHUFFLE / REGENERATE ALL BUTTON */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => setShowLibraryModal(true)}
                          style={{
                            flex: 1,
                            background: `linear-gradient(135deg, ${C.accent}, #a8e000)`,
                            color: '#080b0f',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '10px',
                            fontSize: '13px',
                            fontFamily: "'Bebas Neue'",
                            letterSpacing: '1px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                          }}
                        >
                          + ADICIONAR DA BIBLIOTECA
                        </button>
                        <button
                          onClick={regenerateAll}
                          style={{
                            flex: 1,
                            background: 'rgba(255,255,255,0.03)',
                            color: C.accent,
                            border: `1px dashed rgba(232, 200, 74, 0.4)`,
                            borderRadius: '10px',
                            padding: '10px',
                            fontSize: '13px',
                            fontFamily: "'Bebas Neue'",
                            letterSpacing: '1px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                          }}
                        >
                          🎲 REGENERAR TUDO
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        background: 'rgba(232, 74, 74, 0.05)',
                        borderRadius: '12px',
                        padding: '20px',
                        border: `1px dashed ${C.red}`,
                        textAlign: 'center',
                        color: C.muted,
                        fontSize: '13px',
                      }}
                    >
                      A combinação selecionada é muito restrita. Volta atrás e seleciona mais grupos
                      musculares ou tipos de equipamento.
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* BOTÃO DE AVANÇAR */}
            <button
              onClick={() => {
                if (step < 3) {
                  setStep(step + 1);
                } else {
                  onStart({
                    id: `free_${Date.now()}`,
                    label:
                      workoutFormat === 'circuit'
                        ? 'Treino Livre (Circuito)'
                        : 'Treino Livre (Auto-Regulado)',
                    exercises: exercisesList,
                    type: workoutFormat,
                    rounds: workoutFormat === 'circuit' ? circuitRounds : undefined,
                    restBetweenRounds: workoutFormat === 'circuit' ? circuitRest : undefined,
                  });
                }
              }}
              disabled={
                (step === 1 && selectedMuscles.length === 0) ||
                (step === 2 && selectedEquipment.length === 0) ||
                (step === 3 && exercisesList.length === 0)
              }
              style={{
                marginTop: '20px',
                width: '100%',
                background:
                  (step === 1 && selectedMuscles.length === 0) ||
                  (step === 2 && selectedEquipment.length === 0) ||
                  (step === 3 && exercisesList.length === 0)
                    ? C.border
                    : 'linear-gradient(135deg, #e8c84a, #d4b83a)',
                color:
                  (step === 1 && selectedMuscles.length === 0) ||
                  (step === 2 && selectedEquipment.length === 0) ||
                  (step === 3 && exercisesList.length === 0)
                    ? C.muted
                    : '#000',
                border: 'none',
                borderRadius: '12px',
                padding: '16px',
                fontFamily: "'Bebas Neue'",
                fontSize: '18px',
                letterSpacing: '1px',
                cursor:
                  (step === 1 && selectedMuscles.length === 0) ||
                  (step === 2 && selectedEquipment.length === 0) ||
                  (step === 3 && exercisesList.length === 0)
                    ? 'not-allowed'
                    : 'pointer',
                transition: 'background 0.3s, color 0.3s, transform 0.1s',
                boxShadow:
                  (step === 1 && selectedMuscles.length === 0) ||
                  (step === 2 && selectedEquipment.length === 0) ||
                  (step === 3 && exercisesList.length === 0)
                    ? 'none'
                    : '0 4px 15px rgba(232, 200, 74, 0.3)',
              }}
            >
              {step === 3 ? 'INICIAR TREINO AGORA' : 'AVANÇAR'}
            </button>

            {step === 3 && exercisesList.length > 0 && (
              <button
                onClick={() => {
                  setP2pData({
                    type: 'plan',
                    version: '1.0',
                    content: {
                      id: `free_${Date.now()}`,
                      label:
                        workoutFormat === 'circuit'
                          ? 'Treino Livre (Circuito)'
                          : 'Treino Livre (Auto-Regulado)',
                      exercises: exercisesList,
                      type: workoutFormat,
                      rounds: workoutFormat === 'circuit' ? circuitRounds : undefined,
                      restBetweenRounds: workoutFormat === 'circuit' ? circuitRest : undefined,
                    },
                  });
                  setShowP2P(true);
                }}
                style={{
                  marginTop: '12px',
                  width: '100%',
                  background: 'transparent',
                  color: C.accent,
                  border: `1px solid ${C.accent}`,
                  borderRadius: '12px',
                  padding: '12px',
                  fontFamily: "'Bebas Neue'",
                  fontSize: '16px',
                  letterSpacing: '1px',
                  cursor: 'pointer',
                }}
              >
                📤 PARTILHAR TREINO VIA QR
              </button>
            )}
          </>
        )}
      </div>

      {/* MODAL DE BIBLIOTECA */}
      {showLibraryModal && (
        <ExerciseLibrary
          onCreateWorkout={(names) => {
            // Merge unique names
            const newNames = names.filter((n) => !exercisesList.includes(n));
            setExercisesList([...exercisesList, ...newNames]);
            setShowLibraryModal(false);
          }}
          onClose={() => setShowLibraryModal(false)}
        />
      )}

      {/* MODAL P2P SYNC */}
      {showP2P && (
        <QRSyncModal
          isOpen={showP2P}
          onClose={() => setShowP2P(false)}
          mode="send"
          dataToSend={p2pData!}
          onDataReceived={() => {}}
        />
      )}
    </div>
  );
}
