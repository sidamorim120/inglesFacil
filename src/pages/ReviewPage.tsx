// Tela de Revisão Espaçada (1, 3 e 7 dias) - Inglês Fácil
import React, { useState } from 'react';
import { categoryInfo } from '../services/categories';
import { ReviewItem } from '../types';
import { DataService } from '../services/dataService';
import { AudioService } from '../services/audio/audioService';
import { GradingService } from '../services/grading/gradingService';
import {
  RotateCcw,
  Volume2,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
  Play,
  X,
} from 'lucide-react';

interface ReviewPageProps {
  reviewItems: ReviewItem[];
  onRefreshReviews: () => void;
}

export const ReviewPage: React.FC<ReviewPageProps> = ({ reviewItems, onRefreshReviews }) => {
  const [activeReviewItem, setActiveReviewItem] = useState<ReviewItem | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);
  const [filterMode, setFilterMode] = useState<'today' | 'all'>('today');

  const nowIso = new Date().toISOString();
  const todayReviews = reviewItems.filter((item) => item.nextReviewDate <= nowIso);
  const displayedItems = filterMode === 'today' ? todayReviews : reviewItems;

  const handleStartReview = (item: ReviewItem) => {
    setActiveReviewItem(item);
    setUserAnswer('');
    setFeedback(null);
  };

  const handlePlayAudio = (phrase: string) => {
    AudioService.speak(phrase, 1.0);
  };

  const handleVerify = async () => {
    if (!activeReviewItem) return;

    const evalResult = GradingService.evaluate(
      userAnswer,
      activeReviewItem.phraseEn,
      [],
      'dictation'
    );

    if (evalResult.isCorrect) {
      AudioService.playSuccessTone();
      setFeedback({
        isCorrect: true,
        text: 'Excelente! Você acertou e a próxima revisão será espaçada com intervalo maior.',
      });
    } else {
      AudioService.playAttentionTone();
      setFeedback({
        isCorrect: false,
        text: 'Não se preocupe! Essa frase retornará em 1 dia para fixação da memória.',
      });
    }

    // Processa repetição espaçada (1 -> 3 -> 7 dias ou volta para 1)
    const res = await DataService.processReviewAnswer(activeReviewItem, evalResult.isCorrect);
    if (!res.success) {
      setFeedback({ isCorrect: false, text: `Não foi possível salvar sua revisão: ${res.error}` });
      return;
    }
    onRefreshReviews();
  };

  const handleCloseModal = () => {
    setActiveReviewItem(null);
    setUserAnswer('');
    setFeedback(null);
  };

  return (
    <div className="page-wrapper">
      <header style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.85rem', marginBottom: '6px' }}>Revisão de Conteúdo</h1>
        <p style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
          Fortaleça sua memória de longo prazo revisitando frases onde você teve dificuldade.
        </p>
      </header>

      {/* Caixa didática sobre repetição espaçada */}
      <div className="card" style={{ background: 'var(--primary-light)', border: '1px solid var(--primary-border)', marginBottom: '24px', padding: '18px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, color: 'var(--primary)', marginBottom: 6 }}>
          <Sparkles size={20} />
          <span>Como funciona a Repetição Espaçada?</span>
        </div>
        <p style={{ fontSize: '0.9rem', color: '#1e3a8a', lineHeight: 1.5 }}>
          Erros comuns são revisitados inicialmente em intervalos de <strong>1 dia</strong>, <strong>3 dias</strong> e <strong>7 dias</strong>. Praticar novamente não apaga suas notas anteriores, permitindo acompanhar sua evolução real sem perder o histórico.
        </p>
      </div>

      {/* Filtros da Lista de Revisão */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={() => setFilterMode('today')}
          className={`btn btn-sm ${filterMode === 'today' ? 'btn-primary' : 'btn-outline'}`}
        >
          <span>Para Revisar Hoje ({todayReviews.length})</span>
        </button>
        <button
          onClick={() => setFilterMode('all')}
          className={`btn btn-sm ${filterMode === 'all' ? 'btn-primary' : 'btn-outline'}`}
        >
          <span>Todas as Frases Salvas ({reviewItems.length})</span>
        </button>
      </div>

      {/* Lista de Itens para Revisão */}
      {displayedItems.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <CheckCircle2 size={48} color="var(--success)" style={{ margin: '0 auto 16px' }} />
          <h3>Nenhuma revisão pendente para agora!</h3>
          <p style={{ marginTop: '8px' }}>
            {filterMode === 'today'
              ? 'Você está em dia com todas as suas revisões programadas.'
              : 'Você ainda não possui frases na fila de revisão. Pratique novas atividades!'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {displayedItems.map((item) => {
            const isDueToday = item.nextReviewDate <= nowIso;

            return (
              <div
                key={item.id}
                className="card"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '14px',
                  padding: '18px 22px',
                  borderLeft: isDueToday ? '4px solid var(--accent)' : '4px solid var(--border-subtle)',
                }}
              >
                <div style={{ flex: '1 1 300px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span className="badge badge-primary">{categoryInfo(item.category).label}</span>
                    <span className="badge badge-warning">Intervalo: {item.intervalDays} dia(s)</span>
                    {isDueToday && (
                      <span className="badge badge-success">
                        <Clock size={12} /> Pronto para hoje
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '6px' }}>
                    "{item.phraseEn}"
                  </div>
                  <div style={{ fontSize: '0.92rem', color: 'var(--text-muted)' }}>
                    Contexto: {item.translationPt}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => handlePlayAudio(item.phraseEn)}
                    className="btn btn-outline btn-sm"
                    title="Ouvir pronúncia"
                  >
                    <Volume2 size={16} />
                  </button>

                  <button
                    onClick={() => handleStartReview(item)}
                    className="btn btn-primary btn-sm"
                  >
                    <RotateCcw size={16} />
                    <span>Praticar Frase</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Prática de Revisão Rápida */}
      {activeReviewItem && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Praticar Revisão</h3>
              <button onClick={handleCloseModal} className="btn-outline btn-sm" style={{ border: 'none' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Tradução / Contexto: <strong>{activeReviewItem.translationPt}</strong>
            </p>

            <div style={{ marginBottom: '18px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => handlePlayAudio(activeReviewItem.phraseEn)}
                className="btn btn-outline"
                style={{ width: '100%' }}
              >
                <Volume2 size={20} />
                <span>Ouvir Frase em Inglês</span>
              </button>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="review-input">
                Escreva a frase em inglês:
              </label>
              <input
                id="review-input"
                type="text"
                className="form-input"
                placeholder="Digite a frase correspondente..."
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                disabled={!!feedback}
                autoFocus
              />
            </div>

            {feedback && (
              <div
                className={`feedback-box ${feedback.isCorrect ? 'feedback-success' : 'feedback-correction'}`}
                style={{ marginTop: '12px' }}
              >
                <div style={{ fontWeight: 700, marginBottom: '4px' }}>
                  {feedback.isCorrect ? 'Correto!' : 'Resposta Correta:'}
                </div>
                <div>{activeReviewItem.phraseEn}</div>
                <p style={{ fontSize: '0.85rem', marginTop: '6px' }}>{feedback.text}</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px', justifyContent: 'flex-end' }}>
              {!feedback ? (
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={!userAnswer.trim()}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  Confirmar Resposta
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  Concluir e Fechar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
