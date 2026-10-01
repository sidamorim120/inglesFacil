// Serviço de Avaliação e Normalização de Respostas - Inglês Fácil
// Aplica regras de normalização sem alterar o sentido pedagógico

import { ExerciseType } from '../../types';

export interface GradingResult {
  isCorrect: boolean;
  userAnswer: string;
  expectedAnswer: string;
  feedbackText: string;
  isModelComparisonOnly?: boolean;
}

export class GradingService {
  /**
   * Normaliza texto para comparação justa:
   * - Converte apóstrofos tipográficos para apóstrofo padrão (')
   * - Remove pontuações terminais e decorativas (. , ! ? ; :)
   * - Reduz espaços múltiplos em branco
   * - Converte para minúsculas
   */
  public static normalize(text: string): string {
    if (!text) return '';
    return text
      .trim()
      .replace(/[\u2018\u2019]/g, "'") // Apóstrofo curvo para reto
      .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'“”]/g, ' ') // Pontuações para espaço
      .toLowerCase()
      .replace(/\s+/g, ' ') // Múltiplos espaços para um só
      .trim();
  }

  /**
   * Avalia a resposta do aluno com base no tipo de exercício e variações aceitas
   */
  public static evaluate(
    userAnswer: string,
    expectedAnswer: string,
    acceptedVariations: string[] = [],
    exerciseType: ExerciseType
  ): GradingResult {
    const rawUser = (userAnswer || '').trim();
    const cleanUser = this.normalize(rawUser);
    const cleanExpected = this.normalize(expectedAnswer);

    // Lista de todas as formas válidas
    const validForms = [cleanExpected, ...acceptedVariations.map((v) => this.normalize(v))];

    // Exercício de resposta aberta / situacional (ex: pedir um café)
    if (exerciseType === 'situational_response') {
      const exactMatch = validForms.includes(cleanUser);
      if (exactMatch) {
        return {
          isCorrect: true,
          userAnswer: rawUser,
          expectedAnswer,
          feedbackText: 'Excelente! Sua resposta está natural e atende perfeitamente à situação.',
          isModelComparisonOnly: false,
        };
      }

      // Em respostas livres, se houver tamanho razoável e palavras-chave
      const keywords = cleanExpected.split(' ').filter((w) => w.length > 2);
      const matchedKeywords = keywords.filter((w) => cleanUser.includes(w));
      const hasKeywords = matchedKeywords.length >= Math.ceil(keywords.length * 0.5);

      return {
        isCorrect: hasKeywords,
        userAnswer: rawUser,
        expectedAnswer,
        feedbackText: hasKeywords
          ? 'Muito bom! Compare com o modelo padrão para refinar seu vocabulário.'
          : 'Veja o modelo recomendado para esta situação do dia a dia.',
        isModelComparisonOnly: true,
      };
    }

    // Exercícios objetivos (compreensão, ditado, lacunas, ordenação, tradução)
    const isExactValid = validForms.includes(cleanUser);

    if (isExactValid) {
      return {
        isCorrect: true,
        userAnswer: rawUser,
        expectedAnswer,
        feedbackText: 'Resposta correta! Parabéns pelo empenho.',
      };
    }

    // Checagem de proximidade (typo simples no ditado)
    if (exerciseType === 'dictation' || exerciseType === 'translation') {
      const distance = this.levenshtein(cleanUser, cleanExpected);
      if (distance === 1 && cleanExpected.length > 4) {
        return {
          isCorrect: false,
          userAnswer: rawUser,
          expectedAnswer,
          feedbackText: 'Quase certo! Houve apenas um pequeno desvio ortográfico.',
        };
      }
    }

    return {
      isCorrect: false,
      userAnswer: rawUser,
      expectedAnswer,
      feedbackText: 'Resposta diferente da esperada. Veja a correção e a explicação abaixo.',
    };
  }

  /**
   * Distância Levenshtein para medir proximidade de digitação
   */
  public static levenshtein(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }
}
