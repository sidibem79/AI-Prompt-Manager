import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  prompts: defineTable({
    title: v.string(),
    category: v.string(),
    content: v.string(),
    tags: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_updatedAt", ["updatedAt"])
    .index("by_category_and_updatedAt", ["category", "updatedAt"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["category"]
    })
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["category"]
    }),

  versions: defineTable({
    promptId: v.id("prompts"),
    content: v.string(),
    timestamp: v.number(),
  })
    .index("by_promptId", ["promptId"])
    .index("by_promptId_and_timestamp", ["promptId", "timestamp"]),

  templates: defineTable({
    label: v.string(),
    title: v.string(),
    category: v.string(),
    content: v.string(),
    tags: v.array(v.string()),
    isCustom: v.boolean(),
  })
    .index("by_category", ["category"])
    .index("by_isCustom", ["isCustom"])
    .index("by_category_and_isCustom", ["category", "isCustom"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["category", "isCustom"]
    }),
});
