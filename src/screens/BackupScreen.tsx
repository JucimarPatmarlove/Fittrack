import { useState } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { GradientButton } from '../components/ui/GradientButton';
import { exportEncryptedBackup, importEncryptedBackup } from '../services/backupService';
import {
  downloadBackup,
  getStoredToken,
  listBackups,
  signInToGoogleDrive,
  uploadBackup,
} from '../services/googleDrive';

export default function BackupScreen() {
  const [isConnected, setIsConnected] = useState(!!getStoredToken());
  const [backups, setBackups] = useState<{ id: string; name: string; createdTime: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    const ok = await signInToGoogleDrive();
    if (ok) setIsConnected(true);
  };

  const handleBackup = async () => {
    setLoading(true);
    try {
      const blob = await exportEncryptedBackup();
      const filename = `fittrack_backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.enc`;
      await uploadBackup(blob, filename);
      alert('Backup guardado no Google Drive!');
      await handleListBackups();
    } catch (err) {
      alert('Erro: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleListBackups = async () => {
    setLoading(true);
    try {
      const files = await listBackups();
      setBackups(files);
    } catch (err) {
      console.error(err);
      alert('Falha ao listar backups: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (fileId: string) => {
    if (
      !window.confirm(
        'RESTAURO DE BACKUP: Atenção! Restaurar este backup irá substituir TODOS os teus dados de treino atuais. Desejas continuar?',
      )
    )
      return;
    setLoading(true);
    try {
      const buffer = await downloadBackup(fileId);
      const blob = new Blob([buffer], { type: 'application/octet-stream' });
      await importEncryptedBackup(blob);
    } catch (err) {
      alert('Falha ao restaurar: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  };

  return (
    <div className="p-5 max-w-lg mx-auto space-y-6">
      <h1 className="font-bebas text-3xl text-[#e8c84a]">NUVEM / BACKUP</h1>

      {!isConnected ? (
        <GlassCard className="p-6 text-center">
          <p className="text-gray-300 mb-4 text-sm">
            Guarda os teus treinos na tua própria conta Google Drive. O FitTrack usa uma arquitetura
            BYOC (Bring Your Own Cloud) com Zero Trust. Os teus dados são encriptados no dispositivo
            antes de fazer upload, garantindo 100% de privacidade.
          </p>
          <GradientButton onClick={handleConnect}>🔐 Ligar ao Google Drive</GradientButton>
        </GlassCard>
      ) : (
        <GlassCard className="p-6 space-y-6">
          <div className="flex flex-col gap-3">
            <GradientButton onClick={handleBackup} disabled={loading}>
              {loading ? 'A PROCESSAR...' : '☁️ Fazer Backup Agora'}
            </GradientButton>
            <GradientButton onClick={handleListBackups} variant="secondary" disabled={loading}>
              📋 Listar Backups na Drive
            </GradientButton>
          </div>

          {backups.length > 0 && (
            <div className="mt-6">
              <h3 className="text-white text-sm mb-3">Backups Disponíveis na Nuvem:</h3>
              <ul className="space-y-2 max-h-60 overflow-y-auto">
                {backups.map((b) => (
                  <li
                    key={b.id}
                    className="flex justify-between items-center bg-[#0a0f15] p-4 rounded-lg border border-[#e8c84a]/10"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs text-[#e8c84a]">{b.name}</span>
                      <span className="text-[10px] text-gray-500">{formatDate(b.createdTime)}</span>
                    </div>
                    <button
                      onClick={() => handleRestore(b.id)}
                      disabled={loading}
                      className="text-[#e8c84a] text-xs font-bold px-3 py-1 bg-[#e8c84a]/10 rounded hover:bg-[#e8c84a]/20 transition-colors"
                    >
                      RESTORE
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
}
