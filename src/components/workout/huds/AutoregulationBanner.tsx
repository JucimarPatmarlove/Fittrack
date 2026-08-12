import { motion } from 'framer-motion';

export function AutoregulationBanner({
  message,
  onClose,
}: {
  message: { text: string; type: string } | null;
  onClose: () => void;
}) {
  if (!message) return null;
  const isDanger = message.type === 'danger';
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{
        marginBottom: 16,
        padding: '12px 16px',
        borderRadius: 8,
        background: isDanger
          ? 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(153,27,27,0.25))'
          : 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(20,83,45,0.25))',
        border: `1px solid ${isDanger ? '#ef4444' : '#22c55e'}`,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: `0 4px 20px ${isDanger ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`,
      }}
    >
      <span style={{ fontSize: 20 }}>{isDanger ? '⚡' : '✨'}</span>
      <div style={{ flex: 1 }}>
        <p
          style={{
            fontFamily: "'Bebas Neue'",
            fontSize: 14,
            letterSpacing: 1,
            margin: 0,
            color: isDanger ? '#fca5a5' : '#86efac',
          }}
        >
          {isDanger ? 'AUTORREGULAÇÃO ATIVADA' : 'FEEDBACK DE PERFORMANCE'}
        </p>
        <p style={{ fontSize: 11, color: '#f8fafc', margin: '2px 0 0', lineHeight: 1.3 }}>
          {message.text}
        </p>
      </div>
      <button
        onClick={onClose}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#cbd5e1',
          fontSize: 16,
          cursor: 'pointer',
          padding: 4,
        }}
      >
        ×
      </button>
    </motion.div>
  );
}
