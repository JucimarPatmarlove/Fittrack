import { Check, Share2 } from 'lucide-react';
// @ts-nocheck
import { useState } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { estimateCaloriesBurned } from '../../services/fitnessMechanics';
import { useCommunityStore } from '../../stores/useCommunityStore';
import { MuscleHeatmap } from '../stats/MuscleHeatmap';

const MetricCard = ({ title, value }: { title: string; value: string | number }) => (
  <div className="glass" style={{ padding: '16px 8px', textAlign: 'center' }}>
    <div
      style={{
        color: '#e8c84a',
        fontSize: 28,
        fontWeight: 'bold',
        fontFamily: "'Bebas Neue'",
        letterSpacing: 1,
      }}
    >
      {value}
    </div>
    <div
      style={{
        color: '#55626e',
        fontSize: 10,
        fontFamily: "'DM Mono'",
        letterSpacing: 1,
        marginTop: 4,
      }}
    >
      {title}
    </div>
  </div>
);

export const DetailedHistory = ({
  workouts,
  profile,
  onStartWorkout,
}: { workouts: any[]; profile?: any; onStartWorkout?: (plan: any) => void }) => {
  const [selectedMetric, setSelectedMetric] = useState<'volume' | 'duration'>('volume');
  const { addPost } = useCommunityStore();
  const [sharedIds, setSharedIds] = useState<Set<string>>(new Set());

  const handleShare = (w: any) => {
    const isWalk =
      w.name?.toLowerCase().includes('caminhada') ||
      w.dayLabel?.toLowerCase().includes('caminhada');
    addPost({
      userId: profile?.id || 'me',
      userName: profile?.name || 'Eu',
      avatarInitials: (profile?.name || 'Eu').substring(0, 2).toUpperCase(),
      workoutName: w.name || w.dayLabel || 'Treino',
      durationMinutes: Math.floor((w.duration || w.durationSeconds || 0) / 60),
      metrics: {
        volume: w.totalVolume || 0,
        calories: w.calories || estimateCaloriesBurned(w, profile || { weight: 70 }),
        distanceKm: isWalk
          ? w.distance || w.exercises?.[0]?.sets?.[0]?.reps / 1000 || 0
          : undefined,
      },
      isWalkingCoach: isWalk,
    });
    setSharedIds((prev) => new Set(prev).add(w.id || w.date));
  };

  if (!workouts || workouts.length === 0) {
    return (
      <div style={{ padding: '60px 18px', textAlign: 'center' }}>
        <p style={{ fontFamily: "'Bebas Neue'", fontSize: 26, color: '#1e2832', letterSpacing: 2 }}>
          SEM HISTÓRICO
        </p>
        <p style={{ color: '#55626e', marginTop: 8, fontSize: 13 }}>
          Inicia o teu primeiro treino para veres os gráficos!
        </p>
      </div>
    );
  }

  const chartData = workouts
    .map((w) => ({
      name: new Date(w.date).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' }),
      value: selectedMetric === 'volume' ? w.totalVolume : Math.floor(w.duration / 60),
      treino: w.dayLabel,
    }))
    .slice(-10);

  const btnStyle = (active: boolean) => ({
    background: active ? '#e8c84a22' : 'transparent',
    color: active ? '#e8c84a' : '#55626e',
    border: `1px solid ${active ? '#e8c84a' : '#1e2832'}`,
    padding: '6px 12px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    fontFamily: "'Barlow'",
    fontWeight: 600,
  });

  return (
    <div style={{ padding: '18px', maxWidth: 480, margin: '0 auto', paddingBottom: 80 }}>
      <h2
        style={{
          color: '#e8c84a',
          fontFamily: "'Bebas Neue'",
          fontSize: 28,
          letterSpacing: 2,
          marginBottom: 20,
        }}
      >
        📊 PROGRESSO DETALHADO
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 10,
          marginBottom: 24,
        }}
      >
        <MetricCard title="TREINOS" value={workouts.length} />
        <MetricCard
          title="VOLUME (T)"
          value={`${(workouts.reduce((sum, w) => sum + w.totalVolume, 0) / 1000).toFixed(1)}t`}
        />
        <MetricCard
          title="CALORIAS 🔥"
          value={workouts.reduce(
            (sum, w) => sum + (w.calories || estimateCaloriesBurned(w, profile || { weight: 70 })),
            0,
          )}
        />
      </div>

      <MuscleHeatmap workouts={workouts} />

      <div className="glass" style={{ padding: 16, marginBottom: 24, marginTop: 24 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <button
            onClick={() => setSelectedMetric('volume')}
            style={btnStyle(selectedMetric === 'volume')}
          >
            Volume (kg)
          </button>
          <button
            onClick={() => setSelectedMetric('duration')}
            style={btnStyle(selectedMetric === 'duration')}
          >
            Duração (min)
          </button>
        </div>

        <div style={{ width: '100%', height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis
                dataKey="name"
                stroke="#55626e"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis stroke="#55626e" fontSize={10} tickLine={false} axisLine={false} width={40} />
              <Tooltip
                contentStyle={{
                  background: '#080b0f',
                  border: '1px solid #e8c84a',
                  borderRadius: 8,
                  color: '#eceae4',
                }}
                itemStyle={{ color: '#e8c84a' }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#e8c84a"
                strokeWidth={3}
                dot={{ fill: '#080b0f', stroke: '#e8c84a', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <h3
        style={{
          color: '#eceae4',
          fontFamily: "'Bebas Neue'",
          fontSize: 22,
          letterSpacing: 1,
          marginBottom: 16,
        }}
      >
        🕒 TREINOS RECENTES
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[...workouts]
          .reverse()
          .slice(0, 5)
          .map((w, idx) => (
            <div
              key={idx}
              className="glass"
              style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div>
                  <div style={{ color: '#e8c84a', fontWeight: 'bold', fontSize: 16 }}>
                    {w.dayLabel}
                  </div>
                  <div style={{ color: '#55626e', fontSize: 12, marginTop: 4 }}>
                    {new Date(w.date).toLocaleDateString('pt-PT', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#eceae4', fontSize: 14, fontWeight: 'bold' }}>
                    {w.totalVolume} kg
                  </div>
                  <div style={{ color: '#55626e', fontSize: 12 }}>
                    {Math.floor(w.duration / 60)} min
                  </div>
                </div>
              </div>
              <div style={{ color: '#eceae4', fontSize: 12, lineHeight: 1.4 }}>
                {w.exercises?.map((ex: any) => `${ex.name} (${ex.sets?.length || 0}s)`).join(', ')}
              </div>
              {onStartWorkout && (
                <button
                  onClick={() => {
                    // Reconstruir um "plan" a partir do histórico
                    const planToRestart = {
                      id: `repeat_${Date.now()}`,
                      label: `Repetição: ${w.dayLabel}`,
                      exercises: w.exercises?.map((ex: any) => ex.name) || [],
                    };
                    onStartWorkout(planToRestart);
                  }}
                  style={{
                    background: 'transparent',
                    border: '1px solid #e8c84a',
                    color: '#e8c84a',
                    padding: '8px',
                    borderRadius: 6,
                    fontFamily: "'Bebas Neue'",
                    fontSize: 16,
                    cursor: 'pointer',
                    marginTop: 4,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e8c84a';
                    e.currentTarget.style.color = '#000';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#e8c84a';
                  }}
                >
                  🔄 TREINAR NOVAMENTE
                </button>
              )}
              <button
                disabled={sharedIds.has(w.id || w.date)}
                onClick={() => handleShare(w)}
                style={{
                  background: sharedIds.has(w.id || w.date) ? 'rgba(204,255,0,0.1)' : 'transparent',
                  border: '1px solid #ccff00',
                  color: sharedIds.has(w.id || w.date) ? '#ccff00' : '#ccff00',
                  padding: '8px',
                  borderRadius: 6,
                  fontFamily: "'Bebas Neue'",
                  fontSize: 16,
                  cursor: sharedIds.has(w.id || w.date) ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                }}
              >
                {sharedIds.has(w.id || w.date) ? (
                  <>
                    <Check size={16} /> PARTILHADO NO FEED
                  </>
                ) : (
                  <>
                    <Share2 size={16} /> PARTILHAR NO FEED
                  </>
                )}
              </button>
            </div>
          ))}
      </div>
    </div>
  );
};
