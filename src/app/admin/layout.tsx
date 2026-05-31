'use client';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import styles from './admin.module.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.adminLayout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTitle}>
          <span>🎓</span> LET Admin
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <Link href="/admin"            className={styles.navItem}>📊 Dashboard</Link>
          <Link href="/admin/categories" className={styles.navItem}>🗂️ Categories</Link>
          <Link href="/admin/questions"  className={styles.navItem}>❓ Questions</Link>
          <Link href="/admin/results"    className={styles.navItem}>📋 Student Results</Link>
          <Link href="/admin/users"      className={styles.navItem}>👥 User Management</Link>
          <Link href="/admin/settings"   className={styles.navItem}>⚙️ System Settings</Link>

          <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <Link href="/" className={styles.navItem} style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              ← Back to App
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className={styles.navItem}
              style={{ color: 'var(--danger-color)', fontSize: '0.85rem', width: '100%', textAlign: 'left' }}
            >
              🚪 Sign Out
            </button>
          </div>
        </nav>
      </aside>
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}
