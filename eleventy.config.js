import { EleventyRenderPlugin, HtmlBasePlugin } from "@11ty/eleventy";
import { eventSummary, formatDateFr, isoDateParis, shareDescription } from "./lib/format.js";
import { compteThematique } from "./lib/statuts.js";

export default function (eleventyConfig) {
  // Provides the `renderContent` filter used for the point de vue Markdown.
  eleventyConfig.addPlugin(EleventyRenderPlugin);
  // Templates write root-relative URLs; this rewrites them under pathPrefix (GitHub Pages serves /Radar/).
  eleventyConfig.addPlugin(HtmlBasePlugin);
  eleventyConfig.addFilter("dateFr", formatDateFr);
  eleventyConfig.addFilter("eventSummary", eventSummary);
  // Counts are bolded here so the lib function stays HTML-free; labels are static, so `safe` is fine.
  eleventyConfig.addFilter("compteThematique", (rep, total) => compteThematique(rep, total, (n) => `<strong>${n}</strong>`));
  eleventyConfig.addFilter("isoDate", isoDateParis);
  eleventyConfig.addFilter("shareDescription", shareDescription);

  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/documents");
  // Served as-is: the shared layout (analytics-free, indexable) must not wrap the CMS shell.
  eleventyConfig.addPassthroughCopy("src/admin/index.html");

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    // Set only by the Pages deploy; local preview and tests stay at the root.
    pathPrefix: process.env.ELEVENTY_PATH_PREFIX || "/",
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
}
