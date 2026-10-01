// Painel do Aluno (Dashboard) - Inglês Fácil
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Activity, StudentMetrics } from '../types';
import {
  Play,
  RotateCcw,
  Target,
  Bell,
  CheckCircle,
  Clock,
  Plane,
  Building,
  UtensilsCrossed,
  ArrowRight,
} from 'lucide-react';

interface DashboardPageProps {
  metrics: StudentMetrics;
  todayActivity: Activity | null;
  onStartActivity: (activityId: string) => void;
  onNavigateToReviews: () => void;
  onNavigateToActivities: (categoryFilter?: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  metrics,
  todayActivity,
  onStartActivity,
  onNavigateToReviews,
  onNavigateToActivities,
}) => {
  const { user, settings } = useAuth();

  // Saudação de acordo com o horário do dia
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const dailyGoal = settings?.dailyGoalMinutes || 10;
  const progressPercent = Math.min(100, Math.round((metrics.todayMinutesPracticed / dailyGoal) * 100));

  return (
    <div className="page-wrapper">
      {/* Saudação do Aluno */}
      <header className="dashboard-header">
        <h1 className="dashboard-greeting">
          {getGreeting()}, {user?.name || 'Aluno'}!
        </h1>
        <p className="dashboard-sub">
          Dedique de 5 a 10 minutos hoje para manter seu inglês em evolução contínua.
        </p>
      </header>

      {/* Atividade do Dia em Destaque */}
      {todayActivity ? (
        <section className="featured-activity-card" aria-labelledby="featured-activity-title">
          <div className="featured-meta">
            <span className="featured-meta-item">⭐ Atividade Recomendada para Hoje</span>
            <span className="featured-meta-item">
              <Clock size={14} style={{ display: 'inline', marginRight: 4 }} />
              ~{todayActivity.estimatedMinutes} minutos
            </span>
            <span className="featured-meta-item">
              {todayActivity.category === 'airport' && '✈️ Aeroporto'}
              {todayActivity.category === 'hotel' && '🏨 Hotel'}
              {todayActivity.category === 'restaurant' && '🍽️ Restaurante'}
            </span>
          </div>

          <h2 id="featured-activity-title">{todayActivity.title}</h2>
          <p>{todayActivity.description}</p>

          <button
            onClick={() => onStartActivity(todayActivity.id)}
            className="btn btn-secondary btn-lg"
            style={{
              backgroundColor: '#ffffff',
              color: 'var(--primary)',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            <Play size={22} fill="currentColor" />
            <span>Começar prática</span>
          </button>
        </section>
      ) : (
        <div className="alert alert-info">
          <span>Você já praticou todas as atividades recomendadas por hoje! Que tal fazer uma revisão?</span>
        </div>
      )}

      {/* Grid de Métricas Diárias */}
      <section className="dashboard-grid" aria-label="Resumo de metas e progresso diário">
        {/* Meta Diária */}
        <div className="metric-card">
          <div>
            <div className="metric-card-header">
              <span className="metric-card-title">Meta de Estudo Diária</span>
              <Target size={20} color="var(--primary)" />
            </div>
            <div className="metric-card-value">
              {metrics.todayMinutesPracticed} / {dailyGoal} <span style={{ fontSize: '1rem', fontWeight: 500 }}>minutos</span>
            </div>
            <p style={{ fontSize: '0.875rem' }}>
              {metrics.dailyGoalCompleted
                ? '🎉 Parabéns! Meta do dia alcançada.'
                : `Faltam ${Math.max(0, dailyGoal - metrics.todayMinutesPracticed)} min para bater sua meta de hoje.`}
            </p>
          </div>
          <div className="progress-track">
            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {/* Revisões Pendentes */}
        <div className="metric-card">
          <div>
            <div className="metric-card-header">
              <span className="metric-card-title">Revisões Pendentes</span>
              <RotateCcw size={20} color="var(--accent)" />
            </div>
            <div className="metric-card-value" style={{ color: metrics.pendingReviewsCount > 0 ? 'var(--accent)' : 'inherit' }}>
              {metrics.pendingReviewsCount}{' '}
              <span style={{ fontSize: '1rem', fontWeight: 500 }}>frases</span>
            </div>
            <p style={{ fontSize: '0.875rem' }}>
              {metrics.pendingReviewsCount > 0
                ? 'Frases que você errou anteriormente prontas para reforço de memória.'
                : 'Tudo em dia! Nenhuma revisão acumulada para hoje.'}
            </p>
          </div>
          {metrics.pendingReviewsCount > 0 && (
            <button
              onClick={onNavigateToReviews}
              className="btn btn-outline btn-sm"
              style={{ marginTop: '14px', width: '100%', borderColor: 'var(--accent)', color: 'var(--accent)' }}
            >
              <RotateCcw size={16} />
              <span>Revisar frases agora</span>
            </button>
          )}
        </div>

        {/* Lembrete Configurado */}
        <div className="metric-card">
          <div>
            <div className="metric-card-header">
              <span className="metric-card-title">Lembrete Diário</span>
              <Bell size={20} color="var(--secondary)" />
            </div>
            <div className="metric-card-value" style={{ fontSize: '1.4rem' }}>
              {settings?.reminders.enabled ? (
                <>Às {settings.reminders.time}</>
              ) : (
                <span style={{ color: 'var(--text-light)', fontSize: '1.1rem' }}>Desativado</span>
              )}
            </div>
            <p style={{ fontSize: '0.85rem' }}>
              {settings?.reminders.enabled
                ? `Programado para seu dia local em ${settings.reminders.timezone.split('/')[1]?.replace('_', ' ')}.`
                : 'Ative um horário nas configurações para não esquecer sua prática.'}
            </p>
          </div>
          <div style={{ marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-light)' }}>
            Fuso: {settings?.reminders.timezone || 'America/Sao_Paulo'}
          </div>
        </div>
      </section>

      {/* Módulos de Viagem Rápida */}
      <section style={{ marginTop: '36px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem' }}>Situações Reais de Viagem</h2>
            <p style={{ fontSize: '0.9rem' }}>Pratique nos contextos que você mais vai usar no exterior</p>
          </div>
          <button
            onClick={() => onNavigateToActivities()}
            className="btn btn-outline btn-sm"
          >
            <span>Ver todas</span>
            <ArrowRight size={16} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <button
            onClick={() => onNavigateToActivities('airport')}
            className="card"
            style={{ textAlign: 'left', cursor: 'pointer', borderLeft: '4px solid var(--primary)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ padding: '8px', background: 'var(--primary-light)', borderRadius: 'var(--radius-md)' }}>
                <Plane size={24} color="var(--primary)" />
              </div>
              <h3 style={{ fontSize: '1.1rem' }}>Aeroporto</h3>
            </div>
            <p style={{ fontSize: '0.875rem' }}>Passaporte, portão de embarque e alfândega sem aperto.</p>
          </button>

          <button
            onClick={() => onNavigateToActivities('hotel')}
            className="card"
            style={{ textAlign: 'left', cursor: 'pointer', borderLeft: '4px solid var(--secondary)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ padding: '8px', background: 'var(--secondary-light)', borderRadius: 'var(--radius-md)' }}>
                <Building size={24} color="var(--secondary)" />
              </div>
              <h3 style={{ fontSize: '1.1rem' }}>Hotel</h3>
            </div>
            <p style={{ fontSize: '0.875rem' }}>Check-in, senha do Wi-Fi, toalhas e horários do café.</p>
          </button>

          <button
            onClick={() => onNavigateToActivities('restaurant')}
            className="card"
            style={{ textAlign: 'left', cursor: 'pointer', borderLeft: '4px solid #f59e0b' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ padding: '8px', background: '#fef3c7', borderRadius: 'var(--radius-md)' }}>
                <UtensilsCrossed size={24} color="#d97706" />
              </div>
              <h3 style={{ fontSize: '1.1rem' }}>Restaurante</h3>
            </div>
            <p style={{ fontSize: '0.875rem' }}>Mesa para dois, café com leite, água e pedir a conta.</p>
          </button>
        </div>
      </section>
    </div>
  );
};
