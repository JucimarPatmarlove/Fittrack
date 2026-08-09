import { AnimatePresence, motion } from 'framer-motion';
import type React from 'react';
import { useState } from 'react';
import { getDB } from '../../db/schema';
import { encryptData, getMasterKey } from '../../utils/cryptoEngine';

const theme = {
  bg: '#080b0f',
  glass: 'rgba(19, 25, 32, 0.8)',
  accent: '#e8c84a',
  text: '#eceae4',
  muted: '#55626e',
  border: '#1e2832',
  success: '#3dd68c',
};

export const FitnessAssessment = ({ onComplete }: { onComplete: (data?: any) => void }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    patologias: '',
    frequenciaSemanal: '3',
    objetivoPrincipal: 'Hipertrofia',
    peso: '',
    altura: '',
    massaGorda: '',
    pressaoArterial: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const masterKey = getMasterKey();
      if (!masterKey) throw new Error('Chave mestra não disponível');

      // Cifrar dados clínicos
      const clinicalData = {
        anamnesis: {
          medicalConditions: formData.patologias.split(',').map((s) => s.trim()),
          activityLevel:
            formData.frequenciaSemanal === '2'
              ? 'sedentario'
              : formData.frequenciaSemanal === '3'
                ? 'praticante_regular'
                : 'praticante_regular',
          weeklyFrequencyTarget: Number.parseInt(formData.frequenciaSemanal),
          goalPriorities: [formData.objetivoPrincipal],
          targetZone: '',
          motivationScore: 7,
        },
        bodyMeasurements: {
          date: Date.now(),
          weightKg: Number.parseFloat(formData.peso) || 0,
          heightCm: Number.parseFloat(formData.altura) || 0,
          bodyFatPercentage: Number.parseFloat(formData.massaGorda) || 0,
          leanMassPercentage: 0,
          visceralFat: 0,
          bloodPressure: formData.pressaoArterial,
          restingHeartRate: 0,
          circumferences: {} as any,
        },
        timestamp: Date.now(),
      };

      const encrypted = await encryptData(masterKey, JSON.stringify(clinicalData));

      const db = await getDB();
      // Guardar no IndexedDB (usando a store personalRecords para guardar avaliações)
      await db.put('personalRecords', {
        exerciseName: `CLINICAL_ASSESSMENT_${Date.now()}`,
        best1RM: 0,
        bestVolumeWeight: 0,
        lastTrainedAt: Date.now(),
        encryptedFields: encrypted,
      } as any);

      // Passar dados para App.tsx atualizar o profile
      onComplete({
        startDate: Date.now(),
        weeksActive: 0,
        weight: clinicalData.bodyMeasurements.weightKg,
        height: clinicalData.bodyMeasurements.heightCm,
        goal: formData.objetivoPrincipal.toLowerCase(),
        anamnesis: clinicalData.anamnesis,
        bodyMeasurements: [clinicalData.bodyMeasurements],
      });
    } catch (error) {
      console.error('Erro ao guardar avaliação:', error);
      alert('Erro ao guardar dados. Tenta novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: theme.bg,
        color: theme.text,
        zIndex: 1000,
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}
    >
      <div style={{ marginBottom: '32px', paddingTop: 'max(20px, env(safe-area-inset-top))' }}>
        <h1
          style={{
            fontFamily: 'Bebas Neue',
            color: theme.accent,
            fontSize: '32px',
            letterSpacing: '2px',
            margin: 0,
          }}
        >
          AVALIAÇÃO FÍSICA
        </h1>
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: '4px',
                flex: 1,
                background: step >= i ? theme.accent : theme.border,
                borderRadius: '2px',
                transition: 'background 0.3s',
              }}
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Passo 1: Anamnese */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            style={{ flex: 1 }}
          >
            <h2 style={{ fontSize: '20px', marginBottom: '24px' }}>Anamnese e Objetivos</h2>
            <label
              style={{
                display: 'block',
                color: theme.muted,
                fontSize: '12px',
                marginBottom: '8px',
              }}
            >
              Condições ou Patologias (ex: "asma, joelho")
            </label>
            <input
              name="patologias"
              value={formData.patologias}
              onChange={handleChange}
              placeholder="Nenhuma"
              style={{
                width: '100%',
                background: theme.glass,
                border: `1px solid ${theme.border}`,
                color: theme.text,
                padding: '16px',
                borderRadius: '12px',
                marginBottom: '20px',
              }}
            />
            <label
              style={{
                display: 'block',
                color: theme.muted,
                fontSize: '12px',
                marginBottom: '8px',
              }}
            >
              Frequência de Treino (dias/semana)
            </label>
            <select
              name="frequenciaSemanal"
              value={formData.frequenciaSemanal}
              onChange={handleChange}
              style={{
                width: '100%',
                background: theme.glass,
                border: `1px solid ${theme.border}`,
                color: theme.text,
                padding: '16px',
                borderRadius: '12px',
                marginBottom: '20px',
              }}
            >
              <option value="2">2x por semana</option>
              <option value="3">3-4x por semana</option>
              <option value="5">5+ por semana</option>
            </select>
            <label
              style={{
                display: 'block',
                color: theme.muted,
                fontSize: '12px',
                marginBottom: '8px',
              }}
            >
              Objetivo Principal
            </label>
            <select
              name="objetivoPrincipal"
              value={formData.objetivoPrincipal}
              onChange={handleChange}
              style={{
                width: '100%',
                background: theme.glass,
                border: `1px solid ${theme.border}`,
                color: theme.text,
                padding: '16px',
                borderRadius: '12px',
                marginBottom: '32px',
              }}
            >
              <option value="hipertrofia">Hipertrofia</option>
              <option value="perda_peso">Perda de Massa Gorda</option>
              <option value="forca">Força Máxima</option>
              <option value="condicionamento">Condicionamento</option>
            </select>
            <button
              onClick={() => setStep(2)}
              style={{
                width: '100%',
                background: theme.accent,
                color: '#000',
                padding: '16px',
                borderRadius: '12px',
                border: 'none',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              AVANÇAR →
            </button>
          </motion.div>
        )}

        {/* Passo 2: Antropometria */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            style={{ flex: 1 }}
          >
            <h2 style={{ fontSize: '20px', marginBottom: '24px' }}>Avaliação Antropométrica</h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '20px',
              }}
            >
              <div>
                <label style={{ fontSize: '12px', color: theme.muted }}>Peso (kg)</label>
                <input
                  type="number"
                  name="peso"
                  value={formData.peso}
                  onChange={handleChange}
                  placeholder="70.0"
                  style={{
                    width: '100%',
                    background: theme.glass,
                    border: `1px solid ${theme.border}`,
                    color: theme.text,
                    padding: '16px',
                    borderRadius: '12px',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: theme.muted }}>Altura (cm)</label>
                <input
                  type="number"
                  name="altura"
                  value={formData.altura}
                  onChange={handleChange}
                  placeholder="170"
                  style={{
                    width: '100%',
                    background: theme.glass,
                    border: `1px solid ${theme.border}`,
                    color: theme.text,
                    padding: '16px',
                    borderRadius: '12px',
                  }}
                />
              </div>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '20px',
              }}
            >
              <div>
                <label style={{ fontSize: '12px', color: theme.muted }}>Massa Gorda (%)</label>
                <input
                  type="number"
                  name="massaGorda"
                  value={formData.massaGorda}
                  onChange={handleChange}
                  placeholder="18"
                  style={{
                    width: '100%',
                    background: theme.glass,
                    border: `1px solid ${theme.border}`,
                    color: theme.text,
                    padding: '16px',
                    borderRadius: '12px',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: theme.muted }}>Pressão Arterial</label>
                <input
                  name="pressaoArterial"
                  value={formData.pressaoArterial}
                  onChange={handleChange}
                  placeholder="120/80"
                  style={{
                    width: '100%',
                    background: theme.glass,
                    border: `1px solid ${theme.border}`,
                    color: theme.text,
                    padding: '16px',
                    borderRadius: '12px',
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  background: theme.glass,
                  color: theme.text,
                  padding: '16px',
                  borderRadius: '12px',
                  border: `1px solid ${theme.border}`,
                  cursor: 'pointer',
                }}
              >
                VOLTAR
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!formData.peso || !formData.altura}
                style={{
                  flex: 1,
                  background: theme.accent,
                  color: '#000',
                  padding: '16px',
                  borderRadius: '12px',
                  border: 'none',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                CONTINUAR →
              </button>
            </div>
          </motion.div>
        )}

        {/* Passo 3: Revisão e Confirmação */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ flex: 1, textAlign: 'center' }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Pronto para começar!</h2>
            <p style={{ color: theme.muted, marginBottom: '24px' }}>
              Os teus dados clínicos serão cifrados e guardados localmente.
            </p>
            <div
              style={{
                background: theme.glass,
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'left',
                marginBottom: '24px',
              }}
            >
              <p>
                <strong>Patologias:</strong> {formData.patologias || 'Nenhuma'}
              </p>
              <p>
                <strong>Frequência:</strong> {formData.frequenciaSemanal}x/semana
              </p>
              <p>
                <strong>Peso:</strong> {formData.peso} kg | <strong>Altura:</strong>{' '}
                {formData.altura} cm
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={loading}
              style={{
                width: '100%',
                background: theme.success,
                color: '#000',
                padding: '16px',
                borderRadius: '12px',
                border: 'none',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              {loading ? 'A GUARDAR...' : 'CONCLUIR E COMEÇAR A TREINAR'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
