import { describe, it, expect } from 'vitest';
import { INITIAL_ACTIVITIES } from './initialData';
import { GradingService } from '../grading/gradingService';

const questions = INITIAL_ACTIVITIES.flatMap((a) => a.questions.map((q) => ({ activity: a, q })));

describe('Conteúdo das atividades', () => {
  it('não repete IDs de atividades nem de questões', () => {
    const activityIds = INITIAL_ACTIVITIES.map((a) => a.id);
    const questionIds = questions.map(({ q }) => q.id);
    expect(new Set(activityIds).size).toBe(activityIds.length);
    expect(new Set(questionIds).size).toBe(questionIds.length);
  });

  it('nenhuma resposta esperada fica vazia depois da normalização', () => {
    for (const { q } of questions) expect(GradingService.normalize(q.expectedAnswer), q.id).not.toBe('');
  });

  it('cada questão aponta para a própria atividade', () => {
    for (const { activity, q } of questions) expect(q.activityId, q.id).toBe(activity.id);
  });

  it('na escuta, a alternativa correta existe e é a resposta esperada', () => {
    for (const { q } of questions.filter(({ q }) => q.type === 'listening_choice')) {
      const correct = q.options?.find((o) => o.id === q.correctOptionId);
      expect(correct?.text, q.id).toBe(q.expectedAnswer);
      expect(q.audioPhraseEn, q.id).toBeTruthy();
    }
  });

  it('no ordenar, as palavras formam exatamente a frase esperada', () => {
    for (const { q } of questions.filter(({ q }) => q.type === 'word_reorder')) {
      const words = GradingService.normalize(q.expectedAnswer).split(' ').sort();
      const given = GradingService.normalize((q.scrambledWords || []).join(' ')).split(' ').sort();
      expect(given, q.id).toEqual(words);
    }
  });

  it('a resposta esperada e as variações aceitas são corrigidas como certas', () => {
    for (const { q } of questions.filter(({ q }) => q.type !== 'listening_choice')) {
      for (const answer of [q.expectedAnswer, ...q.acceptedVariations]) {
        const result = GradingService.evaluate(answer, q.expectedAnswer, q.acceptedVariations, q.type);
        expect(result.isCorrect, `${q.id}: ${answer}`).toBe(true);
      }
    }
  });
});
