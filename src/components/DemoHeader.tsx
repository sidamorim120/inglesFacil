// Banner Superior do Modo Demonstração
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DEMO_USERS } from '../services/storage/initialData';
import { Sparkles, ShieldCheck, UserCheck, RefreshCw } from 'lucide-react';

export const DemoHeader: React.FC = () => {
  const { user, switchUser, resetDemoData } = useAuth();

  return (
    <div className="demo-banner-strip">
      <div className="demo-banner-content">
        <Sparkles size={16} color="#38bdf8" />
        <span>
          <strong>Modo Demonstração Interativo:</strong> Alterne perfis abaixo para testar permissões e funcionalidades:
        </span>
      </div>

      <div className="demo-users-pills">
        {DEMO_USERS.map((u) => {
          const isActive = user?.id === u.id;
          return (
            <button
              key={u.id}
              onClick={() => switchUser(u.id)}
              className={`demo-chip-btn ${isActive ? 'active' : ''}`}
              title={`Alternar para ${u.name} (${u.role === 'admin' ? 'Administrador' : 'Aluno'})`}
            >
              {u.role === 'admin' ? <ShieldCheck size={14} style={{ display: 'inline', marginRight: 4 }} /> : <UserCheck size={14} style={{ display: 'inline', marginRight: 4 }} />}
              {u.name} ({u.role === 'admin' ? 'Admin' : 'Aluno'})
            </button>
          );
        })}

        <button
          onClick={() => {
            if (confirm('Deseja restaurar os dados de demonstração originais?')) {
              resetDemoData();
            }
          }}
          className="demo-chip-btn"
          title="Restaurar dados iniciais de demonstração"
        >
          <RefreshCw size={12} style={{ display: 'inline', marginRight: 4 }} />
          Restaurar Demonstração
        </button>
      </div>
    </div>
  );
};
