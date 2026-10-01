// Regras de Progresso Compartilhadas (Demo e Supabase) - Inglês Fácil
import { Activity, Attempt, QuestionSubmission, ReviewItem, StudentMetrics, UserSettings } from '../../types';

const DAY_MS = 24 * 60 * 60 * 1000;

// Data local no formato YYYY-MM-DD (evita virar o dia às 21h no horário de Brasília)
export const toLocalDateKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Minutos reais gastos na tentativa (mínimo de 1 minuto)
export const attemptMinutes = (attempt: Attempt): number => {
  const ms = new Date(attempt.completedAt).getTime() - new Date(attempt.startedAt).getTime();
  if (!Number.isFinite(ms) || ms <= 0) return 1;
  return Math.max(1, Math.round(ms / 60000));
};

// Dias seguidos com prática, contando a partir de hoje (ou de ontem, se hoje ainda não praticou)
export const computeStreakDays = (attempts: Attempt[], now: Date = new Date()): number => {
  const practicedDays = new Set(attempts.map((a) => toLocalDateKey(new Date(a.completedAt))));
  const cursor = new Date(now);
  if (!practicedDays.has(toLocalDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let streak = 0;
  while (practicedDays.has(toLocalDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

const averageScore = (attempts: Attempt[]): number =>
  attempts.length > 0 ? Math.round(attempts.reduce((acc, a) => acc + a.score, 0) / attempts.length) : 0;

export const computeStudentMetrics = (
  attempts: Attempt[],
  reviews: ReviewItem[],
  settings: UserSettings | null,
  now: Date = new Date()
): StudentMetrics => {
  const todayKey = toLocalDateKey(now);
  const todayAttempts = attempts.filter((a) => toLocalDateKey(new Date(a.completedAt)) === todayKey);
  const todayMinutes = todayAttempts.reduce((acc, a) => acc + attemptMinutes(a), 0);
  const nowIso = now.toISOString();

  return {
    totalMinutesPracticed: attempts.reduce((acc, a) => acc + attemptMinutes(a), 0),
    completedActivitiesCount: attempts.length,
    averageScorePercentage: averageScore(attempts),
    audioScoreAverage: averageScore(attempts.filter((a) => a.modality === 'audio' || a.modality === 'mixed')),
    writingScoreAverage: averageScore(attempts.filter((a) => a.modality === 'writing' || a.modality === 'mixed')),
    currentStreakDays: computeStreakDays(attempts, now),
    pendingReviewsCount: reviews.filter((r) => r.nextReviewDate <= nowIso).length,
    dailyGoalCompleted: todayMinutes >= (settings?.dailyGoalMinutes || 10),
    todayMinutesPracticed: todayMinutes,
  };
};

// Repetição espaçada: acerto avança 1 -> 3 -> 7 dias; erro volta para 1 dia
export const nextReviewState = (item: ReviewItem, isCorrect: boolean, now: Date = new Date()): ReviewItem => {
  const next = { ...item };
  if (isCorrect) {
    next.consecutiveCorrect += 1;
    next.intervalDays = next.consecutiveCorrect === 1 ? 3 : 7;
  } else {
    next.consecutiveCorrect = 0;
    next.intervalDays = 1;
    next.totalMistakes += 1;
  }
  next.nextReviewDate = new Date(now.getTime() + next.intervalDays * DAY_MS).toISOString();
  next.lastAttemptDate = now.toISOString();
  return next;
};

// Item de revisão para uma questão errada (novo ou reiniciado se já existia)
export const reviewFromMistake = (
  submission: QuestionSubmission,
  activity: Activity,
  userId: string,
  existing: ReviewItem | undefined,
  newId: string,
  now: Date = new Date()
): ReviewItem | null => {
  const question = activity.questions.find((q) => q.id === submission.questionId);
  if (!question) return null;

  const base: ReviewItem = existing ?? {
    id: newId,
    userId,
    questionId: question.id,
    activityId: activity.id,
    phraseEn: question.audioPhraseEn || question.expectedAnswer,
    translationPt: question.promptPt,
    category: activity.category,
    consecutiveCorrect: 0,
    intervalDays: 1,
    nextReviewDate: now.toISOString(),
    lastAttemptDate: now.toISOString(),
    totalMistakes: 0,
  };

  return {
    ...base,
    consecutiveCorrect: 0,
    intervalDays: 1,
    totalMistakes: base.totalMistakes + 1,
    lastAttemptDate: now.toISOString(),
    nextReviewDate: new Date(now.getTime() + DAY_MS).toISOString(),
  };
};
