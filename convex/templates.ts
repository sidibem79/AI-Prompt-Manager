import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// List all templates
export const list = query({
  args: {},
  handler: async (ctx) => {
    const templates = await ctx.db.query("templates").collect();
    return templates;
  },
});

// Get a single template by ID
export const get = query({
  args: { id: v.id("templates") },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.id);
    if (!template) {
      throw new Error("Template not found");
    }
    return template;
  },
});

// Create a custom template
export const create = mutation({
  args: {
    label: v.string(),
    title: v.string(),
    category: v.string(),
    content: v.string(),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("templates", {
      label: args.label,
      title: args.title,
      category: args.category || "Uncategorized",
      content: args.content,
      tags: args.tags,
      isCustom: true,
    });
  },
});

// Update a custom template
export const update = mutation({
  args: {
    id: v.id("templates"),
    label: v.string(),
    title: v.string(),
    category: v.string(),
    content: v.string(),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.id);

    if (!template) {
      throw new Error("Template not found");
    }

    if (!template.isCustom) {
      throw new Error("Cannot modify default templates");
    }

    await ctx.db.patch(args.id, {
      label: args.label,
      title: args.title,
      category: args.category,
      content: args.content,
      tags: args.tags,
    });
  },
});

// Delete a custom template
export const remove = mutation({
  args: { id: v.id("templates") },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.id);

    if (!template) {
      throw new Error("Template not found");
    }

    if (!template.isCustom) {
      throw new Error("Cannot delete default templates");
    }

    await ctx.db.delete(args.id);
  },
});
