import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const css = fs.readFileSync("src/assets/css/main.css", "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
// Innermost rules only: a @media wrapper never matches, its nested rules do.
const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ selector: m[1].trim(), body: m[2] }));
const tokens = Object.fromEntries([...rules.find((r) => r.selector === ":root").body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
const resolve = (v) => v
  .replace(/var\((--[\w-]+)\)/g, (_, name) => resolve(tokens[name]))
  .replace(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i, "#$1$1$2$2$3$3");

const rgb = (hex) => hex.replace("#", "").match(/../g).map((x) => parseInt(x, 16) / 255);
const luminance = (hex) => {
  const [r, g, b] = rgb(hex).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
function hsl(hex) {
  const [r, g, b] = rgb(hex);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  if (!d) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: (h * 60 + 360) % 360, s, l };
}

test("red is used only for abandonnee and the citation filet (spec §4, §6.2)", () => {
  const red = tokens["--statut-abandonnee"].toLowerCase();
  const allowed = [":root", ".statut-abandonnee", "blockquote.ev-texte"];
  for (const { selector, body } of rules) {
    const usesRed = /var\(--(accent|statut-abandonnee)\)/.test(body) || body.toLowerCase().includes(red);
    if (usesRed) assert.ok(allowed.includes(selector), `${selector} uses red`);
  }
});

test("status colours follow the spec §5 intentions, and « à venir » is hatched", () => {
  const c = (key) => hsl(tokens[`--statut-${key}`]);
  const hueIn = (key, from, to) => assert.ok(c(key).h >= from && c(key).h <= to && c(key).s > 0.3, `${key}: ${JSON.stringify(c(key))}`);
  hueIn("appliquee", 90, 160); // vert
  // en-cours is a washed-out slate (user's choice): bluish and pale so it never reads as achieved,
  // yet saturated enough not to be mistaken for the en-pause grey.
  const enCours = c("en-cours");
  assert.ok(enCours.h >= 195 && enCours.h <= 240 && enCours.s >= 0.15 && enCours.l > 0.6, `en-cours: ${JSON.stringify(enCours)}`);
  hueIn("en-partie", 40, 60); // jaune
  hueIn("inverifiable", 255, 290); // violet
  assert.ok(c("abandonnee").h <= 15 || c("abandonnee").h >= 345, "abandonnee: rouge");
  for (const key of ["non-engagee", "en-pause"]) assert.ok(c(key).s < 0.12, `${key}: gris`);
  assert.ok(c("non-engagee").l < 0.35, "non-engagee: gris foncé");
  assert.ok(c("en-pause").l > 0.55, "en-pause: gris clair");
  assert.match(tokens["--statut-a-venir"], /^repeating-linear-gradient\(/);
});

test("every text colour reaches WCAG AA (4.5:1) on the background it sits on", () => {
  const dark = resolve("var(--texte)");
  const light = [resolve("var(--fond)"), resolve("var(--fond-carte)"), "#f1ece3"];
  let checked = 0;
  for (const { selector, body } of rules) {
    const m = body.match(/(?:^|;)\s*color\s*:\s*([^;]+)/);
    if (!m || m[1].trim() === "inherit") continue;
    const color = resolve(m[1].trim());
    assert.match(color, /^#[0-9a-f]{6}$/i, `${selector}: ${color}`);
    const onDark = /^\.pv|aria-pressed="true"/.test(selector);
    for (const bg of onDark ? [dark] : light) {
      assert.ok(contrast(color, bg) >= 4.5, `${selector}: ${color} on ${bg} = ${contrast(color, bg).toFixed(2)}`);
    }
    checked++;
  }
  assert.ok(checked > 10, `${checked} colour declarations checked`);
});
