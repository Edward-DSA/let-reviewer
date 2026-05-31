'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';

export default function StudyLayout({ children }: { children: React.ReactNode }) {
  const [isSynced,  setIsSynced]   = useState(false);
  const [isSyncing, setIsSyncing]  = useState(false);
  const [profileName, setProfileName] = useState('Student');
  const [streak,     setStreak]    = useState(0);
  const [badgeCount, setBadgeCount] = useState(0);
  
  const [appName, setAppName] = useState('LET Reviewer');
  const [logoUrl, setLogoUrl] = useState('');

  const [isOnline, setIsOnline]  = useState(true);

  const syncData = useCallback(async () => {
    if (!navigator.onLine) return; // Don't try to sync if browser knows it's offline
    setIsSyncing(true);
    setIsSynced(false);
    try {
      // 1. Upload unsynced local results
      const unsyncedResults = await db.results.where('synced').equals(0).toArray();
      if (unsyncedResults.length > 0) {
        const postRes = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ results: unsyncedResults })
        });
        if (postRes.ok) {
          // Mark as synced locally
          await Promise.all(unsyncedResults.map(r => db.results.update(r.id!, { synced: 1 })));
        }
      }

      // 2. Download latest categories and questions
      const res = await fetch('/api/sync');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { data } = await res.json();
      if (data?.categories?.length > 0) await db.categories.bulkPut(data.categories);
      if (data?.questions?.length > 0)  await db.questions.bulkPut(data.questions);
      
      setIsSynced(true);
    } catch (err) {
      console.warn('Sync failed:', err);
      setIsSynced(false);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      
      const handleOnline = () => {
        setIsOnline(true);
        syncData(); // Auto sync when connection is restored
      };
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      const init = async () => {
        // Profile init — wrapped in try/catch so errors never block sync
        try {
          let p = await db.profile.get(1);
          if (!p) {
            await db.profile.add({ id: 1, name: 'Guest Student', badges: [], streak: 0, lastStudyDate: null, notificationsEnabled: false });
            p = await db.profile.get(1);
          }
          if (p) {
            setProfileName(p.name);
            setStreak(p.streak);
            setBadgeCount(p.badges.length);

            // Offline reminder notification
            if (p.notificationsEnabled && p.lastStudyDate && typeof Notification !== 'undefined') {
              const hoursSince = (Date.now() - p.lastStudyDate) / 3600000;
              if (hoursSince > 24 && Notification.permission === 'granted') {
                new Notification(`${appName} 📚`, { body: "Time to review! Keep your streak alive 🔥", icon: logoUrl || '/logo.png' });
              }
            }
          }
        } catch (err) {
          console.warn('Profile init error:', err);
        }

        try {
          const res = await fetch('/api/settings');
          if (res.ok) {
            const data = await res.json();
            if (data.appName) setAppName(data.appName);
            if (data.logoUrl) setLogoUrl(data.logoUrl);
          }
        } catch(err) {
          console.warn('Settings fetch error:', err);
        }

        // Always attempt sync regardless of profile errors
        if (navigator.onLine) await syncData();
      };
      
      init();

      // Implement Pull-based sync strategy: App checks for updates when internet is available.
      // We check every 5 minutes (300,000 ms)
      const pullSyncInterval = setInterval(() => {
        if (navigator.onLine) {
          syncData();
        }
      }, 300000);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        clearInterval(pullSyncInterval);
      };
    }
  }, [syncData]);

  const dotColor = !isOnline ? 'var(--muted)' : (isSyncing ? 'var(--warning)' : isSynced ? 'var(--secondary)' : 'var(--danger)');
  const syncLabel = !isOnline ? 'Offline' : (isSyncing ? 'Syncing…' : isSynced ? 'Online & Synced' : 'Sync Failed');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        background: 'rgba(10,15,30,0.9)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        position: 'sticky', top: 0, zIndex: 100,
        padding: '0.75rem 1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
      }}>
        {/* Logo */}
        <Link href="/study" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
          {logoUrl ? (
            <img src={logoUrl} alt={appName} style={{ width: 34, height: 34, objectFit: 'contain' }} />
          ) : (
            <div style={{
              width: 34, height: 34, borderRadius: '9px',
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
            }}>📚</div>
          )}
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{appName}</span>
        </Link>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {streak > 0 && (
            <span className="chip chip-yellow">🔥 {streak}d</span>
          )}
          {badgeCount > 0 && (
            <span className="chip chip-purple">🏅 {badgeCount}</span>
          )}

          {/* Sync status + retry */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%', background: dotColor,
              animation: isSyncing ? 'pulse 1s infinite' : 'none', flexShrink: 0,
            }} />
            <span style={{ color: 'var(--muted)' }}>{syncLabel}</span>
          </div>

          {/* Profile link */}
          <Link href="/study/profile" style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)',
            borderRadius: '99px', padding: '0.3rem 0.7rem', fontSize: '0.82rem', fontWeight: 600,
          }}>
            👤 {profileName}
          </Link>
        </div>
      </header>

      <main style={{ flex: 1, padding: '2rem 1.5rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        {children}
      </main>

      <footer style={{ textAlign: 'center', padding: '1rem', color: 'var(--muted)', fontSize: '0.8rem', borderTop: '1px solid var(--border)' }}>
        {appName} — Offline-First Study Companion
      </footer>
    </div>
  );
}
