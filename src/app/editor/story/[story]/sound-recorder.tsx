"use no memo";
import styles from "./sound-recorder.module.css";
import React, { useCallback, useMemo, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { AudioRecorder } from "@/components/react-audio-recorder";
import HintLineContent from "@/components/story/text_lines/line_hints";
import { splitTextTokens } from "@/lib/editor/tts_transcripte";

import { useWavesurfer } from "@wavesurfer/react";
import Timeline from "wavesurfer.js/dist/plugins/timeline.js";
import Regions from "wavesurfer.js/dist/plugins/regions.js";
import AudioPlay from "@/components/story/text_lines/audio_play";

const audioUrls = [
  "https://ptoqrnbx8ghuucmt.public.blob.vercel-storage.com/audio/43/2a532e34.mp3",
];

const formatTime = (seconds) =>
  [seconds / 60, seconds % 60]
    .map((v) => `0${Math.floor(v)}`.slice(-2))
    .join(":");

function cumulativeSums(values) {
  let total = 0;
  const sums = [];
  values.forEach((v) => {
    total += v;
    sums.push(total);
  });
  return sums;
}

async function uploadAudio(file, story_id) {
  if (!file) return;

  try {
    const data = new FormData();
    data.set("file", file);
    data.set("story_id", story_id);

    const res = await fetch("/audio/upload", {
      method: "POST",
      body: data,
    });
    // handle the error
    if (!res.ok) throw new Error(await res.text());
    return res;
  } catch (e) {
    // Handle errors here
    console.error(e);
  }
}

export default function SoundRecorder({
  content,
  initialTimingText,
  url,
  story_id,
  onClose,
  onSave,
  soundRecorderNext,
  soundRecorderPrevious,
  total_index,
  current_index,
}) {
  const containerRef = useRef(null);
  const [urlIndex, setUrlIndex] = useState(url);
  const [audioRange, setAudioRange] = React.useState(99999);
  const [uploaded, setUploaded] = React.useState(url ? true : false);
  const [file, setFile] = React.useState(null);

  const [duration, setDuration] = useState(0);

  const [timingText, setTimingText] = useState(initialTimingText);

  const parts2 = useMemo(() => {
    const parts = splitTextTokens(content.text);
    const parts2 = [];
    //if (parts[0] === "") parts.splice(0, 1);
    if (parts[parts.length - 1] === "") parts.pop();
    let current_pos = 0;
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        parts2.push({ text: parts[i], pos: current_pos });
      }
      current_pos += parts[i].length;
    }
    return parts2;
  }, [content]);

  function updateTimingText(regions, parts2) {
    let text = "";

    for (let i = 0; i < regions.length; i++) {
      text +=
        ";" +
        (parts2[i].text.length +
          parts2[i].pos -
          (parts2[i - 1]?.text?.length + parts2[i - 1]?.pos || 0)) +
        "," +
        (parseInt(regions[i].start * 1000) -
          parseInt(regions[i - 1]?.start * 1000 || 0));
    }
    setTimingText(text);
  }

  const onDecode = useCallback(
    (wavesurfer, duration) => {
      const timings = initialTimingText
        ? cumulativeSums(
            [...initialTimingText.matchAll(/(\d*),(\d*)/g)].map(
              (a) => a[2] / 1000,
            ),
          )
        : [];

      for (let i = 0; i < parts2.length; i++) {
        if (i >= wavesurfer.plugins[0].regions.length)
          wavesurfer.plugins[0].addRegion({
            start:
              timings[i] || duration * (parts2[i].pos / content.text.length),
            content: parts2[i].text,
            color: "#e06c75",
          });

        wavesurfer.plugins[0].regions[i].innerText =
          parts2[i].text + " " + parts2[i].pos;
        wavesurfer.plugins[0].regions[i].start =
          timings[i] || duration * (parts2[i].pos / content.text.length);
      }
    },
    [parts2, initialTimingText],
  );
  const onTimeUpdate = useCallback(
    (wavesurfer, currentTime) => {
      const regions = wavesurfer.plugins[0].regions.sort(
        (a, b) => a.start - b.start,
      );
      let pos = 0;
      for (let i = 0; i < regions.length; i++) {
        if (regions[i].start < currentTime && parts2[i] !== undefined)
          pos = parts2[i].pos;
      }
      if (pos !== audioRange) {
        setAudioRange(pos);
      }
    },
    [audioRange, parts2],
  );
  const onRegionUpdated = useCallback(
    (regionsPlugin, region) => {
      const regions = regionsPlugin.regions.sort((a, b) => a.start - b.start);
      for (let i = 0; i < regions.length; i++) {
        if (regions[i].content !== undefined && parts2[i] !== undefined)
          regions[i].content.innerText = parts2[i].text; //+ " " + parts2[i].pos;
      }
      updateTimingText(regions, parts2);
    },
    [parts2],
  );

  const { wavesurfer, isPlaying, currentTime } = useWavesurfer({
    container: containerRef,
    height: 60,
    waveColor: "#1cb0f6",
    progressColor: "rgba(28,176,246,0.62)",
    cursorColor: "#0f5f83",
    normalize: true,
    barWidth: 4,
    barGap: 3,
    barRadius: 30,
    url: urlIndex,
    plugins: useMemo(
      () => [
        /*Timeline.create({
          timeInterval: 0.01,
          primaryLabelInterval: 0.1,
          secondaryLabelInterval: 0.05,
        }),*/
        Regions.create(),
      ],
      [],
    ),
  });

  if (wavesurfer) {
    wavesurfer.on("decode", (duration) => onDecode(wavesurfer, duration));
    wavesurfer.on("timeupdate", (currentTime) =>
      onTimeUpdate(wavesurfer, currentTime),
    );
    wavesurfer.plugins[0].on("region-updated", (region) => {
      if (wavesurfer?.plugins[0])
        onRegionUpdated(wavesurfer.plugins[0], region);
    });
  }

  function setNewFile(file) {
    const url = URL.createObjectURL(file);
    const audio = document.createElement("audio");
    audio.src = url;
    document.body.appendChild(audio);

    setAudioFile(file);
    setAudioObject(audio);
    loadWaveform(url);
  }

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    console.log("file", file);
    setFile(file);
    setUploaded(false);
    let url = URL.createObjectURL(file);
    setUrlIndex(url);
  };

  const onPlayPause = useCallback(() => {
    wavesurfer && wavesurfer.playPause();
  }, [wavesurfer]);

  const onSaveX = async () => {
    let filename = urlIndex;
    if (!uploaded) {
      const response = await (await uploadAudio(file, story_id)).json();
      if (response.success) {
        setUrlIndex(
          "https://ptoqrnbx8ghuucmt.public.blob.vercel-storage.com/" +
            response.filename,
        );
        filename = response.filename;
        setUploaded(true);
      } else {
        window.alert("Upload failed.");
        return;
      }
    }
    console.log(timingText);
    if (
      filename.startsWith(
        "https://ptoqrnbx8ghuucmt.public.blob.vercel-storage.com/",
      )
    ) {
      filename = filename.substring(
        "https://ptoqrnbx8ghuucmt.public.blob.vercel-storage.com/".length,
      );
    }
    if (filename.startsWith("audio/")) {
      filename = filename.substring("audio/".length);
    }
    console.log("filename", filename);
    onSave(filename, timingText);
  };

  //return <></>;
  return (
    <div className={styles.container}>
      <button className={styles.close} onClick={onClose}>
        X
      </button>
      <input type="file" onChange={handleFileChange} accept="audio/*" />
      <AudioPlay onClick={onPlayPause} />
      <HintLineContent
        audioRange={audioRange}
        hideRangesForChallenge={[]}
        content={content}
      />
      <p>{timingText}</p>
      <div ref={containerRef} />
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={soundRecorderPrevious}>Previous</button>
        <button onClick={onSaveX}>Save</button>
        <button onClick={soundRecorderNext}>Next</button>
        {current_index + 1} / {total_index}
      </div>
    </div>
  );
}

