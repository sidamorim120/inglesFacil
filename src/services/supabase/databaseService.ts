// Serviço de Acesso a Dados com Supabase PostgreSQL e RLS - Inglês Fácil
// As permissões são garantidas pelas políticas RLS do schema.sql
import { supabase } from './client';
import { Activity, Attempt, Question, ReviewItem, User, UserRole, UserSettings } from '../../types';
import { nextReviewState, reviewFromMistake } from '../progress/progressRules';

type Result = { success: boolean; error?: string };

const db = () => {
  if (!supabase) throw new Error('Supabase não configurado.');
  return supabase;
};

const fail = (message: string): Result => ({ success: false, error: message });

/* eslint-disable @typescript-eslint/no-explicit-any */
const mapActivity = (row: any): Activity => ({
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
  questions: [...(row.questions || [])]
    .sort((a: any, b: any) => a.sort_order - b.sort_order)
    .map((q: any) => ({
      id: q.id,
      activityId: q.activity_id,
      type: q.type,
      promptPt: q.prompt_pt,
      promptEn: q.prompt_en ?? undefined,
      audioPhraseEn: q.audio_phrase_en ?? undefined,
      options: q.options ?? undefined,
      correctOptionId: q.correct_option_id ?? undefined,
      expectedAnswer: q.expected_answer,
      acceptedVariations: q.accepted_variations || [],
      scrambledWords: q.scrambled_words || [],
      explanationPt: q.explanation_pt,
    })),
});

const mapQuestionRow = (q: Question, activityId: string, sortOrder: number) => ({
  id: q.id,
  activity_id: activityId,
  type: q.type,
  prompt_pt: q.promptPt,
  prompt_en: q.promptEn ?? null,
  audio_phrase_en: q.audioPhraseEn ?? null,
  options: q.options ?? null,
  correct_option_id: q.correctOptionId ?? null,
  expected_answer: q.expectedAnswer,
  accepted_variations: q.acceptedVariations,
  scrambled_words: q.scrambledWords ?? [],
  explanation_pt: q.explanationPt,
  sort_order: sortOrder,
});

const mapReview = (r: any): ReviewItem => ({
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
});

const reviewRow = (r: ReviewItem) => ({
  id: r.id,
  user_id: r.userId,
  question_id: r.questionId,
  activity_id: r.activityId,
  phrase_en: r.phraseEn,
  translation_pt: r.translationPt,
  category: r.category,
  consecutive_correct: r.consecutiveCorrect,
  interval_days: r.intervalDays,
  next_review_date: r.nextReviewDate,
  last_attempt_date: r.lastAttemptDate,
  total_mistakes: r.totalMistakes,
});

const mapProfile = (p: any): User => ({
  id: p.id,
  name: p.name,
  email: p.email,
  role: p.role,
  status: p.status,
  createdAt: p.created_at,
});

export class SupabaseDatabaseService {
  // --- ATIVIDADES ---

