"use client";

import React from "react";
import { useActionState } from "react";
import { generatePreviewAction, type PreviewActionState } from "./actions";

export default function ElevenLabsAgentTestClient() {
  const initialState: PreviewActionState = {};
  const [result, formAction, pending] = useActionState(
    generatePreviewAction,
    initialState,
  );

  const audioSrc = result?.audioBase64
    ? `data:audio/mpeg;base64,${result.audioBase64}`
    : null;

  return (
    <main style={{ maxWidth: 900, margin: "2rem auto", padding: "0 1rem" }}>
      <h1>ElevenLabs Multi-Voice Test</h1>
      <p>
        Enter a story ID and number of lines. The backend pulls the first lines
        and calls ElevenLabs Text-to-Dialogue with per-line voice IDs.
      </p>
      <p>
        Default speaker mapping: Narrator -&gt; CwhRBWXzGAHq8TQ4Fs17, Vikram
        -&gt; onwK4e9ZLuTAKqWW03F9, Priti -&gt; FGY2WhTYpPnrIDTdsKH5.
      </p>
      <form action={formAction} style={{ display: "grid", gap: "0.75rem" }}>
        <label>
          Story ID
          <input
            defaultValue="3170"
            inputMode="numeric"
            required
            name="storyId"
            style={{ display: "block", width: "100%", padding: "0.5rem" }}
          />
        </label>

        <label>
          Number of lines (1-20)
          <input
            defaultValue="5"
            inputMode="numeric"
            required
            name="lineCount"
            style={{ display: "block", width: "100%", padding: "0.5rem" }}
          />
        </label>

        <button
          type="submit"
          disabled={pending}
          style={{ width: 200, padding: "0.6rem" }}
        >
          {pending ? "Generating..." : "Generate Preview"}
        </button>
      </form>

      {result?.error && (
        <p style={{ color: "crimson", marginTop: "1rem" }}>
          Error: {result.error}
        </p>
      )}

      {audioSrc && (
        <section style={{ marginTop: "1.25rem" }}>
          <h2>Audio</h2>
          <audio controls src={audioSrc} style={{ width: "100%" }} />
        </section>
      )}

      {result?.lines && result.lines.length > 0 && (
        <section style={{ marginTop: "1.25rem" }}>
          <h2>Extracted Lines</h2>
          <ol>
            {result.lines.map((line, index) => (
              <li key={`${line.speaker}-${index}`}>
                <strong>
                  {line.speaker} ({line.voiceId}):
                </strong>{" "}
                {line.text}
              </li>
            ))}
          </ol>
        </section>
      )}

      {result?.transcript && (
        <section style={{ marginTop: "1.25rem" }}>
          <h2>Request Payload Preview</h2>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              background: "#f5f5f5",
              padding: "0.75rem",
              borderRadius: 6,
            }}
          >
            {result.transcript}
          </pre>
        </section>
      )}

      {result?.events && result.events.length > 0 && (
        <section style={{ marginTop: "1.25rem" }}>
          <h2>Generation Status</h2>
          <code>{result.events.join(" -> ")}</code>
        </section>
      )}
    </main>
  );
}
