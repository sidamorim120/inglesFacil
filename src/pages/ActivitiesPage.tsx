// Listagem e Filtro de Atividades - Inglês Fácil
import React, { useState } from 'react';
import { Activity, ActivityCategory, ActivityModality, Attempt } from '../types';
import {
  Volume2,
  PenTool,
  Sparkles,
  Plane,
  Building,
  UtensilsCrossed,
  Search,
  CheckCircle2,
  Play,
  RotateCcw,
  Clock,
} from 'lucide-react';

interface ActivitiesPageProps {
  activities: Activity[];
  studentAttempts: Attempt[];
  onSelectActivity: (activityId: string) => void;
  initialCategoryFilter?: string;
}

export const ActivitiesPage: React.FC<ActivitiesPageProps> = ({
  activities,
  studentAttempts,
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

        {/* Filtro por Categoria */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`btn btn-sm ${selectedCategory === 'all' ? 'btn-secondary' : 'btn-outline'}`}
          >
            Todos os Temas
          </button>
          <button
            onClick={() => setSelectedCategory('airport')}
            className={`btn btn-sm ${selectedCategory === 'airport' ? 'btn-secondary' : 'btn-outline'}`}
          >
            <Plane size={15} />
            <span>Aeroporto</span>
          </button>
          <button
            onClick={() => setSelectedCategory('hotel')}
            className={`btn btn-sm ${selectedCategory === 'hotel' ? 'btn-secondary' : 'btn-outline'}`}
          >
            <Building size={15} />
            <span>Hotel</span>
          </button>
          <button
            onClick={() => setSelectedCategory('restaurant')}
            className={`btn btn-sm ${selectedCategory === 'restaurant' ? 'btn-secondary' : 'btn-outline'}`}
          >
            <UtensilsCrossed size={15} />
            <span>Restaurante</span>
          </button>
        </div>
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
        <div className="activities-grid">
          {filteredActivities.map((activity) => {
            const lastAttempt = attemptMap[activity.id];
            const isCompleted = !!lastAttempt;

            return (
              <article key={activity.id} className="activity-item-card">
                <div>
                  <div className="activity-item-header">
                    <span className="badge badge-primary">
                      {activity.category === 'airport' && <><Plane size={12} /> Aeroporto</>}
                      {activity.category === 'hotel' && <><Building size={12} /> Hotel</>}
                      {activity.category === 'restaurant' && <><UtensilsCrossed size={12} /> Restaurante</>}
                    </span>

                    {isCompleted ? (
                      <span className="badge badge-success" title="Atividade já concluída por você">
                        <CheckCircle2 size={13} />
                        Nota: {lastAttempt.score}%
                      </span>
                    ) : (
                      <span className="badge badge-secondary" style={{ opacity: 0.8 }}>
                        Iniciante
                      </span>
                    )}
                  </div>

                  <h2 className="activity-item-title">{activity.title}</h2>
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
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
