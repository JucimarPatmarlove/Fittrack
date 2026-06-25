// src/hooks/useBluetoothHRM.ts
import { useState, useEffect, useCallback, useRef } from 'react';

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

type HRMStatus = 'IDLE' | 'CONNECTING' | 'CONNECTED';

// ---- Pure utility functions (extracted for testability and low complexity) ----

/** Parse heart rate data from Bluetooth characteristic value */
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

/** Calculate exponential backoff delay in ms */
function getReconnectDelay(attempt: number): number {
  return Math.pow(2, attempt) * 2000; // 2s, 4s, 8s
}

/** Get BLE service UUID with fallback */
async function getHeartRateService(server: any) {
  try {
    return await server.getPrimaryService(HRM_SERVICE);
  } catch {
    return await server.getPrimaryService('heart_rate');
  }
}

/** Get heart rate measurement characteristic with fallback */
async function getHeartRateCharacteristic(service: any) {
  try {
    return await service.getCharacteristic(HRM_CHARACTERISTIC);
  } catch {
    return await service.getCharacteristic('heart_rate_measurement');
  }
}

/** Create a listener for characteristic value changes with throttling */
function createHeartRateListener(
  characteristic: any,
  lastUpdateRef: React.MutableRefObject<number>,
  onData: (data: HeartRateData) => void
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

// ---- React Hook ----

export function useBluetoothHRM() {
  const [device, setDevice] = useState<any>(null);
  const [heartRate, setHeartRate] = useState<HeartRateData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const characteristicRef = useRef<any>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(0);
  const cleanupRef = useRef<(() => void) | null>(null);

  const setupCharacteristicListener = useCallback(
    async (characteristic: any) => {
      // Cleanup previous listener
      cleanupRef.current?.();

      await characteristic.startNotifications();
      characteristicRef.current = characteristic;

      const removeListener = createHeartRateListener(characteristic, lastUpdateRef, (data) => {
        setHeartRate(data);
      });
      cleanupRef.current = removeListener;
    },
    []
  );

  const handleReconnect = useCallback(
    async (deviceObj: any) => {
      if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) return;

      const delay = getReconnectDelay(reconnectAttemptsRef.current);
      reconnectAttemptsRef.current++;

      setTimeout(async () => {
        try {
          const server = await deviceObj.gatt?.connect();
          if (!server) return;

          const service = await getHeartRateService(server);
          const characteristic = await getHeartRateCharacteristic(service);
          if (!characteristic) return;

          await setupCharacteristicListener(characteristic);
          setIsConnected(true);
          reconnectAttemptsRef.current = 0; // reset on success
        } catch (e) {
          console.warn('HRM Reconnection failed', e);
        }
      }, delay);
    },
    [setupCharacteristicListener]
  );

  const connect = useCallback(async () => {
    if (!navigator.bluetooth) {
      alert('Web Bluetooth não é suportado neste navegador.');
      return;
    }

    setIsScanning(true);
    try {
      const dev = await (navigator as any).bluetooth.requestDevice({
        filters: [{ services: [HRM_SERVICE, 'heart_rate'] }],
        optionalServices: [HRM_SERVICE, 'heart_rate'],
      });

      setDevice(dev);

      dev.addEventListener('gattserverdisconnected', () => {
        setIsConnected(false);
        setHeartRate(null);
        handleReconnect(dev);
      });

      const server = await dev.gatt?.connect();
      if (!server) return;

      const service = await getHeartRateService(server);
      const characteristic = await getHeartRateCharacteristic(service);
      if (!characteristic) return;

      await setupCharacteristicListener(characteristic);
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
    } catch (error) {
      console.error('Erro ao conectar HRM:', error);
    } finally {
      setIsScanning(false);
    }
  }, [handleReconnect, setupCharacteristicListener]);

  const disconnect = useCallback(async () => {
    cleanupRef.current?.();
    cleanupRef.current = null;

    if (characteristicRef.current) {
      try {
        await characteristicRef.current.stopNotifications();
      } catch {
        // Ignore errors on disconnect
      }
      characteristicRef.current = null;
    }

    if (device?.gatt?.connected) {
      try {
        device.gatt.disconnect();
      } catch {
        // Ignore errors
      }
    }

    setDevice(null);
    setIsConnected(false);
    setHeartRate(null);
    reconnectAttemptsRef.current = 0;
  }, [device]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupRef.current?.();
      if (device?.gatt?.connected) {
        try {
          device.gatt.disconnect();
        } catch {
          // Ignore
        }
      }
    };
  }, [device]);

  // Derive BPM and status from state
  const bpm = heartRate?.bpm || 0;
  const status: HRMStatus = isConnected ? 'CONNECTED' : isScanning ? 'CONNECTING' : 'IDLE';

  return {
    device,
    isConnected,
    heartRate,
    connect,
    disconnect,
    isScanning,
    bpm,
    status,
    errorMsg: '',
  };
}