# Guide d'installation

Ce guide met en ligne le Radar et son interface d'édition. Les interfaces de GitHub, Cloudflare (pour la seule connexion à l'interface d'édition) et Sveltia évoluent : **l'interface peut différer de ce qui est décrit ici. En cas de doute, suivez la documentation officielle**, liée à chaque étape.

Tout ce qui dépend de votre installation est rassemblé dans un seul fichier, `src/_data/infra.json`, dont les valeurs valent `[À COMPLÉTER]` tant qu'elles ne sont pas renseignées :

| Clé | Valeur |
|---|---|
| `site_url` | adresse publique du site, sans `/` final |
| `github_repo` | `organisation/nom-du-depot` |
| `branche` | `main` |
| `auth_url` | adresse du Worker d'authentification (étape 3) |

**Modifier ce fichier depuis le navigateur** : sur la page du dépôt GitHub, ouvrez `src/_data/infra.json`, cliquez sur l'icône crayon (« Edit this file »), remplacez les valeurs entre guillemets, puis validez avec « Commit changes » en choisissant de valider directement sur la branche `main`. Chaque validation relance la mise en ligne du site.

**Tant que ces valeurs ne sont pas renseignées** : le site public se construit et s'affiche, mais `/admin/` ne permet pas de se connecter, et les adresses canoniques et de partage (balises `canonical` et `og:`) restent relatives.

## 1. Le dépôt GitHub

Le code est publié dans le dépôt **public** <https://github.com/BernardFerries/Radar>, sur la branche `main`. Il ne contient que le site : l'ancien site, les notes de travail et le rapport de reprise sont conservés hors du dépôt public. `github_repo` et `branche` sont déjà renseignés dans `infra.json`.

## 2. L'hébergement GitHub Pages

Le site est construit et publié par le workflow `.github/workflows/pages.yml` à chaque commit sur `main`, donc à chaque enregistrement dans l'interface d'édition. Adresse : <https://bernardferries.github.io/Radar/> (déjà renseignée dans `site_url`).

**Activation, une seule fois, par le propriétaire du dépôt** (le droit d'écriture ne suffit pas) : dans le dépôt, *Settings → Pages*, choisir comme source « GitHub Actions ». Documentation : <https://docs.github.com/fr/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site>. Relancer ensuite le workflow « Publication GitHub Pages » depuis l'onglet *Actions* (bouton « Run workflow »), ou attendre le prochain commit.

### Si le déploiement échoue

Ne cherchez pas à corriger. Dans l'onglet *Actions* du dépôt, ouvrez l'exécution en échec du workflow « Publication GitHub Pages » et transmettez son lien à la personne développeuse, avec l'heure de la modification.

## 3. La connexion à l'interface d'édition (Worker `sveltia-cms-auth`)

L'interface `/admin/` s'appuie sur un petit service, `sveltia-cms-auth`, pour que les membres se connectent avec leur compte GitHub. Suivez son mode d'emploi officiel : <https://github.com/sveltia/sveltia-cms-auth>. En résumé, ce qu'il demande (extrait de son README) :

1. Déployer ce projet sur Cloudflare Workers, puis noter l'adresse du Worker obtenu.
2. Enregistrer sur GitHub une application OAuth (<https://github.com/settings/applications/new>, ou depuis l'organisation) dont l'**Authorization callback URL** est `<adresse du Worker>/callback`, puis générer un secret client.
3. Renseigner dans les variables du Worker `GITHUB_CLIENT_ID` et `GITHUB_CLIENT_SECRET` (valeurs de l'application OAuth), et, fortement recommandé, `ALLOWED_DOMAINS` (nom de domaine du site : `bernardferries.github.io`).
4. Renseigner l'adresse du Worker dans `auth_url` de `infra.json`.

Test : ouvrez `/admin/` et connectez-vous avec GitHub.

## 4. Inviter les éditeurs

Ajoutez chaque membre comme collaborateur du dépôt, avec le droit d'écriture. Documentation : <https://docs.github.com/fr/account-and-profile/setting-up-and-managing-your-personal-account-on-github/managing-access-to-your-personal-repositories/inviting-collaborators-to-a-personal-repository> (pour une organisation : <https://docs.github.com/fr/organizations>). Chacun accepte l'invitation reçue par e-mail, puis suit le [guide de l'éditeur](guide-editeur.md).

## 5. Domaine personnalisé (facultatif)

Suivez la documentation GitHub Pages : <https://docs.github.com/fr/pages/configuring-a-custom-domain-for-your-github-pages-site>. Avec un domaine, le site n'est plus servi sous `/Radar/` : retirez `ELEVENTY_PATH_PREFIX` du workflow `pages.yml` (personne développeuse), puis mettez à jour `site_url` dans `infra.json` et `ALLOWED_DOMAINS` du Worker d'authentification.

## Tester en local, sans compte

Voir le [README](../README.md).
