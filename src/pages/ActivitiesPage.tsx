// Listagem e Filtro de Atividades - Inglês Fácil
import React, { useState } from 'react';
import { Activity, Attempt, StudyLevel } from '../types';
import { CATEGORIES, categoryInfo } from '../services/categories';
import { isLevelUnlocked, LEVEL_LABELS, LEVELS, PASSING_SCORE } from '../services/progress/levelRules';
import {
  Volume2,
  PenTool,
  Search,
  CheckCircle2,
  Play,
  RotateCcw,
  Clock,
  Lock,
} from 'lucide-react';

interface ActivitiesPageProps {
  activities: Activity[];
  studentAttempts: Attempt[];
  currentLevel: StudyLevel;
  allUnlocked: boolean;
  onSelectActivity: (activityId: string) => void;
  initialCategoryFilter?: string;
}

export const ActivitiesPage: React.FC<ActivitiesPageProps> = ({
  activities,
  studentAttempts,
  currentLevel,
  allUnlocked,
  onSelectActivity,
  initialCategoryFilter = 'all',
}) => {
  const [selectedModality, setSelectedModality] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategoryFilter);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Mapeia melhor tentativa por atividade para mostrar estado de conclusão
  const attemptMap = studentAttempts.reduce((acc, attempt) => {
    if (!acc[attempt.activityId] || attempt.score > acc[attempt.activityId].score) {
      acc[attempt.activityId] = attempt;
    }
    return acc;
  }, {} as Record<string, Attempt>);

  // Filtragem
  const filteredActivities = activities.filter((act) => {
    const matchesModality =
      selectedModality === 'all' ||
      act.modality === selectedModality ||
      (selectedModality === 'audio' && act.modality === 'mixed') ||
      (selectedModality === 'writing' && act.modality === 'mixed');

    const matchesCategory =
      selectedCategory === 'all' || act.category === selectedCategory;

    const matchesSearch =
      searchTerm.trim() === '' ||
      act.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.description.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesModality && matchesCategory && matchesSearch;
  });

  const hasFilters = selectedModality !== 'all' || selectedCategory !== 'all' || searchTerm.trim() !== '';

  // Agrupa por nível; sem filtros, mostra também os níveis que ainda não têm conteúdo
  const levelGroups = LEVELS.map((level) => {
    const all = activities.filter((a) => a.level === level);
    return {
      level,
      items: filteredActivities.filter((a) => a.level === level),
      completed: all.filter((a) => (attemptMap[a.id]?.score ?? 0) >= PASSING_SCORE).length,
      total: all.length,
      unlocked: allUnlocked || isLevelUnlocked(level, currentLevel),
    };
  }).filter((g) => g.items.length > 0 || (!hasFilters && g.total === 0));

  return (
    <div className="page-wrapper">
      <header style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.85rem', marginBottom: '6px' }}>Atividades de Inglês Prático</h1>
        <p style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
          Atividades curtas de 5 a 7 minutos com áudio claro e escrita guiada para o dia a dia.
        </p>
      </header>

      {/* Barra de Filtros e Busca */}
      <section className="activities-filter-bar" aria-label="Filtros de atividades">
        {/* Busca */}
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search
            size={18}
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }}
          />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '38px', minHeight: '44px' }}
            placeholder="Buscar por assunto ou palavra..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filtro por Modalidade (Áudio / Escrita) */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedModality('all')}
            className={`btn btn-sm ${selectedModality === 'all' ? 'btn-primary' : 'btn-outline'}`}
          >
            Todas
          </button>
          <button
            onClick={() => setSelectedModality('audio')}
            className={`btn btn-sm ${selectedModality === 'audio' ? 'btn-primary' : 'btn-outline'}`}
          >
            <Volume2 size={16} />
            <span>Áudio & Escuta</span>
          </button>
          <button
            onClick={() => setSelectedModality('writing')}
            className={`btn btn-sm ${selectedModality === 'writing' ? 'btn-primary' : 'btn-outline'}`}
          >
            <PenTool size={16} />
            <span>Escrita & Gramática</span>
          </button>
        </div>

        {/* Filtro por Tema */}
        <select
          className="form-select"
          style={{ minHeight: '40px', width: 'auto', maxWidth: '100%' }}
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          aria-label="Filtrar por tema"
        >
          <option value="all">Todos os Temas</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
          ))}
        </select>
      </section>

      {/* Lista de Atividades */}
      {filteredActivities.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔍</div>
          <h3>Nenhuma atividade encontrada</h3>
          <p style={{ marginTop: '6px' }}>Tente alterar os termos da busca ou selecionar outros filtros de tema e modalidade.</p>
          <button
            onClick={() => {
              setSelectedModality('all');
              setSelectedCategory('all');
              setSearchTerm('');
            }}
            className="btn btn-outline btn-sm"
            style={{ marginTop: '16px' }}
          >
            Limpar todos os filtros
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {levelGroups.map((group) => (
            <section key={group.level} aria-labelledby={`level-${group.level}`}>
              <div className="level-section-header">
                <h2 id={`level-${group.level}`} style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {!group.unlocked && <Lock size={18} color="var(--text-light)" />}
                  {LEVEL_LABELS[group.level]}
                  {group.level === currentLevel && !allUnlocked && (
                    <span className="badge badge-primary">Seu nível</span>
                  )}
                </h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {group.total === 0
                    ? 'Conteúdo em breve'
                    : group.unlocked
                      ? `${group.completed} de ${group.total} concluídas com nota ≥ ${PASSING_SCORE}%`
                      : `Conclua o ${LEVEL_LABELS[LEVELS[LEVELS.indexOf(group.level) - 1]]} para liberar`}
                </span>
              </div>

              {group.items.length > 0 && (
                <div className="activities-grid">
                  {group.items.map((activity) => {
                    const lastAttempt = attemptMap[activity.id];
                    const isCompleted = !!lastAttempt;
                    const isPassed = isCompleted && lastAttempt.score >= PASSING_SCORE;

                    return (
                      <article
                        key={activity.id}
                        className={`activity-item-card${group.unlocked ? '' : ' activity-item-locked'}`}
                      >
                        <div>
                          <div className="activity-item-header">
                            <span className="badge badge-primary">
                              {categoryInfo(activity.category).emoji} {categoryInfo(activity.category).label}
                            </span>

                            {isCompleted ? (
                              <span
                                className={`badge ${isPassed ? 'badge-success' : 'badge-warning'}`}
                                title={isPassed ? 'Atividade concluída' : `Refaça para chegar a ${PASSING_SCORE}% e avançar de nível`}
                              >
                                <CheckCircle2 size={13} />
                                Nota: {lastAttempt.score}%
                              </span>
                            ) : (
                              <span className="badge badge-secondary" style={{ opacity: 0.8 }}>
                                {LEVEL_LABELS[activity.level]}
                              </span>
                            )}
                          </div>

                          <h3 className="activity-item-title">{activity.title}</h3>
                          <p className="activity-item-desc">{activity.description}</p>
                        </div>

                        <div>
                          <div style={{ display: 'flex', gap: '8px', fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: '14px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Clock size={14} />
                              ~{activity.estimatedMinutes} min
                            </span>
                            <span>•</span>
                            <span>
                              {activity.modality === 'audio' && '🔊 Áudio'}
                              {activity.modality === 'writing' && '✍️ Escrita'}
                              {activity.modality === 'mixed' && '🎧 Misto'}
                            </span>
                            <span>•</span>
                            <span>{activity.questions.length} questões</span>
                          </div>

                          <div className="activity-item-footer">
                            {group.unlocked ? (
                              <button
                                onClick={() => onSelectActivity(activity.id)}
                                className={`btn ${isCompleted ? 'btn-outline' : 'btn-primary'} btn-sm`}
                                style={{ width: '100%' }}
                              >
                                {isCompleted ? (
                                  <>
                                    <RotateCcw size={15} />
                                    <span>Praticar Novamente</span>
                                  </>
                                ) : (
                                  <>
                                    <Play size={15} fill="currentColor" />
                                    <span>Iniciar Atividade</span>
                                  </>
                                )}
                              </button>
                            ) : (
                              <button className="btn btn-outline btn-sm" style={{ width: '100%' }} disabled>
                                <Lock size={15} />
                                <span>Bloqueada</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
};
