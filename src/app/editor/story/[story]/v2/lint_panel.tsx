"use client";
import React from "react";
import type { EditorStateType } from "@/app/editor/story/[story]/editor_state";
import type { LintFinding, LintSeverity } from "@/lib/editor/lint";
import { cn } from "@/lib/utils";

const SEVERITY_ORDER: LintSeverity[] = ["error", "warning", "info"];

const SEVERITY_STYLES: Record<
  LintSeverity,
  { label: string; chip: string; dot: string }
> = {
  error: {
    label: "error",
    chip: "bg-[#fee2e2] text-[#991b1b]",
    dot: "bg-[#dc2626]",
  },
  warning: {
    label: "warning",
    chip: "bg-[#fed7aa] text-[#9a3412]",
    dot: "bg-[#d97706]",
  },
  info: {
    label: "info",
    chip: "bg-[#e0f2fe] text-[#075985]",
    dot: "bg-[#0284c7]",
  },
};

export function LintPanel({
  findings,
  editorState,
}: {
  findings: LintFinding[];
  editorState?: EditorStateType;
}) {
  const [expanded, setExpanded] = React.useState(false);

  const counts = SEVERITY_ORDER.map((severity) => ({
    severity,
    count: findings.filter((f) => f.severity === severity).length,
  })).filter((entry) => entry.count > 0);

  const jumpToLine = (lineNumber?: number) => {
    if (lineNumber === undefined || !editorState) return;
    // scroll the editor to the line, then place the cursor there (the cursor
    // update also syncs the preview highlight)
    editorState.select(String(lineNumber), true);
    editorState.select(String(lineNumber), false);
  };

  return (
    <div className="fixed right-4 bottom-4 z-40 flex flex-col items-end">
      {expanded && findings.length > 0 ? (
        <div className="mb-2 flex max-h-[50vh] w-[420px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[10px] border border-[var(--header-border)] bg-[var(--body-background)] shadow-lg">
          <div className="flex items-center gap-2 border-b border-[var(--header-border)] px-3 py-2">
            <span className="text-[0.85rem] font-bold tracking-[0.02em] uppercase text-[var(--text-color)]">
              Story checks
            </span>
            <span className="ml-auto text-[0.8rem] text-[var(--text-color-dim)]">
              click a finding to jump to its line
            </span>
          </div>
          <ul className="overflow-y-auto px-2 py-1">
            {findings.map((finding, i) => {
              const rowClass =
                "flex items-baseline gap-2 rounded-lg px-2 py-[6px] text-[0.9rem] text-[var(--text-color)]";
              const content = (
                <>
                  <span
                    className={cn(
                      "h-2 w-2 shrink-0 self-center rounded-full",
                      SEVERITY_STYLES[finding.severity].dot,
                    )}
                  />
                  <span className="min-w-0 grow">{finding.message}</span>
                  {finding.lineNumber !== undefined ? (
                    <span className="shrink-0 text-[0.8rem] text-[var(--text-color-dim)]">
                      Line {finding.lineNumber}
                    </span>
                  ) : null}
                </>
              );
              return (
                <li key={i}>
                  {finding.lineNumber !== undefined ? (
                    <button
                      type="button"
                      className={cn(
                        rowClass,
                        "w-full cursor-pointer text-left hover:bg-[color:color-mix(in_srgb,var(--overview-hr)_35%,var(--body-background))]",
                      )}
                      onClick={() => jumpToLine(finding.lineNumber)}
                    >
                      {content}
                    </button>
                  ) : (
                    <div className={rowClass}>{content}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
      <button
        type="button"
        className="flex cursor-pointer items-center gap-2 rounded-full border border-[var(--header-border)] bg-[var(--body-background)] px-3 py-[6px] shadow-lg"
        onClick={() => setExpanded((value) => !value)}
        title={expanded ? "Hide story checks" : "Show story checks"}
      >
        <span className="text-[0.85rem] font-bold tracking-[0.02em] uppercase text-[var(--text-color)]">
          Checks
        </span>
        {findings.length === 0 ? (
          <span className="rounded-full bg-[#dcfce7] px-2 py-[2px] text-[0.8rem] font-semibold text-[#166534]">
            ✓ passed
          </span>
        ) : (
          counts.map(({ severity, count }) => (
            <span
              key={severity}
              className={cn(
                "rounded-full px-2 py-[2px] text-[0.8rem] font-semibold",
                SEVERITY_STYLES[severity].chip,
              )}
            >
              {count} {SEVERITY_STYLES[severity].label}
              {count === 1 ? "" : "s"}
            </span>
          ))
        )}
      </button>
    </div>
  );
}
