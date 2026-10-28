// GitHub Pages serves the site under /Radar/: root-relative links must carry the prefix.
process.env.ELEVENTY_PATH_PREFIX = "/Radar/";

import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSite } from "./build.js";

const site = await buildSite();

test("root-relative links and assets carry the path prefix", () => {
  const html = site.get("/");
  assert.match(html, /href="\/Radar\/assets\/css\/main\.css"/);
  assert.match(html, /href="\/Radar\/promesses\/"/);
  assert.match(html, /href="\/Radar\/la-demarche\/"/);
});

test("no public page keeps an unprefixed root-relative href or src", () => {
  for (const [url, html] of site) {
    if (!html?.includes("<html") || url.startsWith("/admin/")) continue;
    const bare = html.match(/(?:href|src)="\/(?!Radar\/)[^"]*"/g);
    assert.equal(bare, null, `${url}: ${bare}`);
  }
});

test("fiche links to the planning PDF under the prefix", () => {
  const html = site.get("/promesses/urbanisme-2/");
  assert.match(html, /href="\/Radar\/documents\/plannings-et-budgets\.pdf"/);
});
