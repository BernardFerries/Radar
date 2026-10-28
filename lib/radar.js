import { STATUTS, STATUT_A_VENIR, LIEUX, getStatut } from "./statuts.js";
import { validateContent, ContentValidationError } from "./validate.js";
import { eventSummary } from "./format.js";

const fr = (a, b) => a.localeCompare(b, "fr");
// Three most recent changes are enough for the home page.
const RECENTS_MAX = 3;
const RESUME_MAX = 140;
const RANKED_AGAINST = ["abandonnee", "non-engagee", "en-pause"];

function countByStatut(promesses) {
  // A missing statut is its own bucket: counting it as non-engagee would invent a verdict.
  return [...STATUTS, STATUT_A_VENIR].map((statut) => ({
    statut,
    count: promesses.filter((p) => p.statut.key === statut.key).length,
  }));
}

function sortChronologie(events) {
  const dated = events.filter((e) => e.date).sort((a, b) => b.date.localeCompare(a.date));
  return [...dated, ...events.filter((e) => !e.date)];
}

function viewEvent(ev, intervenants) {
  const intervenantObj = intervenants.get(ev.intervenant);
  return { ...ev, lieuLabel: LIEUX[ev.lieu], ...(intervenantObj && { intervenantObj }) };
}

function viewPromesse(p, ctx) {
  const chronologie = sortChronologie((p.chronologie ?? []).map((e) => viewEvent(e, ctx.intervenants)));
  const them = ctx.thematiques.get(p.thematique);
  return {
    ...p,
    url: `/promesses/${p.slug}/`,
    statut: getStatut(p.statut),
    thematiqueObj: { slug: them.slug, nom: them.nom },
    chronologie,
    derniereEvolution: chronologie.find((e) => e.date)?.date ?? null,
    resume: chronologie.length ? eventSummary(chronologie[0], RESUME_MAX) : null,
    rang: p.numero,
    totalThematique: ctx.parTheme.get(p.thematique).length,
  };
}

function link(promesses) {
  promesses.forEach((p, i) => {
    p.precedente = promesses[i - 1] ?? null;
    p.suivante = promesses[i + 1] ?? null;
  });
}

function viewThematique(t, promesses) {
  const mine = promesses.filter((p) => p.thematiqueObj.slug === t.slug).sort((a, b) => a.numero - b.numero);
  const against = mine.filter((p) => RANKED_AGAINST.includes(p.statut.key)).length;
  return { ...t, url: `/thematiques/${t.slug}/`, promesses: mine, repartition: countByStatut(mine), score: mine.length ? against / mine.length : 0 };
}

// Keeps the event view (lieuLabel, intervenantObj): a citation is never shown without its speaker or lieu (spec §4).
function recentEvents(promesses) {
  return promesses
    .flatMap((promesse) => promesse.chronologie.filter((e) => e.date).map((e) => ({ ...e, promesse })))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, RECENTS_MAX);
}

function buildConstat(promesses, { statuts, phrase }) {
  const nombre = promesses.filter((p) => statuts.includes(p.statut.key)).length;
  return { nombre, phrase: phrase.replace("{total}", String(promesses.length)) };
}

export function buildRadar(content, { etatAu }) {
  const { errors, warnings } = validateContent(content);
  if (errors.length) throw new ContentValidationError(errors);

  const parTheme = Map.groupBy(content.promesses, (p) => p.thematique);
  const ctx = {
    parTheme,
    thematiques: new Map(content.thematiques.map((t) => [t.slug, t])),
    intervenants: new Map(content.intervenants.map((i) => [i.slug, i])),
  };
  const views = content.promesses.map((p) => viewPromesse(p, ctx));
  const promesses = [...views].sort((a, b) => fr(a.thematiqueObj.nom, b.thematiqueObj.nom) || a.numero - b.numero);
  link(promesses);

  const thematiques = content.thematiques
    .map((t) => viewThematique(t, views))
    .sort((a, b) => b.score - a.score || fr(a.nom, b.nom));

  return {
    etatAu,
    reglages: content.reglages,
    warnings,
    total: views.length,
    repartition: countByStatut(views),
    constat: buildConstat(views, content.reglages.constat),
    thematiques,
    promesses,
    recents: recentEvents(views),
    intervenants: content.intervenants,
  };
}
