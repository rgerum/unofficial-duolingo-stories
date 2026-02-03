"use no memo";
import React from "react";
import styles from "./TextMarkerEditor.module.css";

interface TextMarkerEditorProps {
  text: string;
  markers: number[]; // Array of character positions where cuts occur
  onMarkersChange: (markers: number[]) => void;
}

/**
 * Interactive component for manually setting text cut markers.
 * Users click between characters to add/remove markers.
 * Used for languages like Chinese where automatic word splitting doesn't work.
 */
export default function TextMarkerEditor({
  text,
  markers,
  onMarkersChange,
}: TextMarkerEditorProps) {
  const toggleMarker = (position: number) => {
    if (markers.includes(position)) {
      // Remove marker
      onMarkersChange(markers.filter((m) => m !== position));
    } else {
      // Add marker and sort
      onMarkersChange([...markers, position].sort((a, b) => a - b));
    }
  };

  // Generate preview of segments based on current markers
  const getSegments = (): string[] => {
    if (markers.length === 0) return [text];

    const segments: string[] = [];
    let lastPos = 0;
    const sortedMarkers = [...markers].sort((a, b) => a - b);

    for (const markerPos of sortedMarkers) {
      if (markerPos > lastPos && markerPos <= text.length) {
        segments.push(text.substring(lastPos, markerPos));
        lastPos = markerPos;
      }
    }
    // Add remaining text
    if (lastPos < text.length) {
      segments.push(text.substring(lastPos));
    }
    return segments;
  };

  const segments = getSegments();

  return (
    <div className={styles.container}>
      <div className={styles.label}>
        Click between characters to set cut markers:
      </div>
      <div className={styles.textEditor}>
        {text.split("").map((char, index) => (
          <React.Fragment key={index}>
            {/* Clickable gap before each character (except first) */}
            {index > 0 && (
              <button
                className={`${styles.gap} ${markers.includes(index) ? styles.activeGap : ""}`}
                onClick={() => toggleMarker(index)}
                title={
                  markers.includes(index) ? "Remove marker" : "Add marker"
                }
                type="button"
              >
                <span className={styles.gapLine} />
              </button>
            )}
            <span className={styles.char}>{char}</span>
          </React.Fragment>
        ))}
      </div>
      <div className={styles.preview}>
        <span className={styles.previewLabel}>Segments ({segments.length}):</span>
        {segments.map((segment, index) => (
          <span key={index} className={styles.segment}>
            {segment}
          </span>
        ))}
      </div>
    </div>
  );
}
