import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";

import sitemap from "@astrojs/sitemap";

const buildDate = new Date().toISOString();

// https://astro.build/config
export default defineConfig({
  site: "https://bluestarfishtravel.com",
  // Pages are built as /path/index.html and Netlify serves them at /path/.
  // "always" makes `astro dev` reject links without the trailing slash, so a
  // link that would cost a 301 in production fails locally first.
  trailingSlash: "always",
  build: { format: "directory" },
  integrations: [
    tailwind(),
    react(),
    sitemap({
      filter: (page) => !page.includes("/404"),
      serialize: (item) => ({ ...item, lastmod: buildDate }),
    }),
  ],
});