  public static async getActivities(userRole: UserRole): Promise<Activity[]> {
    let query = db().from('activities').select('*, questions (*)');
    // Aluno recebe apenas atividades publicadas (o RLS também garante isso)
    if (userRole !== 'admin') {
      query = query.eq('is_published', true);
    }
    const { data, error } = await query.order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []).map(mapActivity);
  }

  public static async saveActivity(activity: Activity, isNew: boolean): Promise<Result> {
    const fields = {
      title: activity.title,
      description: activity.description,
      category: activity.category,
      modality: activity.modality,
      difficulty: activity.difficulty,
      estimated_minutes: activity.estimatedMinutes,
      is_published: activity.isPublished,
    };

    if (isNew) {
      const { error } = await db().from('activities').insert({ id: activity.id, version: 1, ...fields });
      if (error) return fail(error.message);
      const { error: qError } = await db()
        .from('questions')
        .insert(activity.questions.map((q, i) => mapQuestionRow(q, activity.id, i + 1)));
      if (qError) return fail(qError.message);
      return { success: true };
    }

    // Edição incrementa a versão para preservar integridade das tentativas passadas
    const { error } = await db()
      .from('activities')
      .update({ ...fields, version: activity.version + 1, updated_at: new Date().toISOString() })
      .eq('id', activity.id);
    return error ? fail(error.message) : { success: true };
  }

  public static async setActivityPublished(activityId: string, isPublished: boolean): Promise<Result> {
    const { error } = await db()
      .from('activities')
      .update({ is_published: isPublished, updated_at: new Date().toISOString() })
      .eq('id', activityId);
    return error ? fail(error.message) : { success: true };
  }

  // --- TENTATIVAS ---

  public static async saveAttempt(attempt: Attempt, activity: Activity): Promise<Result> {
    const { error: attemptError } = await db().from('attempts').insert({
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
    });
    if (attemptError) return fail(attemptError.message);

    if (attempt.submissions.length > 0) {
      const { error } = await db()
        .from('question_submissions')
        .insert(
          attempt.submissions.map((s) => ({
            attempt_id: attempt.id,
            question_id: s.questionId,
            user_answer: s.userAnswer,
            is_correct: s.isCorrect,
            expected_answer: s.expectedAnswer,
            explanation_pt: s.explanationPt,
            // Gravações ficam apenas no navegador (URL temporária não é persistida)
            recorded_audio_url: null,
          }))
        );
      if (error) return fail(error.message);
    }

    // Erros entram (ou reiniciam) na fila de repetição espaçada
    const wrong = attempt.submissions.filter((s) => !s.isCorrect);
    if (wrong.length === 0) return { success: true };

    const { data: existingRows, error: fetchError } = await db()
      .from('review_queue')
      .select('*')
      .eq('user_id', attempt.userId)
      .in('question_id', wrong.map((s) => s.questionId));
    if (fetchError) return fail(fetchError.message);

    const existing = (existingRows || []).map(mapReview);
    const rows = wrong
      .map((s) =>
        reviewFromMistake(
          s,
          activity,
          attempt.userId,
          existing.find((r) => r.questionId === s.questionId),
          crypto.randomUUID()
        )
      )
      .filter((r): r is ReviewItem => r !== null)
      .map(reviewRow);

    const { error: reviewError } = await db().from('review_queue').upsert(rows, { onConflict: 'user_id,question_id' });
    return reviewError ? fail(reviewError.message) : { success: true };
  }

  public static async getStudentAttempts(userId: string): Promise<Attempt[]> {
    const { data, error } = await db()
      .from('attempts')
      .select('*, question_submissions (*)')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });
    if (error) throw new Error(error.message);

    return (data || []).map((row: any) => ({
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

  // --- REVISÃO ESPAÇADA ---

  public static async getReviewItems(userId: string): Promise<ReviewItem[]> {
    const { data, error } = await db().from('review_queue').select('*').eq('user_id', userId);
    if (error) throw new Error(error.message);
    return (data || []).map(mapReview);
  }

  public static async processReviewAnswer(item: ReviewItem, isCorrect: boolean): Promise<Result> {
    const next = nextReviewState(item, isCorrect);
    const { error } = await db()
      .from('review_queue')
      .update({
        consecutive_correct: next.consecutiveCorrect,
        interval_days: next.intervalDays,
        total_mistakes: next.totalMistakes,
        next_review_date: next.nextReviewDate,
        last_attempt_date: next.lastAttemptDate,
      })
      .eq('id', item.id);
    return error ? fail(error.message) : { success: true };
  }

  // --- CONFIGURAÇÕES E PERFIL ---

  public static async getUserSettings(userId: string): Promise<UserSettings | null> {
    const { data, error } = await db().from('user_settings').select('*').eq('user_id', userId).maybeSingle();
    if (error || !data) return null;

    return {
      userId: data.user_id,
      dailyGoalMinutes: data.daily_goal_minutes,
      audioSpeed: Number(data.audio_speed),
      autoPlayAudio: data.auto_play_audio,
      reminders: {
        enabled: data.reminder_enabled,
        time: String(data.reminder_time).slice(0, 5),
        daysOfWeek: data.reminder_days,
        timezone: data.reminder_timezone,
      },
    };
  }

  public static async saveUserSettings(settings: UserSettings): Promise<Result> {
    const { error } = await db().from('user_settings').upsert({
      user_id: settings.userId,
      daily_goal_minutes: settings.dailyGoalMinutes,
      audio_speed: settings.audioSpeed,
      auto_play_audio: settings.autoPlayAudio,
      reminder_enabled: settings.reminders.enabled,
      reminder_time: settings.reminders.time,
      reminder_days: settings.reminders.daysOfWeek,
      reminder_timezone: settings.reminders.timezone,
      updated_at: new Date().toISOString(),
    });
    return error ? fail(error.message) : { success: true };
  }

  public static async updateProfileName(userId: string, name: string): Promise<Result> {
    const { error } = await db()
      .from('profiles')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', userId);
    return error ? fail(error.message) : { success: true };
  }

  // --- ADMINISTRAÇÃO DE USUÁRIOS ---

  public static async getAdminUsers(): Promise<User[]> {
    const { data, error } = await db().from('profiles').select('*').order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []).map(mapProfile);
  }

  public static async setUserStatus(userId: string, status: User['status']): Promise<Result> {
    const { error } = await db()
      .from('profiles')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (error) {
      // Mensagem do trigger prevent_last_active_admin_removal
      if (error.message.toLowerCase().includes('administrador')) {
        return fail('Operação proibida: não é permitido desativar o último administrador ativo do sistema.');
      }
      return fail(error.message);
    }
    return { success: true };
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
