// src/services/healthKitService.ts
// Hub de Telemetria Biológica — Serviço HealthKit com fallback mock para browser
// Centraliza leitura de peso (RENPHO via HealthKit) e sono (Apple Watch via HealthKit)

export interface HealthKitData {
  weight: number | null;     // kg (RENPHO → HealthKit)
  bodyFat: number | null;    // %
  bmi: number | null;
  leanMass: number | null;   // kg
  sleepHours: number | null; // horas de sono (Apple Watch → HealthKit)
  lastSync: number;          // timestamp do último sync
  isMock: boolean;           // true quando em modo simulação (browser)
}

class HealthKitService {
  private static instance: HealthKitService;
  private cached: HealthKitData | null = null;
  private readonly CACHE_KEY = 'fittrack_healthkit_cache';
  private isNative = false;
  private CapacitorHealthKit: any = null;
  private SampleNames: any = null;

  private constructor() {
    this.loadFromCache();
    this.detectPlatform();
  }

  static getInstance(): HealthKitService {
    if (!HealthKitService.instance) {
      HealthKitService.instance = new HealthKitService();
    }
    return HealthKitService.instance;
  }

  private detectPlatform(): void {
    try {
      this.isNative = typeof (window as any).Capacitor !== 'undefined' &&
        (window as any).Capacitor.isNativePlatform?.() === true;
    } catch {
      this.isNative = false;
    }
  }

  /**
   * Carrega dados de HealthKit do plugin nativo.
   * Chamada preguiçosa (lazy) para não quebrar o bundle quando o plugin não está instalado.
   */
  private async loadPlugin(): Promise<boolean> {
    if (this.CapacitorHealthKit) return true;
    if (!this.isNative) return false;

    try {
      // Usar variável para esconder o import estático do Vite (que falharia porque o pacote não existe offline)
      const pluginName = '@capacitor-community/health-kit';
      const mod = await import(/* @vite-ignore */ pluginName);
      this.CapacitorHealthKit = mod.CapacitorHealthKit;
      this.SampleNames = mod.SampleNames;
      return true;
    } catch (err) {
      console.warn('[HealthKit] Plugin não disponível:', err);
      return false;
    }
  }

  private loadFromCache(): void {
    try {
      const raw = localStorage.getItem(this.CACHE_KEY);
      if (raw) {
        this.cached = JSON.parse(raw);
      }
    } catch {
      // Cache corrupta — ignorar
    }
  }

