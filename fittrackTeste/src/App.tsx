import { useState, useEffect } from "react";
import { 
  Dumbbell, 
  Flame, 
  Apple, 
  User, 
  Calendar,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  RotateCcw,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { 
  FitnessGoal, 
  ActivityLevel, 
  UserProfile, 
  Exercise, 
  DailyMealLog, 
  HydrationLog, 
  WeightLog 
} from "./types";
import { 
  DEFAULT_USER_PROFILE, 
  getTodayDateString, 
  formatPortugueseDate,
  playAlertBeep 
} from "./utils";

import Dashboard from "./components/Dashboard";
import WorkoutMonitor from "./components/WorkoutMonitor";
import NutritionPlanner from "./components/NutritionPlanner";
import ProfileSettings from "./components/ProfileSettings";

// Seed helpers for beautiful graphical presentation relative to today's opening time
function getPastDateString(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysOffset);
  return d.toISOString().split("T")[0];
}

const SEED_WEIGHTS = [
  { daysOffset: 6, weight: 76.5 },
  { daysOffset: 5, weight: 76.2 },
  { daysOffset: 4, weight: 75.9 },
  { daysOffset: 3, weight: 75.7 },
  { daysOffset: 2, weight: 75.3 },
  { daysOffset: 1, weight: 75.1 },
  { daysOffset: 0, weight: 75.0 },
];

const SEED_EXERCISES = [
  { id: "e1", name: "Corrida (Ligeira / Esteira)", type: "cardio" as const, duration: 30, caloriesBurned: 300, date: getPastDateString(4) },
  { id: "e2", name: "Musculação (Hipertrofia)", type: "strength" as const, duration: 55, caloriesBurned: 385, sets: 4, reps: 10, weightKg: 20, date: getPastDateString(3) },
  { id: "e3", name: "Ioga ou Alongamento", type: "mobility" as const, duration: 25, caloriesBurned: 87, date: getPastDateString(2) },
  { id: "e4", name: "Pedalar (Ciclismo)", type: "cardio" as const, duration: 40, caloriesBurned: 320, date: getPastDateString(1) },
  { id: "e5", name: "Musculação (Hipertrofia)", type: "strength" as const, duration: 50, caloriesBurned: 350, sets: 3, reps: 12, weightKg: 25, date: getPastDateString(0) },
];

const SEED_MEALS = [
  {
    date: getPastDateString(3),
    breakfast: [
      { id: "b1", name: "Tapioca pronta (50g)", calories: 130, protein: 0.2, carb: 32, fat: 0.1 },
      { id: "b2", name: "Ovo de Galinha Inteiro Cozido (2 unid)", calories: 156, protein: 12.6, carb: 1.2, fat: 10.6 },
    ],
    lunch: [
      { id: "l1", name: "Peito de Frango Grelhado (150g)", calories: 247, protein: 46.5, carb: 0, fat: 5.4 },
      { id: "l2", name: "Arroz Integral Cozido (150g)", calories: 166, protein: 3.9, carb: 34.5, fat: 1.35 },
    ],
    snack: [
      { id: "s1", name: "Banana Prata Média (1 unid)", calories: 90, protein: 1.1, carb: 23, fat: 0.3 },
    ],
    dinner: [
      { id: "d1", name: "Ovo de Galinha Inteiro Cozido (2 unid)", calories: 156, protein: 12.6, carb: 1.2, fat: 10.6 },
    ],
  },
  {
    date: getPastDateString(2),
    breakfast: [
      { id: "b3", name: "Iogurte Desnatado Natural (170g)", calories: 70, protein: 6.8, carb: 9, fat: 0 },
      { id: "b4", name: "Castanha de Caju (20g)", calories: 114, protein: 3.6, carb: 6, fat: 9 },
    ],
    lunch: [
      { id: "l3", name: "Salmão Grelhado (100g)", calories: 206, protein: 22, carb: 0, fat: 12 },
      { id: "l4", name: "Batata Doce Cozida (150g)", calories: 129, protein: 2.4, carb: 30, fat: 0.15 },
    ],
    snack: [
      { id: "s2", name: "Whey Protein Isolado (1 scoop - 30g)", calories: 120, protein: 25, carb: 2, fat: 1 },
    ],
    dinner: [
      { id: "d2", name: "Peito de Frango Grelhado (100g)", calories: 165, protein: 31, carb: 0, fat: 3.6 },
      { id: "d3", name: "Arroz Integral Cozido (100g)", calories: 111, protein: 2.6, carb: 23, fat: 0.9 },
    ],
  },
  {
    date: getPastDateString(1),
    breakfast: [
      { id: "b5", name: "Tapioca pronta (50g)", calories: 130, protein: 0.2, carb: 32, fat: 0.1 },
      { id: "b6", name: "Ovo de Galinha Inteiro Cozido (3 unid)", calories: 234, protein: 18.9, carb: 1.8, fat: 15.9 },
    ],
    lunch: [
      { id: "l5", name: "Peito de Frango Grelhado (200g)", calories: 330, protein: 62, carb: 0, fat: 7.2 },
      { id: "l6", name: "Arroz Integral Cozido (200g)", calories: 222, protein: 5.2, carb: 46, fat: 1.8 },
    ],
    snack: [
      { id: "s3", name: "Banana Prata Média (1 unid)", calories: 90, protein: 1.1, carb: 23, fat: 0.3 },
    ],
    dinner: [
      { id: "d4", name: "Peito de Frango Grelhado (100g)", calories: 165, protein: 31, carb: 0, fat: 3.6 },
    ],
  },
  {
    date: getPastDateString(0),
    breakfast: [
      { id: "b7", name: "Ovo de Galinha Inteiro Cozido (2 unid)", calories: 156, protein: 12.6, carb: 1.2, fat: 10.6 },
      { id: "b8", name: "Banana Prata Média (1 unid)", calories: 90, protein: 1.1, carb: 23, fat: 0.3 },
    ],
    lunch: [
      { id: "l7", name: "Peito de Frango Grelhado (150g)", calories: 247, protein: 46.5, carb: 0, fat: 5.4 },
      { id: "l8", name: "Arroz Integral Cozido (150g)", calories: 166, protein: 3.9, carb: 34.5, fat: 1.35 },
    ],
    snack: [
      { id: "s4", name: "Whey Protein Isolado (1 scoop - 30g)", calories: 120, protein: 25, carb: 2, fat: 1 },
    ],
    dinner: [],
  },
];

