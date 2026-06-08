import React from "react";
import { C, GOALS } from "../data/constants";
import { useLS } from "../hooks";
import { sanitizeText } from "../utils/sanitize";

export default function Settings({ profile, setProfile, onReset }: any) {
  const exportBackup = () => {
      const data = {
          profile: JSON.parse(localStorage.getItem('fit_profile') || '{}'),
          history: JSON.parse(localStorage.getItem('fit_history') || '[]'),
          challenges: JSON.parse(localStorage.getItem('fit_challenges') || '[]')
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fittrack_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (event) => {
          try {
              const data = JSON.parse(event.target?.result as string);
              if (data.profile) {
                  localStorage.setItem('fit_profile', JSON.stringify(data.profile));
                  const { set } = await import('idb-keyval');
                  await set('fit_profile', data.profile);
              }
              if (data.history) {
                  localStorage.setItem('fit_history', JSON.stringify(data.history));
                  const { set } = await import('idb-keyval');
                  await set('fit_history', data.history);
              }
              alert("Restauro completo! A aplicação vai reiniciar.");
              window.location.reload();
          } catch (err) {
              alert("Erro ao importar o backup. Ficheiro inválido.");
          }
      };
      reader.readAsText(file);
  };
  return (
    <div style={{ padding: "18px", maxWidth: 480, margin: "0 auto" }}>
      <p style={{ fontFamily: "'Bebas Neue'", fontSize: 24, letterSpacing: 2, marginBottom: 18 }}>DEFINIÇÕES</p>
      
      <button onClick={() => window.dispatchEvent(new CustomEvent('NAVIGATE_TO', { detail: 'milestones' }))} style={{ width: "100%", background: `linear-gradient(135deg, ${C.surface}, ${C.bg})`, color: C.accent, border: `1px solid ${C.accent}`, borderRadius: 12, padding: 16, fontFamily: "'Bebas Neue'", fontSize: 20, letterSpacing: 2, cursor: "pointer", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: `0 4px 15px rgba(232,200,74,0.15)` }}>
        <span>🏆 VER CONQUISTAS & RECORDES</span>
        <span style={{ color: C.accent }}>&gt;</span>
      </button>

      <button onClick={() => window.dispatchEvent(new CustomEvent('NAVIGATE_TO', { detail: 'devices' }))} style={{ width: "100%", background: `linear-gradient(135deg, rgba(56, 189, 248, 0.1), ${C.bg})`, color: '#38bdf8', border: `1px solid #38bdf8`, borderRadius: 12, padding: 16, fontFamily: "'Bebas Neue'", fontSize: 20, letterSpacing: 2, cursor: "pointer", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: `0 4px 15px rgba(56, 189, 248, 0.15)` }}>
        <span>⌚ SMARTWATCHES & SENSORES BLE</span>
        <span style={{ color: '#38bdf8' }}>&gt;</span>
      </button>
      
      <div className="glass" style={{ padding: 14, marginBottom: 20 }}>
        <p style={{ fontFamily: "'Bebas Neue'", fontSize: 14, letterSpacing: 1, color: C.text, marginBottom: 8 }}>O TEU PERFIL</p>
        <label style={{ display: "block", fontSize: 12, color: C.muted, marginBottom: 4 }}>NOME</label>
        <input 
          type="text" 
          value={profile.name} 
          onChange={e => setProfile({ ...profile, name: sanitizeText(e.target.value) })} 
          style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 10, color: C.text, marginBottom: 12 }}
        />
        <label style={{ display: "block", fontSize: 12, color: C.muted, marginBottom: 4 }}>OBJETIVO PRINCIPAL</label>
        <select 
          value={profile.goal}
          onChange={e => setProfile({ ...profile, goal: e.target.value })}
          style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 10, color: C.text, marginBottom: 16 }}
        >
          {GOALS.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
        </select>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", fontSize: 12, color: C.muted, marginBottom: 4 }}>PESO (KG)</label>
            <input 
              type="number" 
              value={profile.weight || ''} 
              onChange={e => setProfile({ ...profile, weight: parseFloat(e.target.value) })} 
              style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 10, color: C.text }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", fontSize: 12, color: C.muted, marginBottom: 4 }}>ALTURA (CM)</label>
            <input 
              type="number" 
              value={profile.height || ''} 
              onChange={e => setProfile({ ...profile, height: parseFloat(e.target.value) })} 
              style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 10, color: C.text }}
            />
          </div>
        </div>

        {/* --- Campos Demográficos --- */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", fontSize: 12, color: C.muted, marginBottom: 4 }}>IDADE</label>
            <input
              type="number"
              min={6}
              max={100}
              value={profile.age || ''}
              onChange={e => setProfile({ ...profile, age: parseInt(e.target.value) })}
              style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 10, color: C.text }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", fontSize: 12, color: C.muted, marginBottom: 4 }}>GÉNERO</label>
            <select
              value={profile.gender || 'other'}
              onChange={e => setProfile({ ...profile, gender: e.target.value })}
              style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 10, color: C.text }}
            >
              <option value="other">Prefiro não dizer</option>
              <option value="male">Masculino</option>
              <option value="female">Feminino</option>
            </select>
          </div>
        </div>

        {/* Ciclo sincronizado - só aparece se género=female */}
        {profile.gender === 'female' && (
          <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px", background: profile.wantsCycleSyncing ? `rgba(167,139,250,0.15)` : C.bg, border: `1px solid ${profile.wantsCycleSyncing ? '#a78bfa' : C.border}`, borderRadius: 8, cursor: "pointer", marginBottom: 16 }}>
            <input
              type="checkbox"
              checked={profile.wantsCycleSyncing || false}
              onChange={e => setProfile({ ...profile, wantsCycleSyncing: e.target.checked })}
              style={{ width: 18, height: 18, accentColor: '#a78bfa' }}
            />
            <div>
              <span style={{ fontSize: 14, color: profile.wantsCycleSyncing ? '#a78bfa' : C.text, fontWeight: 'bold' }}>🔄 SINCRONIZAR CICLO MENSTRUAL</span>
              <span style={{ display: "block", fontSize: 11, color: C.muted }}>Adapta a intensidade do treino à tua fase do ciclo.</span>
            </div>
          </label>
        )}
        
        <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px", background: profile.proMode ? `${C.accent}22` : C.bg, border: `1px solid ${profile.proMode ? C.accent : C.border}`, borderRadius: 8, cursor: "pointer" }}>
           <input type="checkbox" checked={profile.proMode || false} onChange={e => setProfile({ ...profile, proMode: e.target.checked })} style={{ width: 18, height: 18, accentColor: C.accent }} />
           <div>
               <span style={{ fontSize: 14, color: profile.proMode ? C.accent : C.text, fontWeight: 'bold' }}>⚡ ZEN / PRO MODE</span>
               <span style={{ display: "block", fontSize: 11, color: C.muted }}>Desativa sons, confetis e foca no treino hardcore (RPE).</span>
           </div>
        </label>

        <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
          <label style={{ display: "block", fontSize: 12, color: C.muted, marginBottom: 8, fontWeight: 'bold' }}>⚠️ LESÕES ATIVAS (PROTEÇÃO ARTICULAR)</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['Ombro', 'Joelho', 'Lombar', 'Cotovelo', 'Pulso'].map(inj => {
              const active = (profile.injuries || []).includes(inj);
              return (
                <button
                  key={inj}
                  onClick={() => {
                    const current = profile.injuries || [];
                    const updated = active ? current.filter((i: string) => i !== inj) : [...current, inj];
                    setProfile({ ...profile, injuries: updated });
                  }}
                  style={{
                    background: active ? 'rgba(239,68,68,0.2)' : C.bg,
                    border: `1px solid ${active ? '#ef4444' : C.border}`,
                    borderRadius: 20,
                    padding: '6px 12px',
                    fontSize: 12,
                    color: active ? '#fca5a5' : C.text,
                    cursor: 'pointer',
                    transition: '0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  {active ? '🩹' : '⚪'} {inj}
                </button>
              );
            })}
          </div>
          <span style={{ display: "block", fontSize: 10, color: C.muted, marginTop: 6 }}>
            Ajusta automaticamente a carga sugerida para proteger as tuas articulações.
          </span>
        </div>
      </div>

      <div className="glass" style={{ padding: 14, marginBottom: 20 }}>
        <p style={{ fontFamily: "'Bebas Neue'", fontSize: 14, letterSpacing: 1, color: C.accent, marginBottom: 8 }}>🧠 MODELO NEURAL (CLAUDE API)</p>
        <p style={{ fontSize: 12, color: C.green }}>Ligação Segura Cloudflare ativa (Zero-Trust).</p>
      </div>

      <div className="glass" style={{ padding: 14, marginBottom: 20 }}>
        <p style={{ fontFamily: "'Bebas Neue'", fontSize: 14, letterSpacing: 1, color: C.text, marginBottom: 8 }}>BACKUP DE DADOS</p>
        
        <button onClick={() => window.dispatchEvent(new CustomEvent('NAVIGATE_TO', { detail: 'backup' }))} style={{ width: "100%", background: `linear-gradient(135deg, rgba(232, 200, 74, 0.2), ${C.bg})`, color: C.accent, border: `1px solid ${C.accent}`, borderRadius: 8, padding: 12, cursor: "pointer", fontFamily: "'Bebas Neue'", fontSize: 18, letterSpacing: 1, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span>☁️ BYOC GOOGLE DRIVE BACKUP</span>
          <span>&gt;</span>
        </button>

        <p style={{ fontSize: 12, color: C.muted, marginBottom: 8, textAlign: 'center' }}>Ou exportar ficheiro local (JSON bruto):</p>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={exportBackup} style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 10, color: C.text, cursor: "pointer", fontFamily: "'Bebas Neue'", fontSize: 14 }}>
              📦 EXPORTAR
          </button>
          <label style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 10, color: C.text, cursor: "pointer", fontFamily: "'Bebas Neue'", fontSize: 14, textAlign: "center" }}>
              📥 IMPORTAR
              <input type="file" accept=".json" onChange={handleImport} style={{ display: "none" }} />
          </label>
        </div>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.red}44`, borderRadius: 12, padding: 14 }}>
        <p style={{ fontFamily: "'Bebas Neue'", fontSize: 11, letterSpacing: 2, color: C.red, marginBottom: 10 }}>ZONA DE PERIGO</p>
        <button onClick={onReset} style={{ width: "100%", background: "transparent", border: `1px solid ${C.red}`, borderRadius: 8, padding: 11, color: C.red, cursor: "pointer", fontFamily: "'Bebas Neue'", fontSize: 14, letterSpacing: 2 }}>
          🗑 APAGAR TUDO E RECOMEÇAR
        </button>
      </div>
    </div>
  );
}
