import { useEffect, useState } from 'react';
import { C } from '../../data/constants';
import { EXERCISE_DB } from '../../data/exerciseDB';
import { type MetricType, useSocialStore } from '../../stores/useSocialStore';

const EXERCISE_NAMES = Object.keys(EXERCISE_DB);

const METRIC_LABELS: Record<MetricType, string> = {
  '1rm': '1RM Estimado (kg)',
  volume: 'Volume Total (kg)',
  reps: 'Repetições',
  duration: 'Duração (s)',
};

const selectStyle: React.CSSProperties = {
  background: C.dim,
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  padding: 10,
  color: '#fff',
  fontFamily: "'DM Mono'",
  fontSize: 13,
};

export const LeaderboardTab = () => {
  const { leaderboard, leaderboardLoading, fetchLeaderboard, publishPR, profile } =
    useSocialStore();
  const [exerciseName, setExerciseName] = useState(EXERCISE_NAMES[0] ?? 'Barbell Back Squat');
  const [metricType, setMetricType] = useState<MetricType>('1rm');
  const [showPublish, setShowPublish] = useState(false);
  const [publishValue, setPublishValue] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard(exerciseName, metricType);
  }, [exerciseName, metricType, fetchLeaderboard]);

  const handlePublish = async () => {
    const value = Number(publishValue);
    if (!value || value <= 0) {
      setPublishError('Introduz um valor válido.');
      return;
    }
    setPublishing(true);
    setPublishError(null);
    const unit = metricType === 'duration' ? 's' : metricType === 'reps' ? '' : 'kg';
    const { error } = await publishPR({ exerciseName, metricType, value, unit });
    setPublishing(false);
    if (error) {
      setPublishError(error);
      return;
    }
    setShowPublish(false);
    setPublishValue('');
    fetchLeaderboard(exerciseName, metricType);
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <select
          value={exerciseName}
          onChange={(e) => setExerciseName(e.target.value)}
          style={{ ...selectStyle, flex: 1.5 }}
        >
          {EXERCISE_NAMES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <select
          value={metricType}
          onChange={(e) => setMetricType(e.target.value as MetricType)}
          style={{ ...selectStyle, flex: 1 }}
        >
          {(Object.keys(METRIC_LABELS) as MetricType[]).map((m) => (
            <option key={m} value={m}>
              {METRIC_LABELS[m]}
            </option>
          ))}
        </select>
      </div>

      {leaderboardLoading ? (
        <p style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: 20 }}>
          A carregar ranking...
        </p>
      ) : leaderboard.length === 0 ? (
        <p style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: 20 }}>
          Ainda ninguém publicou marcas para este exercício. Sê o primeiro.
        </p>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            maxHeight: 280,
            overflowY: 'auto',
          }}
        >
          {leaderboard.map((entry, i) => (
            <div
              key={entry.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                background: entry.userId === profile?.id ? `${C.accent}18` : '#080b0f',
                border:
                  entry.userId === profile?.id
                    ? `1px solid ${C.accent}55`
                    : '1px solid transparent',
                borderRadius: 6,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    fontFamily: "'DM Mono'",
                    color: i < 3 ? C.accent : C.muted,
                    width: 20,
                    textAlign: 'right',
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ fontSize: 14, color: '#fff' }}>
                  {entry.displayName || entry.username}
                </span>
              </div>
              <span style={{ fontFamily: "'DM Mono'", color: C.accent, fontWeight: 'bold' }}>
                {entry.value}
                {entry.unit}
              </span>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 16, borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
        {!showPublish ? (
          <button
            onClick={() => setShowPublish(true)}
            style={{
              width: '100%',
              padding: 12,
              background: `${C.accent}22`,
              color: C.accent,
              border: `1px solid ${C.accent}55`,
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: 13,
            }}
          >
            🏆 PUBLICAR O MEU PR
          </button>
        ) : (
          <div>
            <p style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>
              {exerciseName} — {METRIC_LABELS[metricType]}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="number"
                value={publishValue}
                onChange={(e) => setPublishValue(e.target.value)}
                placeholder="Valor"
                style={{
                  flex: 1,
                  background: C.dim,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  padding: 10,
                  color: '#fff',
                }}
              />
              <button
                onClick={handlePublish}
                disabled={publishing}
                style={{
                  padding: '0 16px',
                  background: C.accent,
                  color: C.bg,
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                {publishing ? '...' : 'OK'}
              </button>
            </div>
            {publishError && (
              <p style={{ fontSize: 12, color: C.red, marginTop: 6 }}>{publishError}</p>
            )}
            <p style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>
              Isto publica só este valor — o resto do teu histórico de treino continua privado no
              dispositivo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
