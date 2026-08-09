import { useState } from 'react';
import { useSocialStore } from '../../stores/useSocialStore';
import { C } from '../../data/constants';

export const ClubTab = () => {
  const { myClub, createClub, joinClub, leaveClub, submitXP, clubLoading, clubError } = useSocialStore();
  const [clubName, setClubName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!clubName) return;
    await createClub(clubName);
    setClubName('');
  };

  const handleJoin = async (code?: string) => {
    const target = (code ?? inviteCode).toUpperCase();
    if (!target) return;
    setJoinError(null);
    try {
      await joinClub(target);
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Falha ao entrar no clube.');
    }
  };

  return (
    <div>
      {!myClub ? (
        <div>
          <div style={{ marginBottom: 20 }}>
            <input
              type="text"
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
              placeholder="Nome do Novo Clube"
              style={{ width: '100%', background: C.dim, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12, color: '#fff', marginBottom: 8 }}
            />
            <button onClick={handleCreate} disabled={clubLoading} style={{ width: '100%', padding: 14, background: C.accent, color: C.bg, fontWeight: 'bold', borderRadius: 8, cursor: 'pointer', border: 'none' }}>
              {clubLoading ? 'A CRIAR...' : 'CRIAR CLUBE'}
            </button>
          </div>

          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Código de convite (6 caracteres)"
              style={{ width: '100%', background: C.dim, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12, color: '#fff' }}
            />
            <button onClick={() => handleJoin()} disabled={clubLoading} style={{ position: 'absolute', right: 6, top: 6, padding: '6px 12px', background: `${C.accent}33`, color: C.accent, border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>
              ENTRAR
            </button>
          </div>
          {(joinError || clubError) && (
            <p style={{ fontSize: 12, color: C.red, marginTop: 8 }}>{joinError ?? clubError}</p>
          )}
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <p style={{ fontFamily: "'Bebas Neue'", fontSize: 20, color: '#fff', margin: 0 }}>{myClub.name}</p>
              <p style={{ fontFamily: "'DM Mono'", fontSize: 11, color: C.muted, margin: 0 }}>Código: {myClub.code}</p>
            </div>
            <p style={{ fontSize: 13, color: '#ccc' }}>{myClub.members.length}/10 membros</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {myClub.members
              .slice()
              .sort((a, b) => b.xpThisWeek - a.xpThisWeek)
              .map((m) => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#080b0f', borderRadius: 6 }}>
                  <span style={{ fontSize: 14, color: '#fff' }}>{m.username}</span>
                  <span style={{ fontFamily: "'DM Mono'", color: C.accent }}>{m.xpThisWeek} XP</span>
                </div>
              ))}
          </div>

          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
            <p style={{ fontSize: 12, marginBottom: 6, fontWeight: 'bold' }}>
              🎯 META SEMANAL: {myClub.weeklyProgress}/{myClub.weeklyGoal} XP
            </p>
            <div style={{ height: 8, background: C.dim, borderRadius: 4, overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ height: '100%', background: C.accent, width: `${Math.min(100, (myClub.weeklyProgress / myClub.weeklyGoal) * 100)}%` }} />
            </div>

            {/* Botão de dev/demo para simular ganho de XP — liga isto ao gamification engine real
                (chama submitXP no fim de cada treino, não aqui) */}
            <button onClick={() => submitXP(500)} style={{ width: '100%', marginBottom: 8, padding: '8px', background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>
              (+500 XP de teste)
            </button>

            <button onClick={leaveClub} style={{ width: '100%', padding: '8px', background: 'transparent', border: `1px solid ${C.red}`, color: C.red, borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
              SAIR DO CLUBE
            </button>
          </div>
        </>
      )}
    </div>
  );
};