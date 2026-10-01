// Camada de Dados Única - Inglês Fácil
// Em produção usa o Supabase (dados por usuário no banco); sem chaves configuradas usa o modo demonstração local.
import { Activity, Attempt, ReviewItem, User, UserRole, UserSettings } from '../types';
import { isSupabaseConfigured } from './supabase/client';
import { SupabaseDatabaseService } from './supabase/databaseService';
import { DemoStore } from './storage/demoStore';

type Result = { success: boolean; error?: string };

const useSupabase = isSupabaseConfigured();

export const newId = (): string => crypto.randomUUID();

export const DataService = {
  getActivities(role: UserRole): Promise<Activity[]> {
    return useSupabase ? SupabaseDatabaseService.getActivities(role) : Promise.resolve(DemoStore.getActivities(role));
  },

  async saveActivity(activity: Activity, isNew: boolean): Promise<Result> {
    return useSupabase ? SupabaseDatabaseService.saveActivity(activity, isNew) : DemoStore.saveActivity(activity, 'admin');
  },

  async togglePublishActivity(activity: Activity): Promise<Result> {
    return useSupabase
      ? SupabaseDatabaseService.setActivityPublished(activity.id, !activity.isPublished)
      : DemoStore.togglePublishActivity(activity.id, 'admin');
  },

  async saveAttempt(attempt: Attempt, activity: Activity): Promise<Result> {
    if (useSupabase) return SupabaseDatabaseService.saveAttempt(attempt, activity);
    DemoStore.saveAttempt(attempt);
    return { success: true };
  },

  getStudentAttempts(user: User): Promise<Attempt[]> {
    return useSupabase
      ? SupabaseDatabaseService.getStudentAttempts(user.id)
      : Promise.resolve(DemoStore.getStudentAttempts(user.id, user));
  },

  getReviewItems(userId: string): Promise<ReviewItem[]> {
    return useSupabase ? SupabaseDatabaseService.getReviewItems(userId) : Promise.resolve(DemoStore.getReviewItems(userId));
  },

  async processReviewAnswer(item: ReviewItem, isCorrect: boolean): Promise<Result> {
    if (useSupabase) return SupabaseDatabaseService.processReviewAnswer(item, isCorrect);
    return DemoStore.processReviewAnswer(item.id, isCorrect);
  },

  async getUserSettings(userId: string): Promise<UserSettings> {
    if (useSupabase) {
      const settings = await SupabaseDatabaseService.getUserSettings(userId);
      // Fallback com os mesmos valores padrão da tabela user_settings
      return settings ?? { ...DemoStore.getUserSettings(userId), userId };
    }
    return DemoStore.getUserSettings(userId);
  },

  async saveUserSettings(settings: UserSettings): Promise<Result> {
    if (useSupabase) return SupabaseDatabaseService.saveUserSettings(settings);
    DemoStore.updateUserSettings(settings.userId, settings);
    return { success: true };
  },

  async updateProfileName(userId: string, name: string): Promise<Result> {
    if (useSupabase) return SupabaseDatabaseService.updateProfileName(userId, name);
    return { success: false, error: 'Alteração de nome indisponível no modo demonstração.' };
  },

  getAdminUsers(): Promise<User[]> {
    return useSupabase ? SupabaseDatabaseService.getAdminUsers() : Promise.resolve(DemoStore.getAdminUsers('admin'));
  },

  async toggleUserStatus(target: User): Promise<Result> {
    return useSupabase
      ? SupabaseDatabaseService.setUserStatus(target.id, target.status === 'active' ? 'inactive' : 'active')
      : DemoStore.toggleUserStatus(target.id, 'admin');
  },
};
