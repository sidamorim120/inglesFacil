// Tela de Login - Inglês Fácil
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, LogIn, Sparkles, User, ShieldAlert } from 'lucide-react';

interface LoginPageProps {
  onNavigateToRegister: () => void;
  onNavigateToForgot: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigateToRegister, onNavigateToForgot }) => {
  const { login, switchUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Por favor, preencha o e-mail e a senha.');
      return;
    }

    setIsLoading(true);
    const res = await login(email, password);
    setIsLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Falha ao autenticar.');
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-logo">
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🇬🇧</div>
          <h1>Inglês Fácil</h1>
          <p>Prática diária curta para adultos brasileiros</p>
        </div>

        {/* Alerta de Modo Demonstração Transparente */}
        <div className="alert alert-info" style={{ fontSize: '0.85rem' }}>
          <Sparkles size={18} style={{ flexShrink: 0 }} />
          <div>
            <strong>Modo Demonstração:</strong> Você pode digitar seus dados ou clicar nos botões rápidos abaixo para testar instantaneamente como Aluno ou Administrador.
          </div>
        </div>

        {errorMessage && (
          <div className="alert alert-danger" style={{ fontSize: '0.875rem' }}>
            <ShieldAlert size={18} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              E-mail
            </label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              placeholder="seu.email@exemplo.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" htmlFor="login-password">
                Senha
              </label>
              <button
                type="button"
                onClick={onNavigateToForgot}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Esqueceu a senha?
              </button>
            </div>
            <div className="password-input-wrapper">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Sua senha secreta"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '12px' }}
            disabled={isLoading}
          >
            <LogIn size={20} />
            <span>{isLoading ? 'Entrando...' : 'Entrar no aplicativo'}</span>
          </button>
        </form>

        {/* Atalhos de Demonstração Rápida */}
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
          <p style={{ fontSize: '0.8125rem', textAlign: 'center', marginBottom: '12px', fontWeight: 600 }}>
            OU ENTRE RAPIDAMENTE COM UM CLIQUE:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => switchUser('user-carlos-student')}
              style={{ width: '100%', justifyContent: 'flex-start' }}
            >
              <User size={16} />
              <span>Entrar como Carlos Silva (Perfil Aluno)</span>
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => switchUser('user-helena-admin')}
              style={{ width: '100%', justifyContent: 'flex-start' }}
            >
              <User size={16} />
              <span>Entrar como Prof.ª Helena (Perfil Admin)</span>
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem' }}>
          Não tem uma conta?{' '}
          <button
            type="button"
            onClick={onNavigateToRegister}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Cadastre-se gratuitamente
          </button>
        </div>
      </div>
    </div>
  );
};
