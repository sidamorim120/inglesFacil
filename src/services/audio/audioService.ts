// Serviço de Áudio e Síntese de Voz - Inglês Fácil
// Isolado para facilitar futura conexão com serviços externos (ElevenLabs, Azure Speech, etc.)

export interface AudioSupportStatus {
  hasSpeechSynthesis: boolean;
  hasSpeechRecognition: boolean;
  hasMediaRecorder: boolean;
  englishVoicesCount: number;
}

export class AudioService {
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static audioContext: AudioContext | null = null;

  /**
   * Verifica suporte do navegador para os recursos de áudio
   */
  public static checkSupport(): AudioSupportStatus {
    const hasSpeechSynthesis = typeof window !== 'undefined' && 'speechSynthesis' in window;
    const hasSpeechRecognition =
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
    const hasMediaRecorder =
      typeof window !== 'undefined' &&
      'mediaDevices' in navigator &&
      'MediaRecorder' in window;

    return {
      hasSpeechSynthesis,
      hasSpeechRecognition,
      hasMediaRecorder,
      englishVoicesCount: this.getEnglishVoices().length,
    };
  }

  /**
   * Obtém vozes em inglês disponíveis no navegador
   */
  public static getEnglishVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    const voices = this.synth.getVoices();
    return voices.filter(
      (v) => v.lang.startsWith('en-') || v.lang === 'en_US' || v.lang === 'en_GB'
    );
  }

  /**
   * Reproduz uma frase em inglês com taxa de velocidade controlada
   * @param text Frase a ser falada
   * @param rate Velocidade de fala (1.0 = normal, 0.75 = pausado para iniciantes)
   * @param onEnd Callback de conclusão
   * @param onError Callback de erro/ausência
   */
  public static speak(
    text: string,
    rate: number = 1.0,
    onEnd?: () => void,
    onError?: (errorText: string) => void
  ): boolean {
    if (!this.synth) {
      if (onError) onError('Síntese de voz não suportada neste navegador.');
      return false;
    }

    try {
      // Cancela fala anterior se estiver em andamento
      this.synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = Math.max(0.5, Math.min(rate, 1.2));
      utterance.lang = 'en-US';

      const voices = this.getEnglishVoices();
      if (voices.length > 0) {
        // Prioriza vozes naturais como Samantha, Alex, Google US English ou a primeira em inglês
        const preferred = voices.find(
          (v) =>
            v.name.includes('Natural') ||
            v.name.includes('Google') ||
            v.name.includes('Samantha') ||
            v.name.includes('United States')
        );
        utterance.voice = preferred || voices[0];
      }

      utterance.onend = () => {
        if (onEnd) onEnd();
      };

      utterance.onerror = (event) => {
        console.warn('Erro na síntese de voz:', event);
        if (onError) onError('Falha ao reproduzir áudio. Verifique as permissões de som.');
      };

      this.synth.speak(utterance);
      return true;
    } catch (err) {
      console.error('Exceção ao sintetizar fala:', err);
      if (onError) onError('Ocorreu um erro no sintetizador de voz.');
      return false;
    }
  }

  /**
   * Interrompe qualquer reprodução de áudio em andamento
   */
  public static stop(): void {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  /**
   * Gera um som de feedback positivo suave usando Web Audio API local
   */
  public static playSuccessTone(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.12); // E5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.25); // G5

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.36);
    } catch {
      // Silencioso se bloqueado
    }
  }

  /**
   * Gera um som discreto de atenção/revisão
   */
  public static playAttentionTone(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(349.23, ctx.currentTime); // F4
      osc.frequency.setValueAtTime(293.66, ctx.currentTime + 0.15); // D4

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.31);
    } catch {
      // Silencioso se bloqueado
    }
  }

  private static getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      }
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }
}

/**
 * Gerenciador de Gravação de Microfone
 * Não armazena gravações no servidor por padrão.
 * Solicita microfone apenas quando o usuário clica para gravar.
 */
export class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private mediaStream: MediaStream | null = null;

  public async start(): Promise<void> {
    this.audioChunks = [];

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Navegador não suporta captura de microfone.');
    }

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(this.mediaStream);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start();
    } catch (error: unknown) {
      const err = error as { name?: string };
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        throw new Error('Permissão do microfone negada. Permita o acesso nas configurações do navegador.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        throw new Error('Nenhum microfone encontrado neste dispositivo.');
      } else {
        throw new Error('Não foi possível iniciar o microfone.');
      }
    }
  }

  public stop(): Promise<{ blob: Blob; url: string }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('Nenhuma gravação em andamento.'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);

        // Desliga os canais do microfone imediatamente para liberar o dispositivo
        if (this.mediaStream) {
          this.mediaStream.getTracks().forEach((track) => track.stop());
          this.mediaStream = null;
        }

        resolve({ blob: audioBlob, url: audioUrl });
      };

      this.mediaRecorder.stop();
    });
  }

  public cancel(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch {
        // Ignora erro ao cancelar
      }
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    this.audioChunks = [];
  }
}
