import { z, defineCollection } from "astro:content";

const pageCollection = defineCollection({
  type: "content",
  schema: ({ image }) =>
    z.object({
      seo: z.object({
        seoTitle: z.string(),
        seoDesc: z
          .string()
          .max(
            160,
            "For best SEO results, please keep the description under 160 characters."
          ),
      }),
      hero: z.object({
        title: z.string(),
        subtitle: z.string().optional(),
        image: image().refine((img) => img.width >= 1500, {
          message: "Cover image must be at least 1500 pixels wide!",
        }),
        focus: z.string().optional(),
      }),
      intro: z.string().optional(),
      countriesWidget: z.boolean().default(false),
      skillsWidget: z.boolean().default(false),
      tripsWidget: z.boolean().default(false),
      contactButtonWidget: z.boolean().default(false),
      chatWidget: z.boolean().default(false),
      reviewsWidget: z.boolean().default(false),
    }),
});

const countryCollection = defineCollection({
  type: "content",
  schema: ({ image }) =>
    z.object({
      seo: z.object({
        seoTitle: z.string(),
        seoDesc: z
          .string()
          .max(
            160,
            "For best SEO results, please keep the description under 160 characters."
          ),
      }),
      sortOrder: z.number(),
      title: z.string(),
      cover: image().refine((img) => img.width >= 1500, {
        message: "Cover image must be at least 1500 pixels wide!",
      }),
      image: image().refine((img) => img.width >= 500, {
        message: "Cover image must be at least 500 pixels wide!",
      }),
      intro: z.string(),
    }),
});

const blogCollection = defineCollection({
  type: 'content',
  schema: ({ image }) => z.object({
    seo: z.object({
      seoTitle: z.string(),
      seoDesc: z
        .string()
        .max(
          160,
          "For best SEO results, please keep the description under 160 characters."
        ),
    }),
    title: z.string(),
    date: z.date(),
    cover: image().refine((img) => img.width >= 500, {
      message: "Cover image must be at least 300 pixels wide!",
    }),
    description: z
      .string()
      .max(
        160,
        "For best SEO results, please keep the description under 160 characters."
      ).optional(),
  }),
});

const widgetsCollection = defineCollection({
  type: "content",
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      en: z.array(
        z.object({
          title: z.string(),
          text: z.string(),
          image: image()
            .refine((img) => img.width >= 900, {
              message: "Image must be at least 900 pixels wide!",
            })
            .optional(),
          author: z.string().optional(),
          date: z.date().optional(),
        })
      ),
      pl: z.array(
        z.object({
          title: z.string(),
          text: z.string(),
          image: image()
            .refine((img) => img.width >= 900, {
              message: "Image must be at least 900 pixels wide!",
            })
            .optional(),
          author: z.string().optional(),
          date: z.date().optional(),
        })
      ),
    }),
});

const teamCollection = defineCollection({
  type: "content",
  schema: ({ image }) => {
    const localized = z.object({
      role: z.string(),
      bio: z.string(),
      facts: z.array(z.string()).default([]),
    });
    return z.object({
      sortOrder: z.number(),
      name: z.string(),
      photo: image().refine((img) => img.width >= 600, {
        message: "Portrait must be at least 600 pixels wide!",
      }),
      en: localized,
      pl: localized,
      links: z
        .array(z.object({ label: z.string(), url: z.string().url() }))
        .default([]),
    });
  },
});

export const collections = {
  team: teamCollection,
  pages: pageCollection,
  country: countryCollection,
  widgets: widgetsCollection,
  blog: blogCollection,
};
