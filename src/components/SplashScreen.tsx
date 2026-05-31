'use client';

import { useEffect, useRef, useState } from 'react';

interface SplashScreenProps {
  logoUrl?: string;
  appName?: string;
}

// Particle system config
const PARTICLE_COUNT = 55;

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  color: string;
  pulse: number;
  pulseSpeed: number;
}

function createParticle(canvas: HTMLCanvasElement): Particle {
  const colors = [
    'rgba(99,102,241,',   // indigo
    'rgba(139,92,246,',   // violet
    'rgba(16,185,129,',   // emerald
    'rgba(165,180,252,',  // indigo-light
  ];
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 2.5 + 0.5,
    speedX: (Math.random() - 0.5) * 0.4,
    speedY: (Math.random() - 0.5) * 0.4,
    opacity: Math.random() * 0.6 + 0.1,
    color: colors[Math.floor(Math.random() * colors.length)],
    pulse: Math.random() * Math.PI * 2,
    pulseSpeed: Math.random() * 0.02 + 0.01,
  };
}

export default function SplashScreen({
  logoUrl = '/logo.png',
  appName = 'LET Reviewer',
}: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [displayPct, setDisplayPct] = useState(0);
  const [status, setStatus] = useState<'visible' | 'fading' | 'hidden'>('visible');
  const [loadingText, setLoadingText] = useState('Initializing…');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  // Loading messages that cycle through
  const loadingSteps = [
    'Initializing…',
    'Loading subjects…',
    'Preparing questions…',
    'Almost ready…',
    'Welcome!',
  ];

  // Canvas particle animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () =>
        createParticle(canvas)
      );
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connection lines between nearby particles
      particlesRef.current.forEach((p, i) => {
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const q = particlesRef.current[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(99,102,241,${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
      });

      // Draw & animate particles
      particlesRef.current.forEach((p) => {
        p.pulse += p.pulseSpeed;
        const pulsedOpacity = p.opacity * (0.7 + 0.3 * Math.sin(p.pulse));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${pulsedOpacity})`;
        ctx.fill();

        // Glow for larger particles
        if (p.size > 1.5) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
          ctx.fillStyle = `${p.color}${pulsedOpacity * 0.15})`;
          ctx.fill();
        }

        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
      });

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [status]);

  // Splash logic: progress + loading text cycling
  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');
    if (hasSeenSplash) {
      setStatus('hidden');
      return;
    }

    const DURATION = 2800;
    const start = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / DURATION) * 100, 100);
      setProgress(pct);

      // Smooth display counter
      setDisplayPct((prev) => {
        const target = Math.floor(pct);
        if (prev < target) return Math.min(prev + 1, target);
        return prev;
      });

      // Cycle loading text
      const stepIdx = Math.min(
        Math.floor((pct / 100) * loadingSteps.length),
        loadingSteps.length - 1
      );
      setLoadingText(loadingSteps[stepIdx]);

      if (elapsed >= DURATION) {
        clearInterval(interval);
        setTimeout(() => {
          setStatus('fading');
          sessionStorage.setItem('hasSeenSplash', 'true');
        }, 350);
        setTimeout(() => setStatus('hidden'), 1100);
      }
    }, 20);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === 'hidden') return null;

  return (
    <div
      className={`splash-overlay ${status === 'fading' ? 'fading' : ''}`}
      aria-hidden="true"
    >
      {/* Aurora background blobs */}
      <div className="splash-bg-aurora">
        <div className="splash-aurora-1" />
        <div className="splash-aurora-2" />
        <div className="splash-aurora-3" />
      </div>

      {/* Grid overlay */}
      <div className="splash-grid" />

      {/* Canvas particles */}
      <canvas ref={canvasRef} className="splash-particles" />

      {/* Main content */}
      <div className="splash-container">
        {/* Logo with rings */}
        <div className="splash-logo-wrapper">
          <div className="splash-ring-outer" />
          <div className="splash-ring-mid" />
          <div className="splash-glow-ring" />
          <div className="splash-logo-bg" />
          <img
            src={logoUrl || '/logo.png'}
            alt={appName}
            className="splash-logo"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/logo.png';
            }}
          />
        </div>

        {/* Text */}
        <p className="splash-eyebrow">Licensure Examination for Teachers</p>
        <h1 className="splash-title">{appName}</h1>
        <p className="splash-subtitle">
          Your comprehensive study companion — master every subject, ace every exam.
        </p>

        {/* Progress */}
        <div className="splash-loading">
          <div className="splash-loading-label">
            <span>{loadingText}</span>
            <span className="splash-loading-pct">{displayPct}%</span>
          </div>
          <div className="splash-progress-container">
            <div
              className="splash-progress-bar"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Version */}
      <p className="splash-version">LET Reviewer · v1.0</p>
    </div>
  );
}
