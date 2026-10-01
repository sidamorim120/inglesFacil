// Tela de Definição de Nova Senha (aberta pelo link do e-mail) - Inglês Fácil
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, KeyRound, ShieldAlert } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (password.length < 8) {
      setErrorMessage('A senha precisa ter pelo menos 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);
    const res = await updatePassword(password);
    setIsLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Não foi possível atualizar a senha. Solicite um novo link.');
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-logo">
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🇬🇧</div>
          <h1>Nova Senha</h1>
          <p>Escolha uma nova senha para acessar o Inglês Fácil</p>
        </div>

        {errorMessage && (
          <div className="alert alert-danger" style={{ fontSize: '0.875rem' }}>
            <ShieldAlert size={18} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="reset-password">
              Nova senha
            </label>
            <div className="password-input-wrapper">
              <input
                id="reset-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                autoComplete="new-password"
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
            <span className="form-hint">Mínimo de 8 caracteres.</span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reset-password-confirm">
              Confirme a nova senha
            </label>
            <input
              id="reset-password-confirm"
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              autoComplete="new-password"
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
            <KeyRound size={20} />
            <span>{isLoading ? 'Salvando...' : 'Salvar nova senha'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
