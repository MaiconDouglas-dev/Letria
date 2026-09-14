import { createAudioPlayer, setAudioModeAsync, type AudioPlayer, type AudioSource, type AudioStatus } from 'expo-audio';
import * as Speech from 'expo-speech';

import { AUDIO_MANIFEST } from '../../generated/audioManifest';
import { audioText } from '../content/loader';

type FinishCallback = (tag?: string) => void;

/**
 * Controlador central de áudio do app (seção 6 da especificação):
 * - nunca sobrepõe falas: speak() cancela o que estiver tocando;
 * - replay() repete a última fala;
 * - stop() ao trocar de tela libera o player;
 * - enabled=false silencia tudo sem perder o contexto;
 * - rate < 1 = "fala devagar" (ajuste de ritmo, pref do usuário).
 *
 * Fallback de voz: o caminho principal é sempre o asset gravado.
 * Se a chave não existir no manifesto ou o player falhar, fala o texto
 * via TTS do aparelho (expo-speech, pt-BR) — o app nunca fica mudo por
 * falta de arquivo. TTS não substitui a narração gravada por padrão
 * (especificação, seção 6): é só rede de segurança.
 *
 * Somente reprodução/síntese: nenhuma permissão de gravação é usada.
 */
export class AudioController {
  private player: AudioPlayer | null = null;
  private lastSource: AudioSource | null = null;
  private lastTag: string | undefined;
  private lastText: string | undefined;
  private speakingTts = false;
  private enabled = true;
  private rate = 1;
  private selectedVoice?: string;
  private finishListeners = new Set<FinishCallback>();

  async configure(): Promise<void> {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: 'doNotMix',
    });

    try {
      const voices = await Speech.getAvailableVoicesAsync();
      const ptVoices = voices.filter(
        (v) =>
          v.language &&
          (v.language.toLowerCase().includes('pt-br') ||
            v.language.toLowerCase().includes('pt_br'))
      );
      // Prioritize Enhanced quality, neural or natural network voices for pt-BR
      const bestVoice =
        ptVoices.find((v) => v.quality === Speech.VoiceQuality.Enhanced) ??
        ptVoices.find(
          (v) =>
            /neural|natural|network/i.test(v.identifier) ||
            /neural|natural|network/i.test(v.name)
        ) ??
        ptVoices[0];

      if (bestVoice) {
        this.selectedVoice = bestVoice.identifier;
      }
    } catch {
      // Continues with platform default if voice enumeration fails
    }
  }

  /**
   * Fala uma chave de áudio do conteúdo (ex.: 'ui/correto', 'lesson-01/intro').
   * Resolve o asset no manifesto; se ausente, cai no TTS com o texto da chave.
   */
  speakKey(key: string | undefined): void {
    if (!key) return;
    this.speak(AUDIO_MANIFEST[key] ?? null, key, audioText(key));
  }

  /**
   * Fala uma frase arbitrária (do Banco de Frases ou dinâmica) via síntese de voz nativa pt-BR.
   * Cancela qualquer áudio anterior e respeita a velocidade configurada.
   */
  speakPhrase(text: string, tag?: string): void {
    if (!text) return;
    this.speak(null, tag, text);
  }

  /** Toca um asset de áudio, cancelando qualquer fala em andamento. */
  speak(source: AudioSource | null | undefined, tag?: string, fallbackText?: string): void {
    this.stopPlayer();
    Speech.stop();
    this.speakingTts = false;
    if (!this.enabled) return;

    this.lastSource = source ?? null;
    this.lastTag = tag;
    this.lastText = fallbackText;

    if (source != null) {
      try {
        const tagAtPlay = tag;
        this.player = createAudioPlayer(source);
        if (this.rate !== 1) this.player.setPlaybackRate(this.rate, 'high');
        this.player.addListener('playbackStatusUpdate', (s: AudioStatus) => {
          if (s.didJustFinish) this.finishListeners.forEach((cb) => cb(tagAtPlay));
        });
        this.player.play();
        return;
      } catch {
        // player falhou ao criar — cai no TTS abaixo
      }
    }
    if (fallbackText) this.speakTts(fallbackText, tag);
  }

  /** Repete a última fala — botão "ouvir de novo" sempre disponível. */
  replay(): void {
    if (this.lastSource != null || this.lastText != null) {
      this.speak(this.lastSource, this.lastTag, this.lastText);
    }
  }

  /** Para e libera o player atual (troca de tela, pausa, interrupção). */
  stop(): void {
    this.stopPlayer();
    Speech.stop();
    this.speakingTts = false;
    this.lastSource = null;
    this.lastTag = undefined;
    this.lastText = undefined;
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    if (!on) {
      this.stopPlayer();
      Speech.stop();
      this.speakingTts = false;
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /** Ritmo de fala: 1 = normal, 0.8 = devagar (player: 0.5–2.0; TTS: aprox.). */
  setRate(rate: number): void {
    this.rate = Math.min(1, Math.max(0.5, rate));
  }

  getRate(): number {
    return this.rate;
  }

  /** Registra callback para quando uma fala termina; recebe a tag passada a speak(). */
  onFinish(cb: FinishCallback): () => void {
    this.finishListeners.add(cb);
    return () => this.finishListeners.delete(cb);
  }

  private speakTts(text: string, tag?: string): void {
    this.speakingTts = true;
    // Calibrated natural rate: 0.92 delivers clearer articulation and a warmer, less rushed tone
    const naturalRate = Math.min(1.0, Math.max(0.6, this.rate * 0.92));
    Speech.speak(text, {
      language: 'pt-BR',
      voice: this.selectedVoice,
      rate: naturalRate,
      pitch: 1.0,
      onDone: () => {
        this.speakingTts = false;
        this.finishListeners.forEach((cb) => cb(tag));
      },
      onStopped: () => {
        this.speakingTts = false;
      },
      onError: () => {
        this.speakingTts = false;
      },
    });
  }

  private stopPlayer(): void {
    try {
      this.player?.pause();
      this.player?.release();
    } catch {
      // player já liberado — ignorar
    }
    this.player = null;
  }
}
