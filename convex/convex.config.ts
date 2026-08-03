import { defineApp } from "convex/server";
import { v } from "convex/values";
import aggregate from "@convex-dev/aggregate/convex.config";
import betterAuth from "./betterAuth/convex.config";

const app = defineApp({
  env: {
    DISCORD_TOKEN: v.optional(v.string()),
    DISCORD_BOT_TOKEN: v.optional(v.string()),
    DISCORD_ANNOUNCEMENTS_CHANNEL_ID: v.optional(v.string()),
  },
});

app.use(betterAuth);
app.use(aggregate, { name: "storyReadsByCourse" });
app.use(aggregate, { name: "readersByCourse" });

export default app;
