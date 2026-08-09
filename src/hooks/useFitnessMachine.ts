// src/hooks/useFitnessMachine.ts
import { useCallback, useEffect, useRef, useState } from 'react';

const FTMS_SERVICE = '00001826-0000-1000-8000-00805f9b34fb';
const FTMS_CHARACTERISTICS = [
  '00002ad2-0000-1000-8000-00805f9b34fb', // Indoor Bike
  '00002acd-0000-1000-8000-00805f9b34fb', // Treadmill
  '00002ace-0000-1000-8000-00805f9b34fb', // Crosstrainer
  '00002ad1-0000-1000-8000-00805f9b34fb', // Rower
];

export interface FitnessMachineData {
  instantSpeed?: number;
  averageSpeed?: number;
  instantPace?: number;
  heartRate?: number;
  cadence?: number;
  power?: number;
  distance?: number;
  calories?: number;
  timestamp: number;
}

// ---- Pure utility functions ----

/** Parse FTMS data flags and extract available metrics */
function parseFTMSFlags(value: DataView, offset: number): { flags: number; nextOffset: number } {
  const flags = value.getUint16(offset, true);
  return { flags, nextOffset: offset + 2 };
}

/** Read a metric field from the data view if the flag is set */
function readMetricIfFlagged<T>(
  value: DataView,
  flags: number,
  flagBit: number,
  offset: { current: number },
  reader: (v: DataView, o: number) => T,
): T | undefined {
  if (!(flags & flagBit)) return undefined;
  const result = reader(value, offset.current);
  offset.current += getByteSize(flagBit);
  return result;
}

function getByteSize(flagBit: number): number {
  switch (flagBit) {
    case 0x0010:
      return 1; // heart rate (uint8)
    case 0x0080:
      return 4; // distance (uint32)
    default:
      return 2; // most fields are uint16/int16
  }
}

function readUint16Speed(v: DataView, o: number): number {
  return v.getUint16(o, true) / 100;
}

function readUint8(v: DataView, o: number): number {
  return v.getUint8(o);
}

function readUint16(v: DataView, o: number): number {
  return v.getUint16(o, true);
}

function readInt16(v: DataView, o: number): number {
  return v.getInt16(o, true);
}

function readUint32(v: DataView, o: number): number {
  return v.getUint32(o, true);
}

/** Parse FTMS data from characteristic value */
function parseFTMSData(value: DataView): FitnessMachineData {
  const data: FitnessMachineData = { timestamp: Date.now() };
  try {
    const { flags } = parseFTMSFlags(value, 0);
    const offset = { current: 2 };

    data.instantSpeed = readMetricIfFlagged(value, flags, 0x0001, offset, readUint16Speed);
    data.averageSpeed = readMetricIfFlagged(value, flags, 0x0002, offset, readUint16Speed);
    data.heartRate = readMetricIfFlagged(value, flags, 0x0010, offset, readUint8);
    data.cadence = readMetricIfFlagged(value, flags, 0x0020, offset, readUint16);
    data.power = readMetricIfFlagged(value, flags, 0x0040, offset, readInt16);
    data.distance = readMetricIfFlagged(value, flags, 0x0080, offset, readUint32);
    data.calories = readMetricIfFlagged(value, flags, 0x0200, offset, readUint16);
  } catch {
    // Silently ignore parse errors
  }
  return data;
}

/** Discover the first available FTMS characteristic from the service */
async function discoverFTMSCharacteristic(service: any): Promise<any> {
  for (const uuid of FTMS_CHARACTERISTICS) {
    try {
      const characteristic = await service.getCharacteristic(uuid);
      if (characteristic) return characteristic;
    } catch {
      continue;
    }
  }
  return null;
}

/** Setup notifications for a BLE characteristic */
async function setupCharacteristicNotifications(
  characteristic: any,
  onData: (data: FitnessMachineData) => void,
): Promise<void> {
  await characteristic.startNotifications();
  characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
    if (event.target?.value) {
      const data = parseFTMSData(event.target.value);
      onData(data);
    }
  });
}

// ---- React Hook ----

export function useFitnessMachine() {
  const [device, setDevice] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [machineData, setMachineData] = useState<FitnessMachineData | null>(null);
  const characteristicRef = useRef<any>(null);

  const connect = useCallback(async () => {
    if (!(navigator as any).bluetooth) {
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
      if (!server) return;

      const service = await server.getPrimaryService(FTMS_SERVICE);
      if (!service) return;

      const characteristic = await discoverFTMSCharacteristic(service);
      if (!characteristic) return;

      characteristicRef.current = characteristic;

      await setupCharacteristicNotifications(characteristic, (data) => {
        setMachineData(data);
      });

      setIsConnected(true);
    } catch (error) {
      console.error('Erro ao conectar equipamento FTMS:', error);
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (characteristicRef.current) {
      await characteristicRef.current.stopNotifications().catch(() => {});
      characteristicRef.current = null;
    }

    if (device?.gatt?.connected) {
      try {
        device.gatt.disconnect();
      } catch {
        // Ignore
      }
    }

    setDevice(null);
    setIsConnected(false);
    setMachineData(null);
  }, [device]);

  useEffect(() => {
    return () => {
      if (device?.gatt?.connected) {
        try {
          device.gatt.disconnect();
        } catch {
          // Ignore
        }
      }
    };
  }, [device]);

  return { device, isConnected, machineData, connect, disconnect };
}
