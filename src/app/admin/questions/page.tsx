import { prisma } from '@/lib/prisma';
import styles from '../admin.module.css';
import QuestionClient from '@/components/QuestionClient';

export default async function QuestionsPage() {
  const categories = await prisma.category.findMany();
  const questions = await prisma.question.findMany({
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="animate-fade-in">
      <header className={styles.header}>
        <h1 className={styles.headerTitle}>Manage Questions</h1>
      </header>

      <QuestionClient initialCategories={categories} initialQuestions={questions} />
    </div>
  );
}
