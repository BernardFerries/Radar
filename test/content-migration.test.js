import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadContent } from "../lib/content.js";
import { buildRadar } from "../lib/radar.js";

// Invariants on the real content/. Editors change statuses and events through the CMS, so nothing here pins live values;
// the exact migration snapshot is kept outside this repository.
const CONTENT_DIR = fileURLToPath(new URL("../content", import.meta.url));
const etatAu = new Date("2026-10-28T12:00:00Z");

function contentFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { recursive: true })
    .map((f) => path.join(dir, f))
    .filter((f) => f.endsWith(".json"));
}

const load = () => loadContent(CONTENT_DIR);
const events = (content) => content.promesses.flatMap((p) => p.chronologie.map((ev, i) => ({ p, ev, i })));

test("real content builds: 31 promesses, 9 thématiques", () => {
  const radar = buildRadar(load(), { etatAu });
  assert.equal(radar.total, 31);
  assert.equal(radar.thematiques.length, 9);
});

test("no encoding leftover is published", () => {
  const files = contentFiles(CONTENT_DIR);
  assert.ok(files.length > 0, "content/ has files");
  const forbidden = ["&#", "&nbsp;", "�"];
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    for (const s of forbidden) assert.ok(!text.includes(s), `${file} contains « ${s} »`);
  }
});

test("no speaker initials left in chronology texts", () => {
  for (const { p, ev } of events(load())) {
    assert.doesNotMatch(ev.texte, /\b(JLT|MOBS)\b/, `${p.slug}: speaker initials left in texte`);
  }
});

test("every planning & budget box links to the PDF", () => {
  for (const p of load().promesses.filter((x) => x.planning_budget)) {
    assert.equal(p.planning_budget.lien, "/documents/plannings-et-budgets.pdf", p.slug);
  }
});
