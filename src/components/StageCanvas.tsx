import React, { useEffect, useRef } from 'react';

export interface ParticleBurst {
  id: number;
  x: number;
  y: number;
  color: string;
  label: string;
  createdAt: number;
}

interface StageCanvasProps {
  mode: 'demo' | 'video';
  videoRef: React.RefObject<HTMLVideoElement | null>;
  videoUrl: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isStripped: boolean;
  comparisonMode: 'after' | 'before';
  showParticles: boolean;
  activeBursts: ParticleBurst[];
  onVideoLoadedMetadata: (dur: number) => void;
  onVideoTimeUpdate: (time: number) => void;
  onVideoEnded: () => void;
  onVideoError: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  color: string;
  decay: number;
}

interface Ring {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

export const StageCanvas: React.FC<StageCanvasProps> = ({
  mode,
  videoRef,
  videoUrl,
  isPlaying,
  currentTime,
  duration,
  isStripped,
  comparisonMode,
  showParticles,
  activeBursts,
  onVideoLoadedMetadata,
  onVideoTimeUpdate,
  onVideoEnded,
  onVideoError,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const ringsRef = useRef<Ring[]>([]);
  const lastBurstIdRef = useRef<number>(0);

  // Spawn reactive particle art when new Foley bursts arrive
  useEffect(() => {
    if (!showParticles) return;
    activeBursts.forEach((burst) => {
      if (burst.id <= lastBurstIdRef.current) return;
      lastBurstIdRef.current = burst.id;

      const count = 28;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.3 - 0.15);
        const speed = 1.4 + Math.random() * 4.2;
        particlesRef.current.push({
          x: burst.x,
          y: burst.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 1.8 + Math.random() * 3.4,
          alpha: 0.95,
          color: burst.color,
          decay: 0.015 + Math.random() * 0.015,
        });
      }

      ringsRef.current.push({
        x: burst.x,
        y: burst.y,
        radius: 10,
        maxRadius: 115,
        alpha: 0.85,
        color: burst.color,
      });
    });
  }, [activeBursts, showParticles]);

