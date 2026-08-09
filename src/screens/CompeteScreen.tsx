import { AnimatePresence, motion } from 'framer-motion';
// @ts-nocheck
import { useEffect, useState } from 'react';
import { C } from '../data/constants';
import { EXERCISE_LIBRARY } from '../data/constants';
import { useCompeteStore } from '../stores/useCompeteStore';
import type { Challenge, LeaderboardEntry, WeightClass } from '../stores/useCompeteStore';

type Tab = 'leaderboard' | 'challenges' | 'myPRs';

// ── Exercícios competitivos (subconjunto da library) ──
const COMPETE_EXERCISES = EXERCISE_LIBRARY.filter((e) =>
  ['Barra', 'Halteres', 'Máquinas', 'PesoCorporal'].includes(e.equipment),
).map((e) => e.name);

// ── Setup Profile Modal ──
function SetupModal({ onComplete }: { onComplete: () => void }) {
  const { setupProfile } = useCompeteStore();
  const [username, setUsername] = useState('');
  const [weightClass, setWeightClass] = useState<WeightClass>('open');

  const handleSubmit = () => {
    if (!username.trim() || username.trim().length < 3) return;
    setupProfile(username.trim(), weightClass);
    onComplete();
  };

  const wcOptions: { value: WeightClass; label: string }[] = [
    { value: 'open', label: '🌐 Open (Sem Classe)' },
    { value: 'u60', label: '< 60 kg' },
    { value: 'u70', label: '< 70 kg' },
    { value: 'u80', label: '< 80 kg' },
    { value: 'u90', label: '< 90 kg' },
    { value: 'u100', label: '< 100 kg' },
    { value: 'o100', label: '100+ kg' },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(8,11,15,0.95)',
        zIndex: 400,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        backdropFilter: 'blur(8px)',
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          background: C.card,
          border: `1px solid ${C.accent}`,
          borderRadius: 16,
          padding: 28,
          maxWidth: 380,
          width: '100%',
        }}
      >
        <p
          style={{
            fontFamily: "'Bebas Neue'",
            fontSize: 26,
            letterSpacing: 2,
            color: C.accent,
            margin: '0 0 6px 0',
          }}
        >
          ⚔️ ENTRAR NA ARENA
        </p>
        <p style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>
          Cria o teu perfil público para competir. Os teus dados privados ficam no cofre.
        </p>

        <label
          style={{
            display: 'block',
            fontSize: 11,
            color: C.muted,
            marginBottom: 4,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          Nome de Arena
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Ex: IronMike_PT"
          maxLength={20}
          style={{
            width: '100%',
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            padding: 12,
            color: '#fff',
            fontSize: 14,
            marginBottom: 16,
          }}
        />

        <label
          style={{
            display: 'block',
            fontSize: 11,
            color: C.muted,
            marginBottom: 4,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          Classe de Peso
        </label>
        <select
          value={weightClass}
          onChange={(e) => setWeightClass(e.target.value as WeightClass)}
          style={{
            width: '100%',
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            padding: 12,
            color: '#fff',
            fontSize: 14,
            marginBottom: 24,
          }}
        >
          {wcOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <button
          onClick={handleSubmit}
          disabled={username.trim().length < 3}
          style={{
            width: '100%',
            padding: 14,
            background:
              username.trim().length >= 3 ? `linear-gradient(135deg, ${C.accent}, #d4a017)` : C.dim,
            color: '#000',
            border: 'none',
            borderRadius: 10,
            fontFamily: "'Bebas Neue'",
            fontSize: 20,
            letterSpacing: 1,
            cursor: username.trim().length >= 3 ? 'pointer' : 'default',
            opacity: username.trim().length >= 3 ? 1 : 0.5,
          }}
        >
          ENTRAR
        </button>
      </motion.div>
    </div>
  );
}

// ── Leaderboard Tab ──
function LeaderboardTab() {
  const { leaderboard, leaderboardExercise, fetchLeaderboard, myRank } = useCompeteStore();
  const [selectedExercise, setSelectedExercise] = useState(leaderboardExercise);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchLeaderboard(selectedExercise).finally(() => setLoading(false));
  }, [selectedExercise, fetchLeaderboard]);

  const medalColor = (rank: number) => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return C.muted;
  };

  const medalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <select
        value={selectedExercise}
        onChange={(e) => setSelectedExercise(e.target.value)}
        style={{
          width: '100%',
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          padding: 12,
          color: '#fff',
          fontSize: 13,
        }}
      >
        {COMPETE_EXERCISES.map((ex) => (
          <option key={ex} value={ex}>
            {ex}
          </option>
        ))}
      </select>

      {myRank && (
        <div
          style={{
            background: `${C.accent}15`,
            border: `1px solid ${C.accent}44`,
            borderRadius: 10,
            padding: '10px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 13, color: C.accent, fontWeight: 'bold' }}>A tua posição</span>
          <span style={{ fontFamily: "'Bebas Neue'", fontSize: 22, color: C.accent }}>
            #{myRank}
          </span>
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: 'center', color: C.muted, padding: 40, fontSize: 13 }}>
          A carregar rankings...
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {leaderboard.map((entry: LeaderboardEntry) => (
            <motion.div
              key={entry.userId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: entry.rank * 0.03 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                background: entry.isCurrentUser ? `${C.accent}18` : C.surface,
                border: entry.isCurrentUser ? `1px solid ${C.accent}66` : `1px solid ${C.border}`,
                borderRadius: 10,
              }}
            >
              <span
                style={{
                  fontFamily: "'Bebas Neue'",
                  fontSize: 18,
                  color: medalColor(entry.rank),
                  width: 36,
                  textAlign: 'center',
                }}
              >
                {medalEmoji(entry.rank)}
              </span>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: entry.isCurrentUser ? C.accent : C.dim,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 'bold',
                  color: entry.isCurrentUser ? '#000' : '#fff',
                }}
              >
                {entry.avatarInitials}
              </div>
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 'bold',
                    color: entry.isCurrentUser ? C.accent : '#fff',
                  }}
                >
                  {entry.username}
                </p>
                <p style={{ margin: 0, fontSize: 10, color: C.muted }}>
                  {entry.weightClass === 'open' ? 'Open' : entry.weightClass.toUpperCase()}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p
                  style={{
                    margin: 0,
                    fontFamily: "'DM Mono'",
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: entry.isCurrentUser ? C.accent : '#fff',
                  }}
                >
                  {entry.best1RM} kg
                </p>
                <p style={{ margin: 0, fontSize: 9, color: C.muted }}>1RM</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Challenges Tab ──
function ChallengesTab() {
  const { challenges, acceptChallenge, declineChallenge } = useCompeteStore();

  const pending = challenges.filter(
    (c) => c.status === 'pending' && c.targetUserId === 'user_local',
  );
  const active = challenges.filter((c) => c.status === 'active');
  const completed = challenges.filter((c) => c.status === 'completed' || c.status === 'declined');

  const daysLeft = (deadline: number) => {
    const diff = deadline - Date.now();
    if (diff <= 0) return 'Expirado';
    const d = Math.ceil(diff / 86400000);
    return `${d}d restante${d > 1 ? 's' : ''}`;
  };

  const renderChallenge = (c: Challenge) => {
    const isPending = c.status === 'pending' && c.targetUserId === 'user_local';
    const isActive = c.status === 'active';
    const isWon = c.status === 'completed' && c.winnerId === 'user_local';
    const isLost = c.status === 'completed' && c.winnerId && c.winnerId !== 'user_local';

    const statusColors: Record<string, string> = {
      pending: '#f59e0b',
      active: '#3b82f6',
      completed: isWon ? '#10b981' : '#ef4444',
      declined: C.muted,
      expired: C.muted,
    };

    return (
      <motion.div
        key={c.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: C.surface,
          border: `1px solid ${statusColors[c.status]}33`,
          borderRadius: 12,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 'bold', color: '#fff' }}>{c.exerciseName}</span>
          <span
            style={{
              fontSize: 10,
              padding: '3px 8px',
              borderRadius: 6,
              background: `${statusColors[c.status]}22`,
              color: statusColors[c.status],
              fontWeight: 'bold',
              textTransform: 'uppercase',
            }}
          >
            {c.status === 'completed'
              ? isWon
                ? '🏆 Vitória'
                : '💀 Derrota'
              : c.status === 'pending'
                ? '⏳ Convite'
                : c.status === 'active'
                  ? '⚔️ Ativo'
                  : c.status}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 12, color: C.muted }}>{c.challengerUsername}</p>
            <p
              style={{
                margin: 0,
                fontFamily: "'DM Mono'",
                fontSize: 16,
                color: c.challengerResult ? '#fff' : C.muted,
              }}
            >
              {c.challengerResult ? `${c.challengerResult} kg` : '—'}
            </p>
          </div>
          <span style={{ fontFamily: "'Bebas Neue'", fontSize: 18, color: C.muted }}>VS</span>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 12, color: C.muted }}>{c.targetUsername}</p>
            <p
              style={{
                margin: 0,
                fontFamily: "'DM Mono'",
                fontSize: 16,
                color: c.targetResult ? '#fff' : C.muted,
              }}
            >
              {c.targetResult ? `${c.targetResult} kg` : '—'}
            </p>
          </div>
        </div>

        {isActive && (
          <p style={{ margin: 0, fontSize: 11, color: '#3b82f6', textAlign: 'center' }}>
            ⏱ {daysLeft(c.deadline)}
          </p>
        )}

        {isPending && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => acceptChallenge(c.id)}
              style={{
                flex: 1,
                padding: 10,
                background: `linear-gradient(135deg, ${C.accent}, #d4a017)`,
                color: '#000',
                border: 'none',
                borderRadius: 8,
                fontWeight: 'bold',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              ⚔️ ACEITAR
            </button>
            <button
              onClick={() => declineChallenge(c.id)}
              style={{
                flex: 1,
                padding: 10,
                background: 'transparent',
                color: '#ef4444',
                border: '1px solid #ef444444',
                borderRadius: 8,
                fontWeight: 'bold',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              RECUSAR
            </button>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {pending.length > 0 && (
        <div>
          <p
            style={{
              fontFamily: "'Bebas Neue'",
              fontSize: 16,
              color: '#f59e0b',
              margin: '0 0 8px 0',
              letterSpacing: 1,
            }}
          >
            📩 CONVITES ({pending.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pending.map(renderChallenge)}
          </div>
        </div>
      )}
      {active.length > 0 && (
        <div>
          <p
            style={{
              fontFamily: "'Bebas Neue'",
              fontSize: 16,
              color: '#3b82f6',
              margin: '0 0 8px 0',
              letterSpacing: 1,
            }}
          >
            ⚔️ ATIVOS ({active.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {active.map(renderChallenge)}
          </div>
        </div>
      )}
      {completed.length > 0 && (
        <div>
          <p
            style={{
              fontFamily: "'Bebas Neue'",
              fontSize: 16,
              color: C.muted,
              margin: '0 0 8px 0',
              letterSpacing: 1,
            }}
          >
            📜 HISTÓRICO
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {completed.map(renderChallenge)}
          </div>
        </div>
      )}
      {challenges.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>
          <p style={{ fontSize: 32, margin: '0 0 8px 0' }}>⚔️</p>
          <p style={{ fontSize: 13 }}>Sem desafios ainda. Publica PRs e espera pelos rivais!</p>
        </div>
      )}
    </div>
  );
}

// ── My PRs Tab ──
function MyPRsTab() {
  const { publishedPRs, publishPR, unpublishPR } = useCompeteStore();
  const [localPRs, setLocalPRs] = useState<{ exerciseName: string; best1RM: number }[]>([]);

  useEffect(() => {
    // Load PRs from IndexedDB
    (async () => {
      try {
        const { getAllPersonalRecords } = await import('../db/schema');
        const records = await getAllPersonalRecords();
        setLocalPRs(
          records
            .filter((r) => r.best1RM > 0)
            .map((r) => ({ exerciseName: r.exerciseName, best1RM: r.best1RM })),
        );
      } catch {
        setLocalPRs([]);
      }
    })();
  }, []);

  // Merge local PRs with published status
  const allExercises = COMPETE_EXERCISES.map((name) => {
    const local = localPRs.find((p) => p.exerciseName === name);
    const published = publishedPRs.find((p) => p.exerciseName === name);
    return {
      name,
      localBest1RM: local?.best1RM || 0,
      isPublished: published?.isPublished || false,
      publishedValue: published?.best1RM || 0,
    };
  }).filter((e) => e.localBest1RM > 0); // Only show exercises with data

  const handleToggle = (name: string, best1RM: number, currentlyPublished: boolean) => {
    if (currentlyPublished) {
      unpublishPR(name);
    } else {
      publishPR(name, best1RM);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        style={{
          background: `${C.accent}10`,
          border: `1px dashed ${C.accent}44`,
          borderRadius: 10,
          padding: 12,
        }}
      >
        <p style={{ margin: 0, fontSize: 12, color: C.accent }}>
          🔒 Os teus dados no cofre continuam privados. Apenas PRs <strong>publicados</strong>{' '}
          aparecem no leaderboard.
        </p>
      </div>

      {allExercises.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>
          <p style={{ fontSize: 32, margin: '0 0 8px 0' }}>🏋️</p>
          <p style={{ fontSize: 13 }}>Completa treinos para gerar PRs que possas publicar.</p>
        </div>
      ) : (
        allExercises.map((ex) => (
          <div
            key={ex.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              background: C.surface,
              border: `1px solid ${ex.isPublished ? C.accent + '44' : C.border}`,
              borderRadius: 10,
            }}
          >
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 'bold', color: '#fff' }}>
                {ex.name}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: C.muted, fontFamily: "'DM Mono'" }}>
                1RM: {ex.localBest1RM.toFixed(1)} kg
                {ex.isPublished && ex.publishedValue !== ex.localBest1RM && (
                  <span style={{ color: C.accent, marginLeft: 8 }}>⬆ Atualizar</span>
                )}
              </p>
            </div>
            <button
              onClick={() => handleToggle(ex.name, ex.localBest1RM, ex.isPublished)}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 'bold',
                letterSpacing: 0.5,
                background: ex.isPublished ? `${C.accent}22` : C.dim,
                color: ex.isPublished ? C.accent : C.muted,
              }}
            >
              {ex.isPublished ? '✅ PÚBLICO' : '🔒 PRIVADO'}
            </button>
          </div>
        ))
      )}
    </div>
  );
}

