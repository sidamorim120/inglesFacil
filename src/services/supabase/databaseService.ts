// Serviço de Acesso a Dados com Supabase PostgreSQL e RLS - Inglês Fácil
import { supabase, isSupabaseConfigured } from './client';
import {
  Activity,
  Attempt,
  ReviewItem,
  UserSettings,
  User,
  UserRole,
} from '../../types';

export class SupabaseDatabaseService {
  /**
   * Busca catálogo de atividades com questões vinculadas
   */
  public static async getActivities(userRole: UserRole): Promise<Activity[]> {
    if (!isSupabaseConfigured() || !supabase) return [];

    let query = supabase.from('activities').select(`
      id,
      version,
      title,
      description,
      category,
      modality,
      difficulty,
      estimated_minutes,
      is_published,
      created_at,
      questions (
        id,
        activity_id,
        type,
        prompt_pt,
        prompt_en,
        audio_phrase_en,
        options,
        correct_option_id,
        expected_answer,
        accepted_variations,
        scrambled_words,
        explanation_pt,
        sort_order
      )
    `);

    // Aluno recebe apenas atividades publicadas
    if (userRole !== 'admin') {
      query = query.eq('is_published', true);
    }

    const { data, error } = await query.order('created_at', { ascending: true });
    if (error || !data) return [];

    return data.map((row: any) => ({
      id: row.id,
      version: row.version,
      title: row.title,
      description: row.description,
      category: row.category,
      modality: row.modality,
      difficulty: row.difficulty,
      estimatedMinutes: row.estimated_minutes,
      isPublished: row.is_published,
      createdAt: row.created_at,
      questions: (row.questions || []).map((q: any) => ({
        id: q.id,
        activityId: q.activity_id,
        type: q.type,
        promptPt: q.prompt_pt,
        promptEn: q.prompt_en,
        audioPhraseEn: q.audio_phrase_en,
        options: q.options,
        correctOptionId: q.correct_option_id,
        expectedAnswer: q.expected_answer,
        acceptedVariations: q.accepted_variations || [],
        scrambledWords: q.scrambled_words || [],
        explanationPt: q.explanation_pt,
      })),
    }));
  }

  /**
   * Salva tentativa do aluno e suas submissões vinculadas ao auth.uid()
   */
  public static async saveAttempt(attempt: Attempt): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured() || !supabase) return { success: false, error: 'Banco não configurado' };

    try {
      const { data: attemptData, error: attemptError } = await supabase
        .from('attempts')
        .insert({
          id: attempt.id,
          user_id: attempt.userId,
          activity_id: attempt.activityId,
          activity_version: attempt.activityVersion,
          activity_title: attempt.activityTitle,
          category: attempt.category,
          modality: attempt.modality,
          score: attempt.score,
          total_questions: attempt.totalQuestions,
          correct_answers: attempt.correctAnswers,
          started_at: attempt.startedAt,
          completed_at: attempt.completedAt,
        })
        .select()
        .single();

      if (attemptError) {
        return { success: false, error: attemptError.message };
      }

      // Insere submissões individuais
      if (attempt.submissions.length > 0) {
        const submissionsToInsert = attempt.submissions.map((s) => ({
          attempt_id: attemptData.id,
          question_id: s.questionId,
          user_answer: s.userAnswer,
          is_correct: s.isCorrect,
          expected_answer: s.expectedAnswer,
          explanation_pt: s.explanationPt,
          recorded_audio_url: s.recordedAudioUrl || null,
        }));

        await supabase.from('question_submissions').insert(submissionsToInsert);
      }

      // Adiciona erros à fila de repetição espaçada
      const wrongSubs = attempt.submissions.filter((s) => !s.isCorrect);
      for (const wrong of wrongSubs) {
        await supabase.from('review_queue').upsert({
          user_id: attempt.userId,
          question_id: wrong.questionId,
          activity_id: attempt.activityId,
          phrase_en: wrong.expectedAnswer,
          translation_pt: wrong.explanationPt,
          category: attempt.category,
          consecutive_correct: 0,
          interval_days: 1,
          next_review_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          last_attempt_date: new Date().toISOString(),
          total_mistakes: 1,
        }, { onConflict: 'user_id,question_id' });
      }

      return { success: true };
    } catch (err: unknown) {
      const error = err as Error;
      return { success: false, error: error.message };
    }
  }

  /**
   * Consulta tentativas pessoais do aluno com proteção de RLS
   */
  public static async getStudentAttempts(userId: string): Promise<Attempt[]> {
    if (!isSupabaseConfigured() || !supabase) return [];

    const { data, error } = await supabase
      .from('attempts')
      .select(`
        *,
        question_submissions (*)
      `)
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (error || !data) return [];

    return data.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      activityId: row.activity_id,
      activityVersion: row.activity_version,
      activityTitle: row.activity_title,
      category: row.category,
      modality: row.modality,
      score: row.score,
      totalQuestions: row.total_questions,
      correctAnswers: row.correct_answers,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      submissions: (row.question_submissions || []).map((s: any) => ({
        questionId: s.question_id,
        userAnswer: s.user_answer,
        isCorrect: s.is_correct,
        expectedAnswer: s.expected_answer,
        explanationPt: s.explanation_pt,
      })),
    }));
  }

  /**
   * Fila de revisão espaçada do aluno
   */
  public static async getReviewItems(userId: string): Promise<ReviewItem[]> {
    if (!isSupabaseConfigured() || !supabase) return [];

    const { data, error } = await supabase
      .from('review_queue')
      .select('*')
      .eq('user_id', userId);

    if (error || !data) return [];

    return data.map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      questionId: r.question_id,
      activityId: r.activity_id,
      phraseEn: r.phrase_en,
      translationPt: r.translation_pt,
      category: r.category,
      consecutiveCorrect: r.consecutive_correct,
      intervalDays: r.interval_days,
      nextReviewDate: r.next_review_date,
      lastAttemptDate: r.last_attempt_date,
      totalMistakes: r.total_mistakes,
    }));
  }

  /**
   * Configurações de rotina e lembretes
   */
  public static async getUserSettings(userId: string): Promise<UserSettings | null> {
    if (!isSupabaseConfigured() || !supabase) return null;

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;

    return {
      userId: data.user_id,
      dailyGoalMinutes: data.daily_goal_minutes,
      audioSpeed: Number(data.audio_speed),
      autoPlayAudio: data.auto_play_audio,
      reminders: {
        enabled: data.reminder_enabled,
        time: data.reminder_time.slice(0, 5),
        daysOfWeek: data.reminder_days,
        timezone: data.reminder_timezone,
      },
    };
  }
}
