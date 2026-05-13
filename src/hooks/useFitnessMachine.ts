// src/hooks/useFitnessMachine.ts
import { useState, useCallback, useRef, useEffect } from 'react';

const FTMS_SERVICE = '00001826-0000-1000-8000-00805f9b34fb';
const INDOOR_BIKE_DATA = '00002ad2-0000-1000-8000-00805f9b34fb';
const TREADMILL_DATA = '00002acd-0000-1000-8000-00805f9b34fb';
const CROSSTRAINER_DATA = '00002ace-0000-1000-8000-00805f9b34fb';
const ROWER_DATA = '00002ad1-0000-1000-8000-00805f9b34fb';

export interface FitnessMachineData {
  instantSpeed?: number;   // km/h
  averageSpeed?: number;
  instantPace?: number;    // min/km
  heartRate?: number;
  cadence?: number;        // rpm
  power?: number;          // watts
  distance?: number;       // metros
  calories?: number;
  timestamp: number;
}

export function useFitnessMachine() {
  const [device, setDevice] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [machineData, setMachineData] = useState<FitnessMachineData | null>(null);
  const characteristicRef = useRef<any>(null);

  const parseFTMSData = (value: DataView): FitnessMachineData => {
    const data: FitnessMachineData = { timestamp: Date.now() };
    try {
      let offset = 0;
      const flags = value.getUint16(offset, true);
      offset += 2;
      if (flags & 0x0001) { // instant speed
        const speed = value.getUint16(offset, true) / 100;
        data.instantSpeed = speed;
        offset += 2;
      }
      if (flags & 0x0002) { // average speed
        data.averageSpeed = value.getUint16(offset, true) / 100;
        offset += 2;
      }
      if (flags & 0x0010) { // heart rate
        data.heartRate = value.getUint8(offset);
        offset += 1;
      }
      if (flags & 0x0020) { // cadence
        data.cadence = value.getUint16(offset, true);
        offset += 2;
      }
      if (flags & 0x0040) { // power
        data.power = value.getInt16(offset, true);
        offset += 2;
      }
      if (flags & 0x0080) { // distance
        data.distance = value.getUint32(offset, true);
        offset += 4;
      }
      if (flags & 0x0200) { // calories
        data.calories = value.getUint16(offset, true);
        offset += 2;
      }
    } catch(e){}
    return data;
  };

  const connect = useCallback(async () => {
    if (!navigator.bluetooth) {
      alert('Web Bluetooth não é suportado neste navegador.');
      return;
    }
    try {
      const dev = await (navigator as any).bluetooth.requestDevice({
        filters: [{ services: [FTMS_SERVICE] }],
        optionalServices: [FTMS_SERVICE],
      });
      setDevice(dev);
      dev.addEventListener('gattserverdisconnected', () => {
        setIsConnected(false);
        setMachineData(null);
      });
      const server = await dev.gatt?.connect();
      const service = await server?.getPrimaryService(FTMS_SERVICE);
      // Tentar encontrar qualquer característica de dados
      let characteristic = null;
      for (const uuid of [INDOOR_BIKE_DATA, TREADMILL_DATA, CROSSTRAINER_DATA, ROWER_DATA]) {
        try {
          characteristic = await service?.getCharacteristic(uuid);
          if (characteristic) break;
        } catch { continue; }
      }
      if (characteristic) {
        characteristicRef.current = characteristic;
        await characteristic.startNotifications();
        characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
          const target = event.target;
          if (target.value) {
            const data = parseFTMSData(target.value);
            setMachineData(data);
          }
        });
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Erro ao conectar equipamento FTMS:', error);
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (characteristicRef.current) {
      await characteristicRef.current.stopNotifications().catch(() => {});
      characteristicRef.current = null;
    }
    if (device && device.gatt?.connected) {
      device.gatt.disconnect();
    }
    setDevice(null);
    setIsConnected(false);
    setMachineData(null);
  }, [device]);

  useEffect(() => {
    return () => {
      if (device?.gatt?.connected) {
        device.gatt.disconnect();
      }
    };
  }, [device]);

  return { device, isConnected, machineData, connect, disconnect };
}
