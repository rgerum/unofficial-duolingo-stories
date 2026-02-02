/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as courses from "../courses.js";
import type * as editor from "../editor.js";
import type * as images from "../images.js";
import type * as languages from "../languages.js";
import type * as localizations from "../localizations.js";
import type * as migrations from "../migrations.js";
import type * as stats from "../stats.js";
import type * as stories from "../stories.js";
import type * as storyApprovals from "../storyApprovals.js";
import type * as storyCompletions from "../storyCompletions.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  courses: typeof courses;
  editor: typeof editor;
  images: typeof images;
  languages: typeof languages;
  localizations: typeof localizations;
  migrations: typeof migrations;
  stats: typeof stats;
  stories: typeof stories;
  storyApprovals: typeof storyApprovals;
  storyCompletions: typeof storyCompletions;
  users: typeof users;
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

export declare const components: {};
