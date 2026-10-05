// Painel do Aluno (Dashboard) - Inglês Fácil
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Activity, StudentMetrics } from '../types';
import { CATEGORIES, categoryInfo } from '../services/categories';
import { LevelState, LEVEL_LABELS, PASSING_SCORE } from '../services/progress/levelRules';
import {
  Play,
  RotateCcw,
  Target,
  Bell,
  CheckCircle,
  Clock,
  ArrowRight,
  GraduationCap,
} from 'lucide-react';

interface DashboardPageProps {
  metrics: StudentMetrics;
  levelState: LevelState;
  todayActivity: Activity | null;
  onStartActivity: (activityId: string) => void;
  onNavigateToReviews: () => void;
  onNavigateToActivities: (categoryFilter?: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  metrics,
  levelState,
  todayActivity,
  onStartActivity,
  onNavigateToReviews,
  onNavigateToActivities,
}) => {
  const { user, settings, isAdmin } = useAuth();
  const currentProgress = levelState.progress.find((p) => p.level === levelState.current);
  const levelPercent = currentProgress && currentProgress.total > 0
    ? Math.round((currentProgress.completed / currentProgress.total) * 100)
    : 0;

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
              {categoryInfo(todayActivity.category).emoji} {categoryInfo(todayActivity.category).label}
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
        {/* Nível Atual */}
        {!isAdmin && currentProgress && (
          <div className="metric-card">
            <div>
              <div className="metric-card-header">
                <span className="metric-card-title">Seu Nível</span>
                <GraduationCap size={20} color="var(--primary)" />
              </div>
              <div className="metric-card-value">{LEVEL_LABELS[levelState.current]}</div>
              <p style={{ fontSize: '0.875rem' }}>
                {currentProgress.total === 0
                  ? 'Novas atividades deste nível chegam em breve.'
                  : `${currentProgress.completed} de ${currentProgress.total} atividades com nota ≥ ${PASSING_SCORE}%. Conclua todas para avançar.`}
              </p>
            </div>
            <div className="progress-track">
              <div className="progress-bar-fill" style={{ width: `${levelPercent}%` }} />
            </div>
          </div>
        )}

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

      {/* Temas */}
      <section style={{ marginTop: '36px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: '18px' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem' }}>Temas</h2>
            <p style={{ fontSize: '0.9rem' }}>Pratique o inglês das situações do dia a dia</p>
          </div>
          <button
            onClick={() => onNavigateToActivities()}
            className="btn btn-outline btn-sm"
          >
            <span>Ver todas</span>
            <ArrowRight size={16} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => onNavigateToActivities(c.id)}
              className="card"
              style={{ textAlign: 'left', cursor: 'pointer', borderLeft: '4px solid var(--primary)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <span style={{ fontSize: '1.5rem' }} aria-hidden="true">{c.emoji}</span>
                <h3 style={{ fontSize: '1.05rem' }}>{c.label}</h3>
              </div>
              <p style={{ fontSize: '0.85rem' }}>{c.description}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
