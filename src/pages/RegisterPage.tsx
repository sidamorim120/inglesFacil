// Tela de Cadastro - Inglês Fácil
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, UserPlus, ArrowLeft, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface RegisterPageProps {
  onNavigateToLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigateToLogin }) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Por favor, informe seu nome completo.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Informe um e-mail válido.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('A confirmação de senha não confere com a senha digitada.');
      return;
    }

    setIsLoading(true);
    const res = await register(name, email, password);
    setIsLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Falha ao realizar cadastro.');
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <button
          type="button"
          onClick={onNavigateToLogin}
          className="btn-outline btn-sm"
          style={{ marginBottom: '16px' }}
        >
          <ArrowLeft size={16} />
          <span>Voltar para o Login</span>
        </button>

        <div className="auth-logo">
          <h1>Criar Minha Conta</h1>
          <p>Pratique inglês todo dia em sessões rápidas</p>
        </div>

        {/* Garantia explícita de perfil aluno para cadastro público */}
        <div className="alert alert-info" style={{ fontSize: '0.85rem' }}>
          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          <div>
            <strong>Perfil de Aluno:</strong> Todas as novas contas públicas são criadas automaticamente como perfil Aluno, garantindo foco total no aprendizado.
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
            <label className="form-label" htmlFor="reg-name">
              Nome Completo
            </label>
            <input
              id="reg-name"
              type="text"
              className="form-input"
              placeholder="Ex: Carlos Oliveira"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">
              E-mail
            </label>
            <input
              id="reg-email"
              type="email"
              className="form-input"
              placeholder="seu.email@exemplo.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">
              Senha (mínimo de 6 dígitos)
            </label>
            <div className="password-input-wrapper">
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Crie uma senha segura"
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

          <div className="form-group">
            <label className="form-label" htmlFor="reg-confirm">
              Confirmar Senha
            </label>
            <input
              id="reg-confirm"
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              placeholder="Repita a senha digitada"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '12px' }}
            disabled={isLoading}
          >
            <UserPlus size={20} />
            <span>{isLoading ? 'Criando conta...' : 'Concluir cadastro e começar'}</span>
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem' }}>
          Já possui cadastro?{' '}
          <button
            type="button"
            onClick={onNavigateToLogin}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Entrar com sua conta
          </button>
        </div>
      </div>
    </div>
  );
};
