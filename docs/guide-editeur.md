# Guide de l'éditeur

Ce guide explique comment modifier le Radar d'Escalquens sans toucher au code. Chaque enregistrement publie directement une modification : le site est mis à jour au bout de quelques minutes.

**Langue de l'interface.** L'interface d'édition (Sveltia CMS) s'affiche en français si votre navigateur est réglé en français. Sinon, elle s'affiche en anglais : ouvrez le menu de votre compte (barre du haut), puis **Settings › Language › User Interface Language** et choisissez Français. Ce guide donne les libellés en français, avec l'anglais entre parenthèses. Quelques messages rares restent en anglais, même avec l'interface en français. Les noms des rubriques et des champs (**Promesses**, **Chronologie**, **Statut**…) sont en français dans les deux cas.

## 1. Avant de commencer (une seule fois)

1. Créez un compte gratuit sur [github.com](https://github.com/signup) (bouton « Sign up »). Utilisez l'adresse e-mail à laquelle l'invitation sera envoyée, ou communiquez la vôtre à la personne qui administre le site.
2. Ouvrez l'e-mail « Invitation to collaborate » reçu de GitHub et cliquez sur « View invitation », puis sur « Accept invitation ».

## 2. Se connecter

1. Allez à l'adresse du site suivie de `/admin/` (par exemple `https://votre-site.fr/admin/`).
2. Cliquez sur **Se connecter avec GitHub** (« Sign In with GitHub »). Une fenêtre GitHub s'ouvre : identifiez-vous, puis autorisez l'accès (bouton « Authorize »).
3. Vous arrivez sur la liste des contenus : **Promesses**, **Thématiques**, **Intervenants**, **Réglages**.

Il y a 31 promesses, fixes : on ne peut ni en créer ni en supprimer. On modifie leur statut et leur chronologie.

## 3. Ajouter un événement à une promesse

1. Cliquez sur **Promesses**, puis sur la promesse voulue (affichée sous la forme `mobilite-1 · Intitulé`).
2. Descendez jusqu'à **Chronologie**, puis cliquez sur **Ajouter événement** (« Add événement »). Un nouvel événement apparaît, à remplir :
   - **Date** : le jour où cela s'est passé. Laissez vide si vous l'ignorez : l'événement s'affiche alors en dernier, avec la mention « date non précisée ».
   - **Lieu** : choisissez dans la liste (Conseil municipal, Commission, Marché public, Presse, Document, Autre). « Autre » n'est pas affiché sur le site.
   - **Intervenant** : la personne qui parle. Laissez vide pour un fait sans intervenant. Une personne absente de la liste s'ajoute dans **Intervenants** (voir plus bas).
   - **Type** : choisissez **Citation** si le texte reprend les mots exacts d'une personne ; choisissez **Fait** pour tout le reste (un vote, un marché lancé, une absence d'action constatée).
   - **Texte** : la citation exacte, ou le fait en une ou deux phrases.
   - **Lien** (facultatif) : l'adresse de la source (procès-verbal, article). Elle doit commencer par `https://`, ou par `/` pour un document du site.
3. Cliquez sur **Enregistrer** (« Save »), en haut à droite, ou appuyez sur Ctrl + S.

Pour corriger un événement existant, cliquez sur sa ligne dans la chronologie pour le déplier, modifiez, puis enregistrez.

## 4. Changer le statut d'une promesse

1. Ouvrez la promesse.
2. Dans **Statut**, choisissez dans la liste : Appliquée, En cours, En partie appliquée, Non engagée, En pause, Abandonnée ou non tenue, Invérifiable. La page « La démarche » du site donne la définition de chacun.
3. Ajoutez dans **Chronologie** l'événement qui justifie ce statut. Règle : tout statut autre que « Non engagée » doit être appuyé par au moins un événement. L'interface ne vous bloque pas si vous l'oubliez : vérifiez-le vous-même avant d'enregistrer.
4. Enregistrez.

Laisser **Statut** vide affiche « Statut à venir ».

## 5. Écrire un point de vue

Un point de vue est un commentaire signé de Nouveau Cap, affiché à part des faits. On peut en écrire un par promesse (dans **Promesses**, bloc **Point de vue de l'opposition**) et un par thématique (dans **Thématiques**, bloc **Point de vue sur la thématique**).

1. Ouvrez la promesse ou la thématique, puis cochez la case **Ajouter Point de vue de l'opposition** (« Add Point de vue de l'opposition » ; pour une thématique : **Ajouter Point de vue sur la thématique**).
2. Rédigez dans **Texte** (gras et liens possibles) et indiquez la **Date**. La date est obligatoire dès que le bloc est ajouté : sans elle, l'enregistrement est refusé (« Ce champ est obligatoire. »).
3. Enregistrez (voir ci-dessus). Pour retirer un point de vue, décochez la case, puis enregistrez.

## 6. Ajouter un intervenant

Dans **Intervenants**, cliquez sur **Nouveau** (« New » ; sur un petit écran, le bouton n'affiche qu'une icône) : renseignez **Nom**, **Fonction** (complète) et **Fonction courte** (utilisée dans les listes), puis enregistrez. Il devient ensuite choisissable dans la chronologie.

Vous pouvez corriger le nom ou la fonction d'un intervenant à tout moment : les événements le retrouvent par un identifiant fixé à sa création, et le nouveau nom s'affiche partout. Un intervenant ne peut pas être supprimé depuis l'interface.

## 7. Le site ne se met pas à jour au bout de 5 minutes

1. Rechargez la page du site en forçant le rafraîchissement (Ctrl + Maj + R) : votre navigateur garde parfois l'ancienne version.
2. Si rien ne change, la construction du site a probablement échoué. Un échec apparaît dans l'onglet **Actions** du dépôt GitHub (workflow « Publication GitHub Pages » en rouge). Ne cherchez pas à diagnostiquer vous-même.
3. Contactez la personne responsable du site et indiquez-lui l'**heure de votre modification** et la **promesse que vous avez modifiée**. Elle retrouvera l'erreur et pourra annuler la modification si besoin : tout est conservé dans l'historique GitHub.

## Captures à ajouter

Captures d'écran utiles à insérer plus tard dans ce guide, interface en français :
- l'écran de connexion à `/admin/`, avec le bouton **Se connecter avec GitHub** ;
- la liste des promesses ;
- le bloc **Chronologie** avec le bouton **Ajouter événement** ;
- un événement déplié (Date, Lieu, Intervenant, Type, Texte, Lien) ;
- la liste déroulante **Statut** ;
- la case **Ajouter Point de vue de l'opposition**, cochée, avec Texte et Date ;
- le bouton **Enregistrer** ;
- le menu du compte, avec **Paramètres** (« Settings »), pour changer la langue ;
- une exécution en échec du workflow « Publication GitHub Pages » dans l'onglet Actions.
