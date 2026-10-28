# Radar Escalquens

Site de suivi des 31 promesses de campagne de la majorité municipale d'Escalquens, réalisé par le groupe d'opposition Nouveau Cap. Site statique [Eleventy](https://www.11ty.dev/) 3, contenu en JSON dans `content/`, édition via Sveltia CMS sur `/admin/`.

## Développement

Node 24 requis (voir `.nvmrc`).

```bash
npm ci
npm run serve   # aperçu local sur http://localhost:8080
npm test
npm run build   # produit _site/
```

## Tester l'édition en local, sans compte

**Non encore testé manuellement.** Étapes déduites de Sveltia CMS 0.253.1 :

1. Lancez `npm run serve`.
2. Ouvrez <http://localhost:8080/admin/> dans Chromium, Chrome ou Edge. Le mode local de Sveltia n'existe pas dans Firefox ni Safari, et il n'est proposé que sur `localhost`.
3. Cliquez sur « Work with Local Repository » (« Travailler avec un dépôt local » si l'interface est en français), puis sélectionnez le dossier du projet, celui qui contient `content/`.
4. Chaque enregistrement modifie les fichiers de `content/` sur le disque, sans commit Git (option désactivée par défaut dans Sveltia). Vérifiez avec `git diff content/`.

Eleventy ne surveille pas `content/`, qui est hors de `src/`. Si l'aperçu ne reflète pas une modification, relancez `npm run serve`.

## Documentation

- [Guide de l'éditeur](docs/guide-editeur.md) : modifier le contenu sans coder
- [Guide d'installation](docs/guide-installation.md) : GitHub Pages, authentification

Les valeurs propres à l'installation (URL du site, dépôt, Worker d'authentification) sont dans `src/_data/infra.json`.
