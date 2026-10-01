// Definições de Tipos do Domínio - Inglês Fácil

export type UserRole = 'student' | 'admin';
export type UserStatus = 'active' | 'inactive';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string; // ISO 8601 UTC
}

export interface ReminderSettings {
  enabled: boolean;
  time: string; // "HH:MM", ex: "19:00"
  daysOfWeek: number[]; // 0 = Domingo, 1 = Segunda, ... 6 = Sábado
  timezone: string; // Padrão inicial: "America/Sao_Paulo"
}

export interface UserSettings {
  userId: string;
  dailyGoalMinutes: number; // 5 a 10 minutos
  audioSpeed: number; // 0.75 (lento) ou 1.0 (normal)
  autoPlayAudio: boolean;
  reminders: ReminderSettings;
}

export type ActivityCategory = 'airport' | 'hotel' | 'restaurant';
export type ActivityModality = 'audio' | 'writing' | 'mixed';
export type DifficultyLevel = 'beginner' | 'intermediate';

export type ExerciseType =
  | 'listening_choice'     // Compreensão auditiva: ouvir frase em inglês e escolher significado em português
  | 'dictation'            // Ditado: ouvir frase e digitar em inglês
  | 'oral_practice'        // Prática oral: ouvir, repetir e gravar áudio (com reprodução da própria voz)
  | 'fill_in_the_blanks'   // Completar lacunas
  | 'word_reorder'         // Organizar palavras para formar uma frase
  | 'translation'          // Traduzir frases curtas do português para inglês
  | 'situational_response';// Responder a situações simples (ex: pedir café)

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  activityId: string;
  type: ExerciseType;
  promptPt: string;                // Instrução clara em português
  promptEn?: string;               // Contexto complementar em inglês quando aplicável
  audioPhraseEn?: string;          // Frase a ser reproduzida no áudio síntese
  options?: QuestionOption[];      // Alternativas para múltipla escolha
  correctOptionId?: string;        // ID da alternativa correta
  expectedAnswer: string;          // Resposta ideal/esperada
  acceptedVariations: string[];    // Variações aceitas (contrações, sinônimos comuns)
  scrambledWords?: string[];       // Palavras soltas para exercício de ordenação
  explanationPt: string;           // Explicação curta didática em português
  referenceDialogue?: string;      // Diálogo de apoio para situações
  difficulty?: DifficultyLevel;
}

export interface Activity {
  id: string;
  version: number;                 // Versão da atividade para imutabilidade de histórico
  title: string;
  description: string;
  category: ActivityCategory;
  modality: ActivityModality;
  difficulty: DifficultyLevel;
  estimatedMinutes: number;        // Ex: 5 a 8 min
  isPublished: boolean;
  questions: Question[];
  createdAt: string;
}

export interface QuestionSubmission {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  explanationPt: string;
  expectedAnswer: string;
  recordedAudioUrl?: string;       // URL em memória temporária para reprodução pelo aluno
}

export interface Attempt {
  id: string;
  userId: string;
  activityId: string;
  activityVersion: number;
  activityTitle: string;
  category: ActivityCategory;
  modality: ActivityModality;
  score: number;                   // 0 a 100%
  totalQuestions: number;
  correctAnswers: number;
  startedAt: string;               // ISO 8601 UTC
  completedAt: string;             // ISO 8601 UTC
  submissions: QuestionSubmission[];
}

export interface ReviewItem {
  id: string;
  userId: string;
  questionId: string;
  activityId: string;
  phraseEn: string;
  translationPt: string;
  category: ActivityCategory;
  consecutiveCorrect: number;      // 0, 1, 2, 3+
  intervalDays: number;            // 1, 3 ou 7 dias
  nextReviewDate: string;          // ISO 8601 UTC
  lastAttemptDate: string;         // ISO 8601 UTC
  totalMistakes: number;
}

export interface StudentMetrics {
  totalMinutesPracticed: number;
  completedActivitiesCount: number;
  averageScorePercentage: number;
  audioScoreAverage: number;
  writingScoreAverage: number;
  currentStreakDays: number;
  pendingReviewsCount: number;
  dailyGoalCompleted: boolean;
  todayMinutesPracticed: number;
}
