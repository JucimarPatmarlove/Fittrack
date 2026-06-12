import React, { useState, useEffect, useRef } from "react";
import { 
  Dumbbell, 
  Play, 
  Pause, 
  RotateCcw, 
  Trash2, 
  Plus, 
  Sparkles, 
  Send, 
  Award, 
  Clock, 
  Volume2, 
  Zap,
  Info
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { UserProfile, Exercise, AIChatMessage } from "../types";
import { playAlertBeep, getTodayDateString } from "../utils";

interface WorkoutMonitorProps {
  profile: UserProfile;
  exercises: Exercise[];
  onAddExercise: (ex: Omit<Exercise, "id">) => void;
  onRemoveExercise: (id: string) => void;
  currentDate: string;
}

const PRESET_WORKOUTS = [
  { name: "Musculação (Hipertrofia)", type: "strength" as const, calPerMin: 7 },
  { name: "Corrida (Ligeira / Esteira)", type: "cardio" as const, calPerMin: 10 },
  { name: "Pedalar (Ciclismo)", type: "cardio" as const, calPerMin: 8 },
  { name: "Treino Funcional / HIIT", type: "cardio" as const, calPerMin: 9 },
  { name: "Ioga ou Alongamento", type: "mobility" as const, calPerMin: 3.5 },
  { name: "Pilates Avançado", type: "mobility" as const, calPerMin: 4.5 },
];

export default function WorkoutMonitor({
  profile,
  exercises,
  onAddExercise,
  onRemoveExercise,
  currentDate,
}: WorkoutMonitorProps) {
  // Add Exercise Form States
  const [selectedPreset, setSelectedPreset] = useState("0");
  const [exerciseName, setExerciseName] = useState(PRESET_WORKOUTS[0].name);
  const [exerciseType, setExerciseType] = useState<"strength" | "cardio" | "mobility">("strength");
  const [duration, setDuration] = useState("45");
  const [caloriesBurned, setCaloriesBurned] = useState("315"); // 45 * 7

  // Strength-specific states
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("10");
  const [weightKg, setWeightKg] = useState("20");

  // Rest Timer States
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [initialTime, setInitialTime] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // AI Assistant States
  const [aiChat, setAiChat] = useState<AIChatMessage[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "Olá! Eu sou o **FitTrainer AI**, seu preparador físico e personal trainer inteligente. Escolha um objetivo de exercício ou me diga se quer que eu monte uma divisão de treino (Split) excelente baseada nos seus dados físicos!",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [userQuery, setUserQuery] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Sync scroll on chat update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiChat]);

  // Rest Timer Logic
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            if (timerRef.current) clearInterval(timerRef.current);
            // Time Out! Alert the user with a premium custom dual audio beep
            playAlertBeep(587.33, 0.18, 3); // D5 pitch alert
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  // Sync calorie estimation automatically when duration or preset changes
  const handlePresetChange = (indexStr: string) => {
    setSelectedPreset(indexStr);
    const index = parseInt(indexStr);
    if (!isNaN(index) && PRESET_WORKOUTS[index]) {
      const preset = PRESET_WORKOUTS[index];
      setExerciseName(preset.name);
      setExerciseType(preset.type);
      const min = parseFloat(duration) || 0;
      setCaloriesBurned(Math.round(min * preset.calPerMin).toString());
    }
  };

  const handleDurationChange = (valStr: string) => {
    setDuration(valStr);
    const min = parseFloat(valStr) || 0;
    const index = parseInt(selectedPreset);
    const factor = PRESET_WORKOUTS[index] ? PRESET_WORKOUTS[index].calPerMin : 5;
    setCaloriesBurned(Math.round(min * factor).toString());
  };

  // Submit Exercise
  const handleSubmitWorkout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exerciseName.trim()) return;

    onAddExercise({
      name: exerciseName,
      type: exerciseType,
      duration: parseInt(duration) || 0,
      caloriesBurned: parseInt(caloriesBurned) || 0,
      sets: exerciseType === "strength" ? (parseInt(sets) || undefined) : undefined,
      reps: exerciseType === "strength" ? (parseInt(reps) || undefined) : undefined,
      weightKg: exerciseType === "strength" ? (parseFloat(weightKg) || undefined) : undefined,
      date: currentDate,
    });

    // Toast beep
    playAlertBeep(783.99, 0.1, 1); // high brief beep 
  };

  // Set rest timer seconds
  const startCustomTimer = (sec: number) => {
    setIsTimerRunning(false);
    setInitialTime(sec);
    setTimerSeconds(sec);
    setTimeout(() => {
      setIsTimerRunning(true);
    }, 100);
  };

  // AI Query send
  const handleSendAiQuery = async (presetQuestion?: string) => {
    const question = (presetQuestion || userQuery).trim();
    if (!question) return;

    // Add user message
    const userMsg: AIChatMessage = {
      id: Math.random().toString(),
      sender: "user",
      text: question,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setAiChat((prev) => [...prev, userMsg]);
    if (!presetQuestion) {
      setUserQuery("");
    }
    setIsAiLoading(true);

    try {
      // Build request with user parameters
      const recentWorkoutsTxt = exercises
        .filter((ex) => ex.date === currentDate)
        .map((ex) => `- ${ex.name}: ${ex.duration} min, ${ex.caloriesBurned} kcal ${ex.sets ? `(${ex.sets}x${ex.reps}, ${ex.weightKg}kg)` : ""}`)
        .join("\n") || "Nenhum treino registrado hoje.";

      const response = await fetch("/api/ai/workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: profile.goal,
          fitnessLevel: profile.activityLevel,
          preferences: `Peso: ${profile.weight}kg, Altura: ${profile.height}cm`,
          currentPlan: recentWorkoutsTxt,
          userMessage: question,
        }),
      });

      const data = await response.json();
      
      const aiResponseText = data.text || "Ops, ocorreu um erro na análise do preparador físico. Verifique sua chave API.";

      setAiChat((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: "ai",
          text: aiResponseText,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (err) {
      console.error(err);
      setAiChat((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: "ai",
          text: "Falha na conexão com o FitTrainer AI. Por favor, tente novamente mais tarde.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Filter exercises logged for current day
  const loggedExercisesToday = exercises.filter((ex) => ex.date === currentDate);
  const totalBurnedToday = loggedExercisesToday.reduce((sum, ex) => sum + ex.caloriesBurned, 0);

  return (
    <div id="workout-monitor-view" className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      
      {/* Exercise logging and rest timer panels (7/12 cols) */}
      <div className="xl:col-span-7 space-y-6">
        
        {/* Interval rest timer card */}
        <div className="bg-slate-900 text-white rounded-2xl shadow-lg border border-slate-800 p-6 flex flex-col md:flex-row items-center justify-between gap-6" id="rest-timer">
          <div className="text-center md:text-left space-y-1">
            <div className="text-amber-500 font-extrabold text-xs uppercase tracking-widest flex items-center gap-1">
              <Clock className="w-4 h-4 animate-spin-slow" />
              Cronômetro de Descanso
            </div>
            <h4 className="text-xl font-bold tracking-tight">Intervalo entre Séries</h4>
            <p className="text-slate-400 text-2xs">Firmeza! Descanse o tempo exato para o máximo rendimento.</p>
          </div>

          <div className="flex flex-col items-center gap-2">
            {/* Live countdown rendering */}
            <div className="flex items-center gap-4">
              <div className="text-4xl font-mono font-black tabular-nums tracking-wider text-slate-100 py-1 px-4 bg-slate-950 rounded-xl border border-slate-800">
                {String(Math.floor(timerSeconds / 60)).padStart(2, "0")}:{String(timerSeconds % 60).padStart(2, "0")}
              </div>
              
              <div className="flex gap-1.5 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                <button 
                  id="timer-play-pause"
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className={`p-1.5 rounded-md hover:bg-slate-800 font-bold transition-colors cursor-pointer ${isTimerRunning ? "text-amber-400" : "text-emerald-500"}`}
                  title={isTimerRunning ? "Pausar" : "Iniciar"}
                >
                  {isTimerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                <button 
                  id="timer-reset"
                  onClick={() => {
                    setIsTimerRunning(false);
                    setTimerSeconds(initialTime);
                  }}
                  className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Reiniciar"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick configuration selectors */}
            <div className="flex flex-wrap gap-1 mt-1 justify-center">
              <button 
                id="preset-timer-30"
                onClick={() => startCustomTimer(30)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white font-bold text-3xs uppercase tracking-wider rounded-md transition-colors cursor-pointer"
              >
                30s (Cardio)
              </button>
              <button 
                id="preset-timer-60"
                onClick={() => startCustomTimer(60)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white font-bold text-3xs uppercase tracking-wider rounded-md transition-colors cursor-pointer"
              >
                60s (Padrão)
              </button>
              <button 
                id="preset-timer-90"
                onClick={() => startCustomTimer(90)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white font-bold text-3xs uppercase tracking-wider rounded-md transition-colors cursor-pointer"
              >
                90s (Força)
              </button>
              <button 
                id="preset-timer-120"
                onClick={() => startCustomTimer(120)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white font-bold text-3xs uppercase tracking-wider rounded-md transition-colors cursor-pointer"
              >
                120s (Carga)
              </button>
            </div>
          </div>
        </div>

        {/* Add Exercise manual logger form */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-6" id="add-exercise-form-card">
          <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2 mb-4">
            <Dumbbell className="w-5 h-5 text-emerald-500" />
            Registrar Exercício Hoje
          </h3>

          <form onSubmit={handleSubmitWorkout} className="space-y-4">
            
            {/* Quick Presets Selection */}
            <div className="space-y-1">
              <label className="text-2xs font-bold text-gray-400 uppercase tracking-wider block">Atividade Preset</label>
              <select 
                id="preset-workout-select"
                value={selectedPreset}
                onChange={(e) => handlePresetChange(e.target.value)}
                className="w-full bg-slate-50 border border-gray-200 rounded-lg text-sm px-3 py-2 text-gray-700 font-semibold focus:outline-hidden focus:border-emerald-500 cursor-pointer"
              >
                {PRESET_WORKOUTS.map((p, idx) => (
                  <option key={idx} value={idx}>{p.name} (~{p.calPerMin} kcal/min)</option>
                ))}
                <option value="custom">✍️ Nome Personalizado / Outro</option>
              </select>
            </div>

            {/* If custom, allow name typing & exercise type setting */}
            {selectedPreset === "custom" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-2xs font-bold text-gray-400 uppercase tracking-wider block">Nome do Exercício</label>
                  <input 
                    type="text" 
                    id="custom-exercise-name"
                    required
                    value={exerciseName}
                    onChange={(e) => setExerciseName(e.target.value)}
                    placeholder="Ex: Agachamento búlgaro"
                    className="w-full border border-gray-200 rounded-lg text-sm px-3 py-1.5 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-2xs font-bold text-gray-400 uppercase tracking-wider block">Tipo</label>
                  <select 
                    id="custom-exercise-type"
                    value={exerciseType}
                    onChange={(e) => setExerciseType(e.target.value as any)}
                    className="w-full bg-white border border-gray-200 rounded-lg text-sm px-3 py-1.5 focus:outline-hidden focus:border-emerald-500"
                  >
                    <option value="strength">Força / Musculação</option>
                    <option value="cardio">Cardiorespiratório / Aeróbico</option>
                    <option value="mobility">Mobilidade / Alongamento</option>
                  </select>
                </div>
              </div>
            )}

            {/* Core workout specs (duration, weight, sets, reps) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl">
              
              <div className="space-y-1">
                <div className="text-3xs font-extrabold text-gray-400 uppercase tracking-wide">Duração</div>
                <div className="relative">
                  <input 
                    type="number" 
                    id="workout-duration-minutes"
                    required
                    min="1"
                    value={duration}
                    onChange={(e) => handleDurationChange(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg text-sm px-3 py-1 text-gray-800 font-bold focus:outline-hidden focus:border-emerald-500"
                  />
                  <span className="absolute right-2 top-1.5 text-3xs text-gray-400 font-semibold uppercase">Min</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-3xs font-extrabold text-gray-400 uppercase tracking-wide">Calorias Estimadas</div>
                <div className="relative">
                  <input 
                    type="number" 
                    id="workout-calories-burned"
                    required
                    min="0"
                    value={caloriesBurned}
                    onChange={(e) => setCaloriesBurned(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg text-sm px-3 py-1 text-gray-800 font-bold focus:outline-hidden focus:border-emerald-500"
                  />
                  <span className="absolute right-2 top-1.5 text-3xs text-gray-400 font-semibold uppercase">kcal</span>
                </div>
              </div>

              {/* Show reps/sets/weight only for strength */}
              {exerciseType === "strength" ? (
                <>
                  <div className="space-y-1">
                    <div className="text-3xs font-extrabold text-gray-400 uppercase tracking-wide">Séries x Repet.</div>
                    <div className="flex gap-1.5">
                      <input 
                        type="number" 
                        id="workout-sets"
                        min="1"
                        placeholder="Sér."
                        value={sets}
                        onChange={(e) => setSets(e.target.value)}
                        className="w-1/2 bg-white border border-gray-200 rounded-lg text-xs px-2 py-1 text-center text-gray-800 font-bold focus:outline-hidden focus:border-emerald-500"
                      />
                      <input 
                        type="number" 
                        id="workout-reps"
                        min="1"
                        placeholder="Rep."
                        value={reps}
                        onChange={(e) => setReps(e.target.value)}
                        className="w-1/2 bg-white border border-gray-200 rounded-lg text-xs px-2 py-1 text-center text-gray-800 font-bold focus:outline-hidden focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-3xs font-extrabold text-gray-400 uppercase tracking-wide">Carga (Opcional)</div>
                    <div className="relative">
                      <input 
                        type="number" 
                        id="workout-weight"
                        min="0"
                        step="0.5"
                        value={weightKg}
                        onChange={(e) => setWeightKg(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg text-sm px-3 py-1 text-gray-800 font-bold focus:outline-hidden focus:border-emerald-500"
                      />
                      <span className="absolute right-2 top-1.5 text-3xs text-gray-400 font-semibold uppercase">kg</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="col-span-2 flex items-center p-2 bg-emerald-50 text-emerald-800 text-3xs font-semibold rounded-lg">
                  <Info className="w-5 h-5 text-emerald-600 shrink-0 mr-1.5" />
                  <span>Exercícios aeróbicos ou de mobilidade não necessitam de registros obrigatórios de cargas ou repetições.</span>
                </div>
              )}

            </div>

            {/* Submit button */}
            <button 
              type="submit"
              id="add-workout-button"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs uppercase tracking-wider py-3 px-4 rounded-xl transition-colors shrink-0 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Plus className="w-5 h-5" />
              Adicionar Exercício ao Diário
            </button>
          </form>
        </div>

        {/* Exercises Logged History Card */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-6" id="logged-workouts-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
              <Award className="w-5 h-5 text-orange-500" />
              Treinos Registrados Hoje
            </h3>
            <span className="text-xs font-bold text-orange-600 bg-orange-55/75 px-3 py-1 rounded-full">
              -{totalBurnedToday} kcal queimadas
            </span>
          </div>

          {loggedExercisesToday.length === 0 ? (
            <div className="text-center py-12 px-6 border border-dashed border-gray-200 rounded-xl">
              <span className="text-3xl text-gray-300 block mb-2">🏋️</span>
              <p className="text-gray-400 text-xs font-semibold">Nenhum exercício registrado ainda hoje.</p>
              <p className="text-gray-400 text-3xs mt-1">Utilize o formulário acima para registrar suas rotinas.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-2xs font-extrabold text-gray-400 uppercase tracking-wider">
                    <th className="py-2.5">Exercício</th>
                    <th className="py-2.5">Duração/Tipo</th>
                    <th className="py-2.5">Especificação</th>
                    <th className="py-2.5 text-right">Calorias</th>
                    <th className="py-2.5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-gray-50 font-medium">
                  {loggedExercisesToday.map((ex) => (
                    <tr key={ex.id} className="text-gray-700 hover:bg-slate-50">
                      <td className="py-3 font-bold text-gray-900">{ex.name}</td>
                      <td className="py-3">
                        <span className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${
                            ex.type === "strength" ? "bg-emerald-500" :
                            ex.type === "cardio" ? "bg-blue-500" : "bg-purple-500"
                          }`} />
                          {ex.duration} min
                        </span>
                      </td>
                      <td className="py-3 text-gray-500 italic">
                        {ex.sets ? `${ex.sets} séries x ${ex.reps} reps ${ex.weightKg ? `(${ex.weightKg}kg)` : ""}` : "Geral"}
                      </td>
                      <td className="py-3 text-right text-orange-600 font-extrabold">-{ex.caloriesBurned} kcal</td>
                      <td className="py-3 text-right">
                        <button 
                          onClick={() => onRemoveExercise(ex.id)}
                          className="p-1.5 text-gray-450 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* FitTrainer AI Chat Panel (5/12 cols) */}
      <div className="xl:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl flex flex-col h-[650px] overflow-hidden" id="ai-trainer-chat">
        
        {/* Chat header */}
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white tracking-widest flex items-center gap-1">
                FitTrainer AI
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              </h4>
              <span className="text-3xs text-emerald-400 font-bold block">Preparador Físico Inteligente e Técnico</span>
            </div>
          </div>
          
          <div className="text-right">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1" />
            <span className="text-3xs font-semibold text-slate-400">Ativo</span>
          </div>
        </div>

        {/* Action presets for quick inquiries */}
        <div className="bg-slate-950/50 p-2.5 border-b border-slate-850 flex gap-1.5 overflow-x-auto scrollbar-none shrink-0">
          <button 
            id="ai-preset-workout-routine"
            onClick={() => handleSendAiQuery("Crie uma divisão de treino semanal (Split) ABC para mim.")}
            disabled={isAiLoading}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-white font-bold text-3xs uppercase tracking-wider rounded-lg shrink-0 transition-colors cursor-pointer disabled:opacity-50"
          >
            📋 Split ABC
          </button>
          <button 
            id="ai-preset-technique-squats"
            onClick={() => handleSendAiQuery("Como posso melhorar minha técnica de Agachamento Livre para proteger a minha coluna?")}
            disabled={isAiLoading}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-white font-bold text-3xs uppercase tracking-wider rounded-lg shrink-0 transition-colors cursor-pointer disabled:opacity-50"
          >
            🏋️ Agachamento Seguro
          </button>
          <button 
            id="ai-preset-weightloss-cardio"
            onClick={() => handleSendAiQuery("Qual o tempo ideal e frequência semanal de cardio para perder peso preservando massa magra?")}
            disabled={isAiLoading}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-white font-bold text-3xs uppercase tracking-wider rounded-lg shrink-0 transition-colors cursor-pointer disabled:opacity-50"
          >
            🏃 Cardio & Emagrecimento
          </button>
        </div>

        {/* Message body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" id="chat-messages-container">
          {aiChat.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div 
                className={`max-w-[85%] rounded-2xl p-4 shadow-2xs ${
                  msg.sender === "user" 
                    ? "bg-emerald-600 text-white rounded-br-none" 
                    : "bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700/50"
                }`}
              >
                {/* Standard rich Markdown support via react-markdown */}
                <div className="text-xs leading-relaxed prose prose-invert max-w-none">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
                <span className="text-[9px] text-slate-400 font-bold block mt-1.5 text-right uppercase">
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}

          {isAiLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-800 border border-slate-705 p-4 rounded-2xl rounded-bl-none flex items-center gap-3">
                <div className="flex space-x-1.5">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
                <span className="text-slate-300 text-2xs italic font-semibold">Analisando dados do FitTrack...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Chat input box */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendAiQuery();
          }}
          className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2"
        >
          <input 
            type="text"
            id="ai-prompt-input"
            disabled={isAiLoading}
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder="Diga: 'Crie um treino rápido para pernas'..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 font-medium focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
          />
          <button 
            type="submit"
            id="send-ai-prompt"
            disabled={isAiLoading || !userQuery.trim()}
            className="p-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors cursor-pointer flex items-center justify-center shrink-0 disabled:opacity-50"
            title="Enviar"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
}
