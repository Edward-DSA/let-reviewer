'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/app/page.module.css';

interface HomeClientProps {
  appName: string;
  logoUrl: string;
}

// Particle system config for transition overlay
const PARTICLE_COUNT = 35;

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  color: string;
}

function createParticle(canvas: HTMLCanvasElement): Particle {
  const colors = ['rgba(99,102,241,', 'rgba(139,92,246,', 'rgba(16,185,129,'];
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 2 + 0.5,
    speedX: (Math.random() - 0.5) * 0.5,
    speedY: (Math.random() - 0.5) * 0.5,
    opacity: Math.random() * 0.5 + 0.1,
    color: colors[Math.floor(Math.random() * colors.length)],
  };
}

export default function HomeClient({ appName, logoUrl }: HomeClientProps) {
  const router = useRouter();
  const [transitioning, setTransitioning] = useState(false);
  const [targetPath, setTargetPath] = useState('');
  const [loadingText, setLoadingText] = useState('Loading…');
  const [progress, setProgress] = useState(0);
  const [displayPct, setDisplayPct] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  // Handle buttons clicked with cinematic delay
  const handleNavigation = (path: string, text: string) => {
    setTargetPath(path);
    setLoadingText(text);
    setTransitioning(true);
    setProgress(0);
    setDisplayPct(0);
  };

  // Run progress bar animation & transition
  useEffect(() => {
    if (!transitioning) return;

    const duration = 1400; // Snappy 1.4s transition
    const start = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setProgress(pct);
      setDisplayPct(Math.floor(pct));

      if (elapsed >= duration) {
        clearInterval(interval);
        // Navigate
        window.location.href = targetPath;
      }
    }, 20);

    return () => clearInterval(interval);
  }, [transitioning, targetPath, router]);

  // Canvas particles for transition overlay
  useEffect(() => {
    if (!transitioning) return;
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
      particlesRef.current.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.opacity})`;
        ctx.fill();

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
  }, [transitioning]);

  return (
    <>
      {/* Homepage Main Body */}
      <div className={styles.wrapper}>
        <div className={`card glass animate-fade-in ${styles.content}`}>
          {logoUrl && (
            <img
              src={logoUrl}
              alt={appName}
              style={{
                width: '80px',
                height: '80px',
                objectFit: 'contain',
                margin: '0 auto 1.5rem auto',
                display: 'block',
                filter: 'drop-shadow(0 0 10px rgba(99, 102, 241, 0.3))',
              }}
            />
          )}
          <h1 className={styles.title}>{appName}</h1>
          <p className={styles.subtitle}>
            Your comprehensive offline-capable study companion for the Licensure Examination for Teachers.
          </p>
          <div className={styles.actions}>
            <button
              onClick={() => handleNavigation('/study', 'Entering Study Hub…')}
              className="btn btn-primary"
              style={{ minWidth: '160px' }}
            >
              Start Reviewing
            </button>
            <button
              onClick={() => handleNavigation('/admin', 'Connecting to Portal…')}
              className="btn"
              style={{
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#ffffff',
                minWidth: '160px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(255, 255, 255, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Teacher Portal
            </button>
          </div>
        </div>
      </div>

      {/* Cinematic Transition Overlay */}
      {transitioning && (
        <div className="splash-overlay" style={{ animation: 'none' }}>
          {/* Aurora blobs */}
          <div className="splash-bg-aurora">
            <div className="splash-aurora-1" />
            <div className="splash-aurora-2" />
            <div className="splash-aurora-3" />
          </div>

          <div className="splash-grid" />
          <canvas ref={canvasRef} className="splash-particles" />

          <div className="splash-container" style={{ animation: 'none' }}>
            {/* Spinning glowing rings */}
            <div className="splash-logo-wrapper">
              <div className="splash-ring-outer" />
              <div className="splash-ring-mid" />
              <div className="splash-glow-ring" />
              <div className="splash-logo-bg" />
              <img
                src={logoUrl || '/logo.png'}
                alt={appName}
                className="splash-logo"
                style={{ animation: 'logoFloat 3s ease-in-out infinite' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.png';
                }}
              />
            </div>

            <p className="splash-eyebrow">Licensure Examination for Teachers</p>
            <h1 className="splash-title" style={{ animation: 'none', opacity: 1 }}>
              {appName}
            </h1>
            <p className="splash-subtitle" style={{ animation: 'none', opacity: 0.8 }}>
              Preparing session resources and loading dashboards...
            </p>

            <div className="splash-loading" style={{ animation: 'none', opacity: 1 }}>
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
        </div>
      )}
    </>
  );
}
