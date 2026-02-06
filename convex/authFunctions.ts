import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { components } from "./_generated/api";

export const onCreate = internalMutation({
  args: {
    model: v.string(),
    doc: v.any(),
  },
  handler: async (ctx, args) => {
    if (args.model !== "user") return;
    const doc = args.doc as { _id: string; userId?: string | null };
    if (doc.userId) return;

    const page = await ctx.runQuery(components.betterAuth.adapter.findMany, {
      model: "user",
      where: [],
      paginationOpts: { cursor: null, numItems: 1000 },
    });

    let maxId = 0;
    for (const user of page.page) {
      const parsed = Number.parseInt((user as any).userId, 10);
      if (!Number.isNaN(parsed) && parsed > maxId) maxId = parsed;
    }

    const nextId = maxId + 1;
    await ctx.runMutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: "user",
        where: [{ field: "_id", value: doc._id }],
        update: { userId: String(nextId) },
      },
    });
  },
});
