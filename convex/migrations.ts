import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Seed default templates (run once)
export const seedDefaultTemplates = internalMutation({
  args: {},
  handler: async (ctx) => {
    const defaultTemplates = [
      {
        label: 'Blog Post Generator',
        title: 'SEO Optimized Blog Post',
        category: 'Content Writing',
        content: 'Write a comprehensive, SEO-optimized blog post about [Topic].\n\nTarget Keywords: [Keywords]\n\nStructure:\n1. Introduction\n2. Main Body\n3. Conclusion',
        tags: ['seo', 'blogging', 'content'],
        isCustom: false,
      },
      {
        label: 'Code Debugger',
        title: 'Code Debugging Assistant',
        category: 'Development',
        content: 'I have a bug in the following code:\n\n```\n[Insert Code Here]\n```\n\nError message: [Insert Error]\n\nPlease analyze the code, explain the error, and provide a fixed version.',
        tags: ['coding', 'debug', 'development'],
        isCustom: false,
      },
      {
        label: 'Social Caption',
        title: 'Social Media Caption Writer',
        category: 'Social Media',
        content: 'Write an engaging Instagram caption for a photo about [Description].\n\nTone: [e.g., Funny, Professional]\nInclude 3-5 relevant hashtags.',
        tags: ['social-media', 'instagram', 'marketing'],
        isCustom: false,
      },
      {
        label: 'Email Autoresponder',
        title: 'Professional Email Response',
        category: 'Communication',
        content: 'Draft a polite and professional response to the following email:\n\n"[Insert Incoming Email]"\n\nKey points to cover:\n- [Point 1]\n- [Point 2]',
        tags: ['email', 'business', 'communication'],
        isCustom: false,
      }
    ];

    for (const template of defaultTemplates) {
      await ctx.db.insert("templates", template);
    }

    return { count: defaultTemplates.length };
  },
});

// Migrate data from localStorage format
export const seedFromLocalStorage = internalMutation({
  args: {
    prompts: v.array(v.any()),
    templates: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    // Insert prompts
    for (const prompt of args.prompts) {
      const promptId = await ctx.db.insert("prompts", {
        title: prompt.title,
        category: prompt.category,
        content: prompt.content,
        tags: prompt.tags,
        createdAt: prompt.createdAt,
        updatedAt: prompt.updatedAt,
      });

      // Insert versions for this prompt
      for (const version of prompt.versions || []) {
        await ctx.db.insert("versions", {
          promptId,
          content: version.content,
          timestamp: version.timestamp,
        });
      }
    }

    // Insert custom templates
    for (const template of args.templates) {
      await ctx.db.insert("templates", {
        label: template.label,
        title: template.title,
        category: template.category,
        content: template.content,
        tags: template.tags,
        isCustom: template.isCustom ?? true,
      });
    }

    return {
      promptsCount: args.prompts.length,
      templatesCount: args.templates.length
    };
  },
});
