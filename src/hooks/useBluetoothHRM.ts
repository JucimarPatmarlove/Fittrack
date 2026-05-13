// src/hooks/useBluetoothHRM.ts
import { useState, useEffect, useCallback, useRef } from 'react';

const HRM_SERVICE = '0000180d-0000-1000-8000-00805f9b34fb';
const HRM_CHARACTERISTIC = '00002a37-0000-1000-8000-00805f9b34fb';

export interface HeartRateData {
  bpm: number;
  timestamp: number;
  contact: boolean; // se o sensor tem contacto com a pele
  energy?: number;  // gasto calórico (se disponível)
}

export function useBluetoothHRM() {
  const [device, setDevice] = useState<any>(null);
  const [heartRate, setHeartRate] = useState<HeartRateData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const characteristicRef = useRef<any>(null);

  const parseHeartRate = (value: DataView): HeartRateData => {
    const flags = value.getUint8(0);
    const rateFormat = flags & 0x01; // 0 = uint8, 1 = uint16
    let bpm: number;
    if (rateFormat === 0) {
      bpm = value.getUint8(1);
    } else {
      bpm = value.getUint16(1, true);
    }
    const contact = !!(flags & 0x02); // se o sensor detecta contacto com a pele
    // Calorias (não usamos, mas pode estar presente)
    let energy: number | undefined;
    if (flags & 0x08) {
      const offset = rateFormat === 0 ? 2 : 3;
      energy = value.getUint16(offset, true);
    }
    return { bpm, timestamp: Date.now(), contact, energy };
  };

  const reconnectAttemptsRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(0);

  const handleReconnect = useCallback(async (deviceObj: any) => {
    if (reconnectAttemptsRef.current >= 3) return;
    
    const delay = Math.pow(2, reconnectAttemptsRef.current) * 2000; // 2s, 4s, 8s
    reconnectAttemptsRef.current++;
    
    setTimeout(async () => {
      try {
        const server = await deviceObj.gatt?.connect();
        const service = await server?.getPrimaryService(HRM_SERVICE).catch(() => server?.getPrimaryService('heart_rate'));
        const characteristic = await service?.getCharacteristic(HRM_CHARACTERISTIC).catch(() => service?.getCharacteristic('heart_rate_measurement'));
        if (characteristic) {
          characteristicRef.current = characteristic;
          await characteristic.startNotifications();
          
          characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
            const target = event.target;
            if (target.value) {
              const now = Date.now();
              if (now - lastUpdateRef.current >= 1000) {
                const data = parseHeartRate(target.value);
                setHeartRate(data);
                lastUpdateRef.current = now;
              }
            }
          });
          
          setIsConnected(true);
          reconnectAttemptsRef.current = 0; // reset on success
        }
      } catch (e) {
        console.warn('HRM Reconnection failed', e);
      }
    }, delay);
  }, []);

  const connect = useCallback(async () => {
    if (!navigator.bluetooth) {
      alert('Web Bluetooth não é suportado neste navegador.');
      return;
    }
    setIsScanning(true);
    try {
      const dev = await (navigator as any).bluetooth.requestDevice({
        filters: [{ services: [HRM_SERVICE, 'heart_rate'] }].filter(Boolean),
        optionalServices: [HRM_SERVICE, 'heart_rate'],
      });
      setDevice(dev);
      dev.addEventListener('gattserverdisconnected', () => {
        setIsConnected(false);
        setHeartRate(null);
        handleReconnect(dev);
      });
      const server = await dev.gatt?.connect();
      const service = await server?.getPrimaryService(HRM_SERVICE).catch(() => server?.getPrimaryService('heart_rate'));
      const characteristic = await service?.getCharacteristic(HRM_CHARACTERISTIC).catch(() => service?.getCharacteristic('heart_rate_measurement'));
      if (characteristic) {
        characteristicRef.current = characteristic;
        await characteristic.startNotifications();
        characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
          const target = event.target;
          if (target.value) {
            const now = Date.now();
            if (now - lastUpdateRef.current >= 1000) {
              const data = parseHeartRate(target.value);
              setHeartRate(data);
              lastUpdateRef.current = now;
            }
          }
        });
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
      }
    } catch (error) {
      console.error('Erro ao conectar HRM:', error);
    } finally {
      setIsScanning(false);
    }
  }, [handleReconnect]);

  const disconnect = useCallback(async () => {
    if (characteristicRef.current) {
      try {
        await characteristicRef.current.stopNotifications();
        characteristicRef.current.removeEventListener('characteristicvaluechanged', () => {});
      } catch (e) {}
      characteristicRef.current = null;
    }
    if (device && device.gatt?.connected) {
      device.gatt.disconnect();
    }
    setDevice(null);
    setIsConnected(false);
    setHeartRate(null);
    reconnectAttemptsRef.current = 0;
  }, [device]);

  useEffect(() => {
    return () => {
      if (device?.gatt?.connected) {
        device.gatt.disconnect();
      }
    };
  }, [device]);

  return {
    device,
    isConnected,
    heartRate,
    connect,
    disconnect,
    isScanning,
    // Retrocompatibilidade total com ActiveWorkout e RestTimer:
    bpm: heartRate?.bpm || 0,
    status: isConnected ? 'CONNECTED' : isScanning ? 'CONNECTING' : 'IDLE',
    errorMsg: ''
  };
}
