import { Capacitor } from '@capacitor/core';
import { healthKit, HealthKitData } from './healthKitService';
// Assumindo que a tua lógica de Google Fit atual exporta uma função 'fetchGoogleFitData'
// import { fetchGoogleFitData } from './googleFitApi'; 

export interface UnifiedHealthMetrics {
  weight: number | null;
  bodyFat: number | null;
  bmi: number | null;
  leanMass: number | null;
  sleepHours: number | null;
  platform: 'apple' | 'google' | 'mock';
  lastSync: number;
}

export class HealthBridge {
  
  /**
   * Ponto de entrada universal. 
   * Determina qual motor usar com base no Sistema Operativo.
   */
  public static async autoSync(): Promise<UnifiedHealthMetrics> {
    
    // 1. MODO SIMULAÇÃO (Browser Dev no Kali/Windows)
    if (!Capacitor.isNativePlatform()) {
      console.log('[HealthBridge] A ejetar dados simulados de telemetria.');
      return this.generateMockMetrics();
    }

    // 2. MODO NATIVO
    const platform = Capacitor.getPlatform();

    if (platform === 'ios') {
      console.log('[HealthBridge] Encaminhando para Apple HealthKit...');
      return await this.syncAppleHealth();
    } 
    else if (platform === 'android') {
      console.log('[HealthBridge] Encaminhando para Google Fit REST API...');
      return await this.syncGoogleFit();
    }

    return this.generateMockMetrics();
  }

  // --- MOTORES ESPECÍFICOS ---

  private static async syncAppleHealth(): Promise<UnifiedHealthMetrics> {
    try {
      await healthKit.authorize();
      const data: HealthKitData = await healthKit.syncHealthData();
      
      return {
        weight: data.weight,
        bodyFat: data.bodyFat,
        bmi: data.bmi,
        leanMass: data.leanMass,
        sleepHours: data.sleepHours,
        platform: 'apple',
        lastSync: Date.now()
      };
    } catch (error) {
      console.error('[HealthBridge] Falha no Apple Health:', error);
      return this.generateMockMetrics(); // Fallback de segurança
    }
  }

  private static async syncGoogleFit(): Promise<UnifiedHealthMetrics> {
    try {
      // ⚠️ A TUA IMPLEMENTAÇÃO EXISTENTE ENTRA AQUI ⚠️
      // const googleData = await fetchGoogleFitData();
      
      return {
        weight: 76.5, // googleData.weight
        bodyFat: 24.5, // googleData.bodyFat
        bmi: 24.4,     // googleData.bmi
        leanMass: 57.7, // googleData.leanMass
        sleepHours: 7.2, // googleData.sleepSession
        platform: 'google',
        lastSync: Date.now()
      };
    } catch (error) {
      console.error('[HealthBridge] Falha no Google Fit:', error);
      return this.generateMockMetrics();
    }
  }

  // --- SIMULAÇÃO PARA DEV ---

  private static generateMockMetrics(): UnifiedHealthMetrics {
    const weight = 75.2 + (Math.random() - 0.5) * 1.5;
    const bodyFat = 25.0 + (Math.random() * 0.6 - 0.3);
    return {
      weight: parseFloat(weight.toFixed(1)),
      bodyFat: parseFloat(bodyFat.toFixed(1)),
      bmi: parseFloat((weight / (1.77 * 1.77)).toFixed(1)),
      leanMass: parseFloat((weight - (weight * (bodyFat / 100))).toFixed(1)),
      sleepHours: parseFloat((6 + Math.random() * 3).toFixed(1)),
      platform: 'mock',
      lastSync: Date.now()
    };
  }

  // --- MÉTODOS DE COMPATIBILIDADE LEGADA ---
  public static async connectGoogleFit(): Promise<boolean> {
    console.log('[HealthBridge] connectGoogleFit stub');
    return true;
  }

  public static disconnect(): void {
    console.log('[HealthBridge] disconnect stub');
  }
}

export const healthBridge = HealthBridge;


