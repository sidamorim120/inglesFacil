// Contexto de Autenticação e Sessão - Inglês Fácil
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, UserSettings } from '../types';
import { DemoStore } from '../services/storage/demoStore';
import { isSupabaseConfigured, supabase } from '../services/supabase/client';
import { SupabaseAuthService } from '../services/supabase/authService';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAdmin: boolean;
  settings: UserSettings | null;
  isLoading: boolean;
  isSupabaseMode: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchUser: (userId: string) => void;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  resetDemoData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isSupabaseMode = isSupabaseConfigured();

  // Inicializa dados e escuta sessão
  useEffect(() => {
    DemoStore.init();

    if (isSupabaseMode && supabase) {
      // Verifica sessão ativa no Supabase
      supabase.auth.getSession().then(({ data }) => {
        if (data.session?.user) {
          SupabaseAuthService.getProfile(data.session.user.id).then((profile) => {
            if (profile) setUser(profile);
            setIsLoading(false);
          });
        } else {
          setIsLoading(false);
        }
      });

      // Escuta mudanças de estado de autenticação
      const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const profile = await SupabaseAuthService.getProfile(session.user.id);
          if (profile) setUser(profile);
        } else {
          setUser(null);
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    } else {
      // Modo Demonstração Local
      const currentUser = DemoStore.getCurrentUser();
      setUser(currentUser);
      if (currentUser) {
        setSettings(DemoStore.getUserSettings(currentUser.id));
      }
      setIsLoading(false);
    }
  }, [isSupabaseMode]);

  const login = async (email: string, password?: string) => {
    if (isSupabaseMode && password) {
      const res = await SupabaseAuthService.signIn(email, password);
      if (res.error) {
        return { success: false, error: res.error };
      }
      if (res.user) {
        setUser(res.user);
        return { success: true };
      }
    }

    // Modo demonstração
    const res = DemoStore.login(email);
    if (res.success && res.user) {
      setUser(res.user);
      setSettings(DemoStore.getUserSettings(res.user.id));
      return { success: true };
    }
    return { success: false, error: res.error || 'Erro ao entrar.' };
  };

  const register = async (name: string, email: string, password?: string) => {
    if (isSupabaseMode && password) {
      const res = await SupabaseAuthService.signUp(name, email, password);
      if (res.error) {
        return { success: false, error: res.error };
      }
      if (res.user) {
        setUser(res.user);
        return { success: true };
      }
    }

    // Modo demonstração
    const res = DemoStore.register(name, email);
    if (res.success && res.user) {
      setUser(res.user);
      setSettings(DemoStore.getUserSettings(res.user.id));
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
      setSettings(DemoStore.getUserSettings(nextUser.id));
    }
  };

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    if (!user) return;
    const updated = DemoStore.updateUserSettings(user.id, newSettings);
    setSettings(updated);
  };

  const resetDemoData = () => {
    DemoStore.resetDemoData();
    const currentUser = DemoStore.getCurrentUser();
    setUser(currentUser);
    if (currentUser) {
      setSettings(DemoStore.getUserSettings(currentUser.id));
    }
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
        login,
        register,
        logout,
        switchUser,
        updateSettings,
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
