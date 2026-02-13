console.error(
  "Retired: story_done migration requires preserving per-row user_id, but done writes now derive user from session identity.",
);
console.error(
  "Use a one-off internal/admin migration path if you need to backfill historical story_done rows.",
);
process.exit(1);
