import React, { useState, useRef, useEffect } from "react";
import { 
  Apple, 
  Plus, 
  Trash2, 
  ChevronRight, 
  Sparkles, 
  Send,
  Sparkle,
  Dumbbell,
  Scale,
  Activity,
  Check,
  Utensils,
  ChevronDown
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { UserProfile, DailyMealLog, MealItem, FitnessGoal, ActivityLevel, AIChatMessage } from "../types";
import { PRESET_FOODS, calculateMacros, translateGoal, translateActivityLevel } from "../utils";

interface NutritionPlannerProps {
  profile: UserProfile;
  meals: DailyMealLog[];
  onUpdateProfile: (newProfile: UserProfile) => void;
  onAddMealItem: (mealType: "breakfast" | "lunch" | "snack" | "dinner", item: Omit<MealItem, "id">) => void;
  onRemoveMealItem: (mealType: "breakfast" | "lunch" | "snack" | "dinner", id: string) => void;
  currentDate: string;
}

export default function NutritionPlanner({
  profile,
  meals,
  onUpdateProfile,
  onAddMealItem,
  onRemoveMealItem,
  currentDate,
}: NutritionPlannerProps) {
  // Calculator States
  const [weight, setWeight] = useState(profile.weight.toString());
  const [height, setHeight] = useState(profile.height.toString());
  const [age, setAge] = useState(profile.age.toString());
  const [gender, setGender] = useState<"male" | "female" | "other">(profile.gender);
  const [goal, setGoal] = useState<FitnessGoal>(profile.goal);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(profile.activityLevel);
  const [isCalculated, setIsCalculated] = useState(false);

  // Temporary computed values
  const [tempProfile, setTempProfile] = useState<UserProfile | null>(null);

  // Food logging states per meal segment
  const [activeSegment, setActiveSegment] = useState<"breakfast" | "lunch" | "snack" | "dinner">("breakfast");
  const [presetFoodIndex, setPresetFoodIndex] = useState("0");
  const [customFoodName, setCustomFoodName] = useState(PRESET_FOODS[0].name);
  const [calories, setCalories] = useState(PRESET_FOODS[0].calories.toString());
  const [protein, setProtein] = useState(PRESET_FOODS[0].protein.toString());
  const [carb, setCarb] = useState(PRESET_FOODS[0].carb.toString());
  const [fat, setFat] = useState(PRESET_FOODS[0].fat.toString());

  // NutriChef AI States
  const [aiChat, setAiChat] = useState<AIChatMessage[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "Seja bem-vindo ao **NutriChef AI**! Posso criar receitas customizadas excelentes para suas calorias, sugerir substituições saudáveis ou planejar o cardápio da sua semana. O que vamos cozinhar hoje?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
  ]);
  const [userQuery, setUserQuery] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiChat]);

  // Handle calculator submit
  const handleCalculateMetabolism = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weight) || 70;
    const h = parseFloat(height) || 170;
    const a = parseInt(age) || 25;

    const baseProfile: UserProfile = {
      weight: w,
      height: h,
      age: a,
      gender,
      goal,
      activityLevel,
      targetCalories: 2000,
      targetProtein: 120,
      targetCarb: 220,
      targetFat: 60
    };

    const computed = calculateMacros(baseProfile);
    setTempProfile(computed);
    setIsCalculated(true);
  };

  const handleApplyCalculatedMacros = () => {
    if (tempProfile) {
      onUpdateProfile(tempProfile);
      setIsCalculated(false);
    }
  };

  // Preset Food Sync
  const handlePresetFoodChange = (idxStr: string) => {
    setPresetFoodIndex(idxStr);
    if (idxStr !== "custom") {
      const idx = parseInt(idxStr);
      if (PRESET_FOODS[idx]) {
        const item = PRESET_FOODS[idx];
        setCustomFoodName(item.name);
        setCalories(item.calories.toString());
        setProtein(item.protein.toString());
        setCarb(item.carb.toString());
        setFat(item.fat.toString());
      }
    } else {
      setCustomFoodName("");
      setCalories("100");
      setProtein("5");
      setCarb("15");
      setFat("2");
    }
  };

  // Submit Meal Item
  const handleLogMealItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFoodName.trim()) return;

    onAddMealItem(activeSegment, {
      name: customFoodName,
      calories: parseInt(calories) || 0,
      protein: parseInt(protein) || 0,
      carb: parseInt(carb) || 0,
      fat: parseInt(fat) || 0,
    });

    // Reset fields depending on input selection
    if (presetFoodIndex === "custom") {
      setCustomFoodName("");
      setCalories("100");
      setProtein("5");
      setCarb("15");
      setFat("2");
    }
  };

  // NutriChef prompt launcher
  const handleSendAiNutritionQuery = async (presetQuestion?: string) => {
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
      // Collect current daily logged foods to send as context to AI for real analysis
      const dayMeals = meals.find((m) => m.date === currentDate);
      let foodContextString = "";
      if (dayMeals) {
        const bk = dayMeals.breakfast.map((f) => `${f.name} (${f.calories}kcal)`).join(", ") || "Nenhum";
        const lc = dayMeals.lunch.map((f) => `${f.name} (${f.calories}kcal)`).join(", ") || "Nenhum";
        const sn = dayMeals.snack.map((f) => `${f.name} (${f.calories}kcal)`).join(", ") || "Nenhum";
        const dn = dayMeals.dinner.map((f) => `${f.name} (${f.calories}kcal)`).join(", ") || "Nenhum";
        
        foodContextString = `Café da manhã: ${bk} | Almoço: ${lc} | Lanche: ${sn} | Jantar: ${dn}`;
      } else {
        foodContextString = "Ainda não registrou alimentos hoje.";
      }

      const response = await fetch("/api/ai/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: profile.goal,
          restrictions: "Alergias ou intolerâncias ignoradas pelo sistema no momento",
          currentMeals: foodContextString,
          targetCalories: profile.targetCalories,
          targetMacros: {
            protein: profile.targetProtein,
            carb: profile.targetCarb,
            fat: profile.targetFat
          },
          userMessage: question,
        }),
      });

      const data = await response.json();
      const aiResponse = data.text || "Ops, ocorreu um erro de conexão com o NutriChef AI.";

      setAiChat((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: "ai",
          text: aiResponse,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }
      ]);
    } catch (err) {
      console.error(err);
      setAiChat((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: "ai",
          text: "Não consegui falar com o NutriChef AI. Por favor, cheque sua internet e tente de novo.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Find meals for active day
  const todayMeals = meals.find((m) => m.date === currentDate) || {
    date: currentDate,
    breakfast: [],
    lunch: [],
    snack: [],
    dinner: [],
  };

  const getMealSum = (items: MealItem[]) => {
    return {
      cal: items.reduce((s, i) => s + i.calories, 0),
      prot: items.reduce((s, i) => s + i.protein, 0),
      carb: items.reduce((s, i) => s + i.carb, 0),
      fat: items.reduce((s, i) => s + i.fat, 0),
    };
  };

  const breakfastSum = getMealSum(todayMeals.breakfast);
  const lunchSum = getMealSum(todayMeals.lunch);
  const snackSum = getMealSum(todayMeals.snack);
  const dinnerSum = getMealSum(todayMeals.dinner);

  const totalCaloriesLogged = breakfastSum.cal + lunchSum.cal + snackSum.cal + dinnerSum.cal;
  const totalProteinLogged = breakfastSum.prot + lunchSum.prot + snackSum.prot + dinnerSum.prot;
  const totalCarbLogged = breakfastSum.carb + lunchSum.carb + snackSum.carb + dinnerSum.carb;
  const totalFatLogged = breakfastSum.fat + lunchSum.fat + snackSum.fat + dinnerSum.fat;

  return (
    <div id="nutrition-planner-view" className="space-y-6">
      
      {/* Target & Metabolism Calculator Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Dynamic Calculator Form */}
        <div className="xl:col-span-1 bg-white rounded-3xl shadow-xs border border-gray-100 p-6" id="bmr-calc-container">
          <div className="flex items-center gap-2 mb-3">
            <Scale className="w-5 h-5 text-emerald-500" />
            <h3 className="font-extrabold text-gray-900 text-lg">Calculadora de Metas</h3>
          </div>
          <p className="text-gray-500 text-2xs leading-relaxed mb-4">
            Insira suas informações biológicas para descobrir sua meta diária de calorias e distribuição ideal de macronutrientes.
          </p>

          <form onSubmit={handleCalculateMetabolism} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-3xs font-extrabold text-gray-400 uppercase tracking-wide">Peso (kg)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  required
                  id="calc-weight"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg py-1.5 px-2.5 text-xs text-gray-800 font-bold focus:outline-hidden focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-3xs font-extrabold text-gray-400 uppercase tracking-wide">Altura (cm)</label>
                <input 
                  type="number" 
                  required
                  id="calc-height"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg py-1.5 px-2.5 text-xs text-gray-800 font-bold focus:outline-hidden focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-3xs font-extrabold text-gray-400 uppercase tracking-wide">Idade (anos)</label>
                <input 
                  type="number" 
                  required
                  id="calc-age"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg py-1.5 px-2.5 text-xs text-gray-800 font-bold focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-3xs font-extrabold text-gray-400 uppercase tracking-wide block">Gênero Biológico</label>
                <select 
                  id="calc-gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg py-1.5 px-2.5 text-xs text-gray-700 font-bold focus:outline-hidden"
                >
                  <option value="male">Masculino</option>
                  <option value="female">Feminino</option>
                  <option value="other">Outros / Neutro</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-3xs font-extrabold text-gray-400 uppercase tracking-wide block">Nível de Atividade</label>
                <select 
                  id="calc-activity"
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value as any)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg py-1.5 px-2.5 text-xs text-gray-700 font-bold focus:outline-hidden"
                >
                  <option value={ActivityLevel.SEDENTARY}>Sedentário</option>
                  <option value={ActivityLevel.LIGHT}>Leve</option>
                  <option value={ActivityLevel.MODERATE}>Moderado</option>
                  <option value={ActivityLevel.ACTIVE}>Ativo</option>
                  <option value={ActivityLevel.VERY_ACTIVE}>Altamente Ativo</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-3xs font-extrabold text-gray-400 uppercase tracking-wide block">Objetivo de Saúde</label>
              <select 
                id="calc-goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value as any)}
                className="w-full bg-slate-50 border border-gray-200 rounded-lg py-1.5 px-2.5 text-xs text-gray-700 font-bold focus:outline-hidden"
              >
                <option value={FitnessGoal.LOSE_WEIGHT}>Emagrecimento / Queima de Gordura</option>
                <option value={FitnessGoal.GAIN_MUSCLE}>Hipertrofia / Ganho de Massa Muscular</option>
                <option value={FitnessGoal.MAINTAIN}>Manutenção de Peso Saudável</option>
                <option value={FitnessGoal.HEALTH}>Aumento de Energia e Vitalidade Geral</option>
              </select>
            </div>

            <button 
              type="submit"
              id="submit-metabolism-calc"
              className="w-full py-2.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-sm"
            >
              <Activity className="w-4 h-4" />
              Calcular Metabolismo
            </button>
          </form>

          {/* Computed Meta Popup */}
          {isCalculated && tempProfile && (
            <div className="mt-5 p-4 bg-emerald-50 border border-emerald-250 rounded-2xl space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800">Resultado Sugerido:</span>
                <span className="text-2xs font-extrabold text-emerald-500 uppercase tracking-widest bg-white border border-emerald-100 py-0.5 px-2 rounded-md">Pronto</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-center text-gray-800">
                <div className="bg-white p-2 border border-emerald-100 rounded-lg">
                  <div className="text-lg font-black text-gray-900">{tempProfile.targetCalories}</div>
                  <span className="text-3xs text-gray-400 font-semibold uppercase">kcal diárias</span>
                </div>
                <div className="bg-white p-2 border border-emerald-100 rounded-lg">
                  <div className="text-lg font-black text-emerald-600">{tempProfile.targetProtein}g</div>
                  <span className="text-3xs text-gray-400 font-semibold uppercase">Proteínas</span>
                </div>
                <div className="bg-white p-2 border border-emerald-100 rounded-lg">
                  <div className="text-lg font-black text-blue-600">{tempProfile.targetCarb}g</div>
                  <span className="text-3xs text-gray-400 font-semibold uppercase">Carboidratos</span>
                </div>
                <div className="bg-white p-2 border border-emerald-100 rounded-lg">
                  <div className="text-lg font-black text-amber-600">{tempProfile.targetFat}g</div>
                  <span className="text-3xs text-gray-400 font-semibold uppercase">Gorduras</span>
                </div>
              </div>

              <button 
                type="button"
                id="apply-macros-button"
                onClick={handleApplyCalculatedMacros}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Aplicar ao Meu Perfil
              </button>
            </div>
          )}
        </div>

        {/* Current profile goals summary card */}
        <div className="xl:col-span-2 bg-slate-900 text-white rounded-3xl p-6 flex flex-col justify-between" id="diet-meta-summary bg">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-emerald-400 font-black text-3xs uppercase tracking-widest">Dashboard Nutricional</span>
              <Apple className="w-5 h-5 text-emerald-500 animate-pulse" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              
              <div className="space-y-1 border-r border-slate-800 pr-4">
                <span className="text-slate-400 text-3xs font-extrabold uppercase tracking-wider">Metas Ativas</span>
                <div className="text-3l mt-1 font-extrabold text-emerald-400">
                  {profile.targetCalories} kcal <span className="text-slate-300 font-medium text-xs">/ dia</span>
                </div>
                <p className="text-slate-450 text-2xs mt-1.5 leading-relaxed">
                  Calculado baseado em: Mudar para **{translateGoal(profile.goal)}** treinando em intensidade **{translateActivityLevel(profile.activityLevel)}**.
                </p>
              </div>

              <div className="space-y-4">
                <span className="text-slate-400 text-3xs font-extrabold uppercase tracking-wide block">Diário Alimentar de Hoje</span>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950/65 p-3 rounded-xl border border-slate-850">
                    <div className="text-xs font-semibold text-slate-400">Consumido</div>
                    <div className="text-lg font-bold text-slate-100">{totalCaloriesLogged} kcal</div>
                  </div>
                  
                  <div className="bg-slate-950/65 p-3 rounded-xl border border-slate-850">
                    <div className="text-xs font-semibold text-slate-400">Saldo Restante</div>
                    <div className={`text-lg font-bold ${profile.targetCalories - totalCaloriesLogged >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {profile.targetCalories - totalCaloriesLogged} kcal
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 text-xs font-semibold text-slate-300">
                  <span>P: <span className="text-emerald-400">{totalProteinLogged}g</span> / {profile.targetProtein}g</span>
                  <span>C: <span className="text-blue-400">{totalCarbLogged}g</span> / {profile.targetCarb}g</span>
                  <span>G: <span className="text-amber-400">{totalFatLogged}g</span> / {profile.targetFat}g</span>
                </div>

              </div>

            </div>
          </div>

          <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden mt-6">
            <div 
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round((totalCaloriesLogged / profile.targetCalories) * 100))}%` }}
            />
          </div>
        </div>

      </div>

      {/* Main Logging Diário & Visual Segments (Left 7/12 on large, AI right 5/12) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Meals manager panel (7/12 cols) */}
        <div className="xl:col-span-7 bg-white rounded-3xl border border-gray-100 shadow-xs p-6" id="meals-logger-wrapper">
          <div className="flex items-end justify-between border-b border-gray-100 pb-4 mb-4">
            <div>
              <h3 className="font-extrabold text-gray-900 text-lg flex items-center gap-1.5">
                <Utensils className="w-5 h-5 text-emerald-500" />
                Alimentação Diária
              </h3>
              <p className="text-gray-500 text-2xs mt-0.5">Gerencie os alimentos distribuídos ao longo das refeições</p>
            </div>
          </div>

          {/* Meal segments select tabs (Breakfast, Lunch, Snack, Dinner) */}
          <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-xl mb-6">
            {(["breakfast", "lunch", "snack", "dinner"] as const).map((seg) => {
              const count = todayMeals[seg].length;
              const names = {
                breakfast: "Café",
                lunch: "Almoço",
                snack: "Lanche",
                dinner: "Jantar",
              };
              return (
                <button
                  key={seg}
                  onClick={() => setActiveSegment(seg)}
                  className={`py-2 text-xs font-extrabold uppercase tracking-wide rounded-lg transition-all cursor-pointer ${
                    activeSegment === seg 
                      ? "bg-white text-emerald-600 shadow-2xs" 
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {names[seg]}
                  {count > 0 && <span className="ml-1 text-4xs bg-emerald-500 text-white py-0.5 px-1.5 rounded-full">{count}</span>}
                </button>
              );
            })}
          </div>

          {/* Quick Item add form inside Active Segment */}
          <form onSubmit={handleLogMealItem} className="bg-slate-50 p-4 rounded-2xl mb-6 space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="space-y-1">
                <label className="text-3xs font-extrabold text-gray-400 uppercase tracking-widest block">Escolha Presets Rápidos</label>
                <select 
                  id="preset-food-select"
                  value={presetFoodIndex}
                  onChange={(e) => handlePresetFoodChange(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg text-sm px-3 py-1.5 text-gray-700 font-semibold focus:outline-hidden"
                >
                  {PRESET_FOODS.map((f, idx) => (
                    <option key={idx} value={idx}>{f.name} - {f.calories}kcal</option>
                  ))}
                  <option value="custom">✍️ Inserir Personalizado / Outro</option>
                </select>
              </div>

              {presetFoodIndex === "custom" && (
                <div className="space-y-1">
                  <label className="text-3xs font-extrabold text-gray-400 uppercase tracking-widest block">Nome do Alimento</label>
                  <input 
                    type="text" 
                    id="custom-food-name"
                    required
                    value={customFoodName}
                    onChange={(e) => setCustomFoodName(e.target.value)}
                    placeholder="Ex: Whey protein, Batata frita, Maçã..."
                    className="w-full bg-white border border-gray-200 rounded-lg text-sm px-3 py-1.5 text-gray-800"
                  />
                </div>
              )}

            </div>

            {/* Macros specifications */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <label className="text-4xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Calorias</label>
                <div className="relative">
                  <input 
                    type="number" 
                    id="food-calories"
                    required
                    min="0"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg text-center font-bold text-xs py-1"
                  />
                  <span className="text-4xs text-slate-400 block mt-0.5">kcal</span>
                </div>
              </div>

              <div>
                <label className="text-4xs font-bold text-emerald-600 uppercase tracking-wider block mb-1">Proteína</label>
                <div className="relative">
                  <input 
                    type="number" 
                    id="food-protein"
                    required
                    min="0"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg text-center font-bold text-xs py-1"
                  />
                  <span className="text-4xs text-slate-400 block mt-0.5">g (carb)</span>
                </div>
              </div>

              <div>
                <label className="text-4xs font-bold text-blue-600 uppercase tracking-wider block mb-1">Carboidr.</label>
                <div className="relative">
                  <input 
                    type="number" 
                    id="food-carb"
                    required
                    min="0"
                    value={carb}
                    onChange={(e) => setCarb(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg text-center font-bold text-xs py-1"
                  />
                  <span className="text-4xs text-slate-400 block mt-0.5">g (prot)</span>
                </div>
              </div>

              <div>
                <label className="text-4xs font-bold text-amber-600 uppercase tracking-wider block mb-1">Gorduras</label>
                <div className="relative">
                  <input 
                    type="number" 
                    id="food-fat"
                    required
                    min="0"
                    value={fat}
                    onChange={(e) => setFat(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg text-center font-bold text-xs py-1"
                  />
                  <span className="text-4xs text-slate-400 block mt-0.5">g (fat)</span>
                </div>
              </div>
            </div>

            <button 
              type="submit"
              id="log-food-button"
              className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 font-black text-xs uppercase tracking-wider text-white rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4.5 h-4.5" />
              Adicionar Novo Alimento
            </button>
          </form>

          {/* List logged items in active segment */}
          <div className="space-y-3" id="active-segment-items-list">
            <div className="flex items-center justify-between text-2xs font-extrabold uppercase text-gray-400 pb-1 border-b border-gray-50">
              <span>Alimento Logado</span>
              <div className="flex gap-4">
                <span>Macros (P/C/G)</span>
                <span>Kcal</span>
              </div>
            </div>

            {todayMeals[activeSegment].length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <span className="text-2xl block mb-1">🍽️</span>
                <p className="text-xs font-semibold">Nenhum alimento registrado para esta refeição.</p>
                <p className="text-[10px] mt-0.5 text-gray-400">Utilize o formulário de presets rápidos acima.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                {todayMeals[activeSegment].map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between hover:bg-slate-50 px-1 rounded-sm">
                    <div>
                      <div className="text-xs font-bold text-gray-800">{item.name}</div>
                      <span className="text-4xs font-semibold text-slate-400 uppercase tracking-widest">{activeSegment} Log</span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-gray-400 text-3xs font-semibold">
                        {item.protein}g / {item.carb}g / {item.fat}g
                      </span>
                      <span className="font-extrabold text-emerald-600 text-xs text-right min-w-[50px]">
                        {item.calories} kcal
                      </span>
                      <button 
                        onClick={() => onRemoveMealItem(activeSegment, item.id)}
                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-md transition-colors cursor-pointer"
                        title="Remover"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Visual breakdown metrics for this specific segment */}
            {todayMeals[activeSegment].length > 0 && (
              <div className="bg-slate-50 rounded-xl p-3 mt-4 text-xs font-semibold text-gray-600 flex items-center justify-between">
                <span>Métricas desta Refeição:</span>
                <span className="text-gray-900 font-bold bg-white border border-slate-200 py-1 px-3 rounded-lg shadow-3xs">
                  {getMealSum(todayMeals[activeSegment]).cal} kcal | P:{getMealSum(todayMeals[activeSegment]).prot}g C:{getMealSum(todayMeals[activeSegment]).carb}g G:{getMealSum(todayMeals[activeSegment]).fat}g
                </span>
              </div>
            )}

          </div>

        </div>

        {/* NutriChef AI chat interface (5/12 cols) */}
        <div className="xl:col-span-5 bg-slate-900 rounded-3xl border border-slate-800 flex flex-col h-[600px] overflow-hidden" id="ai-chef-chat">
          
          <div className="p-4 bg-slate-950 border-b border-slate-850 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/25">
                <Apple className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-white tracking-widest flex items-center gap-1">
                  NutriChef AI
                  <Sparkle className="w-3.5 h-3.5 text-emerald-400 animate-spin-slow" />
                </h4>
                <span className="text-3xs text-emerald-400 font-bold block">Consulente de Receitas e Nutrologia</span>
              </div>
            </div>

            <span className="px-2.5 py-0.5 bg-slate-850 border border-slate-800 text-slate-450 font-bold text-3xs rounded-md">
              Métricas Online
            </span>
          </div>

          {/* Quick preset questions */}
          <div className="p-2.5 bg-slate-950/45 border-b border-slate-850 flex gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
            <button 
              id="ai-chef-breakfast-ideas"
              onClick={() => handleSendAiNutritionQuery("Me dê 3 ideias de café da manhã rápidos e proteicos com aveia e ovos.")}
              disabled={isAiLoading}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-white font-bold text-3xs uppercase tracking-wider rounded-lg shrink-0 transition-colors cursor-pointer disabled:opacity-50"
            >
              🥞 Café Proteico
            </button>
            <button 
              id="ai-chef-fridge-recipe"
              onClick={() => handleSendAiNutritionQuery("Tenho apenas peito de frango, batata-doce e brócolis na geladeira. Crie uma receita saborosa com temperos básicos.")}
              disabled={isAiLoading}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-white font-bold text-3xs uppercase tracking-wider rounded-lg shrink-0 transition-colors cursor-pointer disabled:opacity-50"
            >
              🍗 Sobras na Geladeira
            </button>
            <button 
              id="ai-chef-diet-review"
              onClick={() => handleSendAiNutritionQuery("Analise as minhas refeições registradas hoje e me dê dicas práticas de macronutrientes para bater minhas metas de saúde.")}
              disabled={isAiLoading}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-white font-bold text-3xs uppercase tracking-wider rounded-lg shrink-0 transition-colors cursor-pointer disabled:opacity-50"
            >
              📊 Análise de Diário
            </button>
          </div>

          {/* Message layout */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" id="chef-messages-container">
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
                  <div className="text-xs leading-relaxed prose prose-invert max-w-none">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold block mt-1 text-right uppercase">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {isAiLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 border border-slate-700 p-4 rounded-2xl rounded-bl-none flex items-center gap-3">
                  <div className="flex space-x-1.5">
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" />
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span className="text-slate-300 text-2xs italic font-semibold">Cozinhando ideias de receitas Fit...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input control */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendAiNutritionQuery();
            }}
            className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2"
          >
            <input 
              type="text"
              id="ai-chef-prompt-input"
              disabled={isAiLoading}
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="Digite: 'Sugira uma receita doce fit com cacau'..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 font-medium focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50"
            />
            <button 
              type="submit"
              id="send-chef-prompt"
              disabled={isAiLoading || !userQuery.trim()}
              className="p-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors cursor-pointer flex items-center justify-center shrink-0 disabled:opacity-50"
              title="Perguntar ao Chef"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>

      </div>

    </div>
  );
}
