export interface HealthMetrics {
  steps: number;
  activeEnergyBurned: number; // kcal
  heartRateResting?: number;   // bpm
  heartRateVariability?: number; // ms (HRV)
  sleepHours?: number;          // horas de sono
  date: string;                 // ISO
}

export interface SyncResult {
  success: boolean;
  platform: 'google' | 'apple' | 'none';
  metrics: HealthMetrics;
  error?: string;
}

class HealthBridge {
  private googleToken: string | null = null;
  private tokenExpiry: number = 0;
  private isNative = false;

  async init(): Promise<void> {
    this.isNative = typeof (window as any).Capacitor !== 'undefined';
    const stored = localStorage.getItem('google_fit_token');
    const expiry = localStorage.getItem('google_fit_token_expiry');
    if (stored && expiry && parseInt(expiry) > Date.now()) {
      this.googleToken = stored;
      this.tokenExpiry = parseInt(expiry);
    }
  }

  async connectGoogleFit(): Promise<boolean> {
    const clientId = import.meta.env.VITE_GOOGLE_FIT_CLIENT_ID || 'MOCK_CLIENT_ID';
    if (clientId === 'MOCK_CLIENT_ID') {
      console.warn('[HealthBridge] A usar MOCK_MODE para Google Fit.');
      // Simulate Google Fit OAuth
      return new Promise((resolve) => {
        setTimeout(() => {
          this.googleToken = 'mock_token_12345';
          this.tokenExpiry = Date.now() + 3600 * 1000;
          localStorage.setItem('google_fit_token', this.googleToken);
          localStorage.setItem('google_fit_token_expiry', this.tokenExpiry.toString());
          resolve(true);
        }, 1000);
      });
    }

    const scope = 'https://www.googleapis.com/auth/fitness.activity.read ' +
                  'https://www.googleapis.com/auth/fitness.body.read ' +
                  'https://www.googleapis.com/auth/fitness.sleep.read';
    const redirectUri = `${window.location.origin}/auth/google-fit/callback`;
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=token&` +
      `scope=${encodeURIComponent(scope)}`;

    return new Promise((resolve) => {
      const popup = window.open(authUrl, 'google-fit-auth', 'width=500,height=600');
      const messageHandler = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data?.type === 'GOOGLE_FIT_TOKEN') {
          this.googleToken = event.data.token;
          this.tokenExpiry = Date.now() + (event.data.expires_in || 3600) * 1000;
          localStorage.setItem('google_fit_token', this.googleToken);
          localStorage.setItem('google_fit_token_expiry', this.tokenExpiry.toString());
          window.removeEventListener('message', messageHandler);
          popup?.close();
          resolve(true);
        }
      };
      window.addEventListener('message', messageHandler);
      setTimeout(() => {
        window.removeEventListener('message', messageHandler);
        popup?.close();
        resolve(false);
      }, 120000);
    });
  }

  private async ensureGoogleToken(): Promise<string | null> {
    if (this.googleToken && this.tokenExpiry > Date.now()) return this.googleToken;
    return null;
  }

  async syncGoogleFit(date: Date = new Date()): Promise<SyncResult> {
    const token = await this.ensureGoogleToken();
    if (!token) {
      return { success: false, platform: 'google', metrics: this.emptyMetrics(), error: 'Not authenticated' };
    }

    if (token === 'mock_token_12345') {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            platform: 'google',
            metrics: {
              date: date.toISOString(),
              steps: Math.floor(4000 + Math.random() * 6000),
              activeEnergyBurned: Math.floor(300 + Math.random() * 500),
              sleepHours: 6.5 + Math.random() * 2,
              heartRateVariability: 45 + Math.random() * 30,
              heartRateResting: 55 + Math.random() * 10,
            }
          });
        }, 800);
      });
    }

    const startTime = new Date(date);
    startTime.setHours(0,0,0,0);
    const endTime = new Date(date);
    endTime.setHours(23,59,59,999);

    try {
      const response = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aggregateBy: [
            { dataTypeName: 'com.google.step_count.delta' },
            { dataTypeName: 'com.google.calories.expended' },
            { dataTypeName: 'com.google.heart_rate.bpm' },
            { dataTypeName: 'com.google.sleep.segment' }
          ],
          bucketByTime: { durationMillis: 86400000 },
          startTimeMillis: startTime.getTime(),
          endTimeMillis: endTime.getTime(),
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const metrics = this.parseGoogleFitData(data, date);
      return { success: true, platform: 'google', metrics };
    } catch (err) {
      console.error('[HealthBridge] Google Fit sync failed:', err);
      return { success: false, platform: 'google', metrics: this.emptyMetrics(), error: String(err) };
    }
  }

  private parseGoogleFitData(data: any, date: Date): HealthMetrics {
    let steps = 0, calories = 0;
    if (data.bucket) {
      for (const bucket of data.bucket) {
        for (const dataset of bucket.dataset || []) {
          for (const point of dataset.point || []) {
            const value = point.value?.[0]?.intVal || point.value?.[0]?.fpVal || 0;
            if (point.dataTypeName?.includes('step_count')) steps += value;
            if (point.dataTypeName?.includes('calories')) calories += value;
          }
        }
      }
    }
    return {
      steps,
      activeEnergyBurned: Math.round(calories),
      date: date.toISOString(),
      heartRateResting: undefined,
      heartRateVariability: undefined,
      sleepHours: undefined,
    };
  }

  async autoSync(): Promise<SyncResult> {
    if (this.googleToken) {
      return this.syncGoogleFit();
    }
    return { success: false, platform: 'none', metrics: this.emptyMetrics(), error: 'No health platform connected' };
  }

  disconnect(): void {
    this.googleToken = null;
    localStorage.removeItem('google_fit_token');
    localStorage.removeItem('google_fit_token_expiry');
  }

  private emptyMetrics(): HealthMetrics {
    return {
      steps: 0,
      activeEnergyBurned: 0,
      date: new Date().toISOString(),
    };
  }
}

export const healthBridge = new HealthBridge();
