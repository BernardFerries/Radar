import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSite } from "./build.js";

const page = async (url) => {
  const html = (await buildSite()).get(url);
  assert.ok(html, `${url} is built`);
  return html;
};

test("/promesses/ lists the 31 rows grouped in ranking order with counts", async () => {
  const html = await page("/promesses/");
  assert.equal(html.match(/data-statut=/g).length, 31);
  const radar = (await import("../../src/_data/radar.js")).default;
  const headings = [...html.matchAll(/<h2 class="gh-nom">([^<]*)</g)].map((m) => m[1]);
  assert.deepEqual(headings, radar.thematiques.map((t) => t.nom));
  for (const t of radar.thematiques) assert.match(html, new RegExp(`<strong>\\d+</strong>[^<]* sur ${t.promesses.length}`), t.nom);
  for (const p of radar.promesses) assert.ok(html.includes(`href="${p.url}"`), p.url);
});

test("/promesses/ chips carry counts and are hidden in the static HTML", async () => {
  const html = await page("/promesses/");
  const radar = (await import("../../src/_data/radar.js")).default;
  for (const r of radar.repartition.filter((x) => x.count > 0)) assert.ok(html.includes(`${r.statut.label} · ${r.count}`), r.statut.label);
  const buttons = html.match(/<button[^>]*data-filtre[^>]*>/g);
  assert.ok(buttons.length > 5);
  for (const b of buttons) assert.match(b, /\bhidden\b/, b);
  assert.match(html, /<p data-vide hidden>Aucune promesse ne correspond à ces filtres\.<\/p>/);
  assert.match(html, /<script src="\/assets\/js\/filtres\.js" defer>/);
});

test("every thématique page has its heading, mini bar and one row per promesse", async () => {
  const radar = (await import("../../src/_data/radar.js")).default;
  for (const t of radar.thematiques) {
    const html = await page(t.url);
    assert.ok(html.includes(`<h1>${t.nom}</h1>`), t.url);
    assert.ok(html.includes("barre-mini"), t.url);
    assert.equal(html.match(/data-statut=/g).length, t.promesses.length, t.url);
  }
});
