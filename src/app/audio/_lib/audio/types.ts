/**
 * Word timing marker for audio synchronization
 */
export interface AudioMark {
  time: number;
  type: "word";
  start: number;
  end: number;
  value: string;
}

/**
 * Result from speech synthesis
 */
export interface SynthesisResult {
  /** Output filename if saved to storage */
  output_file?: string;
  /** Base64 encoded audio content if not saved to file */
  content?: string;
  /** Word timing markers for audio synchronization */
  marks?: AudioMark[];
  /** Timepoints (used by Google TTS) */
  timepoints?: Array<{ markName: string; timeSeconds: number }>;
  /** Engine name that produced this result */
  engine?: string;
}

/**
 * Voice information returned by getVoices
 */
export interface Voice {
  /** ISO language code (e.g., "en", "es") */
  language: string;
  /** Full locale code (e.g., "en-US", "es-ES") */
  locale: string;
  /** Voice identifier/name */
  name: string;
  /** Voice gender */
  gender: "MALE" | "FEMALE";
  /** Voice type */
  type: "NEURAL" | "NORMAL";
  /** TTS service provider name */
  service: string;
}

/**
 * TTS Engine interface - all engines must implement this
 */
export interface TTSEngine {
  /** Engine identifier */
  name: string;
  /** Synthesize speech from text */
  synthesizeSpeech: (
    filename: string | undefined,
    voice_id: string,
    text: string,
  ) => Promise<SynthesisResult>;
  /** Get available voices */
  getVoices: () => Promise<Voice[]>;
  /** Check if a voice ID is valid for this engine */
  isValidVoice: (voice: string) => Promise<boolean> | boolean;
}

/**
 * ElevenLabs specific - extends TTSEngine with user info
 */
export interface ElevenLabsEngine extends TTSEngine {
  getUserInfo: () => Promise<ElevenLabsSubscription>;
}

/**
 * ElevenLabs subscription info
 */
export interface ElevenLabsSubscription {
  tier: string;
  character_count: number;
  character_limit: number;
  can_extend_character_limit: boolean;
  allowed_to_extend_character_limit: boolean;
  next_character_count_reset_unix: number;
  voice_limit: number;
  max_voice_add_edits: number;
  voice_add_edit_counter: number;
  professional_voice_limit: number;
  can_use_instant_voice_cloning: boolean;
  can_use_professional_voice_cloning: boolean;
  status: string;
}

/**
 * Speaker/voice data from database
 */
export interface SpeakerData {
  id: number;
  speaker: string;
  type: "NEURAL" | "NORMAL";
  language?: string;
  locale?: string;
  gender?: string;
  service?: string;
}
