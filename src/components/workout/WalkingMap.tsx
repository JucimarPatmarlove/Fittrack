import { useEffect, useRef } from 'react';
import { C } from '../../data/constants';
import type { Hazard } from '../../hooks/useWalkingCoach';

interface GPSPoint {
  lat: number;
  lng: number;
}

interface WalkingMapProps {
  path: GPSPoint[];
  isActive: boolean;
  ghostPosition?: GPSPoint | null;
  hazards?: Hazard[];
}

export function WalkingMap({ path, isActive, ghostPosition, hazards = [] }: WalkingMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame: number;

    // Collect all points that need to be in the viewport
    const allPoints: GPSPoint[] = [...path];
    if (ghostPosition) allPoints.push(ghostPosition);
    hazards.forEach((hz) => allPoints.push({ lat: hz.lat, lng: hz.lng }));

    const draw = () => {
      // Ajustar resolução
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
      } else {
        ctx.clearRect(0, 0, rect.width, rect.height);
      }

      // Desenhar grelha
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x < rect.width; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, rect.height);
        ctx.stroke();
      }
      for (let y = 0; y < rect.height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(rect.width, y);
        ctx.stroke();
      }

      if (allPoints.length > 0) {
        const first = allPoints[0]!;
        let minLat = first.lat,
          maxLat = first.lat;
        let minLng = first.lng,
          maxLng = first.lng;
        allPoints.forEach((p) => {
          if (p.lat < minLat) minLat = p.lat;
          if (p.lat > maxLat) maxLat = p.lat;
          if (p.lng < minLng) minLng = p.lng;
          if (p.lng > maxLng) maxLng = p.lng;
        });

        const latRange = Math.max(maxLat - minLat, 0.0001);
        const lngRange = Math.max(maxLng - minLng, 0.0001);

        const paddingX = rect.width * 0.15;
        const paddingY = rect.height * 0.15;
        const usableW = rect.width - paddingX * 2;
        const usableH = rect.height - paddingY * 2;

        const mapX = (lng: number) => paddingX + ((lng - minLng) / lngRange) * usableW;
        const mapY = (lat: number) => paddingY + (1 - (lat - minLat) / latRange) * usableH;

        // ── Desenhar trajeto ──
        if (path.length > 1) {
          ctx.beginPath();
          ctx.moveTo(mapX(path[0]!.lng), mapY(path[0]!.lat));
          for (let i = 1; i < path.length; i++) {
            ctx.lineTo(mapX(path[i]!.lng), mapY(path[i]!.lat));
          }

          ctx.strokeStyle = C.accent;
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.shadowBlur = 10;
          ctx.shadowColor = C.accent;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // ── 👻 Ghost Marker ──
        if (ghostPosition) {
          const gx = mapX(ghostPosition.lng);
          const gy = mapY(ghostPosition.lat);
          const time = Date.now() / 1000;

          // Ghost glow
          ctx.beginPath();
          ctx.arc(gx, gy, 14 + Math.sin(time * 2) * 3, 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(148, 163, 184, 0.15)';
          ctx.fill();

          // Ghost body
          ctx.beginPath();
          ctx.arc(gx, gy, 7, 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
          ctx.shadowBlur = 12;
          ctx.shadowColor = 'rgba(148, 163, 184, 0.8)';
          ctx.fill();
          ctx.shadowBlur = 0;

          // Ghost label
          ctx.font = 'bold 9px "Outfit", sans-serif';
          ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
          ctx.textAlign = 'center';
          ctx.fillText('GHOST', gx, gy - 14);
        }

        // ── 📍 Hazard Markers ──
        hazards.forEach((hz) => {
          const hx = mapX(hz.lng);
          const hy = mapY(hz.lat);

          const colors: Record<string, { fill: string; glow: string }> = {
            danger: { fill: '#f97316', glow: 'rgba(249, 115, 22, 0.6)' },
            water: { fill: '#3b82f6', glow: 'rgba(59, 130, 246, 0.6)' },
            info: { fill: '#22c55e', glow: 'rgba(34, 197, 94, 0.6)' },
          };
          const color = colors[hz.type] ?? colors['info']!;

          // Diamond shape (rotated square)
          ctx.save();
          ctx.translate(hx, hy);
          ctx.rotate(Math.PI / 4);

          // Glow
          ctx.shadowBlur = 10;
          ctx.shadowColor = color.glow;
          ctx.fillStyle = color.fill;
          ctx.fillRect(-5, -5, 10, 10);
          ctx.shadowBlur = 0;

          ctx.restore();

          // Emoji label
          const emoji = hz.type === 'danger' ? '⚠️' : hz.type === 'water' ? '💧' : 'ℹ️';
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(emoji, hx, hy - 12);
        });

        // ── Posição atual do atleta ──
        if (path.length > 0) {
          const lastPoint = path[path.length - 1]!;
          const endX = mapX(lastPoint.lng);
          const endY = mapY(lastPoint.lat);

          const time = Date.now() / 1000;
          const pulseRadius = 10 + Math.sin(time * 3) * 4;
          ctx.beginPath();
          ctx.arc(endX, endY, pulseRadius, 0, 2 * Math.PI);
          ctx.fillStyle = `rgba(204, 255, 0, ${0.2 + Math.sin(time * 3) * 0.1})`;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(endX, endY, 6, 0, 2 * Math.PI);
          ctx.fillStyle = '#ffffff';
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#ffffff';
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      animationFrame = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationFrame);
  }, [path, isActive, ghostPosition, hazards]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', position: 'relative', background: '#080b0f' }}
    >
      {!isActive && path.length === 0 ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(8,11,15,0.8)',
            zIndex: 10,
            color: C.muted,
            fontSize: 12,
          }}
        >
          AGUARDAR SINAL GPS...
        </div>
      ) : null}

      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
}
