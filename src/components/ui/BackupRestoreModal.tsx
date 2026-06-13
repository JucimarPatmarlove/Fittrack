// src/components/ui/BackupRestoreModal.tsx
// Modal de restauro automático de backup extraído do App.tsx.

import React from 'react';
import { C } from '../../data/constants';

interface BackupRestoreModalProps {
  createdTime: string;
  onConfirm: () => void;
  onDismiss: () => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  createdTime,
  onConfirm,
  onDismiss,
}) => (
  <div
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}
  >
    <div
      className="glass"
      style={{ maxWidth: 400, width: '100%', padding: 24, textAlign: 'center' }}
    >
      <span style={{ fontSize: 40, display: 'block', marginBottom: 16 }}>☁️</span>
      <h2
        style={{
          fontFamily: "'Bebas Neue'",
          fontSize: 24,
          color: C.accent,
          marginBottom: 8,
          letterSpacing: 1,
        }}
      >
        BACKUP DETETADO
      </h2>
      <p style={{ fontSize: 14, color: C.text, marginBottom: 16 }}>
        Encontrámos um backup mais recente na tua Google Drive (
        {new Date(createdTime).toLocaleString()}).
        Desejas sincronizar agora e restaurar os teus dados de treino?
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={onConfirm}
          style={{
            flex: 1,
            background: C.accent,
            color: '#000',
            border: 'none',
            borderRadius: 8,
            padding: 12,
            fontFamily: "'Bebas Neue'",
            fontSize: 16,
            cursor: 'pointer',
          }}
        >
          RESTAURAR AGORA
        </button>
        <button
          onClick={onDismiss}
          style={{
            flex: 1,
            background: 'transparent',
            color: C.muted,
            border: `1px solid ${C.muted}`,
            borderRadius: 8,
            padding: 12,
            fontFamily: "'Bebas Neue'",
            fontSize: 16,
            cursor: 'pointer',
          }}
        >
          IGNORAR
        </button>
      </div>
    </div>
  </div>
);
