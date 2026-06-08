import React from "react";
import { motion } from "framer-motion";
import { C, GOALS, WORKOUT_PLANS } from "../data/constants";
import { NextWorkoutSuggestion } from "../components/workout/NextWorkoutSuggestion";
import { useChallenges } from "../hooks/useChallenges";
import { ActiveChallenges } from "../components/challenges/ActiveChallenges";
import { WeekCalendar } from "../components/dashboard/WeekCalendar";
import { RecoveryRing } from '../components/stats/RecoveryRing';
import { RecoveryRoulette } from '../components/dashboard/RecoveryRoulette';
import { ActivityHeatmap } from '../components/dashboard/ActivityHeatmap';
import { TrendWidget } from '../components/dashboard/TrendWidget';
import { TrendDashboardSection } from '../components/dashboard/TrendDashboardSection';
import { CycleTracker } from '../components/dashboard/CycleTracker';
import { VirtualPet } from '../components/dashboard/VirtualPet';
import { NeuralFatigue } from "../services/neuralFatigue";
import { calculateRecovery } from "../data/utils";
import { AnthropicService } from "../services/anthropicService";
import { GymVibeWidget } from "../components/social/GymVibeWidget";
import { WeeklyPlanGenerator } from "../components/workout/WeeklyPlanGenerator";
import { usePlanStore } from "../stores/usePlanStore";
import { GlobalBackground } from "../components/ui/GlobalBackground";
import { GlassCard } from "../components/ui/GlassCard";
import { GradientButton } from "../components/ui/GradientButton";
import { WatchSyncIndicator } from "../components/WatchSyncIndicator";
import { PhaseCard } from '../components/dashboard/PhaseCard';
import { FitnessAssessment } from '../components/onboarding/FitnessAssessment';
import { DemographicEngine } from '../services/demographicEngine';

