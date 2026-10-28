import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSite } from "./build.js";
import radar from "../../src/_data/radar.js";
import { formatDateFr, isoDateParis } from "../../lib/format.js";

const home = async () => (await buildSite()).get("/");
const text = (html) => html.replace(/<[^>]+>/g, " ").replace(/&#39;/g, "'").replace(/\s+/g, " ");

test("hero states the date, the big number and the sentence", async () => {
  const html = await home();
  const today = formatDateFr(isoDateParis(radar.etatAu));
  assert.ok(text(html).includes(`Mandat 2026-2032 · état au ${today}`));
  assert.match(html, new RegExp(`<span class="big">${radar.constat.nombre}</span>`));
  assert.ok(text(html).includes(radar.constat.phrase));
});

test("legend lists only non-zero buckets, with counts derived from the data", async () => {
  const t = text(await home());
  for (const r of radar.repartition) {
    const entry = `${r.statut.label} · ${r.count}`;
    assert.equal(t.includes(entry), r.count > 0, entry);
  }
});

test("the campaign engagement is quoted", async () => {
  const t = text(await home());
  assert.ok(t.includes(`« Avec vous pour Escalquens » promettait « ${radar.reglages.engagement} »`));
});

test("9 thématique cards in ranking order, linking to their page", async () => {
  const html = await home();
  const hrefs = [...html.matchAll(/class="carte" href="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(hrefs, radar.thematiques.map((t) => `/thematiques/${t.slug}/`));
  assert.equal(hrefs.length, 9);
  assert.match(html, /id="thematiques"/);
});

test("recent feed has 3 items, newest first, linking to fiches", async () => {
  const html = await home();
  const feed = html.match(/<ol class="feed">([\s\S]*?)<\/ol>/)[1];
  const items = feed.match(/<li>/g);
  assert.equal(items.length, 3);
  // Derived, not hardcoded: the content's newest dated event moves as editors add events.
  const newest = formatDateFr(radar.recents[0].date);
  assert.match(feed, new RegExp(`^\\s*<li>\\s*<time[^>]*>${newest}<`));
  assert.match(feed, /href="\/promesses\/[a-z-]+-\d+\/"/);
});

test("recent citations name their speaker, or their lieu when they have none", async () => {
  const feed = (await home()).match(/<ol class="feed">([\s\S]*?)<\/ol>/)[1];
  const items = feed.split("<li>").slice(1).map(text);
  radar.recents.forEach((e, i) => {
    if (e.type !== "citation") return;
    if (e.intervenantObj) assert.ok(items[i].includes(`— ${e.intervenantObj.nom}, ${e.intervenantObj.fonction_courte}`), items[i]);
    else if (e.lieu !== "autre") assert.ok(items[i].includes(`— ${e.lieuLabel}`), items[i]);
  });
});

test("qui sommes-nous links to the démarche page", async () => {
  const html = await home();
  assert.ok(text(html).includes(radar.reglages.qui_sommes_nous));
  assert.match(html, /href="\/la-demarche\/"[^>]*>En savoir plus sur la démarche →/);
});

test("no page links to a /thematiques/ index that does not exist", async () => {
  for (const [url, html] of await buildSite()) {
    assert.ok(!html.includes('href="/thematiques/"'), `${url} links to /thematiques/`);
  }
});

test("every thématique card carries its own count line ending with « sur <n> »", async () => {
  const html = await home();
  const cards = [...html.matchAll(/<a class="carte" href="([^"]+)">([\s\S]*?)<\/a>/g)];
  assert.equal(cards.length, radar.thematiques.length);
  for (const t of radar.thematiques) {
    const card = cards.find((c) => c[1] === t.url);
    assert.ok(card, t.url);
    assert.match(text(card[2]), new RegExp(`sur ${t.promesses.length}\\s*$`), t.nom);
  }
});
