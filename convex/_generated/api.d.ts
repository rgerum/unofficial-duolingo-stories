/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as adminData from "../adminData.js";
import type * as adminStoryWrite from "../adminStoryWrite.js";
import type * as adminWrite from "../adminWrite.js";
import type * as audioRead from "../audioRead.js";
import type * as auth from "../auth.js";
import type * as authFunctions from "../authFunctions.js";
import type * as authMigration from "../authMigration.js";
import type * as courseContributorBackfill from "../courseContributorBackfill.js";
import type * as courseWrite from "../courseWrite.js";
import type * as discordAvatarSync from "../discordAvatarSync.js";
import type * as discordBot from "../discordBot.js";
import type * as discordData from "../discordData.js";
import type * as discordRoleSync from "../discordRoleSync.js";
import type * as editorRead from "../editorRead.js";
import type * as editorSideEffects from "../editorSideEffects.js";
import type * as http from "../http.js";
import type * as landing from "../landing.js";
import type * as languageWrite from "../languageWrite.js";
import type * as lib_authorization from "../lib/authorization.js";
import type * as lib_courseContributors from "../lib/courseContributors.js";
import type * as lib_courseCounts from "../lib/courseCounts.js";
import type * as lib_discordAvatarSync from "../lib/discordAvatarSync.js";
import type * as lib_phpbb from "../lib/phpbb.js";
import type * as localization from "../localization.js";
import type * as localizationWrite from "../localizationWrite.js";
import type * as lookupTables from "../lookupTables.js";
import type * as roles from "../roles.js";
import type * as storyApproval from "../storyApproval.js";
import type * as storyDone from "../storyDone.js";
import type * as storyRead from "../storyRead.js";
import type * as storyTables from "../storyTables.js";
import type * as storyWrite from "../storyWrite.js";
import type * as userPreferences from "../userPreferences.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  adminData: typeof adminData;
  adminStoryWrite: typeof adminStoryWrite;
  adminWrite: typeof adminWrite;
  audioRead: typeof audioRead;
  auth: typeof auth;
  authFunctions: typeof authFunctions;
  authMigration: typeof authMigration;
  courseContributorBackfill: typeof courseContributorBackfill;
  courseWrite: typeof courseWrite;
  discordAvatarSync: typeof discordAvatarSync;
  discordBot: typeof discordBot;
  discordData: typeof discordData;
  discordRoleSync: typeof discordRoleSync;
  editorRead: typeof editorRead;
  editorSideEffects: typeof editorSideEffects;
  http: typeof http;
  landing: typeof landing;
  languageWrite: typeof languageWrite;
  "lib/authorization": typeof lib_authorization;
  "lib/courseContributors": typeof lib_courseContributors;
  "lib/courseCounts": typeof lib_courseCounts;
  "lib/discordAvatarSync": typeof lib_discordAvatarSync;
  "lib/phpbb": typeof lib_phpbb;
  localization: typeof localization;
  localizationWrite: typeof localizationWrite;
  lookupTables: typeof lookupTables;
  roles: typeof roles;
  storyApproval: typeof storyApproval;
  storyDone: typeof storyDone;
  storyRead: typeof storyRead;
  storyTables: typeof storyTables;
  storyWrite: typeof storyWrite;
  userPreferences: typeof userPreferences;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("../betterAuth/_generated/component.js").ComponentApi<"betterAuth">;
};
