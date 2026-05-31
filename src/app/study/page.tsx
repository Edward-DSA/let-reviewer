'use client';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { sendSystemNotification } from '@/lib/notifications';


export default function StudyDashboard() {
  const router = useRouter();
  const categories = useLiveQuery(() => db.categories.toArray());
  const profile    = useLiveQuery(() => db.profile.get(1));
  const results    = useLiveQuery(() => db.results.toArray());
  const questions  = useLiveQuery(() => db.questions.toArray());
  const [notifStatus, setNotifStatus] = useState<'default'|'granted'|'denied'>('default');
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [appName, setAppName] = useState('LET Reviewer');
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    if (typeof Notification !== 'undefined') setNotifStatus(Notification.permission as any);
    if (profile && profile.name === 'Guest Student') setShowNamePrompt(true);
    
    fetch('/api/settings').then(res => res.json()).then(data => {
      if (data.appName) setAppName(data.appName);
      if (data.logoUrl) setLogoUrl(data.logoUrl);
    }).catch(console.warn);
  }, [profile]);

  // Prefetch category quiz pages so they are cached in pages-cache for offline take-exam capability
  useEffect(() => {
    if (!categories || categories.length === 0) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;

    const prefetchQuizRoutes = async () => {
      window.dispatchEvent(new CustomEvent('offline-caching-start'));
      let loaded = 0;
      const total = categories.length;

      categories.forEach(async (cat) => {
        try {
          await fetch(`/study/quiz/${cat.id}`);
          loaded++;
          if (loaded === total) {
            localStorage.setItem('offlineCacheReady', 'true');
            window.dispatchEvent(new CustomEvent('offline-caching-success'));
            
            // Trigger system notification
            sendSystemNotification('Offline Mode Activated! 📡', {
              body: 'LET Reviewer materials are fully cached. You can now study and take exams completely offline! 📚',
              icon: logoUrl || '/logo.png',
              requireInteraction: false,
            });
          }
        } catch (e) {
          // Silently handle offline/fail
        }
      });
    };

    const timer = setTimeout(prefetchQuizRoutes, 1500);
    return () => clearTimeout(timer);
  }, [categories, logoUrl]);

  const requestNotifications = async () => {
    const perm = await Notification.requestPermission();
    setNotifStatus(perm as any);
    if (perm === 'granted') {
      await db.profile.update(1, { notificationsEnabled: true });
      new Notification(`${appName} 📚`, { body: 'Reminders enabled! We\'ll nudge you to study daily.', icon: logoUrl || '/logo.png' });
    }
  };

  // Compute per-category stats from local results
  const getCatStats = (catId: string) => {
    if (!results) return null;
    const catResults = results.filter(r => r.categoryId === catId);
    if (catResults.length === 0) return null;
    const avg = catResults.reduce((s, r) => s + r.score / r.total, 0) / catResults.length;
    const last = catResults.sort((a, b) => b.createdAt - a.createdAt)[0];
    return { avg, attempts: catResults.length, lastScore: last.score, lastTotal: last.total };
  };

  const getQCount = (catId: string) => questions?.filter(q => q.categoryId === catId).length ?? 0;

  if (!categories) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ fontSize: '2rem' }}>📚</div>
      <p className="text-muted">Loading study materials…</p>
    </div>
  );

  return (
    <div className="animate-fade-in">

      {/* Name prompt */}
      {showNamePrompt && (
        <div className="notif-banner" style={{ marginBottom: '1.5rem' }}>
          <span>👤</span>
          <span style={{ flex: 1 }}>You're studying as <strong>Guest Student</strong>. Set your name so your progress is saved correctly.</span>
          <button className="btn btn-sm btn-primary" onClick={() => window.location.href = '/study/profile'}>Set Name</button>
          <button style={{ color: 'var(--muted)', fontSize: '1.2rem', lineHeight: 1 }} onClick={() => setShowNamePrompt(false)}>✕</button>
        </div>
      )}

      {/* Notification banner */}
      {notifStatus === 'default' && (
        <div className="notif-banner" style={{ marginBottom: '1.5rem' }}>
          <span>🔔</span>
          <span style={{ flex: 1 }}>Enable daily reminders to keep your study streak alive.</span>
          <button className="btn btn-sm btn-outline" onClick={requestNotifications}>Enable</button>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            Welcome back, {profile?.name || 'Student'}!
          </h1>
          <p className="text-muted">Choose a subject and study mode to begin.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <a href="/" className="btn btn-outline">🏠 Home</a>
          <button onClick={() => window.location.href = '/study/results'} className="btn btn-outline">
            📊 Progress Dashboard
          </button>
          <button onClick={() => window.location.href = '/study/profile'} className="btn btn-outline">
            ⚙️ Profile
          </button>
        </div>
      </div>

      {/* Quick stats */}
      {results && results.length > 0 && (
        <div className="stat-grid" style={{ marginBottom: '2.5rem' }}>
          <div className="stat-card" style={{ '--accent-color': '#6366f1' } as any}>
            <div className="stat-icon">📝</div>
            <div className="stat-value" style={{ color: 'var(--primary)' }}>{results.length}</div>
            <div className="stat-label">Quizzes Taken</div>
          </div>
          <div className="stat-card" style={{ '--accent-color': '#10b981' } as any}>
            <div className="stat-icon">🎯</div>
            <div className="stat-value" style={{ color: 'var(--secondary)' }}>
              {Math.round(results.reduce((s,r) => s + r.score/r.total, 0) / results.length * 100)}%
            </div>
            <div className="stat-label">Avg Score</div>
          </div>
          <div className="stat-card" style={{ '--accent-color': '#f59e0b' } as any}>
            <div className="stat-icon">🔥</div>
            <div className="stat-value" style={{ color: 'var(--warning)' }}>{profile?.streak ?? 0}</div>
            <div className="stat-label">Day Streak</div>
          </div>
          <div className="stat-card" style={{ '--accent-color': '#8b5cf6' } as any}>
            <div className="stat-icon">🏅</div>
            <div className="stat-value" style={{ color: '#a78bfa' }}>{profile?.badges.length ?? 0}</div>
            <div className="stat-label">Badges</div>
          </div>
        </div>
      )}

      {/* Categories */}
      <div>
        <h2 className="section-title" style={{ fontSize: '1.2rem', marginBottom: '1.25rem' }}>📚 Study Categories</h2>
        {categories.length === 0 ? (
          <div className="card glass" style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌐</div>
            <p style={{ color: 'var(--muted)' }}>No categories synced yet. Connect to the internet to download study materials.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: '1.25rem' }}>
            {categories.map(cat => {
              const stats  = getCatStats(cat.id);
              const qCount = getQCount(cat.id);
              const pct    = stats ? Math.round(stats.avg * 100) : 0;
              const barClass = pct >= 80 ? 'progress-green' : pct >= 60 ? 'progress-yellow' : pct > 0 ? 'progress-red' : 'progress-blue';

              return (
                <div key={cat.id} className="card glass card-hover" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Title */}
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.25rem' }}>{cat.name}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{cat.description || 'No description'}</p>
                  </div>

                  {/* Meta */}
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span className="chip chip-purple">📖 {qCount} questions</span>
                    {stats && <span className="chip chip-green">✓ {stats.attempts} attempt{stats.attempts !== 1 ? 's' : ''}</span>}
                  </div>

                  {/* Progress */}
                  {stats && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                        <span className="text-muted">Avg Performance</span>
                        <span style={{ fontWeight: 700, color: pct >= 75 ? 'var(--secondary)' : pct >= 60 ? 'var(--warning)' : 'var(--danger)' }}>{pct}%</span>
                      </div>
                      <div className="progress-wrap">
                        <div className={`progress-bar ${barClass}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Mode buttons */}
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto' }}>
                    <button
                      className="btn btn-mode-practice"
                      style={{ flex: 1 }}
                      onClick={() => window.location.href = `/study/quiz/${cat.id}?mode=practice`}
                    >
                      🧠 Practice
                    </button>
                    <button
                      className="btn btn-mode-exam"
                      style={{ flex: 1 }}
                      onClick={() => window.location.href = `/study/quiz/${cat.id}?mode=exam`}
                    >
                      ⏱️ Exam
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