  private saveToCache(data: HealthKitData): void {
    this.cached = data;
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(data));
    } catch {
      // localStorage cheio — ignorar
    }
  }

  // ─── AUTORIZAÇÃO ──────────────────────────────────────────────────────────

  /**
   * Solicita permissões de leitura (WEIGHT + SLEEP_ANALYSIS) ao utilizador.
   * No browser, retorna true (modo mock ativo).
   */
  async authorize(): Promise<boolean> {
    if (!this.isNative) {
      console.info('[HealthKit] Modo simulação ativo (browser)');
      return true;
    }

    const pluginLoaded = await this.loadPlugin();
    if (!pluginLoaded) return false;

    try {
      await this.CapacitorHealthKit.requestAuthorization({
        all: [],
        read: [
          this.SampleNames.WEIGHT, 
          this.SampleNames.SLEEP_ANALYSIS,
          this.SampleNames.BODY_FAT_PERCENTAGE,
          this.SampleNames.BODY_MASS_INDEX,
          this.SampleNames.LEAN_BODY_MASS
        ],
        write: [],
      });
      return true;
    } catch (err) {
      console.error('[HealthKit] Erro na autorização:', err);
      return false;
    }
  }

  private async getLatestSample(sampleName: string, daysWindow = 30): Promise<number | null> {
    if (!this.isNative || !this.CapacitorHealthKit) return null;

    try {
      const query = await this.CapacitorHealthKit.queryHKitSampleType({
        sampleName,
        startDate: new Date(Date.now() - daysWindow * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
        limit: 1,
      });

      if (query.resultData && query.resultData.length > 0) {
        return query.resultData[0].value;
      }
    } catch (err) {
      console.error(`[HealthKit] Erro ao ler ${sampleName}:`, err);
    }
    return null;
  }

  // ─── LEITURA DE SONO (Apple Watch → HealthKit) ─────────────────────────────

  /**
   * Obtém a duração total de sono da última noite (últimas 24h).
   * Filtra apenas amostras "Asleep" (exclui InBed, Awake, etc.)
   */
  private async getLatestSleepDuration(): Promise<number | null> {
    if (!this.isNative || !this.CapacitorHealthKit) return null;

    try {
      const query = await this.CapacitorHealthKit.queryHKitSampleType({
        sampleName: this.SampleNames.SLEEP_ANALYSIS,
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
        limit: 50,
      });

      if (query.resultData && query.resultData.length > 0) {
        let totalMinutes = 0;
        for (const sample of query.resultData) {
          // Filtra apenas sono efetivo (Asleep = 1 no HealthKit)
          if (sample.value === 'Asleep' || sample.value === 1) {
            const start = new Date(sample.startDate).getTime();
            const end = new Date(sample.endDate).getTime();
            totalMinutes += (end - start) / 1000 / 60;
          }
        }
        return totalMinutes / 60; // Converter para horas
      }
    } catch (err) {
      console.error('[HealthKit] Erro ao ler sono:', err);
    }
    return null;
  }

  // ─── MOCK DATA (BROWSER / DEV) ─────────────────────────────────────────────

  private generateMock(): HealthKitData {
    const weight = 79.5 + (Math.random() * 1.5 - 0.7);
    const bodyFat = 25.0 + (Math.random() * 0.6 - 0.3);
    const bmi = weight / (1.77 * 1.77);
    const leanMass = weight - (weight * (bodyFat / 100));
    
    return {
      weight: parseFloat(weight.toFixed(1)),
      bodyFat: parseFloat(bodyFat.toFixed(1)),
      bmi: parseFloat(bmi.toFixed(1)),
      leanMass: parseFloat(leanMass.toFixed(1)),
      sleepHours: parseFloat((6.5 + Math.random() * 2).toFixed(1)),
      lastSync: Date.now(),
      isMock: true,
    };
  }

  // ─── SYNC PRINCIPAL ─────────────────────────────────────────────────────────

  /**
   * Sincroniza todos os dados biométricos.
   * Em modo nativo: lê do HealthKit real.
   * Em browser: retorna dados mock simulados.
   * Sempre persiste em cache local para resiliência offline.
   */
  async syncHealthData(): Promise<HealthKitData> {
    // Modo browser → dados mock
    if (!this.isNative) {
      const mockData = this.generateMock();
      this.saveToCache(mockData);
      return mockData;
    }

    // Modo nativo → HealthKit real
    const pluginLoaded = await this.loadPlugin();
    if (!pluginLoaded) {
      return this.cached || { weight: null, bodyFat: null, bmi: null, leanMass: null, sleepHours: null, lastSync: Date.now(), isMock: false };
    }

    try {
      const [weight, bodyFatRaw, bmi, leanMass, sleepHours] = await Promise.all([
        this.getLatestSample(this.SampleNames.WEIGHT, 7),
        this.getLatestSample(this.SampleNames.BODY_FAT_PERCENTAGE),
        this.getLatestSample(this.SampleNames.BODY_MASS_INDEX),
        this.getLatestSample(this.SampleNames.LEAN_BODY_MASS),
        this.getLatestSleepDuration(),
      ]);

      const result: HealthKitData = {
        weight: weight ?? this.cached?.weight ?? null,
        bodyFat: bodyFatRaw !== null ? bodyFatRaw * 100 : (this.cached?.bodyFat ?? null), // Apple Health stores 0.25 for 25%
        bmi: bmi ?? this.cached?.bmi ?? null,
        leanMass: leanMass ?? this.cached?.leanMass ?? null,
        sleepHours: sleepHours ?? this.cached?.sleepHours ?? null,
        lastSync: Date.now(),
        isMock: false,
      };
      this.saveToCache(result);
      return result;
    } catch (error) {
      console.error('[HealthKit] Sync error:', error);
      return this.cached || { weight: null, bodyFat: null, bmi: null, leanMass: null, sleepHours: null, lastSync: Date.now(), isMock: false };
    }
  }

  /**
   * Retorna dados em cache sem fazer nova chamada (leitura rápida)
   */
  getCachedData(): HealthKitData | null {
    return this.cached;
  }

  /**
   * Verifica se estamos em modo nativo (iOS real com HealthKit)
   */
  isNativePlatform(): boolean {
    return this.isNative;
  }
}

export const healthKit = HealthKitService.getInstance();
