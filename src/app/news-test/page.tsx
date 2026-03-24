"use client";

import React from "react";
import { basicSetup, EditorView } from "codemirror";
import { EditorState } from "@codemirror/state";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { example, highlightStyle } from "@/components/editor/story/parser";
import { processStoryFile } from "@/components/editor/story/syntax_parser_new";
import StoryEditorPreview from "@/components/StoryEditorPreview";
import StoryProgress from "@/components/StoryProgress";
import type { StoryType } from "@/components/editor/story/syntax_parser_new";
import type { Avatar } from "@/app/editor/story/[story]/types";
import type { StoryData } from "@/app/(stories)/story/[story_id]/getStory";

// Simple newspaper SVG as placeholder illustration
const NEWS_ILLUSTRATION = "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="16" fill="#e8f4fd"/><rect x="20" y="18" width="80" height="84" rx="6" fill="white" stroke="#1cb0f6" stroke-width="2"/><rect x="30" y="28" width="60" height="10" rx="2" fill="#1cb0f6"/><rect x="30" y="46" width="35" height="4" rx="1" fill="#ccc"/><rect x="30" y="54" width="60" height="4" rx="1" fill="#ccc"/><rect x="30" y="62" width="50" height="4" rx="1" fill="#ccc"/><rect x="30" y="70" width="55" height="4" rx="1" fill="#ccc"/><rect x="30" y="78" width="40" height="4" rx="1" fill="#ccc"/><rect x="30" y="86" width="60" height="4" rx="1" fill="#ccc"/></svg>`);

const DEFAULT_STORY = `[DATA]
fromLanguageName=The News

[HEADER]
> Click "Generate Story" to create an AI story from today's news!
~ Click "Generate Story" to create an AI story from today's news!
`;

const LANGUAGE_PAIRS = [
  { learning: "Spanish", from: "English", short: "es", fromShort: "en", label: "Spanish → English" },
  { learning: "French", from: "English", short: "fr", fromShort: "en", label: "French → English" },
  { learning: "German", from: "English", short: "de", fromShort: "en", label: "German → English" },
  { learning: "Italian", from: "English", short: "it", fromShort: "en", label: "Italian → English" },
  { learning: "Portuguese", from: "English", short: "pt", fromShort: "en", label: "Portuguese → English" },
  { learning: "Dutch", from: "English", short: "nl", fromShort: "en", label: "Dutch → English" },
  { learning: "Japanese", from: "English", short: "ja", fromShort: "en", label: "Japanese → English" },
  { learning: "Korean", from: "English", short: "ko", fromShort: "en", label: "Korean → English" },
  { learning: "Mandarin Chinese", from: "English", short: "zh", fromShort: "en", label: "Chinese → English" },
];

type ViewMode = "editor" | "play";

/** Convert base64 audio to a blob: URL */
function base64ToBlobUrl(base64: string, mimeType = "audio/mp3"): string {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType });
  return URL.createObjectURL(blob);
}

type Keypoint = { rangeEnd: number; audioStart: number };

/** Build keypoints array from TTS timing marks */
function buildKeypoints(
  marks?: { time: number; type: string; start: number; end: number; value: string }[],
  timepoints?: { markName: string; timeSeconds: number }[],
): Keypoint[] {
  const keypoints: Keypoint[] = [];

  if (timepoints && timepoints.length > 0) {
    for (const tp of timepoints) {
      keypoints.push({
        rangeEnd: parseInt(tp.markName),
        audioStart: Math.round(tp.timeSeconds * 1000),
      });
    }
  } else if (marks && marks.length > 0) {
    for (const mark of marks) {
      keypoints.push({
        rangeEnd: mark.end,
        audioStart: mark.time,
      });
    }
  }

  return keypoints;
}

/** Audio data for a single story element, keyed by line_index */
type AudioEntry = { blobUrl: string; keypoints: Keypoint[] };

