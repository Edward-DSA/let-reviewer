import styles from './admin.module.css';
import { prisma } from '@/lib/prisma';

export const dynamic = "force-dynamic";


export default async function AdminDashboard() {
  const categories  = await prisma.category.count();
  const questions   = await prisma.question.count();
  const users       = await prisma.user.count();
  const results     = await prisma.result.findMany({ include: { category: true }, orderBy: { createdAt: 'desc' } });

  const totalAttempts  = results.length;
  const uniqueStudents = new Set(results.map(r => r.studentName)).size;
  const overallAvg     = totalAttempts > 0
    ? Math.round(results.reduce((s, r) => s + r.score / r.total, 0) / totalAttempts * 100) : 0;

  // Per-category stats
  const catMap: Record<string, { name: string; totalScore: number; maxScore: number; attempts: number }> = {};
  results.forEach(r => {
    if (!catMap[r.categoryId]) catMap[r.categoryId] = { name: r.category?.name || 'Unknown', totalScore: 0, maxScore: 0, attempts: 0 };
    catMap[r.categoryId].totalScore += r.score;
    catMap[r.categoryId].maxScore   += r.total;
    catMap[r.categoryId].attempts   += 1;
  });
  const catStats = Object.values(catMap).map(s => ({ ...s, pct: Math.round(s.totalScore / s.maxScore * 100) })).sort((a, b) => b.pct - a.pct);

  // Recent 5 results
  const recent = results.slice(0, 5);

  return (
    <div className="animate-fade-in">
      <header className={styles.header}>
        <h1 className={styles.headerTitle}>Monitoring Dashboard</h1>
      </header>

      {/* Stat cards */}
      <div className="stat-grid" style={{ marginBottom: '2rem' }}>
        {[
          { icon: '👥', value: uniqueStudents, label: 'Unique Students', color: '#6366f1' },
          { icon: '📝', value: totalAttempts,  label: 'Total Attempts',  color: '#10b981' },
          { icon: '🎯', value: `${overallAvg}%`, label: 'Avg Score',    color: '#f59e0b' },
          { icon: '❓', value: questions,       label: 'Questions',      color: '#8b5cf6' },
          { icon: '🗂️', value: categories,     label: 'Categories',     color: '#06b6d4' },
          { icon: '👤', value: users,           label: 'Staff Accounts', color: '#ec4899' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ '--accent-color': s.color } as any}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: '1.5rem' }}>
        {/* Category performance */}
        <div className="card glass">
          <h2 className="section-title">📚 Category Performance</h2>
          {catStats.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No results synced yet.</p>
          ) : catStats.map((s, i) => {
            const barClass = s.pct >= 80 ? 'progress-green' : s.pct >= 60 ? 'progress-yellow' : 'progress-red';
            const status   = s.pct >= 80 ? { label: 'Excellent', color: 'var(--secondary-color)' }
                           : s.pct >= 60 ? { label: 'Good',      color: 'var(--warning-color)' }
                           : { label: 'Needs Work', color: 'var(--danger-color)' };
            return (
              <div key={i} style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{s.name}</span>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.attempts} attempts</span>
                    <span style={{ fontWeight: 700, color: status.color }}>{s.pct}%</span>
                  </div>
                </div>
                <div className="progress-wrap">
                  <div className={`progress-bar ${barClass}`} style={{ width: `${s.pct}%` }} />
                </div>
                <div style={{ fontSize: '0.75rem', color: status.color, marginTop: '0.2rem' }}>{status.label}</div>
              </div>
            );
          })}
        </div>

        {/* Recent activity */}
        <div className="card glass">
          <h2 className="section-title">🕐 Recent Activity</h2>
          {recent.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No recent activity.</p>
          ) : (
            <div>
              {recent.map(r => {
                const pct = Math.round(r.score / r.total * 100);
                return (
                  <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.studentName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{r.category?.name} · {new Date(r.createdAt).toLocaleDateString()}</div>
                    </div>
                    <span style={{
                      fontWeight: 800, fontSize: '0.95rem',
                      color: pct >= 75 ? 'var(--secondary-color)' : pct >= 50 ? 'var(--warning-color)' : 'var(--danger-color)',
                    }}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
