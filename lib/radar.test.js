import { test } from "node:test";
import assert from "node:assert/strict";
import { buildRadar } from "./radar.js";
import { ContentValidationError } from "./validate.js";

const ev = (extra) => ({ lieu: "presse", type: "fait", texte: "Texte.", ...extra });
const prom = (thematique, numero, extra = {}) => ({
  slug: `${thematique}-${numero}`, file: `content/promesses/${thematique}-${numero}.json`,
  thematique, numero, intitule: `P ${thematique} ${numero}`, chronologie: [], ...extra,
});
const them = (slug, nom) => ({ slug, nom });

function content(promesses, thematiques, extra = {}) {
  return {
    promesses, thematiques,
    intervenants: [{ slug: "jlt", nom: "Jean-Luc Tronco" }],
    reglages: {
      nombre_promesses: promesses.length,
      constat: { statuts: ["non-engagee"], phrase: "promesses sur {total} ne sont pas engagées." },
    },
    ...extra,
  };
}
const etatAu = new Date("2026-10-28T12:00:00Z");
const THEMES = [them("economie", "Économie"), them("culture", "Culture"), them("education", "Éducation et jeunesse")];

test("throws ContentValidationError on invalid content", () => {
  assert.throws(() => buildRadar(content([prom("inconnue", 1)], THEMES), { etatAu }), ContentValidationError);
});

test("repartition puts missing statut in the à venir bucket, zeros included", () => {
  const r = buildRadar(content([prom("culture", 1), prom("culture", 2, { statut: "non-engagee" })], THEMES), { etatAu });
  assert.equal(r.repartition.length, 8);
  const count = (key) => r.repartition.find((e) => e.statut.key === key).count;
  assert.equal(count(null), 1);
  assert.equal(count("non-engagee"), 1);
  assert.equal(count("appliquee"), 0);
  assert.equal(r.repartition.at(-1).statut.label, "Statut à venir");
  assert.equal(r.total, 2);
});

test("constat counts matching statuts and fills the phrase", () => {
  const ps = [prom("culture", 1, { statut: "non-engagee" }), prom("culture", 2, { statut: "non-engagee" }), prom("culture", 3, { statut: "en-cours" })];
  const r = buildRadar(content(ps, THEMES), { etatAu });
  assert.deepEqual(r.constat, { nombre: 2, phrase: "promesses sur 3 ne sont pas engagées." });
});

test("thematiques ranked by score desc, ties by nom in French", () => {
  const ps = [
    prom("economie", 1, { statut: "abandonnee" }), prom("culture", 1, { statut: "en-pause" }),
    prom("education", 1, { statut: "appliquee" }),
  ];
  const r = buildRadar(content(ps, THEMES), { etatAu });
  assert.deepEqual(r.thematiques.map((t) => t.slug), ["culture", "economie", "education"]);
  assert.equal(r.thematiques[0].score, 1);
  assert.equal(r.thematiques[2].score, 0);
  assert.equal(r.thematiques[0].url, "/thematiques/culture/");
});

test("promesses follow navigation order with prev/next", () => {
  const ps = [prom("education", 1), prom("economie", 2), prom("culture", 1), prom("economie", 1)];
  const r = buildRadar(content(ps, THEMES), { etatAu });
  assert.deepEqual(r.promesses.map((p) => p.slug), ["culture-1", "economie-1", "economie-2", "education-1"]);
  assert.equal(r.promesses[0].precedente, null);
  assert.equal(r.promesses[0].suivante.slug, "economie-1");
  assert.equal(r.promesses[3].suivante, null);
  assert.equal(r.promesses[3].precedente.slug, "economie-2");
});

test("promesse view carries url, rang, totalThematique, statut object, thematiqueObj", () => {
  const r = buildRadar(content([prom("economie", 1), prom("economie", 2, { statut: "en-cours" })], THEMES), { etatAu });
  const p = r.promesses[1];
  assert.equal(p.url, "/promesses/economie-2/");
  assert.equal(p.rang, 2);
  assert.equal(p.totalThematique, 2);
  assert.equal(p.statut.label, "En cours");
  assert.deepEqual(p.thematiqueObj, { slug: "economie", nom: "Économie" });
  assert.equal(r.promesses[0].statut.key, null);
});

test("chronologie: dated desc, undated after in source order; derniereEvolution", () => {
  const p = prom("culture", 1, {
    chronologie: [
      ev({ texte: "U1" }), ev({ date: "2026-06-01", texte: "A" }),
      ev({ texte: "U2", intervenant: "jlt", lieu: "commission" }), ev({ date: "2026-09-01", texte: "B" }),
    ],
  });
  const [out] = buildRadar(content([p], THEMES), { etatAu }).promesses;
  assert.deepEqual(out.chronologie.map((e) => e.texte), ["B", "A", "U1", "U2"]);
  assert.equal(out.derniereEvolution, "2026-09-01");
  assert.equal(out.chronologie[3].intervenantObj.nom, "Jean-Luc Tronco");
  assert.equal(out.chronologie[3].lieuLabel, "Commission");
  assert.equal(out.chronologie[0].intervenantObj, undefined);
});

test("derniereEvolution and resume are null without events", () => {
  const [p] = buildRadar(content([prom("culture", 1)], THEMES), { etatAu }).promesses;
  assert.equal(p.derniereEvolution, null);
  assert.equal(p.resume, null);
});

test("resume summarizes the first chronologie entry", () => {
  const p = prom("culture", 1, { chronologie: [ev({ date: "2026-06-01", type: "citation", texte: "Non." })] });
  assert.equal(buildRadar(content([p], THEMES), { etatAu }).promesses[0].resume, "« Non. »");
});

test("recents: 3 latest dated events, never undated", () => {
  const ps = [
    prom("culture", 1, { chronologie: [ev({ date: "2026-01-01", texte: "d1" }), ev({ texte: "undated" })] }),
    prom("culture", 2, { chronologie: [ev({ date: "2026-04-01", texte: "d4", type: "citation" }), ev({ date: "2026-03-01", texte: "d3" }), ev({ date: "2026-02-01", texte: "d2" })] }),
  ];
  const r = buildRadar(content(ps, THEMES), { etatAu });
  assert.deepEqual(r.recents.map((e) => e.texte), ["d4", "d3", "d2"]);
  assert.equal(r.recents[0].type, "citation");
  assert.equal(r.recents[0].promesse.slug, "culture-2");
});

test("recents carry the speaker and lieu label a citation needs", () => {
  const ps = [prom("culture", 1, { chronologie: [
    ev({ date: "2026-04-01", type: "citation", intervenant: "jlt", lieu: "conseil-municipal" }),
    ev({ date: "2026-03-01", type: "citation", lieu: "commission" }),
  ] })];
  const [withSpeaker, withoutSpeaker] = buildRadar(content(ps, THEMES), { etatAu }).recents;
  assert.equal(withSpeaker.intervenantObj.nom, "Jean-Luc Tronco");
  assert.equal(withSpeaker.lieuLabel, "Conseil municipal");
  assert.equal(withoutSpeaker.intervenantObj, undefined);
  assert.equal(withoutSpeaker.lieu, "commission");
  assert.equal(withoutSpeaker.lieuLabel, "Commission");
});

test("exposes etatAu, reglages, warnings and intervenants", () => {
  const r = buildRadar(content([prom("culture", 1)], THEMES), { etatAu });
  assert.equal(r.etatAu, etatAu);
  assert.equal(r.intervenants.length, 1);
  assert.ok(r.warnings.some((w) => w.includes("statut à venir")));
  assert.equal(r.reglages.nombre_promesses, 1);
});
