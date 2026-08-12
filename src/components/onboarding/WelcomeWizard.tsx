import { AnimatePresence, motion } from 'framer-motion';
import type React from 'react';
import { useState } from 'react';
import { C } from '../../data/constants';
import {
  SENSITIVE_STORE_NAMES,
  migrateLocalStorageToEncrypted,
} from '../../stores/encryptedPersist';
import type { UserProfile } from '../../types';
import { deriveKey } from '../../utils/cryptoEngine';

interface WelcomeWizardProps {
  onComplete: (key: CryptoKey) => void;
  profile: UserProfile;
  setProfile: (profile: UserProfile) => void;
  onClearMocks: () => void;
}

export const WelcomeWizard: React.FC<WelcomeWizardProps> = ({
  onComplete,
  profile,
  setProfile,
  onClearMocks,
}) => {
  const [step, setStep] = useState(1);
  const [selectedGoal, setSelectedGoal] = useState<string>(profile.goal || 'hipertrofia');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const nextStep = () => setStep((s) => s + 1);

  const handleGoalSelect = (goal: string) => {
    setSelectedGoal(goal);
    setProfile({ ...profile, goal });
  };

  const handlePurge = () => {
    onClearMocks();
    nextStep();
  };

  const handleFinalize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) {
      setError('O PIN deve ter pelo menos 4 dígitos.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const key = await deriveKey(pin);
      await migrateLocalStorageToEncrypted(key, [...SENSITIVE_STORE_NAMES]);

      // Marca inicialização
      localStorage.setItem('fittrack_initialized', Date.now().toString());
      sessionStorage.setItem('fittrack_session_unlocked', 'true');

      onComplete(key);
    } catch (_err) {
      setError('Erro ao encriptar a base de dados. Tenta novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: C.bg,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}
          >
            <h1
              style={{
                fontFamily: "'Bebas Neue'",
                fontSize: 36,
                color: C.accent,
                letterSpacing: 2,
              }}
            >
              BEM-VINDO AO FITTRACK V7
            </h1>
            <p style={{ color: C.muted, fontSize: 14, marginBottom: 30 }}>
              Qual é o teu objetivo principal?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 30 }}>
              {[
                { id: 'hipertrofia', label: 'Hipertrofia (Ganho Muscular)', icon: '💪' },
                { id: 'resistencia', label: 'Resistência (Condicionamento)', icon: '🏃' },
                { id: 'mobilidade', label: 'Mobilidade / Recuperação', icon: '🧘' },
              ].map((g) => (
                <button
                  key={g.id}
                  onClick={() => handleGoalSelect(g.id)}
                  style={{
                    background:
                      selectedGoal === g.id ? 'rgba(232, 200, 74, 0.1)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${selectedGoal === g.id ? C.accent : 'rgba(255,255,255,0.1)'}`,
                    color: selectedGoal === g.id ? C.accent : C.text,
                    padding: 16,
                    borderRadius: 12,
                    fontSize: 16,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    fontWeight: 600,
                    transition: 'all 0.2s',
                  }}
                >
                  <span style={{ fontSize: 24 }}>{g.icon}</span> {g.label}
                </button>
              ))}
            </div>

            <button
              onClick={nextStep}
              style={{
                width: '100%',
                background: C.accent,
                color: '#000',
                border: 'none',
                padding: 16,
                borderRadius: 12,
                fontFamily: "'Bebas Neue'",
                fontSize: 20,
                cursor: 'pointer',
              }}
            >
              CONTINUAR
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}
          >
            <span style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>🛠️</span>
            <h2
              style={{
                fontFamily: "'Bebas Neue'",
                fontSize: 32,
                color: C.accent,
                letterSpacing: 2,
              }}
            >
              MODO DE DEMONSTRAÇÃO
            </h2>
            <p style={{ color: C.muted, fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>
              Atualmente, o teu painel pode conter <strong>dados simulados</strong> (workouts
              gerados automaticamente) para demonstração dos gráficos e Inteligência Artificial.
            </p>
            <p style={{ color: C.muted, fontSize: 14, marginBottom: 30 }}>
              Queres iniciar com uma folha limpa?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                onClick={handlePurge}
                style={{
                  width: '100%',
                  background: 'transparent',
                  color: '#ff4444',
                  border: '1px solid #ff4444',
                  padding: 16,
                  borderRadius: 12,
                  fontFamily: "'Bebas Neue'",
                  fontSize: 18,
                  cursor: 'pointer',
                  letterSpacing: 1,
                }}
              >
                🗑️ INICIAR BASE DE DADOS LIMPA
              </button>
              <button
                onClick={nextStep}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.05)',
                  color: C.text,
                  border: 'none',
                  padding: 16,
                  borderRadius: 12,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Manter dados de demonstração
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}
          >
            <span style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>🔒</span>
            <h2
              style={{
                fontFamily: "'Bebas Neue'",
                fontSize: 32,
                color: C.accent,
                letterSpacing: 2,
              }}
            >
              ZERO TRUST SECURITY
            </h2>
            <p style={{ color: C.muted, fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>
              Para garantir a tua privacidade, cria um PIN de acesso. Este PIN será usado para{' '}
              <strong>encriptar localmente</strong> todos os teus treinos e biometria.
            </p>

            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 12,
                padding: 16,
                marginBottom: 24,
                textAlign: 'left',
              }}
            >
              <h4
                style={{
                  color: '#f87171',
                  fontWeight: 'bold',
                  fontSize: 14,
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>⚠️</span> Aviso Crítico
              </h4>
              <p
                style={{
                  color: 'rgba(254, 202, 202, 0.8)',
                  fontSize: 12,
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                O teu PIN e dados <strong>nunca saem deste dispositivo</strong>. Se esqueceres este
                PIN ou limpares a cache do navegador, o teu histórico será{' '}
                <strong>perdido para sempre</strong>. Não existe mecanismo de recuperação.
              </p>
            </div>

            <form onSubmit={handleFinalize}>
              <input
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
                  background: 'rgba(0,0,0,0.3)',
                  border: `2px solid ${error ? '#ff4444' : C.accent}`,
                  borderRadius: 12,
                  padding: 16,
                  color: C.text,
                  fontSize: 24,
                  textAlign: 'center',
                  letterSpacing: 8,
                  marginBottom: 16,
                }}
              />

              {error && <p style={{ color: '#ff4444', fontSize: 12, marginBottom: 16 }}>{error}</p>}

              <button
                type="submit"
                disabled={loading || pin.length < 4}
                style={{
                  width: '100%',
                  background: C.accent,
                  color: '#000',
                  border: 'none',
                  padding: 16,
                  borderRadius: 12,
                  fontFamily: "'Bebas Neue'",
                  fontSize: 20,
                  cursor: loading || pin.length < 4 ? 'not-allowed' : 'pointer',
                  opacity: loading || pin.length < 4 ? 0.5 : 1,
                  letterSpacing: 2,
                }}
              >
                {loading ? 'A ENCRIPTAR DISCO...' : 'CONCLUIR E ENTRAR'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
