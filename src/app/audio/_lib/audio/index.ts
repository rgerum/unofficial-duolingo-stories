import engine_azure from "./azure_tts";
import engine_google from "./google.mjs";
import engine_polly from "./polly";
import engine_elevenlabs from "./elevenlabs.mjs";

let audio_engines = [
  engine_elevenlabs,
  engine_google,
  engine_azure,
  engine_polly,
];

export { audio_engines };
