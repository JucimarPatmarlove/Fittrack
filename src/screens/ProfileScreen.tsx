// src/screens/ProfileScreen.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { C } from '../data/constants';
import { getCurrentLevel, LEVEL_THRESHOLDS, type LevelThreshold } from '../services/gamificationEngine';
import type { UserProfile } from '../types';

interface ProfileScreenProps {
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  onBack?: () => void;
  onOpenSettings?: () => void;
  streakData?: { currentStreak: number; longestStreak: number };
}

interface EditForm {
  name: string;
  weight: string;
  level: string;
}

export default function ProfileScreen({
  profile,
  setProfile,
  onBack,
  onOpenSettings,
  streakData,
}: ProfileScreenProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditForm>({
    name: profile.name,
    weight: String(profile.weight ?? ''),
    level: profile.level,
  });

  const xp = profile.xp ?? 0;
  const currentLevel: LevelThreshold = getCurrentLevel(xp);

  const nextLevel: LevelThreshold | null =
    LEVEL_THRESHOLDS.find((l) => l.level === currentLevel.level + 1) ?? null;
  const xpInLevel = nextLevel ? xp - currentLevel.xpRequired : 0;
  const xpNeededForNext = nextLevel
    ? nextLevel.xpRequired - currentLevel.xpRequired
    : 0;
  const progress = xpNeededForNext > 0 ? Math.min(xpInLevel / xpNeededForNext, 1) : 1;

  function openEditor() {
    setForm({
      name: profile.name,
      weight: String(profile.weight ?? ''),
      level: profile.level,
    });
    setEditing(true);
  }

  function saveProfile() {
    const weight = Number.parseFloat(form.weight);
    setProfile({
      ...profile,
      name: form.name.trim() || profile.name,
      weight: Number.isFinite(weight) && weight > 0 ? weight : profile.weight,
      level: form.level.trim() || profile.level,
    });
    setEditing(false);
  }

  function cancelEdit() {
    setEditing(false);
  }

  return (
    <div
      style={{
        padding: '20px 18px',
        maxWidth: '100%',
        width: '100%',
        boxSizing: 'border-box',
        margin: '0 auto',
        paddingBottom: 100,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        {onBack && (
          <button
            onClick={onBack}
            style={{
              background: 'transparent',
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              padding: '8px 12px',
              color: C.text,
              cursor: 'pointer',
              marginRight: 12,
              fontSize: 14,
            }}
            aria-label="Voltar"
          >
            {'← Voltar'}
          </button>
        )}
        <h1 style={{ flex: 1, fontSize: 26, color: C.text, margin: 0 }}>PERFIL</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              style={{
                background: 'transparent',
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: '8px 14px',
                color: C.text,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
              }}
              aria-label="Definições"
            >
              {'⚙️'}
            </button>
          )}
          <button
            onClick={openEditor}
            style={{
              background: C.accentLow,
              border: `1px solid ${C.accent}`,
              borderRadius: 10,
              padding: '8px 14px',
              color: C.accent,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
            }}
            aria-label="Editar perfil"
          >
            {'✏️ Editar'}
          </button>
        </div>
      </div>

      <div
        className="glass"
        style={{
          padding: 24,
          marginBottom: 16,
          textAlign: 'center',
          background: `linear-gradient(160deg, ${C.card}, ${C.surface})`,
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${C.accent}, ${C.blue})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
            fontSize: 30,
            color: '#080b0f',
            fontWeight: 700,
          }}
          aria-hidden="true"
        >
          {(profile.name || '?').charAt(0).toUpperCase()}
        </div>
        <p style={{ fontSize: 22, color: C.text, margin: 0, fontWeight: 600 }}>
          {profile.name || 'Sem nome'}
        </p>
        <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
          {currentLevel.title} · Nível {currentLevel.level}
        </p>
      </div>

      {/* 🔥 STREAK WIDGET */}
      {streakData && streakData.currentStreak > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="glass"
          style={{
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            padding: '16px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(232,200,74,0.15) 0%, rgba(232,200,74,0.05) 100%)',
            border: '1px solid rgba(232,200,74,0.3)',
            boxShadow: '0 4px 20px rgba(232,200,74,0.1)',
          }}
        >
          <div style={{ fontSize: '32px', lineHeight: 1 }}>🔥</div>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: '3rem',
                fontWeight: 900,
                color: C.accent,
                letterSpacing: '2px',
                lineHeight: 1,
              }}
            >
              {streakData.currentStreak}
            </div>
            <div
              style={{
                fontSize: '0.75rem',
                color: C.muted,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                fontWeight: 600,
                marginTop: '2px',
              }}
            >
              {streakData.currentStreak === 1 ? 'DIA CONSECUTIVO' : 'DIAS CONSECUTIVOS'}
            </div>
          </div>
          {streakData.longestStreak > streakData.currentStreak && (
            <div style={{ textAlign: 'right', marginLeft: 'auto' }}>
              <div
                style={{
                  fontSize: '0.65rem',
                  color: C.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                Recorde
              </div>
              <div
                style={{
                  fontFamily: '"Bebas Neue", sans-serif',
                  fontSize: '1.5rem',
                  fontWeight: 900,
                  color: C.text,
                  letterSpacing: '1px',
                }}
              >
                {streakData.longestStreak}
              </div>
            </div>
          )}
        </motion.div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        <StatCard label="PESO" value={`${profile.weight ?? '—'} kg`} icon="⚖️" />
        <StatCard label="NÍVEL" value={profile.level || 'Iniciante'} icon="🏅" />
        <StatCard label="XP" value={xp} icon="⭐" />
      </div>

      <div className="glass" style={{ padding: 18, marginBottom: 16 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 8,
            fontSize: 12,
          }}
        >
          <span style={{ color: C.muted }}>
            Progresso para{' '}
            <strong style={{ color: C.text }}>
              {nextLevel ? nextLevel.title : 'Máximo'}
            </strong>
          </span>
          <span style={{ color: C.accent, fontFamily: 'DM Mono, monospace' }}>
            {xpInLevel} / {xpNeededForNext} XP
          </span>
        </div>
        <div
          style={{
            height: 10,
            background: C.dim,
            borderRadius: 999,
            overflow: 'hidden',
          }}
          role="progressbar"
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.round(progress * 100)}%` }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            style={{
              height: '100%',
              background: `linear-gradient(90deg, ${C.accent}, ${C.green})`,
              borderRadius: 999,
            }}
          />
        </div>
      </div>

      {nextLevel && (
        <div
          className="glass"
          style={{
            padding: 14,
            border: `1px solid ${C.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 22 }} aria-hidden="true">
            {'🎯'}
          </span>
          <div>
            <p style={{ margin: 0, fontSize: 13, color: C.text, fontWeight: 600 }}>
              Próximo: {nextLevel.title}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: C.muted }}>
              Faltam {xpNeededForNext - xpInLevel} XP para desbloquear
            </p>
          </div>
        </div>
      )}

      <AnimatePresence>
        {editing && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
              zIndex: 100,
            }}
            onClick={cancelEdit}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="glass"
              style={{
                width: '100%',
                maxWidth: 400,
                padding: 22,
                background: C.card,
                border: `1px solid ${C.accent}`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ margin: '0 0 18px', fontSize: 20, color: C.text }}>
                {'Editar Perfil'}
              </h2>

              <Field label="Nome">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  style={inputStyle}
                  placeholder="O teu nome"
                />
              </Field>

              <Field label="Peso (kg)">
                <input
                  type="number"
                  value={form.weight}
                  onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
                  style={inputStyle}
                  placeholder="75"
                />
              </Field>

              <Field label="Nível">
                <select
                  value={form.level}
                  onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
                  style={inputStyle}
                >
                  <option value="Iniciante">Iniciante</option>
                  <option value="Intermédio">Intermédio</option>
                  <option value="Avançado">Avançado</option>
                  <option value="Atleta">Atleta</option>
                </select>
              </Field>

              <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
                <button
                  onClick={cancelEdit}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: `1px solid ${C.border}`,
                    borderRadius: 10,
                    padding: 12,
                    color: C.muted,
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  {'Cancelar'}
                </button>
                <button
                  onClick={saveProfile}
                  style={{
                    flex: 1,
                    background: C.accent,
                    border: 'none',
                    borderRadius: 10,
                    padding: 12,
                    color: '#080b0f',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  {'Gravar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: 10,
  padding: '10px 12px',
  color: C.text,
  fontSize: 15,
  fontFamily: 'Outfit, sans-serif',
};

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div
      className="glass"
      style={{
        padding: 14,
        textAlign: 'center',
        border: `1px solid ${C.border}`,
      }}
    >
      <div style={{ fontSize: 18, marginBottom: 6 }} aria-hidden="true">{icon}</div>
      <p style={{ margin: 0, fontSize: 10, color: C.muted, letterSpacing: 1 }}>{label}</p>
      <p style={{ margin: '4px 0 0', fontSize: 15, color: C.text, fontWeight: 600 }}>{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label
        style={{
          display: 'block',
          fontSize: 11,
          color: C.muted,
          marginBottom: 5,
          letterSpacing: 0.5,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
