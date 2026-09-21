# Metamachia · la frise narrative

Un éditeur en français pour composer une histoire sur une grande frise verticale.
Site : **https://metamachia.com**. Pas de compte, pas de paiement, pas d’appel IA.

## Composer

La frise s’ouvre directement : plus de bibliothèque ni d’assistant de création de
livre. Chaque boucle possède quatre blocs colorés : **Mise en place → Déclenchement
→ Bascule → Retombée**. Imbriquez une boucle dans n’importe quel bloc, jusqu’à sept
niveaux. Supprimez une boucle avec confirmation ; annuler/rétablir reste disponible.

À gauche, créez des personnages avec leur désir, puis glissez-les dans les blocs
(ou utilisez les cases à cocher de l’inspecteur). Les relations, groupes et factions
se définissent à l’état zéro. Dans un bloc, déclarez un changement de relation,
une entrée/sortie du récit ou une appartenance à un groupe.

**Lire** anime un curseur du haut vers le bas ; le sens inverse et le curseur manuel
permettent de revoir les états antérieurs. Les effets d’un bloc s’appliquent à son
entrée, avant ses sous-boucles. Le texte libre ne modifie pas les faits à votre insu.

Le dictionnaire propose quatre directions par étape et des familles de relations.
Les amorces sont éditables, non validées automatiquement. **Pages & cases** transforme
les blocs feuilles en un découpage de 1 à 6 cases par page, exportable en Markdown.
Le préremplissage ne remplace jamais un texte déjà écrit.

**Réglages** : titre, genre, tonalité, public, intention centrale, mise en pages,
import JSON et exemple de mariage/naissance. **Repères de cohérence** aide à préciser
désirs, intervenants et changements ; ce n’est pas une analyse littéraire automatique.

## Données et limites

- Sauvegarde locale, export JSON et import validé ; aucune synchronisation distante.
- Les anciennes histoires ne sont ni migrées arbitrairement ni effacées. Leur
  archive reste exportable depuis les réglages. La nouvelle frise utilise une clé
  locale distincte. Fermer une session efface l’historique annuler/rétablir, pas la frise.
- 400 blocs, 200 personnages, 100 groupes, 7 niveaux. Les archives malformées et
  références manquantes sont refusées. Conflit entre onglets : sauvegarde bloquée,
  exportez votre travail avant de recharger.
- Adaptation en quatre temps inspirée de la VNG de Neil Cohn, pas sa grammaire
  exhaustive. Cette interface suit un seul temps chronologique : elle ne gère pas
  encore un second ordre de flash-backs ni des vues séparées lecteur/personnage.
- Le moteur MNS précédent reste disponible en CLI avec ses tests (canon ouvert,
  plans/brouillons, croyances, révélations, informations temporaires). La frise
  utilise son propre modèle explicite ; ne pas confondre les deux compilations.

Voir [le modèle de la frise et la conception Jev](docs/timeline.md).

## Développement

Node.js 22 ou ultérieur, TypeScript, aucun framework d’interface.

```sh
npm ci
npm test
npm run dev
```

Le serveur de développement écoute seulement `http://127.0.0.1:8787`.
Ne pas l’exposer publiquement : il sert les fichiers du dépôt.

`npm run build` compile le moteur et l’interface puis empreinte les modules et
la feuille de style. Les fichiers `assets/mns` sont versionnés pour GitHub Pages.
Les tests vérifient les empreintes/imports pour prévenir les mélanges de versions.

Structure :

- `src/timeline.ts` : composition récursive, dictionnaire, état, export, validation.
- `web/app.ts` : éditeur de frise, lecture, formulaires et sauvegarde locale.
- `assets/workshop.css` : mise en page responsive.
- `src/compiler.ts`, `src/cli.ts`, `story/` : ancien prototype MNS local conservé.
- `test/` : tests de continuité, sauvegarde, composition et déploiement.

## Jev

Non connecté. Usage recommandé : comparer en un appel groupé les directions d’un
bloc à partir des objectifs et relations utiles. Le code compose les canevas ;
Jev classe des candidats structurés, sans générer un roman. Pas d’appel à la frappe.
Une clé partagée doit rester derrière un service avec quota global et protection
anti-abus, jamais dans le JavaScript, un fichier public ou localStorage.
