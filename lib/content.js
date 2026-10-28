import fs from "node:fs";
import path from "node:path";

function readJson(abs) {
  const file = path.relative(process.cwd(), abs).split(path.sep).join("/");
  try {
    return { ...JSON.parse(fs.readFileSync(abs, "utf8")), file };
  } catch (err) {
    // Name the file: a bare JSON.parse message is useless to an editor.
    throw new Error(`${file} : JSON illisible (${err.message})`, { cause: err });
  }
}

// Sveltia writes "" or null for optional fields an editor leaves blank; treat
// them as absent so validation and templates never see empty values.
const isBlank = (v) => v == null || (typeof v === "string" && v.trim() === "");

function dropBlank(obj, keys) {
  const out = { ...obj };
  for (const k of keys) if (isBlank(out[k])) delete out[k];
  return out;
}

function cleanPointDeVue(pdv) {
  const clean = pdv && dropBlank(pdv, ["texte", "date"]);
  return clean?.texte ? clean : undefined;
}

function cleanPlanningBudget(pb) {
  const clean = pb && dropBlank(pb, ["resume", "lien"]);
  return clean && (clean.resume || clean.lien) ? clean : undefined;
}

function withOptional(obj, key, value) {
  const { [key]: _old, ...rest } = obj;
  return value === undefined ? rest : { ...rest, [key]: value };
}

function normalizePromesse(p) {
  let out = dropBlank(p, ["statut", "source"]);
  out = withOptional(out, "planning_budget", cleanPlanningBudget(p.planning_budget));
  out = withOptional(out, "point_de_vue", cleanPointDeVue(p.point_de_vue));
  if (Array.isArray(p.chronologie)) {
    out.chronologie = p.chronologie.map((ev) => dropBlank(ev, ["date", "intervenant", "lien"]));
  }
  return out;
}

function normalizeThematique(t) {
  return withOptional(t, "point_de_vue", cleanPointDeVue(t.point_de_vue));
}

function readCollection(dir, name, normalize = (x) => x) {
  const base = path.join(dir, name);
  if (!fs.existsSync(base)) return [];
  return fs
    .readdirSync(base)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => normalize({ ...readJson(path.join(base, f)), slug: path.basename(f, ".json") }));
}

export function loadContent(dir) {
  const { file, ...reglages } = readJson(path.join(dir, "reglages.json"));
  return {
    promesses: readCollection(dir, "promesses", normalizePromesse),
    thematiques: readCollection(dir, "thematiques", normalizeThematique),
    intervenants: readCollection(dir, "intervenants"),
    reglages,
  };
}
