import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { C } from '../../data/constants';
import { deriveKey, decryptData } from '../../utils/cryptoEngine';
import { rotateMasterKey, RotationProgress } from '../../services/keyRotationService';
import { migrateLocalStorageToEncrypted, SENSITIVE_STORE_NAMES } from '../../stores/encryptedPersist';

interface LockScreenProps {
  onUnlock: (key: CryptoKey) => void;
  isFirstTime: boolean;
}

type ScreenMode = 'unlock' | 'change-pin';

export function LockScreen({ onUnlock, isFirstTime }: LockScreenProps) {
  // ── Estado de ecrã ──────────────────────────────────────────────────────────
  const [mode, setMode] = useState<ScreenMode>('unlock');

  // ── Desbloqueio ─────────────────────────────────────────────────────────────
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Mudança de PIN ──────────────────────────────────────────────────────────
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [rotationProgress, setRotationProgress] = useState<RotationProgress | null>(null);
  const [rotationSuccess, setRotationSuccess] = useState(false);

  // ── Handler: Desbloquear ────────────────────────────────────────────────────
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) {
      setError('O PIN deve ter pelo menos 4 dígitos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const key = await deriveKey(pin);

      if (!isFirstTime) {
        const encryptedProfile = localStorage.getItem('fit_profile_enc');
        if (encryptedProfile) {
          await decryptData(key, encryptedProfile);
        }
      }

      await migrateLocalStorageToEncrypted(key, [...SENSITIVE_STORE_NAMES]);
      
      onUnlock(key);
    } catch {
      setError('PIN incorreto ou dados corrompidos');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  // ── Handler: Rotação de PIN ─────────────────────────────────────────────────
  const handleRotation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (oldPin.length < 4 || newPin.length < 4) {
      setError('Ambos os PINs devem ter pelo menos 4 dígitos');
      return;
    }
    if (newPin !== confirmPin) {
      setError('O novo PIN e a confirmação não coincidem');
      return;
    }

    setLoading(true);
    setError('');
    setRotationSuccess(false);

    try {
      await rotateMasterKey(oldPin, newPin, (progress) => {
        setRotationProgress(progress);
      });
      setRotationSuccess(true);
      setOldPin('');
      setNewPin('');
      setConfirmPin('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido na rotação');
    } finally {
      setLoading(false);
      setRotationProgress(null);
    }
  };

  // ── UI: Ecrã de Desbloqueio ─────────────────────────────────────────────────
  if (mode === 'unlock') {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ maxWidth: 320, width: '100%', textAlign: 'center' }}>
          <span style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>🔒</span>
          <h1 style={{ fontFamily: "'Bebas Neue'", fontSize: 32, letterSpacing: 2, color: C.accent, marginBottom: 8 }}>
            {isFirstTime ? 'CONFIGURAR PIN' : 'DESBLOQUEAR'}
          </h1>
          <p style={{ color: C.muted, fontSize: 13, marginBottom: 24 }}>
            {isFirstTime
              ? 'Cria um PIN para encriptar os teus dados de treino e API Keys localmente.'
              : 'Insere o teu PIN para aceder aos teus dados encriptados.'}
          </p>

          <form onSubmit={handleUnlock}>
            <input
              id="pin-input"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
              maxLength={6}
              placeholder="****"
              autoFocus
              style={{
                width: '100%',
                background: C.surface,
                border: `2px solid ${error ? '#e84a4a' : C.accent}`,
                borderRadius: 12,
                padding: 16,
                color: C.text,
                fontSize: 24,
                textAlign: 'center',
                letterSpacing: 8,
                marginBottom: 16,
                boxSizing: 'border-box',
              }}
            />

            {error && <p style={{ color: '#e84a4a', fontSize: 12, marginBottom: 16 }}>{error}</p>}

            <button
              id="btn-unlock"
              type="submit"
              disabled={loading || pin.length < 4}
              style={{
                width: '100%',
                background: C.accent,
                color: '#000',
                border: 'none',
                borderRadius: 12,
                padding: 16,
                fontFamily: "'Bebas Neue'",
                fontSize: 20,
                letterSpacing: 2,
                cursor: loading || pin.length < 4 ? 'not-allowed' : 'pointer',
                opacity: loading || pin.length < 4 ? 0.5 : 1,
              }}
            >
              {loading ? 'A VERIFICAR...' : isFirstTime ? 'ENCRIPTAR DISCO' : 'DESBLOQUEAR'}
            </button>
          </form>

          {/* Link para mudar PIN — só se não for primeira vez */}
          {!isFirstTime && (
            <button
              id="btn-change-pin"
              onClick={() => { setMode('change-pin'); setError(''); setPin(''); }}
              style={{
                marginTop: 20,
                background: 'transparent',
                border: 'none',
                color: C.muted,
                fontSize: 12,
                cursor: 'pointer',
                textDecoration: 'underline',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              🔑 Mudar PIN
            </button>
          )}
        </motion.div>
      </div>
    );
  }

  // ── UI: Ecrã de Mudança de PIN ──────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <motion.div
        key="change-pin"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        style={{ maxWidth: 320, width: '100%', textAlign: 'center' }}
      >
        <span style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>🔑</span>
        <h1 style={{ fontFamily: "'Bebas Neue'", fontSize: 28, letterSpacing: 2, color: C.accent, marginBottom: 8 }}>
          MUDAR PIN
        </h1>
        <p style={{ color: C.muted, fontSize: 12, marginBottom: 24, lineHeight: 1.5 }}>
          O processo re-cifra todos os teus dados com o novo PIN.<br />
          Não percas o novo PIN — não existe recuperação.
        </p>

        <AnimatePresence mode="wait">
          {rotationSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                padding: 20,
                borderRadius: 12,
                background: 'rgba(56,176,0,0.1)',
                border: '1px solid rgba(56,176,0,0.4)',
                marginBottom: 20,
              }}
            >
              <span style={{ fontSize: 32, display: 'block', marginBottom: 8 }}>✅</span>
              <p style={{ color: '#38b000', fontWeight: 'bold', margin: 0 }}>PIN alterado com sucesso!</p>
              <p style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>Todos os dados foram re-cifrados.</p>
            </motion.div>
          ) : (
            <form key="form" onSubmit={handleRotation}>
              {/* PIN antigo */}
              <div style={{ marginBottom: 12, textAlign: 'left' }}>
                <label style={{ fontSize: 11, color: C.muted, letterSpacing: 1, display: 'block', marginBottom: 6 }}>
                  PIN ACTUAL
                </label>
                <input
                  id="old-pin-input"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={oldPin}
                  onChange={(e) => setOldPin(e.target.value.replace(/[^0-9]/g, ''))}
                  maxLength={6}
                  placeholder="PIN actual"
                  disabled={loading}
                  style={{
                    width: '100%',
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    padding: '12px 16px',
                    color: C.text,
                    fontSize: 18,
                    textAlign: 'center',
                    letterSpacing: 6,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Novo PIN */}
              <div style={{ marginBottom: 12, textAlign: 'left' }}>
                <label style={{ fontSize: 11, color: C.muted, letterSpacing: 1, display: 'block', marginBottom: 6 }}>
                  NOVO PIN
                </label>
                <input
                  id="new-pin-input"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, ''))}
                  maxLength={6}
                  placeholder="Novo PIN"
                  disabled={loading}
                  style={{
                    width: '100%',
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    padding: '12px 16px',
                    color: C.text,
                    fontSize: 18,
                    textAlign: 'center',
                    letterSpacing: 6,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Confirmar PIN */}
              <div style={{ marginBottom: 20, textAlign: 'left' }}>
                <label style={{ fontSize: 11, color: C.muted, letterSpacing: 1, display: 'block', marginBottom: 6 }}>
                  CONFIRMAR NOVO PIN
                </label>
                <input
                  id="confirm-pin-input"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/[^0-9]/g, ''))}
                  maxLength={6}
                  placeholder="Repetir PIN"
                  disabled={loading}
                  style={{
                    width: '100%',
                    background: C.surface,
                    border: `1px solid ${confirmPin && confirmPin !== newPin ? '#e84a4a' : C.border}`,
                    borderRadius: 8,
                    padding: '12px 16px',
                    color: C.text,
                    fontSize: 18,
                    textAlign: 'center',
                    letterSpacing: 6,
                    boxSizing: 'border-box',
                  }}
                />
                {confirmPin && confirmPin !== newPin && (
                  <p style={{ color: '#e84a4a', fontSize: 11, marginTop: 4 }}>Os PINs não coincidem</p>
                )}
              </div>

              {/* Barra de progresso durante rotação */}
              {rotationProgress && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ marginBottom: 16 }}
                >
                  <p style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>{rotationProgress.message}</p>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                    <motion.div
                      animate={{ width: `${rotationProgress.progress || 0}%` }}
                      transition={{ type: 'spring', stiffness: 50 }}
                      style={{ height: '100%', background: C.accent, borderRadius: 2 }}
                    />
                  </div>
                </motion.div>
              )}

              {error && (
                <p style={{ color: '#e84a4a', fontSize: 12, marginBottom: 16, textAlign: 'left' }}>
                  ⚠️ {error}
                </p>
              )}

              <button
                id="btn-confirm-rotation"
                type="submit"
                disabled={loading || oldPin.length < 4 || newPin.length < 4 || newPin !== confirmPin}
                style={{
                  width: '100%',
                  background: loading ? 'rgba(232,200,74,0.3)' : C.accent,
                  color: '#000',
                  border: 'none',
                  borderRadius: 12,
                  padding: 14,
                  fontFamily: "'Bebas Neue'",
                  fontSize: 18,
                  letterSpacing: 2,
                  cursor: loading || newPin !== confirmPin ? 'not-allowed' : 'pointer',
                  opacity: loading || oldPin.length < 4 || newPin.length < 4 || newPin !== confirmPin ? 0.5 : 1,
                  transition: 'all 0.2s',
                }}
              >
                {loading ? 'A RE-CIFRAR DADOS...' : '🔐 ALTERAR PIN'}
              </button>
            </form>
          )}
        </AnimatePresence>

        <button
          id="btn-back-to-unlock"
          onClick={() => { setMode('unlock'); setError(''); setOldPin(''); setNewPin(''); setConfirmPin(''); setRotationSuccess(false); }}
          style={{
            marginTop: 16,
            background: 'transparent',
            border: 'none',
            color: C.muted,
            fontSize: 12,
            cursor: 'pointer',
            textDecoration: 'underline',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          ← Voltar ao desbloqueio
        </button>
      </motion.div>
    </div>
  );
}
