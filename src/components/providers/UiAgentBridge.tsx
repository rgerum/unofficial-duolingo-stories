"use client";

import { useEffect } from "react";

/**
 * Development only: connects UI SDK's agent bridge so an agent can read and
 * drive the page's UI SDK components. Exposes it as `window.uiAgent`
 * (`snapshot()`, `query()`, `act()`) and, in browsers with WebMCP, registers
 * the same tools with the browser's agent.
 */
export default function UiAgentBridge() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    let unregister: (() => void) | undefined;
    let cancelled = false;
    import("@ui-sdk/react/agent").then(({ createAgent, registerTools }) => {
      if (cancelled) return;
      const agent = createAgent();
      (window as typeof window & { uiAgent?: typeof agent }).uiAgent = agent;
      unregister = registerTools(agent, {
        allow: (step) =>
          step.action !== "press" ||
          window.confirm(`Let the agent press "${step.label ?? step.ref}"?`),
      });
    });
    return () => {
      cancelled = true;
      unregister?.();
    };
  }, []);
  return null;
}
