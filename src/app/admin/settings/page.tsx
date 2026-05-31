import { prisma } from '@/lib/prisma';
import styles from '../admin.module.css';
import SettingsClient from '@/components/SettingsClient';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  let settings = null;
  try {
    settings = await prisma.settings.findUnique({
      where: { id: 'default' },
    });
  } catch (e) {
    // DB unavailable at build time — use null defaults
  }

  return (
    <div className="animate-fade-in">
      <header className={styles.header}>
        <h1 className={styles.headerTitle}>System Settings</h1>
      </header>

      <SettingsClient initialSettings={settings} />
    </div>
  );
}
