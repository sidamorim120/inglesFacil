// Painel de Administração - Inglês Fácil
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Activity, ActivityCategory, ActivityModality, Question, StudyLevel } from '../types';
import { DataService, newId } from '../services/dataService';
import { CATEGORIES, categoryInfo } from '../services/categories';
import { LEVELS, LEVEL_LABELS } from '../services/progress/levelRules';
import {
  Shield,
  Users,
  BookOpen,
  Search,
  CheckCircle,
  XCircle,
  Plus,
  Eye,
  EyeOff,
  Edit,
  AlertTriangle,
  Lock,
  X,
  Save,
} from 'lucide-react';

const MODALITY_LABELS: Record<ActivityModality, string> = {
  audio: 'Áudio',
  writing: 'Escrita',
  mixed: 'Misto',
};

interface AdminPageProps {
  onRefreshActivities: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onRefreshActivities }) => {
  const { user, isAdmin, isSupabaseMode } = useAuth();

  const [activeTab, setActiveTab] = useState<'users' | 'activities'>('users');
  const [usersList, setUsersList] = useState<User[]>([]);
  const [activitiesList, setActivitiesList] = useState<Activity[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modal de Atividade
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  // Form State da Atividade
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ActivityCategory>('introductions');
  const [modality, setModality] = useState<ActivityModality>('audio');
  const [level, setLevel] = useState<StudyLevel>('basic_1');
  const [estimatedMinutes, setEstimatedMinutes] = useState(5);
  const [isPublished, setIsPublished] = useState(true);

  // Carrega dados se for admin
  const loadData = async () => {
    if (!isAdmin) return;
    try {
      const [users, activities] = await Promise.all([DataService.getAdminUsers(), DataService.getActivities('admin')]);
      setUsersList(users);
      setActivitiesList(activities);
    } catch (err: unknown) {
      const error = err as Error;
      setActionError(error.message);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAdmin]);

  // Acesso negado se não for admin
  if (!isAdmin) {
    return (
      <div className="page-wrapper">
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px', maxWidth: '600px', margin: '40px auto' }}>
          <div style={{ color: 'var(--danger)', marginBottom: '16px' }}>
            <Lock size={48} />
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Acesso Restrito</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
            Esta área é restrita a administradores. A sua conta atual ({user?.name}) possui perfil de <strong>Aluno</strong>.
          </p>
          {!isSupabaseMode && (
          <div className="alert alert-warning" style={{ fontSize: '0.85rem', textAlign: 'left' }}>
            <strong>Controle de Segurança:</strong> As permissões são validadas nas camadas de lógica e banco de dados. Para testar as funções administrativas, utilize o alternador de perfis no topo da página e selecione <strong>Prof.ª Helena (Admin)</strong>.
          </div>
          )}
        </div>
      </div>
    );
  }

  // Ações de Usuário
  const handleToggleUserStatus = async (targetUser: User) => {
    setActionError(null);
    setActionSuccess(null);

    if (targetUser.id === user?.id && targetUser.status === 'active') {
      setActionError('Você não pode desativar a sua própria conta.');
      return;
    }

    const result = await DataService.toggleUserStatus(targetUser);
    if (!result.success) {
      setActionError(result.error || 'Erro ao alterar status.');
    } else {
      setActionSuccess(`Status de ${targetUser.name} alterado com sucesso.`);
      loadData();
    }
  };

  const handleChangeMinLevel = async (targetUser: User, minLevel: StudyLevel) => {
    setActionError(null);
    setActionSuccess(null);

    const result = await DataService.setUserMinLevel(targetUser, minLevel);
    if (!result.success) {
      setActionError(result.error || 'Erro ao alterar o nível.');
    } else {
      setActionSuccess(`${targetUser.name} agora tem acesso até o ${LEVEL_LABELS[minLevel]}.`);
      loadData();
    }
  };

  // Ações de Atividades
  const handleTogglePublish = async (activity: Activity) => {
    setActionError(null);
    setActionSuccess(null);

    const result = await DataService.togglePublishActivity(activity);
    if (!result.success) {
      setActionError(result.error || 'Erro ao alterar visibilidade.');
    } else {
      loadData();
      onRefreshActivities();
    }
  };

  const handleOpenCreateModal = () => {
    setEditingActivity(null);
    setTitle('');
    setDescription('');
    setCategory('introductions');
    setModality('audio');
    setLevel('basic_1');
    setEstimatedMinutes(5);
    setIsPublished(true);
    setIsActivityModalOpen(true);
  };

  const handleOpenEditModal = (act: Activity) => {
    setEditingActivity(act);
    setTitle(act.title);
    setDescription(act.description);
    setCategory(act.category);
    setModality(act.modality);
    setLevel(act.level);
    setEstimatedMinutes(act.estimatedMinutes);
    setIsPublished(act.isPublished);
    setIsActivityModalOpen(true);
  };

  const handleSaveActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const targetActivityId = editingActivity ? editingActivity.id : newId();
    const baseQuestions: Question[] = editingActivity
      ? editingActivity.questions
      : [
          {
            id: newId(),
            activityId: targetActivityId,
            type: 'dictation',
            promptPt: 'Ouça o áudio e escreva a frase em inglês:',
            audioPhraseEn: 'Can I have your boarding pass?',
            expectedAnswer: 'Can I have your boarding pass?',
            acceptedVariations: ['Can I have your boarding pass'],
            explanationPt: 'Pergunta educada usada com frequência na imigração e portão de embarque.',
          },
        ];

    const newActivity: Activity = {
      id: targetActivityId,
      version: editingActivity ? editingActivity.version : 1,
      title: title.trim(),
      description: description.trim(),
      category,
      modality,
      level,
      estimatedMinutes,
      isPublished,
      questions: baseQuestions,
      createdAt: editingActivity ? editingActivity.createdAt : new Date().toISOString(),
    };

    const res = await DataService.saveActivity(newActivity, !editingActivity);
    if (res.success) {
      setIsActivityModalOpen(false);
      loadData();
      onRefreshActivities();
      setActionSuccess('Atividade salva com sucesso!');
    } else {
      setActionError(res.error || 'Falha ao salvar atividade.');
    }
  };

  const filteredUsers = usersList.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  return (
    <div className="page-wrapper">
      <header style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Shield size={28} color="var(--primary)" />
          <h1 style={{ fontSize: '1.85rem' }}>Painel Administrativo</h1>
        </div>
        <p style={{ fontSize: '1rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Gerenciamento de contas de alunos, permissões e catálogo de atividades pedagógicas.
        </p>
      </header>

      {actionError && (
        <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
          <AlertTriangle size={20} />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="alert alert-success" style={{ marginBottom: '20px' }}>
          <CheckCircle size={20} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Abas */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('users')}
          className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-outline'}`}
        >
          <Users size={18} />
          <span>Usuários ({usersList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('activities')}
          className={`btn ${activeTab === 'activities' ? 'btn-primary' : 'btn-outline'}`}
        >
          <BookOpen size={18} />
          <span>Atividades ({activitiesList.length})</span>
        </button>
      </div>

      {/* ABA 1: USUÁRIOS */}
      {activeTab === 'users' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.25rem' }}>Alunos e Professores Cadastrados</h2>

            <div style={{ position: 'relative', width: '280px', maxWidth: '100%' }}>
              <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Filtrar por nome ou e-mail..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                style={{ paddingLeft: '34px', minHeight: '40px' }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table admin-table-responsive">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Papel</th>
                  <th>Nível liberado</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const isCurrent = u.id === user?.id;
                  const isActive = u.status === 'active';

                  return (
                    <tr key={u.id}>
                      <td data-label="Nome">
                        <strong>{u.name}</strong> {isCurrent && <span style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>(Você)</span>}
                      </td>
                      <td data-label="E-mail">{u.email}</td>
                      <td data-label="Papel">
                        <span className={`badge ${u.role === 'admin' ? 'badge-primary' : 'badge-secondary'}`}>
                          {u.role === 'admin' ? 'Administrador' : 'Aluno'}
                        </span>
                      </td>
                      <td data-label="Nível liberado">
                        {u.role === 'admin' ? (
                          <span style={{ color: 'var(--text-light)' }}>Todos</span>
                        ) : (
                          <select
                            className="form-select"
                            style={{ minHeight: '36px', padding: '4px 8px', width: 'auto' }}
                            value={u.minLevel}
                            onChange={(e) => handleChangeMinLevel(u, e.target.value as StudyLevel)}
                            title="O aluno avança sozinho a partir deste nível"
                            aria-label={`Nível liberado para ${u.name}`}
                          >
                            {LEVELS.map((l) => (
                              <option key={l} value={l}>{LEVEL_LABELS[l]}</option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td data-label="Status">
                        <span className={`badge ${isActive ? 'badge-success' : 'badge-warning'}`}>
                          {isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td data-label="Ações">
                        <button
                          onClick={() => handleToggleUserStatus(u)}
                          className={`btn ${isActive ? 'btn-danger' : 'btn-secondary'} btn-sm`}
                          title={isActive ? 'Desativar acesso' : 'Reativar acesso'}
                        >
                          {isActive ? 'Desativar Conta' : 'Ativar Conta'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA 2: ATIVIDADES */}
      {activeTab === 'activities' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem' }}>Gerenciador de Conteúdo e Atividades</h2>
              <p style={{ fontSize: '0.85rem' }}>Publique ou edite atividades sem perder a integridade de versões dos alunos.</p>
            </div>

            <button onClick={handleOpenCreateModal} className="btn btn-primary btn-sm">
              <Plus size={16} />
              <span>Nova Atividade</span>
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table admin-table-responsive">
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Nível</th>
                  <th>Tema</th>
                  <th>Modalidade</th>
                  <th>Versão</th>
                  <th>Visibilidade</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {activitiesList.map((act) => (
                  <tr key={act.id}>
                    <td data-label="Título">
                      <strong>{act.title}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                        {act.questions.length} questões cadastradas
                      </div>
                    </td>
                    <td data-label="Nível">
                      <span className="badge badge-secondary">{LEVEL_LABELS[act.level]}</span>
                    </td>
                    <td data-label="Tema">
                      <span className="badge badge-primary">{categoryInfo(act.category).label}</span>
                    </td>
                    <td data-label="Modalidade">
                      <span className="badge badge-secondary">{MODALITY_LABELS[act.modality]}</span>
                    </td>
                    <td data-label="Versão">v{act.version}</td>
                    <td data-label="Visibilidade">
                      <span className={`badge ${act.isPublished ? 'badge-success' : 'badge-warning'}`}>
                        {act.isPublished ? 'Publicada' : 'Rascunho / Oculta'}
                      </span>
                    </td>
                    <td data-label="Ações">
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handleTogglePublish(act)}
                          className="btn btn-outline btn-sm"
                          title={act.isPublished ? 'Ocultar para alunos' : 'Publicar para alunos'}
                        >
                          {act.isPublished ? <EyeOff size={15} /> : <Eye size={15} />}
                          <span>{act.isPublished ? 'Despublicar' : 'Publicar'}</span>
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(act)}
                          className="btn btn-outline btn-sm"
                          title="Editar atividade"
                        >
                          <Edit size={15} />
                          <span>Editar</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DE CRIAÇÃO / EDIÇÃO DE ATIVIDADE */}
      {isActivityModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.3rem' }}>
                {editingActivity ? `Editar Atividade (v${editingActivity.version + 1})` : 'Criar Nova Atividade'}
              </h3>
              <button onClick={() => setIsActivityModalOpen(false)} className="btn-outline btn-sm" style={{ border: 'none' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveActivity}>
              <div className="form-group">
                <label className="form-label" htmlFor="act-title">Título da Atividade</label>
                <input
                  id="act-title"
                  type="text"
                  className="form-input"
                  placeholder="Ex: Pedindo Informações no Hotel"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="act-desc">Descrição Didática</label>
                <textarea
                  id="act-desc"
                  className="form-input"
                  style={{ minHeight: '80px' }}
                  placeholder="Breve resumo em português do que o aluno vai praticar..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="act-cat">Tema</label>
                  <select
                    id="act-cat"
                    className="form-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ActivityCategory)}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="act-mod">Modalidade</label>
                  <select
                    id="act-mod"
                    className="form-select"
                    value={modality}
                    onChange={(e) => setModality(e.target.value as ActivityModality)}
                  >
                    <option value="audio">Áudio & Escuta</option>
                    <option value="writing">Escrita & Tradução</option>
                    <option value="mixed">Misto (Áudio e Escrita)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="act-level">Nível</label>
                  <select
                    id="act-level"
                    className="form-select"
                    value={level}
                    onChange={(e) => setLevel(e.target.value as StudyLevel)}
                  >
                    {LEVELS.map((l) => (
                      <option key={l} value={l}>{LEVEL_LABELS[l]}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="act-min">Tempo Estimado (minutos)</label>
                  <input
                    id="act-min"
                    type="number"
                    min="3"
                    max="15"
                    className="form-input"
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    style={{ width: 18, height: 18 }}
                  />
                  <span>Publicar imediatamente para os alunos</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setIsActivityModalOpen(false)}
                  className="btn btn-outline"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={18} />
                  <span>Salvar Atividade</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
