// src/stores/useDeviceStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PairedDevice {
  id: string;
  name: string;
  type: 'hrm' | 'ftms';
  lastConnected: number;
}

interface DeviceState {
  pairedDevices: PairedDevice[];
  autoSync: boolean;
  addDevice: (device: PairedDevice) => void;
  removeDevice: (id: string) => void;
  setAutoSync: (enabled: boolean) => void;
}

export const useDeviceStore = create<DeviceState>()(
  persist(
    (set) => ({
      pairedDevices: [],
      autoSync: true,
      addDevice: (device) =>
        set((state) => ({
          pairedDevices: [...state.pairedDevices.filter((d) => d.id !== device.id), device],
        })),
      removeDevice: (id) =>
        set((state) => ({
          pairedDevices: state.pairedDevices.filter((d) => d.id !== id),
        })),
      setAutoSync: (autoSync) => set({ autoSync }),
    }),
    { name: 'fittrack_devices' }
  )
);
