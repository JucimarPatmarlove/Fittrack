import React, { useState } from "react";
import { 
  User, 
  Settings, 
  ShieldAlert, 
  Flame, 
  RefreshCw, 
  Check, 
  Info,
  Scale,
  Smile
} from "lucide-react";
import { UserProfile, FitnessGoal, ActivityLevel } from "../types";
import { calculateMacros } from "../utils";

interface ProfileSettingsProps {
  profile: UserProfile;
  onUpdateProfile: (newProfile: UserProfile) => void;
  onResetAllData: () => void;
}

export default function ProfileSettings({
  profile,
  onUpdateProfile,
  onResetAllData,
}: ProfileSettingsProps) {
  // Local state form
  const [weight, setWeight] = useState(profile.weight.toString());
  const [height, setHeight] = useState(profile.height.toString());
  const [age, setAge] = useState(profile.age.toString());
  const [gender, setGender] = useState<"male" | "female" | "other">(profile.gender);
  const [goal, setGoal] = useState<FitnessGoal>(profile.goal);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(profile.activityLevel);
  const [isSaved, setIsSaved] = useState(false);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weight) || 75;
    const h = parseFloat(height) || 175;
    const a = parseInt(age) || 28;

    const updatedBase: UserProfile = {
      weight: w,
      height: h,
      age: a,
      gender,
      goal,
      activityLevel,
      targetCalories: profile.targetCalories,
      targetProtein: profile.targetProtein,
      targetCarb: profile.targetCarb,
      targetFat: profile.targetFat
    };

    // Recalculates Mifflin-St Jeor targets dynamically
    const finalProfile = calculateMacros(updatedBase);
    onUpdateProfile(finalProfile);

    // Show temporary saved toast/feedback
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 2000);
  };

  const handleResetDataClick = () => {
    if (!isConfirmingReset) {
      setIsConfirmingReset(true);
    } else {
      onResetAllData();
      setIsConfirmingReset(false);
      alert("Todos os dados locais foram apagados com sucesso!");
    }
  };

  return (
    <div id="profile-settings-view" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Settings Form Card (7/12 cols) */}
      <div className="lg:col-span-8 bg-white rounded-3xl border border-gray-100 shadow-xs p-6" id="settings-form-container">
        <h3 className="font-extrabold text-gray-900 text-lg flex items-center gap-2 mb-2">
          <Settings className="w-5 h-5 text-emerald-500" />
          Configurações Biológicas e Calóricas
        </h3>
        <p className="text-gray-500 text-2xs leading-relaxed mb-6">
          Ajuste as suas características físicas para que o FitTrack possa calcular suas taxas metabólicas basais e metas alimentares com exatidão científica.
        </p>

        <form onSubmit={handleSaveProfile} className="space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-2xs font-extrabold text-gray-400 uppercase tracking-widest block">Peso Corporal (kg)</label>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.1"
                  required
                  id="settings-weight"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg py-2 px-3 text-sm font-bold text-gray-800 focus:outline-hidden"
                />
                <span className="absolute right-3 top-2.5 text-3xs font-extrabold text-gray-400">KG</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-2xs font-extrabold text-gray-400 uppercase tracking-widest block">Altura (cm)</label>
              <div className="relative">
                <input 
                  type="number" 
                  required
                  id="settings-height"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg py-2 px-3 text-sm font-bold text-gray-800 focus:outline-hidden"
                />
                <span className="absolute right-3 top-2.5 text-3xs font-extrabold text-gray-400">CM</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-2xs font-extrabold text-gray-400 uppercase tracking-widest block">Sua Idade (anos)</label>
              <div className="relative">
                <input 
                  type="number" 
                  required
                  id="settings-age"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg py-2 px-3 text-sm font-bold text-gray-800 focus:outline-hidden"
                />
                <span className="absolute right-3 top-2.5 text-3xs font-extrabold text-gray-400">ANOS</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-2xs font-bold text-gray-400 uppercase tracking-widest block">Gênero Biológico</label>
              <select 
                id="settings-gender"
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full bg-slate-50 border border-gray-200 rounded-lg py-2 px-3 text-sm font-bold text-gray-700 focus:outline-hidden"
              >
                <option value="male">Masculino</option>
                <option value="female">Feminino</option>
                <option value="other">Outro / Não-Binário</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-2xs font-bold text-gray-400 uppercase tracking-widest block">Frequência Semanal de Exercício</label>
              <select 
                id="settings-activity"
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value as any)}
                className="w-full bg-slate-50 border border-gray-200 rounded-lg py-2 px-3 text-sm font-bold text-gray-700 focus:outline-hidden"
              >
                <option value={ActivityLevel.SEDENTARY}>Sedentário (Trabalho em escritório, sem treinos)</option>
                <option value={ActivityLevel.LIGHT}>Leve (Exercícios leves de 1 a 3 dias/semana)</option>
                <option value={ActivityLevel.MODERATE}>Moderado (Exercícios moderados de 3 a 5 dias/semana)</option>
                <option value={ActivityLevel.ACTIVE}>Ativo (Treinos pesados ou esportes de 6 a 7 dias/semana)</option>
                <option value={ActivityLevel.VERY_ACTIVE}>Altamente Ativo (Atletas profissionais ou operários braçais)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-2xs font-bold text-gray-400 uppercase tracking-widest block">Seu Foco / Objetivo de Fitness</label>
            <select 
              id="settings-goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value as any)}
              className="w-full bg-slate-50 border border-gray-200 rounded-lg py-2 px-3 text-sm font-bold text-gray-700 focus:outline-hidden cursor-pointer"
            >
              <option value={FitnessGoal.LOSE_WEIGHT}>Perda de Peso Saudável (Criar Déficit Calórico)</option>
              <option value={FitnessGoal.GAIN_MUSCLE}>Hipertrofia Muscular (Garantir Superávit Calórico e Proteínas)</option>
              <option value={FitnessGoal.MAINTAIN}>Manter Forma Atual (Controle de Energia Equilibrado)</option>
              <option value={FitnessGoal.HEALTH}>Aumento de Energia e Redução de Inflamação Geral</option>
            </select>
          </div>

          <div className="border-t border-gray-100 pt-6 flex items-center justify-between">
            <div className="text-3xs text-gray-400 font-semibold tracking-wider uppercase">
              SEUS MACROS PODEM SER REAJUSTADOS APÓS CONFIRMAR
            </div>
            
            <button 
              type="submit"
              id="save-profile-settings"
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {isSaved ? (
                <>
                  <Check className="w-5 h-5 animate-pulse" />
                  Salvo com Sucesso!
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Salvar e Recalcular Metas
                </>
              )}
            </button>
          </div>

        </form>

      </div>

      {/* Reset Data & Technical info cards (4/12 cols) */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Active mathematical summary parameters */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 space-y-4" id="macros-details-summary">
          <div className="flex items-center gap-2 text-emerald-400">
            <Flame className="w-5 h-5 animate-pulse" />
            <h4 className="font-extrabold text-sm uppercase tracking-wider">Metabólica Ativa</h4>
          </div>

          <div className="text-3s font-bold">
            Meta ativa: <span className="text-lg text-emerald-400 block mt-1">{profile.targetCalories} kcal / dia</span>
          </div>

          <div className="space-y-3.5 border-t border-slate-800 pt-4 text-xs font-semibold text-slate-300">
            <div className="flex justify-between">
              <span>Proteínas:</span>
              <span className="text-emerald-400 font-bold">{profile.targetProtein}g (~{profile.targetProtein * 4}kcal)</span>
            </div>
            <div className="flex justify-between">
              <span>Carboidratos:</span>
              <span className="text-blue-400 font-bold">{profile.targetCarb}g (~{profile.targetCarb * 4}kcal)</span>
            </div>
            <div className="flex justify-between">
              <span>Gorduras:</span>
              <span className="text-amber-400 font-bold">{profile.targetFat}g (~{profile.targetFat * 9}kcal)</span>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl flex items-start gap-1.5 text-3xs text-slate-400 leading-normal">
            <Info className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>As proporções de macros seguem as diretrizes da Organização Mundial de Saúde (OMS) adaptadas para os seus objetivos específicos no FitTrack.</span>
          </div>
        </div>

        {/* FACTORY RESET CARD */}
        <div className="bg-rose-50 border border-rose-200/60 rounded-3xl p-6" id="factory-reset-card">
          <div className="flex items-center gap-2 text-rose-800 mb-3">
            <ShieldAlert className="w-5 h-5" />
            <h4 className="font-extrabold text-sm uppercase tracking-wider">Perigo / Limpeza de Dados</h4>
          </div>

          <p className="text-rose-950/75 text-2xs leading-relaxed mb-4">
            Esta ação é irreversível. Ao realizar a limpeza, todas as suas calorias salvas, histórico de exercícios, peso corporal e preferências de IA serão removidos do seu navegador local.
          </p>

          <button
            type="button"
            id="factory-reset-button"
            onClick={handleResetDataClick}
            className={`w-full py-2.5 px-4 font-black text-2xs uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 border ${
              isConfirmingReset 
                ? "bg-rose-600 hover:bg-rose-700 text-white border-transparent animate-pulse" 
                : "bg-white hover:bg-rose-100 text-rose-700 border-rose-200"
            }`}
          >
            {isConfirmingReset ? "⚠️ Clique de novo para CONFIRMAR" : "Erase All Database Local State"}
          </button>
          
          {isConfirmingReset && (
            <button 
              id="cancel-reset-button"
              onClick={() => setIsConfirmingReset(false)}
              className="w-full text-center text-3xs font-extrabold mt-2.5 uppercase tracking-wider text-gray-500 hover:text-gray-900 cursor-pointer"
            >
              Cancelar Operação
            </button>
          )}

        </div>

        {/* Motivational Greeting */}
        <div className="bg-emerald-50 rounded-3xl p-6 text-center shadow-2xs border border-emerald-100">
          <Smile className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
          <h5 className="font-bold text-gray-900 text-sm">Pronto para Alcançar Suas Metas?</h5>
          <p className="text-gray-500 text-3xs mt-1 leading-normal max-w-xs mx-auto">
            "Sua consistência dita seus resultados. Registre todos os seus treinos e refeições diariamente e assista a sua progressão."
          </p>
        </div>

      </div>

    </div>
  );
}
