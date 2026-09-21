# Metamachia — Atelier d’écriture

Un atelier utilisable sur [metamachia.com](https://metamachia.com) pour construire et écrire des histoires complètes. Interface française, TypeScript, déploiement statique GitHub Pages. Le moteur MNS est partagé entre l’interface et le compilateur local.

## Écrire une histoire

1. Créer une histoire dans la bibliothèque, ou ouvrir l’exemple « Les lettres de l’aube ».
2. Définir le titre, le genre, le synopsis et l’objectif de mots dans Vue d’ensemble.
3. Commencer par **au moins un personnage et un lieu** dans Univers. Le parcours guidé ouvre les bonnes fiches, dont l’interface reste inchangée.
4. Organiser les chapitres et les cartes de scène dans Manuscrit. Chaque scène relie son lieu, ses personnages, ses intrigues et son rôle (mise en place, complication, bascule, résolution). Ouvrir sa carte pour écrire le texte Markdown. Les boutons d’ajout et de suppression sont nommés ; la suppression d’une scène ou d’un chapitre peut être annulée avant la prochaine modification (dans la session courante).
5. Garder les intrigues, résolutions prévues et notes dans Intrigues & notes. Les notes sont réservées à l’auteur par défaut.
6. Dans **Frise & continuité**, parcourir une frise macro des chapitres et des intrigues, zoomable et défilante. Alterner temps de l’histoire (chapitres classés par leur premier moment) et ordre de lecture. Les périodes peuvent se chevaucher ; la distance graphique ne représente pas une durée. Cocher « Jalon marquant » sur les événements à faire apparaître dans cette vue. Sélectionner un chapitre révèle ses scènes et leurs conséquences : réalité, croyances et connaissances du lecteur.
7. Consulter l’état et les connaissances par scène (auteur, lecteur, personnage) dans le manuscrit. Exporter le contexte en Markdown ou JSON.
8. Exporter régulièrement le projet complet. Le manuscrit Markdown et le rapport de continuité sont aussi téléchargeables.

## Stockage et limites

- Les histoires sont enregistrées automatiquement dans **ce navigateur** (`localStorage`), pas sur GitHub ou sur un serveur. Pas de compte, synchronisation ni collaboration à distance.
- Effacer les données du site supprime cette copie. Télécharger un projet JSON permet de le conserver ou de changer d’appareil. L’import ajoute une copie et ne remplace aucune histoire existante.
- Une sauvegarde précédente de la bibliothèque est conservée tant que le stockage le permet. Le bouton « Sauvegarde de secours » la télécharge ; elle se réimporte comme un projet normal.
- Les onglets concurrents ne peuvent pas écraser silencieusement les changements d’un autre onglet. En cas de conflit, exporter le travail en cours avant de recharger.
- Les quotas et erreurs de stockage sont signalés : le contenu reste en mémoire et exportable. L’application ne prétend pas qu’une écriture en échec est enregistrée.
- Aucun service d’IA n’est appelé. Le texte est écrit par l’utilisateur, les changements sont déclarés manuellement. Les contextes exportés peuvent ensuite être fournis au modèle de son choix.
- Les vues sont des aides éditoriales, pas des droits d’accès entre utilisateurs. L’auteur possède l’ensemble du projet dans son navigateur.
- Markdown léger (titres, gras, italique, citations) ; HTML échappé, jamais exécuté. Pas de mise en page de bande dessinée ou de génération d’images dans cette version.

## Continuité

Les liens scène/intrigue/lieu et les jalons sont des métadonnées éditoriales, pas des faits. Les anciennes sauvegardes restent lisibles, sans inventer de liens. Le tableau d’intrigue, le manuscrit et la frise utilisent les mêmes références. Les événements issus d’une scène héritent de ses intrigues ; un événement peut aussi être relié directement à un fil. Le passage d’un texte en « terminé » ne le transforme pas en canon.

Les événements conservent les statuts brouillon, canon ou plan. Un changement de texte marque ses événements comme « à revérifier ». Réouvrir et enregistrer l’événement confirme sa provenance actuelle. Supprimer une scène retire ses événements sources et nettoie les références ; les notes dont la révélation disparaît deviennent privées. L’annulation restaure l’ensemble de ces données et est désactivée dès qu’une nouvelle modification risquerait d’être écrasée.

Temps de l’histoire (`storyTime`) et ordre des scènes sont indépendants. Le lecteur avance dans l’ordre de présentation, y compris dans les flash-backs. Une révélation ne modifie pas la vérité ou les croyances. Un événement présenté plusieurs fois ne se produit qu’une fois.

Les propriétés narratives sont libres. `set`, `end`, `add`, `remove` couvrent états et collections partielles. Une information temporaire (`set` + `until`) disparaît à sa fin, sans retour implicite à un état précédent. Des changements incompatibles au même moment produisent un conflit et une valeur indéterminée. Le plan ne devient jamais un fait ; les événements de brouillon ne sont utilisés que si leur inclusion est demandée et leur scène déjà atteinte.

## Développement local

La proposition d’aide Jev (comparaison de pistes en un appel, relecture ciblée, clé serveur et limite globale de 100 appels par heure) est décrite dans [docs/jev-design.md](docs/jev-design.md). Elle n’est pas activée : le site n’envoie aucun manuscrit à un service d’IA.

```sh
npm ci
npm test
npm run dev
```

Ouvrir `http://127.0.0.1:8787`. Après une modification TypeScript : `npm run build`, puis recharger. `npm test` compile le moteur et l’interface et exécute les tests de continuité et de sauvegarde.

```sh
npm run compile
node dist/src/cli.js compile --project histoire.mns.json --chapter CH_ID --scene SC_ID --view reader
node dist/src/cli.js compile --chapter CH001 --scene SC001 --out story/generated
```

Le compilateur écrit `context.md`, `context.json`, `continuity-report.json`. Sortie 0 : pas d’erreur ; 1 : requête ou fichier invalide ; 2 : conflit détecté (rapport disponible). Les fichiers sont remplacés individuellement via un fichier temporaire.

## Publication GitHub Pages

`index.html`, `assets/workshop.css` et `assets/mns/` forment le site. Les modules JavaScript générés sont versionnés pour permettre le déploiement depuis la racine de `main`, sans config serveur supplémentaire. **Exécuter `npm run build` avant de publier une modification TypeScript.** Conserver `CNAME` (`metamachia.com`) et `.nojekyll`.

`web/` contient l’interface, `src/` le modèle, la validation, la sauvegarde et le compilateur, `test/` les tests. L’ancien atlas est remplacé ; ses anciennes routes renvoient vers l’atelier.

Le build ajoute une empreinte de contenu aux imports du navigateur et aux ressources de la page. Cela évite de mélanger une interface récente avec d’anciens modules conservés en cache. Versionner aussi `index.html` après le build.