export default function NewsTestPage() {
  const editorRef = React.useRef<HTMLDivElement>(null);
  const viewRef = React.useRef<EditorView | null>(null);
  const [docText, setDocText] = React.useState(DEFAULT_STORY);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = React.useState(false);
  const [audioProgress, setAudioProgress] = React.useState<string | null>(null);
  // Map from line_index → generated audio data (persists across re-parses)
  const [audioMap, setAudioMap] = React.useState<Record<number, AudioEntry>>({});
  const [error, setError] = React.useState<string | null>(null);
  const [headlines, setHeadlines] = React.useState<string[]>([]);
  const [selectedPair, setSelectedPair] = React.useState(0);
  const [modelUsed, setModelUsed] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = React.useState("B1");
  const [viewMode, setViewMode] = React.useState<ViewMode>("editor");

  // Key to force StoryProgress remount when switching to play mode
  const [playKey, setPlayKey] = React.useState(0);

  // Load avatar data for the selected learning language
  const pair = LANGUAGE_PAIRS[selectedPair];
  const languageShort = pair.short;
  const avatarRows = useQuery(
    api.editorRead.getEditorAvatarNamesByLanguageShort,
    { languageShort },
  );

  const avatarNames: Record<number, Avatar> = React.useMemo(() => {
    const map: Record<number, Avatar> = {};
    if (avatarRows) {
      for (const avatar of avatarRows as Avatar[]) {
        map[avatar.avatar_id] = avatar;
      }
      console.log(`[news-test] Loaded ${Object.keys(map).length} avatars for language "${languageShort}"`);
    }
    return map;
  }, [avatarRows, languageShort]);

  const parsedStory: StoryType = React.useMemo(() => {
    const [story] = processStoryFile(
      docText,
      0,
      avatarNames,
      { learning_language: languageShort, from_language: pair.fromShort },
      "",
    );
    return story;
  }, [docText, avatarNames, languageShort, pair.fromShort]);

  // Build a StoryData object for the interactive reader
  const storyData: StoryData = React.useMemo(() => {
    const [story, meta] = processStoryFile(
      docText,
      0,
      avatarNames,
      { learning_language: languageShort, from_language: pair.fromShort },
      "",
    );
    // Patch elements: inject illustrations and generated audio
    const elements = story.elements.map((el) => {
      if (el.type === "HEADER") {
        const patched = { ...el, illustrationUrl: NEWS_ILLUSTRATION };
        // Inject audio for header (line_index 0)
        const audioEntry = audioMap[el.trackingProperties.line_index];
        if (audioEntry && patched.learningLanguageTitleContent) {
          patched.learningLanguageTitleContent = {
            ...patched.learningLanguageTitleContent,
            audio: {
              ssml: { text: "", speaker: "", id: 0 },
              url: audioEntry.blobUrl,
              keypoints: audioEntry.keypoints,
            },
          };
        }
        return patched;
      }
      if (el.type === "LINE") {
        const audioEntry = audioMap[el.trackingProperties.line_index];
        if (audioEntry && el.line?.content) {
          return {
            ...el,
            line: {
              ...el.line,
              content: {
                ...el.line.content,
                audio: {
                  ssml: { text: "", speaker: "", id: 0 },
                  url: audioEntry.blobUrl,
                  keypoints: audioEntry.keypoints,
                },
              },
            },
          };
        }
      }
      return el;
    });

    return {
      id: 0,
      set_id: 0,
      course_id: 0,
      from_language: pair.fromShort,
      from_language_id: 0,
      from_language_long: pair.from,
      from_language_rtl: false,
      from_language_name: meta.fromLanguageName || "News Story",
      learning_language: languageShort,
      learning_language_long: pair.learning,
      learning_language_rtl: false,
      course_short: `${languageShort}-${pair.fromShort}`,
      elements,
      illustrations: {
        gilded: NEWS_ILLUSTRATION,
        active: NEWS_ILLUSTRATION,
        locked: NEWS_ILLUSTRATION,
      },
    } as StoryData;
  }, [docText, avatarNames, languageShort, pair, audioMap]);

  // Initialize CodeMirror
  React.useEffect(() => {
    if (!editorRef.current) return;

    const sync = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        setDocText(update.state.doc.toString());
      }
    });

    const state = EditorState.create({
      doc: DEFAULT_STORY,
      extensions: [basicSetup, sync, example(), highlightStyle],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  const handleGenerate = async () => {
    console.log("[news-test] Generate button clicked");
    setIsGenerating(true);
    setError(null);
    setModelUsed(null);
    setAudioMap({}); // Clear audio when generating a new story
    setStatus("Fetching news headlines...");

    try {
      console.log(`[news-test] Requesting story: ${pair.learning} → ${pair.from} (${selectedLevel})`);
      setStatus(`Generating ${selectedLevel} ${pair.learning} story from today's news... (this takes ~15-30s)`);

      const startTime = Date.now();
      const res = await fetch("/api/news-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          learningLanguage: pair.learning,
          fromLanguage: pair.from,
          level: selectedLevel,
        }),
      });

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[news-test] API responded: ${res.status} (${elapsed}s)`);

      if (!res.ok) {
        const data = await res.json();
        console.error("[news-test] API error:", data);
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      const data = await res.json();
      const storyText = data.storyText as string;
      console.log("[news-test] Got story:", storyText.length, "chars");
      console.log("[news-test] Headlines:", data.headlines);
      console.log("[news-test] Model:", data.model);

      setHeadlines(data.headlines ?? []);
      setModelUsed(data.model ?? null);
      if (data.repaired) {
        console.log(`[news-test] Hints were repaired (${data.hintMismatches} mismatches fixed)`);
      }
      setStatus(null);

      // Update CodeMirror with the generated text
      const view = viewRef.current;
      if (view) {
        view.dispatch({
          changes: {
            from: 0,
            to: view.state.doc.length,
            insert: storyText,
          },
        });
      }
      setDocText(storyText);
    } catch (e) {
      console.error("[news-test] Error:", e);
      setError(e instanceof Error ? e.message : "Unknown error");
      setStatus(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateAudio = async () => {
    console.log("[news-test] Generate Audio clicked");
    setIsGeneratingAudio(true);
    setError(null);

    try {
      // Use the parsed story elements to find lines that need audio
      const elements = parsedStory.elements;

      type AudioJob = {
        lineIndex: number; // trackingProperties.line_index
        plainText: string;
        speakerId: number | null;
        voice: string;
      };

      const jobs: AudioJob[] = [];

      for (const el of elements) {
        if (el.type === "HEADER") {
          const text = el.learningLanguageTitleContent?.text;
          if (!text?.trim()) continue;
          // For header/narrator lines, try to find a default voice from any avatar
          const firstAvatarWithVoice = Object.values(avatarNames).find((a) => a.speaker);
          if (!firstAvatarWithVoice?.speaker) continue;
          jobs.push({
            lineIndex: el.trackingProperties.line_index,
            plainText: text.replace(/~/g, " "),
            speakerId: null,
            voice: firstAvatarWithVoice.speaker,
          });
        } else if (el.type === "LINE") {
          const content = el.line?.content;
          if (!content?.text?.trim()) continue;

          const plainText = content.text.replace(/~/g, " ");
          let voice = "";
          let speakerId: number | null = null;

          if (el.line.type === "CHARACTER") {
            speakerId = typeof el.line.characterId === "number"
              ? el.line.characterId
              : parseInt(String(el.line.characterId), 10) || null;
            if (speakerId && avatarNames[speakerId]?.speaker) {
              voice = avatarNames[speakerId].speaker;
            }
          } else {
            // PROSE line — use first available voice
            const firstAvatarWithVoice = Object.values(avatarNames).find((a) => a.speaker);
            if (firstAvatarWithVoice?.speaker) {
              voice = firstAvatarWithVoice.speaker;
            }
          }

          if (!voice) {
            console.log(`[news-test] No voice for element ${el.trackingProperties.line_index}: "${plainText.substring(0, 40)}..."`);
            continue;
          }

          // Skip if we already have audio for this element
          if (audioMap[el.trackingProperties.line_index]) continue;

          jobs.push({
            lineIndex: el.trackingProperties.line_index,
            plainText,
            speakerId,
            voice,
          });
        }
      }

      console.log(`[news-test] Found ${jobs.length} lines that need audio`);
      if (jobs.length === 0) {
        setAudioProgress("No lines with valid speaker voices found (or all already have audio).");
        setIsGeneratingAudio(false);
        return;
      }

      const newAudioEntries: Record<number, AudioEntry> = {};
      let completed = 0;
      let failed = 0;

      for (const job of jobs) {
        completed++;
        setAudioProgress(`Generating audio ${completed}/${jobs.length}: "${job.plainText.substring(0, 30)}..."`);
        console.log(`[news-test] Audio ${completed}/${jobs.length}: voice=${job.voice}, text="${job.plainText.substring(0, 50)}"`);

        try {
          const res = await fetch("/api/news-story-audio", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: job.plainText, voice: job.voice }),
          });

          if (!res.ok) {
            const errData = await res.json();
            console.warn(`[news-test] Audio failed for element ${job.lineIndex}:`, errData.error);
            failed++;
            continue;
          }

          const data = await res.json();
          if (!data.content) {
            console.warn(`[news-test] No audio content returned for element ${job.lineIndex}`);
            failed++;
            continue;
          }

          const blobUrl = base64ToBlobUrl(data.content);
          const keypoints = buildKeypoints(data.marks, data.timepoints);

          newAudioEntries[job.lineIndex] = { blobUrl, keypoints };
          console.log(`[news-test] Audio ready for element ${job.lineIndex} (${data.engine}, ${keypoints.length} keypoints)`);
        } catch (e) {
          console.warn(`[news-test] Audio generation failed for element ${job.lineIndex}:`, e);
          failed++;
        }
      }

      // Merge new audio entries into the state map
      setAudioMap((prev) => ({ ...prev, ...newAudioEntries }));

      const successCount = Object.keys(newAudioEntries).length;
      setAudioProgress(`Done! Generated ${successCount} audio clips${failed > 0 ? ` (${failed} failed)` : ""}. Press ▶ Play to listen.`);
      setTimeout(() => setAudioProgress(null), 5000);
    } catch (e) {
      console.error("[news-test] Audio generation error:", e);
      setError(e instanceof Error ? e.message : "Audio generation failed");
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handlePlay = () => {
    setPlayKey((k) => k + 1);
    setViewMode("play");
  };

  const [highlightName, setHighlightName] = React.useState<string[]>([]);
  const [hideNonHighlighted, setHideNonHighlighted] = React.useState(false);

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-900">
        <h1 className="text-lg font-bold">📰 News Story Generator</h1>
        <div className="mx-1 h-6 w-px bg-gray-300 dark:bg-gray-600" />

        <select
          value={selectedPair}
          onChange={(e) => setSelectedPair(Number(e.target.value))}
          className="rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
        >
          {LANGUAGE_PAIRS.map((pair, i) => (
            <option key={i} value={i}>
              {pair.label}
            </option>
          ))}
        </select>

        <select
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
          className="rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
        >
          <option value="A1">A1 — Beginner</option>
          <option value="A2">A2 — Elementary</option>
          <option value="B1">B1 — Intermediate</option>
          <option value="B2">B2 — Upper Intermediate</option>
        </select>

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="rounded bg-[#1cb0f6] px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#18a0e0] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isGenerating ? "Generating..." : "Generate Story"}
        </button>

        <button
          onClick={handleGenerateAudio}
          disabled={isGeneratingAudio || isGenerating}
          className="rounded bg-[#58cc02] px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#4caf00] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isGeneratingAudio ? "Generating Audio..." : "🔊 Generate Audio"}
        </button>

        <div className="mx-1 h-6 w-px bg-gray-300 dark:bg-gray-600" />

        {/* View mode toggle */}
        <div className="flex rounded border border-gray-300 text-sm dark:border-gray-600">
          <button
            onClick={() => setViewMode("editor")}
            className={`px-3 py-1 transition-colors ${
              viewMode === "editor"
                ? "bg-gray-200 font-semibold dark:bg-gray-700"
                : "hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            Editor
          </button>
          <button
            onClick={handlePlay}
            className={`px-3 py-1 transition-colors ${
              viewMode === "play"
                ? "bg-[#1cb0f6] font-semibold text-white"
                : "hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            ▶ Play
          </button>
        </div>

        {error && (
          <span className="text-sm text-red-500">{error}</span>
        )}

        {status && (
          <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-[#1cb0f6]" />
            {status}
          </span>
        )}

        {audioProgress && (
          <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            {isGeneratingAudio && (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-[#58cc02]" />
            )}
            {audioProgress}
          </span>
        )}

        {modelUsed && (
          <span className="ml-auto text-xs text-gray-400">
            via {modelUsed}
          </span>
        )}
      </div>

      {/* Headlines banner */}
      {headlines.length > 0 && (
        <div className="border-b border-gray-100 bg-gray-50 px-4 py-1.5 text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
          <strong>Today&apos;s headlines:</strong>{" "}
          {headlines.join(" • ")}
        </div>
      )}

      {/* Main content — editor is always mounted to preserve CodeMirror state */}
      <div className={`flex min-h-0 flex-1 ${viewMode !== "editor" ? "hidden" : ""}`}>
        {/* Left: CodeMirror editor */}
        <div
          ref={editorRef}
          className="w-1/2 overflow-auto border-r border-gray-200 [scroll-behavior:auto] dark:border-gray-700"
        />
        {/* Right: Story preview */}
        <div className="w-1/2 overflow-auto p-4 [scroll-behavior:auto]">
          <StoryEditorPreview story={parsedStory} />
        </div>
      </div>

      {viewMode === "play" && (
        <div className="min-h-0 flex-1 overflow-auto">
          <StoryProgress
            key={playKey}
            story={storyData}
            settings={{
              hide_questions: false,
              show_all: false,
              show_names: false,
              rtl: false,
              highlight_name: highlightName,
              hideNonHighlighted: hideNonHighlighted,
              setHighlightName: setHighlightName,
              setHideNonHighlighted: setHideNonHighlighted,
              id: 0,
              show_title_page: true,
            }}
            onEnd={() => {
              console.log("[news-test] Story completed!");
              setViewMode("editor");
            }}
          />
        </div>
      )}
    </div>
  );
}
