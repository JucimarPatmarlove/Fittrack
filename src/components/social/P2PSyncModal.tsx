import React, { useState, useEffect, useRef } from 'react';
import { Share2, Link as LinkIcon, Copy } from 'lucide-react';
import { WebRTCEngine, WebRTCMessage } from '../../services/webrtcEngine';
import { getAllWorkouts } from '../../db/schema';
import { saveWorkoutSession } from '../../db/encryptedDb';
// Imports removidos devido a restrições de rede offline
// import { QRCodeCanvas } from 'qrcode.react';
// import { Scanner } from '@yudiel/react-qr-scanner';

const QRCodeCanvas = ({ value }: { value: string }) => (
  <div style={{ padding: '20px', border: '1px dashed #ccc', textAlign: 'center', background: '#fff', color: '#000' }}>
    <p>QR Code (Offline Mode)</p>
    <code style={{ fontSize: '10px', wordBreak: 'break-all' }}>{value}</code>
  </div>
);

const Scanner = ({ onScan }: { onScan: (res: any) => void }) => (
  <div style={{ padding: '20px', textAlign: 'center', background: '#333', color: '#fff' }}>
    <p>Scanner Desativado (Offline Mode)</p>
    <button onClick={() => {
      const manualToken = prompt('Insira o token manualmente:');
      if (manualToken) onScan([{ rawValue: manualToken }]);
    }} style={{ padding: '8px', background: '#ccff00', color: '#000' }}>
      Inserir Token Manual
    </button>
  </div>
);

export const P2PSyncModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [mode, setMode] = useState<'IDLE' | 'HOST' | 'GUEST'>('IDLE');
  const [token, setToken] = useState('');
  const [inputToken, setInputToken] = useState('');
  const [status, setStatus] = useState<string>('Desconectado');
  
  const engineRef = useRef<WebRTCEngine | null>(null);

  useEffect(() => {
    engineRef.current = new WebRTCEngine();
    engineRef.current.onConnectionStateChange = (state) => setStatus(state);
    engineRef.current.onMessageReceived = async (msg: WebRTCMessage) => {
      if (msg.type === 'PING') {
        const latency = Date.now() - msg.payload.time;
        alert(`[P2P] Ping recebido! Latência: ${latency}ms`);
      } 
      else if (msg.type === 'SYNC_WORKOUT') {
        const incomingWorkout = msg.payload;
        try {
          await saveWorkoutSession(incomingWorkout); // cifra se PIN activo
          window.dispatchEvent(new CustomEvent('workout-synced'));
          alert(`[P2P] Treino Sincronizado com Sucesso: ${incomingWorkout.name}`);
        } catch (e) {
          console.error('[P2P] Falha ao guardar treino recebido:', e);
        }
      }
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

  const handlePushLatestWorkout = async () => {
    try {
      const history = await getAllWorkouts();
      const latestWorkout = history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

      if (!latestWorkout) {
        alert('Nenhum treino disponível para sincronizar.');
        return;
      }

      engineRef.current?.sendMessage({ 
        type: 'SYNC_WORKOUT', 
        payload: latestWorkout 
      });
      
      setStatus(`Treino '${latestWorkout.name}' enviado!`);
    } catch (e) {
      console.error(e);
      alert('Erro ao ler a base de dados para sincronização.');
    }
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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', textAlign: 'center', margin: 0 }}>Pede ao Guest para ler este código:</p>
            
            {token ? (
              <div style={{ padding: '16px', background: '#fff', borderRadius: '12px', boxShadow: '0 0 20px rgba(204,255,0,0.3)' }}>
                <QRCodeCanvas 
                  value={token} 
                  size={200} 
                  fgColor="#000000" 
                  bgColor="#ffffff" 
                  level="L" 
                />
              </div>
            ) : (
              <div style={{ width: '200px', height: '200px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }} />
            )}
            
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', textAlign: 'center', marginTop: '16px', marginBottom: 0 }}>A aguardar resposta do Guest...</p>
            <input 
              value={inputToken} 
              onChange={e => setInputToken(e.target.value)} 
              placeholder="Cola o token do Guest..." 
              style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px', borderRadius: '8px', fontSize: '10px', fontFamily: 'monospace' }} 
            />
            <button 
              onClick={handleHostAcceptAnswer} 
              style={{ width: '100%', background: '#ccff00', color: '#000', fontWeight: 800, textTransform: 'uppercase', padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
            >
              Conectar
            </button>
          </div>
        )}

        {/* GUEST MODE */}
        {mode === 'GUEST' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            {!token ? (
              <>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', textAlign: 'center', margin: 0 }}>Aponta a câmara para o código do Host:</p>
                <div style={{ width: '100%', maxWidth: '250px', aspectRatio: '1/1', borderRadius: '12px', overflow: 'hidden', border: '2px solid #ccff00' }}>
                  <Scanner 
                    onScan={(result) => {
                      if (result && result.length > 0) {
                        const val = result[0].rawValue;
                        setInputToken(val);
                        // Gerar handshake auto
                        (async () => {
                          setStatus('A encriptar handshake...');
                          if (engineRef.current) {
                            try {
                              const answer = await engineRef.current.acceptOfferAndCreateAnswer(val);
                              setToken(answer);
                              setStatus('Handshake gerado. Envia o token de volta ao Host.');
                            } catch (e) {
                              setStatus('Erro ao processar código QR.');
                            }
                          }
                        })();
                      }
                    }}
                    components={{ audio: false, finder: false }} 
                  />
                </div>
              </>
            ) : (
              <>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', textAlign: 'center', margin: 0 }}>Resposta gerada. Mostra ou envia isto ao Host:</p>
                <div style={{ padding: '16px', background: '#fff', borderRadius: '12px', boxShadow: '0 0 20px rgba(204,255,0,0.3)' }}>
                  <QRCodeCanvas value={token} size={200} fgColor="#000000" bgColor="#ffffff" level="L" />
                </div>
                <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '8px' }}>
                   <button onClick={() => navigator.clipboard.writeText(token)} style={{ flex: 1, background: 'rgba(255,255,255,0.1)', color: '#ccff00', padding: '8px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>Copiar Resposta</button>
                </div>
              </>
            )}
          </div>
        )}

        {status === 'connected' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '24px' }}>
            <button 
              onClick={handleTestPing} 
              style={{ width: '100%', background: 'rgba(0,255,136,0.1)', color: '#00ff88', padding: '16px', borderRadius: '12px', border: '1px solid rgba(0,255,136,0.3)', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textTransform: 'uppercase' }}
            >
              Ping de Rede
            </button>
            <button 
              onClick={handlePushLatestWorkout} 
              style={{ width: '100%', background: '#ccff00', color: '#000', padding: '16px', borderRadius: '12px', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textTransform: 'uppercase', boxShadow: '0 0 15px rgba(204,255,0,0.3)' }}
            >
              <Share2 size={20} /> Push Último Treino
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
