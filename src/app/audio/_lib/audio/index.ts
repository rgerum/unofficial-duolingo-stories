import engine_azure from "./azure_tts";
import engine_google from "./google";
import engine_polly from "./polly";
import engine_elevenlabs from "./elevenlabs";
import type { TTSEngine, ElevenLabsEngine } from "./types";

const audio_engines: (TTSEngine | ElevenLabsEngine)[] = [
  engine_elevenlabs,
  engine_google,
  engine_azure,
  engine_polly,
];

export { audio_engines };
export type {
  TTSEngine,
  ElevenLabsEngine,
  Voice,
  SynthesisResult,
  AudioMark,
} from "./types";
