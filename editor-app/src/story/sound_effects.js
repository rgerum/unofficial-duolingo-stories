
let audio_right = new Audio("https://d35aaqx5ub95lt.cloudfront.net/sounds/37d8f0b39dcfe63872192c89653a93f6.mp3");
audio_right.volume = 0.5;
let audio_wrong = new Audio("https://d35aaqx5ub95lt.cloudfront.net/sounds/f0b6ab4396d5891241ef4ca73b4de13a.mp3");
audio_wrong.volume = 0.5;
let audio_finished = new Audio("https://d35aaqx5ub95lt.cloudfront.net/sounds/2aae0ea735c8e9ed884107d6f0a09e35.mp3");
audio_finished.volume = 0.5;

export function playSoundRight() {
    audio_right.pause();
    audio_right.currentTime = 0;
    audio_right.play();
}
export function playSoundWrong() {
    audio_wrong.pause();
    audio_wrong.currentTime = 0;
    audio_wrong.play();
}