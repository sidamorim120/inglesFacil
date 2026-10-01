// Tela de Recuperação de Acesso - Inglês Fácil
import React, { useState } from 'react';
import { ArrowLeft, Mail, CheckCircle2, ShieldAlert } from 'lucide-react';
import { isSupabaseConfigured } from '../services/supabase/client';
import { SupabaseAuthService } from '../services/supabase/authService';

interface ForgotPasswordPageProps {
  onNavigateToLogin: () => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigateToLogin }) => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setErrorMessage('');

    if (isSupabaseConfigured()) {
      setIsLoading(true);
      const res = await SupabaseAuthService.resetPassword(email);
      setIsLoading(false);
      if (!res.success) {
        setErrorMessage(res.error || 'Não foi possível enviar o e-mail. Tente novamente em alguns minutos.');
        return;
      }
    }
    setIsSubmitted(true);
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
          <h1>Recuperar Acesso</h1>
          <p>Enviaremos as orientações de redefinição para o seu e-mail</p>
        </div>

        {isSubmitted ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ display: 'inline-flex', padding: '16px', background: 'var(--success-bg)', borderRadius: '50%', color: 'var(--success)', marginBottom: '16px' }}>
              <CheckCircle2 size={40} />
            </div>
            <h3 style={{ marginBottom: '8px' }}>Solicitação Enviada!</h3>
            <p style={{ fontSize: '0.92rem', marginBottom: '24px' }}>
              Se o e-mail <strong>{email}</strong> estiver cadastrado em nossa base, um link seguro para redefinição foi gerado.
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Abra o link do e-mail neste aparelho para criar uma nova senha. Confira também a caixa de spam.
            </p>
            <button
              onClick={onNavigateToLogin}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '16px' }}
            >
              Voltar ao Início de Sessão
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {errorMessage && (
              <div className="alert alert-danger" style={{ fontSize: '0.875rem' }}>
                <ShieldAlert size={18} style={{ flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}
            <div className="form-group">
              <label className="form-label" htmlFor="forgot-email">
                Seu e-mail cadastrado
              </label>
              <input
                id="forgot-email"
                type="email"
                className="form-input"
                placeholder="seu.email@exemplo.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <span className="form-hint">
                Digite o e-mail que você utilizou no cadastro.
              </span>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '12px' }}
              disabled={isLoading}
            >
              <Mail size={18} />
              <span>{isLoading ? 'Enviando...' : 'Enviar link de recuperação'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
