// Contexto de Autenticação e Sessão - Inglês Fácil
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, UserSettings } from '../types';
import { DemoStore } from '../services/storage/demoStore';
import { isSupabaseConfigured, supabase } from '../services/supabase/client';
import { SupabaseAuthService } from '../services/supabase/authService';
import { DataService } from '../services/dataService';

// Link de redefinição de senha do Supabase chega com type=recovery na URL
const openedFromRecoveryLink =
  typeof window !== 'undefined' && window.location.hash.includes('type=recovery');

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAdmin: boolean;
  settings: UserSettings | null;
  isLoading: boolean;
  isSupabaseMode: boolean;
  isPasswordRecovery: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchUser: (userId: string) => void;
  updateSettings: (newSettings: UserSettings) => Promise<{ success: boolean; error?: string }>;
  updateName: (name: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  resetDemoData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mantém a mesma referência se o perfil não mudou (evita reiniciar telas a cada renovação de token)
const sameUser = (a: User | null, b: User | null) => JSON.stringify(a) === JSON.stringify(b);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(openedFromRecoveryLink);
  const isSupabaseMode = isSupabaseConfigured();

  const applyUser = (next: User | null) => {
    setUser((prev) => (sameUser(prev, next) ? prev : next));
  };

  // Carrega configurações do usuário logado
  useEffect(() => {
    if (!user) {
      setSettings(null);
      return;
    }
    let cancelled = false;
    DataService.getUserSettings(user.id).then((s) => {
      if (!cancelled) setSettings(s);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Inicializa dados e escuta sessão
  useEffect(() => {
    DemoStore.init();

    if (isSupabaseMode && supabase) {
      const loadProfile = async (userId: string) => {
        const profile = await SupabaseAuthService.getProfile(userId);
        if (profile && profile.status === 'active') {
          applyUser(profile);
        } else {
          // Sessão sem perfil válido ou conta inativa não entra no app
          applyUser(null);
          if (profile) await SupabaseAuthService.signOut();
        }
      };

      supabase.auth.getSession().then(async ({ data }) => {
        if (data.session?.user) await loadProfile(data.session.user.id);
        setIsLoading(false);
      });

      // Escuta mudanças de estado de autenticação
      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY') setIsPasswordRecovery(true);
        if (session?.user) {
          // Fora do callback para não travar o cliente do Supabase
          setTimeout(() => loadProfile(session.user.id), 0);
        } else {
          applyUser(null);
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    } else {
      // Modo Demonstração Local
      setUser(DemoStore.getCurrentUser());
      setIsLoading(false);
    }
  }, [isSupabaseMode]);

  const login = async (email: string, password?: string) => {
    if (isSupabaseMode) {
      if (!password) return { success: false, error: 'Informe sua senha.' };
      const res = await SupabaseAuthService.signIn(email, password);
      if (res.error) {
        return { success: false, error: res.error };
      }
      if (!res.user) {
        await SupabaseAuthService.signOut();
        return { success: false, error: 'Conta autenticada, mas sem perfil cadastrado. Contate o administrador.' };
      }
      if (res.user.status !== 'active') {
        await SupabaseAuthService.signOut();
        return { success: false, error: 'Sua conta está inativa. Contate o administrador.' };
      }
      applyUser(res.user);
      return { success: true };
    }

    // Modo demonstração
    const res = DemoStore.login(email);
    if (res.success && res.user) {
      setUser(res.user);
      return { success: true };
    }
    return { success: false, error: res.error || 'Erro ao entrar.' };
  };

  const register = async (name: string, email: string, password?: string) => {
    if (isSupabaseMode) {
      if (!password) return { success: false, error: 'Informe uma senha.' };
      const res = await SupabaseAuthService.signUp(name, email, password);
      if (res.error) {
        return { success: false, error: res.error };
      }
      return {
        success: false,
        error: 'Cadastro realizado! Confirme seu e-mail pelo link enviado e depois faça login.',
      };
    }

    // Modo demonstração
    const res = DemoStore.register(name, email);
    if (res.success && res.user) {
      setUser(res.user);
      return { success: true };
    }
    return { success: false, error: res.error || 'Erro ao cadastrar.' };
  };

  const logout = () => {
    if (isSupabaseMode) {
      SupabaseAuthService.signOut();
    }
    DemoStore.logout();
    setUser(null);
    setSettings(null);
  };

  const switchUser = (userId: string) => {
    const nextUser = DemoStore.switchDemoUser(userId);
    if (nextUser) {
      setUser(nextUser);
    }
  };

  const updateSettings = async (newSettings: UserSettings) => {
    const res = await DataService.saveUserSettings(newSettings);
    if (res.success) setSettings(newSettings);
    return res;
  };

  const updateName = async (name: string) => {
    if (!user) return { success: false, error: 'Sessão expirada.' };
    const res = await DataService.updateProfileName(user.id, name);
    if (res.success) setUser({ ...user, name });
    return res;
  };

  const updatePassword = async (password: string) => {
    if (!supabase) return { success: false, error: 'Supabase não configurado.' };
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { success: false, error: error.message };
    setIsPasswordRecovery(false);
    window.history.replaceState(null, '', window.location.pathname);
    return { success: true };
  };

  const resetDemoData = () => {
    DemoStore.resetDemoData();
    setUser(DemoStore.getCurrentUser());
  };

  const role: UserRole = user?.role || 'student';
  const isAdmin = role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAdmin,
        settings,
        isLoading,
        isSupabaseMode,
        isPasswordRecovery,
        login,
        register,
        logout,
        switchUser,
        updateSettings,
        updateName,
        updatePassword,
        resetDemoData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
