import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSite } from "./build.js";
import radar from "../../src/_data/radar.js";
import { STATUTS } from "../../lib/statuts.js";
import site from "../../src/_data/site.js";

const page = async (url) => (await buildSite()).get(url);
const text = (html) => html.replace(/<[^>]+>/g, " ").replace(/&#39;/g, "'").replace(/\s+/g, " ");

test("la démarche keeps the old accueil text, in UTF-8, typos fixed", async () => {
  const t = text(await page("/la-demarche/"));
  for (const s of ["trente et une promesses", "Mediacités", "le planning et le budget prévus", "À partir de divers documents"]) {
    assert.ok(t.includes(s), s);
  }
  assert.ok(!t.includes("�"));
});

test("la démarche links Mediacités, the Toulouse radar and the planning PDF", async () => {
  const html = await page("/la-demarche/");
  assert.match(html, /href="https:\/\/www\.mediacites\.fr\/"/);
  assert.match(html, /href="https:\/\/www\.mediacites\.fr\/radar\/toulouse\/promesses\/"/);
  assert.match(html, /href="\/documents\/plannings-et-budgets\.pdf"/);
});

test("la démarche explains the method before the status definitions (spec §6.5)", async () => {
  const html = await page("/la-demarche/");
  const h2 = [...html.matchAll(/<h2[^>]*>([^<]+)<\/h2>/g)].map((m) => m[1]);
  assert.deepEqual(h2.slice(0, 2), ["Notre méthode", "Les statuts"]);
  const methode = text(html.slice(html.indexOf("Notre méthode"), html.indexOf("Les statuts")));
  for (const s of ["Citation", "Fait", "Point de vue de Nouveau Cap", "Statut", "Statut à venir", "date non précisée"]) {
    assert.ok(methode.includes(s), s);
  }
});

test("la démarche defines the 7 statuses", async () => {
  const t = text(await page("/la-demarche/"));
  assert.equal(STATUTS.length, 7);
  for (const s of STATUTS) {
    assert.ok(t.includes(s.label), s.label);
    assert.ok(t.includes(s.definition), s.definition);
  }
});

test("la démarche lists intervenants with their full fonction", async () => {
  const t = text(await page("/la-demarche/"));
  assert.ok(radar.intervenants.length >= 2);
  for (const i of radar.intervenants) {
    assert.ok(t.includes(i.nom), i.nom);
    assert.ok(t.includes(i.fonction), i.fonction);
  }
});

test("mentions légales: the four headings, each followed by content", async () => {
  const html = await page("/mentions-legales/");
  const headings = [...html.matchAll(/<h2[^>]*>([^<]+)<\/h2>\s*<p>([\s\S]*?)<\/p>/g)].map((m) => [m[1], text(m[2]).trim()]);
  assert.deepEqual(headings.map(([h]) => h), ["Éditeur", "Directeur de la publication", "Hébergeur", "Contact"]);
  for (const [h, content] of headings) assert.ok(content.length > 0, `${h} is empty`);
});

test("404 exists and links home", async () => {
  const html = await page("/404.html");
  assert.ok(html, "404.html not built");
  assert.match(html, /<a [^>]*href="\/"/);
});

// Follows infra.json: relative image and no canonical while site_url is the placeholder (site-url.test.js covers the other case).
test("every page has one og:image on og-default.png, and a canonical only once site_url is known", async () => {
  const pages = await buildSite();
  for (const [url, html] of pages) {
    // /admin/ is the CMS shell (passthrough), not a public page.
    if (!html?.includes("<html") || url === "/admin/") continue;
    assert.equal((html.match(/property="og:image"/g) ?? []).length, 1, url);
    assert.ok(html.includes(`property="og:image" content="${site.url}/assets/img/og-default.png"`), url);
    assert.equal(html.includes('rel="canonical"'), Boolean(site.url), url);
    if (site.url) assert.ok(html.includes(`<link rel="canonical" href="${site.url}${url}">`), url);
    for (const p of ["og:title", "og:description", "og:type", "twitter:card"]) {
      assert.equal((html.match(new RegExp(`(property|name)="${p}"`, "g")) ?? []).length, 1, `${url} ${p}`);
    }
  }
  assert.ok(pages.size > 40);
});

test("fiche keeps its own og:title", async () => {
  const html = await page(`/promesses/${radar.promesses[0].slug}/`);
  assert.ok(html.includes(`property="og:title" content="${radar.promesses[0].intitule.replace(/'/g, "&#39;")}"`));
});
