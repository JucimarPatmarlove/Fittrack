import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { healthBridge, UnifiedHealthMetrics } from '../../services/healthBridge';
import { useHealthStore } from '../../stores/useHealthStore';
import { GlassCard } from '../ui/GlassCard';

export const HealthSyncSettings: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastSync, setLastSync] = useState<UnifiedHealthMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  const { syncHealthData } = useHealthStore();

  useEffect(() => {
    const token = localStorage.getItem('google_fit_token');
    setIsConnected(!!token);
  }, []);

  const handleConnectGoogle = async () => {
    setLoading(true);
    const ok = await healthBridge.connectGoogleFit();
    if (ok) {
      setIsConnected(true);
      await handleSync();
    }
    setLoading(false);
  };

  const handleSync = async () => {
    setLoading(true);
    await syncHealthData([], true); // Force Refresh (needs history, pass empty or fetch it)
    const storeData = useHealthStore.getState().healthKitData;
    if (storeData) {
      setLastSync(storeData);
    }
    setLoading(false);
  };

  const handleDisconnect = () => {
    healthBridge.disconnect();
    setIsConnected(false);
    setLastSync(null);
  };

  return (
    <GlassCard glow style={{ padding: 20, marginBottom: 20 }}>
      <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 24, color: '#e8c84a', marginBottom: 12 }}>🔄 Saúde & Conectividade</h2>
      <p style={{ fontSize: 14, color: '#eceae4', marginBottom: 16 }}>
        Sincroniza os teus dados de actividade e sono para um Readiness Score mais preciso.
      </p>

      {!isConnected ? (
        <button 
          onClick={handleConnectGoogle} 
          disabled={loading}
          style={{ background: 'linear-gradient(135deg, #e8c84a, #d4b83a)', color: '#000', border: 'none', padding: '12px 24px', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer', fontFamily: "'Bebas Neue'", fontSize: 16 }}
        >
          {loading ? 'A ligar...' : '🔗 Ligar ao Google Fit'}
        </button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <button 
              onClick={handleSync} 
              disabled={loading}
              style={{ background: 'rgba(255,255,255,0.1)', color: '#eceae4', border: '1px solid #eceae4', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontFamily: "'Bebas Neue'", fontSize: 16 }}
            >
              {loading ? 'A sincronizar...' : '📊 Sincronizar Agora'}
            </button>
            <button
              onClick={handleDisconnect}
              style={{ background: 'transparent', color: '#ff3366', border: '1px solid #ff3366', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontFamily: "'Bebas Neue'", fontSize: 16 }}
            >
              Desligar
            </button>
          </div>

          <AnimatePresence>
            {lastSync && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, background: '#0f1419', padding: 12, borderRadius: 8 }}
              >
                <div style={{ fontSize: 12, color: '#55626e' }}>⚖️ Peso</div>
                <div style={{ fontSize: 14, color: '#eceae4', textAlign: 'right', fontFamily: 'monospace' }}>{lastSync.weight?.toFixed(1) || 'N/A'} kg</div>
                
                {lastSync.sleepHours && (
                  <>
                    <div style={{ fontSize: 12, color: '#55626e' }}>😴 Sono</div>
                    <div style={{ fontSize: 14, color: '#eceae4', textAlign: 'right', fontFamily: 'monospace' }}>{lastSync.sleepHours.toFixed(1)}h</div>
                  </>
                )}
                
                <div style={{ fontSize: 12, color: '#55626e' }}>📅 Último Sync</div>
                <div style={{ fontSize: 12, color: '#55626e', textAlign: 'right' }}>{new Date(lastSync.lastSync).toLocaleString()}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </GlassCard>
  );
};
