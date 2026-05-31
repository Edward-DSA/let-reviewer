import { prisma } from '@/lib/prisma';
import styles from '../admin.module.css';
import ResultsClient from '@/components/ResultsClient';

export const dynamic = "force-dynamic";


export default async function ResultsPage() {
  const results = await prisma.result.findMany({
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="animate-fade-in">
      <header className={styles.header}>
        <h1 className={styles.headerTitle}>Student Results</h1>
      </header>

      <ResultsClient initialResults={results} />
    </div>
  );
}
