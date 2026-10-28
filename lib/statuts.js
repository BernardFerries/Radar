// Source of truth for status keys, labels and definitions (spec §5).
export const STATUTS = Object.freeze([
  { key: "appliquee", label: "Appliquée", court: ["appliquée", "appliquées"], definition: "Réalisée conformément à la promesse" },
  { key: "en-cours", label: "En cours", court: ["en cours", "en cours"], definition: "Engagée concrètement : marché lancé, budget voté, travaux démarrés" },
  { key: "en-partie", label: "En partie appliquée", court: ["en partie appliquée", "en partie appliquées"], definition: "Réalisée, mais en deçà de ce qui était promis" },
  { key: "non-engagee", label: "Non engagée", court: ["non engagée", "non engagées"], definition: "Aucun acte concret constaté à ce jour" },
  { key: "en-pause", label: "En pause", court: ["en pause", "en pause"], definition: "Engagée puis suspendue, ou repoussée sans date" },
  { key: "abandonnee", label: "Abandonnée ou non tenue", court: ["abandonnée", "abandonnées"], definition: "Renoncement public de la majorité, ou échéance dépassée" },
  { key: "inverifiable", label: "Invérifiable", court: ["invérifiable", "invérifiables"], definition: "Formulée trop vaguement pour être évaluée" },
].map(Object.freeze));

export const STATUT_A_VENIR = Object.freeze({ key: null, label: "Statut à venir", court: ["statut à venir", "statuts à venir"] });

export function getStatut(key) {
  return STATUTS.find((s) => s.key === key) ?? STATUT_A_VENIR;
}

export const LIEUX = Object.freeze({
  "conseil-municipal": "Conseil municipal",
  commission: "Commission",
  "marche-public": "Marché public",
  presse: "Presse",
  document: "Document",
  autre: "Autre",
});

export const TYPES = Object.freeze(["citation", "fait"]);

// « 5 non engagées et 1 abandonnée sur 6 »: every non-zero bucket, biggest first (stable sort keeps spec order on ties).
// `wrapCount` lets the template bold the numbers without this function emitting HTML.
export function compteThematique(repartition, total, wrapCount = String) {
  const parts = repartition
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count)
    .map((r) => `${wrapCount(r.count)} ${r.statut.court[r.count > 1 ? 1 : 0]}`);
  const list = parts.length > 1 ? `${parts.slice(0, -1).join(", ")} et ${parts.at(-1)}` : parts[0] ?? "0";
  return `${list} sur ${total}`;
}
