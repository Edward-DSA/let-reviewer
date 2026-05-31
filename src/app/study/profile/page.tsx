'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/db';

export default function ProfilePage() {
  const router = useRouter();
  const [name, setName]     = useState('');
  const [saved, setSaved]   = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.profile.get(1).then(p => {
      if (p) setName(p.name === 'Guest Student' ? '' : p.name);
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim() || 'Student';
    await db.profile.update(1, { name: trimmed });
    setSaved(true);
    setTimeout(() => { setSaved(false); window.location.href = '/study'; }, 1500);
  };

  if (loading) return <div className="text-muted" style={{ padding: '2rem' }}>Loading…</div>;

  return (
    <div className="animate-fade-in" style={{ maxWidth: 480, margin: '0 auto' }}>
      <button className="btn btn-outline btn-sm" style={{ marginBottom: '1.5rem' }} onClick={() => window.location.href = '/study'}>← Back</button>
      <div className="card glass">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', margin: '0 auto 1rem',
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem',
          }}>👤</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Your Profile</h1>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>Set your name so your quiz results are saved correctly.</p>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--muted)' }}>
              STUDENT NAME
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Maria Santos"
              maxLength={60}
              style={{
                width: '100%', padding: '0.75rem 1rem', borderRadius: 8,
                background: 'var(--surface2)', border: '1px solid var(--border)',
                color: 'var(--text)', fontSize: '1rem', outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-lg w-full">
            {saved ? '✅ Saved! Redirecting…' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
