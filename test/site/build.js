import Eleventy from "@11ty/eleventy";

let cached;

// Memoized: a full Eleventy run is slow and every test file shares the same content dir.
export function buildSite() {
  cached ??= run();
  return cached;
}

async function run() {
  const elev = new Eleventy("src", "_site_test", { configPath: "eleventy.config.js" });
  const results = await elev.toJSON();
  return new Map(results.map((r) => [r.url, r.content]));
}
