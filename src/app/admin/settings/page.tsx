import { prisma } from '@/lib/prisma';
import styles from '../admin.module.css';
import SettingsClient from '@/components/SettingsClient';

export default async function SettingsPage() {
  const settings = await prisma.settings.findUnique({
    where: { id: 'default' },
  });

  return (
    <div className="animate-fade-in">
      <header className={styles.header}>
        <h1 className={styles.headerTitle}>System Settings</h1>
      </header>

      <SettingsClient initialSettings={settings} />
    </div>
  );
}
