import { describe, it, expect } from 'vitest';
import { GradingService } from './gradingService';

describe('GradingService - Regras de Correção e Normalização', () => {
  it('deve normalizar maiúsculas, pontuações supérfluas e múltiplos espaços', () => {
    const raw = '   Where is,   terminal TWO?!  ';
    const normalized = GradingService.normalize(raw);
    expect(normalized).toBe('where is terminal two');
  });

  it('deve aceitar variações e contrações cadastradas', () => {
    const expected = 'I would like a coffee with milk, please.';
    const acceptedVariations = [
      "I'd like a coffee with milk, please.",
      'Coffee with milk, please',
      'A coffee with milk, please',
    ];

    // Resposta com contração e sem ponto final
    const res = GradingService.evaluate(
      "i'd like a coffee with milk, please",
      expected,
      acceptedVariations,
      'situational_response'
    );

    expect(res.isCorrect).toBe(true);
  });

  it('deve rejeitar respostas objetivas incorretas', () => {
    const expected = 'Where is terminal two?';
    const variations = ['Where is terminal 2?'];

    const res = GradingService.evaluate(
      'Where is gate 5?',
      expected,
      variations,
      'dictation'
    );

    expect(res.isCorrect).toBe(false);
  });

  it('deve avaliar resposta situacional aberta sugerindo modelo didático quando faltarem palavras-chave', () => {
    const expected = 'A coffee with milk, please.';
    const variations = ['Coffee with milk, please'];

    const res = GradingService.evaluate(
      'Eu quero suco de laranja',
      expected,
      variations,
      'situational_response'
    );

    expect(res.isCorrect).toBe(false);
    expect(res.isModelComparisonOnly).toBe(true);
  });
});
