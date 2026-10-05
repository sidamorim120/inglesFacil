// Regras de Níveis de Estudo (Demo e Supabase) - Inglês Fácil
// O aluno começa no nível mínimo do perfil (definido pelo admin) e avança sozinho
// ao tirar nota >= PASSING_SCORE em todas as atividades publicadas do nível.
import { Activity, Attempt, StudyLevel } from '../../types';

export const LEVELS: StudyLevel[] = ['basic_1', 'basic_2', 'basic_3', 'intermediate', 'advanced'];

export const LEVEL_LABELS: Record<StudyLevel, string> = {
  basic_1: 'Básico 1',
  basic_2: 'Básico 2',
  basic_3: 'Básico 3',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
};

export const PASSING_SCORE = 70;

export const levelIndex = (level: StudyLevel): number => Math.max(0, LEVELS.indexOf(level));

export interface LevelProgress {
  level: StudyLevel;
  total: number;      // atividades publicadas no nível
  completed: number;  // atividades com nota >= PASSING_SCORE
}

export interface LevelState {
  current: StudyLevel;
  progress: LevelProgress[];
}

// Melhor nota do aluno em cada atividade
export const bestScores = (attempts: Attempt[]): Record<string, number> =>
  attempts.reduce((acc, a) => {
    acc[a.activityId] = Math.max(acc[a.activityId] ?? 0, a.score);
    return acc;
  }, {} as Record<string, number>);

export const computeLevelState = (
  activities: Activity[],
  attempts: Attempt[],
  minLevel: StudyLevel = 'basic_1'
): LevelState => {
  const best = bestScores(attempts);
  const published = activities.filter((a) => a.isPublished);

  const progress = LEVELS.map((level) => {
    const inLevel = published.filter((a) => a.level === level);
    return {
      level,
      total: inLevel.length,
      completed: inLevel.filter((a) => (best[a.id] ?? 0) >= PASSING_SCORE).length,
    };
  });

  // Avança enquanto o nível atual tem conteúdo e está todo concluído.
  // Um nível sem atividades segura o aluno até o conteúdo ser publicado.
  let index = levelIndex(minLevel);
  while (index < LEVELS.length - 1 && progress[index].total > 0 && progress[index].completed === progress[index].total) {
    index += 1;
  }

  return { current: LEVELS[index], progress };
};

export const isLevelUnlocked = (level: StudyLevel, current: StudyLevel): boolean =>
  levelIndex(level) <= levelIndex(current);
