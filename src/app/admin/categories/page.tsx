import { prisma } from '@/lib/prisma';
import styles from '../admin.module.css';
import CategoryClient from '@/components/CategoryClient';

export const dynamic = "force-dynamic";


export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="animate-fade-in">
      <header className={styles.header}>
        <h1 className={styles.headerTitle}>Manage Categories</h1>
      </header>

      <CategoryClient initialCategories={categories} />
    </div>
  );
}
