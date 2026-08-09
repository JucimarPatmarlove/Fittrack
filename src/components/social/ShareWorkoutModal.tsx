// @ts-nocheck
// src/components/social/ShareWorkoutModal.tsx
import React, { useState, useEffect } from 'react';
import { C } from '../../data/constants';

export function ShareWorkoutModal({ workoutPlan, onClose, onImport }: { workoutPlan?: any, onClose: () => void, onImport: (plan: any) => void }) {
  const [syncCode, setSyncCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [tab, setTab] = useState<'export' | 'import'>('export');

  // Gerar o token minimizado de partilha
  useEffect(() => {
    if (workoutPlan && tab === 'export') {
      try {
        // Reduzir payload para os campos cruciais para poupar caracteres
        const compact = {
          n: workoutPlan.name || workoutPlan.label || "Treino P2P",
          t: workoutPlan.type || "classic",
          e: workoutPlan.exercises || []
        };
        const str = JSON.stringify(compact);
        // Base64 encoding simples
        const b64 = btoa(encodeURIComponent(str));
        setSyncCode(b64);
      } catch (e) {
        setStatus("Erro ao empacotar treino.");
      }
    }
  }, [workoutPlan, tab]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(syncCode);
      setStatus("✓ Código copiado para a Área de Transferência!");
      setTimeout(() => setStatus(null), 3000);
    } catch (e) {
      setStatus("Erro ao copiar.");
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Treino FitTrack V7',
          text: `Copia este token para o teu FitTrack: ${syncCode}`,
        });
      } catch (e) {
        // user cancelled or failed
      }
    } else {
      handleCopy();
    }
  };

  const handleImportSubmit = () => {
    if (!inputCode.trim()) return;
    try {
      const str = decodeURIComponent(atob(inputCode.trim()));
      const compact = JSON.parse(str);
      const restored = {
        name: compact.n,
        label: compact.n,
        type: compact.t,
        exercises: compact.e,
        reasoning: "Treino sincronizado via P2P Sync Code."
      };
      onImport(restored);
      setStatus("✓ Treino importado com sucesso!");
      setTimeout(() => {
        setStatus(null);
        onClose();
      }, 1500);
    } catch (e) {
      setStatus("❌ Token inválido ou corrompido.");
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(5,7,10,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400, padding: 16 }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, width: '100%', maxWidth: 400, overflow: 'hidden', boxShadow: '0 0 30px rgba(0,255,170,0.1)' }}>
        
        {/* Header Tabs */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}` }}>
          <button 
            onClick={() => setTab('export')}
            style={{ flex: 1, padding: 14, background: tab === 'export' ? 'transparent' : '#0a0d12', border: 'none', color: tab === 'export' ? C.accent : C.muted, fontSize: 12, fontWeight: 'bold', cursor: 'pointer', borderBottom: tab === 'export' ? `2px solid ${C.accent}` : 'none' }}
          >
            📤 PARTILHAR (P2P)
          </button>
          <button 
            onClick={() => setTab('import')}
            style={{ flex: 1, padding: 14, background: tab === 'import' ? 'transparent' : '#0a0d12', border: 'none', color: tab === 'import' ? C.accent : C.muted, fontSize: 12, fontWeight: 'bold', cursor: 'pointer', borderBottom: tab === 'import' ? `2px solid ${C.accent}` : 'none' }}
          >
            📥 IMPORTAR TOKEN
          </button>
        </div>

        <div style={{ padding: 20 }}>
          {tab === 'export' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <p style={{ fontSize: 11, color: C.muted, textAlign: 'center', marginTop: 0, marginBottom: 16 }}>
                Este código contém todo o teu plano comprimido. Copia ou envia para o telemóvel do teu amigo via AirDrop/Mensagem.
              </p>

              {/* Holographic Matrix Simulation */}
              <div style={{ width: 140, height: 140, background: '#020406', border: `1px solid ${C.accent}44`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: 16, overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 8, border: `2px dashed ${C.accent}88`, borderRadius: 6, animation: 'spin 20s linear infinite' }} />
                <span style={{ fontSize: 32 }}>🖧</span>
                <div style={{ position: 'absolute', bottom: 4, fontSize: 8, color: C.accent, fontFamily: "'DM Mono'" }}>SYNC READY</div>
              </div>

              <textarea 
                readOnly 
                value={syncCode} 
                style={{ width: '100%', height: 60, background: '#05070a', border: `1px solid ${C.border}`, borderRadius: 8, padding: 8, fontSize: 11, fontFamily: "'DM Mono'", color: C.text, resize: 'none', textAlign: 'center', marginBottom: 16 }}
                onClick={e => (e.target as HTMLTextAreaElement).select()}
              />

              <div style={{ display: 'flex', gap: 10, width: '100%' }}>
                <button 
                  onClick={handleCopy}
                  style={{ flex: 1, background: C.card, border: `1px solid ${C.accent}`, borderRadius: 8, padding: '10px', color: C.accent, fontSize: 12, fontWeight: 'bold', cursor: 'pointer' }}
                >
                  📋 COPIAR
                </button>
                <button 
                  onClick={handleNativeShare}
                  style={{ flex: 1, background: C.accent, border: 'none', borderRadius: 8, padding: '10px', color: '#000', fontSize: 12, fontWeight: 'bold', cursor: 'pointer' }}
                >
                  🚀 ENVIAR
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <p style={{ fontSize: 11, color: C.muted, textAlign: 'center', marginTop: 0, marginBottom: 16 }}>
                Pede ao teu amigo o código P2P gerado no FitTrack dele e cola abaixo para iniciares a mesma rotina.
              </p>

              <textarea 
                placeholder="Cola o token de sincronização aqui..."
                value={inputCode} 
                onChange={e => setInputCode(e.target.value)}
                style={{ width: '100%', height: 100, background: '#05070a', border: `1px solid ${C.border}`, borderRadius: 8, padding: 12, fontSize: 12, fontFamily: "'DM Mono'", color: C.accent, resize: 'none', marginBottom: 16 }}
              />

              <button 
                onClick={handleImportSubmit}
                style={{ width: '100%', background: C.green, border: 'none', borderRadius: 8, padding: '12px', color: '#000', fontSize: 13, fontWeight: 'bold', cursor: 'pointer' }}
              >
                📥 CARREGAR TREINO
              </button>
            </div>
          )}

          {status && (
            <p style={{ fontSize: 11, color: status.includes('❌') ? C.red : C.green, textAlign: 'center', marginTop: 16, marginBottom: 0, fontWeight: 'bold' }}>
              {status}
            </p>
          )}

          <button 
            onClick={onClose}
            style={{ width: '100%', background: 'transparent', border: 'none', color: C.muted, fontSize: 11, marginTop: 16, cursor: 'pointer' }}
          >
            Cancelar e Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
