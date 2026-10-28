import { test } from "node:test";
import assert from "node:assert/strict";
import { STATUTS, STATUT_A_VENIR, getStatut, LIEUX, TYPES, compteThematique } from "./statuts.js";

test("seven statuts in spec order", () => {
  assert.deepEqual(
    STATUTS.map((s) => s.key),
    ["appliquee", "en-cours", "en-partie", "non-engagee", "en-pause", "abandonnee", "inverifiable"],
  );
  assert.equal(STATUTS[5].label, "Abandonnée ou non tenue");
  assert.ok(STATUTS.every((s) => s.definition));
});

test("missing statut is « Statut à venir »", () => {
  assert.equal(getStatut(undefined).label, "Statut à venir");
  assert.equal(getStatut(undefined), STATUT_A_VENIR);
  assert.equal(getStatut("en-cours").label, "En cours");
});

test("lieux and types", () => {
  assert.equal(LIEUX["marche-public"], "Marché public");
  assert.equal(Object.keys(LIEUX).length, 6);
  assert.deepEqual(TYPES, ["citation", "fait"]);
});

const rep = (counts) => Object.entries(counts).map(([key, count]) => ({ statut: getStatut(key), count }));

test("compteThematique lists every non-zero bucket, biggest first", () => {
  assert.equal(compteThematique(rep({ "non-engagee": 5, abandonnee: 1 }), 6), "5 non engagées et 1 abandonnée sur 6");
  assert.equal(compteThematique(rep({ "en-cours": 1 }), 1), "1 en cours sur 1");
  assert.equal(compteThematique(rep({ "non-engagee": 4 }), 4), "4 non engagées sur 4");
  assert.equal(compteThematique(rep({ "en-cours": 1, "non-engagee": 3, abandonnee: 2 }), 6), "3 non engagées, 2 abandonnées et 1 en cours sur 6");
});

test("compteThematique uses the singular, the a-venir bucket and the wrap hook", () => {
  assert.equal(compteThematique([{ statut: STATUT_A_VENIR, count: 2 }], 2), "2 statuts à venir sur 2");
  assert.equal(compteThematique(rep({ "non-engagee": 1 }), 3, (n) => `<b>${n}</b>`), "<b>1</b> non engagée sur 3");
});
