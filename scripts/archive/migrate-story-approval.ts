console.error(
  "Retired: story_approval migration requires preserving per-row user_id, but approval writes now derive user from session identity.",
);
console.error(
  "Use a one-off internal/admin migration path if you need to backfill historical story_approval rows.",
);
process.exit(1);
