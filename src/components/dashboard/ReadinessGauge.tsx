// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';
import { C } from '../../data/constants';

interface ReadinessGaugeProps {
  acwr: number;
  label?: string;
}

export function ReadinessGauge({ acwr, label = "ACWR (Prontidão)" }: ReadinessGaugeProps) {
  // ACWR Sweet Spot: 0.8 - 1.3
  // Perigo (Risco Alto): > 1.5
  // Destreinamento: < 0.8
  
  // Limites visuais do medidor (0.5 a 2.0)
  const min = 0.5;
  const max = 2.0;
  
  // Clamping
  const clamped = Math.max(min, Math.min(max, acwr));
  
  // Percentagem (0 a 1)
  const percent = (clamped - min) / (max - min);
  
  // Cores dinâmicas Dark Neon
  let strokeColor = C.green; // Sweet spot
  let statusText = "ZONA SEGURA";
  let statusColor = C.green;

  if (acwr > 1.5) {
    strokeColor = C.red;
    statusText = "SOBRECARGA";
    statusColor = C.red;
  } else if (acwr > 1.3) {
    strokeColor = C.orange;
    statusText = "ALERTA / FADIGA";
    statusColor = C.orange;
  } else if (acwr < 0.8) {
    strokeColor = '#00d4ff'; // Blue Neon for undertraining
    statusText = "DESTREINAMENTO";
    statusColor = '#00d4ff';
  }

  // Geometria do SVG (Semi-círculo)
  const radius = 60;
  const circumference = Math.PI * radius; // Apenas metade do perímetro
  const strokeDashoffset = circumference - percent * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
      <svg width="200" height="120" viewBox="0 0 200 120">
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Arco de fundo (Track) */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth="16"
          strokeLinecap="round"
        />

        {/* Arco animado (Value) */}
        <motion.path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={strokeColor}
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
          filter="url(#glow)"
        />
      </svg>

      {/* Rótulo de Valor */}
      <div style={{ position: 'absolute', top: '70px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, letterSpacing: 2, color: '#fff', lineHeight: 1 }}>
          {acwr.toFixed(2)}
        </span>
        <span style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>
          {label}
        </span>
      </div>

      {/* Rótulo de Status */}
      <div style={{ 
        marginTop: 8, 
        padding: '4px 12px', 
        borderRadius: 12, 
        background: `rgba(${statusColor === C.red ? '239,68,68' : statusColor === C.green ? '56,176,0' : statusColor === C.orange ? '249,115,22' : '0,212,255'}, 0.15)`,
        border: `1px solid ${statusColor}`,
        color: statusColor,
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: 1,
        fontFamily: "'Bebas Neue', sans-serif"
      }}>
        {statusText}
      </div>
    </div>
  );
}
