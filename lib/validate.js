import { STATUTS, LIEUX, TYPES, getStatut } from "./statuts.js";

export class ContentValidationError extends Error {
  constructor(errors) {
    super(errors.join("\n"));
    this.name = "ContentValidationError";
    this.errors = errors;
  }
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// The regex alone accepts 2026-13-40; round-tripping rejects it.
function isValidDate(value) {
  if (typeof value !== "string" || !DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(value);
}

function checkDate(value, field, p, errors) {
  if (value !== undefined && !isValidDate(value)) {
    errors.push(`${p.file} : ${field} « ${value} » invalide (AAAA-MM-JJ attendu)`);
  }
}

function checkEvent(ev, i, p, refs, { errors, warnings }) {
  const at = `chronologie[${i}]`;
  const unknown = (field, value) => errors.push(`${p.file} : ${at}.${field} « ${value} » inconnu`);
  if (!ev.lieu) errors.push(`${p.file} : ${at}.lieu manquant`);
  else if (!(ev.lieu in LIEUX)) unknown("lieu", ev.lieu);
  if (!ev.type) errors.push(`${p.file} : ${at}.type manquant`);
  else if (!TYPES.includes(ev.type)) unknown("type", ev.type);
  if (!ev.texte) errors.push(`${p.file} : ${at}.texte manquant`);
  if (ev.intervenant && !refs.intervenants.has(ev.intervenant)) unknown("intervenant", ev.intervenant);
  if (ev.date === undefined) warnings.push(`${p.file} : ${at} sans date`);
  else checkDate(ev.date, `${at}.date`, p, errors);
}

function checkStatut(p, out) {
  if (p.statut === undefined) {
    out.warnings.push(`${p.file} : statut à venir`);
  } else if (!STATUTS.some((s) => s.key === p.statut)) {
    out.errors.push(`${p.file} : statut « ${p.statut} » inconnu`);
  } else if (p.statut !== "non-engagee" && !p.chronologie?.length) {
    out.warnings.push(`${p.file} : statut « ${getStatut(p.statut).label} » sans aucune justification`);
  }
}

function checkPromesse(p, refs, out) {
  const { errors } = out;
  if (!p.intitule) errors.push(`${p.file} : intitule manquant`);
  if (!refs.thematiques.has(p.thematique)) errors.push(`${p.file} : thematique « ${p.thematique} » inconnu`);
  const expected = `${p.thematique}-${p.numero}`;
  if (p.slug !== expected) errors.push(`${p.file} : le nom du fichier devrait être ${expected}.json`);
  checkStatut(p, out);
  (p.chronologie ?? []).forEach((ev, i) => checkEvent(ev, i, p, refs, out));
  if (p.point_de_vue) checkDate(p.point_de_vue.date, "point_de_vue.date", p, errors);
}

function checkDuplicates(promesses, errors) {
  const seen = new Map();
  for (const p of promesses) {
    const id = `${p.thematique}-${p.numero}`;
    if (seen.has(id)) errors.push(`${p.file} : doublon de ${id} (${seen.get(id)})`);
    else seen.set(id, p.file);
  }
}

export function validateContent(content) {
  const out = { errors: [], warnings: [] };
  const refs = {
    thematiques: new Set(content.thematiques.map((t) => t.slug)),
    intervenants: new Set(content.intervenants.map((i) => i.slug)),
  };
  content.promesses.forEach((p) => checkPromesse(p, refs, out));
  checkDuplicates(content.promesses, out.errors);
  const expected = content.reglages.nombre_promesses;
  if (content.promesses.length !== expected) {
    out.errors.push(`${expected} promesses attendues, ${content.promesses.length} trouvées`);
  }
  return out;
}