  // Animation loop for Built-in Demo Scene + Acoustic Particle Art
  useEffect(() => {
    let rafId = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rainDrops = Array.from({ length: 75 }, (_, i) => ({
      x: (i * 97) % 960,
      y: (i * 53) % 540,
      len: 12 + (i % 14),
      speed: 8 + (i % 5) * 1.8,
    }));

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      if (mode === 'demo') {
        // Draw 18-second Rainy Alleyway Suspense Demo Storyboard
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#090D16');
        grad.addColorStop(0.62, '#131C2E');
        grad.addColorStop(1, '#0A0F18');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Distant streetlamp halo
        const lampGlow = ctx.createRadialGradient(w * 0.22, h * 0.24, 8, w * 0.22, h * 0.24, 210);
        lampGlow.addColorStop(0, 'rgba(245, 158, 11, 0.34)');
        lampGlow.addColorStop(0.5, 'rgba(245, 158, 11, 0.08)');
        lampGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.fillStyle = lampGlow;
        ctx.fillRect(0, 0, w, h);

        // Alleyway brick silhouettes
        ctx.fillStyle = '#0E1522';
        ctx.fillRect(0, h * 0.14, w * 0.17, h * 0.62);
        ctx.fillRect(w * 0.72, h * 0.08, w * 0.28, h * 0.68);

        // Wet cobblestone horizon
        ctx.fillStyle = '#0D131F';
        ctx.fillRect(0, h * 0.74, w, h * 0.26);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.16)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, h * 0.74);
        ctx.lineTo(w, h * 0.74);
        ctx.stroke();

        // Puddle highlight around t = 3.5s..5.5s
        const puddleActive = currentTime >= 3.2 && currentTime <= 5.5;
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(w * 0.36, h * 0.85, 92, 16, 0, 0, Math.PI * 2);
        ctx.fillStyle = puddleActive ? 'rgba(56, 189, 248, 0.22)' : 'rgba(56, 189, 248, 0.09)';
        ctx.fill();
        if (puddleActive) {
          const ripplePhase = (currentTime - 3.2) * 35;
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(w * 0.36, h * 0.85, Math.min(95, 20 + ripplePhase), Math.min(18, 5 + ripplePhase * 0.2), 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();

        // Heavy Iron Door on right wall (opens between 7.4s and 10.2s)
        const doorOpenAmount =
          currentTime < 7.4
            ? 0
            : currentTime < 9.2
            ? Math.min(1, (currentTime - 7.4) / 1.8)
            : 1;
        const doorX = w * 0.76;
        const doorY = h * 0.34;
        const doorW = 86;
        const doorH = 215;

        // Door frame interior
        ctx.fillStyle = '#05080F';
        ctx.fillRect(doorX, doorY, doorW, doorH);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.strokeRect(doorX, doorY, doorW, doorH);

        // Swinging door leaf
        ctx.save();
        const leafWidth = doorW * (1 - doorOpenAmount * 0.72);
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(doorX, doorY, leafWidth, doorH);
        ctx.strokeStyle = '#475569';
        ctx.strokeRect(doorX, doorY, leafWidth, doorH);
        // Handle
        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.arc(doorX + Math.max(8, leafWidth - 12), doorY + doorH * 0.54, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Window pane (upper right) — shatters at 14.2s
        const winX = w * 0.82;
        const winY = h * 0.14;
        const isShattered = currentTime >= 14.2;
        ctx.fillStyle = isShattered ? '#090D16' : 'rgba(56, 189, 248, 0.18)';
        ctx.fillRect(winX, winY, 64, 52);
        ctx.strokeStyle = isShattered ? '#EC4899' : '#64748B';
        ctx.lineWidth = 2;
        ctx.strokeRect(winX, winY, 64, 52);
        if (isShattered) {
          ctx.beginPath();
          ctx.moveTo(winX, winY);
          ctx.lineTo(winX + 28, winY + 26);
          ctx.lineTo(winX + 64, winY + 12);
          ctx.moveTo(winX + 28, winY + 26);
          ctx.lineTo(winX + 18, winY + 52);
          ctx.strokeStyle = 'rgba(236, 72, 153, 0.8)';
          ctx.stroke();
        }

        // Walking silhouette figure moving across alley
        const progress = Math.min(1, currentTime / Math.max(1, duration));
        const figX = w * (0.14 + progress * 0.56);
        const bob = isPlaying ? Math.abs(Math.sin(currentTime * 6.5)) * 5 : 0;
        const figY = h * 0.74 - bob;

        ctx.save();
        ctx.fillStyle = '#0F172A';
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 1.5;
        // Coat torso
        ctx.beginPath();
        ctx.roundRect(figX - 18, figY - 96, 36, 62, 8);
        ctx.fill();
        ctx.stroke();
        // Head
        ctx.beginPath();
        ctx.arc(figX, figY - 114, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Stride legs
        const stride = Math.sin(currentTime * 6.5) * 14;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#1E293B';
        ctx.beginPath();
        ctx.moveTo(figX - 6, figY - 36);
        ctx.lineTo(figX - 6 - stride, figY);
        ctx.moveTo(figX + 6, figY - 36);
        ctx.lineTo(figX + 6 + stride, figY);
        ctx.stroke();

        // Paper note in hand (10.5s - 13.5s)
        if (currentTime >= 10.5 && currentTime <= 13.5) {
          ctx.fillStyle = '#F8FAFC';
          ctx.fillRect(figX + 18, figY - 76, 16, 20);
          ctx.strokeStyle = '#A855F7';
          ctx.lineWidth = 2;
          ctx.strokeRect(figX + 18, figY - 76, 16, 20);
        }
        ctx.restore();

        // Subtle rain streaks in demo scene
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
        ctx.lineWidth = 1;
        rainDrops.forEach((drop) => {
          if (isPlaying) {
            drop.y = (drop.y + drop.speed) % h;
            drop.x = (drop.x - 1.5 + w) % w;
          }
          ctx.beginPath();
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x - 3, drop.y + drop.len);
          ctx.stroke();
        });

        // Visual Beat Caption inside storyboard so students know what action is happening
        let beatCaption = 'Scene Beat: Character enters dark, rain-soaked alleyway';
        if (currentTime >= 3.2 && currentTime < 5.2) {
          beatCaption = 'Scene Beat: Boot steps sharply into a deep street puddle';
        } else if (currentTime >= 5.2 && currentTime < 7.4) {
          beatCaption = 'Scene Beat: Heavy coat brushes past brickwork';
        } else if (currentTime >= 7.4 && currentTime < 10.5) {
          beatCaption = 'Scene Beat: Rusted iron warehouse door slowly swings open';
        } else if (currentTime >= 10.5 && currentTime < 13.8) {
          beatCaption = 'Scene Beat: Character unfolds a crumpled clue note';
        } else if (currentTime >= 13.8) {
          beatCaption = 'Scene Beat: Upper window shatters suddenly from inside!';
        }

        ctx.fillStyle = 'rgba(11, 15, 23, 0.78)';
        ctx.fillRect(20, h - 46, 520, 30);
        ctx.fillStyle = '#E2E8F0';
        ctx.font = '500 13px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(beatCaption, 32, h - 26);
      }

      // Render Acoustic Particle Art (both modes when enabled)
      if (showParticles) {
        for (let i = ringsRef.current.length - 1; i >= 0; i--) {
          const ring = ringsRef.current[i];
          ring.radius += 3.5;
          ring.alpha -= 0.024;
          if (ring.alpha <= 0 || ring.radius >= ring.maxRadius) {
            ringsRef.current.splice(i, 1);
            continue;
          }
          ctx.save();
          ctx.strokeStyle = ring.color;
          ctx.globalAlpha = Math.max(0, ring.alpha);
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const p = particlesRef.current[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.97;
          p.vy *= 0.97;
          p.alpha -= p.decay;
          if (p.alpha <= 0) {
            particlesRef.current.splice(i, 1);
            continue;
          }
          ctx.save();
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [mode, isPlaying, currentTime, duration, showParticles]);

  const audioStateLabel = isStripped
    ? comparisonMode === 'after'
      ? 'VIDEO AUDIO STRIPPED · FOLEY LAYERS ACTIVE'
      : 'VIDEO AUDIO STRIPPED · FOLEY MUTED (SILENT)'
    : comparisonMode === 'before'
    ? 'VIDEO AUDIO ON · FOLEY MUTED (BEFORE)'
    : 'VIDEO AUDIO ON · FOLEY LAYERS ACTIVE';

  return (
    <div className="relative w-full aspect-video bg-[#070A10] rounded-xl overflow-hidden border border-slate-800">
      {mode === 'video' && (
        <video
          ref={videoRef}
          src={videoUrl}
          playsInline
          crossOrigin="anonymous"
          onLoadedMetadata={(e) => onVideoLoadedMetadata(e.currentTarget.duration || 18)}
          onTimeUpdate={(e) => onVideoTimeUpdate(e.currentTarget.currentTime)}
          onEnded={onVideoEnded}
          onError={onVideoError}
          className="w-full h-full object-contain bg-black"
        />
      )}

      <canvas
        ref={canvasRef}
        width={960}
        height={540}
        aria-label="Foley visual playback stage and acoustic particle art visualizer"
        className={`w-full h-full block ${
          mode === 'video' ? 'absolute inset-0 pointer-events-none' : ''
        }`}
      />

      {/* Top Scrim Audio State Indicator — never hue-only, always explicit text */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        <div
          className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide border backdrop-blur-sm ${
            comparisonMode === 'before'
              ? 'bg-rose-950/85 border-rose-500/60 text-rose-200'
              : isStripped
              ? 'bg-amber-950/85 border-amber-500/60 text-amber-200'
              : 'bg-emerald-950/85 border-emerald-500/60 text-emerald-200'
          }`}
        >
          {audioStateLabel}
        </div>

        <div className="px-2.5 py-1 rounded-md bg-slate-950/80 border border-slate-700/70 text-xs font-mono-tabular text-slate-300">
          {mode === 'demo' ? 'Built-in Demo Scene' : 'Custom Video Clip'}
        </div>
      </div>
    </div>
  );
};
