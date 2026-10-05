// Serviço de Autenticação Real com Supabase Auth - Inglês Fácil
import { supabase, isSupabaseConfigured } from './client';
import { User, UserRole } from '../../types';

export class SupabaseAuthService {
  /**
   * Realiza login com e-mail e senha gerenciados pelo Supabase Auth
   */
  public static async signIn(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
    if (!isSupabaseConfigured() || !supabase) {
      return { user: null, error: 'Supabase não configurado. Verifique suas variáveis de ambiente.' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        if (error.code === 'email_not_confirmed') {
          return { user: null, error: 'E-mail ainda não confirmado. Verifique sua caixa de entrada.' };
        }
        if (error.code === 'invalid_credentials') {
          return { user: null, error: 'E-mail ou senha incorretos.' };
        }
        return { user: null, error: error.message };
      }

      if (!data.user) {
        return { user: null, error: 'Usuário não encontrado.' };
      }

      // Busca perfil no banco de dados
      const profile = await this.getProfile(data.user.id);
      return { user: profile, error: null };
    } catch (err: unknown) {
      const error = err as Error;
      return { user: null, error: error.message || 'Erro inesperado ao realizar login.' };
    }
  }

  /**
   * Realiza cadastro de novo aluno garantindo perfil 'student' via trigger no banco
   */
  public static async signUp(name: string, email: string, password: string): Promise<{ user: User | null; error: string | null }> {
    if (!isSupabaseConfigured() || !supabase) {
      return { user: null, error: 'Supabase não configurado.' };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            name: name.trim(),
            role: 'student', // Perfil aluno público
          },
        },
      });

      if (error) {
        return { user: null, error: error.message };
      }

      if (!data.user) {
        return { user: null, error: 'Erro ao criar conta.' };
      }

      // Perfil criado pelo trigger do schema.sql
      const profile: User = {
        id: data.user.id,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: 'student',
        status: 'active',
        minLevel: 'basic_1',
        createdAt: new Date().toISOString(),
      };

      return { user: profile, error: null };
    } catch (err: unknown) {
      const error = err as Error;
      return { user: null, error: error.message || 'Falha ao cadastrar.' };
    }
  }

  /**
   * Encerra sessão do usuário autenticado
   */
  public static async signOut(): Promise<void> {
    if (supabase) {
      await supabase.auth.signOut();
    }
  }

  /**
   * Solicita envio de e-mail de recuperação de senha com link seguro
   */
  public static async resetPassword(email: string): Promise<{ success: boolean; error: string | null }> {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, error: 'Supabase não configurado.' };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: window.location.origin,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  }

  /**
   * Obtém o perfil de dados do usuário autenticado na tabela public.profiles
   */
  public static async getProfile(userId: string): Promise<User | null> {
    if (!isSupabaseConfigured() || !supabase) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role as UserRole,
        status: data.status,
        minLevel: data.min_level ?? 'basic_1',
        createdAt: data.created_at,
      };
    } catch {
      return null;
    }
  }
}
