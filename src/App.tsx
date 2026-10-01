// Componente Raiz da Aplicação - Inglês Fácil
import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { DemoStore } from './services/storage/demoStore';
import { Activity, Attempt, ReviewItem, StudentMetrics } from './types';

// Componentes Estruturais
import { DemoHeader } from './components/DemoHeader';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';

// Páginas
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { ActivitiesPage } from './pages/ActivitiesPage';
import { ActivityPlayerPage } from './pages/ActivityPlayerPage';
import { ReviewPage } from './pages/ReviewPage';
import { ProgressPage } from './pages/ProgressPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminPage } from './pages/AdminPage';

export const App: React.FC = () => {
  const { user, role, isLoading } = useAuth();

  // Rotas e Navegação
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [authView, setAuthView] = useState<'login' | 'register' | 'forgot'>('login');
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [activityCategoryFilter, setActivityCategoryFilter] = useState<string>('all');

  // Estado de Dados Reativo
  const [activities, setActivities] = useState<Activity[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [metrics, setMetrics] = useState<StudentMetrics>({
    totalMinutesPracticed: 0,
    completedActivitiesCount: 0,
    averageScorePercentage: 0,
    audioScoreAverage: 0,
    writingScoreAverage: 0,
    currentStreakDays: 1,
    pendingReviewsCount: 0,
    dailyGoalCompleted: false,
    todayMinutesPracticed: 0,
  });

  // Carrega e sincroniza dados do usuário ativo
  const refreshAppData = () => {
    if (!user) return;
    const acts = DemoStore.getActivities(role);
    const userAttempts = DemoStore.getStudentAttempts(user.id, user);
    const userReviews = DemoStore.getReviewItems(user.id);
    const userMetrics = DemoStore.getStudentMetrics(user.id);

    setActivities(acts);
    setAttempts(userAttempts);
    setReviewItems(userReviews);
    setMetrics(userMetrics);
  };

  useEffect(() => {
    if (user) {
      refreshAppData();
      // Se estava no player de outra atividade, reseta para dashboard na troca de usuário
      setSelectedActivityId(null);
    }
  }, [user, role]);

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

  // Se não estiver logado, exibe fluxo de autenticação
  if (!user) {
    return (
      <>
        <DemoHeader />
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
  const handleFinishActivity = (attempt: Attempt) => {
    DemoStore.saveAttempt(attempt);
    refreshAppData();
  };

  // Navegar para atividades com filtro
  const handleNavigateToActivities = (categoryFilter?: string) => {
    setActivityCategoryFilter(categoryFilter || 'all');
    setCurrentTab('activities');
  };

  // Atividade selecionada para o player
  const currentActiveActivity = selectedActivityId
    ? DemoStore.getActivityById(selectedActivityId, role)
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
