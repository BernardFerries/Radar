import { test } from "node:test";
import assert from "node:assert/strict";

// This fixture set renames the site, so any leftover hardcoded « Radar Escalquens » shows up.
process.env.RADAR_CONTENT_DIR = "test/fixtures/content";
const { buildSite } = await import("./build.js");

// /admin/ is the CMS shell (static, not templated), not a public page.
const htmlPages = async () => [...(await buildSite())].filter(([url, html]) => html?.includes("<html") && url !== "/admin/");

test("the site name comes from reglages.nom_site on every page", async () => {
  const pages = await htmlPages();
  assert.ok(pages.length > 5);
  for (const [url, html] of pages) {
    assert.ok(!html.includes("Radar Escalquens"), `${url} hardcodes the site name`);
    assert.match(html, /<span class="brand-name">Radar Fixture<small>/, `${url} header`);
    assert.match(html, /<title>[^<]*Radar Fixture[^<]*<\/title>/, `${url} title`);
    assert.match(html, /<footer[^>]*>\s*Radar Fixture ·/, `${url} footer`);
  }
});

test("accueil title repeats the constat number and phrase from reglages", async () => {
  const html = (await buildSite()).get("/");
  assert.match(html, /<title>Radar Fixture · 1 3 promesses ne sont pas engagées\.<\/title>/);
});

test("an e-mail contact is a mailto link in the footer and in the mentions légales", async () => {
  const site = await buildSite();
  assert.match(site.get("/"), /<footer[\s\S]*<a href="mailto:contact@example\.org">contact@example\.org<\/a>[\s\S]*<\/footer>/);
  assert.match(site.get("/mentions-legales/"), /<h2>Contact<\/h2>\s*<p><a href="mailto:contact@example\.org">contact@example\.org<\/a><\/p>/);
});
