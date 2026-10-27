import * as Sentry from '@sentry/react';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { initTelemetry, initWebVitals, initializeErrorTracking } from './utils/telemetry';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

// Resiliência PWA: recarregar página se chunk falhar ao carregar (evita erro de cache obsoleto)
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  if (!sessionStorage.getItem('chunk_reload')) {
    sessionStorage.setItem('chunk_reload', 'true');
    window.location.reload();
  }
});
setTimeout(() => sessionStorage.removeItem('chunk_reload'), 60000);

try {
  // ── INIT TELEMETRY E MONITORIZAÇÃO ────────────────────────
  initTelemetry();
  initializeErrorTracking();
  initWebVitals();

  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
      tracesSampleRate: 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });
  }

  if (import.meta.env.VITE_POSTHOG_KEY) {
    posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
      api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://eu.posthog.com',
      autocapture: true,
      capture_pageview: true,
    });
  }

  // Limpar Service Workers problemáticos que possam causar tela branca
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        registrations.forEach((reg) => {
          reg.unregister().then(() => {
            console.info('[SW] Service Worker removido para evitar cache obsoleto');
          });
        });
      })
      .catch(() => {});
  }

  // Renderizar PRIMEIRO — a app NUNCA deve ficar em branco
  const root = document.getElementById('root');
  if (root) {
    createRoot(root).render(
      <StrictMode>
        <PostHogProvider client={posthog}>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </PostHogProvider>
      </StrictMode>,
    );

    // Esconder Splash Screen Nativa (com animação)
    setTimeout(() => {
      const splash = document.getElementById('fittrack-splash');
      if (splash) {
        splash.classList.add('hidden');
        setTimeout(() => splash.remove(), 600); // Limpar do DOM após fade
      }
    }, 150);
  }

  // 2. Registo Silencioso do Service Worker (Resiliência Offline)
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('[Service Worker] Blindagem Offline ativada com sucesso.', registration.scope);
        })
        .catch((error) => {
          console.error('[Service Worker] Falha no registo do motor offline:', error);
        });
    });
  }
} catch (err) {
  // Fallback absoluto para erros top-level de inicialização
  console.error("FATAL TOP-LEVEL ERROR:", err);
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#080b0f;color:#fff;padding:20px;font-family:sans-serif">
        <div style="max-width:500px;text-align:center">
          <h1 style="color:#e8c84a">FitTrack — Erro Crítico</h1>
          <p style="color:#aaa;margin-bottom:20px">Falha na inicialização top-level. Clica no botão abaixo para forçar a limpeza da cache e reiniciar.</p>
          <pre style="background:#1a1a1a;padding:15px;border-radius:8px;font-size:12px;color:#ff6b6b;overflow-x:auto;text-align:left;margin-bottom:20px">${err instanceof Error ? err.message : String(err)}\n\n${err instanceof Error ? err.stack : ''}</pre>
          <button onclick="localStorage.clear();sessionStorage.clear();location.reload()" 
                  style="margin-top:16px;padding:12px 24px;background:#e8c84a;border:none;border-radius:8px;cursor:pointer;font-size:16px;font-weight:bold;color:#000">
            FORÇAR REINÍCIO
          </button>
        </div>
      </div>
    `;
  }
  const splash = document.getElementById('fittrack-splash');
  if (splash) {
    splash.classList.add('hidden');
    setTimeout(() => splash.remove(), 600);
  }
}
