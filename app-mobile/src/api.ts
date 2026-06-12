import { anyApi } from "convex/server";
// Type-only import: erased at runtime, so Metro never crosses the repo
// boundary — while tsc still checks every query/mutation against the real
// generated Convex API (convex/_generated/api.d.ts at the repo root).
import type { api as GeneratedApi } from "../../convex/_generated/api";

// The generated api.js is itself just `anyApi`; this is the same object with
// the same types, minus the cross-package runtime import.
export const api = anyApi as unknown as typeof GeneratedApi;
