// @ts-nocheck
// src/components/WatchSyncIndicator.tsx
import { useEffect, useRef, useState } from 'react';
import { C } from '../data/constants';
import { useDeviceStore } from '../stores/useDeviceStore';
import { GlassCard } from './ui/GlassCard';

export function WatchSyncIndicator() {
  const { pairedDevices, autoSync } = useDeviceStore();
  const [syncPending, setSyncPending] = useState(0);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    try {
      const worker = new Worker(new URL('../workers/syncWorker.ts', import.meta.url), {
        type: 'module',
      });
      workerRef.current = worker;
      worker.onmessage = (event) => {
        if (event.data?.type === 'queue') {
          setSyncPending((event.data.queue || []).filter((e: any) => e.pending).length);
        }
      };
      // Pedir a fila inicialmente e periodicamente para manter o widget atualizado
      worker.postMessage({ type: 'getQueue' });
      const interval = setInterval(() => {
        worker.postMessage({ type: 'getQueue' });
        // Tentar descarregar se houver pendentes
        if (navigator.onLine) {
          worker.postMessage({ type: 'sync' });
        }
      }, 5000);

      return () => {
        clearInterval(interval);
        worker.terminate();
      };
    } catch (e) {}
  }, []);

  if (pairedDevices.length === 0) return null;

  const mainDev = pairedDevices[pairedDevices.length - 1];

  return (
    <GlassCard
      style={{
        padding: '10px 14px',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
      }}
      onClick={() => window.dispatchEvent(new CustomEvent('NAVIGATE_TO', { detail: 'devices' }))}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 22 }}>{mainDev.type === 'hrm' ? '❤️' : '⌚'}</span>
        <div>
          <p style={{ fontSize: 13, fontWeight: 'bold', color: C.text, margin: 0 }}>
            {mainDev.name}
          </p>
          <p style={{ fontSize: 10, color: C.muted, margin: 0 }}>
            {autoSync ? 'Sincronização Ativa' : 'Offline Mode'}
          </p>
        </div>
      </div>
      {syncPending > 0 ? (
        <div
          style={{
            fontSize: 11,
            background: `${C.accent}22`,
            border: `1px solid ${C.accent}`,
            color: C.accent,
            padding: '2px 8px',
            borderRadius: 12,
            fontWeight: 'bold',
          }}
        >
          📡 {syncPending} pendente{syncPending > 1 ? 's' : ''}
        </div>
      ) : (
        <div style={{ fontSize: 11, color: C.green }}>✓ Sincronizado</div>
      )}
    </GlassCard>
  );
}
