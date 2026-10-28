// Progressive enhancement: the static page lists everything; this only narrows it.
(() => {
  const chips = [...document.querySelectorAll("[data-filtre]")];
  const rows = [...document.querySelectorAll(".ligne")];
  const groups = [...document.querySelectorAll("[data-groupe]")];
  const empty = document.querySelector("[data-vide]");
  if (!chips.length) return;

  const params = new URLSearchParams(location.search);
  const state = { statut: params.get("statut") ?? "", thematique: params.get("thematique") ?? "" };

  function render() {
    for (const row of rows) {
      row.hidden = (state.statut && row.dataset.statut !== state.statut)
        || (state.thematique && row.dataset.thematique !== state.thematique);
    }
    // A group heading with no visible row would look like an empty section.
    for (const g of groups) g.hidden = !g.querySelector(".ligne:not([hidden])");
    if (empty) empty.hidden = rows.some((r) => !r.hidden);
    for (const c of chips) c.setAttribute("aria-pressed", String(state[c.dataset.filtre] === c.dataset.valeur));

    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(state)) if (v) next.set(k, v);
    const qs = next.toString();
    history.replaceState(null, "", location.pathname + (qs ? `?${qs}` : "") + location.hash);
  }

  for (const c of chips) {
    c.hidden = false;
    c.addEventListener("click", () => {
      const { filtre, valeur } = c.dataset;
      // Clicking the active chip again goes back to "all".
      state[filtre] = state[filtre] === valeur ? "" : valeur;
      render();
    });
  }
  render();
})();
