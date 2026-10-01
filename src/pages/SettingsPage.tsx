// Tela de Configurações - Inglês Fácil
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AudioService } from '../services/audio/audioService';
import {
  Settings,
  Bell,
  Volume2,
  Clock,
  Globe,
  Save,
  CheckCircle2,
  AlertCircle,
  Play,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, settings, updateSettings, updateName, isSupabaseMode } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(settings?.dailyGoalMinutes || 10);
  const [audioSpeed, setAudioSpeed] = useState(settings?.audioSpeed || 1.0);
  const [autoPlayAudio, setAutoPlayAudio] = useState(settings?.autoPlayAudio ?? true);

  // Lembretes
  const [remindersEnabled, setRemindersEnabled] = useState(settings?.reminders.enabled ?? true);
  const [reminderTime, setReminderTime] = useState(settings?.reminders.time || '19:30');
  const [selectedDays, setSelectedDays] = useState<number[]>(settings?.reminders.daysOfWeek || [1, 2, 3, 4, 5]);
  const [timezone, setTimezone] = useState(settings?.reminders.timezone || 'America/Sao_Paulo');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Configurações chegam do banco depois da primeira renderização
  useEffect(() => {
    if (!settings) return;
    setDailyGoalMinutes(settings.dailyGoalMinutes);
    setAudioSpeed(settings.audioSpeed);
    setAutoPlayAudio(settings.autoPlayAudio);
    setRemindersEnabled(settings.reminders.enabled);
    setReminderTime(settings.reminders.time);
    setSelectedDays(settings.reminders.daysOfWeek);
    setTimezone(settings.reminders.timezone);
  }, [settings]);
  const [testSpeechPlaying, setTestSpeechPlaying] = useState(false);

  const daysOfWeekLabels = [
    { day: 0, label: 'Dom' },
    { day: 1, label: 'Seg' },
    { day: 2, label: 'Ter' },
    { day: 3, label: 'Qua' },
    { day: 4, label: 'Qui' },
    { day: 5, label: 'Sex' },
    { day: 6, label: 'Sáb' },
  ];

  const handleToggleDay = (dayIndex: number) => {
    if (selectedDays.includes(dayIndex)) {
      setSelectedDays(selectedDays.filter((d) => d !== dayIndex));
    } else {
      setSelectedDays([...selectedDays, dayIndex].sort());
    }
  };

  const handleTestAudio = () => {
    setTestSpeechPlaying(true);
    AudioService.speak(
      'Hello! Welcome to your daily English practice session.',
      audioSpeed,
      () => setTestSpeechPlaying(false),
      () => setTestSpeechPlaying(false)
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaveError(null);
    setIsSaving(true);

    const trimmedName = name.trim();
    if (isSupabaseMode && trimmedName && trimmedName !== user.name) {
      const nameRes = await updateName(trimmedName);
      if (!nameRes.success) {
        setIsSaving(false);
        setSaveError(nameRes.error || 'Não foi possível atualizar o nome.');
        return;
      }
    }

    const res = await updateSettings({
      userId: user.id,
      dailyGoalMinutes,
      audioSpeed,
      autoPlayAudio,
      reminders: {
        enabled: remindersEnabled,
        time: reminderTime,
        daysOfWeek: selectedDays,
        timezone,
      },
    });
    setIsSaving(false);

    if (!res.success) {
      setSaveError(res.error || 'Não foi possível salvar as configurações.');
      return;
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="page-wrapper">
      <header style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.85rem', marginBottom: '6px' }}>Configurações</h1>
        <p style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
          Ajuste sua rotina de estudos, lembretes e preferências de áudio.
        </p>
      </header>

      {saveError && (
        <div className="alert alert-danger" style={{ marginBottom: '24px' }}>
          <AlertCircle size={20} />
          <span>{saveError}</span>
        </div>
      )}

      {savedSuccess && (
        <div className="alert alert-success" style={{ marginBottom: '24px' }}>
          <CheckCircle2 size={20} />
          <span>Configurações atualizadas com sucesso!</span>
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Dados do Perfil */}
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Perfil do Estudante</h2>

          <div className="form-group">
            <label className="form-label" htmlFor="settings-name">Nome de Exibição</label>
            <input
              id="settings-name"
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isSupabaseMode}
              maxLength={80}
            />
            <span className="form-hint">E-mail associado: {user?.email}</span>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="settings-goal">
              Meta Diária de Prática (5 a 10 minutos recomendados)
            </label>
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
              {[5, 7, 10, 15].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDailyGoalMinutes(mins)}
                  className={`btn ${dailyGoalMinutes === mins ? 'btn-primary' : 'btn-outline'} btn-sm`}
                >
                  {mins} minutos / dia
                </button>
              ))}
            </div>
            <span className="form-hint" style={{ marginTop: '6px', display: 'block' }}>
              Estudos científicos apontam que 5 a 10 minutos com foco todos os dias geram maior retenção que aulas longas e esparsas.
            </span>
          </div>
        </div>

        {/* Lembretes e Rotina */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bell size={20} color="var(--primary)" />
              Lembretes e Rotina
            </h2>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={remindersEnabled}
                onChange={(e) => setRemindersEnabled(e.target.checked)}
                style={{ width: 18, height: 18 }}
              />
              <span>Ativar Lembretes</span>
            </label>
          </div>

          {remindersEnabled && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="reminder-time">
                  Horário do Lembrete Diário
                </label>
                <input
                  id="reminder-time"
                  type="time"
                  className="form-input"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  style={{ maxWidth: '200px' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Dias da Semana</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {daysOfWeekLabels.map(({ day, label }) => {
                    const isSelected = selectedDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleToggleDay(day)}
                        className={`btn ${isSelected ? 'btn-secondary' : 'btn-outline'} btn-sm`}
                        style={{ minWidth: '44px' }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="settings-tz">
                  Fuso Horário
                </label>
                <select
                  id="settings-tz"
                  className="form-select"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  style={{ maxWidth: '360px' }}
                >
                  <option value="America/Sao_Paulo">Brasília / São Paulo (GMT-3)</option>
                  <option value="America/Manaus">Manaus / Amazonas (GMT-4)</option>
                  <option value="America/Belem">Belém / Pará (GMT-3)</option>
                  <option value="America/Cuiaba">Cuiabá / MT (GMT-4)</option>
                  <option value="America/Rio_Branco">Rio Branco / Acre (GMT-5)</option>
                  <option value="America/Noronha">Fernando de Noronha (GMT-2)</option>
                  <option value="Europe/Lisbon">Lisboa / Portugal (GMT+1)</option>
                  <option value="America/New_York">Nova York / EUA (GMT-4)</option>
                </select>
                <span className="form-hint" style={{ marginTop: '6px', display: 'block' }}>
                  Respeitamos o fuso local para exibir lembretes na hora exata da sua rotina.
                </span>
              </div>
            </div>
          )}

          {/* Nota Técnica e Transparente sobre Notificações Externas */}
          <div className="alert alert-info" style={{ marginTop: '20px', fontSize: '0.85rem' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <div>
              <strong>Lembrete no Aplicativo:</strong> Inicialmente o lembrete atua dentro do aplicativo. Notificações com o aplicativo fechado exigem infraestrutura com Service Worker e Web Push Notifications habilitados em servidor de mensageria com autorização explícita do navegador.
            </div>
          </div>
        </div>

        {/* Preferências de Áudio e Síntese de Voz */}
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Volume2 size={20} color="var(--secondary)" />
            Preferências de Áudio
          </h2>

          <div className="form-group">
            <label className="form-label">Velocidade Padrão da Voz</label>
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setAudioSpeed(1.0)}
                className={`btn ${audioSpeed === 1.0 ? 'btn-primary' : 'btn-outline'} btn-sm`}
              >
                Normal (1.0x)
              </button>
              <button
                type="button"
                onClick={() => setAudioSpeed(0.75)}
                className={`btn ${audioSpeed === 0.75 ? 'btn-primary' : 'btn-outline'} btn-sm`}
              >
                Pausada / Iniciante (0.75x)
              </button>
            </div>
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 500 }}>
              <input
                type="checkbox"
                checked={autoPlayAudio}
                onChange={(e) => setAutoPlayAudio(e.target.checked)}
                style={{ width: 18, height: 18 }}
              />
              <span>Tocar áudio automaticamente ao abrir uma questão auditiva</span>
            </label>
          </div>

          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              onClick={handleTestAudio}
              disabled={testSpeechPlaying}
              className="btn btn-outline btn-sm"
            >
              <Play size={16} />
              <span>{testSpeechPlaying ? 'Reproduzindo teste...' : 'Testar Voz do Sintetizador do Navegador'}</span>
            </button>
          </div>
        </div>

        {/* Botão Salvar */}
        <div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ minWidth: '220px' }} disabled={isSaving}>
            <Save size={20} />
            <span>{isSaving ? 'Salvando...' : 'Salvar Preferências'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
