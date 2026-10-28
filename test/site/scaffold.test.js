import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildSite } from "./build.js";
import radar from "../../src/_data/radar.js";

test("home page has the site identity, menu and legal link", async () => {
  const html = (await buildSite()).get("/");
  assert.ok(html, "/ is built");
  for (const text of [
    radar.reglages.nom_site,
    "par Nouveau Cap",
    "Les 31 promesses",
    "Thématiques",
    "Planning &amp; budgets",
    "La démarche",
    'href="/mentions-legales/"',
  ]) {
    assert.ok(html.includes(text), `missing: ${text}`);
  }
});

test("footer carries the contact from reglages", async () => {
  const footer = (await buildSite()).get("/").match(/<footer[\s\S]*<\/footer>/)[0];
  assert.ok(footer.replace(/<[^>]+>/g, "").includes(`Contact : ${radar.reglages.contact}`), footer);
});

// toJSON() never writes files, so passthrough is checked on the config instead.
test("planning PDF exists and src/documents is a passthrough copy", async () => {
  const copied = [];
  const { default: configure } = await import("../../eleventy.config.js");
  // Any other config method is a no-op, so new filters/plugins don't break this test.
  const noop = () => {};
  const config = new Proxy({ addPassthroughCopy: (path) => copied.push(path) }, { get: (t, k) => t[k] ?? noop });
  configure(config);
  assert.ok(copied.includes("src/documents"));
  assert.ok(fs.existsSync("src/documents/plannings-et-budgets.pdf"));
});
