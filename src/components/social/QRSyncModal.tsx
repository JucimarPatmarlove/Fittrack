import { AnimatePresence, motion } from 'framer-motion';
// src/components/social/QRSyncModal.tsx
import type React from 'react';
import { useEffect, useState } from 'react';
import { C } from '../../data/constants';
import { type SyncData, p2pSync } from '../../services/p2pSync';

interface QRSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'send' | 'receive';
  dataToSend?: SyncData;
  onDataReceived?: (data: SyncData) => void;
}

export const QRSyncModal: React.FC<QRSyncModalProps> = ({
  isOpen,
  onClose,
  mode,
  dataToSend,
  onDataReceived,
}) => {
  const [step, setStep] = useState<
    'init' | 'show-code' | 'enter-code' | 'connecting' | 'connected' | 'error'
  >('init');
  const [peerCode, setPeerCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
      if (i === 2) code += '-';
    }
    return code;
  };

  const startSend = async () => {
    const code = generateCode();
    setPeerCode(code);
    setStep('show-code');
    try {
      const offer = await p2pSync.createOffer();
      localStorage.setItem(`p2p_offer_${code}`, JSON.stringify(offer));
    } catch (_e) {
      setErrorMsg('Falha ao gerar oferta P2P');
      setStep('error');
    }
  };

  const startReceive = () => {
    setStep('enter-code');
  };

  const handleConnect = async () => {
    if (enteredCode.length < 7) {
      setErrorMsg('Código inválido. Ex: A1B-2C3');
      setStep('error');
      return;
    }
    const code = enteredCode.trim().toUpperCase();
    const storedOffer = localStorage.getItem(`p2p_offer_${code}`);
    if (!storedOffer) {
      setErrorMsg('Código não encontrado ou expirado.');
      setStep('error');
      return;
    }

    try {
      const offer = JSON.parse(storedOffer);
      setStep('connecting');
      const answer = await p2pSync.acceptOffer(offer);
      localStorage.setItem(`p2p_answer_${code}`, JSON.stringify(answer));

      // Notificar localmente (se for na mesma tab, o storage event cuida, mas enviamos CustomEvent para segurança)
      window.dispatchEvent(new CustomEvent('p2p-answer-ready', { detail: { code, answer } }));

      p2pSync.onData((data) => {
        onDataReceived?.(data);
        setStep('connected');
        setTimeout(() => onClose(), 1500);
      });
    } catch (_e) {
      setErrorMsg('Falha ao conectar.');
      setStep('error');
    }
  };

  useEffect(() => {
    if (!isOpen) {
      p2pSync.disconnect();
      setStep('init');
      setPeerCode('');
      setEnteredCode('');
      setErrorMsg('');
    }
  }, [isOpen]);

  // Event listener local (tab actual)
  useEffect(() => {
    const handleAnswerReady = (event: any) => {
      const { code, answer } = event.detail;
      if (code === peerCode && step === 'show-code') {
        p2pSync.completeConnection(answer);
        if (dataToSend) p2pSync.sendData(dataToSend);
        setStep('connected');
        setTimeout(() => onClose(), 1500);
      }
    };
    window.addEventListener('p2p-answer-ready', handleAnswerReady);
    return () => window.removeEventListener('p2p-answer-ready', handleAnswerReady);
  }, [peerCode, step, dataToSend, onClose]);

  // Polling via localStorage (para cruzar tabs ou dispositivos no mesmo browser)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (mode === 'send' && step === 'show-code' && peerCode) {
      interval = setInterval(async () => {
        const storedAnswer = localStorage.getItem(`p2p_answer_${peerCode}`);
        if (storedAnswer) {
          try {
            const answer = JSON.parse(storedAnswer);
            await p2pSync.completeConnection(answer);
            if (dataToSend) p2pSync.sendData(dataToSend);
            setStep('connected');
            clearInterval(interval);
            setTimeout(() => onClose(), 1500);
          } catch (_e) { /* Non-critical P2P parse failure */ }
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [mode, step, peerCode, dataToSend, onClose]);

  // Trigger send data when connected and mode is send
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
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0,0,0,0.9)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            style={{
              maxWidth: '500px',
              width: '100%',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '24px',
              padding: '24px',
              backdropFilter: 'blur(20px)',
            }}
          >
            <h2
              style={{
                fontFamily: "'Bebas Neue'",
                fontSize: 24,
                color: C.accent,
                marginBottom: 16,
              }}
            >
              {mode === 'send' ? '📤 PARTILHAR TREINO' : '📥 RECEBER TREINO'}
            </h2>

            {step === 'init' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <p style={{ color: C.muted, fontSize: 14 }}>
                  {mode === 'send'
                    ? '1. Gera um código de partilha.\n2. O parceiro introduz o código no seu dispositivo.\n3. A ligação P2P inicia automaticamente.'
                    : 'Pede ao teu parceiro para gerar um código e introdu-lo abaixo.'}
                </p>
                <button
                  onClick={mode === 'send' ? startSend : startReceive}
                  style={{
                    background: C.accent,
                    color: '#000',
                    padding: 12,
                    borderRadius: 8,
                    fontWeight: 'bold',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {mode === 'send' ? 'Gerar Código P2P' : 'Introduzir Código'}
                </button>
              </div>
            )}

            {step === 'show-code' && peerCode && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 14, color: C.muted, marginBottom: 8 }}>
                  Partilha este código com o outro dispositivo:
                </p>
                <div
                  style={{
                    background: 'rgba(0,0,0,0.6)',
                    padding: 16,
                    borderRadius: 8,
                    display: 'inline-block',
                    marginBottom: 16,
                    border: `1px solid ${C.accent}44`,
                  }}
                >
                  <p
                    style={{
                      color: C.accent,
                      fontSize: 32,
                      letterSpacing: 4,
                      margin: 0,
                      fontFamily: "'DM Mono'",
                    }}
                  >
                    {peerCode}
                  </p>
                </div>
                <p style={{ fontSize: 12, color: C.muted }}>A aguardar conexão do parceiro...</p>
                <div
                  style={{
                    marginTop: 16,
                    width: 24,
                    height: 24,
                    border: `2px solid ${C.border}`,
                    borderTopColor: C.accent,
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    display: 'inline-block',
                  }}
                />
              </div>
            )}

            {step === 'enter-code' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input
                  type="text"
                  placeholder="Ex: A1B-2C3"
                  value={enteredCode}
                  onChange={(e) => setEnteredCode(e.target.value.toUpperCase())}
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.4)',
                    border: `1px solid ${C.accent}`,
                    borderRadius: 8,
                    padding: 16,
                    color: '#fff',
                    fontSize: 20,
                    textAlign: 'center',
                    letterSpacing: 2,
                    fontFamily: "'DM Mono'",
                  }}
                />
                <button
                  onClick={handleConnect}
                  style={{
                    background: C.accent,
                    color: '#000',
                    padding: 12,
                    borderRadius: 8,
                    fontWeight: 'bold',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Conectar
                </button>
              </div>
            )}

            {step === 'connecting' && (
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    margin: '0 auto 16px auto',
                    width: 32,
                    height: 32,
                    border: `3px solid ${C.border}`,
                    borderTopColor: C.accent,
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }}
                />
                <p style={{ color: C.muted }}>A estabelecer ligação segura P2P...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {step === 'connected' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
                <p style={{ color: C.accent, fontWeight: 'bold' }}>Transferência concluída!</p>
              </div>
            )}

            {step === 'error' && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: C.red, marginBottom: 16 }}>{errorMsg}</p>
                <button
                  onClick={() => setStep('init')}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    padding: '8px 16px',
                    borderRadius: 8,
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Tentar novamente
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              style={{
                marginTop: 24,
                color: C.muted,
                background: 'none',
                border: 'none',
                fontSize: 14,
                width: '100%',
                cursor: 'pointer',
                fontFamily: "'Bebas Neue'",
                letterSpacing: 1,
              }}
            >
              FECHAR CANAL P2P
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
