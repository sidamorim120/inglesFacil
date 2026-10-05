// Tela Meu Progresso - Inglês Fácil
import React, { useState } from 'react';
import { Attempt, StudentMetrics } from '../types';
import { categoryInfo } from '../services/categories';
import { isLevelUnlocked, LevelState, LEVEL_LABELS, PASSING_SCORE } from '../services/progress/levelRules';
import { useAuth } from '../contexts/AuthContext';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  Volume2,
  PenTool,
  Calendar,
  ChevronDown,
  ChevronUp,
  XCircle,
  Award,
  Lock,
} from 'lucide-react';

interface ProgressPageProps {
  metrics: StudentMetrics;
  levelState: LevelState;
  attempts: Attempt[];
  onNavigateToActivities: () => void;
}

export const ProgressPage: React.FC<ProgressPageProps> = ({
  metrics,
  levelState,
  attempts,
  onNavigateToActivities,
}) => {
  const { settings, isAdmin } = useAuth();
  const [expandedAttemptId, setExpandedAttemptId] = useState<string | null>(null);

  // Formatação de data em UTC respeitando o fuso horário configurado
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: settings?.reminders.timezone || 'America/Sao_Paulo',
      }).format(date);
    } catch {
      return new Date(isoString).toLocaleString('pt-BR');
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedAttemptId(expandedAttemptId === id ? null : id);
  };

  return (
    <div className="page-wrapper">
      <header style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.85rem', marginBottom: '6px' }}>Meu Progresso</h1>
        <p style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
          Métricas e histórico pessoal calculados a partir das suas atividades reais.
        </p>
      </header>

      {/* Grid de Métricas Principais */}
      <section className="dashboard-grid" aria-label="Métricas de desempenho">
        <div className="metric-card">
          <div className="metric-card-header">
            <span className="metric-card-title">Tempo Total Praticado</span>
            <Clock size={20} color="var(--primary)" />
          </div>
          <div className="metric-card-value">
            {metrics.totalMinutesPracticed} <span style={{ fontSize: '1rem', fontWeight: 500 }}>minutos</span>
          </div>
          <p style={{ fontSize: '0.85rem' }}>Em sessões curtas focadas para adultos com rotina corrida.</p>
        </div>

        <div className="metric-card">
          <div className="metric-card-header">
            <span className="metric-card-title">Atividades Concluídas</span>
            <CheckCircle2 size={20} color="var(--secondary)" />
          </div>
          <div className="metric-card-value">{metrics.completedActivitiesCount}</div>
          <p style={{ fontSize: '0.85rem' }}>Cobrindo situações reais de viagem e conversação.</p>
        </div>

        <div className="metric-card">
          <div className="metric-card-header">
            <span className="metric-card-title">Aproveitamento Médio</span>
            <Award size={20} color="var(--accent)" />
          </div>
          <div className="metric-card-value">{metrics.averageScorePercentage}%</div>
          <p style={{ fontSize: '0.85rem' }}>Calculado a partir de todas as respostas registradas.</p>
        </div>
      </section>

      {/* Trilha de Níveis */}
      {!isAdmin && (
        <section className="card" style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '6px' }}>Trilha de Níveis</h2>
          <p style={{ fontSize: '0.85rem', marginBottom: '18px' }}>
            Tire {PASSING_SCORE}% ou mais em todas as atividades de um nível para liberar o próximo.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {levelState.progress.map((p) => {
              const unlocked = isLevelUnlocked(p.level, levelState.current);
              const isCurrent = p.level === levelState.current;
              const done = unlocked && !isCurrent;
              const percent = p.total > 0 ? Math.round((p.completed / p.total) * 100) : 0;

              return (
                <div key={p.level} style={{ opacity: unlocked ? 1 : 0.55 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: '6px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                      {done && <CheckCircle2 size={18} color="var(--success)" />}
                      {!unlocked && <Lock size={16} color="var(--text-light)" />}
                      {LEVEL_LABELS[p.level]}
                      {isCurrent && <span className="badge badge-primary">Atual</span>}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {p.total === 0 ? 'Em breve' : `${p.completed}/${p.total}`}
                    </span>
                  </div>
                  <div className="progress-track" style={{ height: '10px' }}>
                    <div className="progress-bar-fill" style={{ width: `${done ? 100 : percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Comparativo: Áudio vs Escrita */}
      <section className="card" style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '18px' }}>Desempenho por Habilidade</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                <Volume2 size={18} color="var(--primary)" />
                Atividades de Áudio & Compreensão Auditiva
              </span>
              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{metrics.audioScoreAverage}%</span>
            </div>
            <div className="progress-track" style={{ height: '12px' }}>
              <div
                className="progress-bar-fill"
                style={{
                  width: `${metrics.audioScoreAverage}%`,
                  background: 'linear-gradient(90deg, #0f4c81 0%, #38bdf8 100%)',
                }}
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                <PenTool size={18} color="var(--secondary)" />
                Atividades de Escrita, Gramática & Tradução
              </span>
              <span style={{ fontWeight: 700, color: 'var(--secondary)' }}>{metrics.writingScoreAverage}%</span>
            </div>
            <div className="progress-track" style={{ height: '12px' }}>
              <div
                className="progress-bar-fill"
                style={{
                  width: `${metrics.writingScoreAverage}%`,
                  background: 'linear-gradient(90deg, #0d826a 0%, #34d399 100%)',
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Histórico Pessoal de Tentativas */}
      <section>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Histórico Pessoal de Tentativas</h2>

        {attempts.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ marginBottom: '16px' }}>Você ainda não completou nenhuma atividade.</p>
            <button onClick={onNavigateToActivities} className="btn btn-primary btn-sm">
              Fazer Primeira Prática
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {attempts.map((attempt) => {
              const isExpanded = expandedAttemptId === attempt.id;

              return (
                <div key={attempt.id} className="card" style={{ padding: '18px 20px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px',
                      cursor: 'pointer',
                    }}
                    onClick={() => toggleExpand(attempt.id)}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span className="badge badge-primary">{categoryInfo(attempt.category).label}</span>
                        <span className="badge badge-secondary">
                          {attempt.modality === 'audio' ? 'Áudio' : attempt.modality === 'writing' ? 'Escrita' : 'Misto'}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                          {formatDate(attempt.completedAt)}
                        </span>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                        {attempt.activityTitle}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <span
                        className={`badge ${attempt.score >= 70 ? 'badge-success' : 'badge-warning'}`}
                        style={{ fontSize: '0.9rem', padding: '6px 12px' }}
                      >
                        Nota: {attempt.score}%
                      </span>
                      <button className="btn-outline btn-sm" style={{ border: 'none', padding: '4px' }}>
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                    </div>
                  </div>

                  {/* Detalhes Expandidos da Tentativa */}
                  {isExpanded && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                      <h4 style={{ fontSize: '0.95rem', marginBottom: '10px' }}>Respostas Registradas:</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {attempt.submissions.map((sub, sIdx) => (
                          <div
                            key={sIdx}
                            style={{
                              padding: '10px 14px',
                              borderRadius: 'var(--radius-sm)',
                              background: sub.isCorrect ? 'var(--success-bg)' : 'var(--danger-bg)',
                              fontSize: '0.875rem',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                              {sub.isCorrect ? <CheckCircle2 size={16} color="var(--success)" /> : <XCircle size={16} color="var(--danger)" />}
                              <span>Sua resposta: "{sub.userAnswer || '(em branco)'}"</span>
                            </div>
                            {!sub.isCorrect && (
                              <div style={{ marginTop: 4, color: 'var(--text-muted)' }}>
                                Resposta correta: <strong>{sub.expectedAnswer}</strong>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
