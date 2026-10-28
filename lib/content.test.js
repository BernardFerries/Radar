import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadContent } from "./content.js";
import { validateContent } from "./validate.js";

const DIR = "test/fixtures/content";

test("loads fixtures with slug and repo-relative file", () => {
  const c = loadContent(DIR);
  assert.equal(c.promesses.length, 3);
  const p = c.promesses.find((x) => x.slug === "mobilite-1");
  assert.equal(p.file, "test/fixtures/content/promesses/mobilite-1.json");
  assert.equal(c.thematiques.length, 2);
  assert.equal(c.intervenants[0].slug, "jlt");
  assert.equal(c.reglages.nombre_promesses, 3);
});

test("fixtures validate with zero errors and some warnings", () => {
  const { errors, warnings } = validateContent(loadContent(DIR));
  assert.deepEqual(errors, []);
  assert.ok(warnings.length > 0);
});

function tempContent(promesse) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "radar-"));
  const put = (rel, obj) => {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), JSON.stringify(obj));
  };
  put("reglages.json", { nombre_promesses: 1 });
  put("thematiques/mobilite.json", { nom: "Mobilité", point_de_vue: { texte: "", date: "" } });
  put("intervenants/jlt.json", { nom: "J", fonction: "M", fonction_courte: "M" });
  put("promesses/mobilite-1.json", { thematique: "mobilite", numero: 1, intitule: "T", ...promesse });
  return dir;
}

const BLANKED = {
  statut: "",
  source: "  ",
  planning_budget: { resume: "", lien: null },
  point_de_vue: { texte: "", date: "" },
  chronologie: [{ date: "", intervenant: null, lien: "", lieu: "presse", type: "fait", texte: "x" }],
};

test("blank optional fields written by the CMS are dropped on load", () => {
  const c = loadContent(tempContent(BLANKED));
  const p = c.promesses[0];
  for (const k of ["statut", "source", "planning_budget", "point_de_vue"]) assert.ok(!(k in p), k);
  assert.deepEqual(Object.keys(p.chronologie[0]).sort(), ["lieu", "texte", "type"]);
  assert.ok(!("point_de_vue" in c.thematiques[0]));
});

test("blank optionals give only warnings, no errors", () => {
  const { errors, warnings } = validateContent(loadContent(tempContent(BLANKED)));
  assert.deepEqual(errors, []);
  assert.equal(warnings.length, 2);
  assert.ok(warnings.some((w) => w.endsWith("statut à venir")));
  assert.ok(warnings.some((w) => w.endsWith("chronologie[0] sans date")));
});

test("filled optionals are kept", () => {
  const p = loadContent(tempContent({ planning_budget: { resume: "r", lien: "" }, point_de_vue: { texte: "t", date: "" } })).promesses[0];
  assert.deepEqual(p.planning_budget, { resume: "r" });
  assert.deepEqual(p.point_de_vue, { texte: "t" });
});

test("an empty required field is still an error", () => {
  const c = loadContent(tempContent({ chronologie: [{ lieu: "presse", type: "fait", texte: "" }] }));
  assert.ok(validateContent(c).errors.some((e) => e.endsWith("chronologie[0].texte manquant")));
});
