// Componente Raiz da Aplicação - Inglês Fácil
import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { DataService } from './services/dataService';
import { computeStudentMetrics } from './services/progress/progressRules';
import { Activity, Attempt, ReviewItem, StudentMetrics } from './types';

// Componentes Estruturais
import { DemoHeader } from './components/DemoHeader';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';

// Páginas
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { ActivitiesPage } from './pages/ActivitiesPage';
import { ActivityPlayerPage } from './pages/ActivityPlayerPage';
import { ReviewPage } from './pages/ReviewPage';
import { ProgressPage } from './pages/ProgressPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminPage } from './pages/AdminPage';

export const App: React.FC = () => {
  const { user, role, settings, isLoading, isPasswordRecovery } = useAuth();

  // Rotas e Navegação
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [authView, setAuthView] = useState<'login' | 'register' | 'forgot'>('login');
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [activityCategoryFilter, setActivityCategoryFilter] = useState<string>('all');

  // Estado de Dados Reativo
  const [activities, setActivities] = useState<Activity[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [dataError, setDataError] = useState<string | null>(null);

  const metrics: StudentMetrics = computeStudentMetrics(attempts, reviewItems, settings);

  // Carrega e sincroniza dados do usuário ativo
  const refreshAppData = async () => {
    if (!user) return;
    try {
      const [acts, userAttempts, userReviews] = await Promise.all([
        DataService.getActivities(role),
        DataService.getStudentAttempts(user),
        DataService.getReviewItems(user.id),
      ]);
      setActivities(acts);
      setAttempts(userAttempts);
      setReviewItems(userReviews);
      setDataError(null);
    } catch (err: unknown) {
      setDataError(`Não foi possível carregar seus dados: ${(err as Error).message}`);
    }
  };

  useEffect(() => {
    if (user) {
      refreshAppData();
      // Se estava no player de outra atividade, reseta para dashboard na troca de usuário
      setSelectedActivityId(null);
    } else {
      setActivities([]);
      setAttempts([]);
      setReviewItems([]);
    }
  }, [user?.id, role]);

  // Loading inicial
  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-app)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🇬🇧</div>
          <div style={{ fontWeight: 600, color: 'var(--primary)' }}>Carregando Inglês Fácil...</div>
        </div>
      </div>
    );
  }

  // Usuário chegou pelo link de redefinição de senha do e-mail
  if (isPasswordRecovery) {
    return <ResetPasswordPage />;
  }

  // Se não estiver logado, exibe fluxo de autenticação
  if (!user) {
    return (
      <>
        {authView === 'login' && (
          <LoginPage
            onNavigateToRegister={() => setAuthView('register')}
            onNavigateToForgot={() => setAuthView('forgot')}
          />
        )}
        {authView === 'register' && (
          <RegisterPage onNavigateToLogin={() => setAuthView('login')} />
        )}
        {authView === 'forgot' && (
          <ForgotPasswordPage onNavigateToLogin={() => setAuthView('login')} />
        )}
      </>
    );
  }

  // Atividade do Dia (primeira não concluída ou a primeira da lista)
  const completedIds = new Set(attempts.map((a) => a.activityId));
  const todayActivity = activities.find((a) => !completedIds.has(a.id)) || activities[0] || null;

  // Iniciar atividade no player
  const handleStartActivity = (activityId: string) => {
    setSelectedActivityId(activityId);
    setCurrentTab('player');
  };

  // Finalizar atividade
  const handleFinishActivity = async (attempt: Attempt, activity: Activity) => {
    const res = await DataService.saveAttempt(attempt, activity);
    if (!res.success) {
      setDataError(`Não foi possível salvar seu resultado: ${res.error}`);
      return;
    }
    await refreshAppData();
  };

  // Navegar para atividades com filtro
  const handleNavigateToActivities = (categoryFilter?: string) => {
    setActivityCategoryFilter(categoryFilter || 'all');
    setCurrentTab('activities');
  };

  // Atividade selecionada para o player
  const currentActiveActivity = selectedActivityId
    ? activities.find((a) => a.id === selectedActivityId) || null
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Banner de Demonstração Interativo */}
      <DemoHeader />

      <div className="app-container">
        {/* Menu Lateral Desktop */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setSelectedActivityId(null);
            setCurrentTab(tab);
          }}
          pendingReviewsCount={metrics.pendingReviewsCount}
        />

        {/* Conteúdo Principal */}
        <main className="app-main-content">
          {/* Header Mobile Compacto */}
          <MobileNav
            currentTab={currentTab}
            onSelectTab={(tab) => {
              setSelectedActivityId(null);
              setCurrentTab(tab);
            }}
            pendingReviewsCount={metrics.pendingReviewsCount}
          />

          {dataError && (
            <div className="alert alert-danger" role="alert" style={{ margin: '16px' }}>
              <span>{dataError}</span>
            </div>
          )}

          {/* Roteamento de Abas */}
          {currentTab === 'dashboard' && (
            <DashboardPage
              metrics={metrics}
              todayActivity={todayActivity}
              onStartActivity={handleStartActivity}
              onNavigateToReviews={() => setCurrentTab('review')}
              onNavigateToActivities={handleNavigateToActivities}
            />
          )}

          {currentTab === 'activities' && (
            <ActivitiesPage
              activities={activities}
              studentAttempts={attempts}
              onSelectActivity={handleStartActivity}
              initialCategoryFilter={activityCategoryFilter}
            />
          )}

          {currentTab === 'player' && currentActiveActivity && (
            <ActivityPlayerPage
              activity={currentActiveActivity}
              onFinishActivity={handleFinishActivity}
              onExit={() => {
                setSelectedActivityId(null);
                setCurrentTab('activities');
              }}
            />
          )}

          {currentTab === 'review' && (
            <ReviewPage
              reviewItems={reviewItems}
              onRefreshReviews={refreshAppData}
            />
          )}

          {currentTab === 'progress' && (
            <ProgressPage
              metrics={metrics}
              attempts={attempts}
              onNavigateToActivities={() => setCurrentTab('activities')}
            />
          )}

          {currentTab === 'settings' && <SettingsPage />}

          {currentTab === 'admin' && (
            <AdminPage onRefreshActivities={refreshAppData} />
          )}
        </main>
      </div>
    </div>
  );
};
