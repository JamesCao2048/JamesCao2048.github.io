import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { unified } from "@astrojs/markdown-remark";
import remarkToc from "remark-toc";
import rehypeCallouts from "rehype-callouts";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
} from "@shikijs/transformers";
import { transformerFileName } from "./src/utils/transformers/fileName";

export default defineConfig({
  // This is a GitHub user site: URLs start at /, never at the repository name.
  site: "https://jamescao2048.github.io",
  output: "static",
  trailingSlash: "always",
  integrations: [
    mdx(),
    sitemap({
      filter: page =>
        !/\/(blog|back_posts|news|teaching|404|search|cv)(\/|\.)/.test(page) &&
        !/\/projects\/\d_project\//.test(page) &&
        !page.endsWith("/feed.xml/"),
    }),
  ],
  markdown: {
    processor: unified({
      remarkPlugins: [remarkToc],
      rehypePlugins: [rehypeCallouts],
    }),
    shikiConfig: {
      themes: { light: "min-light", dark: "night-owl" },
      defaultColor: false,
      wrap: false,
      transformers: [
        transformerFileName({ hideDot: true }),
        transformerNotationHighlight(),
        transformerNotationDiff({ matchAlgorithm: "v3" }),
      ],
    },
  },
  vite: { plugins: [tailwindcss()] },
});
