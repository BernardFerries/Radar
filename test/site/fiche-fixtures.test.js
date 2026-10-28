import { test } from "node:test";
import assert from "node:assert/strict";

process.env.RADAR_CONTENT_DIR = "test/fixtures/content";
const { buildSite } = await import("./build.js");

test("editor text is escaped in h1 and og:title", async () => {
  const html = (await buildSite()).get("/promesses/culture-1/");
  assert.ok(html, "culture-1 built");
  assert.ok(html.includes("Rue &lt;A&gt; &amp; &quot;B&quot;"));
  assert.ok(!html.includes("Rue <A>"));
  assert.match(html, /property="og:title" content="Rue &lt;A&gt; &amp; &quot;B&quot;"/);
  assert.ok(html.includes("Statut à venir"));
});

test("point de vue Markdown is rendered", async () => {
  const html = (await buildSite()).get("/promesses/mobilite-1/");
  assert.ok(html.includes("<strong>gras</strong>"));
  assert.ok(html.includes("Le point de vue de Nouveau Cap"));
  assert.ok(html.includes("Nouveau Cap · 20 septembre 2026"));
});
