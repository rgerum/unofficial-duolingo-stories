import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Generate French news stories daily at 6:00 UTC
crons.cron(
  "generate french news stories",
  "0 6 * * *",
  internal.newsStoriesAction.generateDailyStories,
  { language: "fr", fromLanguage: "en" },
);

export default crons;
