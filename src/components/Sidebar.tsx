// Menu Lateral Desktop - Inglês Fácil
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  RotateCcw,
  TrendingUp,
  Settings,
  Shield,
  LogOut,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  pendingReviewsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, pendingReviewsCount }) => {
  const { user, isAdmin, logout } = useAuth();

  return (
    <aside className="app-sidebar" aria-label="Menu principal">
      <div className="sidebar-logo">
        <div style={{ fontSize: '1.8rem', lineHeight: 1 }}>🇬🇧</div>
        <div>
          <div className="sidebar-logo-text">Inglês Fácil</div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Prática Diária</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`nav-link ${currentTab === 'dashboard' ? 'active' : ''}`}
        >
          <LayoutDashboard size={20} />
          <span>Painel do Aluno</span>
        </button>

        <button
          onClick={() => onSelectTab('activities')}
          className={`nav-link ${currentTab === 'activities' ? 'active' : ''}`}
        >
          <BookOpen size={20} />
          <span>Atividades</span>
        </button>

        <button
          onClick={() => onSelectTab('review')}
          className={`nav-link ${currentTab === 'review' ? 'active' : ''}`}
          style={{ position: 'relative' }}
        >
          <RotateCcw size={20} />
          <span style={{ flex: 1 }}>Revisão</span>
          {pendingReviewsCount > 0 && (
            <span
              style={{
                backgroundColor: '#d97706',
                color: '#ffffff',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '999px',
              }}
            >
              {pendingReviewsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onSelectTab('progress')}
          className={`nav-link ${currentTab === 'progress' ? 'active' : ''}`}
        >
          <TrendingUp size={20} />
          <span>Meu Progresso</span>
        </button>

        <button
          onClick={() => onSelectTab('settings')}
          className={`nav-link ${currentTab === 'settings' ? 'active' : ''}`}
        >
          <Settings size={20} />
          <span>Configurações</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => onSelectTab('admin')}
            className={`nav-link ${currentTab === 'admin' ? 'active' : ''}`}
            style={{
              marginTop: '12px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              paddingTop: '14px',
              color: '#38bdf8',
            }}
          >
            <Shield size={20} />
            <span>Administração</span>
          </button>
        )}
      </nav>

      <div className="sidebar-user">
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#f1f5f9' }}>{user?.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <span
              style={{
                fontSize: '0.7rem',
                backgroundColor: isAdmin ? 'rgba(56, 189, 248, 0.2)' : 'rgba(52, 211, 153, 0.2)',
                color: isAdmin ? '#38bdf8' : '#34d399',
                padding: '1px 6px',
                borderRadius: '4px',
                fontWeight: 600,
              }}
            >
              {isAdmin ? 'Administrador' : 'Aluno'}
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          title="Encerrar sessão"
          className="btn-outline btn-sm"
          style={{
            borderColor: 'rgba(255,255,255,0.2)',
            color: '#cbd5e1',
            padding: '6px 10px',
            minHeight: 'auto',
          }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
};
