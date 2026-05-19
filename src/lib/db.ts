import Dexie, { Table } from 'dexie';

export interface LocalCategory {
  id: string;
  name: string;
  description: string | null;
}

export interface LocalQuestion {
  id: string;
  categoryId: string;
  text: string;
  options: string;
  correctAnswer: string;
  explanation: string | null;
  imageUrl: string | null;
}

export interface LocalResult {
  id?: number;
  studentName: string;
  categoryId: string;
  score: number;
  total: number;
  createdAt: number;
  synced: 0 | 1;
}

export interface UserProfile {
  id: number;
  name: string;
  badges: string[];
  streak: number;
  lastStudyDate: number | null;
  notificationsEnabled: boolean;
}

export class LETReviewerDB extends Dexie {
  categories!: Table<LocalCategory, string>;
  questions!: Table<LocalQuestion, string>;
  results!: Table<LocalResult, number>;
  profile!: Table<UserProfile, number>;

  constructor() {
    super('LETReviewerDB');
    this.version(2).stores({
      categories: 'id',
      questions: 'id, categoryId',
      results: '++id, categoryId, synced, createdAt',
      profile: 'id'
    });
  }
}

export const db = new LETReviewerDB();

// Badge definitions used across the app
export const BADGE_DEFS: Record<string, { name: string; emoji: string; desc: string }> = {
  first_quiz:    { name: 'First Step',    emoji: '🎯', desc: 'Complete your first quiz' },
  perfect_score: { name: 'Perfect Score', emoji: '⭐', desc: 'Score 100% on any quiz' },
  high_scorer:   { name: 'High Scorer',   emoji: '🌟', desc: 'Score ≥ 85% on any quiz' },
  streak_3:      { name: 'On a Roll',     emoji: '🔥', desc: 'Study 3 days in a row' },
  streak_7:      { name: 'Dedicated',     emoji: '💪', desc: 'Study 7 days in a row' },
  quiz_5:        { name: 'Getting There', emoji: '📖', desc: 'Complete 5 quizzes' },
  quiz_master:   { name: 'Quiz Master',   emoji: '🏆', desc: 'Complete 10 quizzes' },
  gened_master:  { name: 'GenEd Master',  emoji: '📚', desc: 'Avg ≥ 80% in General Education' },
  prof_master:   { name: 'Prof Ed Pro',   emoji: '👨‍🏫', desc: 'Avg ≥ 80% in Prof. Education' },
};

export async function updateStreakAndBadges(categoryId: string, score: number, total: number): Promise<string[]> {
  const profile = await db.profile.get(1);
  if (!profile) return [];

  // --- Streak ---
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayTs = today.getTime();
  let newStreak = profile.streak;
  if (profile.lastStudyDate === null) {
    newStreak = 1;
  } else {
    const last = new Date(profile.lastStudyDate); last.setHours(0, 0, 0, 0);
    const diff = (todayTs - last.getTime()) / 86400000;
    if (diff === 0) { /* same day */ }
    else if (diff === 1) { newStreak++; }
    else { newStreak = 1; }
  }

  // --- Badges ---
  const earned = new Set(profile.badges);
  const newlyEarned: string[] = [];

  const allResults = await db.results.toArray();
  const totalQuizzes = allResults.length + 1; // +1 for current

  if (!earned.has('first_quiz')) { earned.add('first_quiz'); newlyEarned.push('first_quiz'); }
  if (score === total && !earned.has('perfect_score')) { earned.add('perfect_score'); newlyEarned.push('perfect_score'); }
  if (score / total >= 0.85 && !earned.has('high_scorer')) { earned.add('high_scorer'); newlyEarned.push('high_scorer'); }
  if (newStreak >= 3 && !earned.has('streak_3')) { earned.add('streak_3'); newlyEarned.push('streak_3'); }
  if (newStreak >= 7 && !earned.has('streak_7')) { earned.add('streak_7'); newlyEarned.push('streak_7'); }
  if (totalQuizzes >= 5 && !earned.has('quiz_5')) { earned.add('quiz_5'); newlyEarned.push('quiz_5'); }
  if (totalQuizzes >= 10 && !earned.has('quiz_master')) { earned.add('quiz_master'); newlyEarned.push('quiz_master'); }

  // Category master badges
  const catResults = allResults.filter(r => r.categoryId === categoryId);
  if (catResults.length >= 2) {
    const allScores = [...catResults, { score, total }];
    const avg = allScores.reduce((s, r) => s + r.score / r.total, 0) / allScores.length;
    if (avg >= 0.8) {
      const cat = await db.categories.get(categoryId);
      const nm = (cat?.name || '').toLowerCase();
      if (nm.includes('general') && !earned.has('gened_master')) { earned.add('gened_master'); newlyEarned.push('gened_master'); }
      if (nm.includes('professional') && !earned.has('prof_master')) { earned.add('prof_master'); newlyEarned.push('prof_master'); }
    }
  }

  await db.profile.update(1, { streak: newStreak, lastStudyDate: todayTs, badges: Array.from(earned) });
  return newlyEarned;
}
