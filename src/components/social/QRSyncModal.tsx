import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { p2pSync, SyncData } from '../../services/p2pSync';

interface QRSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'send' | 'receive';
  dataToSend?: SyncData;               // Quando send, o objeto a transferir
  onDataReceived?: (data: SyncData) => void; // Quando receive, callback com os dados
}

export const QRSyncModal: React.FC<QRSyncModalProps> = ({
  isOpen, onClose, mode, dataToSend, onDataReceived
}) => {
  const [step, setStep] = useState<'init' | 'qr' | 'scan' | 'connecting' | 'connected' | 'error'>('init');
  const [qrData, setQrData] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!isOpen) {
      p2pSync.disconnect();
      setStep('init');
      setQrData('');
      setErrorMsg('');
    }
  }, [isOpen]);

  const startSend = async () => {
    setStep('qr');
    try {
      const offer = await p2pSync.createOffer();
      const payload = JSON.stringify({
        type: 'fittrack-offer',
        offer,
        peerId: p2pSync.getLocalId(),
      });
      setQrData(payload);
      p2pSync.onConnectionStateChange((connected) => {
        if (connected) setStep('connected');
      });
      p2pSync.onData((data) => {
        console.log('[P2P] Data received during send?', data);
      });
    } catch (err) {
      setErrorMsg('Falha ao gerar oferta P2P');
      setStep('error');
    }
  };

  const startReceive = () => {
    setStep('scan');
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(err => {
        setErrorMsg('Acesso à câmara indisponível. Cole o código.');
        setStep('scan'); // stay on scan to show text input fallback
      });
  };

  const simulateScan = () => {
    const scannedText = prompt('Cole o texto do QR code (oferta ou resposta):');
    if (scannedText) processQrData(scannedText);
  };

  const processQrData = async (scanned: string) => {
    try {
      const data = JSON.parse(scanned);
      
      if (data.type === 'fittrack-offer') {
        setStep('connecting');
        const answer = await p2pSync.acceptOffer(data.offer);
        const answerPayload = JSON.stringify({
           type: 'fittrack-answer',
           answer,
           peerId: p2pSync.getLocalId()
        });
        
        // Show answer QR code to the sender so they can complete handshake
        setQrData(answerPayload);
        setStep('qr');
        
        p2pSync.onData((syncData) => {
          onDataReceived?.(syncData);
          setStep('connected');
          setTimeout(() => onClose(), 1500);
        });

      } else if (data.type === 'fittrack-answer') {
        // We are the sender, we received the answer
        setStep('connecting');
        await p2pSync.completeConnection(data.answer);
      } else {
        throw new Error('Formato inválido');
      }
    } catch (err) {
      setErrorMsg('Código P2P inválido');
      setStep('error');
    }
  };

  useEffect(() => {
    if (step === 'connected' && mode === 'send' && dataToSend) {
      p2pSync.sendData(dataToSend);
    }
  }, [step, mode, dataToSend]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(16px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px',
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            style={{
              maxWidth: '500px', width: '100%',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '24px', padding: '24px',
              backdropFilter: 'blur(20px)',
            }}
          >
            <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 24, color: '#e8c84a', marginBottom: 16 }}>
              {mode === 'send' ? '📤 PARTILHAR TREINO' : '📥 RECEBER TREINO'}
            </h2>

            {step === 'init' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <p style={{ color: '#ccc', fontSize: 14 }}>
                  {mode === 'send'
                    ? '1. Gera o código.\n2. O teu parceiro lê com a câmara.\n3. Lê a resposta dele.'
                    : '1. Lê o código do teu parceiro.\n2. Mostra a tua resposta para ele ler.'}
                </p>
                <button
                  onClick={mode === 'send' ? startSend : startReceive}
                  style={{ background: '#e8c84a', color: '#000', padding: 12, borderRadius: 8, fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
                >
                  {mode === 'send' ? 'Gerar Oferta P2P' : 'Abrir Câmara'}
                </button>
              </div>
            )}

            {step === 'qr' && qrData && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ background: '#fff', padding: 16, borderRadius: 8, display: 'inline-block', marginBottom: 16, width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{color: '#000', fontSize: 10, wordBreak: 'break-all'}}>{qrData.substring(0, 100)}...</p>
                </div>
                <p style={{ fontSize: 12, color: '#aaa', marginBottom: 8 }}>
                  O outro dispositivo deve ler este código para estabelecer a ligação.
                </p>
                {mode === 'send' && (
                  <button onClick={simulateScan} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12 }}>
                    Ler Resposta do Parceiro
                  </button>
                )}
              </div>
            )}

            {step === 'scan' && (
              <div>
                <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: 8, marginBottom: 16 }} />
                <button onClick={simulateScan} style={{ background: 'rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: 8, width: '100%', color: '#fff', border: 'none', cursor: 'pointer' }}>
                  Simular Leitura (Colar Código Manual)
                </button>
              </div>
            )}

            {step === 'connecting' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ margin: '0 auto 16px auto', width: 32, height: 32, border: '3px solid rgba(232,200,74,0.3)', borderTopColor: '#e8c84a', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <p style={{ color: '#ccc' }}>A estabelecer ligação segura P2P...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {step === 'connected' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
                <p style={{ color: '#e8c84a', fontWeight: 'bold' }}>Transferência concluída!</p>
              </div>
            )}

            {step === 'error' && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#ff3366', marginBottom: 16 }}>{errorMsg}</p>
                <button onClick={() => setStep('init')} style={{ background: 'rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: 8, color: '#fff', border: 'none', cursor: 'pointer' }}>
                  Tentar novamente
                </button>
              </div>
            )}

            <button onClick={onClose} style={{ marginTop: 24, color: '#888', background: 'none', border: 'none', fontSize: 14, width: '100%', cursor: 'pointer' }}>
              FECHAR CANAL P2P
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
