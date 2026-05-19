'use client';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, BADGE_DEFS } from '@/lib/db';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ResultsPage() {
  const router    = useRouter();
  const results   = useLiveQuery(() => db.results.orderBy('createdAt').reverse().toArray());
  const categories = useLiveQuery(() => db.categories.toArray());
  const profile   = useLiveQuery(() => db.profile.get(1));
  const [showHistory, setShowHistory] = useState(false);

  const getCatName = (id: string) => categories?.find(c => c.id === id)?.name || 'Unknown';
  // ── Compute stats ──────────────────────────────────────────────────────
  interface CatStat { name: string; id: string; avg: number; attempts: number; }
  const catStats: CatStat[] = [];
  if (results && categories) {
    categories.forEach(cat => {
      const catRes = results.filter(r => r.categoryId === cat.id);
      if (!catRes.length) return;
      const avg = catRes.reduce((s, r) => s + r.score / r.total, 0) / catRes.length;
      catStats.push({ name: cat.name, id: cat.id, avg, attempts: catRes.length });
    });
    catStats.sort((a, b) => a.avg - b.avg);
  }

  const totalQuizzes   = results?.length ?? 0;
  const overallAvg     = totalQuizzes > 0 ? Math.round(results!.reduce((s, r) => s + r.score / r.total, 0) / totalQuizzes * 100) : 0;
  const unsyncedCount  = results?.filter(r => r.synced === 0).length ?? 0;
  const earnedBadges   = profile?.badges ?? [];
  const allBadgeIds    = Object.keys(BADGE_DEFS);

  const getInsightClass = (avg: number) => avg < 0.6 ? 'insight-weak' : avg < 0.75 ? 'insight-needs-work' : avg < 0.9 ? 'insight-good' : 'insight-strong';
  const getInsightLabel = (avg: number) => avg < 0.6 ? '⚠️ Needs Improvement' : avg < 0.75 ? '📖 Needs Work' : avg < 0.9 ? '👍 Good' : '🌟 Strong';
  const getRecommendation = (name: string, avg: number) =>
    avg < 0.6 ? `Focus heavily on ${name}. Try 20-min daily practice sessions and review explanations carefully.`
    : avg < 0.75 ? `You're making progress in ${name}. Review your wrong answers and aim for 75%+.`
    : avg < 0.9 ? `Great job in ${name}! Keep practicing to push past 90%.`
    : `Excellent in ${name}! Maintain this level and help others in this subject.`;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>📊 Performance Dashboard</h1>
          <p className="text-muted">Track your progress across all subjects.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-outline" onClick={() => router.push('/study')}>← Dashboard</button>
        </div>
      </div>

      {totalQuizzes === 0 ? (
        <div className="card glass" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
          <h2 style={{ marginBottom: '0.5rem' }}>No Quizzes Yet</h2>
          <p className="text-muted" style={{ marginBottom: '1.5rem' }}>Complete a quiz to see your performance here.</p>
          <button className="btn btn-primary" onClick={() => router.push('/study')}>Start Reviewing</button>
        </div>
      ) : (
        <>
          {/* ── Stats Row ── */}
          <div className="stat-grid">
            <div className="stat-card" style={{ '--accent-color': '#6366f1' } as any}>
              <div className="stat-icon">📝</div>
              <div className="stat-value" style={{ color: 'var(--primary)' }}>{totalQuizzes}</div>
              <div className="stat-label">Quizzes Taken</div>
            </div>
            <div className="stat-card" style={{ '--accent-color': '#10b981' } as any}>
              <div className="stat-icon">🎯</div>
              <div className="stat-value" style={{ color: overallAvg >= 75 ? 'var(--secondary)' : overallAvg >= 50 ? 'var(--warning)' : 'var(--danger)' }}>{overallAvg}%</div>
              <div className="stat-label">Overall Avg</div>
            </div>
            <div className="stat-card" style={{ '--accent-color': '#f59e0b' } as any}>
              <div className="stat-icon">🔥</div>
              <div className="stat-value" style={{ color: 'var(--warning)' }}>{profile?.streak ?? 0}</div>
              <div className="stat-label">Day Streak</div>
            </div>
            <div className="stat-card" style={{ '--accent-color': '#8b5cf6' } as any}>
              <div className="stat-icon">🏅</div>
              <div className="stat-value" style={{ color: '#a78bfa' }}>{earnedBadges.length}</div>
              <div className="stat-label">Badges Earned</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px,1fr))', gap: '1.5rem' }}>
            {/* ── Category Performance ── */}
            <div>
              <div className="card glass" style={{ marginBottom: '1.5rem' }}>
                <h2 className="section-title">📚 Category Performance</h2>
                {catStats.length === 0 ? <p className="text-muted">No data yet.</p> : catStats.slice().reverse().map(st => {
                  const pct = Math.round(st.avg * 100);
                  const barClass = pct >= 80 ? 'progress-green' : pct >= 60 ? 'progress-yellow' : 'progress-red';
                  return (
                    <div key={st.id} style={{ marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{st.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span className="text-muted" style={{ fontSize: '0.8rem' }}>{st.attempts} attempt{st.attempts !== 1 ? 's' : ''}</span>
                          <span style={{ fontWeight: 800, color: pct >= 75 ? 'var(--secondary)' : pct >= 60 ? 'var(--warning)' : 'var(--danger)' }}>{pct}%</span>
                        </div>
                      </div>
                      <div className="progress-wrap">
                        <div className={`progress-bar ${barClass}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Performance Insights ── */}
              <div className="card glass">
                <h2 className="section-title">💡 Insights & Recommendations</h2>
                {catStats.length === 0 ? <p className="text-muted">No data yet.</p> : catStats.map(st => (
                  <div key={st.id} className={`insight-card ${getInsightClass(st.avg)}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                      <strong>{st.name}</strong>
                      <span style={{ fontSize: '0.8rem' }}>{getInsightLabel(st.avg)}</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{getRecommendation(st.name, st.avg)}</p>
                  </div>
                ))}
                {/* Overall recommendation */}
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(99,102,241,0.08)', borderRadius: 8, borderLeft: '3px solid var(--primary)' }}>
                  <strong>📌 Overall:</strong>{' '}
                  <span className="text-muted" style={{ fontSize: '0.9rem' }}>
                    {overallAvg >= 80 ? "You're performing excellently! Focus on maintaining consistency and targeting 90%+." :
                     overallAvg >= 65 ? "Good progress! Dedicate more time to weak subjects and aim for 75%+ on all categories." :
                     "Consistent practice is key. Study 30 minutes daily and always review wrong answers with explanations."}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Badges ── */}
            <div>
              <div className="card glass" style={{ marginBottom: '1.5rem' }}>
                <h2 className="section-title">🏅 Badges</h2>
                <div className="badge-grid">
                  {allBadgeIds.map(id => {
                    const def    = BADGE_DEFS[id];
                    const earned = earnedBadges.includes(id);
                    return (
                      <div key={id} className={`badge-card ${earned ? 'earned' : 'locked'}`}>
                        <div className="badge-emoji">{def.emoji}</div>
                        <div className="badge-name">{def.name}</div>
                        <div className="badge-desc">{def.desc}</div>
                        {earned && <div style={{ fontSize: '0.65rem', color: 'var(--secondary)', marginTop: '0.4rem', fontWeight: 600 }}>✓ Earned</div>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Quiz History ── */}
              <div className="card glass">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h2 className="section-title" style={{ margin: 0 }}>📋 Quiz History</h2>
                  <button className="btn btn-sm btn-outline" onClick={() => setShowHistory(p => !p)}>
                    {showHistory ? 'Hide' : 'Show'}
                  </button>
                </div>
                {showHistory && (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          {['Date', 'Category', 'Score', '%', 'Sync'].map(h => (
                            <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', color: 'var(--muted)', fontWeight: 600 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {results?.map(r => {
                          const pct = Math.round(r.score / r.total * 100);
                          return (
                            <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              <td style={{ padding: '0.6rem 0.75rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                              <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600 }}>{getCatName(r.categoryId)}</td>
                              <td style={{ padding: '0.6rem 0.75rem' }}>{r.score} / {r.total}</td>
                              <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, color: pct >= 75 ? 'var(--secondary)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)' }}>{pct}%</td>
                              <td style={{ padding: '0.6rem 0.75rem' }}>
                                {r.synced ? <span className="chip chip-green" style={{ fontSize: '0.7rem' }}>✓ Synced</span> : <span className="chip chip-yellow" style={{ fontSize: '0.7rem' }}>Pending</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
