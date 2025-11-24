import { query } from "./_generated/server";
import { v } from "convex/values";

// Get all versions for a prompt
export const list = query({
  args: { promptId: v.id("prompts") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("versions")
      .withIndex("by_promptId_and_timestamp", (q) =>
        q.eq("promptId", args.promptId)
      )
      .order("desc")
      .collect();
  },
});
