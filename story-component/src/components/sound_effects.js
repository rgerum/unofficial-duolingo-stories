// the sound when a questions was answered correctly
let audio_right = new Audio("https://d35aaqx5ub95lt.cloudfront.net/sounds/37d8f0b39dcfe63872192c89653a93f6.mp3");
audio_right.volume = 0.5;

// the sound when a question was answered wrong
let audio_wrong = new Audio("https://d35aaqx5ub95lt.cloudfront.net/sounds/f0b6ab4396d5891241ef4ca73b4de13a.mp3");
audio_wrong.volume = 0.5;

// sound for completing a story
let audio_finished = new Audio("https://d35aaqx5ub95lt.cloudfront.net/sounds/2aae0ea735c8e9ed884107d6f0a09e35.mp3");
audio_finished.volume = 0.5;

function play_sound(audio) {
    // stop the playback if it is still playing
    audio.pause();
    // rewind (a bit like a tape recorder...)
    audio.currentTime = 0;
    // play the sound!
    return audio.play();
}

// play the right answer sound (reset it before)
export function playSoundRight() {
    return play_sound(audio_right);
}

// play the wrong answer sound (reset it before)
export function playSoundWrong() {
    return play_sound(audio_wrong);
}