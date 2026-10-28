import infra from "./infra.json" with { type: "json" };

const PLACEHOLDER = "[À COMPLÉTER]";

// RADAR_SITE_URL overrides infra.json for one build (tests, previews) without editing it.
// Empty while unknown: pages then use relative URLs and omit the canonical.
const raw = process.env.RADAR_SITE_URL ?? infra.site_url;

export default { url: raw && raw !== PLACEHOLDER ? raw.replace(/\/+$/, "") : "" };