const SEED_HYDRATIONS = [
  { date: getPastDateString(3), mlConsumed: 2250 },
  { date: getPastDateString(2), mlConsumed: 2000 },
  { date: getPastDateString(1), mlConsumed: 2750 },
  { date: getPastDateString(0), mlConsumed: 1250 },
];

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<"dashboard" | "workout" | "nutrition" | "settings">("dashboard");
  
  // Date selection state
  const [currentDate, setCurrentDate] = useState(getTodayDateString());

  // Master States
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [meals, setMeals] = useState<DailyMealLog[]>([]);
  const [hydration, setHydration] = useState<HydrationLog[]>([]);
  const [weightHistory, setWeightHistory] = useState<WeightLog[]>([]);

  // Load from LocalStorage
  useEffect(() => {
    try {
      const storedProfile = localStorage.getItem("fittrack_profile");
      const storedExercises = localStorage.getItem("fittrack_exercises");
      const storedMeals = localStorage.getItem("fittrack_meals");
      const storedHydration = localStorage.getItem("fittrack_hydration");
      const storedWeightHistory = localStorage.getItem("fittrack_weight_history");

      if (storedProfile) {
        setProfile(JSON.parse(storedProfile));
      } else {
        // First load: seed default parameters
        localStorage.setItem("fittrack_profile", JSON.stringify(DEFAULT_USER_PROFILE));
        setProfile(DEFAULT_USER_PROFILE);
      }

      if (storedExercises) {
        setExercises(JSON.parse(storedExercises));
      } else {
        localStorage.setItem("fittrack_exercises", JSON.stringify(SEED_EXERCISES));
        setExercises(SEED_EXERCISES);
      }

      if (storedMeals) {
        setMeals(JSON.parse(storedMeals));
      } else {
        localStorage.setItem("fittrack_meals", JSON.stringify(SEED_MEALS));
        setMeals(SEED_MEALS);
      }

      if (storedHydration) {
        setHydration(JSON.parse(storedHydration));
      } else {
        localStorage.setItem("fittrack_hydration", JSON.stringify(SEED_HYDRATIONS));
        setHydration(SEED_HYDRATIONS);
      }

      if (storedWeightHistory) {
        setWeightHistory(JSON.parse(storedWeightHistory));
      } else {
        // Seed weight logs
        const seededWeightObjects = SEED_WEIGHTS.map((w) => ({
          date: getPastDateString(w.daysOffset),
          weight: w.weight,
        }));
        localStorage.setItem("fittrack_weight_history", JSON.stringify(seededWeightObjects));
        setWeightHistory(seededWeightObjects);
      }
    } catch (e) {
      console.error("Local storage sync error:", e);
    }
  }, []);

  // Save to LocalStorage on modifications
  const updateProfileState = (newProfile: UserProfile) => {
    setProfile(newProfile);
    localStorage.setItem("fittrack_profile", JSON.stringify(newProfile));
  };

  const handleAddExercise = (newEx: Omit<Exercise, "id">) => {
    const exerciseWithId: Exercise = {
      ...newEx,
      id: Math.random().toString(),
    };
    const updated = [exerciseWithId, ...exercises];
    setExercises(updated);
    localStorage.setItem("fittrack_exercises", JSON.stringify(updated));
  };

  const handleRemoveExercise = (id: string) => {
    const updated = exercises.filter((ex) => ex.id !== id);
    setExercises(updated);
    localStorage.setItem("fittrack_exercises", JSON.stringify(updated));
  };

  const handleAddMealItem = (
    mealType: "breakfast" | "lunch" | "snack" | "dinner",
    item: Omit<MealItem, "id">
  ) => {
    const newItem: MealItem = {
      ...item,
      id: Math.random().toString(),
    };

    // Find if the current date already has a daily meal log
    const index = meals.findIndex((m) => m.date === currentDate);
    let updated: DailyMealLog[];

    if (index > -1) {
      updated = [...meals];
      updated[index][mealType] = [...updated[index][mealType], newItem];
    } else {
      const newLog: DailyMealLog = {
        date: currentDate,
        breakfast: [],
        lunch: [],
        snack: [],
        dinner: [],
      };
      newLog[mealType] = [newItem];
      updated = [...meals, newLog];
    }

    setMeals(updated);
    localStorage.setItem("fittrack_meals", JSON.stringify(updated));
  };

  const handleRemoveMealItem = (
    mealType: "breakfast" | "lunch" | "snack" | "dinner",
    id: string
  ) => {
    const index = meals.findIndex((m) => m.date === currentDate);
    if (index === -1) return;

    const updated = [...meals];
    updated[index][mealType] = updated[index][mealType].filter((item) => item.id !== id);

    setMeals(updated);
    localStorage.setItem("fittrack_meals", JSON.stringify(updated));
  };

  const handleAddWater = (amountMl: number) => {
    const index = hydration.findIndex((h) => h.date === currentDate);
    let updated: HydrationLog[];

    if (index > -1) {
      updated = [...hydration];
      updated[index].mlConsumed += amountMl;
    } else {
      updated = [...hydration, { date: currentDate, mlConsumed: amountMl }];
    }

    setHydration(updated);
    localStorage.setItem("fittrack_hydration", JSON.stringify(updated));
    playAlertBeep(440, 0.1, 1); // pleasant water drop bubble beep (A4)
  };

  const handleSetWeight = (newWeightValue: number) => {
    // 1. Update Weight History
    const index = weightHistory.findIndex((w) => w.date === currentDate);
    let updatedWeightHistory: WeightLog[];

    if (index > -1) {
      updatedWeightHistory = [...weightHistory];
      updatedWeightHistory[index].weight = newWeightValue;
    } else {
      updatedWeightHistory = [...weightHistory, { date: currentDate, weight: newWeightValue }];
    }
    setWeightHistory(updatedWeightHistory);
    localStorage.setItem("fittrack_weight_history", JSON.stringify(updatedWeightHistory));

    // 2. Also save to main profile weight parameter
    const updatedProfile = {
      ...profile,
      weight: newWeightValue,
    };
    updateProfileState(updatedProfile);
  };

  // Factory reset method
  const handleResetAllData = () => {
    localStorage.clear();
    setProfile(DEFAULT_USER_PROFILE);
    setExercises([]);
    setMeals([]);
    setHydration([]);
    setWeightHistory([]);
    setActiveTab("dashboard");
    setCurrentDate(getTodayDateString());
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col antialiased">
      
      {/* Header bar and Brand visual identity */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-xs">
              <Dumbbell className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-950 tracking-tight flex items-center gap-1.5">
                FitTrack
                <span className="text-slate-450 font-normal text-3xs border border-gray-200 py-0.5 px-2 rounded-full uppercase tracking-wider">v1.2</span>
              </h1>
              <p className="text-gray-400 text-3xs font-semibold tracking-wider uppercase">Monitoramento Inteligente</p>
            </div>
          </div>

          {/* Quick Date Selector & Active Goals Toggle */}
          <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-xl border border-gray-250">
            <div className="text-slate-500 text-xs font-bold pl-2.5 flex items-center gap-1.5 grayscale shrink-0">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Data de Diário:</span>
            </div>
            <select 
              id="date-navigator-select"
              value={currentDate}
              onChange={(e) => {
                setCurrentDate(e.target.value);
                playAlertBeep(659.25, 0.08, 1); // standard click tick
              }}
              className="bg-white border-none rounded-lg text-xs py-1 px-2.5 text-gray-800 font-bold outline-hidden shadow-2xs cursor-pointer focus:ring-1 focus:ring-emerald-500"
            >
              <option value={getPastDateString(0)}>Hoje ({formatPortugueseDate(getPastDateString(0))})</option>
              <option value={getPastDateString(1)}>Ontem ({formatPortugueseDate(getPastDateString(1))})</option>
              <option value={getPastDateString(2)}>{formatPortugueseDate(getPastDateString(2))}</option>
              <option value={getPastDateString(3)}>{formatPortugueseDate(getPastDateString(3))}</option>
              <option value={getPastDateString(4)}>{formatPortugueseDate(getPastDateString(4))}</option>
              <option value={getPastDateString(5)}>{formatPortugueseDate(getPastDateString(5))}</option>
            </select>
          </div>

        </div>
      </header>

      {/* Primary Navigation System Tab Panel */}
      <nav id="mobile-nav-panel" className="bg-slate-900 text-white shrink-0 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between md:justify-start gap-1 md:gap-4 py-2 text-xs font-extrabold uppercase tracking-wider">
            
            <button 
              id="tab-dashboard"
              onClick={() => { setActiveTab("dashboard"); playAlertBeep(494, 0.06, 1); }}
              className={`flex-1 md:flex-initial py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === "dashboard" ? "bg-emerald-500 text-white font-black" : "text-slate-450 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Painel /</span> Início
            </button>

            <button 
              id="tab-workout"
              onClick={() => { setActiveTab("workout"); playAlertBeep(494, 0.06, 1); }}
              className={`flex-1 md:flex-initial py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === "workout" ? "bg-emerald-500 text-white font-black" : "text-slate-450 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Dumbbell className="w-4 h-4" />
              Treinos
            </button>

            <button 
              id="tab-nutrition"
              onClick={() => { setActiveTab("nutrition"); playAlertBeep(494, 0.06, 1); }}
              className={`flex-1 md:flex-initial py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === "nutrition" ? "bg-emerald-500 text-white font-black" : "text-slate-450 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Apple className="w-4 h-4" />
              Nutrição
            </button>

            <button 
              id="tab-settings"
              onClick={() => { setActiveTab("settings"); playAlertBeep(494, 0.06, 1); }}
              className={`flex-1 md:flex-initial py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === "settings" ? "bg-emerald-500 text-white font-black" : "text-slate-450 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <User className="w-4 h-4" />
              Perfil
            </button>

          </div>
        </div>
      </nav>

      {/* Main Container Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + currentDate}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
          >
            {activeTab === "dashboard" && (
              <Dashboard 
                profile={profile}
                exercises={exercises}
                meals={meals}
                hydration={hydration}
                weightHistory={weightHistory}
                currentDate={currentDate}
                onAddWater={handleAddWater}
                onSetWeight={handleSetWeight}
              />
            )}

            {activeTab === "workout" && (
              <WorkoutMonitor 
                profile={profile}
                exercises={exercises}
                onAddExercise={handleAddExercise}
                onRemoveExercise={handleRemoveExercise}
                currentDate={currentDate}
              />
            )}

            {activeTab === "nutrition" && (
              <NutritionPlanner 
                profile={profile}
                meals={meals}
                onUpdateProfile={updateProfileState}
                onAddMealItem={handleAddMealItem}
                onRemoveMealItem={handleRemoveMealItem}
                currentDate={currentDate}
              />
            )}

            {activeTab === "settings" && (
              <ProfileSettings 
                profile={profile}
                onUpdateProfile={updateProfileState}
                onResetAllData={handleResetAllData}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer system credit block */}
      <footer className="bg-white border-t border-gray-100 py-6 text-center text-3xs text-gray-450 font-bold uppercase tracking-wider shrink-0">
        <span>© 2026 FitTrack. Monitoramento Integrado e Planejamento Assistido por IA.</span>
      </footer>

    </div>
  );
}
