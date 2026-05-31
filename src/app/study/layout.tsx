'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';

// Listen for background-sync success messages from the service worker
function useSWMessages(onSyncSuccess: (count: number) => void) {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_SUCCESS') {
        onSyncSuccess(event.data.count ?? 0);
      }
    };
    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  }, [onSyncSuccess]);
}

export default function StudyLayout({ children }: { children: React.ReactNode }) {
  const [isSynced,  setIsSynced]   = useState(false);
  const [isSyncing, setIsSyncing]  = useState(false);
  const [profileName, setProfileName] = useState('Student');
  const [streak,     setStreak]    = useState(0);
  const [badgeCount, setBadgeCount] = useState(0);
  const [appName, setAppName] = useState('LET Reviewer');
  const [logoUrl, setLogoUrl] = useState('');
  const [isOnline, setIsOnline]  = useState(true);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const [syncToastMsg, setSyncToastMsg] = useState('');

  // Queue a result for background sync when offline
  const queueResultForBgSync = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('SyncManager' in window)) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      // @ts-ignore — BackgroundSync API not yet in TS lib
      await reg.sync.register('sync-results');
    } catch (e) {
      console.warn('[Sync] Background sync registration failed:', e);
    }
  }, []);

  const syncData = useCallback(async () => {
    if (!navigator.onLine) return;
    setIsSyncing(true);
    setIsSynced(false);
    try {
      // 1. Upload unsynced local results
      const unsyncedResults = await db.results.where('synced').equals(0).toArray();
      if (unsyncedResults.length > 0) {
        const postRes = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ results: unsyncedResults }),
        });
        if (postRes.ok) {
          await Promise.all(unsyncedResults.map((r) => db.results.update(r.id!, { synced: 1 })));
        }
      }

      // 2. Download latest categories and questions from deployed server
      const res = await fetch('/api/sync', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { data } = await res.json();
      if (data?.categories?.length > 0) await db.categories.bulkPut(data.categories);
      if (data?.questions?.length > 0)  await db.questions.bulkPut(data.questions);

      setIsSynced(true);
    } catch (err) {
      console.warn('Sync failed:', err);
      setIsSynced(false);
      // Schedule background sync for when connection returns
      await queueResultForBgSync();
    } finally {
      setIsSyncing(false);
    }
  }, [queueResultForBgSync]);

  // Listen for background sync success from the SW
  useSWMessages(useCallback((count: number) => {
    setSyncToastMsg(`✅ ${count} result${count !== 1 ? 's' : ''} synced to server!`);
    setTimeout(() => setSyncToastMsg(''), 4000);
  }, []));

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);
    setShowOfflineBanner(!navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineBanner(false);
      syncData();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineBanner(true);
    };

    // Also sync on tab focus / visibility restore
    const handleVisibility = () => {
      if (!document.hidden && navigator.onLine) syncData();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibility);

    const init = async () => {
      try {
        let p = await db.profile.get(1);
        if (!p) {
          await db.profile.add({
            id: 1,
            name: 'Guest Student',
            badges: [],
            streak: 0,
            lastStudyDate: null,
            notificationsEnabled: false,
          });
          p = await db.profile.get(1);
        }
        if (p) {
          setProfileName(p.name);
          setStreak(p.streak);
          setBadgeCount(p.badges.length);

          if (
            p.notificationsEnabled &&
            p.lastStudyDate &&
            typeof Notification !== 'undefined' &&
            Notification.permission === 'granted'
          ) {
            const hoursSince = (Date.now() - p.lastStudyDate) / 3600000;
            if (hoursSince > 24) {
              new Notification(`${appName} 📚`, {
                body: "Time to review! Keep your streak alive 🔥",
                icon: logoUrl || '/logo.png',
              });
            }
          }
        }
      } catch (err) {
        console.warn('Profile init error:', err);
      }

      try {
        const res = await fetch('/api/settings', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.appName) setAppName(data.appName);
          if (data.logoUrl) setLogoUrl(data.logoUrl);
        }
      } catch (err) {
        console.warn('Settings fetch error:', err);
      }

      if (navigator.onLine) await syncData();
    };

    init();

    // Pull sync every 5 minutes while tab is open and online
    const pullSyncInterval = setInterval(() => {
      if (navigator.onLine) syncData();
    }, 300000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(pullSyncInterval);
    };
  }, [syncData]);

  const dotColor = !isOnline
    ? '#64748b'
    : isSyncing
    ? '#f59e0b'
    : isSynced
    ? '#10b981'
    : '#ef4444';

  const syncLabel = !isOnline
    ? 'Offline'
    : isSyncing
    ? 'Syncing…'
    : isSynced
    ? 'Synced'
    : 'Sync Failed';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Offline banner */}
      {showOfflineBanner && (
        <div
          style={{
            background: 'linear-gradient(135deg,rgba(239,68,68,0.18),rgba(245,158,11,0.1))',
            borderBottom: '1px solid rgba(239,68,68,0.3)',
            padding: '0.6rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem',
            fontSize: '0.85rem',
            color: '#fca5a5',
            fontWeight: 600,
          }}
        >
          <span>📡</span>
          <span>You&apos;re offline — study materials loaded from local storage</span>
          <button
            onClick={() => setShowOfflineBanner(false)}
            style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: '1.1rem', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Sync success toast */}
      {syncToastMsg && (
        <div
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            zIndex: 9999,
            background: 'linear-gradient(135deg,#111827,#1f2937)',
            border: '1px solid rgba(16,185,129,0.4)',
            borderRadius: '1rem',
            padding: '1rem 1.5rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            fontSize: '0.9rem',
            color: '#6ee7b7',
            fontWeight: 600,
            animation: 'fadeIn 0.3s ease-out',
          }}
        >
          {syncToastMsg}
        </div>
      )}

      {/* Header */}
      <header
        style={{
          background: 'rgba(10,15,30,0.9)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          padding: '0.75rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        {/* Logo */}
        <Link href="/study" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
          {logoUrl ? (
            <img src={logoUrl} alt={appName} style={{ width: 34, height: 34, objectFit: 'contain' }} />
          ) : (
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '9px',
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
              }}
            >
              📚
            </div>
          )}
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{appName}</span>
        </Link>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {streak > 0 && <span className="chip chip-yellow">🔥 {streak}d</span>}
          {badgeCount > 0 && <span className="chip chip-purple">🏅 {badgeCount}</span>}

          {/* Sync status */}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', cursor: !isOnline ? 'default' : 'pointer' }}
            title={isOnline ? 'Click to sync now' : 'Offline — using local data'}
            onClick={() => isOnline && !isSyncing && syncData()}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: dotColor,
                animation: isSyncing ? 'pulse 1s infinite' : 'none',
                flexShrink: 0,
              }}
            />
            <span style={{ color: 'var(--muted)' }}>{syncLabel}</span>
          </div>

          {/* Profile link */}
          <Link
            href="/study/profile"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(99,102,241,0.12)',
              border: '1px solid rgba(99,102,241,0.25)',
              borderRadius: '99px',
              padding: '0.3rem 0.7rem',
              fontSize: '0.82rem',
              fontWeight: 600,
            }}
          >
            👤 {profileName}
          </Link>
        </div>
      </header>

      <main style={{ flex: 1, padding: '2rem 1.5rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        {children}
      </main>

      <footer
        style={{
          textAlign: 'center',
          padding: '1rem',
          color: 'var(--muted)',
          fontSize: '0.8rem',
          borderTop: '1px solid var(--border)',
        }}
      >
        {appName} — Offline-First Study Companion
      </footer>
    </div>
  );
}
