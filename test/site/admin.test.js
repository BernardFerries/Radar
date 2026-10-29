import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildSite } from "./build.js";
import { STATUTS, LIEUX, TYPES } from "../../lib/statuts.js";
import infra from "../../src/_data/infra.json" with { type: "json" };

const config = async () => (await buildSite()).get("/admin/config.yml");
const SVELTIA_URL = "https://unpkg.com/@sveltia/cms@0.253.1/dist/sveltia-cms.js";

test("backend comes from infra.json", async () => {
  const yml = await config();
  assert.ok(yml, "config.yml built");
  assert.ok(yml.includes(`repo: "${infra.github_repo}"`));
  assert.ok(yml.includes(`branch: "${infra.branche}"`));
  assert.match(yml, /publish_mode: simple/);
});

// Sveltia refuses a non-URL base_url; without one, editors can still sign in with a GitHub token.
test("base_url is emitted only once auth_url is an absolute URL", async () => {
  const yml = await config();
  if (/^https?:\/\//.test(infra.auth_url)) assert.ok(yml.includes(`base_url: "${infra.auth_url}"`));
  else assert.doesNotMatch(yml, /base_url/);
});

test("promesses cannot be created or deleted from the CMS", async () => {
  const yml = await config();
  const block = yml.split(/^  - name: /m).find((b) => b.startsWith('"promesses"'));
  assert.ok(block, "promesses collection");
  assert.match(block, /create: false/);
  assert.match(block, /delete: false/);
  assert.match(block, /folder: "content\/promesses"/);
});

test("select options are generated from the catalogue", async () => {
  const yml = await config();
  for (const s of STATUTS) {
    assert.ok(yml.includes(`value: "${s.key}"`), s.key);
    assert.ok(yml.includes(`label: "${s.label}"`), s.label);
  }
  for (const [k, label] of Object.entries(LIEUX)) {
    assert.ok(yml.includes(`value: "${k}"`), k);
    assert.ok(yml.includes(`label: "${label}"`), label);
  }
  for (const t of TYPES) assert.ok(yml.includes(`value: "${t}"`), t);
});

test("field names match the keys the lib reads", async () => {
  const yml = await config();
  const names = ["thematique", "numero", "intitule", "statut", "source", "planning_budget", "resume", "lien", "chronologie", "date", "lieu", "intervenant", "type", "texte", "point_de_vue", "nom", "fonction", "fonction_courte"];
  for (const n of names) assert.ok(yml.includes(`name: "${n}"`), n);
  const reglages = Object.keys(JSON.parse(fs.readFileSync("content/reglages.json", "utf8")));
  for (const k of reglages) assert.ok(yml.includes(`name: "${k}"`), `reglages.${k}`);
});

test("intervenants are referenced by slug and can be created", async () => {
  const yml = await config();
  assert.match(yml, /value_field: "\{\{slug\}\}"/);
  assert.match(yml, /folder: "content\/intervenants"/);
});

test("admin page loads the pinned Sveltia script only and is not indexed", async () => {
  const html = fs.readFileSync("src/admin/index.html", "utf8");
  const scripts = [...html.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(scripts, [SVELTIA_URL]);
  assert.match(html, /<meta name="robots" content="noindex">/);
});

// One line per field: the generated YAML keeps each field in a flow mapping.
const fieldLine = (yml, name, extra = "") => yml.split("\n").filter((l) => l.includes(`name: "${name}"`) && l.includes(extra));

test("only options Sveltia 0.253.1 supports: no add_btn_text", async () => {
  assert.ok(!(await config()).includes("add_btn_text"));
});

test("nombre_promesses is read-only: changing it breaks the build", async () => {
  const [line] = fieldLine(await config(), "nombre_promesses");
  assert.match(line, /readonly: true/);
});

test("uploads are served from /assets/uploads", async () => {
  const yml = await config();
  assert.match(yml, /^media_folder: "src\/assets\/uploads"$/m);
  assert.match(yml, /^public_folder: "\/assets\/uploads"$/m);
});

test("every lien field only accepts an http(s) URL or a site path", async () => {
  const lines = fieldLine(await config(), "lien");
  assert.equal(lines.length, 2, "event lien and planning_budget lien");
  for (const line of lines) assert.ok(line.includes('pattern: ["^(https?://|/)", "'), line);
  const re = new RegExp("^(https?://|/)");
  for (const ok of ["https://www.escalquens.fr/pv.pdf", "http://a.fr", "/documents/plannings-et-budgets.pdf"]) assert.ok(re.test(ok), ok);
  for (const bad of ["documents/x.pdf", "www.escalquens.fr", "javascript:alert(1)"]) assert.ok(!re.test(bad), bad);
});

test("a point de vue needs its date once the block is added", async () => {
  const yml = await config();
  // Sveltia validates an optional object's subfields only after the editor ticks « Ajouter … ».
  for (const label of ["Point de vue de l'opposition", "Point de vue sur la thématique"]) {
    const block = yml.slice(yml.indexOf(`label: "${label}"`)).split("\n").slice(0, 9).join("\n");
    assert.match(block, /name: "point_de_vue"[\s\S]*required: false/, label);
    assert.match(block, /name: "date", widget: "datetime"[^\n]*required: true/, label);
  }
});

test("the qui sommes-nous hint points to the accueil, where the text is shown", async () => {
  const [line] = fieldLine(await config(), "qui_sommes_nous");
  assert.match(line, /accueil/);
  assert.doesNotMatch(line, /La démarche/);
});
