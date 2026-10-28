import { test } from "node:test";
import assert from "node:assert/strict";
import { formatDateFr, summarize, eventSummary, isoDateParis, shareDescription } from "./format.js";

test("formatDateFr formats ISO dates in French", () => {
  assert.equal(formatDateFr("2026-09-18"), "18 septembre 2026");
  assert.equal(formatDateFr("2026-06-01"), "1er juin 2026");
});

test("summarize returns short text unchanged", () => {
  assert.equal(summarize("Court.", 140), "Court.");
});

test("summarize cuts at a word boundary and adds an ellipsis", () => {
  const out = summarize("mot ".repeat(250), 140);
  assert.ok(out.length <= 141);
  assert.ok(out.endsWith("…"));
  assert.match(out, /^(mot )*mot…$/);
});

test("eventSummary wraps citations in guillemets", () => {
  assert.equal(eventSummary({ type: "citation", texte: "Pas de besoin." }, 140), "« Pas de besoin. »");
  assert.equal(eventSummary({ type: "fait", texte: "Vote." }, 140), "Vote.");
});

test("summarize collapses newlines and repeated spaces into one line", () => {
  assert.equal(summarize("Ligne un.\n\n- point  deux\n", 140), "Ligne un. - point deux");
  assert.equal(summarize("un\ndeux trois quatre", 8), "un deux…");
});

test("isoDateParis gives the Paris calendar day", () => {
  assert.equal(isoDateParis(new Date("2026-10-27T23:30:00Z")), "2026-10-28");
});

test("shareDescription starts with the label and stays within 200 characters", () => {
  assert.equal(shareDescription("En cours", null), "En cours");
  assert.equal(shareDescription("Non engagée", null, true), "Non engagée · Aucun acte concret constaté");
  const out = shareDescription("Abandonnée ou non tenue", "« " + "x".repeat(146) + " »");
  assert.ok(out.startsWith("Abandonnée ou non tenue · "));
  assert.ok(out.length <= 200);
});
