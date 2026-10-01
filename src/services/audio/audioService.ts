// Serviço de Áudio - Inglês Fácil
// As frases em inglês tocam a partir de MP3s com voz neural, gerados por scripts/generate-audio.mjs
// (public/audio/manifest.json). A voz sintética do navegador não é usada.

export interface AudioSupportStatus {
  hasSpeechRecognition: boolean;
  hasMediaRecorder: boolean;
}

interface AudioManifest {
  voice: string;
  phrases: Record<string, { normal: string; slow: string }>;
}

// Abaixo desta velocidade usa o arquivo gravado devagar (soa mais natural que acelerar/desacelerar)
const SLOW_FILE_THRESHOLD = 0.85;

export class AudioService {
  private static audioContext: AudioContext | null = null;
  private static manifestPromise: Promise<AudioManifest | null> | null = null;
  private static current: HTMLAudioElement | null = null;

  /**
   * Verifica suporte do navegador para os recursos de áudio
   */
  public static checkSupport(): AudioSupportStatus {
    const hasSpeechRecognition =
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
    const hasMediaRecorder =
      typeof window !== 'undefined' &&
      'mediaDevices' in navigator &&
      'MediaRecorder' in window;

    return { hasSpeechRecognition, hasMediaRecorder };
  }

  private static loadManifest(): Promise<AudioManifest | null> {
    if (!this.manifestPromise) {
      this.manifestPromise = fetch(`${import.meta.env.BASE_URL}audio/manifest.json`)
        .then((res) => (res.ok ? (res.json() as Promise<AudioManifest>) : null))
        .catch(() => null);
    }
    return this.manifestPromise;
  }

  /**
   * Indica se a frase tem áudio gravado disponível
   */
  public static async hasAudio(text: string): Promise<boolean> {
    const manifest = await this.loadManifest();
    return Boolean(manifest?.phrases[text.trim()]);
  }

  /**
   * Reproduz uma frase em inglês com taxa de velocidade controlada
   * @param text Frase a ser falada
   * @param rate Velocidade (1.0 = normal, 0.75 = pausado para iniciantes)
   * @param onEnd Callback de conclusão
   * @param onError Callback de erro/ausência
   */
  public static speak(
    text: string,
    rate: number = 1.0,
    onEnd?: () => void,
    onError?: (errorText: string) => void
  ): boolean {
    this.stop();

    this.loadManifest().then((manifest) => {
      const entry = manifest?.phrases[text.trim()];
      if (!entry) {
        onError?.('Áudio ainda não disponível para esta frase.');
        return;
      }

      const useSlowFile = rate < SLOW_FILE_THRESHOLD;
      const audio = new Audio(`${import.meta.env.BASE_URL}${useSlowFile ? entry.slow : entry.normal}`);
      audio.playbackRate = useSlowFile ? 1.0 : Math.max(0.85, Math.min(rate, 1.5));
      audio.preservesPitch = true;
      audio.onended = () => {
        if (this.current === audio) this.current = null;
        onEnd?.();
      };
      audio.onerror = () => {
        if (this.current === audio) this.current = null;
        onError?.('Falha ao carregar o áudio. Verifique sua conexão.');
      };
      this.current = audio;
      audio.play().catch(() => {
        if (this.current === audio) this.current = null;
        onError?.('Não foi possível tocar o áudio. Verifique se o som do aparelho está ligado.');
      });
    });

    return true;
  }

  /**
   * Interrompe qualquer reprodução de áudio em andamento
   */
  public static stop(): void {
    if (this.current) {
      this.current.pause();
      this.current = null;
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

// Carrega o índice de áudios cedo para o primeiro toque responder imediatamente (importante no iOS)
if (typeof window !== 'undefined') {
  void AudioService.hasAudio('');
}
