// Noon UTC keeps the calendar day stable once converted to Paris time.
const FR_DATE = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris",
});

export function formatDateFr(iso) {
  // Intl omits the French ordinal, so « 1 juin » is fixed up by hand.
  return FR_DATE.format(new Date(`${iso}T12:00:00Z`)).replace(/^1 /, "1er ");
}

// Cuts at a word boundary so a list summary never ends mid-word.
export function summarize(raw, max) {
  // Editor text has line breaks; summaries must stay on one line.
  const text = raw.replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max + 1);
  const lastSpace = cut.lastIndexOf(" ");
  const head = lastSpace > 0 ? cut.slice(0, lastSpace) : text.slice(0, max);
  return `${head.trimEnd()}…`;
}

export function eventSummary(event, max) {
  const text = summarize(event.texte, max);
  return event.type === "citation" ? `« ${text} »` : text;
}

// formatDateFr wants an ISO day; Date#toISOString would be UTC and can be off by one in Paris.
const PARIS_DAY = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" });

export function isoDateParis(date) {
  return PARIS_DAY.format(date);
}

// Label + one-line summary of the latest event; the summary is already capped (≤ 146 chars with guillemets).
export function shareDescription(label, resume, noActe = false) {
  if (resume) return `${label} · ${resume}`;
  return noActe ? `${label} · Aucun acte concret constaté` : label;
}
