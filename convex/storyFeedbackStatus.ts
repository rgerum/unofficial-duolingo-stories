import { v } from "convex/values";

export const feedbackStatuses = [
  "open",
  "reviewed",
  "resolved",
  "not_relevant",
  "spam",
] as const;

export type FeedbackStatus = (typeof feedbackStatuses)[number];

export const feedbackStatusValidator = v.union(
  v.literal("open"),
  v.literal("reviewed"),
  v.literal("resolved"),
  v.literal("not_relevant"),
  v.literal("spam"),
);
