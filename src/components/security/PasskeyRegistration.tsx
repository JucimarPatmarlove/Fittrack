import { motion } from 'framer-motion';
import { useState } from 'react';
import { C } from '../../data/constants';
import { registerPasskey } from '../../lib/supabaseBrowser';
import { deriveRawKeyBase64 } from '../../utils/cryptoEngine';

export function PasskeyRegistration() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'input' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [pin, setPin] = useState('');

  const handleStart = () => setStatus('input');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) {
      setErrorMsg('PIN inválido');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Derivar a raw key AES a partir do PIN inserido
      const rawKeyString = await deriveRawKeyBase64(pin);

      // 2. Chamar o serviço do Supabase que invoca o WebAuthn e guarda a AES key no metadata
      const success = await registerPasskey(rawKeyString);
      
      if (success) {
        setStatus('success');
      } else {
        throw new Error('Falha ao registar credencial biométrica no servidor.');
      }
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.message || 'PIN incorreto ou dispositivo incompatível.');
    } finally {
      setLoading(false);
      setPin('');
    }
  };

  return (
    <div style={{
      background: C.surface,
      borderRadius: 16,
      padding: 24,
      border: `1px solid ${status === 'success' ? '#10b981' : 'rgba(255,255,255,0.05)'}`,
      marginBottom: 24
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: 18, color: C.text, fontFamily: "'Bebas Neue'", letterSpacing: 1 }}>
            Autenticação Biométrica
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: C.muted, lineHeight: 1.5, maxWidth: '90%' }}>
            Configura o FaceID, TouchID ou Windows Hello para desbloqueares o FitTrack instantaneamente, sem precisares do PIN de 4 dígitos.
          </p>
        </div>
        <div style={{ fontSize: 32, opacity: 0.8 }}>
          {status === 'success' ? '✅' : '🛡️'}
        </div>
      </div>

      {status === 'error' && (
        <div style={{ background: 'rgba(232,74,74,0.1)', padding: 12, borderRadius: 8, marginBottom: 16 }}>
          <p style={{ margin: 0, fontSize: 12, color: '#fca5a5' }}>⚠️ {errorMsg}</p>
        </div>
      )}

      {status === 'success' ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p style={{ margin: 0, fontSize: 14, color: '#10b981', fontWeight: 500 }}>
            Passkey registada com sucesso! Na próxima sessão podes usar a tua biometria.
          </p>
        </motion.div>
      ) : status === 'input' ? (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          <form onSubmit={handleRegister} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
              maxLength={6}
              placeholder="Confirma o PIN"
              style={{
                flex: 1,
                background: 'rgba(0,0,0,0.2)',
                border: `1px solid ${C.accent}`,
                borderRadius: 8,
                padding: '12px 16px',
                color: C.text,
                fontSize: 16,
                letterSpacing: 4,
              }}
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || pin.length < 4}
              style={{
                background: loading ? 'rgba(255,255,255,0.1)' : C.accent,
                color: loading ? C.muted : '#000',
                border: 'none',
                borderRadius: 8,
                padding: '12px 24px',
                fontFamily: "'Bebas Neue'",
                fontSize: 16,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'AGUARDA...' : 'CONFIRMAR'}
            </button>
          </form>
        </motion.div>
      ) : (
        <button
          onClick={handleStart}
          style={{
            background: 'transparent',
            color: C.accent,
            border: `1px solid ${C.accent}`,
            borderRadius: 8,
            padding: '10px 20px',
            fontFamily: "'Bebas Neue'",
            fontSize: 16,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          ATIVAR PASSKEY
        </button>
      )}
    </div>
  );
}

