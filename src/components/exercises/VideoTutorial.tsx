import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { getExerciseMedia } from '../../data/exerciseMedia';
import { useAudioCoach } from '../../hooks/useAudioCoach';
import { useExerciseStore } from '../../stores/useExerciseStore';

// ── Mapa de músculos → emoji + cor neon ─────────────────────────────────────
const MUSCLE_META: Record<string, { emoji: string; color: string }> = {
  Peito: { emoji: '🫁', color: '#e84a4a' },
  Costas: { emoji: '🦾', color: '#3dd68c' },
  Pernas: { emoji: '🦵', color: '#e8c84a' },
  Ombros: { emoji: '💪', color: '#38bdf8' },
  Braços: { emoji: '💥', color: '#a78bfa' },
  Core: { emoji: '🔥', color: '#fb923c' },
  'Full Body': { emoji: '⚡', color: '#f0abfc' },
  Tríceps: { emoji: '💪', color: '#a78bfa' },
  Bíceps: { emoji: '💪', color: '#60a5fa' },
  Glúteos: { emoji: '🍑', color: '#f472b6' },
};

const getMeta = (muscle: string) => MUSCLE_META[muscle] ?? { emoji: '🏋️', color: '#e8c84a' };

// ── Passos de execução genéricos por tipo de exercício ───────────────────────
function getSteps(exerciseName: string, muscle: string): string[] {
  const name = exerciseName.toLowerCase();

  if (name.includes('squat') || name.includes('agachamento'))
    return [
      'Pés à largura dos ombros, pontas dos pés ligeiramente abertas.',
      'Core activado, coluna neutra — sem arqueamento lombar.',
      'Desce controlado até coxa paralela ao chão (3–4s excêntrica).',
      'Joelhos alinham com os pés — não colapsam para dentro.',
      'Sobe com força explosiva, expire no esforço.',
    ];
  if (name.includes('bench') || name.includes('supino'))
    return [
      'Omoplatas retraídas e encostadas ao banco — arco lombar natural.',
      'Grip ligeiramente mais largo que os ombros, pulsos alinhados.',
      'Desce a barra até roçar o esterno (fase excêntrica 3s).',
      'Cotovelos a 45–75° do tronco — protege os ombros.',
      'Empurra explosivamente, expire no esforço concêntrico.',
    ];
  if (name.includes('deadlift') || name.includes('peso morto'))
    return [
      'Pés à largura do quadril, barra sobre o médio do pé.',
      'Agarra a barra, ombros ligeiramente à frente.',
      'Peito alto, core comprimido — "preenche a barriga de ar".',
      'Empurra o chão (não puxa a barra) — quadril e ombros sobem juntos.',
      'Topo: lock-out com glúteos, não hiperlorde lombar.',
    ];
  if (name.includes('row') || name.includes('remada'))
    return [
      'Torso inclinado ~45°, coluna neutra, core activado.',
      'Inicia o movimento com o cotovelo, não com o braço.',
      'Retrai a omoplata no topo — 1s de pausa isométrica.',
      'Fase excêntrica lenta e controlada (2–3s).',
      'Não uses momentum — controla o peso em toda a amplitude.',
    ];
  if (name.includes('press') || name.includes('desenvolvimento'))
    return [
      'Barra ao nível do queixo, cotovelos ligeiramente à frente.',
      'Core e glúteos activados — protege a lombar.',
      'Empurra verticalmente sem inclinar o tronco para trás.',
      'No topo: ombros em shrug leve, cotovelos estendidos.',
      'Desce controlado até posição inicial.',
    ];
  if (name.includes('pull') || name.includes('puxada') || name.includes('barra fixa'))
    return [
      'Grip ligeiramente mais largo que os ombros.',
      'Inicia a retração das omoplatas antes de dobrar o cotovelo.',
      'Puxa até o queixo ultrapassar a barra.',
      'Corpo estável — sem balanço ou kipping.',
      'Desce lentamente (fase excêntrica = o melhor ganho).',
    ];
  if (name.includes('curl') || name.includes('rosca'))
    return [
      'Cotovelos fixos ao lado do corpo durante todo o movimento.',
      'Supinação total no topo para máxima contracção bicipital.',
      'Excêntrica controlada em 3s — não largues o peso.',
      'Sem momentum — se precisas de balanço, reduz a carga.',
    ];
  if (name.includes('plank') || name.includes('prancha'))
    return [
      'Antebraços no chão, cotovelos sob os ombros.',
      'Corpo em linha recta — não elevas o quadril.',
      'Core comprimido como se fosses levar um soco.',
      'Respira normalmente — não prende a respiração.',
      'Olhar para o chão, pescoço neutro.',
    ];

  // Fallback genérico baseado no músculo
  return [
    `Posição inicial: core activado, coluna neutra.`,
    `Foco no ${muscle} — mente-músculo antes de iniciar.`,
    `Fase excêntrica: 2–4 segundos controlados.`,
    `Fase concêntrica: explosiva — expire no esforço.`,
    `Amplitude completa para máxima activação muscular.`,
  ];
}

