import { test } from "node:test";
import assert from "node:assert/strict";

// Pinned literals live here, on content editors never touch (see also the real-content invariants in the other site tests).
process.env.RADAR_CONTENT_DIR = "test/fixtures/content-rich";
const { buildSite } = await import("./build.js");

const text = (html) => html.replace(/<[^>]+>/g, " ").replace(/&#39;/g, "'").replace(/\s+/g, " ");
const page = async (url) => {
  const html = (await buildSite()).get(url);
  assert.ok(html, `${url} is built`);
  return html;
};

test("accueil: hero sentence, legend with counts, card count lines", async () => {
  const html = await page("/");
  const t = text(html);
  assert.match(html, /<title>Radar Escalquens · 3 promesses sur 6 ne sont pas engagées\.<\/title>/);
  assert.match(html, /<span class="big">3<\/span>/);
  assert.ok(t.includes("promesses sur 6 ne sont pas engagées."));
  for (const l of ["En cours · 2", "Non engagée · 3", "Abandonnée ou non tenue · 1"]) assert.ok(t.includes(l), l);
  assert.ok(!t.includes("Appliquée · 0"));
  assert.ok(t.includes("1 en cours, 1 non engagée et 1 abandonnée sur 3"), "Mobilité lists its abandoned promesse");
  assert.ok(t.includes("1 non engagée sur 1"));
});

test("accueil: a recent citation names its speaker, or its lieu when it has none", async () => {
  const feed = (await page("/")).match(/<ol class="feed">([\s\S]*?)<\/ol>/)[1];
  const items = feed.split("<li>").slice(1).map(text);
  assert.equal(items.length, 3);
  assert.ok(items[0].includes("« Le projet avance. » — Jean-Luc Tronco, Maire"), items[0]);
  assert.match(feed, /<abbr title="Maire d&#39;Escalquens">Maire<\/abbr>/);
  assert.ok(items[1].includes("« Le dossier est à l'étude. » — Commission"), items[1]);
  assert.ok(items[2].includes("Étude lancée.") && !items[2].includes("—"), "a fait carries no attribution");
});

test("liste: counts per group and per chip", async () => {
  const html = await page("/promesses/");
  assert.equal(html.match(/data-statut=/g).length, 6);
  assert.match(html, /<strong>1<\/strong> non engagée sur 1/);
  assert.match(html, /Non engagée · 3/);
});

test("liste: a long citation is cut with an ellipsis in the summary", async () => {
  const html = await page("/promesses/");
  const row = html.match(/<a class="ligne"[^>]*href="\/promesses\/environnement-1\/"[\s\S]*?<\/a>/)[0];
  assert.match(row, /… »<\/small>/);
});

test("thématique page: heading, mini bar, one row per promesse", async () => {
  const html = await page("/thematiques/mobilite/");
  assert.match(html, /<h1>Mobilité<\/h1>/);
  assert.ok(html.includes("barre-mini"));
  assert.equal(html.match(/data-statut=/g).length, 3);
  assert.ok(!html.includes("Le point de vue de Nouveau Cap"));
});

test("fiche: status, source, breadcrumb, events, planning and same-theme box", async () => {
  const html = await page("/promesses/logement-2/");
  for (const s of [
    "Créer une résidence de services pour séniors",
    "En cours",
    "Source de la promesse : Profession de foi 2026",
    "Promesse n°2 sur 2",
    "Dernière évolution le 18 septembre 2026",
    "Jean-Luc Tronco",
    "Planning",
    "Dans la même thématique",
  ]) assert.ok(html.includes(s), `missing: ${s}`);
  assert.match(html, /title="[^"]*Maire d&#39;Escalquens[^"]*"/, "fonction complète dans un title");
  assert.ok(!html.includes("Le point de vue de Nouveau Cap"), "no point de vue block when the field is absent");
});

test("fiche: the same-theme box lists the other promesses by intitulé, with their status", async () => {
  const html = await page("/promesses/logement-2/");
  const box = html.match(/<ul class="meme-theme">([\s\S]*?)<\/ul>/)[1];
  assert.match(box, /<a href="\/promesses\/logement-1\/">Construire des logements sociaux<\/a>/);
  assert.match(box, /statut-non-engagee[^>]*><i aria-hidden="true"><\/i>Non engagée/);
  assert.ok(!box.includes("logement-2"), "the fiche does not list itself");
});

test("fiche: a thématique with a single promesse has no same-theme box", async () => {
  const html = await page("/promesses/environnement-1/");
  assert.ok(!html.includes("Dans la même thématique"));
  assert.ok(!html.includes("meme-theme"));
});

test("fiche: a planning box with only a link has no empty paragraph", async () => {
  const html = await page("/promesses/mobilite-2/");
  const box = html.match(/<h2>Planning &amp; budget prévus<\/h2>([\s\S]*?)<\/div>/)[1];
  assert.match(box, /href="\/documents\/plannings-et-budgets\.pdf"/);
  assert.doesNotMatch(box, /<p>\s*<\/p>/);
});

test("fiche: an event at lieu « autre » shows its date and no lieu", async () => {
  const html = await page("/promesses/logement-2/");
  assert.ok(html.includes("Réunion publique."));
  assert.match(html, /<b>1er mai 2026<\/b>\s*<\/div>/);
  assert.ok(!text(html).includes("· Autre"));
  assert.ok(text(html).includes("2 juillet 2026 · Presse"), "other lieux are still shown");
});

test("fiche: an abandoned promesse flags its undated event", async () => {
  const html = await page("/promesses/mobilite-1/");
  assert.ok(html.includes("Abandonnée ou non tenue"));
  assert.ok(html.includes("date non précisée"));
});

test("fiche: an unengaged promesse without events states the état date", async () => {
  const html = await page("/promesses/logement-1/");
  assert.match(html, /Aucun acte concret constaté au \d{1,2}(er)? \S+ \d{4}/);
});

test("fiche: og:description starts with the status and stays short", async () => {
  const html = await page("/promesses/environnement-1/");
  const desc = html.match(/property="og:description" content="([^"]*)"/)[1];
  assert.ok(desc.startsWith("Non engagée"), desc);
  assert.ok(desc.length <= 200, `${desc.length} chars`);
});

test("footer shows the état date", async () => {
  assert.match(await page("/promesses/logement-2/"), /Dernière mise à jour le \d{1,2}(er)? \S+ \d{4}/);
});
