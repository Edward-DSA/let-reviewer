import { prisma } from '@/lib/prisma';
import styles from './page.module.css';
import Link from 'next/link';

export default async function Home() {
  const settings = await prisma.settings.findUnique({ where: { id: 'default' } });
  const appName = settings?.appName || 'LET Reviewer Hub';
  const logoUrl = settings?.logoUrl || '';

  return (
    <div className={styles.wrapper}>
      <div className={`card glass animate-fade-in ${styles.content}`}>
        {logoUrl && (
          <img src={logoUrl} alt={appName} style={{ width: '80px', height: '80px', objectFit: 'contain', margin: '0 auto 1rem auto', display: 'block' }} />
        )}
        <h1 className={styles.title}>{appName}</h1>
        <p className={styles.subtitle}>
          Your comprehensive offline-capable study companion for the Licensure Examination for Teachers.
        </p>
        <div className={styles.actions}>
          <Link href="/study" className="btn btn-primary">
            Start Reviewing
          </Link>
          <Link href="/admin" className="btn" style={{ border: '1px solid var(--border-color)' }}>
            Teacher Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
