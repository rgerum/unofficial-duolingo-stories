import engine_azure from "./azure_tts";
import engine_google from "./google.mjs";
import engine_polly from "./polly";

let audio_engines = [
    engine_google,
    engine_azure,
    engine_polly,
]

export {audio_engines};
