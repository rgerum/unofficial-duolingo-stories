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

  if (findings.length === 0) {
    return (
      <div className="my-3 rounded-[10px] border border-[#bbf7d0] bg-[#f0fdf4] px-[14px] py-2 text-[0.9rem] text-[#166534]">
        ✓ Story checks passed
      </div>
    );
  }

  const counts = SEVERITY_ORDER.map((severity) => ({
    severity,
    count: findings.filter((f) => f.severity === severity).length,
  })).filter((entry) => entry.count > 0);

  return (
    <div className="my-3 rounded-[10px] border border-[var(--header-border)] bg-[var(--body-background)]">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center gap-2 px-[14px] py-2 text-left"
        onClick={() => setExpanded((value) => !value)}
      >
        <span className="text-[0.92rem] font-bold tracking-[0.02em] uppercase text-[var(--text-color)]">
          Story checks
        </span>
        {counts.map(({ severity, count }) => (
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
        ))}
        <span className="ml-auto text-[0.8rem] text-[var(--text-color-dim)]">
          {expanded ? "hide" : "show"}
        </span>
      </button>
      {expanded ? (
        <ul className="border-t border-[var(--header-border)] px-2 py-1">
          {findings.map((finding, i) => (
            <li key={i}>
              <div
                className={cn(
                  "flex items-baseline gap-2 rounded-lg px-2 py-[6px] text-[0.9rem] text-[var(--text-color)]",
                  finding.lineNumber !== undefined &&
                    "cursor-pointer hover:bg-[color:color-mix(in_srgb,var(--overview-hr)_35%,var(--body-background))]",
                )}
                onClick={
                  finding.lineNumber !== undefined
                    ? () =>
                        editorState?.select(String(finding.lineNumber), false)
                    : undefined
                }
              >
                <span
                  className={cn(
                    "mt-[2px] h-2 w-2 shrink-0 self-center rounded-full",
                    SEVERITY_STYLES[finding.severity].dot,
                  )}
                />
                <span className="min-w-0 grow">{finding.message}</span>
                {finding.lineNumber !== undefined ? (
                  <span className="shrink-0 text-[0.8rem] text-[var(--text-color-dim)]">
                    Line {finding.lineNumber}
                  </span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
