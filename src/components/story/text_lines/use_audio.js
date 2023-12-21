import React from "react";
import { StoryContext } from "../story";

export default function useAudio(element, progress) {
  let [audioRange, setAudioRange] = React.useState(99999);
  let audio = element?.line?.content?.audio;
  let ref = React.useRef();

  const controls = React.useContext(StoryContext);

  if (audio === undefined)
    audio = element?.learningLanguageTitleContent?.audio;

  const playAudio = React.useCallback(async () => {
    if (audio === undefined || !audio?.keypoints || !audio?.url) return;
    let audioObject = ref.current;
    if (window?.playing_audio) {
      for (let audio_cancel of window.playing_audio) audio_cancel();
    }
    window.playing_audio = [];
    audioObject.pause();
    audioObject.load();
    audioObject.currentTime = 0;
    try {
      await audioObject.play();
    } catch (e) {
      controls.audio_failed_call();
      return;
    }
    let timeouts = [];
    let last_end = 0;
    for (let keypoint of audio.keypoints) {
      last_end = keypoint.rangeEnd;
      let t = setTimeout(() => {
        setAudioRange(keypoint.rangeEnd);
      }, keypoint.audioStart);
      timeouts.push(t);
    }

    setTimeout(
      () => {
        if (controls.auto_play)
          controls.advance_progress(element.trackingProperties.line_index || 0);
      },
      audioObject.duration * 1000 - 150,
    );

    function cancel() {
      for (let t in timeouts) clearTimeout(t);
      setAudioRange(last_end);
      audioObject.pause();
    }
    window.playing_audio.push(cancel);
  }, [audio, ref]);
  React.useEffect(() => {
    if (
      element.trackingProperties.line_index === progress ||
      (element.trackingProperties.line_index === undefined && progress === -1)
    )
      playAudio();
  }, [progress, playAudio]);

  if (audio === undefined || !audio?.keypoints || !audio?.url)
    return [audioRange, undefined, ref, undefined];

  return [
    audioRange,
    playAudio,
    ref,
    audio.url.startsWith("blob")
      ? audio.url
      : "https://duostori.uber.space/" + audio.url,
  ];
}