// ── Main Screen ──
export default function CompeteScreen() {
  const { publicProfile } = useCompeteStore();
  const [tab, setTab] = useState<Tab>('leaderboard');
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    if (!publicProfile) setShowSetup(true);
  }, [publicProfile]);

  const tabs: { id: Tab; icon: string; label: string }[] = [
    { id: 'leaderboard', icon: '🏆', label: 'RANKING' },
    { id: 'challenges', icon: '⚔️', label: 'DESAFIOS' },
    { id: 'myPRs', icon: '📤', label: 'MEUS PRs' },
  ];

  return (
    <div style={{ padding: 18, maxWidth: 520, margin: '0 auto', paddingBottom: 100 }}>
      {showSetup && <SetupModal onComplete={() => setShowSetup(false)} />}

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <p
          style={{
            fontFamily: "'Bebas Neue'",
            fontSize: 32,
            letterSpacing: 2,
            margin: 0,
            color: '#fff',
          }}
        >
          ⚔️ ARENA <span style={{ color: C.accent }}>COMPETITIVA</span>
        </p>
        <p style={{ margin: 0, color: C.muted, fontSize: 12 }}>
          O Strava do treino de força. Compete com PRs reais.
        </p>
        {publicProfile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: C.accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 'bold',
                color: '#000',
              }}
            >
              {publicProfile.avatarInitials}
            </div>
            <span style={{ fontSize: 13, color: '#fff', fontWeight: 'bold' }}>
              {publicProfile.username}
            </span>
            <span
              style={{
                fontSize: 10,
                color: C.muted,
                background: C.dim,
                padding: '2px 8px',
                borderRadius: 4,
              }}
            >
              {publicProfile.weightClass === 'open'
                ? 'Open'
                : publicProfile.weightClass.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              padding: '10px 8px',
              borderRadius: 10,
              border: 'none',
              cursor: 'pointer',
              background: tab === t.id ? `${C.accent}22` : C.surface,
              color: tab === t.id ? C.accent : C.muted,
              fontFamily: "'Bebas Neue'",
              fontSize: 14,
              letterSpacing: 1,
              borderBottom: tab === t.id ? `2px solid ${C.accent}` : '2px solid transparent',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
        >
          {tab === 'leaderboard' && <LeaderboardTab />}
          {tab === 'challenges' && <ChallengesTab />}
          {tab === 'myPRs' && <MyPRsTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
