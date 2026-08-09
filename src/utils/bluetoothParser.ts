// src/utils/bluetoothParser.ts

import type { HeartRateData } from '../hooks/useBluetoothHRM';
import type { FitnessMachineData } from '../hooks/useFitnessMachine';

export function parseHeartRateMeasurement(value: DataView): HeartRateData {
  const flags = value.getUint8(0);
  const rateFormat = flags & 0x01; // 0 = uint8, 1 = uint16
  let bpm: number;
  if (rateFormat === 0) {
    bpm = value.getUint8(1);
  } else {
    bpm = value.getUint16(1, true);
  }
  const contact = !!(flags & 0x02);
  let energy: number | undefined;
  if (flags & 0x08) {
    const offset = rateFormat === 0 ? 2 : 3;
    energy = value.getUint16(offset, true);
  }
  return { bpm, timestamp: Date.now(), contact, energy };
}

export function parseFTMSMeasurement(value: DataView): FitnessMachineData {
  const data: FitnessMachineData = { timestamp: Date.now() };
  try {
    let offset = 0;
    const flags = value.getUint16(offset, true);
    offset += 2;
    if (flags & 0x0001) {
      data.instantSpeed = value.getUint16(offset, true) / 100;
      offset += 2;
    }
    if (flags & 0x0002) {
      data.averageSpeed = value.getUint16(offset, true) / 100;
      offset += 2;
    }
    if (flags & 0x0010) {
      data.heartRate = value.getUint8(offset);
      offset += 1;
    }
    if (flags & 0x0020) {
      data.cadence = value.getUint16(offset, true);
      offset += 2;
    }
    if (flags & 0x0040) {
      data.power = value.getInt16(offset, true);
      offset += 2;
    }
    if (flags & 0x0080) {
      data.distance = value.getUint32(offset, true);
      offset += 4;
    }
    if (flags & 0x0200) {
      data.calories = value.getUint16(offset, true);
      offset += 2;
    }
  } catch (e) {}
  return data;
}
