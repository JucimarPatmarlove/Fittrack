import React, { useState, useEffect, useRef } from 'react';
import { Share2, Link as LinkIcon, Copy } from 'lucide-react';
import { WebRTCEngine } from '../../services/webrtcEngine';

export const P2PSyncModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [mode, setMode] = useState<'IDLE' | 'HOST' | 'GUEST'>('IDLE');
  const [token, setToken] = useState('');
  const [inputToken, setInputToken] = useState('');
  const [status, setStatus] = useState<string>('Desconectado');
  
  const engineRef = useRef<WebRTCEngine | null>(null);

  useEffect(() => {
    engineRef.current = new WebRTCEngine();
    engineRef.current.onConnectionStateChange = (state) => setStatus(state);
    engineRef.current.onMessageReceived = (msg) => {
      alert(`Mensagem P2P Recebida: ${msg.type}`);
      // Lógica Zero Trust: Aqui processarias o payload recebido e gravavas no IndexedDB
    };
    return () => { 
      engineRef.current?.close();
      engineRef.current = null; 
    };
  }, []);

  const handleCreateHost = async () => {
    setMode('HOST');
    setStatus('A gerar túnel seguro...');
    if (engineRef.current) {
      const offer = await engineRef.current.createOffer();
      setToken(offer);
      setStatus('Aguardando resposta do Guest...');
    }
  };

  const handleJoinGuest = async () => {
    if (!inputToken) return;
    setStatus('A encriptar handshake...');
    if (engineRef.current) {
      const answer = await engineRef.current.acceptOfferAndCreateAnswer(inputToken);
      setToken(answer);
      setStatus('Handshake gerado. Envia o token de volta ao Host.');
    }
  };

  const handleHostAcceptAnswer = async () => {
    if (!inputToken) return;
    if (engineRef.current) {
      await engineRef.current.acceptAnswer(inputToken);
      setStatus('Conectado');
    }
  };

  const handleTestPing = () => {
    engineRef.current?.sendMessage({ type: 'PING', payload: { time: Date.now() } });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(8, 11, 15, 0.9)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: '#080b0f', border: '1px solid rgba(204, 255, 0, 0.2)', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '500px', boxShadow: '0 0 40px rgba(204, 255, 0, 0.05)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ color: '#fff', fontSize: '1.5rem', fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '1px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Share2 color="#ccff00" /> WebRTC Sync (Offline)
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#55626e', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', marginBottom: '24px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: status === 'connected' ? '#00ff88' : status === 'failed' ? '#ff3366' : '#ccff00', boxShadow: `0 0 10px ${status === 'connected' ? '#00ff88' : '#ccff00'}` }} />
          <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Status: {status}</span>
        </div>

        {mode === 'IDLE' && (
          <div style={{ display: 'grid', gap: '16px' }}>
            <button onClick={handleCreateHost} style={{ background: 'linear-gradient(135deg, #ccff00, #a8e000)', color: '#000', padding: '16px', borderRadius: '12px', border: 'none', fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase' }}>
              1. Criar Sessão (Host)
            </button>
            <button onClick={() => setMode('GUEST')} style={{ background: 'rgba(255,255,255,0.05)', color: '#ccff00', border: '1px solid rgba(204, 255, 0, 0.3)', padding: '16px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase' }}>
              2. Juntar-se a Sessão (Guest)
            </button>
          </div>
        )}

        {/* HOST MODE */}
        {mode === 'HOST' && (
          <div style={{ display: 'grid', gap: '16px' }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', margin: 0 }}>Copia este token de segurança e envia para a máquina Guest:</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input readOnly value={token} style={{ flex: 1, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px', borderRadius: '8px', fontSize: '0.75rem', fontFamily: 'monospace' }} />
              <button onClick={() => navigator.clipboard.writeText(token)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', padding: '0 16px', cursor: 'pointer', color: '#ccff00' }}><Copy size={18} /></button>
            </div>
            
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', margin: '16px 0 0 0' }}>Cola aqui a resposta do Guest para abrir o túnel:</p>
            <input value={inputToken} onChange={e => setInputToken(e.target.value)} placeholder="Cola o token de resposta aqui..." style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px', borderRadius: '8px', fontSize: '0.75rem', fontFamily: 'monospace' }} />
            <button onClick={handleHostAcceptAnswer} style={{ background: '#ccff00', color: '#000', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 800, cursor: 'pointer' }}>CONECTAR</button>
          </div>
        )}

        {/* GUEST MODE */}
        {mode === 'GUEST' && (
          <div style={{ display: 'grid', gap: '16px' }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', margin: 0 }}>Cola aqui o token gerado pelo Host:</p>
            <input value={inputToken} onChange={e => setInputToken(e.target.value)} placeholder="Cola o token do Host aqui..." style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px', borderRadius: '8px', fontSize: '0.75rem', fontFamily: 'monospace' }} />
            <button onClick={handleJoinGuest} style={{ background: 'rgba(255,255,255,0.1)', color: '#ccff00', border: '1px solid rgba(204, 255, 0, 0.3)', padding: '12px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>GERAR RESPOSTA</button>

            {token && (
              <>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', margin: '16px 0 0 0' }}>Copia este token de volta para o Host:</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input readOnly value={token} style={{ flex: 1, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px', borderRadius: '8px', fontSize: '0.75rem', fontFamily: 'monospace' }} />
                  <button onClick={() => navigator.clipboard.writeText(token)} style={{ background: '#ccff00', border: 'none', borderRadius: '8px', padding: '0 16px', cursor: 'pointer', color: '#000' }}><Copy size={18} /></button>
                </div>
              </>
            )}
          </div>
        )}

        {status === 'connected' && (
          <button onClick={handleTestPing} style={{ width: '100%', background: '#00ff88', color: '#000', padding: '16px', borderRadius: '12px', border: 'none', fontWeight: 800, cursor: 'pointer', marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <LinkIcon size={20} /> ENVIAR PING DE TESTE
          </button>
        )}

      </div>
    </div>
  );
};
