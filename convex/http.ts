import { httpRouter } from "convex/server";
import {
  getDiscordCombineData,
  setContributorWriteByDiscordAccountId,
} from "./discordBot";
import { authComponent, createAuth } from "./betterAuth/auth";

const http = httpRouter();

authComponent.registerRoutes(http, createAuth);
http.route({
  path: "/discord/set-contributor-write",
  method: "POST",
  handler: setContributorWriteByDiscordAccountId,
});
http.route({
  path: "/discord/combine-data",
  method: "POST",
  handler: getDiscordCombineData,
});

export default http;
