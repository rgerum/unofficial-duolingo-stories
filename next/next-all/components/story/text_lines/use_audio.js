import React from "react";


export default function useAudio(element, progress) {
    let [audioRange, setAudioRange] = React.useState(99999);
    let audio = element?.line?.content?.audio;
    let ref = React.useRef();

    if(audio === undefined)
        audio = element?.learningLanguageTitleContent?.audio;

    const playAudio = React.useCallback(() => {
        if(audio === undefined || !audio?.keypoints || !audio?.url)
            return
        let audioObject = ref.current;
        if(window?.playing_audio) {
            for(let audio_cancel of window.playing_audio)
                audio_cancel();
        }
        window.playing_audio = [];
        audioObject.pause();
        audioObject.load();
        audioObject.currentTime = 0;
        audioObject.play();
        let timeouts = [];
        let last_end = 0;
        for (let keypoint of audio.keypoints) {
            last_end = keypoint.rangeEnd;
            let t = setTimeout(() => {
                setAudioRange(keypoint.rangeEnd);
            }, keypoint.audioStart);
            timeouts.push(t);
        }
        function cancel() {
            for(let t in timeouts)
                clearTimeout(t);
            setAudioRange(last_end);
            audioObject.pause();
        }
        window.playing_audio.push(cancel);
    }, [audio, ref]);
    React.useEffect(() => {
        if(element.trackingProperties.line_index === progress || (element.trackingProperties.line_index === undefined && progress === -1))
            playAudio();
    }, [progress, playAudio]);

    if(audio === undefined || !audio?.keypoints || !audio?.url)
        return [audioRange, undefined, ref, undefined];

    return [audioRange, playAudio, ref, 'https://carex.uber.space/stories/'+audio.url];
}
