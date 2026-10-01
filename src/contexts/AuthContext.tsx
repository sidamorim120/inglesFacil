// Contexto de Autenticação e Sessão - Inglês Fácil
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, UserSettings } from '../types';
import { DemoStore } from '../services/storage/demoStore';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAdmin: boolean;
  settings: UserSettings | null;
  isLoading: boolean;
  login: (email: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string) => Promise<{ success: boolean; error?: string }>;
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

  // Inicializa dados no primeiro carregamento
  useEffect(() => {
    DemoStore.init();
    const currentUser = DemoStore.getCurrentUser();
    setUser(currentUser);
    if (currentUser) {
      setSettings(DemoStore.getUserSettings(currentUser.id));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string) => {
    const res = DemoStore.login(email);
    if (res.success && res.user) {
      setUser(res.user);
      setSettings(DemoStore.getUserSettings(res.user.id));
      return { success: true };
    }
    return { success: false, error: res.error || 'Erro ao entrar.' };
  };

  const register = async (name: string, email: string) => {
    const res = DemoStore.register(name, email);
    if (res.success && res.user) {
      setUser(res.user);
      setSettings(DemoStore.getUserSettings(res.user.id));
      return { success: true };
    }
    return { success: false, error: res.error || 'Erro ao cadastrar.' };
  };

  const logout = () => {
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
