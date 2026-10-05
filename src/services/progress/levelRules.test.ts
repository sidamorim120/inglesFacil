import { describe, it, expect } from 'vitest';
import { computeLevelState, isLevelUnlocked } from './levelRules';
import { Activity, Attempt, StudyLevel } from '../../types';

const activity = (id: string, level: StudyLevel, isPublished = true): Activity => ({
  id,
  version: 1,
  title: id,
  description: '',
  category: 'airport',
  modality: 'audio',
  level,
  estimatedMinutes: 5,
  isPublished,
  questions: [],
  createdAt: '2026-10-01T00:00:00Z',
});

const attempt = (activityId: string, score: number): Attempt => ({
  id: `att-${activityId}-${score}`,
  userId: 'u1',
  activityId,
  activityVersion: 1,
  activityTitle: activityId,
  category: 'airport',
  modality: 'audio',
  score,
  totalQuestions: 2,
  correctAnswers: 1,
  startedAt: '2026-10-01T10:00:00Z',
  completedAt: '2026-10-01T10:05:00Z',
  submissions: [],
});

const activities = [
  activity('b1-a', 'basic_1'),
  activity('b1-b', 'basic_1'),
  activity('b1-hidden', 'basic_1', false),
  activity('b2-a', 'basic_2'),
  activity('int-a', 'intermediate'),
];

describe('Níveis de estudo', () => {
  it('aluno novo começa no Básico 1', () => {
    expect(computeLevelState(activities, []).current).toBe('basic_1');
  });

  it('não avança enquanto alguma atividade do nível está abaixo de 70%', () => {
    const state = computeLevelState(activities, [attempt('b1-a', 100), attempt('b1-b', 60)]);
    expect(state.current).toBe('basic_1');
    expect(state.progress[0]).toEqual({ level: 'basic_1', total: 2, completed: 1 });
  });

  it('avança ao concluir todas as atividades publicadas, usando a melhor nota', () => {
    const state = computeLevelState(activities, [attempt('b1-a', 70), attempt('b1-b', 40), attempt('b1-b', 90)]);
    expect(state.current).toBe('basic_2');
  });

  it('para no nível sem conteúdo publicado', () => {
    const state = computeLevelState(activities, [attempt('b1-a', 100), attempt('b1-b', 100), attempt('b2-a', 100)]);
    expect(state.current).toBe('basic_3');
  });

  it('respeita o nível mínimo definido pelo admin', () => {
    expect(computeLevelState(activities, [], 'intermediate').current).toBe('intermediate');
    expect(computeLevelState(activities, [attempt('int-a', 80)], 'intermediate').current).toBe('advanced');
  });

  it('libera o nível atual e os anteriores', () => {
    expect(isLevelUnlocked('basic_1', 'basic_2')).toBe(true);
    expect(isLevelUnlocked('basic_2', 'basic_2')).toBe(true);
    expect(isLevelUnlocked('basic_3', 'basic_2')).toBe(false);
  });
});
