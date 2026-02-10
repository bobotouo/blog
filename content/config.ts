import { defineCollection, defineContentConfig } from "@nuxt/content";
import { z } from "zod";

export default defineContentConfig({
  // Blog collection
  collections: {
    blog: defineCollection({
      // markdown files under content/blog/
      // schema validates frontmatter fields
      schema: z.object({
        title: z.string(),
        date: z.string().or(z.date()),
        description: z.string().optional(),
        tags: z.array(z.string()).optional(),
        coverImage: z.string().optional(),
      }),
    }),
    snapshots: defineCollection({
      schema: z.object({
        title: z.string(),
        date: z.string().or(z.date()),
        summary: z.string().optional(),
        images: z.array(z.string()).optional(),
        location: z.string().optional(),
        mood: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }),
    }),
  },
});
