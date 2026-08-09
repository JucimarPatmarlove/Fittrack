// @ts-nocheck
import { useCallback, useEffect, useRef } from 'react';
import { type BluetoothContext, bluetoothReducer } from '../machines/bluetoothMachine';
import { useMachine } from './useMachine';

const HRM_SERVICE = '0000180d-0000-1000-8000-00805f9b34fb';
const HRM_CHARACTERISTIC = '00002a37-0000-1000-8000-00805f9b34fb';
const MAX_RECONNECT_ATTEMPTS = 3;
const HEART_RATE_UPDATE_INTERVAL = 1000; // ms

export interface HeartRateData {
  bpm: number;
  timestamp: number;
  contact: boolean;
  energy?: number;
}

// ---- Pure utility functions ----

function parseHeartRateData(value: DataView): HeartRateData {
  const flags = value.getUint8(0);
  const rateFormat = flags & 0x01; // 0 = uint8, 1 = uint16
  const bpm = rateFormat === 0 ? value.getUint8(1) : value.getUint16(1, true);
  const contact = !!(flags & 0x02);

  let energy: number | undefined;
  if (flags & 0x08) {
    const offset = rateFormat === 0 ? 2 : 3;
    energy = value.getUint16(offset, true);
  }

  return { bpm, timestamp: Date.now(), contact, energy };
}

function getReconnectDelay(attempt: number): number {
  return Math.pow(2, attempt) * 2000;
}

async function getHeartRateService(server: any) {
  try {
    return await server.getPrimaryService(HRM_SERVICE);
  } catch {
    return await server.getPrimaryService('heart_rate');
  }
}

async function getHeartRateCharacteristic(service: any) {
  try {
    return await service.getCharacteristic(HRM_CHARACTERISTIC);
  } catch {
    return await service.getCharacteristic('heart_rate_measurement');
  }
}

function createHeartRateListener(
  characteristic: any,
  lastUpdateRef: React.MutableRefObject<number>,
  onData: (data: HeartRateData) => void,
) {
  const handler = (event: any) => {
    const target = event.target;
    if (!target?.value) return;

    const now = Date.now();
    if (now - lastUpdateRef.current < HEART_RATE_UPDATE_INTERVAL) return;

    const data = parseHeartRateData(target.value);
    onData(data);
    lastUpdateRef.current = now;
  };

  characteristic.addEventListener('characteristicvaluechanged', handler);
  return () => characteristic.removeEventListener('characteristicvaluechanged', handler);
}

// ---- React Hook with State Machine ----

const initialContext: BluetoothContext = {
  device: null,
  heartRate: null,
  reconnectAttempts: 0,
  errorMsg: '',
};

export function useBluetoothHRM() {
  const [state, send] = useMachine('IDLE', initialContext, bluetoothReducer);

  const characteristicRef = useRef<any>(null);
  const lastUpdateRef = useRef<number>(0);
  const cleanupRef = useRef<(() => void) | null>(null);

  const setupCharacteristicListener = useCallback(
    async (characteristic: any) => {
      cleanupRef.current?.();
      await characteristic.startNotifications();
      characteristicRef.current = characteristic;

      const removeListener = createHeartRateListener(characteristic, lastUpdateRef, (data) => {
        send({ type: 'HEART_RATE_UPDATE', data });
      });
      cleanupRef.current = removeListener;
    },
    [send],
  );

  const connectDevice = useCallback(
    async (deviceObj: any) => {
      try {
        const server = await deviceObj.gatt?.connect();
        if (!server) throw new Error('GATT server indisponível');

        const service = await getHeartRateService(server);
        const characteristic = await getHeartRateCharacteristic(service);
        if (!characteristic) throw new Error('Característica indisponível');

        await setupCharacteristicListener(characteristic);
        send({ type: 'CONNECTION_SUCCESS' });
      } catch (e: any) {
        console.warn('Falha na conexão:', e);
        send({ type: 'CONNECTION_LOST' });
      }
    },
    [setupCharacteristicListener, send],
  );

  const connect = useCallback(async () => {
    if (!navigator.bluetooth) {
      alert('Web Bluetooth não é suportado neste navegador.');
      return;
    }

    send({ type: 'START_SCAN' });
    try {
      const dev = await (navigator as any).bluetooth.requestDevice({
        filters: [{ services: [HRM_SERVICE, 'heart_rate'] }],
        optionalServices: [HRM_SERVICE, 'heart_rate'],
      });

      send({ type: 'DEVICE_FOUND', device: dev });

      dev.addEventListener('gattserverdisconnected', () => {
        send({ type: 'CONNECTION_LOST' });
      });

      await connectDevice(dev);
    } catch (error: any) {
      console.error('Erro ao conectar HRM:', error);
      send({ type: 'ERROR', message: error.message || 'Falha ao parear' });
    }
  }, [connectDevice, send]);

  const disconnect = useCallback(async () => {
    cleanupRef.current?.();
    cleanupRef.current = null;

    if (characteristicRef.current) {
      try {
        await characteristicRef.current.stopNotifications();
      } catch {}
      characteristicRef.current = null;
    }

    if (state.context.device?.gatt?.connected) {
      try {
        state.context.device.gatt.disconnect();
      } catch {}
    }

    send({ type: 'DISCONNECT' });
  }, [state.context.device, send]);

  // Handle reconnect logic outside the reducer
  useEffect(() => {
    if (state.value === 'RECONNECTING') {
      if (state.context.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        send({ type: 'MAX_RECONNECTS_REACHED' });
        return;
      }

      const delay = getReconnectDelay(state.context.reconnectAttempts);
      const timerId = setTimeout(() => {
        if (state.context.device) {
          connectDevice(state.context.device);
        }
      }, delay);

      return () => clearTimeout(timerId);
    }
  }, [state.value, state.context.reconnectAttempts, state.context.device, connectDevice, send]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupRef.current?.();
      if (state.context.device?.gatt?.connected) {
        try {
          state.context.device.gatt.disconnect();
        } catch {}
      }
    };
  }, [state.context.device]);

  return {
    device: state.context.device,
    isConnected: state.value === 'CONNECTED',
    heartRate: state.context.heartRate,
    connect,
    disconnect,
    isScanning:
      state.value === 'SCANNING' || state.value === 'CONNECTING' || state.value === 'RECONNECTING',
    bpm: state.context.heartRate?.bpm || 0,
    status: state.value,
    errorMsg: state.context.errorMsg,
  };
}
