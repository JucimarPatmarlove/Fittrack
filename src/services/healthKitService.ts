// src/services/healthKitService.ts
// Hub de Telemetria Biológica — Serviço HealthKit com fallback mock para browser
// Centraliza leitura de peso (RENPHO via HealthKit) e sono (Apple Watch via HealthKit)

export interface HealthKitData {
  weight: number | null;     // kg (RENPHO → HealthKit)
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
        read: [this.SampleNames.WEIGHT, this.SampleNames.SLEEP_ANALYSIS],
        write: [],
      });
      return true;
    } catch (err) {
      console.error('[HealthKit] Erro na autorização:', err);
      return false;
    }
  }

  // ─── LEITURA DE PESO (RENPHO → HealthKit) ─────────────────────────────────

  /**
   * Obtém o peso mais recente dos últimos 7 dias.
   * A balança RENPHO escreve automaticamente no HealthKit.
   */
  private async getLatestWeight(): Promise<number | null> {
    if (!this.isNative || !this.CapacitorHealthKit) return null;

    try {
      const query = await this.CapacitorHealthKit.queryHKitSampleType({
        sampleName: this.SampleNames.WEIGHT,
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
        limit: 1,
      });

      if (query.resultData && query.resultData.length > 0) {
        return query.resultData[0].value; // Peso em kg
      }
    } catch (err) {
      console.error('[HealthKit] Erro ao ler peso:', err);
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

  private mockWeight(): number {
    // Simula peso entre 74.0 e 76.5 kg
    return 75.2 + (Math.random() - 0.5) * 1.5;
  }

  private mockSleep(): number {
    // Simula sono entre 5.5 e 9.0 horas
    return 5.5 + Math.random() * 3.5;
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
      const mockData: HealthKitData = {
        weight: parseFloat(this.mockWeight().toFixed(1)),
        sleepHours: parseFloat(this.mockSleep().toFixed(1)),
        lastSync: Date.now(),
        isMock: true,
      };
      this.saveToCache(mockData);
      return mockData;
    }

    // Modo nativo → HealthKit real
    const pluginLoaded = await this.loadPlugin();
    if (!pluginLoaded) {
      return this.cached || { weight: null, sleepHours: null, lastSync: Date.now(), isMock: false };
    }

    try {
      const [weight, sleepHours] = await Promise.all([
        this.getLatestWeight(),
        this.getLatestSleepDuration(),
      ]);

      const result: HealthKitData = {
        weight: weight ?? this.cached?.weight ?? null,
        sleepHours: sleepHours ?? this.cached?.sleepHours ?? null,
        lastSync: Date.now(),
        isMock: false,
      };
      this.saveToCache(result);
      return result;
    } catch (error) {
      console.error('[HealthKit] Sync error:', error);
      return this.cached || { weight: null, sleepHours: null, lastSync: Date.now(), isMock: false };
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
