import { loadContent } from "../../lib/content.js";
import { buildRadar } from "../../lib/radar.js";

// ContentValidationError is deliberately not caught: bad content must fail the build.
const content = loadContent(process.env.RADAR_CONTENT_DIR ?? "content");
const radar = buildRadar(content, { etatAu: new Date() });
radar.warnings.forEach((w) => console.warn("[radar]", w));

export default radar;
