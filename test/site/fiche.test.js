import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSite } from "./build.js";

const page = async (url) => {
  const html = (await buildSite()).get(url);
  assert.ok(html, `${url} is built`);
  return html;
};

test("every fiche has its status label, breadcrumb and side boxes", async () => {
  const radar = (await import("../../src/_data/radar.js")).default;
  for (const p of radar.promesses) {
    const html = await page(p.url);
    assert.ok(html.includes(p.statut.label), `${p.slug}: status label`);
    assert.ok(html.includes(`Promesse n°${p.numero} sur ${p.totalThematique}`), `${p.slug}: breadcrumb`);
    if (p.totalThematique > 1) assert.ok(html.includes("<h2>Dans la même thématique</h2>"), `${p.slug}: same-theme box`);
    if (p.derniereEvolution) assert.ok(html.includes("Dernière évolution le "), `${p.slug}: dernière évolution`);
    assert.equal(html.includes("<h2>Planning &amp; budget prévus</h2>"), Boolean(p.planning_budget), `${p.slug}: planning box`);
    if (!p.chronologie.length && p.statut.key === "non-engagee") assert.match(html, /Aucun acte concret constaté au/, `${p.slug}: empty state`);
  }
});

test("share meta: og:title is the intitulé, og:description starts with the status and stays short", async () => {
  const radar = (await import("../../src/_data/radar.js")).default;
  const html = await page(radar.promesses[0].url);
  const desc = html.match(/property="og:description" content="([^"]*)"/)[1];
  assert.match(html, /property="og:title" content="[^"]+"/);
  assert.ok(desc.startsWith(radar.promesses[0].statut.label), desc);
  assert.ok(desc.length <= 200, `${desc.length} chars`);
});

test("footer shows the état date", async () => {
  const radar = (await import("../../src/_data/radar.js")).default;
  assert.match(await page(radar.promesses[0].url), /Dernière mise à jour le \d{1,2}(er)? \S+ \d{4}/);
});
