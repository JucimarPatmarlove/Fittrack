import type React from 'react';

export function GlobalBackground({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        backgroundColor: '#080b0f',
        overflowX: 'hidden',
      }}
    >
      {/* Gradiente principal */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'linear-gradient(to bottom right, #0a0f15, #0c111a, #080b0f)',
          pointerEvents: 'none',
        }}
      />

      {/* Ruído subtil (textura) */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          opacity: 0.2,
          pointerEvents: 'none',
          mixBlendMode: 'overlay',
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '120px',
        }}
      />

      {/* Glow central (efeito moderno) */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '800px',
          height: '800px',
          backgroundColor: 'rgba(232, 200, 74, 0.05)',
          borderRadius: '50%',
          filter: 'blur(120px)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', zIndex: 10 }}>{children}</div>
    </div>
  );
}
