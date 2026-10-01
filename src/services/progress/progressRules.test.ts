import { describe, it, expect } from 'vitest';
import { Attempt, ReviewItem } from '../../types';
import { computeStreakDays, computeStudentMetrics, nextReviewState } from './progressRules';

const attemptAt = (completedAt: string, score = 100, minutes = 5): Attempt => ({
  id: completedAt,
  userId: 'u1',
  activityId: 'a1',
  activityVersion: 1,
  activityTitle: 'Teste',
  category: 'airport',
  modality: 'audio',
  score,
  totalQuestions: 2,
  correctAnswers: 2,
  startedAt: new Date(new Date(completedAt).getTime() - minutes * 60000).toISOString(),
  completedAt,
  submissions: [],
});

const review: ReviewItem = {
  id: 'r1',
  userId: 'u1',
  questionId: 'q1',
  activityId: 'a1',
  phraseEn: 'Where is terminal two?',
  translationPt: 'Onde fica o terminal dois?',
  category: 'airport',
  consecutiveCorrect: 0,
  intervalDays: 1,
  nextReviewDate: '2026-01-01T00:00:00.000Z',
  lastAttemptDate: '2026-01-01T00:00:00.000Z',
  totalMistakes: 1,
};

describe('progressRules', () => {
  const now = new Date(2026, 9, 10, 12, 0, 0);

  it('conta dias seguidos de prática até hoje', () => {
    const attempts = [
      attemptAt(new Date(2026, 9, 10, 9).toISOString()),
      attemptAt(new Date(2026, 9, 9, 20).toISOString()),
      attemptAt(new Date(2026, 9, 8, 20).toISOString()),
      attemptAt(new Date(2026, 9, 5, 20).toISOString()),
    ];
    expect(computeStreakDays(attempts, now)).toBe(3);
  });

  it('mantém a sequência se ainda não praticou hoje, mas praticou ontem', () => {
    expect(computeStreakDays([attemptAt(new Date(2026, 9, 9, 20).toISOString())], now)).toBe(1);
    expect(computeStreakDays([attemptAt(new Date(2026, 9, 7, 20).toISOString())], now)).toBe(0);
  });

  it('calcula minutos reais, média e meta diária', () => {
    const attempts = [
      attemptAt(new Date(2026, 9, 10, 9).toISOString(), 100, 6),
      attemptAt(new Date(2026, 9, 10, 10).toISOString(), 50, 5),
    ];
    const metrics = computeStudentMetrics(attempts, [review], null, now);
    expect(metrics.todayMinutesPracticed).toBe(11);
    expect(metrics.averageScorePercentage).toBe(75);
    expect(metrics.dailyGoalCompleted).toBe(true);
    expect(metrics.pendingReviewsCount).toBe(1);
    expect(metrics.writingScoreAverage).toBe(0);
  });

  it('avança a revisão 1 -> 3 -> 7 dias e volta para 1 ao errar', () => {
    const first = nextReviewState(review, true, now);
    expect(first.intervalDays).toBe(3);
    const second = nextReviewState(first, true, now);
    expect(second.intervalDays).toBe(7);
    const wrong = nextReviewState(second, false, now);
    expect(wrong.intervalDays).toBe(1);
    expect(wrong.totalMistakes).toBe(2);
  });
});
