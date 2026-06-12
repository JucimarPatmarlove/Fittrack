import React, { useState } from "react";
import { 
  Flame, 
  Plus, 
  Droplet, 
  Sparkles, 
  TrendingUp, 
  UtensilsCrossed, 
  Activity, 
  CheckCircle,
  TrendingDown,
  Calendar
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line 
} from "recharts";
import { UserProfile, Exercise, DailyMealLog, HydrationLog, WeightLog } from "../types";
import { formatPortugueseDate } from "../utils";

interface DashboardProps {
  profile: UserProfile;
  exercises: Exercise[];
  meals: DailyMealLog[];
  hydration: HydrationLog[];
  weightHistory: WeightLog[];
  currentDate: string;
  onAddWater: (amountMl: number) => void;
  onSetWeight: (weight: number) => void;
}

export default function Dashboard({
  profile,
  exercises,
  meals,
  hydration,
  weightHistory,
  currentDate,
  onAddWater,
  onSetWeight,
}: DashboardProps) {
  const [quickWeight, setQuickWeight] = useState(profile.weight.toString());

  // Calculations for static totals for CURRENT DATE
  const todayExercises = exercises.filter((ex) => ex.date === currentDate);
  const caloriesBurned = todayExercises.reduce((sum, ex) => sum + ex.caloriesBurned, 0);

  const todayMealLog = meals.find((m) => m.date === currentDate);
  let caloriesConsumed = 0;
  let proteinsConsumed = 0;
  let carbsConsumed = 0;
  let fatsConsumed = 0;

  if (todayMealLog) {
    const allMealItems = [
      ...todayMealLog.breakfast,
      ...todayMealLog.lunch,
      ...todayMealLog.snack,
      ...todayMealLog.dinner,
    ];
    caloriesConsumed = allMealItems.reduce((sum, item) => sum + item.calories, 0);
    proteinsConsumed = allMealItems.reduce((sum, item) => sum + item.protein, 0);
    carbsConsumed = allMealItems.reduce((sum, item) => sum + item.carb, 0);
    fatsConsumed = allMealItems.reduce((sum, item) => sum + item.fat, 0);
  }

  const netCalories = caloriesConsumed - caloriesBurned;
  const remainingCalories = profile.targetCalories - netCalories;
  const calorieProgressPercent = Math.min(100, Math.round((caloriesConsumed / profile.targetCalories) * 100));

  // Hydration info
  const todayWater = hydration.find((h) => h.date === currentDate)?.mlConsumed || 0;
  const waterTarget = 2500; // 2.5 Litros default
  const waterProgressPercent = Math.min(100, Math.round((todayWater / waterTarget) * 100));

  // Weight entry trigger
  const handleWeightSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(quickWeight);
    if (!isNaN(parsed) && parsed > 0) {
      onSetWeight(parsed);
    }
  };

  // Recharts: prepare 7-day caloric balance
  // Let's take the last 7 days from meals & exercise logs
  const getLast7DaysData = () => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split("T")[0];
      
      const dayMeals = meals.find((m) => m.date === dateString);
      let dayCalConsumed = 0;
      if (dayMeals) {
        dayCalConsumed = [
          ...dayMeals.breakfast,
          ...dayMeals.lunch,
          ...dayMeals.snack,
          ...dayMeals.dinner
        ].reduce((sum, item) => sum + item.calories, 0);
      }

      const dayEx = exercises.filter((ex) => ex.date === dateString);
      const dayCalBurned = dayEx.reduce((sum, ex) => sum + ex.caloriesBurned, 0);

      // Label as short format DD/MM
      const label = dateString.split("-").slice(1).reverse().join("/");

      data.push({
        name: label,
        dateFull: dateString,
        'Consumidas': dayCalConsumed,
        'Gastas': dayCalBurned,
      });
    }
    return data;
  };

  const chartDataCal = getLast7DaysData();

  // Recharts: Weight History
  const getWeightChartData = () => {
    // Sort weightHistory by date ascending
    const sorted = [...weightHistory].sort((a, b) => a.date.localeCompare(b.date));
    // If empty, put profile current weight
    if (sorted.length === 0) {
      return [{ name: "Hoje", peso: profile.weight }];
    }
    // Limit to latest 7 entries
    return sorted.slice(-7).map((w) => ({
      name: w.date.split("-").slice(1).reverse().join("/"),
      peso: w.weight,
    }));
  };

  const chartDataWeight = getWeightChartData();

  // Macros progress info
  const proteinPercent = Math.min(100, Math.round((proteinsConsumed / profile.targetProtein) * 100));
  const carbPercent = Math.min(100, Math.round((carbsConsumed / profile.targetCarb) * 100));
  const fatPercent = Math.min(100, Math.round((fatsConsumed / profile.targetFat) * 100));

  return (
    <div id="dashboard-view" className="space-y-6">
      {/* Target summary banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Calorie Calculator Card */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-6 flex flex-col justify-between" id="caloric-card">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold tracking-wide text-gray-400 uppercase">Balanço do Dia</span>
              <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
            </div>
            
            <div className="text-center my-6">
              <div className="text-5xl font-black text-gray-900 tracking-tight" id="remaining-count">
                {remainingCalories >= 0 ? remainingCalories : 0}
              </div>
              <div className="text-xs font-semibold text-gray-500 mt-2 uppercase tracking-wider">
                {remainingCalories >= 0 ? "Kcal Restantes" : "Calorias Excedendo Meta"}
              </div>
            </div>

            <div className="space-y-3 mt-4">
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-400 to-amber-500 transition-all duration-500"
                  style={{ width: `${calorieProgressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs font-medium text-gray-500">
                <span>Consumidas: {caloriesConsumed} kcal</span>
                <span>Meta: {profile.targetCalories} kcal</span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 mt-6 grid grid-cols-2 text-center">
            <div className="border-r border-gray-100">
              <div className="text-lg font-bold text-emerald-500 flex items-center justify-center gap-1">
                <UtensilsCrossed className="w-4 h-4" />
                {caloriesConsumed}
              </div>
              <span className="text-2xs text-gray-400 font-semibold uppercase tracking-wider">Refeições</span>
            </div>
            <div>
              <div className="text-lg font-bold text-orange-500 flex items-center justify-center gap-1">
                <Activity className="w-4 h-4" />
                {caloriesBurned}
              </div>
              <span className="text-2xs text-gray-400 font-semibold uppercase tracking-wider">Exercícios</span>
            </div>
          </div>
        </div>

        {/* Macros card */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-6 flex flex-col justify-between" id="macros-card">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold tracking-wide text-gray-400 uppercase">Macronutrientes</span>
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>

            <div className="space-y-4 my-auto pt-2">
              {/* Protein */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-gray-700">Proteínas (Carne, ovos, whey)</span>
                  <span className="text-gray-500">{proteinsConsumed}g / <span className="font-bold text-emerald-600">{profile.targetProtein}g</span></span>
                </div>
                <div className="h-3 w-full bg-emerald-50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${proteinPercent}%` }}
                  />
                </div>
              </div>

              {/* Carbs */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-gray-700">Carboidratos (Arroz, tapioca, aveia)</span>
                  <span className="text-gray-500">{carbsConsumed}g / <span className="font-bold text-blue-600">{profile.targetCarb}g</span></span>
                </div>
                <div className="h-3 w-full bg-blue-50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${carbPercent}%` }}
                  />
                </div>
              </div>

              {/* Fats */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-gray-700">Gorduras (Azeite, nozes, gema)</span>
                  <span className="text-gray-500">{fatsConsumed}g / <span className="font-bold text-amber-600">{profile.targetFat}g</span></span>
                </div>
                <div className="h-3 w-full bg-amber-50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 transition-all duration-300"
                    style={{ width: `${fatPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg text-slate-500 text-3xs font-semibold tracking-wider text-center mt-6">
            META IDEAL COMBINADA PARA SEU OBJETIVO DE SAÚDE
          </div>
        </div>

        {/* Water / Hydration card */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-6 flex flex-col justify-between" id="hydration-card">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold tracking-wide text-gray-400 uppercase">Hidratação</span>
              <Droplet className="w-5 h-5 text-blue-500" />
            </div>

            <div className="text-center my-4">
              <div className="text-4xl font-extrabold text-blue-600 tracking-tight" id="water-consumed-ml">
                {todayWater} ml
              </div>
              <div className="text-2xs font-semibold text-gray-400 uppercase mt-1">
                Meta recomendada: {waterTarget} ml
              </div>
            </div>

            {/* Visual hydration percentage */}
            <div className="h-2 w-full bg-blue-50 rounded-full overflow-hidden mb-6">
              <div 
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${waterProgressPercent}%` }}
              />
            </div>

            {/* Clickable quick-action water log */}
            <div className="grid grid-cols-3 gap-2">
              <button 
                id="add-water-250"
                onClick={() => onAddWater(250)}
                className="py-2 px-1 text-xs border border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 text-blue-700 font-bold rounded-lg transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer"
              >
                <span className="text-sm">🥛</span>
                <span>+250ml</span>
              </button>
              <button 
                id="add-water-500"
                onClick={() => onAddWater(500)}
                className="py-2 px-1 text-xs border border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 text-blue-700 font-bold rounded-lg transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer"
              >
                <span className="text-sm">🥤</span>
                <span>+500ml</span>
              </button>
              <button 
                id="add-water-1000"
                onClick={() => onAddWater(1000)}
                className="py-2 px-1 text-xs border border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 text-blue-700 font-bold rounded-lg transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer"
              >
                <span className="text-sm">🍼</span>
                <span>+1L</span>
              </button>
            </div>
          </div>

          <div className="text-center text-3xs text-gray-400 mt-4 leading-normal">
            Beba água regularmente para manter a saúde muscular e acelerar o metabolismo.
          </div>
        </div>
      </div>

      {/* Analytics Graphics & Weight Sync */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Calories Progression Graph (2/3 width on desktop) */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-xs border border-gray-100 p-6" id="progress-graph-card">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-gray-600" />
                Histórico de Balanço Calórico (Últimos 7 dias)
              </h3>
              <p className="text-gray-500 text-xs">Acompanhamento das calorias consumidas versus queimadas em treinos</p>
            </div>
            
            <span className="text-xs bg-slate-100 font-semibold text-slate-600 rounded-full py-1 px-3 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Diário Ativo
            </span>
          </div>

          {/* Recharts Container */}
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataCal} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1e293b", borderRadius: "12px", border: "none", color: "#fff" }}
                  labelStyle={{ fontWeight: "bold", color: "#94a3b8" }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="Consumidas" fill="#10b981" radius={[4, 4, 0, 0]} name="Consumidas (kcal)" />
                <Bar dataKey="Gastas" fill="#f97316" radius={[4, 4, 0, 0]} name="Gastas (Exercício kcal)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weight Tracker Graph & Dynamic Sync */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-6 flex flex-col justify-between" id="weight-history-card">
          <div>
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2 mb-1">
              <TrendingDown className="w-5 h-5 text-gray-600" />
              Evolução do Peso
            </h3>
            <p className="text-gray-500 text-xs mb-4">Mantenha seu registro e recalcule metas</p>

            {/* Quick Weight Form */}
            <form onSubmit={handleWeightSubmit} className="flex gap-2 mb-6">
              <div className="relative flex-1">
                <input 
                  type="number" 
                  step="0.1" 
                  id="weight-input-field"
                  placeholder="Seu peso (kg)"
                  value={quickWeight}
                  onChange={(e) => setQuickWeight(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 font-semibold focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs uppercase">KG</span>
              </div>
              <button 
                type="submit"
                id="save-weight-button"
                className="px-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wide rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Registrar
              </button>
            </form>

            {/* Weight Line Chart */}
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartDataWeight} margin={{ top: 5, right: 15, left: -25, bottom: 5 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={10} domain={['dataMin - 2', 'dataMax + 2']} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1e293b", borderRadius: "10px", border: "none", color: "#fff" }}
                    labelStyle={{ fontWeight: "bold" }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="peso" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    dot={{ fill: "#10b981", r: 4 }}
                    name="Peso (kg)" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 mt-4 flex items-center justify-between text-xs text-gray-600 font-semibold leading-relaxed">
            <span>Peso atual:</span>
            <span className="text-gray-900 font-bold bg-white border border-slate-200 py-1 px-3 rounded-md shadow-2xs">
              {profile.weight} kg
            </span>
          </div>
        </div>
      </div>

      {/* Recents list and healthy daily recommendation */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl shadow-md p-6 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="px-3 py-1 bg-white/20 font-extrabold text-3xs uppercase tracking-wider rounded-full">Dica Saudável Inteligente</span>
          <h4 className="text-xl font-bold tracking-tight">O poder do descanso ativo</h4>
          <p className="text-white/80 text-sm max-w-2xl leading-relaxed">
            Beber pelo menos 500ml de água logo ao acordar desperta seus rins, ajuda a purgar toxinas e acelera a digestão do dia. Se o seu foco é hipertrofia, garanta pelo menos 2g de proteína para cada kg do seu corpo e faça um intervalo de 60 a 90 segundos entre as séries de treino usando o cronômetro do seu monitor!
          </p>
        </div>
        <div className="py-2.5 px-5 bg-white/10 hover:bg-white/15 transition-colors border border-white/20 rounded-xl self-stretch md:self-auto flex flex-col justify-center items-center text-center">
          <span className="text-3xl">🎯</span>
          <span className="text-xs font-semibold mt-1 uppercase tracking-wider">Objetivo</span>
          <span className="text-sm font-bold bg-white text-emerald-700 py-0.5 px-3.5 rounded-full mt-1">
            {profile.weight} kg → Meta
          </span>
        </div>
      </div>
    </div>
  );
}
