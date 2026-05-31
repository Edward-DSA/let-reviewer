import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import LoginForm from '@/components/LoginForm';

// Always render at request time — never statically pre-render (avoids build-time DB errors)
export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  let appName = 'LET Reviewer';
  let logoUrl = '';
  try {
    const settings = await prisma.settings.findUnique({ where: { id: 'default' } });
    appName = settings?.appName || 'LET Reviewer';
    logoUrl = settings?.logoUrl || '';
  } catch (e) {
    // DB unavailable — use defaults
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--background-dark)', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>

      {/* Back to home */}
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem', transition: 'color 0.2s' }}>
          ← Back to Home
        </Link>
      </div>

      <div className="card glass animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          {logoUrl ? (
            <img src={logoUrl} alt={appName} style={{ width: 56, height: 56, objectFit: 'contain', margin: '0 auto 1rem', display: 'block' }} />
          ) : (
            <div style={{ width: 56, height: 56, borderRadius: '14px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', margin: '0 auto 1rem' }}>🎓</div>
          )}
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Teacher Portal</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>Sign in to manage {appName}</p>
        </div>
        
        <LoginForm />
      </div>
    </div>
  );
}
