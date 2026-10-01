// Tela de Recuperação de Acesso - Inglês Fácil
import React, { useState } from 'react';
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';

interface ForgotPasswordPageProps {
  onNavigateToLogin: () => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigateToLogin }) => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setIsSubmitted(true);
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
            <div className="alert alert-info" style={{ fontSize: '0.8125rem', textAlign: 'left' }}>
              <strong>Nota do Sistema:</strong> No ambiente de produção com backend e serviço de e-mail conectado (ex: Resend, Sendgrid ou Supabase Auth), um token criptográfico de uso único com expiração em 15 minutos é despachado.
            </div>
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
            >
              <Mail size={18} />
              <span>Enviar link de recuperação</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
