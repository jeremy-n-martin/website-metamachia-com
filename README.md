# Metamachia Narrative System (MNS) 0.1

Un prototype local de **compilateur de continuité**, pas un simulateur narratif. Les sources sont éditables : Markdown pour la matière littéraire et JSON pour le canon structuré. Le compilateur reconstruit l'état à un moment de l'histoire et produit des dossiers de contexte sûrs.

## Démarrage

```sh
npm install
npm test
npm run compile
```

`npm run compile` lit `story/` et régénère `story/generated/context.md`, `context.json` et `continuity-report.json` pour la première scène du premier chapitre. Pour une autre vue : `node dist/src/cli.js compile --chapter CH001 --scene SC002 --view character --character LINETTE`.

## Principes

- Canon validé uniquement : `story/canon/*.json`.
- Plans et brouillons sont isolés et ne deviennent jamais canon automatiquement.
- L'état est reconstruit depuis les événements, à l'instant de l'histoire (`storyTime`), pas selon l'ordre des chapitres.
- Une occurrence n'est appliquée qu'une fois, même si plusieurs scènes la présentent.
- Le monde est ouvert : une information absente est « non documentée », jamais fausse.
- Les croyances, les révélations au lecteur et la vérité du monde sont des couches distinctes.
- Les notes Markdown doivent déclarer leur portée (`author`, `reader`, `character:ID`) et ne fuient pas vers une autre vue.

## Structure

`story/entities` contient les identités/descriptions; `story/canon` les événements approuvés; `story/chapters` les briefs, plans et brouillons; `story/notes` les notes Markdown scopées. `generated/` est toujours reconstructible.
