"use no memo";
import React, { useCallback, useMemo, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import StoryLineHints from "@/components/StoryLineHints";
import { splitTextTokens } from "@/lib/editor/tts_transcripte";

import { useWavesurfer } from "@wavesurfer/react";
import Regions from "wavesurfer.js/dist/plugins/regions.js";
import PlayAudio from "@/components/PlayAudio";
import type { ContentWithHints } from "@/components/editor/story/syntax_parser_types";

interface Region {
  start: number;
  content?: HTMLElement;
  innerText?: string;
}

interface RegionsPlugin {
  regions: Region[];
  addRegion: (options: {
    start: number;
    content: string;
    color: string;
  }) => void;
  on: (event: string, callback: (region: Region) => void) => void;
}

interface SoundRecorderProps {
  content: ContentWithHints;
  initialTimingText: string;
  url: string;
  story_id: number;
  onClose: () => void;
  onSave: (filename: string, timingText: string) => void;
  soundRecorderNext: () => void;
  soundRecorderPrevious: () => void;
  total_index: number;
  current_index: number;
}

interface Part {
  text: string;
  pos: number;
}

function cumulativeSums(values: number[]): number[] {
  let total = 0;
  const sums: number[] = [];
  values.forEach((v: number) => {
    total += v;
    sums.push(total);
  });
  return sums;
}

async function uploadAudio(
  file: File | null,
  story_id: number,
): Promise<Response | undefined> {
  if (!file) return;

  try {
    const data = new FormData();
    data.set("file", file);
    data.set("story_id", String(story_id));

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
}: SoundRecorderProps) {
  const containerRef = useRef(null);
  const [urlIndex, setUrlIndex] = useState(url);
  const [audioRange, setAudioRange] = React.useState(99999);
  const [uploaded, setUploaded] = React.useState(!!url);
  const [file, setFile] = React.useState<File | null>(null);

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

  function updateTimingText(regions: Region[], parts2: Part[]) {
    let text = "";

    for (let i = 0; i < regions.length; i++) {
      text +=
        ";" +
        (parts2[i].text.length +
          parts2[i].pos -
          (parts2[i - 1]?.text?.length + parts2[i - 1]?.pos || 0)) +
        "," +
        (Math.floor(regions[i].start * 1000) -
          Math.floor(regions[i - 1]?.start * 1000 || 0));
    }
    setTimingText(text);
  }

  const onDecode = useCallback(
    (wavesurfer: WaveSurfer, duration: number) => {
      const timings = initialTimingText
        ? cumulativeSums(
            [...initialTimingText.matchAll(/(\d*),(\d*)/g)].map(
              (a) => parseInt(a[2]) / 1000,
            ),
          )
        : [];

      const regionsPlugin = (wavesurfer as unknown as { plugins: unknown[] })
        .plugins[0] as RegionsPlugin;
      for (let i = 0; i < parts2.length; i++) {
        if (i >= regionsPlugin.regions.length)
          regionsPlugin.addRegion({
            start:
              timings[i] || duration * (parts2[i].pos / content.text.length),
            content: parts2[i].text,
            color: "#e06c75",
          });

        regionsPlugin.regions[i].innerText =
          parts2[i].text + " " + parts2[i].pos;
        regionsPlugin.regions[i].start =
          timings[i] || duration * (parts2[i].pos / content.text.length);
      }
    },
    [parts2, initialTimingText, content.text.length],
  );
  const onTimeUpdate = useCallback(
    (wavesurfer: WaveSurfer, currentTime: number) => {
      const regionsPlugin = (wavesurfer as unknown as { plugins: unknown[] })
        .plugins[0] as RegionsPlugin;
      const regions = regionsPlugin.regions.sort(
        (a: Region, b: Region) => a.start - b.start,
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
    (regionsPlugin: RegionsPlugin, region: Region) => {
      const regions = regionsPlugin.regions.sort(
        (a: Region, b: Region) => a.start - b.start,
      );
      for (let i = 0; i < regions.length; i++) {
        if (regions[i].content !== undefined && parts2[i] !== undefined)
          regions[i].content!.innerText = parts2[i].text; //+ " " + parts2[i].pos;
      }
      updateTimingText(regions, parts2);
    },
    [parts2],
  );

  const { wavesurfer } = useWavesurfer({
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
    const plugins = (wavesurfer as unknown as { plugins: RegionsPlugin[] })
      .plugins;
    plugins[0].on("region-updated", (region: Region) => {
      if (plugins[0]) onRegionUpdated(plugins[0], region);
    });
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    //console.log("file", file);
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
      const uploadResult = await uploadAudio(file, story_id);
      if (!uploadResult) {
        window.alert("Upload failed.");
        return;
      }
      const response = await uploadResult.json();
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
    //console.log(timingText);
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
    //console.log("filename", filename);
    onSave(filename, timingText);
  };

  //return <></>;
  return (
    <div className="absolute top-[58px] z-[2] block w-full border-2 border-[var(--color_base_border)] bg-[var(--body-background)] p-[25px]">
      <button className="absolute right-0 top-0" onClick={onClose}>
        X
      </button>
      <input type="file" onChange={handleFileChange} accept="audio/*" />
      <PlayAudio onClick={onPlayPause} />
      <StoryLineHints
        audioRange={audioRange}
        hideRangesForChallenge={[]}
        content={content}
      />
      <p>{timingText}</p>
      <div ref={containerRef} />
      <div className="flex justify-end">
        <button onClick={soundRecorderPrevious}>Previous</button>
        <button onClick={onSaveX}>Save</button>
        <button onClick={soundRecorderNext}>Next</button>
        {current_index + 1} / {total_index}
      </div>
    </div>
  );
}
