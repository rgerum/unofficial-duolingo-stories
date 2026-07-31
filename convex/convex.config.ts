import { defineApp } from "convex/server";
import aggregate from "@convex-dev/aggregate/convex.config";
import betterAuth from "./betterAuth/convex.config";

const app = defineApp();

app.use(betterAuth);
app.use(aggregate, { name: "storyReadsByCourse" });
app.use(aggregate, { name: "readersByCourse" });

export default app;