// ── Componente Principal ─────────────────────────────────────────────────────
type Tab = 'media' | 'steps' | 'muscles';

export const VideoTutorial = ({
  exerciseName,
  muscle,
}: { exerciseName: string; muscle: string }) => {
  const EXERCISE_DB = useExerciseStore((s) => s.exercises);
  const dbEntry = (EXERCISE_DB as any)[exerciseName];
  const videoSrc = dbEntry?.media?.video;

  const media = getExerciseMedia(exerciseName);
  const svgUrl = media.imageUrl.replace('.jpg', '.svg');
  const [mediaState, setMediaState] = useState<'loading' | 'gif' | 'svg' | 'video' | 'error'>(
    'loading',
  );
  const [isCached, setIsCached] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('media');
  const [stepDone, setStepDone] = useState<boolean[]>([]);
  const steps = getSteps(exerciseName, muscle);
  const meta = getMeta(muscle);

  const { speak } = useAudioCoach(true);
  const hasSpoken = useRef(false);

  useEffect(() => {
    if (!hasSpoken.current) {
      speak(`${exerciseName}. Foco: ${muscle}.`);
      hasSpoken.current = true;
    }
    setStepDone(new Array(steps.length).fill(false));
  }, [exerciseName, muscle]);

  useEffect(() => {
    if (videoSrc && 'caches' in window) {
      caches.open('external-video-cache').then((cache) => {
        cache.match(videoSrc).then((match) => {
          if (match) setIsCached(true);
        });
      });
      caches.open('video-cache').then((cache) => {
        cache.match(videoSrc).then((match) => {
          if (match) setIsCached(true);
        });
      });
    }
  }, [videoSrc]);

  // 3D parallax
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mx = useSpring(x, { stiffness: 150, damping: 20 });
  const my = useSpring(y, { stiffness: 150, damping: 20 });
  const rotateX = useTransform(my, [-0.5, 0.5], ['8deg', '-8deg']);
  const rotateY = useTransform(mx, [-0.5, 0.5], ['-8deg', '8deg']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width - 0.5);
    y.set((e.clientY - r.top) / r.height - 0.5);
  };

  // Media loading
  useEffect(() => {
    setMediaState('loading');
    if (videoSrc) {
      // Assuming video loads quickly enough to set state immediately or we can just set it
      setMediaState('video');
      return;
    }

    const imgSvg = new Image();
    imgSvg.src = svgUrl;
    imgSvg.onload = () => setMediaState('svg');
    imgSvg.onerror = () => {
      if (media.gifUrl) {
        const imgGif = new Image();
        imgGif.src = media.gifUrl;
        imgGif.onload = () => setMediaState('gif');
        imgGif.onerror = () => setMediaState('error');
      } else {
        setMediaState('error');
      }
    };
  }, [exerciseName, svgUrl, media.gifUrl, videoSrc]);

  const stepsCompleted = stepDone.filter(Boolean).length;
  const progressPct = steps.length > 0 ? (stepsCompleted / steps.length) * 100 : 0;

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'media', label: 'DEMO', icon: '▶' },
    { id: 'steps', label: 'PASSOS', icon: '📋' },
    { id: 'muscles', label: 'MÚSCULOS', icon: '🎯' },
  ];

  return (
    <motion.div
      style={{
        background: 'linear-gradient(135deg, #0e1318 0%, #080b0f 100%)',
        borderRadius: 16,
        border: `1px solid ${meta.color}33`,
        marginBottom: 16,
        overflow: 'hidden',
        perspective: 1000,
        transformStyle: 'preserve-3d',
        rotateX,
        rotateY,
        boxShadow: `0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px ${meta.color}22`,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: '14px 16px 0',
          background: `linear-gradient(90deg, ${meta.color}18 0%, transparent 100%)`,
          borderBottom: `1px solid ${meta.color}22`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: 28 }}>{meta.emoji}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 20,
                color: '#eceae4',
                letterSpacing: 1,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {exerciseName}
              {isCached && <span title="Disponível Offline">📀</span>}
            </div>
            <div
              style={{ fontSize: 11, color: meta.color, fontFamily: 'monospace', letterSpacing: 1 }}
            >
              ALVO: {muscle.toUpperCase()}
            </div>
          </div>
          {/* Joint impact badge */}
          <div
            style={{
              padding: '3px 8px',
              borderRadius: 20,
              border: `1px solid ${meta.color}55`,
              background: `${meta.color}15`,
              fontSize: 10,
              color: meta.color,
              fontFamily: 'monospace',
              letterSpacing: 0.5,
              flexShrink: 0,
            }}
          >
            ⚡ COMPOSTO
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '10px 4px',
                background: 'none',
                border: 'none',
                borderBottom:
                  activeTab === tab.id ? `2px solid ${meta.color}` : '2px solid transparent',
                color: activeTab === tab.id ? meta.color : '#55626e',
                fontSize: 11,
                fontFamily: 'monospace',
                fontWeight: activeTab === tab.id ? 700 : 400,
                cursor: 'pointer',
                transition: 'all 0.2s',
                letterSpacing: 0.5,
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {/* DEMO TAB */}
        {activeTab === 'media' && (
          <motion.div
            key="media"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            style={{ padding: 16 }}
          >
            {/* Media */}
            <div
              style={{
                borderRadius: 12,
                overflow: 'hidden',
                border: `1px solid ${meta.color}33`,
                background: '#080b0f',
                marginBottom: 12,
                minHeight: 180,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              {mediaState === 'loading' && (
                <motion.div
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.4 }}
                  style={{
                    width: '100%',
                    height: 200,
                    background: 'linear-gradient(90deg, #131920 25%, #1e2832 50%, #131920 75%)',
                    backgroundSize: '200% 100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      border: `2px solid ${meta.color}`,
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                  <span style={{ fontSize: 11, color: '#55626e', fontFamily: 'monospace' }}>
                    Carregando...
                  </span>
                </motion.div>
              )}
              {mediaState === 'video' && videoSrc && (
                <>
                  <video
                    src={videoSrc}
                    autoPlay
                    loop
                    muted
                    playsInline
                    style={{
                      width: '100%',
                      height: 'auto',
                      display: 'block',
                      maxHeight: 300,
                      objectFit: 'contain',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 8,
                      right: 8,
                      padding: '2px 8px',
                      background: 'rgba(0,0,0,0.7)',
                      border: `1px solid ${meta.color}55`,
                      borderRadius: 8,
                      fontSize: 9,
                      color: meta.color,
                      fontFamily: 'monospace',
                    }}
                  >
                    VIDEO {isCached ? '· OFFLINE' : ''}
                  </div>
                </>
              )}
              {(mediaState === 'gif' || mediaState === 'svg') && (
                <>
                  <img
                    src={mediaState === 'gif' ? media.gifUrl : svgUrl}
                    alt={`Execução de ${exerciseName}`}
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                  />
                  {/* Neon glow overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: `linear-gradient(to top, ${meta.color}18 0%, transparent 50%)`,
                      pointerEvents: 'none',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 8,
                      right: 8,
                      padding: '2px 8px',
                      background: 'rgba(0,0,0,0.7)',
                      border: `1px solid ${meta.color}55`,
                      borderRadius: 8,
                      fontSize: 9,
                      color: meta.color,
                      fontFamily: 'monospace',
                    }}
                  >
                    {mediaState === 'gif' ? 'GIF' : 'SVG'} · OFFLINE
                  </div>
                </>
              )}
              {mediaState === 'error' && (
                <div style={{ padding: 32, textAlign: 'center' }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>📷</div>
                  <p style={{ fontSize: 11, color: '#55626e', fontFamily: 'monospace' }}>
                    Média indisponível offline
                  </p>
                </div>
              )}
            </div>

            {/* Parâmetros de execução rápidos */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
              }}
            >
              {[
                { icon: '⬇️', label: 'EXCÊNTRICA', value: '3–4s' },
                { icon: '⬆️', label: 'CONCÊNTRICA', value: 'Explosiva' },
                { icon: '😮‍💨', label: 'RESPIRAÇÃO', value: 'Expire ↑' },
                { icon: '📐', label: 'AMPLITUDE', value: 'Máxima' },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    background: '#0a0f15',
                    borderRadius: 10,
                    padding: '8px 12px',
                    border: `1px solid #1e2832`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 16 }}>{item.icon}</span>
                  <div>
                    <div
                      style={{
                        fontSize: 9,
                        color: '#55626e',
                        fontFamily: 'monospace',
                        letterSpacing: 0.5,
                      }}
                    >
                      {item.label}
                    </div>
                    <div style={{ fontSize: 12, color: '#eceae4', fontWeight: 600 }}>
                      {item.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* YouTube link */}
            <a
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`como fazer ${exerciseName} musculação tutorial`)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginTop: 12,
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#ef4444',
                textDecoration: 'none',
                padding: '10px 16px',
                borderRadius: 10,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: 1,
                fontFamily: 'monospace',
                transition: 'all 0.2s',
              }}
            >
              ▶ YOUTUBE · {exerciseName.toUpperCase()}
            </a>
          </motion.div>
        )}

        {/* STEPS TAB */}
        {activeTab === 'steps' && (
          <motion.div
            key="steps"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            style={{ padding: 16 }}
          >
            {/* Progress bar */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: '#55626e', fontFamily: 'monospace' }}>
                  PROGRESSO DA EXECUÇÃO
                </span>
                <span style={{ fontSize: 10, color: meta.color, fontFamily: 'monospace' }}>
                  {stepsCompleted}/{steps.length}
                </span>
              </div>
              <div
                style={{ height: 4, background: '#131920', borderRadius: 4, overflow: 'hidden' }}
              >
                <motion.div
                  animate={{ width: `${progressPct}%` }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  style={{ height: '100%', background: meta.color, borderRadius: 4 }}
                />
              </div>
            </div>

            {/* Steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() =>
                    setStepDone((prev) => {
                      const next = [...prev];
                      next[i] = !next[i];
                      return next;
                    })
                  }
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: '12px 14px',
                    background: stepDone[i] ? `${meta.color}10` : '#0a0f15',
                    borderRadius: 10,
                    border: `1px solid ${stepDone[i] ? meta.color + '55' : '#1e2832'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {/* Step number / checkmark */}
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      flexShrink: 0,
                      background: stepDone[i] ? meta.color : '#131920',
                      border: `2px solid ${stepDone[i] ? meta.color : '#2a3240'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: stepDone[i] ? 14 : 11,
                      color: stepDone[i] ? '#000' : '#55626e',
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      transition: 'all 0.2s',
                    }}
                  >
                    {stepDone[i] ? '✓' : i + 1}
                  </div>
                  <p
                    style={{
                      fontSize: 13,
                      lineHeight: 1.55,
                      margin: 0,
                      color: stepDone[i] ? meta.color : '#c8d0d8',
                      textDecoration: stepDone[i] ? 'line-through' : 'none',
                      opacity: stepDone[i] ? 0.7 : 1,
                      transition: 'all 0.2s',
                    }}
                  >
                    {step}
                  </p>
                </motion.div>
              ))}
            </div>

            {stepsCompleted === steps.length && steps.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  marginTop: 16,
                  padding: 14,
                  borderRadius: 10,
                  background: `${meta.color}15`,
                  border: `1px solid ${meta.color}55`,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 4 }}>🎯</div>
                <p style={{ fontSize: 13, color: meta.color, fontFamily: 'monospace', margin: 0 }}>
                  FORMA PERFEITA · EXECUTA A SÉRIE!
                </p>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* MUSCLES TAB */}
        {activeTab === 'muscles' && (
          <motion.div
            key="muscles"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            style={{ padding: 16 }}
          >
            {/* Primary muscle */}
            <div style={{ marginBottom: 12 }}>
              <div
                style={{
                  fontSize: 10,
                  color: '#55626e',
                  fontFamily: 'monospace',
                  letterSpacing: 1,
                  marginBottom: 8,
                }}
              >
                MÚSCULO PRIMÁRIO
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 16px',
                  borderRadius: 12,
                  background: `${meta.color}12`,
                  border: `1px solid ${meta.color}44`,
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: `${meta.color}20`,
                    border: `2px solid ${meta.color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    boxShadow: `0 0 16px ${meta.color}44`,
                  }}
                >
                  {meta.emoji}
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: 22,
                      letterSpacing: 1,
                      color: meta.color,
                    }}
                  >
                    {muscle}
                  </div>
                  <div style={{ fontSize: 11, color: '#55626e', fontFamily: 'monospace' }}>
                    Activação primária · Alto volume
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary muscles from media */}
            {media.muscleGroups && media.muscleGroups.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div
                  style={{
                    fontSize: 10,
                    color: '#55626e',
                    fontFamily: 'monospace',
                    letterSpacing: 1,
                    marginBottom: 8,
                  }}
                >
                  MÚSCULOS SECUNDÁRIOS
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {media.muscleGroups
                    .filter((m: string) => m !== muscle)
                    .map((m: string, i: number) => {
                      const sm = getMeta(m);
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.06 }}
                          style={{
                            padding: '6px 14px',
                            borderRadius: 20,
                            background: `${sm.color}10`,
                            border: `1px solid ${sm.color}40`,
                            fontSize: 12,
                            color: sm.color,
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <span>{sm.emoji}</span>
                          {m}
                        </motion.div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Tips */}
            {media.tips && media.tips.length > 0 && (
              <div>
                <div
                  style={{
                    fontSize: 10,
                    color: '#55626e',
                    fontFamily: 'monospace',
                    letterSpacing: 1,
                    marginBottom: 8,
                  }}
                >
                  💡 DICAS DE OURO
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {media.tips.map((tip: string, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                      style={{
                        padding: '10px 12px',
                        background: '#0a0f15',
                        borderRadius: 8,
                        borderLeft: `3px solid ${meta.color}`,
                        fontSize: 12,
                        color: '#c8d0d8',
                        lineHeight: 1.5,
                      }}
                    >
                      {tip}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
