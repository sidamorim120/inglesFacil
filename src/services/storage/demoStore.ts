// Armazenamento e Gerenciador de Estado no Modo Demonstração - Inglês Fácil
// Aplica regras de autorização, isolamento de dados e preservação de histórico

import {
  User,
  Activity,
  Attempt,
  ReviewItem,
  UserSettings,
  StudentMetrics,
  UserRole,
} from '../../types';
import {
  DEMO_USERS,
  DEMO_SETTINGS,
  INITIAL_ACTIVITIES,
  INITIAL_REVIEW_ITEMS,
} from './initialData';

const STORAGE_KEYS = {
  USERS: 'ingles_facil_users_v1',
  CURRENT_USER_ID: 'ingles_facil_current_user_id_v1',
  ACTIVITIES: 'ingles_facil_activities_v1',
  ATTEMPTS: 'ingles_facil_attempts_v1',
  REVIEWS: 'ingles_facil_reviews_v1',
  SETTINGS: 'ingles_facil_settings_v1',
};

export class DemoStore {
  // Inicialização com dados padrão caso o localStorage esteja vazio
  public static init(): void {
    if (typeof window === 'undefined') return;

    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEMO_USERS));
    }
    // Não força usuário logado por padrão para exigir tela de login inicial
    if (!localStorage.getItem(STORAGE_KEYS.ACTIVITIES)) {
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(INITIAL_ACTIVITIES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.REVIEWS)) {
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(INITIAL_REVIEW_ITEMS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEMO_SETTINGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ATTEMPTS)) {
      // Tentativas iniciais do Carlos para demonstrar métricas reais
      const initialAttempts: Attempt[] = [
        {
          id: 'att-01',
          userId: 'user-carlos-student',
          activityId: 'act-air-01',
          activityVersion: 1,
          activityTitle: 'Chegando ao Aeroporto: Escuta e Frases Chave',
          category: 'airport',
          modality: 'audio',
          score: 50,
          totalQuestions: 2,
          correctAnswers: 1,
          startedAt: '2026-09-30T18:55:00Z',
          completedAt: '2026-09-30T19:00:00Z',
          submissions: [
            {
              questionId: 'q-air-01-1',
              userAnswer: 'Por favor, tenha seu passaporte e cartão de embarque em mãos.',
              isCorrect: true,
              expectedAnswer: 'Por favor, tenha seu passaporte e cartão de embarque em mãos.',
              explanationPt: '"Boarding pass" é cartão de embarque.',
            },
            {
              questionId: 'q-air-01-2',
              userAnswer: 'Where is terminal to?',
              isCorrect: false,
              expectedAnswer: 'Where is terminal two?',
              explanationPt: 'Escreveu "to" ao invés de "two".',
            },
          ],
        },
      ];
      localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(initialAttempts));
    }
  }

  // --- AUTENTICAÇÃO E PERFIS ---

  public static getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    const currentId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    if (!currentId) return null;
    const users = this.getUsersRaw();
    return users.find((u) => u.id === currentId && u.status === 'active') || null;
  }

  public static switchDemoUser(userId: string): User | null {
    const users = this.getUsersRaw();
    const user = users.find((u) => u.id === userId && u.status === 'active');
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, user.id);
      return user;
    }
    return null;
  }

  public static login(email: string): { success: boolean; user?: User; error?: string } {
    const users = this.getUsersRaw();
    const cleanEmail = email.trim().toLowerCase();
    const found = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!found) {
      return { success: false, error: 'Usuário não encontrado. No modo demonstração, selecione um perfil ou crie uma conta.' };
    }

    if (found.status === 'inactive') {
      return { success: false, error: 'Esta conta está inativa. Entre em contato com a administração.' };
    }

    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, found.id);
    return { success: true, user: found };
  }

  public static register(name: string, email: string): { success: boolean; user?: User; error?: string } {
    const users = this.getUsersRaw();
    const cleanEmail = email.trim().toLowerCase();

    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'Este e-mail já está cadastrado.' };
    }

    // REGRA DE SEGURANÇA: Cadastros públicos SEMPRE recebem perfil aluno!
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      role: 'student',
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, newUser.id);

    // Cria configurações padrão para o novo aluno
    const settingsMap = this.getSettingsMapRaw();
    settingsMap[newUser.id] = {
      userId: newUser.id,
      dailyGoalMinutes: 10,
      audioSpeed: 1.0,
      autoPlayAudio: true,
      reminders: {
        enabled: true,
        time: '19:30',
        daysOfWeek: [1, 2, 3, 4, 5],
        timezone: 'America/Sao_Paulo',
      },
    };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settingsMap));

    return { success: true, user: newUser };
  }

  public static logout(): void {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
  }

  // --- ATIVIDADES (COM AUTORIZAÇÃO POR PAPEL) ---

  public static getActivities(requesterRole: UserRole): Activity[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
    const activities: Activity[] = raw ? JSON.parse(raw) : INITIAL_ACTIVITIES;

    // Aluno visualiza apenas atividades publicadas
    if (requesterRole !== 'admin') {
      return activities.filter((a) => a.isPublished);
    }

    return activities;
  }

  public static getActivityById(activityId: string, requesterRole: UserRole): Activity | null {
    const activities = this.getActivities(requesterRole);
    return activities.find((a) => a.id === activityId) || null;
  }

  public static saveActivity(activity: Activity, requesterRole: UserRole): { success: boolean; error?: string } {
    if (requesterRole !== 'admin') {
      return { success: false, error: 'Acesso negado: apenas administradores podem gerenciar atividades.' };
    }

    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
    let activities: Activity[] = raw ? JSON.parse(raw) : [...INITIAL_ACTIVITIES];

    const existingIndex = activities.findIndex((a) => a.id === activity.id);
    if (existingIndex >= 0) {
      // Incrementa versão para preservar integridade de tentativas passadas
      activities[existingIndex] = {
        ...activity,
        version: activities[existingIndex].version + 1,
      };
    } else {
      activities.push({
        ...activity,
        version: 1,
        createdAt: new Date().toISOString(),
      });
    }

    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
    return { success: true };
  }

  public static togglePublishActivity(activityId: string, requesterRole: UserRole): { success: boolean; error?: string } {
    if (requesterRole !== 'admin') {
      return { success: false, error: 'Acesso negado: apenas administradores podem alterar visibilidade.' };
    }

    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
    const activities: Activity[] = raw ? JSON.parse(raw) : [...INITIAL_ACTIVITIES];

    const act = activities.find((a) => a.id === activityId);
    if (!act) return { success: false, error: 'Atividade não encontrada.' };

    act.isPublished = !act.isPublished;
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
    return { success: true };
  }

  // --- ADMINISTRAÇÃO DE USUÁRIOS ---

  public static getAdminUsers(requesterRole: UserRole): User[] {
    if (requesterRole !== 'admin') {
      throw new Error('Acesso negado: você não tem permissão para visualizar lista de usuários.');
    }
    return this.getUsersRaw();
  }

  public static toggleUserStatus(targetUserId: string, requesterRole: UserRole): { success: boolean; error?: string } {
    if (requesterRole !== 'admin') {
      return { success: false, error: 'Apenas administradores podem alterar o status de acesso.' };
    }

    const users = this.getUsersRaw();
    const target = users.find((u) => u.id === targetUserId);

    if (!target) return { success: false, error: 'Usuário não encontrado.' };

    // REGRA DE SEGURANÇA: Impedir a desativação do último administrador ativo!
    if (target.role === 'admin' && target.status === 'active') {
      const activeAdmins = users.filter((u) => u.role === 'admin' && u.status === 'active');
      if (activeAdmins.length <= 1) {
        return { success: false, error: 'Operação proibida: não é permitido desativar o último administrador ativo do sistema.' };
      }
    }

    target.status = target.status === 'active' ? 'inactive' : 'active';
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return { success: true };
  }

  // --- TENTATIVAS E ISOLAMENTO DE RESULTADOS ---

  public static saveAttempt(attempt: Attempt): void {
    const raw = localStorage.getItem(STORAGE_KEYS.ATTEMPTS);
    const attempts: Attempt[] = raw ? JSON.parse(raw) : [];
    attempts.unshift(attempt); // Mais recente primeiro
    localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(attempts));

    // Atualiza fila de revisão espaçada com base nas submissões
    this.updateReviewQueueFromAttempt(attempt);
  }

  public static getStudentAttempts(targetUserId: string, requester: User): Attempt[] {
    // REGRA DE ISOLAMENTO: Aluno só pode consultar suas próprias respostas
    if (requester.role !== 'admin' && requester.id !== targetUserId) {
      return [];
    }

    const raw = localStorage.getItem(STORAGE_KEYS.ATTEMPTS);
    const attempts: Attempt[] = raw ? JSON.parse(raw) : [];
    return attempts.filter((a) => a.userId === targetUserId);
  }

  // --- REVISÃO ESPAÇADA (INTERVALOS 1, 3 E 7 DIAS) ---

  public static getReviewItems(userId: string): ReviewItem[] {
    const raw = localStorage.getItem(STORAGE_KEYS.REVIEWS);
    const reviews: ReviewItem[] = raw ? JSON.parse(raw) : INITIAL_REVIEW_ITEMS;
    return reviews.filter((r) => r.userId === userId);
  }

  public static processReviewAnswer(
    reviewId: string,
    isCorrect: boolean
  ): { success: boolean; nextReviewDate: string; intervalDays: number } {
    const raw = localStorage.getItem(STORAGE_KEYS.REVIEWS);
    const reviews: ReviewItem[] = raw ? JSON.parse(raw) : [...INITIAL_REVIEW_ITEMS];
    const item = reviews.find((r) => r.id === reviewId);

    if (!item) return { success: false, nextReviewDate: '', intervalDays: 1 };

    const now = new Date();

    if (isCorrect) {
      // Avança no ciclo: 1 dia -> 3 dias -> 7 dias
      item.consecutiveCorrect += 1;
      if (item.consecutiveCorrect === 1) item.intervalDays = 3;
      else if (item.consecutiveCorrect >= 2) item.intervalDays = 7;
    } else {
      // Errou: reseta intervalo para 1 dia e incrementa erros
      item.consecutiveCorrect = 0;
      item.intervalDays = 1;
      item.totalMistakes += 1;
    }

    // Nova data de revisão respeitando o intervalo
    const nextDate = new Date(now.getTime() + item.intervalDays * 24 * 60 * 60 * 1000);
    item.nextReviewDate = nextDate.toISOString();
    item.lastAttemptDate = now.toISOString();

    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
    return {
      success: true,
      nextReviewDate: item.nextReviewDate,
      intervalDays: item.intervalDays,
    };
  }

  private static updateReviewQueueFromAttempt(attempt: Attempt): void {
    const rawReviews = localStorage.getItem(STORAGE_KEYS.REVIEWS);
    const reviews: ReviewItem[] = rawReviews ? JSON.parse(rawReviews) : [...INITIAL_REVIEW_ITEMS];
    const rawActivities = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
    const activities: Activity[] = rawActivities ? JSON.parse(rawActivities) : INITIAL_ACTIVITIES;
    const activity = activities.find((a) => a.id === attempt.activityId);

    if (!activity) return;

    attempt.submissions.forEach((sub) => {
      // Se o aluno errou a questão, inclui ou atualiza na fila de revisão
      if (!sub.isCorrect) {
        const question = activity.questions.find((q) => q.id === sub.questionId);
        if (!question) return;

        const existingReview = reviews.find(
          (r) => r.userId === attempt.userId && r.questionId === sub.questionId
        );

        if (existingReview) {
          existingReview.consecutiveCorrect = 0;
          existingReview.intervalDays = 1;
          existingReview.totalMistakes += 1;
          existingReview.lastAttemptDate = new Date().toISOString();
          existingReview.nextReviewDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        } else {
          reviews.push({
            id: `rev-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            userId: attempt.userId,
            questionId: question.id,
            activityId: activity.id,
            phraseEn: question.audioPhraseEn || question.expectedAnswer,
            translationPt: question.promptPt,
            category: activity.category,
            consecutiveCorrect: 0,
            intervalDays: 1,
            nextReviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            lastAttemptDate: new Date().toISOString(),
            totalMistakes: 1,
          });
        }
      }
    });

    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
  }

  // --- MÉTRICAS REAIS DO ALUNO (MEU PROGRESSO) ---

  public static getStudentMetrics(userId: string): StudentMetrics {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return {
        totalMinutesPracticed: 0,
        completedActivitiesCount: 0,
        averageScorePercentage: 0,
        audioScoreAverage: 0,
        writingScoreAverage: 0,
        currentStreakDays: 1,
        pendingReviewsCount: 0,
        dailyGoalCompleted: false,
        todayMinutesPracticed: 0,
      };
    }

    const attempts = this.getStudentAttempts(userId, currentUser);
    const reviews = this.getReviewItems(userId);
    const settings = this.getUserSettings(userId);

    const completedActivitiesCount = attempts.length;

    // Tempo estimado em minutos (cada atividade concluída ~ 5 min reais)
    const totalMinutesPracticed = completedActivitiesCount * 5;

    // Pontuações
    const avgScore =
      completedActivitiesCount > 0
        ? Math.round(attempts.reduce((acc, curr) => acc + curr.score, 0) / completedActivitiesCount)
        : 0;

    const audioAttempts = attempts.filter((a) => a.modality === 'audio' || a.modality === 'mixed');
    const audioScoreAverage =
      audioAttempts.length > 0
        ? Math.round(audioAttempts.reduce((acc, curr) => acc + curr.score, 0) / audioAttempts.length)
        : 85;

    const writingAttempts = attempts.filter((a) => a.modality === 'writing' || a.modality === 'mixed');
    const writingScoreAverage =
      writingAttempts.length > 0
        ? Math.round(writingAttempts.reduce((acc, curr) => acc + curr.score, 0) / writingAttempts.length)
        : 80;

    // Revisões pendentes (data menor ou igual a hoje)
    const nowIso = new Date().toISOString();
    const pendingReviews = reviews.filter((r) => r.nextReviewDate <= nowIso);

    // Meta diária: verificar se praticou hoje
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayAttempts = attempts.filter((a) => a.completedAt.slice(0, 10) === todayStr);
    const todayMinutes = todayAttempts.length * 5;
    const dailyGoalCompleted = todayMinutes >= (settings.dailyGoalMinutes || 10);

    return {
      totalMinutesPracticed,
      completedActivitiesCount,
      averageScorePercentage: avgScore,
      audioScoreAverage,
      writingScoreAverage,
      currentStreakDays: completedActivitiesCount > 0 ? 3 : 0,
      pendingReviewsCount: pendingReviews.length,
      dailyGoalCompleted,
      todayMinutesPracticed: todayMinutes,
    };
  }

  // --- CONFIGURAÇÕES DO USUÁRIO ---

  public static getUserSettings(userId: string): UserSettings {
    const map = this.getSettingsMapRaw();
    if (map[userId]) return map[userId];

    const fallback: UserSettings = {
      userId,
      dailyGoalMinutes: 10,
      audioSpeed: 1.0,
      autoPlayAudio: true,
      reminders: {
        enabled: true,
        time: '19:30',
        daysOfWeek: [1, 2, 3, 4, 5],
        timezone: 'America/Sao_Paulo',
      },
    };
    map[userId] = fallback;
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(map));
    return fallback;
  }

  public static updateUserSettings(userId: string, newSettings: Partial<UserSettings>): UserSettings {
    const map = this.getSettingsMapRaw();
    const current = this.getUserSettings(userId);
    const updated: UserSettings = {
      ...current,
      ...newSettings,
      reminders: {
        ...current.reminders,
        ...(newSettings.reminders || {}),
      },
    };
    map[userId] = updated;
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(map));
    return updated;
  }

  // Reset para demonstração
  public static resetDemoData(): void {
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    localStorage.removeItem(STORAGE_KEYS.ACTIVITIES);
    localStorage.removeItem(STORAGE_KEYS.ATTEMPTS);
    localStorage.removeItem(STORAGE_KEYS.REVIEWS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    this.init();
  }

  private static getUsersRaw(): User[] {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    return raw ? JSON.parse(raw) : DEMO_USERS;
  }

  private static getSettingsMapRaw(): Record<string, UserSettings> {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return raw ? JSON.parse(raw) : DEMO_SETTINGS;
  }
}