export function SoundRecorderX() {
  const [audioFile, setAudioFile] = useState(null);
  const [audioObject, setAudioObject] = useState(null);
  const [duration, setDuration] = useState(0);
  const waveformRef = useRef(null);
  const wavesurfer = useRef(null);

  console.log("Duration Current", duration + "s");

  let [audioRange, setAudioRange] = React.useState(99999);

  const content = { text: "This is a test.", hintMap: [] };
  let parts = splitTextTokens(content.text);
  if (parts[0] === "") parts.splice(0, 1);
  if (parts[parts.length - 1] === "") parts.pop();

  function setNewFile(file) {
    const url = URL.createObjectURL(file);
    const audio = document.createElement("audio");
    audio.src = url;
    document.body.appendChild(audio);

    setAudioFile(file);
    setAudioObject(audio);
    loadWaveform(url);
  }

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setNewFile(file);
  };

  if (wavesurfer.current) {
    /** On audio position change, fires continuously during playback */
    wavesurfer.current.on("timeupdate", (currentTime) => {
      console.log(
        "Time",
        currentTime + "s",
        content.text.length * (currentTime / duration),
        duration,
        content.text.length,
      );
      if (duration === 0) return;
      setAudioRange(content.text.length * (currentTime / duration));
    });
  }

  const loadWaveform = (url) => {
    if (wavesurfer.current) {
      wavesurfer.current.destroy();
    }
    wavesurfer.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: "violet",
      progressColor: "purple",
    });
    wavesurfer.current.load(url);

    let current_duration = duration;

    /** When the audio is both decoded and can play */
    wavesurfer.current.on("ready", (new_duration) => {
      console.log("Duration New", new_duration + "s");
      current_duration = new_duration;
      setDuration(new_duration);
    });
  };

  const uploadAudio = () => {
    const formData = new FormData();
    formData.append("file", audioFile);
    /*
    axios
      .post("YOUR_ENDPOINT_URL", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => {
        console.log(response.data);
        // Handle success
      })
      .catch((error) => {
        console.error(error);
        // Handle error
      });*/
  };

  const addAudioElement = (blob) => {
    setNewFile(blob);
  };

  // Play button
  //const button = container.appendChild(document.createElement('button'))
  //button.textContent = 'Play'
  //button.onclick = () => wavesurfer.playPause()
  //wavesurfer.on('pause', () => (button.textContent = 'Play'))
  //wavesurfer.on('play', () => (button.textContent = 'Pause'))

  return (
    <div>
      <button onClick={uploadAudio} disabled={!audioFile}>
        Upload
      </button>
      <AudioRecorder
        onRecordingComplete={addAudioElement}
        audioTrackConstraints={{
          noiseSuppression: true,
          echoCancellation: true,
          // autoGainControl,
          // channelCount,
          // deviceId,
          // groupId,
          // sampleRate,
          // sampleSize,
        }}
        onNotAllowedOrFound={(err) => console.table(err)}
        downloadOnSavePress={false}
        downloadFileExtension="webm"
        mediaRecorderOptions={{
          audioBitsPerSecond: 128000,
        }}
        showVisualizer={true}
      />

      <div id="waveform" ref={waveformRef}></div>
      <input type="file" onChange={handleFileChange} accept="audio/*" />
      <button onClick={() => wavesurfer.current.playPause()}>Play</button>
      <HintLineContent
        audioRange={audioRange}
        hideRangesForChallenge={[]}
        content={content}
      />
    </div>
  );
}
