import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// List all prompts with optional filtering
export const list = query({
  args: {},
  handler: async (ctx) => {
    const prompts = await ctx.db
      .query("prompts")
      .withIndex("by_updatedAt")
      .order("desc")
      .collect();

    return prompts;
  },
});

// Get a single prompt by ID
export const get = query({
  args: { id: v.id("prompts") },
  handler: async (ctx, args) => {
    const prompt = await ctx.db.get(args.id);
    if (!prompt) {
      throw new Error("Prompt not found");
    }
    return prompt;
  },
});

// Get all unique categories
export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    const prompts = await ctx.db.query("prompts").collect();
    const templates = await ctx.db.query("templates").collect();

    const categories = new Set([
      ...prompts.map((p) => p.category),
      ...templates.map((t) => t.category),
    ]);

    return Array.from(categories).sort();
  },
});

// Get all unique tags
export const getTags = query({
  args: {},
  handler: async (ctx) => {
    const prompts = await ctx.db.query("prompts").collect();
    const templates = await ctx.db.query("templates").collect();

    const tags = new Set([
      ...prompts.flatMap((p) => p.tags),
      ...templates.flatMap((t) => t.tags),
    ]);

    return Array.from(tags).sort();
  },
});

// Create a new prompt
export const create = mutation({
  args: {
    title: v.string(),
    category: v.string(),
    content: v.string(),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const promptId = await ctx.db.insert("prompts", {
      title: args.title,
      category: args.category || "Uncategorized",
      content: args.content,
      tags: args.tags,
      createdAt: now,
      updatedAt: now,
    });

    return promptId;
  },
});

// Update an existing prompt
export const update = mutation({
  args: {
    id: v.id("prompts"),
    title: v.string(),
    category: v.string(),
    content: v.string(),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const existingPrompt = await ctx.db.get(args.id);
    if (!existingPrompt) {
      throw new Error("Prompt not found");
    }

    // If content changed, save the old version
    if (existingPrompt.content !== args.content) {
      await ctx.db.insert("versions", {
        promptId: args.id,
        content: existingPrompt.content,
        timestamp: Date.now(),
      });
    }

    await ctx.db.patch(args.id, {
      title: args.title,
      category: args.category || "Uncategorized",
      content: args.content,
      tags: args.tags,
      updatedAt: Date.now(),
    });
  },
});

// Delete a prompt and its versions
export const remove = mutation({
  args: { id: v.id("prompts") },
  handler: async (ctx, args) => {
    // Delete all versions first
    const versions = await ctx.db
      .query("versions")
      .withIndex("by_promptId", (q) => q.eq("promptId", args.id))
      .collect();

    for (const version of versions) {
      await ctx.db.delete(version._id);
    }

    // Delete the prompt
    await ctx.db.delete(args.id);
  },
});

// Restore a specific version
export const restoreVersion = mutation({
  args: {
    promptId: v.id("prompts"),
    versionId: v.id("versions"),
  },
  handler: async (ctx, args) => {
    const prompt = await ctx.db.get(args.promptId);
    const version = await ctx.db.get(args.versionId);

    if (!prompt || !version) {
      throw new Error("Prompt or version not found");
    }

    if (version.promptId !== args.promptId) {
      throw new Error("Version does not belong to the specified prompt");
    }

    // Only create a version if content is actually different
    if (prompt.content === version.content) {
      return { restored: false };
    }

    // Save current content as a version before restoring, but only
    // if this exact content isn't already stored to avoid dupes
    const [latestVersion] = await ctx.db
      .query("versions")
      .withIndex("by_promptId_and_timestamp", (q) =>
        q.eq("promptId", args.promptId)
      )
      .order("desc")
      .take(1);

    let hasExistingContentMatch = false;
    if (latestVersion && latestVersion.content === prompt.content) {
      hasExistingContentMatch = true;
    } else {
      const existingVersions = await ctx.db
        .query("versions")
        .withIndex("by_promptId", (q) => q.eq("promptId", args.promptId))
        .collect();

      hasExistingContentMatch = existingVersions.some(
        (v) => v.content === prompt.content
      );
    }

    if (!hasExistingContentMatch) {
      await ctx.db.insert("versions", {
        promptId: args.promptId,
        content: prompt.content,
        timestamp: Date.now(),
      });
    }

    // Restore the version
    await ctx.db.patch(args.promptId, {
      content: version.content,
      updatedAt: Date.now(),
    });

    return { restored: true };
  },
});
