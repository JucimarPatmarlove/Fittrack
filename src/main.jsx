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

// Service Worker regista-se DEPOIS, sem bloquear a UI
// Desativado temporariamente para resolver problemas de cache no Firefox
// Para reativar: descomentar as linhas abaixo
/*
try {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({ immediate: true })
  }).catch((err) => {
    console.warn('[PWA] Service Worker não registado:', err.message)
  })
} catch (e) {
  console.warn('[PWA] SW indisponível:', e)
}
*/
