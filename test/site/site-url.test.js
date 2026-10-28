import { test } from "node:test";
import assert from "node:assert/strict";

// Stands in for a filled infra.site_url without touching infra.json; the trailing slash must not double up.
process.env.RADAR_SITE_URL = "https://radar.example.org/";
const { buildSite } = await import("./build.js");

test("a known site URL gives absolute og:image and a canonical on every public page", async () => {
  const pages = [...(await buildSite())].filter(([url, html]) => html?.includes("<html") && url !== "/admin/");
  assert.ok(pages.length > 40);
  for (const [url, html] of pages) {
    assert.ok(html.includes('property="og:image" content="https://radar.example.org/assets/img/og-default.png"'), url);
    assert.equal((html.match(/rel="canonical"/g) ?? []).length, 1, url);
    assert.ok(html.includes(`<link rel="canonical" href="https://radar.example.org${url}">`), url);
  }
});
