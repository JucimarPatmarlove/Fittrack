import { motion } from 'framer-motion';
import {
  Activity,
  ChevronLeft,
  Ghost,
  Heart,
  MapPin,
  Moon,
  Navigation as NavIcon,
  Play,
  Square,
  Triangle,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { WalkingMap } from '../components/workout/WalkingMap';
import { C } from '../data/constants';
import type { WorkoutSession } from '../db/schema';
import { useWalkingCoach } from '../hooks/useWalkingCoach';

interface Props {
  onClose: () => void;
  onFinish: (session: WorkoutSession) => void;
}

export default function WalkingCoachScreen({ onClose, onFinish }: Props) {
  const [targetPace, setTargetPace] = useState<number>(8.0);
  const { state, startTracking, finishTracking, acceptRunningChallenge, dropHazard, speak } =
    useWalkingCoach(targetPace);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatPace = (pace: number) => {
    if (pace === 0 || !isFinite(pace)) return '--:--';
    const mins = Math.floor(pace);
    const secs = Math.round((pace - mins) * 60);
    return `${mins}'${secs.toString().padStart(2, '0')}"`;
  };

  const handleStop = () => {
    const { session } = finishTracking();
    onFinish(session);
  };

  // Ghost visual: mostra a posição do fantasma como um ponto atrasado no trajeto
  const ghostCoords = state.path.length > 5 ? state.path[Math.max(0, state.path.length - 5)] : null;

  // HR color logic
  const hrColor =
    state.heartRate > 175
      ? '#ef4444'
      : state.heartRate > 150
        ? '#f97316'
        : state.heartRate > 120
          ? '#eab308'
          : '#22c55e';
  const hrIsAlert = state.heartRate > 175;

  const glassCardStyle = {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column' as const,
    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#080b0f',
        color: '#fff',
        paddingBottom: '96px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '"Outfit", sans-serif',
      }}
    >
      {state.isActive && !state.isPaused && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '256px',
            background: 'rgba(34, 197, 94, 0.1)',
            filter: 'blur(100px)',
            pointerEvents: 'none',
            transition: 'all 1s',
          }}
        />
      )}

      {state.isPaused && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '256px',
            background: 'rgba(234, 179, 8, 0.1)',
            filter: 'blur(100px)',
            pointerEvents: 'none',
            transition: 'all 1s',
          }}
        />
      )}

      {/* HR alert ambient glow */}
      {hrIsAlert && state.isActive && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '256px',
            background: 'rgba(239, 68, 68, 0.15)',
            filter: 'blur(100px)',
            pointerEvents: 'none',
            transition: 'all 0.5s',
          }}
        />
      )}

      {/* Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          background: 'rgba(8, 11, 15, 0.9)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          padding: '16px',
          zIndex: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '50%',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
              }}
            >
              <ChevronLeft size={20} color="#fff" />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <NavIcon size={20} color={C.accent} />
              <h1
                style={{
                  fontFamily: '"Bebas Neue", sans-serif',
                  fontSize: '1.25rem',
                  margin: 0,
                  letterSpacing: '2px',
                  marginTop: '4px',
                }}
              >
                Radar de Caminhada
              </h1>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* 📍 Botão Drop Hazard (Waze-style) */}
            {state.isActive && (
              <button
                onClick={() => dropHazard('danger')}
                style={{
                  background: 'rgba(249, 115, 22, 0.15)',
                  border: '1px solid rgba(249, 115, 22, 0.4)',
                  color: '#f97316',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 'bold',
                  fontSize: '10px',
                  textTransform: 'uppercase' as const,
                  letterSpacing: '1px',
                  cursor: 'pointer',
                }}
              >
                <MapPin size={14} /> Alerta
              </button>
            )}
            {state.isActive && (
              <div
                style={{
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  fontWeight: 'bold',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: `1px solid ${state.isPaused ? 'rgba(234,179,8,0.5)' : 'rgba(34,197,94,0.5)'}`,
                  color: state.isPaused ? '#eab308' : '#22c55e',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: state.isPaused ? '#eab308' : '#22c55e',
                  }}
                />
                {state.isPaused ? 'Auto-Pausa' : 'A Rastrear'}
              </div>
            )}
          </div>
        </div>
      </header>

      <main
        style={{
          flex: 1,
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 10,
          position: 'relative',
        }}
      >
        {/* Controlo de Ritmo */}
        <div
          style={{
            ...glassCardStyle,
            width: '100%',
            maxWidth: '400px',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
          }}
        >
          <span
            style={{
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'rgba(255,255,255,0.5)',
              textTransform: 'uppercase',
              letterSpacing: '2px',
            }}
          >
            Ritmo Alvo
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => setTargetPace((p) => Math.max(4, p - 0.5))}
              style={{
                width: '40px',
                height: '40px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '12px',
                fontWeight: 'bold',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              -
            </button>
            <span
              style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                width: '80px',
                textAlign: 'center',
                fontFamily: '"DM Mono", monospace',
                color: C.accent,
              }}
            >
              {targetPace.toFixed(1)}{' '}
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'rgba(255,255,255,0.4)',
                  fontFamily: '"Outfit", sans-serif',
                }}
              >
                /km
              </span>
            </span>
            <button
              onClick={() => setTargetPace((p) => Math.min(15, p + 0.5))}
              style={{
                width: '40px',
                height: '40px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '12px',
                fontWeight: 'bold',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              +
            </button>
          </div>
        </div>

        {/* Telemetria Principal: Distância | Tempo | Ritmo */}
        <div
          style={{
            width: '100%',
            maxWidth: '400px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            marginBottom: '16px',
          }}
        >
          <div style={{ ...glassCardStyle, textAlign: 'center', justifyContent: 'center' }}>
            <div
              style={{
                fontSize: '2.2rem',
                fontWeight: 900,
                fontFamily: '"DM Mono", monospace',
                marginBottom: '4px',
                letterSpacing: '-1px',
                color: C.accent,
              }}
            >
              {state.distance.toFixed(2)}
            </div>
            <div
              style={{
                fontSize: '10px',
                color: 'rgba(255,255,255,0.5)',
                textTransform: 'uppercase',
                fontWeight: 'bold',
                letterSpacing: '2px',
              }}
            >
              km
            </div>
          </div>
          <div style={{ ...glassCardStyle, textAlign: 'center', justifyContent: 'center' }}>
            <div
              style={{
                fontSize: '1.8rem',
                fontWeight: 900,
                fontFamily: '"DM Mono", monospace',
                marginBottom: '4px',
                letterSpacing: '-1px',
                color: '#fff',
              }}
            >
              {formatTime(state.duration)}
            </div>
            <div
              style={{
                fontSize: '10px',
                color: 'rgba(255,255,255,0.5)',
                textTransform: 'uppercase',
                fontWeight: 'bold',
                letterSpacing: '2px',
              }}
            >
              Tempo
            </div>
          </div>
          <div style={{ ...glassCardStyle, textAlign: 'center', justifyContent: 'center' }}>
            <div
              style={{
                fontSize: '1.8rem',
                fontWeight: 900,
                fontFamily: '"DM Mono", monospace',
                marginBottom: '4px',
                letterSpacing: '-1px',
                color: '#60a5fa',
              }}
            >
              {formatPace(state.pace)}
            </div>
            <div
              style={{
                fontSize: '10px',
                color: 'rgba(255,255,255,0.5)',
                textTransform: 'uppercase',
                fontWeight: 'bold',
                letterSpacing: '2px',
              }}
            >
              Ritmo
            </div>
          </div>
        </div>

        {/* ⛰️ Telemetria Tática: Elevação | BPM | GAP | Ghost */}
        <div
          style={{
            width: '100%',
            maxWidth: '400px',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
            marginBottom: '16px',
          }}
        >
          {/* Card Elevação */}
          <div
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '14px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <span
              style={{
                fontSize: '10px',
                color: 'rgba(255,255,255,0.4)',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Triangle size={11} color="#eab308" fill="#eab308" /> Elevação
            </span>
            <div
              style={{
                fontSize: '1.6rem',
                fontWeight: 900,
                fontFamily: '"DM Mono", monospace',
                color: '#fff',
              }}
            >
              +{state.elevationGain.toFixed(0)}m
            </div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>
              Alt: {state.altitude.toFixed(0)}m
            </div>
          </div>

          {/* Card BPM */}
          <div
            style={{
              background: hrIsAlert ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${hrIsAlert ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: '14px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              transition: 'all 0.3s',
            }}
          >
            <span
              style={{
                fontSize: '10px',
                color: 'rgba(255,255,255,0.4)',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Heart size={11} color="#ef4444" fill="#ef4444" /> BPM
            </span>
            <div
              style={{
                fontSize: '1.6rem',
                fontWeight: 900,
                fontFamily: '"DM Mono", monospace',
                color: hrColor,
                transition: 'color 0.3s',
              }}
            >
              {state.heartRate.toFixed(0)}
            </div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>
              {state.heartRate > 175
                ? '🔴 ZONA 5'
                : state.heartRate > 150
                  ? '🟠 Zona 4'
                  : state.heartRate > 120
                    ? '🟡 Zona 3'
                    : '🟢 Zona 2'}
            </div>
          </div>
        </div>

        {/* GAP + Ghost Row */}
        <div
          style={{
            width: '100%',
            maxWidth: '400px',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
            marginBottom: '16px',
          }}
        >
          {/* Card G.A.P. */}
          <div
            style={{
              background: 'rgba(59, 130, 246, 0.06)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '14px',
              padding: '14px',
              textAlign: 'center',
              boxShadow: 'inset 0 0 20px rgba(59, 130, 246, 0.05)',
            }}
          >
            <div
              style={{
                fontSize: '1.5rem',
                fontWeight: 900,
                fontFamily: '"DM Mono", monospace',
                color: '#60a5fa',
              }}
            >
              {formatPace(state.gap)}
            </div>
            <div
              style={{
                fontSize: '10px',
                color: '#3b82f6',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                fontWeight: 'bold',
                marginTop: '4px',
              }}
            >
              G.A.P.
            </div>
            <div style={{ fontSize: '9px', color: 'rgba(59, 130, 246, 0.5)', marginTop: '2px' }}>
              Grade Adjusted Pace
            </div>
          </div>

          {/* Card Ghost */}
          <div
            style={{
              background: 'rgba(148, 163, 184, 0.06)',
              border: '1px solid rgba(148, 163, 184, 0.15)',
              borderRadius: '14px',
              padding: '14px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '1.5rem',
                fontWeight: 900,
                fontFamily: '"DM Mono", monospace',
                color: state.distance > state.ghostDistance ? '#22c55e' : '#94a3b8',
              }}
            >
              {state.distance > state.ghostDistance ? '▲' : '▼'}{' '}
              {Math.abs((state.distance - state.ghostDistance) * 1000).toFixed(0)}m
            </div>
            <div
              style={{
                fontSize: '10px',
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                fontWeight: 'bold',
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
              }}
            >
              <Ghost size={11} /> Fantasma
            </div>
            <div style={{ fontSize: '9px', color: 'rgba(148, 163, 184, 0.5)', marginTop: '2px' }}>
              {state.distance > state.ghostDistance ? 'Estás à frente!' : 'Atrás do ghost'}
            </div>
          </div>
        </div>

        {/* Passos + Velocidade */}
        <div
          style={{
            width: '100%',
            maxWidth: '400px',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '12px',
              padding: '12px',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
            }}
          >
            <Activity size={24} color="rgba(255,255,255,0.3)" />
            <div style={{ textAlign: 'left' }}>
              <div
                style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#fff', lineHeight: 1 }}
              >
                {state.steps || 0}
              </div>
              <div
                style={{
                  fontSize: '10px',
                  color: 'rgba(255,255,255,0.4)',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                }}
              >
                Passos
              </div>
            </div>
          </div>
          <div
            style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '12px',
              padding: '12px',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
            }}
          >
            <Zap size={24} color="rgba(255,255,255,0.3)" />
            <div style={{ textAlign: 'left' }}>
              <div
                style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#fff', lineHeight: 1 }}
              >
                {state.speed.toFixed(1)}
              </div>
              <div
                style={{
                  fontSize: '10px',
                  color: 'rgba(255,255,255,0.4)',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                }}
              >
                km/h
              </div>
            </div>
          </div>
        </div>

        {/* Mapa GPS com overlay HR */}
        <div
          style={{
            width: '100%',
            maxWidth: '400px',
            height: '240px',
            marginBottom: '24px',
            borderRadius: '16px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            position: 'relative',
          }}
        >
          <WalkingMap
            path={state.path}
            isActive={state.isActive}
            ghostPosition={ghostCoords}
            hazards={state.hazards}
          />

          {/* 🛡️ Overlay HR Limit — borda vermelha pulsante */}
          {hrIsAlert && state.isActive && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                border: '3px solid rgba(239, 68, 68, 0.7)',
                borderRadius: '16px',
                pointerEvents: 'none',
                animation: 'pulse-border 1s ease-in-out infinite',
              }}
            />
          )}
        </div>

        {/* CSS for pulse animation */}
        <style>{`
          @keyframes pulse-border {
            0%, 100% { opacity: 0.4; border-color: rgba(239, 68, 68, 0.4); }
            50% { opacity: 1; border-color: rgba(239, 68, 68, 0.9); }
          }
        `}</style>

        {/* Desafio de Corrida */}
        {state.isRunningSuggestion && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              width: '100%',
              maxWidth: '400px',
              background: 'rgba(234,179,8,0.1)',
              border: '1px solid rgba(234,179,8,0.3)',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px',
              textAlign: 'center',
              boxShadow: '0 0 20px rgba(234,179,8,0.15)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '4px',
                height: '100%',
                background: '#eab308',
              }}
            />
            <h3
              style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: '#facc15',
                marginBottom: '4px',
                fontFamily: '"Bebas Neue", sans-serif',
                letterSpacing: '1px',
              }}
            >
              🔥 Máquina!
            </h3>
            <p
              style={{ fontSize: '0.875rem', color: 'rgba(254,240,138,0.8)', marginBottom: '16px' }}
            >
              Estás num ritmo incrível. Aguentas 1 minuto a correr?
            </p>
            <button
              onClick={acceptRunningChallenge}
              style={{
                background: '#eab308',
                color: '#000',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '2px',
                padding: '12px 32px',
                borderRadius: '12px',
                border: 'none',
                width: '100%',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Aceitar Desafio
            </button>
          </motion.div>
        )}

        {/* Timer de Corrida */}
        {state.isRunningChallenge && (
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            style={{
              width: '100%',
              maxWidth: '400px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <p
              style={{
                fontSize: '0.875rem',
                color: '#f87171',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                marginBottom: '8px',
              }}
            >
              Modo Corrida Ativo
            </p>
            <p
              style={{
                fontSize: '4.5rem',
                fontWeight: 900,
                color: '#fff',
                fontFamily: '"DM Mono", monospace',
                textShadow: '0 0 15px rgba(239,68,68,0.6)',
              }}
            >
              {state.runChallengeTimeLeft}s
            </p>
          </motion.div>
        )}

        {/* Status de Sistema e Botão Principal */}
        <div style={{ width: '100%', maxWidth: '400px', marginTop: 'auto' }}>
          {state.alertMessage && !state.isRunningChallenge && (
            <div
              style={{
                marginBottom: '16px',
                textAlign: 'center',
                fontSize: '0.75rem',
                fontWeight: 500,
                color: 'rgba(255,255,255,0.6)',
                background: 'rgba(255,255,255,0.05)',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              💬 {state.alertMessage}
            </div>
          )}

          {!state.isActive ? (
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  speak('A iniciar radar avançado.');
                  startTracking();
                }}
                style={{
                  flex: 2,
                  background: '#1e2532',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontWeight: 'bold',
                  padding: '16px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                  cursor: 'pointer',
                }}
              >
                <Play size={20} fill={C.accent} color={C.accent} />
                <span
                  style={{
                    fontFamily: '"Bebas Neue", sans-serif',
                    fontSize: '1.25rem',
                    letterSpacing: '2px',
                    marginTop: '4px',
                  }}
                >
                  Iniciar
                </span>
              </button>
              <button
                onClick={() => {
                  let lat = 40.5373;
                  let lng = -7.2658;
                  let alt = 850; // Altitude da Guarda
                  let isFirst = true;
                  let intervalId: any;
                  (navigator.geolocation as any).watchPosition = (success: any) => {
                    if (isFirst) {
                      success({
                        coords: { latitude: lat, longitude: lng, accuracy: 10, altitude: alt },
                      });
                      isFirst = false;
                    }
                    intervalId = setInterval(() => {
                      lat += 0.0001;
                      lng += 0.00005;
                      alt += Math.random() * 4 - 1; // Simular subidas e descidas
                      success({
                        coords: { latitude: lat, longitude: lng, accuracy: 10, altitude: alt },
                      });
                    }, 2000);
                    return 999;
                  };
                  (navigator.geolocation as any).clearWatch = () => {
                    if (intervalId) clearInterval(intervalId);
                  };
                  speak('Simulação com altimetria ativada.');
                  startTracking();
                }}
                style={{
                  flex: 1,
                  background: 'rgba(204,255,0,0.1)',
                  border: `1px solid rgba(204,255,0,0.3)`,
                  color: C.accent,
                  fontWeight: 'bold',
                  padding: '16px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  cursor: 'pointer',
                }}
              >
                Simular
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '12px' }}>
              {/* Drop Hazard buttons row */}
              <button
                onClick={() => dropHazard('water')}
                style={{
                  flex: 1,
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  color: '#3b82f6',
                  fontWeight: 'bold',
                  padding: '12px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  fontSize: '11px',
                }}
              >
                💧 Água
              </button>
              <button
                onClick={handleStop}
                style={{
                  flex: 2,
                  background: 'rgba(220,38,38,0.2)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: '#f87171',
                  fontWeight: 'bold',
                  padding: '16px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                }}
              >
                <Square size={16} fill="currentColor" /> Terminar e Guardar
              </button>
            </div>
          )}

          <div
            style={{
              textAlign: 'center',
              marginTop: '24px',
              fontSize: '10px',
              color: 'rgba(255,255,255,0.3)',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            {state.isActive ? (
              <>
                <Moon size={12} color="rgba(255,255,255,0.3)" />
                Wake Lock Ativo (Ecrã não desliga)
              </>
            ) : (
              'Telemetria V2 — Altimetria • GAP • Ghost • HR'
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
