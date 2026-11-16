import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

import sitemap from "@astrojs/sitemap";

const buildDate = new Date().toISOString();

// https://astro.build/config
export default defineConfig({
  site: "https://bluestarfishtravel.com",
  // Pages are built as /path/index.html and Netlify serves them at /path/.
  // "always" makes `astro dev` reject links without the trailing slash, so a
  // link that would cost a 301 in production fails locally first.
  trailingSlash: "always",
  // Optimised images are cached here so repeat builds skip re-encoding.
  // Kept outside node_modules so the staging deploy (npm ci) keeps it.
  cacheDir: "./.astro-cache",
  build: {
    format: "directory",
    // The stylesheet is small (about 8 KB compressed). Inlining it removes a
    // render-blocking request on every first visit.
    inlineStylesheets: "always",
  },
  integrations: [
    tailwind(),
    sitemap({
      filter: (page) => !page.includes("/404"),
      serialize: (item) => ({ ...item, lastmod: buildDate }),
    }),
  ],
});
