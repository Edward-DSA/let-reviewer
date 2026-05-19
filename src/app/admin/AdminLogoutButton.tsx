'use client';
import { signOut } from 'next-auth/react';
import styles from './admin.module.css';

export default function AdminLogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className={styles.navItem}
      style={{ width: '100%', textAlign: 'left', color: 'var(--danger-color)', fontSize: '0.85rem', marginTop: '0.5rem' }}
    >
      🚪 Sign Out
    </button>
  );
}
