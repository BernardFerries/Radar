import { test } from "node:test";
import assert from "node:assert/strict";
import { validateContent, ContentValidationError } from "./validate.js";

const F = "content/promesses/mobilite-1.json";
const event = () => ({ date: "2026-06-26", lieu: "commission", type: "citation", texte: "x" });

function make(overrides = {}) {
  const promesse = {
    slug: "mobilite-1", file: F, thematique: "mobilite", numero: 1,
    intitule: "T", statut: "en-cours", chronologie: [event()], ...overrides,
  };
  return {
    promesses: [promesse],
    thematiques: [{ slug: "mobilite", nom: "Mobilité", file: "content/thematiques/mobilite.json" }],
    intervenants: [{ slug: "jlt", nom: "J", fonction: "M", fonction_courte: "M", file: "content/intervenants/jlt.json" }],
    reglages: { nombre_promesses: 1 },
  };
}
const run = (o, mutate) => {
  const c = make(o);
  mutate?.(c);
  return validateContent(c);
};

test("valid content has no error and no warning", () => {
  assert.deepEqual(run(), { errors: [], warnings: [] });
});

test("unknown statut", () => {
  assert.deepEqual(run({ statut: "fini" }).errors, [`${F} : statut « fini » inconnu`]);
});

test("unknown thematique", () => {
  const { errors } = run({ thematique: "xx", slug: "xx-1" });
  assert.deepEqual(errors, [`${F} : thematique « xx » inconnu`]);
});

test("unknown lieu and type", () => {
  const { errors } = run({ chronologie: [{ ...event(), lieu: "bar", type: "rumeur" }] });
  assert.deepEqual(errors, [`${F} : chronologie[0].lieu « bar » inconnu`, `${F} : chronologie[0].type « rumeur » inconnu`]);
});

test("unknown intervenant names file and field", () => {
  const { errors } = run({ chronologie: [{ ...event(), intervenant: "xyz" }] });
  assert.deepEqual(errors, [`${F} : chronologie[0].intervenant « xyz » inconnu`]);
});

test("slug must match thematique-numero", () => {
  const { errors } = run({ numero: 2 });
  assert.deepEqual(errors, [`${F} : le nom du fichier devrait être mobilite-2.json`]);
});

test("duplicate thematique+numero", () => {
  const { errors } = run({}, (c) => {
    c.promesses.push({ ...c.promesses[0], file: "content/promesses/dup.json", slug: "dup" });
    c.reglages.nombre_promesses = 2;
  });
  assert.ok(errors.includes("content/promesses/dup.json : doublon de mobilite-1 (content/promesses/mobilite-1.json)"));
});

test("missing intitule", () => {
  assert.deepEqual(run({ intitule: "" }).errors, [`${F} : intitule manquant`]);
});

test("missing event texte, type, lieu", () => {
  const { errors } = run({ chronologie: [{ date: "2026-06-26" }] });
  assert.deepEqual(errors, [
    `${F} : chronologie[0].lieu manquant`,
    `${F} : chronologie[0].type manquant`,
    `${F} : chronologie[0].texte manquant`,
  ]);
});

test("promesse count differs from reglages", () => {
  const { errors } = run({}, (c) => (c.reglages.nombre_promesses = 31));
  assert.deepEqual(errors, ["31 promesses attendues, 1 trouvées"]);
});

test("invalid dates", () => {
  const { errors } = run({ chronologie: [{ ...event(), date: "26/06/2026" }], point_de_vue: { texte: "t", date: "2026-13-40" } });
  assert.deepEqual(errors, [
    `${F} : chronologie[0].date « 26/06/2026 » invalide (AAAA-MM-JJ attendu)`,
    `${F} : point_de_vue.date « 2026-13-40 » invalide (AAAA-MM-JJ attendu)`,
  ]);
});

test("warning: no statut", () => {
  const r = run({ statut: undefined });
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.warnings, [`${F} : statut à venir`]);
});

test("warning: undated event", () => {
  const r = run({ chronologie: [event(), { lieu: "presse", type: "fait", texte: "y" }] });
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.warnings, [`${F} : chronologie[1] sans date`]);
});

test("warning: statut without justification, except non-engagee", () => {
  assert.deepEqual(run({ chronologie: [] }).warnings, [`${F} : statut « En cours » sans aucune justification`]);
  assert.deepEqual(run({ statut: "non-engagee", chronologie: [] }).warnings, []);
});

test("ContentValidationError carries errors", () => {
  const e = new ContentValidationError(["a", "b"]);
  assert.ok(e instanceof Error);
  assert.deepEqual(e.errors, ["a", "b"]);
  assert.match(e.message, /a\nb/);
});
