// Navegação Mobile (Header e Bottom Bar) - Inglês Fácil
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  RotateCcw,
  TrendingUp,
  Settings,
  Shield,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

interface MobileNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  pendingReviewsCount: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentTab, onSelectTab, pendingReviewsCount }) => {
  const { user, isAdmin, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSelect = (tab: string) => {
    onSelectTab(tab);
    setMenuOpen(false);
  };

  return (
    <>
      {/* Header Compacto Mobile */}
      <header className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '1.4rem' }}>🇬🇧</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>Inglês Fácil</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user?.name} ({isAdmin ? 'Admin' : 'Aluno'})</div>
          </div>
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="btn-outline btn-sm"
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          style={{ padding: '8px 12px' }}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Menu Gaveta Expandido */}
      {menuOpen && (
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderBottom: '2px solid var(--border-subtle)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <button
            onClick={() => handleSelect('settings')}
            className={`btn-outline ${currentTab === 'settings' ? 'active' : ''}`}
            style={{ justifyContent: 'flex-start' }}
          >
            <Settings size={18} />
            <span>Configurações</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => handleSelect('admin')}
              className="btn-primary"
              style={{ justifyContent: 'flex-start' }}
            >
              <Shield size={18} />
              <span>Painel de Administração</span>
            </button>
          )}

          <button
            onClick={() => {
              logout();
              setMenuOpen(false);
            }}
            className="btn-danger btn-sm"
            style={{ justifyContent: 'flex-start', marginTop: '8px' }}
          >
            <LogOut size={16} />
            <span>Sair da Conta</span>
          </button>
        </div>
      )}

      {/* Barra de Navegação Inferior Fixa */}
      <nav className="mobile-bottom-nav" aria-label="Navegação móvel">
        <div className="mobile-bottom-nav-items">
          <button
            onClick={() => handleSelect('dashboard')}
            className={`mobile-nav-item ${currentTab === 'dashboard' ? 'active' : ''}`}
          >
            <LayoutDashboard size={20} />
            <span>Início</span>
          </button>

          <button
            onClick={() => handleSelect('activities')}
            className={`mobile-nav-item ${currentTab === 'activities' ? 'active' : ''}`}
          >
            <BookOpen size={20} />
            <span>Atividades</span>
          </button>

          <button
            onClick={() => handleSelect('review')}
            className={`mobile-nav-item ${currentTab === 'review' ? 'active' : ''}`}
            style={{ position: 'relative' }}
          >
            <RotateCcw size={20} />
            <span>Revisão</span>
            {pendingReviewsCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 12,
                  backgroundColor: '#d97706',
                  color: '#ffffff',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  padding: '1px 5px',
                  borderRadius: '999px',
                }}
              >
                {pendingReviewsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => handleSelect('progress')}
            className={`mobile-nav-item ${currentTab === 'progress' ? 'active' : ''}`}
          >
            <TrendingUp size={20} />
            <span>Progresso</span>
          </button>
        </div>
      </nav>
    </>
  );
};
