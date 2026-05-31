'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAInstallPromptProps {
  appName: string;
}

export default function PWAInstallPrompt({ appName }: PWAInstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed this session
    try {
      if (sessionStorage.getItem('pwa-install-dismissed')) return;
    } catch {}

    // Don't show if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if ((window.navigator as any).standalone === true) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Delay showing the banner slightly so the page loads first
      setTimeout(() => setShow(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShow(false);
        setDeferredPrompt(null);
      }
    } finally {
      setInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    try {
      sessionStorage.setItem('pwa-install-dismissed', '1');
    } catch {}
  };

  if (!show || dismissed) return null;

  return (
    <div
      id="pwa-install-prompt"
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9998,
        width: 'min(440px, calc(100vw - 2rem))',
        background: 'rgba(17,24,39,0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(99,102,241,0.35)',
        borderRadius: '1.25rem',
        padding: '1.25rem 1.5rem',
        boxShadow: '0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1)',
        animation: 'slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        {/* Icon */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '12px',
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            flexShrink: 0,
            boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
          }}
        >
          📚
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f1f5f9', marginBottom: '0.2rem' }}>
            Install {appName}
          </p>
          <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5 }}>
            Add to your home screen for full offline access — study anytime, anywhere.
          </p>
        </div>

        {/* Close */}
        <button
          id="pwa-install-dismiss"
          onClick={handleDismiss}
          aria-label="Dismiss install prompt"
          style={{
            color: '#64748b',
            fontSize: '1.2rem',
            lineHeight: 1,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.1rem',
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      </div>

      {/* Feature chips */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {['📶 Works Offline', '⚡ Fast Launch', '🔔 Study Reminders'].map((feat) => (
          <span
            key={feat}
            style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              background: 'rgba(99,102,241,0.12)',
              color: '#a5b4fc',
              border: '1px solid rgba(99,102,241,0.25)',
              borderRadius: '99px',
              padding: '0.2rem 0.65rem',
            }}
          >
            {feat}
          </span>
        ))}
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          id="pwa-install-btn"
          onClick={handleInstall}
          disabled={installing}
          style={{
            flex: 1,
            padding: '0.65rem 1rem',
            borderRadius: '0.625rem',
            background: installing ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.9rem',
            border: 'none',
            cursor: installing ? 'default' : 'pointer',
            fontFamily: 'inherit',
            transition: 'all 0.2s',
            boxShadow: installing ? 'none' : '0 4px 16px rgba(99,102,241,0.35)',
          }}
        >
          {installing ? 'Installing…' : '⬇ Install App'}
        </button>
        <button
          onClick={handleDismiss}
          style={{
            padding: '0.65rem 1rem',
            borderRadius: '0.625rem',
            background: 'rgba(255,255,255,0.04)',
            color: '#94a3b8',
            fontWeight: 600,
            fontSize: '0.9rem',
            border: '1px solid rgba(255,255,255,0.08)',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Not now
        </button>
      </div>
    </div>
  );
}
