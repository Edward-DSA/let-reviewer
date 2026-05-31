'use client';

import { useEffect, useState } from 'react';

export default function OfflinePage() {
  const [retrying, setRetrying] = useState(false);
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!retrying) return;
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 400);
    return () => clearInterval(interval);
  }, [retrying]);

  const handleRetry = () => {
    setRetrying(true);
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0f1e',
        backgroundImage:
          'radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(16,185,129,0.05) 0%, transparent 50%)',
        fontFamily: "'Inter', system-ui, sans-serif",
        padding: '1.5rem',
      }}
    >
      {/* Glow orbs */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '15%',
            left: '10%',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '20%',
            right: '15%',
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
      </div>

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          maxWidth: 480,
          width: '100%',
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'rgba(99,102,241,0.12)',
            border: '2px solid rgba(99,102,241,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '3rem',
            margin: '0 auto 2rem',
            boxShadow: '0 0 40px rgba(99,102,241,0.15)',
          }}
        >
          📡
        </div>

        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: '#f1f5f9',
            marginBottom: '0.75rem',
            lineHeight: 1.2,
          }}
        >
          You&apos;re Offline
        </h1>

        <p
          style={{
            color: '#64748b',
            fontSize: '1rem',
            lineHeight: 1.7,
            marginBottom: '2rem',
          }}
        >
          No internet connection detected. Your previously synced{' '}
          <strong style={{ color: '#94a3b8' }}>study materials</strong> are still available — go
          back to the Study Hub to continue reviewing offline.
        </p>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: '2.5rem',
          }}
        >
          <button
            id="offline-retry-btn"
            onClick={handleRetry}
            disabled={retrying}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.75rem',
              borderRadius: '0.5rem',
              background: retrying ? 'rgba(99,102,241,0.5)' : '#6366f1',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.95rem',
              border: 'none',
              cursor: retrying ? 'default' : 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'inherit',
            }}
          >
            {retrying ? `Retrying${dots}` : '↺ Retry Connection'}
          </button>

          <a
            href="/study"
            id="offline-study-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.75rem',
              borderRadius: '0.5rem',
              background: 'rgba(255,255,255,0.05)',
              color: '#f1f5f9',
              fontWeight: 600,
              fontSize: '0.95rem',
              border: '1px solid rgba(255,255,255,0.12)',
              textDecoration: 'none',
              transition: 'all 0.2s',
            }}
          >
            📚 Go to Study Hub
          </a>
        </div>

        {/* Offline tip box */}
        <div
          style={{
            background: 'rgba(17,24,39,0.7)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '1rem',
            padding: '1.25rem 1.5rem',
            textAlign: 'left',
          }}
        >
          <p
            style={{
              fontSize: '0.8rem',
              color: '#64748b',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '0.75rem',
            }}
          >
            💡 While offline you can still:
          </p>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            {[
              '✅ Take quizzes from synced categories',
              '✅ View your progress and badge collection',
              '✅ Review past quiz results',
              '✅ Update your student profile',
            ].map((tip) => (
              <li key={tip} style={{ fontSize: '0.88rem', color: '#94a3b8' }}>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
