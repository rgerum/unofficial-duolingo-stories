import { v } from "convex/values";

export const courseInterestSource = v.union(
  v.literal("web"),
  v.literal("ios"),
  v.literal("android"),
);
