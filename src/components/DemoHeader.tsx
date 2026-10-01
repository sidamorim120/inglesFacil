// Banner Superior do Modo Demonstração e Status do Banco de Dados
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DEMO_USERS } from '../services/storage/initialData';
import { Sparkles, ShieldCheck, UserCheck, RefreshCw, Database } from 'lucide-react';

export const DemoHeader: React.FC = () => {
  const { user, switchUser, resetDemoData, isSupabaseMode } = useAuth();

  return (
    <div className="demo-banner-strip">
      <div className="demo-banner-content">
        <Database size={16} color={isSupabaseMode ? '#34d399' : '#38bdf8'} />
        <span>
          {isSupabaseMode ? (
            <>
              <strong style={{ color: '#34d399' }}>🟢 Supabase Conectado:</strong> PostgreSQL com Autenticação e RLS ativos em produção.
            </>
          ) : (
            <>
              <strong>Modo Demonstração Interativo:</strong> Alterne perfis para testar permissões (adicione as chaves no <code>.env.local</code> para ativar o Supabase):
            </>
          )}
        </span>
      </div>

      <div className="demo-users-pills">
        {!isSupabaseMode &&
          DEMO_USERS.map((u) => {
            const isActive = user?.id === u.id;
            return (
              <button
                key={u.id}
                onClick={() => switchUser(u.id)}
                className={`demo-chip-btn ${isActive ? 'active' : ''}`}
                title={`Alternar para ${u.name} (${u.role === 'admin' ? 'Administrador' : 'Aluno'})`}
              >
                {u.role === 'admin' ? (
                  <ShieldCheck size={14} style={{ display: 'inline', marginRight: 4 }} />
                ) : (
                  <UserCheck size={14} style={{ display: 'inline', marginRight: 4 }} />
                )}
                {u.name} ({u.role === 'admin' ? 'Admin' : 'Aluno'})
              </button>
            );
          })}

        {!isSupabaseMode && (
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
        )}
      </div>
    </div>
  );
};
