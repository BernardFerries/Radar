import { test } from "node:test";
import assert from "node:assert/strict";

process.env.RADAR_CONTENT_DIR = "test/fixtures/content";
const { buildSite } = await import("./build.js");

test("a promesse without statut is a row, a chip and a legend entry of its own", async () => {
  const site = await buildSite();
  const liste = site.get("/promesses/");
  assert.match(liste, /data-statut="a-venir"/);
  assert.match(liste, /Statut à venir · 1/);
  const culture = site.get("/thematiques/culture/");
  assert.ok(culture.includes("Statut à venir"));
  assert.match(culture, /<li[^>]*statut-a-venir[^>]*>[\s\S]*?Statut à venir/);
});

test("thématique point de vue Markdown is rendered", async () => {
  const html = (await buildSite()).get("/thematiques/mobilite/");
  assert.ok(html.includes("Un avis sur la mobilité."));
  assert.ok(html.includes("Le point de vue de Nouveau Cap"));
});
