import React, { useState } from 'react';
import { useSocialStore } from '../../stores/useSocialStore';
import { C } from '../../data/constants';

export const ClubModal = ({ onClose }: { onClose: () => void }) => {
  const { myClub, createClub, joinClub, leaveClub } = useSocialStore();
  const [clubName, setClubName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
      if (!clubName) return;
      setLoading(true);
      await createClub(clubName);
      setLoading(false);
  };

  const handleJoin = async () => {
      if (!inviteCode) return;
      setLoading(true);
      try {
        await joinClub(inviteCode.toUpperCase());
      } catch (err: any) {
        alert(err.message);
      }
      setLoading(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(8,11,15,0.9)', backdropFilter: 'blur(10px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#1a1f25', borderRadius: 16, padding: '20px', width: '90%', maxWidth: 400, border: `1px solid ${C.accent}44` }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 28, color: C.accent, margin: 0 }}>🔥 CLUBE SOCIAL</h2>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: C.muted, fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>
        
        {!myClub ? (
          <div>
            <div style={{ marginBottom: 20 }}>
                <input 
                  type="text" 
                  value={clubName}
                  onChange={e => setClubName(e.target.value)}
                  placeholder="Nome do Novo Clube"
                  style={{ width: '100%', background: C.dim, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12, color: '#fff', marginBottom: 8 }}
                />
                <button onClick={handleCreate} disabled={loading} style={{ width: '100%', padding: 14, background: C.accent, color: C.bg, fontWeight: 'bold', borderRadius: 8, cursor: 'pointer', border: 'none' }}>
                  {loading ? 'A CRIAR...' : 'CRIAR CLUBE'}
                </button>
            </div>

            <div style={{ position: 'relative' }}>
                <input 
                    type="text" 
                    value={inviteCode}
                    onChange={e => setInviteCode(e.target.value)}
                    placeholder="Código de convite (ex: MOTRA1)"
                    style={{ width: '100%', background: C.dim, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12, color: '#fff' }}
                />
                <button onClick={handleJoin} disabled={loading} style={{ position: 'absolute', right: 6, top: 6, padding: '6px 12px', background: `${C.accent}33`, color: C.accent, border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>
                    ENTRAR
                </button>
            </div>
            
            <div style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
               <p style={{ fontSize: 13, color: C.muted, marginBottom: 12, fontWeight: 'bold' }}>📍 CLUBES GLOBAIS OFICIAIS</p>
               <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button onClick={() => {setInviteCode('PT_ELITE'); handleJoin();}} style={{ background: C.bg, border: `1px solid ${C.border}`, padding: '10px 14px', borderRadius: 8, color: '#fff', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
                     <span>🏆 Comunidade FitTrack</span>
                     <span style={{ color: C.muted, fontSize: 11 }}>34K Membros</span>
                  </button>
                  <button onClick={() => {setInviteCode('CALISTENIA'); handleJoin();}} style={{ background: C.bg, border: `1px solid ${C.border}`, padding: '10px 14px', borderRadius: 8, color: '#fff', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
                     <span>🤸 Calistenia PT</span>
                     <span style={{ color: C.muted, fontSize: 11 }}>12K Membros</span>
                  </button>
               </div>
            </div>
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
              {myClub.members.map(m => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#080b0f', borderRadius: 6 }}>
                  <span style={{ fontSize: 14, color: '#fff' }}>{m.username}</span>
                  <span style={{ fontFamily: "'DM Mono'", color: C.accent }}>{m.xpThisWeek} XP</span>
                </div>
              ))}
            </div>
            
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
              <p style={{ fontSize: 12, marginBottom: 6, fontWeight: 'bold' }}>🎯 META SEMANAL: {myClub.weeklyProgress}/{myClub.weeklyGoal} XP</p>
              <div style={{ height: 8, background: C.dim, borderRadius: 4, overflow: 'hidden', marginBottom: 16 }}>
                <div style={{ height: '100%', background: C.accent, width: `${(myClub.weeklyProgress / myClub.weeklyGoal) * 100}%` }} />
              </div>
              
              <button onClick={leaveClub} style={{ width: '100%', padding: '8px', background: 'transparent', border: `1px solid ${C.red}`, color: C.red, borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                  SAIR DO CLUBE
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
