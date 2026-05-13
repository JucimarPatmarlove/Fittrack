import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { C } from '../../data/constants';
import { deriveKey, decryptData } from '../../utils/cryptoEngine';

interface LockScreenProps {
  onUnlock: (key: CryptoKey) => void;
  isFirstTime: boolean;
}

export function LockScreen({ onUnlock, isFirstTime }: LockScreenProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
        // Verify key against a known encrypted value (e.g. testing profile decryption)
        const encryptedProfile = localStorage.getItem('fit_profile_enc');
        if (encryptedProfile) {
            await decryptData(key, encryptedProfile);
        }
      }
      
      // Save a hashed version of the pin or just flag that it's unlocked
      // For Zero Trust, we just hold the key in memory in App.tsx
      onUnlock(key);
    } catch (err) {
      setError('PIN incorreto ou dados corrompidos');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ maxWidth: 320, width: '100%', textAlign: 'center' }}>
        <span style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>🔒</span>
        <h1 style={{ fontFamily: "'Bebas Neue'", fontSize: 32, letterSpacing: 2, color: C.accent, marginBottom: 8 }}>
          {isFirstTime ? "CONFIGURAR PIN" : "DESBLOQUEAR"}
        </h1>
        <p style={{ color: C.muted, fontSize: 13, marginBottom: 24 }}>
          {isFirstTime ? "Cria um PIN para encriptar os teus dados de treino e API Keys localmente." : "Insere o teu PIN para aceder aos teus dados encriptados."}
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
            maxLength={6}
            placeholder="****"
            style={{ 
              width: '100%', 
              background: C.surface, 
              border: `2px solid ${error ? C.red : C.accent}`, 
              borderRadius: 12, 
              padding: 16, 
              color: C.text, 
              fontSize: 24, 
              textAlign: 'center',
              letterSpacing: 8,
              marginBottom: 16
            }}
          />
          
          {error && <p style={{ color: C.red, fontSize: 12, marginBottom: 16 }}>{error}</p>}
          
          <button 
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
              cursor: (loading || pin.length < 4) ? 'not-allowed' : 'pointer',
              opacity: (loading || pin.length < 4) ? 0.5 : 1
            }}
          >
            {loading ? "A VERIFICAR..." : isFirstTime ? "ENCRIPTAR DISCO" : "DESBLOQUEAR"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
