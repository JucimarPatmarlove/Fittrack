import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Limpar Service Workers problemáticos que possam causar tela branca
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(reg => {
      reg.unregister().then(() => {
        console.info('[SW] Service Worker removido para evitar cache obsoleto')
      })
    })
  }).catch(() => {})
}

// Renderizar PRIMEIRO — a app NUNCA deve ficar em branco
const root = document.getElementById('root')
if (root) {
  try {
    createRoot(root).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )

    // Esconder Splash Screen Nativa (com animação)
    setTimeout(() => {
      const splash = document.getElementById('fittrack-splash')
      if (splash) {
        splash.classList.add('hidden')
        setTimeout(() => splash.remove(), 600) // Limpar do DOM após fade
      }
    }, 150)
  } catch (err) {
    // Fallback absoluto: se o React crashar, mostra o erro
    root.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#080b0f;color:#fff;padding:20px;font-family:sans-serif">
        <div style="max-width:500px;text-align:center">
          <h1 style="color:#e8c84a">FitTrack — Erro de Arranque</h1>
          <p style="color:#aaa">${err?.message || err}</p>
          <button onclick="localStorage.clear();sessionStorage.clear();location.reload()" 
                  style="margin-top:16px;padding:12px 24px;background:#e8c84a;border:none;border-radius:8px;cursor:pointer;font-size:16px">
            Limpar Cache e Recarregar
          </button>
        </div>
      </div>
    `
  }
}

// 2. Registo Silencioso do Service Worker (Resiliência Offline)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('[Service Worker] Blindagem Offline ativada com sucesso.', registration.scope);
      })
      .catch((error) => {
        console.error('[Service Worker] Falha no registo do motor offline:', error);
      });
  });
}
