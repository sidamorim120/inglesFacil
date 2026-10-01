// Player de Atividades e Exercícios Interativos - Inglês Fácil
import React, { useState, useEffect, useRef } from 'react';
import { Activity, Question, QuestionSubmission, Attempt } from '../types';
import { AudioService, VoiceRecorder } from '../services/audio/audioService';
import { GradingService, GradingResult } from '../services/grading/gradingService';
import { useAuth } from '../contexts/AuthContext';
import { newId } from '../services/dataService';
import {
  Volume2,
  Mic,
  Square,
  Trash2,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Info,
  Sparkles,
  Trophy,
} from 'lucide-react';

interface ActivityPlayerPageProps {
  activity: Activity;
  onFinishActivity: (attempt: Attempt, activity: Activity) => void;
  onExit: () => void;
}

export const ActivityPlayerPage: React.FC<ActivityPlayerPageProps> = ({
  activity,
  onFinishActivity,
  onExit,
}) => {
  const { user, settings } = useAuth();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userTextAnswer, setUserTextAnswer] = useState('');
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);

  // Áudio e Velocidade
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioSpeed, setAudioSpeed] = useState<number>(settings?.audioSpeed || 1.0);
  const [audioError, setAudioError] = useState<string | null>(null);

  // Gravação de Microfone (Prática Oral)
  const recorderRef = useRef<VoiceRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);

  // Feedback do Passo Atual
  const [feedback, setFeedback] = useState<GradingResult | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Histórico de submissões da tentativa
  const [submissions, setSubmissions] = useState<QuestionSubmission[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  const startTimeRef = useRef<string>(new Date().toISOString());
  const currentQuestion: Question = activity.questions[currentIndex];

  // Inicializa palavras do exercício de ordenação
  useEffect(() => {
    setUserTextAnswer('');
    setSelectedOptionId(null);
    setFeedback(null);
    setIsConfirmed(false);
    setRecordedAudioUrl(null);
    setRecordingError(null);
    setAudioError(null);

    if (currentQuestion.scrambledWords) {
      // Embaralha uma cópia
      const shuffled = [...currentQuestion.scrambledWords].sort(() => Math.random() - 0.5);
      setAvailableWords(shuffled);
      setSelectedWords([]);
    }

    // Auto-play de áudio se configurado e for exercício de escuta
    if (settings?.autoPlayAudio && currentQuestion.audioPhraseEn) {
      handlePlayAudio(1.0);
    }
  }, [currentIndex, currentQuestion]);

  // Reproduz o áudio gravado da frase (public/audio)
  const handlePlayAudio = (speedOverride?: number) => {
    if (!currentQuestion.audioPhraseEn) return;
    const speed = speedOverride !== undefined ? speedOverride : audioSpeed;
    setIsAudioPlaying(true);
    setAudioError(null);

    const success = AudioService.speak(
      currentQuestion.audioPhraseEn,
      speed,
      () => setIsAudioPlaying(false),
      (err) => {
        setIsAudioPlaying(false);
        setAudioError(err);
      }
    );

    if (!success) {
      setIsAudioPlaying(false);
    }
  };

  // Gravação de Voz (Prática Oral sob demanda)
  const handleStartRecording = async () => {
    setRecordingError(null);
    if (!recorderRef.current) {
      recorderRef.current = new VoiceRecorder();
    }

    try {
      await recorderRef.current.start();
      setIsRecording(true);
    } catch (err: unknown) {
      const error = err as Error;
      setRecordingError(error.message || 'Erro ao acessar microfone.');
    }
  };

  const handleStopRecording = async () => {
    if (!recorderRef.current || !isRecording) return;

    try {
      const result = await recorderRef.current.stop();
      setIsRecording(false);
      setRecordedAudioUrl(result.url);
      setUserTextAnswer('[Gravação realizada pelo aluno]');
    } catch (err: unknown) {
      const error = err as Error;
      setIsRecording(false);
      setRecordingError(error.message || 'Erro ao processar gravação.');
    }
  };

  const handleDeleteRecording = () => {
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
      setRecordedAudioUrl(null);
      setUserTextAnswer('');
    }
  };

  // Manipulação de Palavras no Word Reorder
  const handleAddWord = (word: string, indexInAvailable: number) => {
    setSelectedWords([...selectedWords, word]);
    const updated = [...availableWords];
    updated.splice(indexInAvailable, 1);
    setAvailableWords(updated);
  };

  const handleRemoveWord = (word: string, indexInSelected: number) => {
    setAvailableWords([...availableWords, word]);
    const updated = [...selectedWords];
    updated.splice(indexInSelected, 1);
    setSelectedWords(updated);
  };

  // Avaliação e Submissão da Resposta
  const handleConfirmAnswer = () => {
    let finalAnswer = '';

    if (currentQuestion.type === 'listening_choice') {
      const opt = currentQuestion.options?.find((o) => o.id === selectedOptionId);
      finalAnswer = opt?.text || '';
    } else if (currentQuestion.type === 'word_reorder') {
      finalAnswer = selectedWords.join(' ');
    } else if (currentQuestion.type === 'oral_practice') {
      finalAnswer = currentQuestion.expectedAnswer; // Na prática oral com autoavaliação guiada
    } else {
      finalAnswer = userTextAnswer;
    }

    const evaluation = GradingService.evaluate(
      finalAnswer,
      currentQuestion.expectedAnswer,
      currentQuestion.acceptedVariations,
      currentQuestion.type
    );

    // Efeito sonoro sutil
    if (evaluation.isCorrect) {
      AudioService.playSuccessTone();
    } else {
      AudioService.playAttentionTone();
    }

    setFeedback(evaluation);
    setIsConfirmed(true);

    const submission: QuestionSubmission = {
      questionId: currentQuestion.id,
      userAnswer: finalAnswer,
      isCorrect: evaluation.isCorrect,
      explanationPt: currentQuestion.explanationPt,
      expectedAnswer: currentQuestion.expectedAnswer,
      recordedAudioUrl: recordedAudioUrl || undefined,
    };

    setSubmissions([...submissions, submission]);
  };

  // Avançar para próxima questão ou finalizar
  const handleNext = () => {
    if (currentIndex < activity.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Conclui atividade
      const total = activity.questions.length;
      const correct = submissions.filter((s) => s.isCorrect).length;
      const score = total > 0 ? Math.min(100, Math.round((correct / total) * 100)) : 0;

      const attempt: Attempt = {
        id: newId(),
        userId: user?.id || 'demo-user',
        activityId: activity.id,
        activityVersion: activity.version, // Imutabilidade de versão
        activityTitle: activity.title,
        category: activity.category,
        modality: activity.modality,
        score,
        totalQuestions: total,
        correctAnswers: correct,
        startedAt: startTimeRef.current,
        completedAt: new Date().toISOString(),
        submissions,
      };

      setIsCompleted(true);
      onFinishActivity(attempt, activity);
    }
  };

  // Tela Final de Resultados da Atividade
  if (isCompleted) {
    const correctCount = submissions.filter((s) => s.isCorrect).length;
    const score = Math.round((correctCount / activity.questions.length) * 100);

    return (
      <div className="player-container page-wrapper">
        <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div
            style={{
              display: 'inline-flex',
              padding: '20px',
              borderRadius: '50%',
              backgroundColor: score >= 70 ? 'var(--success-bg)' : 'var(--accent-light)',
              color: score >= 70 ? 'var(--success)' : 'var(--accent)',
              marginBottom: '16px',
            }}
          >
            <Trophy size={48} />
          </div>

          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Atividade Concluída!</h1>
          <p style={{ fontSize: '1.1rem', marginBottom: '24px' }}>{activity.title}</p>

          <div
            style={{
              display: 'inline-block',
              background: 'var(--bg-subtle)',
              border: '2px solid var(--border-subtle)',
              padding: '16px 36px',
              borderRadius: 'var(--radius-lg)',
              marginBottom: '28px',
            }}
          >
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Sua Pontuação
            </span>
            <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--primary)' }}>{score}%</div>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              {correctCount} de {activity.questions.length} questões corretas
            </span>
          </div>

          {/* Resumo das Respostas com Explicações Didáticas */}
          <div style={{ textAlign: 'left', marginTop: '16px', marginBottom: '32px' }}>
            <h3 style={{ marginBottom: '14px', fontSize: '1.15rem' }}>Resumo Pedagógico:</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {submissions.map((sub, idx) => {
                const q = activity.questions.find((quest) => quest.id === sub.questionId);
                return (
                  <div
                    key={idx}
                    style={{
                      padding: '14px 18px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: sub.isCorrect ? 'var(--success-bg)' : 'var(--danger-bg)',
                      border: `1px solid ${sub.isCorrect ? 'var(--success-border)' : 'var(--danger-border)'}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, marginBottom: 4 }}>
                      {sub.isCorrect ? <CheckCircle2 size={18} color="var(--success)" /> : <XCircle size={18} color="var(--danger)" />}
                      <span>Questão {idx + 1}: {q?.promptPt}</span>
                    </div>

                    <div style={{ fontSize: '0.9rem', marginTop: 4 }}>
                      <strong>Resposta Esperada:</strong> {sub.expectedAnswer}
                    </div>

                    {q?.explanationPt && (
                      <div style={{ fontSize: '0.85rem', marginTop: 6, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.6)', padding: '6px 10px', borderRadius: '4px' }}>
                        💡 <strong>Dica Didática:</strong> {q.explanationPt}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button onClick={onExit} className="btn btn-primary btn-lg">
              Voltar para Atividades
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render do Exercício Ativo
  return (
    <div className="player-container page-wrapper">
      {/* Cabeçalho do Player */}
      <div className="player-header">
        <button onClick={onExit} className="btn btn-outline btn-sm" aria-label="Sair da atividade">
          <ArrowLeft size={16} />
          <span>Voltar</span>
        </button>

        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Questão {currentIndex + 1} de {activity.questions.length}
          </span>
          <div style={{ width: 140, height: 6, background: 'var(--border-subtle)', borderRadius: 999, overflow: 'hidden', marginTop: 4 }}>
            <div
              style={{
                width: `${((currentIndex + 1) / activity.questions.length) * 100}%`,
                height: '100%',
                background: 'var(--secondary)',
                transition: 'width 0.3s',
              }}
            />
          </div>
        </div>

        <span className="badge badge-primary">
          {activity.category === 'airport' && 'Aeroporto'}
          {activity.category === 'hotel' && 'Hotel'}
          {activity.category === 'restaurant' && 'Restaurante'}
        </span>
      </div>

      {/* Cartão Central da Questão */}
      <div className="player-card">
        {/* Instrução em Português */}
        <h2 style={{ fontSize: '1.25rem', marginBottom: '12px', color: 'var(--text-main)' }}>
          {currentQuestion.promptPt}
        </h2>

        {/* 1. COMPONENTE DE ÁUDIO (SE HOUVER FRASE EM INGLÊS) */}
        {currentQuestion.audioPhraseEn && (
          <div className="audio-controls-panel" aria-label="Controle de áudio em inglês">
            <button
              type="button"
              onClick={() => handlePlayAudio()}
              disabled={isAudioPlaying}
              className="btn btn-primary"
              style={{ minHeight: '52px', padding: '12px 24px' }}
              title="Ouvir frase em velocidade normal"
            >
              <Volume2 size={24} />
              <span>{isAudioPlaying ? 'Ouvindo...' : 'Ouvir Frase em Inglês'}</span>
            </button>

            {/* Controle de Velocidade Pausada (0.75x) */}
            <button
              type="button"
              onClick={() => {
                setAudioSpeed(0.75);
                handlePlayAudio(0.75);
              }}
              disabled={isAudioPlaying}
              className="btn btn-outline btn-sm"
              title="Ouvir em velocidade lenta para iniciantes"
            >
              <span>🐢 Ouvir Devagar (0.75x)</span>
            </button>

            {audioError && (
              <div style={{ width: '100%', textAlign: 'center', fontSize: '0.85rem', color: 'var(--danger)', marginTop: '8px' }}>
                <Info size={14} style={{ display: 'inline', marginRight: 4 }} />
                {audioError} (Texto de apoio: "{currentQuestion.audioPhraseEn}")
              </div>
            )}
          </div>
        )}

        {/* 2. EXERCÍCIO: COMPREENSÃO AUDITIVA (LISTENING CHOICE) */}
        {currentQuestion.type === 'listening_choice' && (
          <div className="options-list">
            {currentQuestion.options?.map((opt, i) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedOptionId(opt.id)}
                disabled={isConfirmed}
                className={`option-button ${selectedOptionId === opt.id ? 'active' : ''}`}
              >
                <span className="option-badge">{String.fromCharCode(65 + i)}</span>
                <span style={{ flex: 1 }}>{opt.text}</span>
              </button>
            ))}
          </div>
        )}

        {/* 3. EXERCÍCIO: DITADO (DICTATION) */}
        {currentQuestion.type === 'dictation' && (
          <div style={{ margin: '20px 0' }}>
            <label htmlFor="dictation-input" className="form-label">
              Digite o que você ouviu em inglês:
            </label>
            <input
              id="dictation-input"
              type="text"
              className="form-input"
              placeholder="Digite a frase escutada..."
              value={userTextAnswer}
              onChange={(e) => setUserTextAnswer(e.target.value)}
              disabled={isConfirmed}
              autoComplete="off"
              autoFocus
            />
          </div>
        )}

        {/* 4. EXERCÍCIO: PRÁTICA ORAL (GRAVAÇÃO DE MICROFONE) */}
        {currentQuestion.type === 'oral_practice' && (
          <div className="voice-recording-box">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Prática Oral Guiada</h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '16px' }}>
              Ouça a frase modelo e grave sua repetição para desenvolver autopercepção da sua fala:
            </p>

            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '16px' }}>
              "{currentQuestion.audioPhraseEn || currentQuestion.expectedAnswer}"
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              {!isRecording ? (
                <button
                  type="button"
                  onClick={handleStartRecording}
                  disabled={isConfirmed}
                  className="btn btn-secondary"
                >
                  <Mic size={20} />
                  <span>Gravar minha voz</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStopRecording}
                  className="btn btn-danger"
                >
                  <span className="pulse-recording" />
                  <Square size={18} />
                  <span>Parar Gravação</span>
                </button>
              )}

              {recordedAudioUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <audio controls src={recordedAudioUrl} style={{ height: '40px' }} />
                  <button
                    type="button"
                    onClick={handleDeleteRecording}
                    disabled={isConfirmed}
                    className="btn btn-outline btn-sm"
                    title="Excluir gravação"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>

            {recordingError && (
              <div style={{ marginTop: '12px', color: 'var(--danger)', fontSize: '0.85rem' }}>
                {recordingError}
              </div>
            )}

            <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '14px', lineHeight: 1.4 }}>
              🔒 <strong>Privacidade:</strong> O microfone só é acionado com seu clique. O áudio fica apenas na memória local do seu dispositivo e pode ser excluído a qualquer momento.
            </div>
          </div>
        )}

        {/* 5. EXERCÍCIO: COMPLETAR LACUNAS (FILL IN THE BLANKS) */}
        {currentQuestion.type === 'fill_in_the_blanks' && (
          <div style={{ margin: '20px 0' }}>
            <label htmlFor="blank-input" className="form-label">
              Digite a palavra que preenche a lacuna:
            </label>
            <input
              id="blank-input"
              type="text"
              className="form-input"
              placeholder="Digite a palavra em inglês..."
              value={userTextAnswer}
              onChange={(e) => setUserTextAnswer(e.target.value)}
              disabled={isConfirmed}
              autoComplete="off"
            />
          </div>
        )}

        {/* 6. EXERCÍCIO: ORGANIZAR PALAVRAS (WORD REORDER) */}
        {currentQuestion.type === 'word_reorder' && (
          <div style={{ margin: '20px 0' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' }}>
              Sua frase montada:
            </div>
            <div className="word-target-zone">
              {selectedWords.length === 0 ? (
                <span style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>
                  Clique nas palavras abaixo para ordenar a frase...
                </span>
              ) : (
                selectedWords.map((word, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => !isConfirmed && handleRemoveWord(word, idx)}
                    className="word-chip selected"
                    disabled={isConfirmed}
                    title="Clique para devolver ao banco"
                  >
                    {word} ✕
                  </button>
                ))
              )}
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Banco de palavras disponíveis:
            </div>
            <div className="word-bank">
              {availableWords.map((word, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => !isConfirmed && handleAddWord(word, idx)}
                  className="word-chip"
                  disabled={isConfirmed}
                >
                  {word}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 7. EXERCÍCIO: TRADUÇÃO (TRANSLATION) */}
        {currentQuestion.type === 'translation' && (
          <div style={{ margin: '20px 0' }}>
            <label htmlFor="translation-input" className="form-label">
              Tradução em inglês:
            </label>
            <input
              id="translation-input"
              type="text"
              className="form-input"
              placeholder="Digite sua tradução em inglês..."
              value={userTextAnswer}
              onChange={(e) => setUserTextAnswer(e.target.value)}
              disabled={isConfirmed}
              autoComplete="off"
            />
          </div>
        )}

        {/* 8. EXERCÍCIO: RESPOSTA SITUACIONAL (SITUATIONAL RESPONSE) */}
        {currentQuestion.type === 'situational_response' && (
          <div style={{ margin: '20px 0' }}>
            <label htmlFor="situational-input" className="form-label">
              Como você responderia em inglês?
            </label>
            <input
              id="situational-input"
              type="text"
              className="form-input"
              placeholder="Ex: A coffee with milk, please..."
              value={userTextAnswer}
              onChange={(e) => setUserTextAnswer(e.target.value)}
              disabled={isConfirmed}
              autoComplete="off"
            />
            <span className="form-hint">
              Variações comuns e formas educadas do dia a dia são aceitas.
            </span>
          </div>
        )}

        {/* FEEDBACK IMEDIATO APÓS CONFIRMAÇÃO */}
        {feedback && (
          <div
            className={`feedback-box ${feedback.isCorrect ? 'feedback-success' : 'feedback-correction'}`}
            role="status"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '1.05rem' }}>
              {feedback.isCorrect ? (
                <>
                  <CheckCircle2 size={22} color="var(--success)" />
                  <span>Muito Bem!</span>
                </>
              ) : (
                <>
                  <XCircle size={22} color="var(--danger)" />
                  <span>Atenção:</span>
                </>
              )}
            </div>

            <p style={{ marginTop: '6px', fontSize: '0.95rem' }}>{feedback.feedbackText}</p>

            <div className="explanation-card">
              <div>
                <strong>Resposta Esperada:</strong> {feedback.expectedAnswer}
              </div>
              {currentQuestion.explanationPt && (
                <div style={{ marginTop: '6px', color: 'var(--text-muted)' }}>
                  💡 {currentQuestion.explanationPt}
                </div>
              )}
            </div>
          </div>
        )}

        {/* BOTÃO PRINCIPAL DE AÇÃO */}
        <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'flex-end' }}>
          {!isConfirmed ? (
            <button
              type="button"
              onClick={handleConfirmAnswer}
              disabled={
                (currentQuestion.type === 'listening_choice' && !selectedOptionId) ||
                (currentQuestion.type === 'word_reorder' && selectedWords.length === 0) ||
                ((currentQuestion.type === 'dictation' || currentQuestion.type === 'translation' || currentQuestion.type === 'fill_in_the_blanks' || currentQuestion.type === 'situational_response') && !userTextAnswer.trim()) ||
                (currentQuestion.type === 'oral_practice' && !recordedAudioUrl)
              }
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
            >
              <span>Verificar Resposta</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="btn btn-secondary btn-lg"
              style={{ width: '100%' }}
            >
              <span>{currentIndex < activity.questions.length - 1 ? 'Próxima Questão' : 'Ver Resultado Final'}</span>
              <ArrowRight size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
