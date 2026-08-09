import { GlassCard } from '../components/ui/GlassCard';
import { GradientButton } from '../components/ui/GradientButton';
import { C } from '../data/constants';
import { useBluetoothHRM } from '../hooks/useBluetoothHRM';
import { useFitnessMachine } from '../hooks/useFitnessMachine';
import { useDeviceStore } from '../stores/useDeviceStore';

export function DeviceManager() {
  const { pairedDevices, addDevice, removeDevice, autoSync, setAutoSync } = useDeviceStore();
  const hrm = useBluetoothHRM();
  const ftms = useFitnessMachine();

  const handleConnectHRM = async () => {
    await hrm.connect();
    if (hrm.device) {
      addDevice({
        id: hrm.device.id || `hrm_${Date.now()}`,
        name: hrm.device.name || 'Monitor Cardíaco BLE',
        type: 'hrm',
        lastConnected: Date.now(),
      });
    }
  };

  const handleConnectFTMS = async () => {
    await ftms.connect();
    if (ftms.device) {
      addDevice({
        id: ftms.device.id || `ftms_${Date.now()}`,
        name: ftms.device.name || 'Smartwatch / Passadeira FTMS',
        type: 'ftms',
        lastConnected: Date.now(),
      });
    }
  };

  const handleSimulateHRM = () => {
    addDevice({
      id: `mock_hrm_${Date.now()}`,
      name: 'Simulador Cardíaco Elite (Mock)',
      type: 'hrm',
      lastConnected: Date.now(),
    });
  };

  const handleSimulateFTMS = () => {
    addDevice({
      id: `mock_ftms_${Date.now()}`,
      name: 'Simulador Smartwatch Pro (Mock)',
      type: 'ftms',
      lastConnected: Date.now(),
    });
  };

  return (
    <div style={{ padding: '18px', maxWidth: 480, margin: '0 auto', paddingBottom: 100 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 18,
        }}
      >
        <p
          style={{
            fontFamily: "'Bebas Neue'",
            fontSize: 24,
            letterSpacing: 2,
            color: C.accent,
            margin: 0,
          }}
        >
          GESTOR DE DISPOSITIVOS
        </p>
        <button
          onClick={() =>
            window.dispatchEvent(new CustomEvent('NAVIGATE_TO', { detail: 'settings' }))
          }
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            padding: '6px 12px',
            color: C.text,
            fontSize: 12,
            cursor: 'pointer',
            fontFamily: "'Bebas Neue'",
          }}
        >
          VOLTAR
        </button>
      </div>

      {/* Dispositivos já emparelhados */}
      {pairedDevices.length > 0 && (
        <GlassCard style={{ padding: 16, marginBottom: 20 }}>
          <p
            style={{
              fontFamily: "'Bebas Neue'",
              fontSize: 16,
              letterSpacing: 1,
              color: C.green,
              marginBottom: 12,
            }}
          >
            📱 LIGADOS & EMPARELHADOS
          </p>
          {pairedDevices.map((dev) => (
            <div
              key={dev.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: `1px solid ${C.border}`,
                padding: '10px 0',
              }}
            >
              <div>
                <p style={{ fontWeight: 'bold', fontSize: 14, color: C.text }}>{dev.name}</p>
                <p style={{ fontSize: 11, color: C.muted }}>
                  {dev.type === 'hrm'
                    ? '❤️ Sensor Cardíaco (0x180D)'
                    : '⌚ Equipamento FTMS (0x1826)'}
                </p>
              </div>
              <button
                onClick={() => removeDevice(dev.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: C.red,
                  fontSize: 12,
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Esquecer
              </button>
            </div>
          ))}
        </GlassCard>
      )}

      {/* Sincronização automática */}
      <GlassCard style={{ padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontWeight: 'bold', fontSize: 14, color: C.text }}>
              🤖 Sincronização Automática
            </p>
            <p style={{ fontSize: 11, color: C.muted }}>
              Envia dados pendentes em background (Fila IDB)
            </p>
          </div>
          <button
            onClick={() => setAutoSync(!autoSync)}
            style={{
              width: 44,
              height: 24,
              borderRadius: 12,
              cursor: 'pointer',
              border: 'none',
              background: autoSync ? C.accent : C.surface,
              display: 'flex',
              alignItems: 'center',
              padding: 2,
              transition: 'background 0.3s',
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: '#000',
                transform: autoSync ? 'translateX(20px)' : 'translateX(0px)',
                transition: 'transform 0.3s',
              }}
            />
          </button>
        </div>
      </GlassCard>

      {/* Procurar novos dispositivos */}
      <GlassCard style={{ padding: 16, marginBottom: 20 }}>
        <p
          style={{
            fontFamily: "'Bebas Neue'",
            fontSize: 16,
            letterSpacing: 1,
            color: C.text,
            marginBottom: 12,
          }}
        >
          🔍 PROCURAR VIA WEB BLUETOOTH
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <GradientButton
            onClick={handleConnectHRM}
            variant="primary"
            style={{
              width: '100%',
              padding: 12,
              fontSize: 14,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            ❤️ Conectar Monitor Cardíaco (HRM)
          </GradientButton>
          <GradientButton
            onClick={handleConnectFTMS}
            variant="secondary"
            style={{
              width: '100%',
              padding: 12,
              fontSize: 14,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            ⌚ Conectar Smartwatch / Passadeira (FTMS)
          </GradientButton>
        </div>

        {hrm.isConnected && (
          <div
            style={{
              marginTop: 12,
              textAlign: 'center',
              fontSize: 12,
              color: C.green,
              background: `${C.green}11`,
              padding: 8,
              borderRadius: 6,
            }}
          >
            ❤️ HRM Ativo em tempo real: <b>{hrm.heartRate?.bpm || hrm.bpm} BPM</b>
          </div>
        )}
        {ftms.isConnected && ftms.machineData && (
          <div
            style={{
              marginTop: 12,
              textAlign: 'center',
              fontSize: 12,
              color: C.green,
              background: `${C.green}11`,
              padding: 8,
              borderRadius: 6,
            }}
          >
            📊 Velocidade: {ftms.machineData.instantSpeed?.toFixed(1) || 0} km/h | Cadência:{' '}
            {ftms.machineData.cadence || 0} rpm
          </div>
        )}

        <div style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 11, color: C.muted, marginBottom: 8, textAlign: 'center' }}>
            Sem hardware compatível por perto? Testa os modos virtuais:
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleSimulateHRM}
              style={{
                flex: 1,
                background: C.surface,
                border: `1px dashed ${C.border}`,
                color: C.accent,
                fontSize: 11,
                padding: 8,
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              + Simular HRM
            </button>
            <button
              onClick={handleSimulateFTMS}
              style={{
                flex: 1,
                background: C.surface,
                border: `1px dashed ${C.border}`,
                color: C.accent,
                fontSize: 11,
                padding: 8,
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              + Simular FTMS
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

export default DeviceManager;
