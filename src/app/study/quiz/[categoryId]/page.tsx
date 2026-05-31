'use client';
import { Suspense, useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { db, LocalQuestion, BADGE_DEFS, updateStreakAndBadges } from '@/lib/db';

// ── Badge Toast ─────────────────────────────────────────────────────────────
function BadgeToast({ badges, onDone }: { badges: string[]; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 4000); return () => clearTimeout(t); }, [onDone]);
  if (!badges.length) return null;
  return (
    <div className="badge-toast">
      <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🏅 Badge{badges.length > 1 ? 's' : ''} Earned!</div>
      {badges.map(id => (
        <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
          <span style={{ fontSize: '1.5rem' }}>{BADGE_DEFS[id]?.emoji}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{BADGE_DEFS[id]?.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{BADGE_DEFS[id]?.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Quiz Content ────────────────────────────────────────────────────────
function QuizContent() {
  const params       = useParams();
  const searchParams = useSearchParams();
  const router       = useRouter();
  const categoryId   = params.categoryId as string;
  const mode         = (searchParams.get('mode') || 'practice') as 'practice' | 'exam';

  const [questions, setQuestions]       = useState<LocalQuestion[]>([]);
  const [catName, setCatName]           = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelected]  = useState<Record<string, number>>({});
  const [answeredSet, setAnsweredSet]   = useState<Set<string>>(new Set()); // practice: questions submitted
  const [timeLeft, setTimeLeft]         = useState(1800);
  const [initialTime, setInitialTime]   = useState(1800);
  const [isFinished, setIsFinished]     = useState(false);
  const [score, setScore]               = useState(0);
  const [newBadges, setNewBadges]       = useState<string[]>([]);
  const [showReview, setShowReview]     = useState(false);
  const [loading, setLoading]           = useState(true);

  // ── Load questions and settings ─────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [cat, qs] = await Promise.all([
          db.categories.get(categoryId),
          db.questions.where({ categoryId }).toArray()
        ]);

        if (cat?.examTimerSeconds) {
          setTimeLeft(cat.examTimerSeconds);
          setInitialTime(cat.examTimerSeconds);
        } else {
          // Fallback if not set
          setTimeLeft(0);
          setInitialTime(0);
        }

        setCatName(cat?.name || 'Category');
        const shuffled = qs.sort(() => Math.random() - 0.5).slice(0, 20);
        setQuestions(shuffled);
      } finally {
        setLoading(false);
      }
    })();
  }, [categoryId]);

  // ── Exam-mode countdown ─────────────────────────────────────────────────
  const finishQuiz = useCallback(async (qs: LocalQuestion[], answers: Record<string, number>) => {
    let finalScore = 0;
    qs.forEach(q => {
      if (answers[q.id] !== undefined && answers[q.id].toString() === q.correctAnswer) finalScore++;
    });
    setScore(finalScore);
    setIsFinished(true);

    const profile = await db.profile.get(1);
    await db.results.add({
      studentName: profile?.name || 'Guest',
      categoryId,
      score: finalScore,
      total: qs.length,
      createdAt: Date.now(),
      synced: 0,
    });
    const earned = await updateStreakAndBadges(categoryId, finalScore, qs.length);
    setNewBadges(earned);
    
    // Dynamic import to trigger system notifications for newly unlocked badges
    if (earned && earned.length > 0) {
      import('@/lib/notifications').then(({ triggerBadgeNotification }) => {
        earned.forEach(id => triggerBadgeNotification(id));
      }).catch(console.warn);
    }
  }, [categoryId]);

  useEffect(() => {
    if (mode !== 'exam' || isFinished || questions.length === 0 || initialTime <= 0) return;
    if (timeLeft <= 0) { finishQuiz(questions, selectedAnswers); return; }
    const t = setInterval(() => setTimeLeft(p => { if (p <= 1) { clearInterval(t); return 0; } return p - 1; }), 1000);
    return () => clearInterval(t);
  }, [mode, isFinished, questions, timeLeft, selectedAnswers, finishQuiz, initialTime]);

  // ── Helpers ─────────────────────────────────────────────────────────────
  const fmtTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };
  const timerColor = timeLeft < (initialTime * 0.1) ? 'var(--danger)' : timeLeft < (initialTime * 0.3) ? 'var(--warning)' : 'var(--secondary)';

  const handleSelect = (idx: number) => {
    if (answeredSet.has(questions[currentIndex].id) && mode === 'practice') return;
    setSelected(prev => ({ ...prev, [questions[currentIndex].id]: idx }));
  };

  const handlePracticeSubmit = () => {
    setAnsweredSet(prev => new Set(prev).add(questions[currentIndex].id));
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) setCurrentIndex(p => p + 1);
    else finishQuiz(questions, selectedAnswers);
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ fontSize: '2.5rem', animation: 'spin 1s linear infinite' }}>⚙️</div>
      <p className="text-muted">Preparing quiz…</p>
    </div>
  );

  if (questions.length === 0) return (
    <div className="card glass animate-fade-in" style={{ textAlign: 'center', padding: '3rem', maxWidth: 500, margin: '0 auto' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
      <h2 style={{ marginBottom: '0.5rem' }}>No Questions Yet</h2>
      <p className="text-muted" style={{ marginBottom: '1.5rem' }}>This category has no questions. Check back after syncing.</p>
      <button className="btn btn-primary" onClick={() => router.push('/study')}>Back to Dashboard</button>
    </div>
  );

  // ── FINISHED screen ──────────────────────────────────────────────────────
  if (isFinished) {
    const pct = Math.round((score / questions.length) * 100);
    const color = pct >= 75 ? 'var(--secondary)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)';
    const msg = pct >= 85 ? '🌟 Outstanding! Keep it up!' : pct >= 75 ? '✅ Great work! You\'re on track.' : pct >= 50 ? '📖 Keep studying — you\'re improving!' : '💪 Review this topic more carefully.';

    return (
      <div className="animate-fade-in" style={{ maxWidth: 700, margin: '0 auto' }}>
        {newBadges.length > 0 && <BadgeToast badges={newBadges} onDone={() => setNewBadges([])} />}

        <div className="card glass" style={{ textAlign: 'center', padding: '2.5rem', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '1rem', color: 'var(--muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{catName} · {mode === 'exam' ? 'Exam Mode' : 'Practice Mode'}</div>
          <div style={{ fontSize: '5rem', fontWeight: 900, color, lineHeight: 1, margin: '1rem 0' }}>{pct}%</div>
          <div style={{ fontSize: '1.5rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>{score} / {questions.length} correct</div>
          <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>{msg}</p>
          <div className="progress-wrap" style={{ maxWidth: 300, margin: '0 auto 2rem' }}>
            <div className={`progress-bar ${pct >= 75 ? 'progress-green' : pct >= 50 ? 'progress-yellow' : 'progress-red'}`} style={{ width: `${pct}%` }} />
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-outline" onClick={() => setShowReview(true)}>📋 Review Answers</button>
            <button className="btn btn-primary" onClick={() => router.push('/study')}>Back to Dashboard</button>
            <button className="btn btn-success" onClick={() => router.push('/study/results')}>📊 View Progress</button>
          </div>
        </div>

        {/* Review panel */}
        {showReview && (
          <div className="card glass animate-fade-in">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>📋 Answer Review</h3>
            {questions.map((q, i) => {
              const opts      = JSON.parse(q.options) as string[];
              const selected  = selectedAnswers[q.id];
              const correct   = parseInt(q.correctAnswer);
              const isCorrect = selected === correct;
              return (
                <div key={q.id} style={{ padding: '1.25rem 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <span style={{
                      flexShrink: 0, width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isCorrect ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.15)', fontSize: '0.8rem',
                      color: isCorrect ? 'var(--secondary)' : 'var(--danger)', fontWeight: 700
                    }}>{isCorrect ? '✓' : '✗'}</span>
                    <p style={{ fontWeight: 600, flex: 1 }}>{i + 1}. {q.text}</p>
                  </div>
                  {q.imageUrl && <img src={q.imageUrl} alt="diagram" style={{ maxHeight: 150, borderRadius: 8, marginBottom: '0.75rem' }} />}
                  <div style={{ paddingLeft: '2rem' }}>
                    {opts.map((opt, idx) => (
                      <div key={idx} style={{
                        padding: '0.4rem 0.75rem', borderRadius: 6, marginBottom: 4, fontSize: '0.9rem',
                        background: idx === correct ? 'rgba(16,185,129,0.1)' : idx === selected && !isCorrect ? 'rgba(239,68,68,0.08)' : 'transparent',
                        color: idx === correct ? 'var(--secondary)' : idx === selected && !isCorrect ? 'var(--danger)' : 'var(--muted)',
                        fontWeight: idx === correct ? 700 : 400,
                      }}>
                        {String.fromCharCode(65 + idx)}. {opt}
                        {idx === correct && ' ✓'}
                        {idx === selected && !isCorrect && ' (your answer)'}
                      </div>
                    ))}
                    {q.explanation && (
                      <div className="explanation-box">
                        💡 <strong>Explanation:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── QUIZ screen ──────────────────────────────────────────────────────────
  const currentQ     = questions[currentIndex];
  const opts         = JSON.parse(currentQ.options) as string[];
  const answered     = answeredSet.has(currentQ.id);
  const selIdx       = selectedAnswers[currentQ.id];
  const correctIdx   = parseInt(currentQ.correctAnswer);
  const progressPct  = Math.round(((currentIndex) / questions.length) * 100);

  return (
    <div className="animate-fade-in" style={{ maxWidth: 700, margin: '0 auto' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.2rem' }}>
            {catName} · {mode === 'exam' ? '⏱️ Exam Mode' : '🧠 Practice Mode'}
          </div>
          <div style={{ fontWeight: 700, fontSize: '1rem' }}>Question {currentIndex + 1} <span style={{ color: 'var(--muted)', fontWeight: 400 }}>of {questions.length}</span></div>
        </div>
        {mode === 'exam' && initialTime > 0 && (
          <div style={{
            background: 'var(--surface2)', border: `2px solid ${timerColor}`, borderRadius: 8,
            padding: '0.4rem 1rem', fontWeight: 800, fontSize: '1.1rem', color: timerColor,
            fontVariantNumeric: 'tabular-nums',
          }}>
            ⏱️ {fmtTime(timeLeft)}
          </div>
        )}
        <button className="btn btn-sm btn-outline" onClick={() => router.push('/study')}>✕ Quit</button>
      </div>

      {/* Progress */}
      <div className="progress-wrap" style={{ marginBottom: '1.5rem' }}>
        <div className="progress-bar progress-blue" style={{ width: `${progressPct}%`, transition: 'width 0.3s' }} />
      </div>

      {/* Question card */}
      <div className="card glass" style={{ padding: '2rem' }}>
        <p style={{ fontSize: '1.2rem', fontWeight: 600, lineHeight: 1.6, marginBottom: '1.5rem' }}>{currentQ.text}</p>

        {currentQ.imageUrl && (
          <img src={currentQ.imageUrl} alt="diagram" style={{ width: '100%', maxHeight: 250, objectFit: 'contain', borderRadius: 8, marginBottom: '1.5rem' }} />
        )}

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {opts.map((opt, idx) => {
            let extraClass = '';
            if (mode === 'practice' && answered) {
              if (idx === correctIdx) extraClass = 'option-correct';
              else if (idx === selIdx) extraClass = 'option-wrong';
            } else if (idx === selIdx) {
              extraClass = 'selected';
            }
            return (
              <button
                key={idx}
                className={extraClass}
                disabled={mode === 'practice' && answered}
                onClick={() => handleSelect(idx)}
                style={{
                  width: '100%', textAlign: 'left', padding: '0.9rem 1.2rem',
                  borderRadius: 8, fontWeight: 500, fontSize: '0.95rem',
                  border: `1.5px solid ${idx === selIdx && !answered ? 'var(--primary)' : 'var(--border)'}`,
                  background: idx === selIdx && !answered ? 'rgba(99,102,241,0.12)' : 'var(--surface2)',
                  color: 'var(--text)', transition: 'all 0.15s', cursor: answered && mode === 'practice' ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '1rem',
                }}
              >
                <span style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: idx === selIdx && !answered ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '0.85rem',
                }}>{String.fromCharCode(65 + idx)}</span>
                {opt}
              </button>
            );
          })}
        </div>

        {/* Practice explanation */}
        {mode === 'practice' && answered && currentQ.explanation && (
          <div className="explanation-box animate-fade-in">
            💡 <strong>Explanation:</strong> {currentQ.explanation}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {currentIndex > 0 && (
            <button className="btn btn-outline" onClick={() => setCurrentIndex(p => p - 1)}>← Prev</button>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem' }}>
            {mode === 'practice' && !answered && selIdx !== undefined && (
              <button className="btn btn-success" onClick={handlePracticeSubmit}>Check Answer</button>
            )}
            {(mode === 'exam' || (mode === 'practice' && answered)) && (
              <button
                className="btn btn-primary"
                disabled={mode === 'exam' && selIdx === undefined}
                onClick={nextQuestion}
              >
                {currentIndex === questions.length - 1 ? 'Finish Quiz' : 'Next →'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Question navigator (exam mode) */}
      {mode === 'exam' && (
        <div className="card glass" style={{ marginTop: '1rem', padding: '1rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Question Navigator</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                style={{
                  width: 32, height: 32, borderRadius: 6, fontSize: '0.8rem', fontWeight: 600,
                  background: i === currentIndex ? 'var(--primary)' : selectedAnswers[questions[i].id] !== undefined ? 'rgba(16,185,129,0.2)' : 'var(--surface2)',
                  color: i === currentIndex ? '#fff' : 'var(--text)',
                  border: `1px solid ${i === currentIndex ? 'var(--primary)' : 'var(--border)'}`,
                }}
              >{i + 1}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ fontSize: '2rem', animation: 'spin 1s linear infinite' }}>⚙️</div>
        <p className="text-muted">Loading quiz…</p>
      </div>
    }>
      <QuizContent />
    </Suspense>
  );
}