export default function Dashboard({ profile, setProfile, history, onStartWorkout }: any) {
  const [showAssessment, setShowAssessment] = React.useState(!profile?.anamnesis);
  const { challenges, setChallenges } = useChallenges(history);
  
  const goal = GOALS.find(g => g.id === profile.goal);
  const level = Math.floor((profile.xp || 0) / 1000) + 1;
  const xp = (profile.xp || 0) % 1000;
  const progressPct = (xp / 1000) * 100;
  
  const currentPlan = usePlanStore((s) => s.currentPlan);

  const readiness = NeuralFatigue.calculateReadiness(history);
  const recoveryData = calculateRecovery(history, profile.goal);

  // Perfil demográfico
  const demographicProfile = DemographicEngine.getProfileType(
    profile.age || 30,
    profile.gender || 'other',
    profile.wantsCycleSyncing || false
  );
  const demoFeatures = DemographicEngine.getFeatures(demographicProfile);

  const [isGenerating, setIsGenerating] = React.useState(false);
  const [forgivenessAlert, setForgivenessAlert] = React.useState<{forgiven: boolean, remainingMinutes: number} | null>(null);
  const [aiReportModal, setAiReportModal] = React.useState<{reasoning: string, workout: any} | null>(null);
  const [showWeeklyPlan, setShowWeeklyPlan] = React.useState(false);

  React.useEffect(() => {
     if (history.length === 0) return;
     const lastWorkoutDateObj = new Date(history[0].date);
     const lastWorkout = lastWorkoutDateObj.toISOString().split('T')[0];
     const today = new Date().toISOString().split('T')[0];

     if (lastWorkout !== today) {
         const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
         if (lastWorkout !== yesterday && lastWorkoutDateObj.getTime() > Date.now() - 48 * 60 * 60 * 1000) {
             const now = new Date();
             const hoursSinceMidnight = now.getHours() + now.getMinutes() / 60;
             if (hoursSinceMidnight < 6) {
                 setForgivenessAlert({ forgiven: true, remainingMinutes: Math.floor((6 - hoursSinceMidnight) * 60) });
             }
         }
     }

     const handleOpenWeeklyPlan = () => setShowWeeklyPlan(true);
     window.addEventListener('OPEN_WEEKLY_PLAN', handleOpenWeeklyPlan);
     return () => window.removeEventListener('OPEN_WEEKLY_PLAN', handleOpenWeeklyPlan);
  }, [history]);

  const recentTopExercises = React.useMemo(() => {
    const freq = new Map();
    history.forEach((w: any) => {
      w.exercises.forEach((ex: any) => freq.set(ex.name, (freq.get(ex.name) || 0) + 1));
    });
    return Array.from(freq.entries()).sort((a: any, b: any) => b[1] - a[1]).slice(0, 6).map(([name]) => name);
  }, [history]);

  const handleAIGeneration = async () => {
    if (history.length < 3) {
      alert("🔒 A Inteligência Artificial precisa de conhecer-te! Completa mais " + (3 - history.length) + " treinos para analisarmos a tua fadiga.");
      return;
    }
    
    setIsGenerating(true);
    const generatedData = await AnthropicService.generateWorkout(profile, recoveryData, history);
    setIsGenerating(false);
    
    if (generatedData && generatedData.exercises && generatedData.reasoning) {
        setAiReportModal({ reasoning: generatedData.reasoning, workout: generatedData.exercises });
    } else if (generatedData) {
        // Fallback p/ versão antiga
        onStartWorkout(generatedData.exercises || generatedData);
    }
  };

  const acceptAIWorkout = () => {
     if (aiReportModal) onStartWorkout(aiReportModal.workout);
     setAiReportModal(null);
  };

  const handleChallengeComplete = (id: string) => {
      const updated = challenges.map(c => {
          if (c.id === id) {
              setProfile((p: any) => ({ ...p, xp: (p.xp || 0) + c.xpReward }));
              return { ...c, status: 'completed' as const };
          }
          return c;
      });
      setChallenges(updated);
  };

  if (showAssessment) {
    return <FitnessAssessment onComplete={(data: any) => { setProfile({ ...profile, ...data }); setShowAssessment(false); }} />;
  }

  return (
    <GlobalBackground>
    <div style={{ padding: "18px", maxWidth: 480, margin: "0 auto", position: 'relative', zIndex: 10 }}>
      
      {forgivenessAlert && (
         <GlassCard glow style={{ padding: 12, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, borderLeft: `4px solid ${C.accent}` }}>
            <span style={{ fontSize: 24 }}>🚑</span>
            <div>
               <p style={{ fontFamily: "'Bebas Neue'", color: C.accent, fontSize: 16, margin: 0 }}>STREAK EM PERIGO!</p>
               <p style={{ fontSize: 11, color: '#fff', margin: 0 }}>Ontem não treinaste, mas tens {forgivenessAlert.remainingMinutes} min para salvar o Streak antes das 6 AM!</p>
            </div>
         </GlassCard>
      )}

      {aiReportModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(8,11,15,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 24, backdropFilter: 'blur(10px)' }}>
          <GlassCard glow style={{ padding: 26, maxWidth: 360, width: "100%" }}>
            <p style={{ fontFamily: "'Bebas Neue'", fontSize: 24, letterSpacing: 2, marginBottom: 8, color: C.accent }}>✨ ANÁLISE CLAUDE 3.5</p>
            <p style={{ color: '#fff', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>{aiReportModal.reasoning}</p>
            <div style={{ display: "flex", gap: 10 }}>
              <GradientButton variant="secondary" onClick={() => setAiReportModal(null)} style={{ flex: 1 }}>CANCELAR</GradientButton>
              <GradientButton variant="primary" onClick={acceptAIWorkout} style={{ flex: 1 }}>ACEITAR TREINO</GradientButton>
            </div>
          </GlassCard>
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p className="mono small" style={{ marginBottom: 2, color: C.muted }}>OLÁ, ATLETA</p>
          <p style={{ fontFamily: "'Bebas Neue'", fontSize: 36, letterSpacing: 2, lineHeight: 1, color: C.accent }}>{profile.name.toUpperCase()}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 12, background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: 12 }}>{goal?.icon} {goal?.label}</span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ background: C.accentLow, color: C.accent, borderRadius: 12, padding: "6px 12px", fontSize: 14, fontWeight: "bold", display: "inline-block", border: `1px solid ${C.accent}44` }}>
            Lvl {level}
          </div>
        </div>
      </motion.div>

      <PhaseCard history={history} profile={profile} />

      <GymVibeWidget onOpenVibe={() => window.dispatchEvent(new CustomEvent('NAVIGATE_TO', { detail: 'gymvibe' }))} />
      
      <WatchSyncIndicator />

      <WeekCalendar history={history} />
      
      <ActivityHeatmap history={history} />
      
      <TrendWidget history={history} />

      <TrendDashboardSection 
        recentExercises={recentTopExercises} 
        maxItems={4} 
      />

      {/* Cycle Tracker - só para perfil female_cycle_synced */}
      {demoFeatures.showCycleTracker && <CycleTracker />}

      {/* Virtual Pet - só para crianças (youth_gamified) */}
      {demographicProfile === 'youth_gamified' && <VirtualPet xp={profile.xp || 0} />}
      
      {history.length >= 3 ? (
        <RecoveryRoulette />
      ) : (
        <div style={{ background: `${C.surface}88`, borderRadius: 12, padding: 24, border: '1px dashed #333', textAlign: 'center', marginBottom: 20 }}>
           <span style={{ fontSize: 24, opacity: 0.5 }}>🎰</span>
           <p style={{ fontSize: 13, color: '#666', marginTop: 8, fontWeight: 'bold' }}>A Roleta de Recuperação Mágica desbloqueia ao 3º Treino!</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <GlassCard style={{ padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.muted, marginBottom: 8, fontWeight: 600 }}>
            <span>XP PARA LEVEL UP</span>
            <span className="mono" style={{ color: C.accent }}>{xp} / 1000</span>
            </div>
            <div style={{ width: "100%", height: 6, background: 'rgba(0,0,0,0.5)', borderRadius: 3, overflow: "hidden", border: '1px solid rgba(255,255,255,0.05)' }}>
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                style={{ height: "100%", background: 'linear-gradient(90deg, #e8c84a, #fceb9c)', borderRadius: 3 }}
            />
            </div>
        </GlassCard>

        <GlassCard glow style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
             <div style={{ position: 'relative', width: 44, height: 44 }}>
               <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 100 100">
                 <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                 <circle cx="50" cy="50" r="42" fill="none" stroke={readiness.color} strokeWidth="8"
                   strokeDasharray={`${(readiness.score / 100) * 264} 264`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease-out' }} />
               </svg>
               <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 'bold', color: readiness.color }}>
                 {readiness.score}
               </div>
             </div>
             <div>
                 <span style={{ fontSize: 10, color: C.muted, fontWeight: 'bold', display: 'block', letterSpacing: 1 }}>READINESS</span>
                 <span style={{ fontSize: 11, color: readiness.color, lineHeight: 1.2 }}>{readiness.label}</span>
             </div>
        </GlassCard>
      </div>

      <div style={{ marginBottom: 20 }}>
          <RecoveryRing recoveryData={recoveryData} />
      </div>

      <ActiveChallenges challenges={challenges} onChallengeComplete={handleChallengeComplete} />

      <div style={{ marginBottom: 20, display: "flex", gap: 10 }}>
          <GradientButton variant="primary" onClick={() => setShowWeeklyPlan(true)} style={{ flex: 1, padding: 16, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, fontSize: 16 }}>
              📅 PLANO IA
          </GradientButton>
          <GradientButton variant="secondary" onClick={() => window.dispatchEvent(new CustomEvent('NAVIGATE_TO', { detail: 'cyclereview' }))} style={{ flex: 1, padding: 16, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, fontSize: 16 }}>
              📊 REVISÃO
          </GradientButton>
      </div>

      <div style={{ marginBottom: 20 }}>
          <GradientButton variant="secondary" onClick={() => onStartWorkout('OPEN_FREE_BUILDER')} style={{ width: "100%", padding: 16, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, fontSize: 16, border: `1px solid rgba(232, 200, 74, 0.3)` }}>
              ⚡ TREINO LIVRE (CONSTRUTOR)
          </GradientButton>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <p style={{ fontFamily: "'Bebas Neue'", fontSize: 18, letterSpacing: 2, color: C.muted }}>TREINO DE HOJE</p>
        <button onClick={handleAIGeneration} disabled={isGenerating} style={{ background: "linear-gradient(135deg, #e8c84a, #d4b83a)", color: "#000", border: "none", borderRadius: 8, padding: "6px 12px", fontFamily: "'Bebas Neue'", fontSize: 14, cursor: isGenerating ? "wait" : "pointer", display: "flex", alignItems: "center", gap: 6, opacity: isGenerating ? 0.7 : 1, boxShadow: '0 0 10px rgba(232,200,74,0.3)' }}>
            {isGenerating ? "AGUARDA..." : "✨ GERAR AI"}
        </button>
      </div>

      {currentPlan && (
        <div style={{ marginBottom: 12, padding: "8px 12px", background: `${C.accent}11`, borderLeft: `4px solid ${C.accent}`, borderRadius: 4 }}>
          <p style={{ fontSize: 11, color: C.accent, fontWeight: "bold", margin: 0 }}>PLANO ATIVO: {currentPlan.name}</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        {currentPlan ? (
          currentPlan.workouts.map((dayPlan, i) => {
            const isRest = dayPlan.focus.toLowerCase().includes("descanso") || dayPlan.focus.toLowerCase().includes("recupera");
            return (
              <GlassCard key={i} style={{ padding: "16px", opacity: isRest ? 0.6 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <h3 style={{ fontSize: 18, color: C.text, fontFamily: "'Bebas Neue'", letterSpacing: 1 }}>{dayPlan.day} <span style={{ fontSize: 14, color: C.accent, fontFamily: 'Outfit', letterSpacing: 0 }}>({dayPlan.focus})</span></h3>
                </div>
                <p style={{ color: C.muted, fontSize: 13, marginBottom: isRest ? 0 : 16 }}>{dayPlan.exercises.join(" · ")}</p>
                {!isRest && (
                  <GradientButton 
                    variant="secondary"
                    onClick={() => onStartWorkout({ id: `ai_day_${Date.now()}`, label: `${dayPlan.day} - ${dayPlan.focus}`, exercises: dayPlan.exercises })} 
                    style={{ width: "100%", border: `1px solid rgba(232,200,74,0.3)` }}
                  >
                    <span style={{ color: C.accent }}>INICIAR ESTE TREINO</span>
                  </GradientButton>
                )}
              </GlassCard>
            )
          })
        ) : (
          WORKOUT_PLANS.map((plan, i) => (
            <GlassCard key={plan.id} style={{ padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <h3 style={{ fontSize: 18, color: C.text, fontFamily: "'Bebas Neue'", letterSpacing: 1 }}>{plan.label}</h3>
              </div>
              <p style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>{plan.exercises.join(" · ")}</p>
              <GradientButton variant="secondary" onClick={() => onStartWorkout(plan)} style={{ width: "100%", border: `1px solid rgba(232,200,74,0.3)` }}>
                <span style={{ color: C.accent }}>INICIAR ESTE TREINO</span>
              </GradientButton>
            </GlassCard>
          ))
        )}
      </div>
      <NextWorkoutSuggestion
        history={history}
        profile={profile}
        onStartWorkout={onStartWorkout}
      />
      {showWeeklyPlan && (
          <WeeklyPlanGenerator profile={profile} setProfile={setProfile} onStartWorkout={onStartWorkout} onClose={() => setShowWeeklyPlan(false)} />
      )}
    </div>
    </GlobalBackground>
  );
}
