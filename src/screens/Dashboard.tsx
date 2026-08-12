import { motion } from 'framer-motion';
import {
  Activity,
  Droplet,
  Flame,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UtensilsCrossed,
} from 'lucide-react';

import {
  Bar,
  BarChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BiometricDeltaCard } from '../components/dashboard/BiometricDeltaCard';
import { BiometricInsight } from '../components/dashboard/BiometricInsight';
import { DailyBriefing } from '../components/dashboard/DailyBriefing';
import { ReadinessGauge } from '../components/dashboard/ReadinessGauge';
import { TrendDashboardSection } from '../components/dashboard/TrendDashboardSection';
import { InjuryRiskPanel } from '../components/injury/InjuryRiskPanel';
import { P2PSyncModal } from '../components/social/P2PSyncModal';
import { EmptyState } from '../components/ui/EmptyState';
import { StaggerList } from '../components/ui/MotionComponents';
import { ProactiveMessageCard } from '../components/ai/ProactiveMessage';
import { useDashboardData } from '../hooks/useDashboardData';

export default function Dashboard({
  history = [],
  onStartWorkout,
  onNavigateToPlanner,
}: { history?: any[]; onStartWorkout?: any; onNavigateToPlanner?: () => void }) {
  const data = useDashboardData(history);
  
  // Destructure needed values
  const {
    showP2P,
    setShowP2P,
    isSystemEmpty,
    lastReport,
    urgentMessages,
    plannedWorkoutToday,
    getWorkoutsForDate,
    currentPlan,
    healthKitData,
    dailyAdjustment,
    isHealthSyncing,
    remainingCalories,
    calorieProgressPercent,
    caloriesConsumed,
    targetCal,
    caloriesBurned,
    proteinsConsumed,
    profile,
    carbsConsumed,
    fatsConsumed,
    todayWater,
    waterTarget,
    waterProgressPercent,
    addWater,
    handleWeightSubmit,
    quickWeight,
    setQuickWeight,
    chartDataCal,
    chartDataWeight,
    acwr,
  } = data;

  // --- STYLES INLINE (V7 Dark Neon Pattern) ---
  const glassCardStyle = {
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between',
  };

  const textMuted = {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '0.85rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
  };
  const accentNeon = '#ccff00';
  const successNeon = '#00ff88';
  const blueNeon = '#00d4ff';

  return (
    <div style={{ paddingBottom: '100px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {showP2P && <P2PSyncModal onClose={() => setShowP2P(false)} />}

      {/* EMPTY STATE: Quando não há dados */}
      {isSystemEmpty && (
        <EmptyState
          icon="🎯"
          title="CENTRAL DE COMANDO"
          description="O teu painel analítico ativa-se ao registares o primeiro treino ou refeição. Começa agora e vê a tua evolução ganhar forma."
          actionLabel="REGISTAR TREINO"
          onAction={() => onStartWorkout?.('OPEN_FREE_BUILDER')}
          secondaryLabel="REGISTAR REFEIÇÃO"
          onSecondary={() =>
            window.dispatchEvent(new CustomEvent('NAVIGATE_TO', { detail: 'nutrition' }))
          }
        />
      )}

      {/* HEADER TÁTICO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1
            style={{
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: '2.5rem',
              color: accentNeon,
              margin: 0,
              letterSpacing: '2px',
            }}
          >
            CENTRAL DE COMANDO
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: '0.85rem' }}>
            Visão Biológica e Mecânica Integrada
          </p>
        </div>
        <button
          onClick={() => setShowP2P(true)}
          style={{
            background: 'transparent',
            border: `1px solid ${accentNeon}`,
            color: accentNeon,
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: '1rem',
            letterSpacing: '1px',
          }}
        >
          Sync P2P
        </button>
      </div>

      {lastReport && (
        <div style={{ marginBottom: '4px' }}>
          <InjuryRiskPanel report={lastReport} compact />
        </div>
      )}

      {urgentMessages.length > 0 && (
        <div className="space-y-2 mt-2 mb-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest pl-1">
            Coach Proativo
          </h3>
          {urgentMessages.slice(0, 2).map((msg) => (
            <ProactiveMessageCard key={msg.id} message={msg} compact />
          ))}
        </div>
      )}

      {/* WALKING COACH BANNER */}
      <button
        onClick={() =>
          window.dispatchEvent(new CustomEvent('NAVIGATE_TO', { detail: 'walkingcoach' }))
        }
        style={{
          width: '100%',
          padding: '16px',
          borderRadius: '16px',
          border: '1px solid rgba(0, 255, 136, 0.3)',
          background: 'linear-gradient(90deg, rgba(0,255,136,0.15) 0%, rgba(0,0,0,0) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(0, 255, 136, 0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '24px' }}>🏃‍♂️</div>
          <div style={{ textAlign: 'left' }}>
            <div
              style={{
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: '1.2rem',
                color: '#00ff88',
                letterSpacing: '1px',
              }}
            >
              Radar de Caminhada
            </div>
            <div
              style={{
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.5)',
                textTransform: 'uppercase',
                fontWeight: 'bold',
              }}
            >
              Treinador GPS com Voz • Ganha XP
            </div>
          </div>
        </div>
        <div style={{ color: '#00ff88', fontSize: '20px' }}>{'❯'}</div>
      </button>

      {/* 🚀 WIDGET DAILY BRIEFING 🚀 */}
      {/* 🚀 WIDGET DAILY BRIEFING 🚀 */}
      {!isSystemEmpty && (
        <DailyBriefing
          history={history}
          plannedWorkoutToday={plannedWorkoutToday}
          onStartPlannedWorkout={() => {
            if (plannedWorkoutToday) {
              const slotData = getWorkoutsForDate(plannedWorkoutToday.date)?.[
                plannedWorkoutToday.slot
              ];
              if (slotData) {
                let exercisesList: string[] = [];
                if (currentPlan && typeof currentPlan !== 'string') {
                  const rawDayPlan = currentPlan.workouts.find((w: any) =>
                    slotData.workoutName.includes(w.focus),
                  );
                  if (rawDayPlan) exercisesList = rawDayPlan.exercises;
                }
                onStartWorkout({
                  id: `day_${slotData.id}`,
                  label: slotData.workoutName,
                  exercises: exercisesList,
                });
              }
            }
          }}
          onStartFreeWorkout={() => onStartWorkout?.('OPEN_FREE_BUILDER')}
          onNavigateToPlanner={
            onNavigateToPlanner || (() => window.dispatchEvent(new CustomEvent('OPEN_WEEKLY_PLAN')))
          }
        />
      )}
      {/* 📡 TELEMETRIA BIOLÓGICA — HealthKit (RENPHO + Apple Watch) 📡 */}
      <BiometricInsight
        healthData={healthKitData as any}
        adjustment={dailyAdjustment}
        isSyncing={isHealthSyncing}
      />

      {/* 🧬 BIOIMPEDÂNCIA (Métricas Expandidas da RENPHO) 🧬 */}
      <BiometricDeltaCard healthData={healthKitData as any} isLoading={isHealthSyncing} />

      <StaggerList>
        {/* ROW 1: RESUMO DIÁRIO */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
          }}
        >
          {/* Calorie Card */}
          <div style={glassCardStyle}>
            <div>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}
              >
                <span style={textMuted}>Balanço do Dia</span>
                <Flame size={20} color={accentNeon} />
              </div>
              <div style={{ textAlign: 'center', margin: '24px 0' }}>
                <div style={{ fontSize: '3.5rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                  {remainingCalories}
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'rgba(255,255,255,0.4)',
                    textTransform: 'uppercase',
                    marginTop: '8px',
                    letterSpacing: '1px',
                  }}
                >
                  Kcal Restantes
                </div>
              </div>
              <div style={{ marginTop: '16px' }}>
                <div
                  style={{
                    height: '8px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${calorieProgressPercent}%`,
                      background: accentNeon,
                      boxShadow: `0 0 10px ${accentNeon}`,
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    color: 'rgba(255,255,255,0.5)',
                    marginTop: '8px',
                  }}
                >
                  <span>Consumo: {caloriesConsumed} kcal</span>
                  <span>Meta: {targetCal} kcal</span>
                </div>
              </div>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                paddingTop: '16px',
                marginTop: '24px',
                textAlign: 'center',
              }}
            >
              <div style={{ borderRight: '1px solid rgba(255,255,255,0.08)' }}>
                <div
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    color: successNeon,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  <UtensilsCrossed size={16} /> {caloriesConsumed}
                </div>
                <span
                  style={{
                    fontSize: '0.65rem',
                    color: 'rgba(255,255,255,0.4)',
                    textTransform: 'uppercase',
                  }}
                >
                  Refeições
                </span>
              </div>
              <div>
                <div
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    color: accentNeon,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  <Activity size={16} /> {caloriesBurned}
                </div>
                <span
                  style={{
                    fontSize: '0.65rem',
                    color: 'rgba(255,255,255,0.4)',
                    textTransform: 'uppercase',
                  }}
                >
                  Treino
                </span>
              </div>
            </div>
          </div>

          {/* Macros Card */}
          <div style={glassCardStyle}>
            <div>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}
              >
                <span style={textMuted}>Macronutrientes</span>
                <Sparkles size={20} color={successNeon} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <MacroBar
                  label="Proteínas"
                  current={proteinsConsumed}
                  target={profile.targetProtein || 140}
                  color={successNeon}
                />
                <MacroBar
                  label="Carboidratos"
                  current={carbsConsumed}
                  target={profile.targetCarb || 270}
                  color={blueNeon}
                />
                <MacroBar
                  label="Gorduras"
                  current={fatsConsumed}
                  target={profile.targetFat || 68}
                  color="#ffaa00"
                />
              </div>
            </div>
          </div>

          {/* Hydration Card */}
          <div style={glassCardStyle}>
            <div>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}
              >
                <span style={textMuted}>Hidratação</span>
                <Droplet size={20} color={blueNeon} />
              </div>
              <div style={{ textAlign: 'center', margin: '24px 0' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: blueNeon }}>
                  {todayWater} ml
                </div>
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: 'rgba(255,255,255,0.4)',
                    textTransform: 'uppercase',
                    marginTop: '4px',
                  }}
                >
                  Meta: {waterTarget} ml
                </div>
              </div>
              <div
                style={{
                  height: '8px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  marginBottom: '24px',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${waterProgressPercent}%`,
                    background: blueNeon,
                    boxShadow: `0 0 10px ${blueNeon}`,
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                {[250, 500, 1000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => addWater(amt)}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      padding: '12px 0',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '0.8rem',
                    }}
                  >
                    +{amt >= 1000 ? '1L' : amt + 'ml'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ROW 2: GRÁFICOS (RECHARTS DARK NEON) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '24px',
          }}
        >
          <div style={{ ...glassCardStyle, gridColumn: 'span 2' }}>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}
            >
              <TrendingUp size={20} color={accentNeon} />
              <h3 style={{ color: '#fff', fontSize: '1.2rem', margin: 0 }}>
                Balanço Calórico (7 Dias)
              </h3>
            </div>
            <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataCal} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <XAxis dataKey="name" stroke="#55626e" fontSize={11} tickLine={false} />
                  <YAxis stroke="#55626e" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#080b0f',
                      borderRadius: '12px',
                      borderColor: accentNeon,
                      color: '#fff',
                    }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#fff' }} />
                  <Bar dataKey="Consumidas" fill={successNeon} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Gastas" fill={accentNeon} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={glassCardStyle}>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}
            >
              <TrendingDown size={20} color={blueNeon} />
              <h3 style={{ color: '#fff', fontSize: '1.2rem', margin: 0 }}>Evolução do Peso</h3>
            </div>
            <form
              onSubmit={handleWeightSubmit}
              style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}
            >
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Novo peso"
                  value={quickWeight}
                  onChange={(e) => setQuickWeight(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 40px 12px 12px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    boxSizing: 'border-box',
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'rgba(255,255,255,0.3)',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                  }}
                >
                  KG
                </span>
              </div>
              <button
                type="submit"
                style={{
                  padding: '0 16px',
                  background: blueNeon,
                  color: '#000',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  fontSize: '0.8rem',
                }}
              >
                Salvar
              </button>
            </form>
            <div style={{ height: '200px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartDataWeight}
                  margin={{ top: 5, right: 15, left: -25, bottom: 5 }}
                >
                  <XAxis dataKey="name" stroke="#55626e" fontSize={10} tickLine={false} />
                  <YAxis
                    stroke="#55626e"
                    fontSize={10}
                    domain={['dataMin - 2', 'dataMax + 2']}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#080b0f',
                      borderRadius: '10px',
                      borderColor: blueNeon,
                      color: '#fff',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="peso"
                    stroke={blueNeon}
                    strokeWidth={3}
                    dot={{ fill: blueNeon, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ROW 3: MOTOR DE LESÕES & ACWR */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
          }}
        >
          <div style={{ ...glassCardStyle, alignItems: 'center', justifyContent: 'center' }}>
            <h3
              style={{
                color: '#fff',
                fontSize: '1.2rem',
                margin: '0 0 16px 0',
                alignSelf: 'flex-start',
              }}
            >
              RADAR DE PRONTIDÃO (ACWR)
            </h3>
            <ReadinessGauge acwr={acwr} />
            <p
              style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.4)',
                textAlign: 'center',
                marginTop: 16,
              }}
            >
              Rácio entre a carga dos últimos 7 dias (Aguda) e a média das últimas 4 semanas
              (Crónica).
            </p>
          </div>
          <div>
            <TrendDashboardSection
              recentExercises={
                history
                  ?.flatMap((w) => w.exercises?.map((e: any) => e.name))
                  .filter((name: string) => name && !name.includes('Caminhada')) || []
              }
            />
          </div>
        </div>
      </StaggerList>

      {/* FLOATING ACTION BUTTON (FAB) PARA INICIAR TREINO LIVRE */}
      {!isSystemEmpty && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onStartWorkout?.('OPEN_FREE_BUILDER')}
          style={{
            position: 'fixed',
            bottom: '100px',
            right: '24px',
            background: `linear-gradient(135deg, ${accentNeon}, #d4a017)`,
            color: '#000',
            border: 'none',
            borderRadius: '50px',
            padding: '16px 24px',
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: '1.2rem',
            letterSpacing: '1px',
            cursor: 'pointer',
            boxShadow: `0 4px 20px rgba(232,200,74,0.4)`,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 50,
          }}
        >
          <Flame size={20} color="#000" />
          TREINAR AGORA
        </motion.button>
      )}
    </div>
  );
}

// Componente Auxiliar Privado
const MacroBar = ({
  label,
  current,
  target,
  color,
}: { label: string; current: number; target: number; color: string }) => {
  const percent = Math.min(100, Math.round((current / target) * 100));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          fontWeight: 'bold',
        }}
      >
        <span style={{ color: 'rgba(255,255,255,0.7)' }}>{label}</span>
        <span style={{ color: 'rgba(255,255,255,0.4)' }}>
          {current}g / <span style={{ color }}>{target}g</span>
        </span>
      </div>
      <div
        style={{
          height: '8px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${percent}%`,
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}`,
            transition: 'width 0.5s ease',
          }}
        />
      </div>
    </div>
  );
};
