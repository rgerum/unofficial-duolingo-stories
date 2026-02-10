import { action, query } from "./_generated/server";
import { v } from "convex/values";
import { api, components } from "./_generated/api";

const PAGE_SIZE = 200;

export const listLegacyUsersForRoleSync = query({
  args: {
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async () => {
    // Legacy users table has been removed from app schema.
    return {
      page: [],
      isDone: true,
      continueCursor: null,
    };
  },
});

export const syncBetterAuthRoles = action({
  args: {
    dryRun: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? false;
    const limit = args.limit ?? PAGE_SIZE;
    let cursor: string | undefined = undefined;

    let total = 0;
    let updated = 0;
    let skipped = 0;
    let missing = 0;

    while (true) {
      const pageResult = (await ctx.runQuery(
        api.authMigration.listLegacyUsersForRoleSync,
        { cursor: cursor ?? undefined, limit },
      )) as {
        page: Array<{ email?: string; admin?: boolean; role?: boolean }>;
        isDone: boolean;
        continueCursor?: string | null;
      };

      for (const legacyUser of pageResult.page) {
        total += 1;

        if (!legacyUser.email) {
          skipped += 1;
          continue;
        }

        let desiredRole: string | null = null;
        if (legacyUser.admin) {
          desiredRole = "admin";
        } else if (legacyUser.role) {
          desiredRole = "contributor";
        }

        if (!desiredRole) {
          skipped += 1;
          continue;
        }

        const authUser = await ctx.runQuery(
          components.betterAuth.adapter.findOne,
          {
            model: "user",
            where: [
              {
                field: "email",
                value: legacyUser.email.toLowerCase(),
              },
            ],
          },
        );

        if (!authUser) {
          missing += 1;
          continue;
        }

        const authRole = Array.isArray(authUser.role)
          ? authUser.role[0]
          : authUser.role;

        if (authRole === desiredRole) {
          skipped += 1;
          continue;
        }

        if (!dryRun) {
          await ctx.runMutation(components.betterAuth.adapter.updateOne, {
            input: {
              model: "user",
              where: [
                {
                  field: "_id",
                  value: (authUser as { _id: string })._id,
                },
              ],
              update: { role: desiredRole } as any,
            },
          });
        }

        updated += 1;
      }

      if (pageResult.isDone) {
        break;
      }

      cursor = pageResult.continueCursor ?? undefined;
    }

    return {
      dryRun,
      total,
      updated,
      skipped,
      missing,
    };
  },
});

function normalizeUsername(input: string): string {
  const lower = input.trim().toLowerCase();
  const cleaned = lower.replace(/[^a-z0-9_-]/g, "_");
  if (cleaned.length >= 3) return cleaned;
  return `${cleaned || "user"}_${Math.random().toString(36).slice(2, 6)}`;
}

export const migrateLegacyUsersToBetterAuth = action({
  args: {
    dryRun: v.optional(v.boolean()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? false;
    const limit = args.limit ?? PAGE_SIZE;
    const cursor = args.cursor ?? undefined;

    let total = 0;
    let created = 0;
    let skipped = 0;
    let missingPassword = 0;
    let accountsCreated = 0;
    let accountsFailed = 0;
    const errors: Array<{
      email?: string;
      legacyId?: number;
      step: string;
      message: string;
    }> = [];

    const pageResult = (await ctx.runQuery(
      api.authMigration.listLegacyUsersForRoleSync,
      { cursor, limit },
    )) as {
      page: Array<{
        legacyId?: number;
        name?: string;
        email?: string;
        image?: string;
        emailVerified?: number;
        password?: string;
        regdate?: number;
      }>;
      isDone: boolean;
      continueCursor?: string | null;
    };

    for (const legacyUser of pageResult.page) {
      total += 1;
      if (!legacyUser.email) {
        skipped += 1;
        continue;
      }

      const email = legacyUser.email.toLowerCase();
      const existing = await ctx.runQuery(
        components.betterAuth.adapter.findOne,
        {
          model: "user",
          where: [
            {
              field: "email",
              value: email,
            },
          ],
        },
      );

      if (existing) {
        skipped += 1;
        continue;
      }

      const createdAt = (() => {
        if (typeof legacyUser.regdate !== "number") {
          return Date.now();
        }
        return legacyUser.regdate > 1_000_000_000_000
          ? legacyUser.regdate
          : legacyUser.regdate * 1000;
      })();
      const displayUsername = legacyUser.name || email.split("@")[0] || email;
      const baseUsername = normalizeUsername(displayUsername);
      const suffix = legacyUser.legacyId
        ? `_${legacyUser.legacyId}`
        : `_${Math.random().toString(36).slice(2, 10)}`;
      const username = `${baseUsername}${suffix}`;

      if (!dryRun) {
        let newUser:
          | { _id: string }
          | null
          | undefined = undefined;

        try {
          newUser = await ctx.runMutation(
            components.betterAuth.adapter.create,
            {
              input: {
                model: "user",
                data: {
                  createdAt,
                  updatedAt: createdAt,
                  email,
                  emailVerified: Boolean(legacyUser.emailVerified),
                  name: displayUsername,
                  image: legacyUser.image ?? null,
                  username,
                  displayUsername,
                },
              },
            },
          );
        } catch (error: any) {
          errors.push({
            email,
            legacyId: legacyUser.legacyId,
            step: "createUser",
            message: String(error?.message || error),
          });
        }

        const newUserId =
          (newUser as { _id?: string } | null | undefined)?._id ??
          (await ctx.runQuery(components.betterAuth.adapter.findOne, {
            model: "user",
            where: [{ field: "email", value: email }],
          }))?._id;

        if (!newUserId) {
          skipped += 1;
          continue;
        }

        if (legacyUser.password) {
          try {
            await ctx.runMutation(components.betterAuth.adapter.create, {
              input: {
                model: "account",
                data: {
                  accountId: newUserId,
                  providerId: "credential",
                  password: legacyUser.password,
                  userId: newUserId,
                  createdAt,
                  updatedAt: createdAt,
                },
              },
            });
          } catch (error: any) {
            errors.push({
              email,
              legacyId: legacyUser.legacyId,
              step: "createAccount",
              message: String(error?.message || error),
            });
          }
        } else {
          missingPassword += 1;
        }
      } else if (!legacyUser.password) {
        missingPassword += 1;
      }

      created += 1;
    }

    return {
      dryRun,
      total,
      created,
      skipped,
      missingPassword,
      errors,
      continueCursor: pageResult.continueCursor ?? undefined,
      isDone: pageResult.isDone,
    };
  },
});

const betterAuthUserInput = v.object({
  legacyId: v.number(),
  email: v.string(),
  name: v.string(),
  username: v.string(),
  displayUsername: v.string(),
  image: v.optional(v.union(v.null(), v.string())),
  emailVerified: v.optional(v.boolean()),
  createdAt: v.number(),
  password: v.optional(v.string()),
});

const betterAuthAccountInput = v.object({
  legacyAccountId: v.number(),
  legacyUserId: v.number(),
  providerId: v.string(),
  providerAccountId: v.optional(v.union(v.null(), v.string())),
  accessToken: v.optional(v.string()),
  refreshToken: v.optional(v.string()),
  expiresAt: v.optional(v.number()),
  tokenType: v.optional(v.string()),
  scope: v.optional(v.string()),
  idToken: v.optional(v.string()),
  sessionState: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
  accountType: v.optional(v.string()),
});

export const importBetterAuthUsersBatch = action({
  args: {
    users: v.array(betterAuthUserInput),
    verbose: v.optional(v.boolean()),
    fastPath: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const users = args.users;
    const verbose = args.verbose ?? false;
    const fastPath = args.fastPath ?? false;
    if (verbose) {
      console.log(
        `[importBetterAuthUsersBatch] received ${users.length} users`,
        users[0]?.email ? `first=${users[0].email}` : "",
      );
    }
    let created = 0;
    let skipped = 0;
    let missingPassword = 0;
    let accountsCreated = 0;
    let accountsFailed = 0;
    const errors: Array<{
      email: string;
      legacyId: number;
      step: string;
      message: string;
    }> = [];

    const existingEmails = new Set<string>();

    for (const user of users) {
      const email = user.email.toLowerCase();
      if (existingEmails.has(email)) {
        skipped += 1;
        continue;
      }
      existingEmails.add(email);

      let newUserId: string | undefined;
      let didCreate = false;
      try {
        const newUser = await ctx.runMutation(
          components.betterAuth.adapter.create,
          {
            input: {
              model: "user",
              data: {
                createdAt: user.createdAt,
                updatedAt: user.createdAt,
                email,
                emailVerified: Boolean(user.emailVerified),
                name: user.name,
                image: user.image ?? null,
                username: user.username,
                displayUsername: user.displayUsername,
                userId: String(user.legacyId),
              },
            },
          },
        );
        if (verbose) {
          console.log(
            `[importBetterAuthUsersBatch] create user email=${email} id=${(newUser as { _id?: string } | null)?._id ?? "null"}`,
          );
        }
        newUserId = (newUser as { _id?: string } | null)?._id ?? undefined;
        didCreate = Boolean(newUserId);
      } catch (error: any) {
        const message = String(error?.message || error);
        if (verbose) {
          console.log(
            `[importBetterAuthUsersBatch] create user error email=${email} message=${message}`,
          );
        }
        if (message.includes("email already exists")) {
          skipped += 1;
          if (fastPath) {
            continue;
          }
          let existing = await ctx.runQuery(
            components.betterAuth.adapter.findOne,
            {
              model: "user",
              where: [
                {
                  field: "email",
                  value: email,
                },
              ],
            },
          );
          if (!existing?._id) {
            existing = await ctx.runQuery(components.betterAuth.adapter.findOne, {
              model: "user",
              where: [
                {
                  field: "userId",
                  value: String(user.legacyId),
                },
              ],
            });
          }
          if (existing?._id) {
            newUserId = existing._id;
            const existingUserId =
              (existing as { userId?: string | null }).userId ?? null;
            if (!existingUserId) {
              try {
                await ctx.runMutation(components.betterAuth.adapter.updateOne, {
                  input: {
                    model: "user",
                    where: [
                      {
                        field: "_id",
                        value: existing._id,
                      },
                    ],
                    update: { userId: String(user.legacyId) } as any,
                  },
                });
              } catch (updateError: any) {
                errors.push({
                  email,
                  legacyId: user.legacyId,
                  step: "updateExistingUserId",
                  message: String(updateError?.message || updateError),
                });
              }
            }
          }
          if (!newUserId) {
            errors.push({
              email,
              legacyId: user.legacyId,
              step: "findExistingUser",
              message: "User exists but could not be fetched by email/userId.",
            });
          }
        } else {
          errors.push({
            email,
            legacyId: user.legacyId,
            step: "createUser",
            message,
          });
        }
        if (!newUserId) {
          continue;
        }
      }

      if (!newUserId) {
        continue;
      }

      if (user.password) {
        try {
          if (!fastPath) {
            const existingAccount = await ctx.runQuery(
              components.betterAuth.adapter.findOne,
              {
                model: "account",
                where: [
                  {
                    field: "userId",
                    value: newUserId,
                  },
                  {
                    field: "providerId",
                    value: "credential",
                  },
                ],
              },
            );
            if (existingAccount) {
              continue;
            }
          }
          await ctx.runMutation(components.betterAuth.adapter.create, {
            input: {
              model: "account",
              data: {
                accountId: newUserId,
                providerId: "credential",
                password: user.password,
                userId: newUserId,
                createdAt: user.createdAt,
                updatedAt: user.createdAt,
              },
            },
          });
          accountsCreated += 1;
        } catch (error: any) {
          const message = String(error?.message || error);
          if (fastPath && message.includes("already exists")) {
            continue;
          }
          accountsFailed += 1;
          errors.push({
            email,
            legacyId: user.legacyId,
            step: "createAccount",
            message,
          });
        }
      } else {
        missingPassword += 1;
      }

      if (didCreate) {
        created += 1;
      }
    }

    return {
      created,
      skipped,
      missingPassword,
      accountsCreated,
      accountsFailed,
      errors,
    };
  },
});

export const importBetterAuthAccountsBatch = action({
  args: {
    accounts: v.array(betterAuthAccountInput),
    verbose: v.optional(v.boolean()),
    fastPath: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const accounts = args.accounts;
    const verbose = args.verbose ?? false;
    const fastPath = args.fastPath ?? false;
    if (verbose) {
      console.log(
        `[importBetterAuthAccountsBatch] received ${accounts.length} accounts`,
      );
    }

    let created = 0;
    let skipped = 0;
    let missingUser = 0;
    const errors: Array<{
      providerId: string;
      legacyUserId: number;
      legacyAccountId: number;
      step: string;
      message: string;
    }> = [];

    for (const account of accounts) {
      if (!account.providerAccountId) {
        skipped += 1;
        continue;
      }
      let authUser = await ctx.runQuery(
        components.betterAuth.adapter.findOne,
        {
          model: "user",
          where: [
            {
              field: "userId",
              value: String(account.legacyUserId),
            },
          ],
        },
      );

      if (!authUser?._id) {
        missingUser += 1;
        continue;
      }

      const authUserId = (authUser as { _id: string })._id;

      if (!fastPath) {
        const existingAccount = await ctx.runQuery(
          components.betterAuth.adapter.findOne,
          {
            model: "account",
            where: [
              {
                field: "userId",
                value: authUserId,
              },
              {
                field: "providerId",
                value: account.providerId,
              },
              ...(account.providerAccountId
                ? [
                    {
                      field: "accountId",
                      value: account.providerAccountId,
                    },
                  ]
                : []),
            ],
          },
        );
        if (existingAccount) {
          skipped += 1;
          continue;
        }
      }

      try {
        await ctx.runMutation(components.betterAuth.adapter.create, {
          input: {
            model: "account",
            data: {
              userId: authUserId,
              providerId: account.providerId,
              accountId: account.providerAccountId,
              accessToken: account.accessToken,
              refreshToken: account.refreshToken,
              accessTokenExpiresAt: account.expiresAt,
              scope: account.scope,
              idToken: account.idToken,
              createdAt: account.createdAt,
              updatedAt: account.updatedAt,
            } as any,
          },
        });
        created += 1;
      } catch (error: any) {
        const message = String(error?.message || error);
        if (fastPath && message.includes("already exists")) {
          skipped += 1;
          continue;
        }
        errors.push({
          providerId: account.providerId,
          legacyUserId: account.legacyUserId,
          legacyAccountId: account.legacyAccountId,
          step: "createAccount",
          message,
        });
      }
    }

    return { created, skipped, missingUser, errors };
  },
});

export const clearBetterAuthData = action({
  args: {
    confirm: v.boolean(),
  },
  handler: async (ctx, args) => {
    if (!args.confirm) {
      throw new Error("clearBetterAuthData requires confirm=true");
    }

    const models: Array<
      "session" | "account" | "verification" | "jwks" | "user"
    > = ["session", "account", "verification", "jwks", "user"];

    for (const model of models) {
      while (true) {
        const result = (await ctx.runMutation(
          components.betterAuth.adapter.deleteMany,
          {
            input: { model },
            paginationOpts: {
              cursor: null,
              numItems: 1000,
            },
          },
        )) as { count?: number };
        if (!result?.count) {
          break;
        }
      }
    }

    return { ok: true };
  },
});

export const debugBetterAuthAccount = action({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase();
    const user = await ctx.runQuery(components.betterAuth.adapter.findOne, {
      model: "user",
      where: [{ field: "email", value: email }],
    });
    if (!user?._id) {
      return { foundUser: false, foundAccount: false };
    }
    const account = await ctx.runQuery(components.betterAuth.adapter.findOne, {
      model: "account",
      where: [
        { field: "userId", value: user._id },
        { field: "providerId", value: "credential" },
      ],
    });
    const hash =
      (account as { password?: string | null } | null)?.password ?? null;
    return {
      foundUser: true,
      foundAccount: Boolean(account),
      hashPrefix: hash ? hash.slice(0, 4) : null,
      hashLength: hash ? hash.length : null,
    };
  },
});
