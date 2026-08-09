import { useEffect, useState } from 'react';
import { useSocialStore, MetricType } from '../../stores/useSocialStore';
import { EXERCISE_DB } from '../../data/exerciseDB';
import { C } from '../../data/constants';

const EXERCISE_NAMES = Object.keys(EXERCISE_DB);

const METRIC_LABELS: Record<MetricType, string> = {
  '1rm': '1RM Estimado',
  volume: 'Volume Total',
  reps: 'Repetições',
  duration: 'Duração',
};

function daysLeft(endsAt: string): string {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return 'Terminado';
  const days = Math.ceil(diff / 86400000);
  return days === 1 ? '1 dia restante' : `${days} dias restantes`;
}

export const DuelsTab = () => {
  const { challenges, challengesLoading, fetchOpenChallenges, createChallenge, joinChallenge, profile } = useSocialStore();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [exerciseName, setExerciseName] = useState(EXERCISE_NAMES[0] ?? 'Barbell Back Squat');
  const [metricType, setMetricType] = useState<MetricType>('1rm');
  const [durationDays, setDurationDays] = useState(7);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  useEffect(() => {
    fetchOpenChallenges();
  }, [fetchOpenChallenges]);

  const handleCreate = async () => {
    if (!title.trim()) {
      setError('Dá um nome ao duelo.');
      return;
    }
    setCreating(true);
    setError(null);
    const endsAt = new Date(Date.now() + durationDays * 86400000).toISOString();
    const { error: err } = await createChallenge({ exerciseName, metricType, title: title.trim(), endsAt });
    setCreating(false);
    if (err) {
      setError(err);
      return;
    }
    setShowCreate(false);
    setTitle('');
    fetchOpenChallenges();
  };

  const handleJoin = async (challengeId: string) => {
    setJoinError(null);
    setJoiningId(challengeId);
    const { error: err } = await joinChallenge(challengeId);
    setJoiningId(null);
    if (err) {
      setJoinError(err.includes('duplicate key value') || err.includes('unique constraint') ? 'Já aderiste a este duelo!' : err);
    }
  };

  return (
    <div>
      {joinError && <p style={{ color: C.red, fontSize: 12, textAlign: 'center', marginBottom: 8 }}>{joinError}</p>}
      {challengesLoading ? (
        <p style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: 20 }}>A carregar duelos...</p>
      ) : challenges.length === 0 ? (
        <p style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: 20 }}>
          Nenhum duelo aberto. Cria o primeiro.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
          {challenges.map((ch) => (
            <div key={ch.id} style={{ padding: 12, background: '#080b0f', borderRadius: 8, border: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: 14, color: '#fff', margin: 0, fontWeight: 'bold' }}>{ch.title}</p>
                  <p style={{ fontSize: 12, color: C.muted, margin: '4px 0 0' }}>
                    {ch.exerciseName} · {METRIC_LABELS[ch.metricType]}
                  </p>
                </div>
                <span style={{ fontSize: 11, color: C.accent, fontFamily: "'DM Mono'", whiteSpace: 'nowrap' }}>
                  {daysLeft(ch.endsAt)}
                </span>
              </div>
              {ch.creatorId !== profile?.id && (
                <button
                  onClick={() => handleJoin(ch.id)}
                  disabled={joiningId === ch.id}
                  style={{ marginTop: 10, width: '100%', padding: 8, background: `${C.accent}22`, color: C.accent, border: `1px solid ${C.accent}55`, borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 'bold' }}
                >
                  {joiningId === ch.id ? 'A entrar...' : '⚔️ ACEITAR DUELO'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 16, borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
        {!showCreate ? (
          <button
            onClick={() => setShowCreate(true)}
            style={{ width: '100%', padding: 12, background: `${C.accent}22`, color: C.accent, border: `1px solid ${C.accent}55`, borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 13 }}
          >
            ⚔️ CRIAR DUELO
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome do duelo (ex: Quem faz mais Squat este mês?)"
              style={{ background: C.dim, border: `1px solid ${C.border}`, borderRadius: 8, padding: 10, color: '#fff', fontSize: 13 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <select value={exerciseName} onChange={(e) => setExerciseName(e.target.value)} style={{ flex: 1.5, background: C.dim, border: `1px solid ${C.border}`, borderRadius: 8, padding: 10, color: '#fff', fontSize: 12 }}>
                {EXERCISE_NAMES.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
              <select value={metricType} onChange={(e) => setMetricType(e.target.value as MetricType)} style={{ flex: 1, background: C.dim, border: `1px solid ${C.border}`, borderRadius: 8, padding: 10, color: '#fff', fontSize: 12 }}>
                {(Object.keys(METRIC_LABELS) as MetricType[]).filter(m => m !== 'duration').map((m) => <option key={m} value={m}>{METRIC_LABELS[m]}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: C.muted }}>Duração:</span>
              {[3, 7, 14, 30].map((d) => (
                <button
                  key={d}
                  onClick={() => setDurationDays(d)}
                  style={{
                    padding: '6px 10px',
                    background: durationDays === d ? C.accent : 'transparent',
                    color: durationDays === d ? C.bg : C.muted,
                    border: `1px solid ${durationDays === d ? C.accent : C.border}`,
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 11,
                  }}
                >
                  {d}d
                </button>
              ))}
            </div>
            {error && <p style={{ fontSize: 12, color: C.red, margin: 0 }}>{error}</p>}
            <button
              onClick={handleCreate}
              disabled={creating}
              style={{ padding: 12, background: C.accent, color: C.bg, border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}
            >
              {creating ? 'A criar...' : 'CRIAR DUELO'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};