"use node";

import { Octokit } from "@octokit/rest";
import { PostHog } from "posthog-node";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";

const CONTENT_REPOSITORY = "rgerum/unofficial-duolingo-stories-content";

let octokitClient: Octokit | null = null;

function getOctokit() {
  const token = process.env.GITHUB_REPO_TOKEN;
  if (!token) return null;
  if (!octokitClient) {
    octokitClient = new Octokit({ auth: token });
  }
  return octokitClient;
}

async function uploadWithDiffToGithub(args: {
  repository: string;
  content?: string;
  path: string;
  authorName: string;
  authorEmail: string;
  gitMessage: string;
}) {
  const octokit = getOctokit();
  if (!octokit) return { ok: false as const, reason: "missing_token" as const };

  const [owner, repo] = args.repository.split("/");
  let fileSha: string | undefined;

  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: args.path,
    });
    if (!Array.isArray(data) && "sha" in data) {
      fileSha = data.sha;
    }
  } catch {
    // Missing file is expected for first write.
  }

  const author = {
    name: args.authorName,
    email: args.authorEmail,
  };

  if (!args.content) {
    if (!fileSha) return { ok: true as const };
    await octokit.repos.deleteFile({
      owner,
      repo,
      path: args.path,
      message: args.gitMessage,
      sha: fileSha,
      committer: author,
      author,
    });
    return { ok: true as const };
  }

  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: args.path,
    message: args.gitMessage,
    content: Buffer.from(args.content).toString("base64"),
    sha: fileSha,
    committer: author,
    author,
  });

  return { ok: true as const };
}

function getPosthogClient() {
  const apiKey = process.env.POSTHOG_KEY ?? process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!apiKey) return null;
  return new PostHog(apiKey, {
    host: process.env.POSTHOG_HOST ?? process.env.NEXT_PUBLIC_POSTHOG_HOST,
    flushAt: 1,
    flushInterval: 0,
  });
}

export const onStorySaved = internalAction({
  args: {
    operationKey: v.string(),
    storyId: v.number(),
    storyName: v.string(),
    courseId: v.number(),
    text: v.string(),
    todoCount: v.number(),
    actorName: v.string(),
    actorLegacyUserId: v.number(),
  },
  returns: v.object({
    githubUploaded: v.boolean(),
    posthogTracked: v.boolean(),
  }),
  handler: async (_ctx, args) => {
    let githubUploaded = false;
    let posthogTracked = false;

    const uploadResult = await uploadWithDiffToGithub({
      repository: CONTENT_REPOSITORY,
      content: args.text,
      path: `${args.courseId}/${args.storyId}.txt`,
      authorName: args.actorName,
      authorEmail: `${args.actorName}@carex.uberspace.de`,
      gitMessage: `updated ${args.storyName} in course ${args.courseId}`,
    }).catch((error) => {
      console.error("editorSideEffects:onStorySaved:github", error);
      return { ok: false as const };
    });
    githubUploaded = uploadResult.ok;

    const posthog = getPosthogClient();
    if (posthog) {
      try {
        posthog.capture({
          distinctId: args.actorName || `user_${args.actorLegacyUserId}`,
          event: "story_saved",
          properties: {
            story_id: args.storyId,
            story_name: args.storyName,
            course_id: args.courseId,
            todo_count: args.todoCount,
            editor_username: args.actorName,
          },
        });
        await posthog.shutdown();
        posthogTracked = true;
      } catch (error) {
        console.error("editorSideEffects:onStorySaved:posthog", error);
      }
    }

    return { githubUploaded, posthogTracked };
  },
});

export const onStoryDeleted = internalAction({
  args: {
    operationKey: v.string(),
    storyId: v.number(),
    storyName: v.string(),
    courseId: v.number(),
    actorName: v.string(),
    actorLegacyUserId: v.number(),
  },
  returns: v.object({
    githubUploaded: v.boolean(),
    posthogTracked: v.boolean(),
  }),
  handler: async (_ctx, args) => {
    let githubUploaded = false;
    let posthogTracked = false;

    const uploadResult = await uploadWithDiffToGithub({
      repository: CONTENT_REPOSITORY,
      path: `${args.courseId}/${args.storyId}.txt`,
      authorName: args.actorName,
      authorEmail: `${args.actorName}@carex.uberspace.de`,
      gitMessage: `delete ${args.storyName} from course ${args.courseId}`,
    }).catch((error) => {
      console.error("editorSideEffects:onStoryDeleted:github", error);
      return { ok: false as const };
    });
    githubUploaded = uploadResult.ok;

    const posthog = getPosthogClient();
    if (posthog) {
      try {
        posthog.capture({
          distinctId: args.actorName || `user_${args.actorLegacyUserId}`,
          event: "story_deleted",
          properties: {
            story_id: args.storyId,
            story_name: args.storyName,
            course_id: args.courseId,
            editor_username: args.actorName,
          },
        });
        await posthog.shutdown();
        posthogTracked = true;
      } catch (error) {
        console.error("editorSideEffects:onStoryDeleted:posthog", error);
      }
    }

    return { githubUploaded, posthogTracked };
  },
});

export const onStoryImported = internalAction({
  args: {
    operationKey: v.string(),
    storyId: v.number(),
    storyName: v.string(),
    courseId: v.number(),
    text: v.string(),
    actorName: v.string(),
    actorLegacyUserId: v.number(),
  },
  returns: v.object({
    githubUploaded: v.boolean(),
  }),
  handler: async (_ctx, args) => {
    const uploadResult = await uploadWithDiffToGithub({
      repository: CONTENT_REPOSITORY,
      content: args.text,
      path: `${args.courseId}/${args.storyId}.txt`,
      authorName: args.actorName,
      authorEmail: `${args.actorName}@carex.uberspace.de`,
      gitMessage: `added ${args.storyName} in course ${args.courseId}`,
    }).catch((error) => {
      console.error("editorSideEffects:onStoryImported:github", error);
      return { ok: false as const };
    });

    return { githubUploaded: uploadResult.ok };
  },
});

export const onStoryApprovalToggled = internalAction({
  args: {
    operationKey: v.string(),
    storyId: v.number(),
    action: v.union(v.literal("added"), v.literal("deleted")),
    count: v.number(),
    storyStatus: v.union(v.literal("draft"), v.literal("feedback"), v.literal("finished")),
    finishedInSet: v.number(),
    publishedCount: v.number(),
    actorName: v.string(),
    actorLegacyUserId: v.number(),
  },
  returns: v.object({
    posthogTracked: v.boolean(),
  }),
  handler: async (_ctx, args) => {
    const posthog = getPosthogClient();
    if (!posthog) return { posthogTracked: false };

    try {
      posthog.capture({
        distinctId: args.actorName || `user_${args.actorLegacyUserId}`,
        event: "story_approved",
        properties: {
          story_id: args.storyId,
          action: args.action,
          approval_count: args.count,
          story_status: args.storyStatus,
          finished_in_set: args.finishedInSet,
          stories_published: args.publishedCount,
        },
      });
      await posthog.shutdown();
      return { posthogTracked: true };
    } catch (error) {
      console.error("editorSideEffects:onStoryApprovalToggled:posthog", error);
      return { posthogTracked: false };
    }
  },
});
