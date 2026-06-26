import { HeartRateData } from '../hooks/useBluetoothHRM';

export type BluetoothState = 'IDLE' | 'SCANNING' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'ERROR';

export interface BluetoothContext {
  device: any | null;
  heartRate: HeartRateData | null;
  reconnectAttempts: number;
  errorMsg: string;
}

export type BluetoothEvent =
  | { type: 'START_SCAN' }
  | { type: 'DEVICE_FOUND'; device: any }
  | { type: 'CONNECTION_SUCCESS' }
  | { type: 'HEART_RATE_UPDATE'; data: HeartRateData }
  | { type: 'DISCONNECT' }
  | { type: 'CONNECTION_LOST' }
  | { type: 'MAX_RECONNECTS_REACHED' }
  | { type: 'ERROR'; message: string };

export function bluetoothReducer(
  state: { value: BluetoothState; context: BluetoothContext },
  event: BluetoothEvent
): { value: BluetoothState; context: BluetoothContext } {
  const { value, context } = state;

  switch (value) {
    case 'IDLE':
      if (event.type === 'START_SCAN') return { value: 'SCANNING', context: { ...context, errorMsg: '' } };
      break;

    case 'SCANNING':
      if (event.type === 'DEVICE_FOUND') return { value: 'CONNECTING', context: { ...context, device: event.device } };
      if (event.type === 'ERROR') return { value: 'ERROR', context: { ...context, errorMsg: event.message } };
      if (event.type === 'DISCONNECT') return { value: 'IDLE', context: { ...context, device: null } };
      break;

    case 'CONNECTING':
      if (event.type === 'CONNECTION_SUCCESS') return { value: 'CONNECTED', context: { ...context, reconnectAttempts: 0, errorMsg: '' } };
      if (event.type === 'CONNECTION_LOST') return { value: 'RECONNECTING', context: { ...context, reconnectAttempts: context.reconnectAttempts + 1 } };
      if (event.type === 'ERROR') return { value: 'ERROR', context: { ...context, errorMsg: event.message } };
      if (event.type === 'DISCONNECT') return { value: 'IDLE', context: { ...context, device: null } };
      break;

    case 'CONNECTED':
      if (event.type === 'HEART_RATE_UPDATE') return { value: 'CONNECTED', context: { ...context, heartRate: event.data } };
      if (event.type === 'CONNECTION_LOST') return { value: 'RECONNECTING', context: { ...context, reconnectAttempts: context.reconnectAttempts + 1 } };
      if (event.type === 'DISCONNECT') return { value: 'IDLE', context: { ...context, device: null, heartRate: null, reconnectAttempts: 0 } };
      break;

    case 'RECONNECTING':
      if (event.type === 'CONNECTION_SUCCESS') return { value: 'CONNECTED', context: { ...context, reconnectAttempts: 0, errorMsg: '' } };
      if (event.type === 'MAX_RECONNECTS_REACHED') return { value: 'IDLE', context: { ...context, device: null, heartRate: null, reconnectAttempts: 0, errorMsg: 'Falha ao reconectar.' } };
      if (event.type === 'CONNECTION_LOST') return { value: 'RECONNECTING', context: { ...context, reconnectAttempts: context.reconnectAttempts + 1 } };
      if (event.type === 'DISCONNECT') return { value: 'IDLE', context: { ...context, device: null, heartRate: null, reconnectAttempts: 0 } };
      break;

    case 'ERROR':
      if (event.type === 'START_SCAN') return { value: 'SCANNING', context: { ...context, errorMsg: '' } };
      if (event.type === 'DISCONNECT') return { value: 'IDLE', context: { ...context, device: null, errorMsg: '' } };
      break;
  }

  return state; // No transition
}
