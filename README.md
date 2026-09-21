# Metamachia — Atelier d’écriture

Un atelier utilisable sur [metamachia.com](https://metamachia.com) pour construire et écrire des histoires complètes. Interface française, TypeScript, déploiement statique GitHub Pages. Le moteur MNS est partagé entre l’interface et le compilateur local.

## Écrire une histoire

1. Créer une histoire dans la bibliothèque, ou ouvrir l’exemple « Les lettres de l’aube ».
2. Définir le titre, le genre, le synopsis et l’objectif de mots dans Vue d’ensemble.
3. Créer les personnages, lieux, objets et factions dans Univers.
4. Organiser les chapitres et les scènes dans Manuscrit, écrire le texte (Markdown simple), définir l’intention de chaque scène, déplacer les scènes et marquer celles qui sont terminées.
5. Garder les intrigues, résolutions prévues et notes dans Intrigues & notes. Les notes sont réservées à l’auteur par défaut.
6. Déclarer les faits importants dans Continuité, choisir brouillon, canon ou plan. Un changement de texte marque ses événements comme « à revérifier ». Réouvrir et enregistrer l’événement confirme sa provenance actuelle.
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

Temps de l’histoire (`storyTime`) et ordre des scènes sont indépendants. Le lecteur avance dans l’ordre de présentation, y compris dans les flash-backs. Une révélation ne modifie pas la vérité ou les croyances. Un événement présenté plusieurs fois ne se produit qu’une fois.

Les propriétés narratives sont libres. `set`, `end`, `add`, `remove` couvrent états et collections partielles. Une information temporaire (`set` + `until`) disparaît à sa fin, sans retour implicite à un état précédent. Des changements incompatibles au même moment produisent un conflit et une valeur indéterminée. Le plan ne devient jamais un fait ; les événements de brouillon ne sont utilisés que si leur inclusion est demandée et leur scène déjà atteinte.

## Développement local

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
