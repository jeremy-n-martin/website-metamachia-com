# Guide simple de Metamachia (MVP)

## À quoi sert le site ?

Metamachia est un atlas d'idées.

Le MVP montre :

- des **concepts** (nœuds) ;
- des **relations** orientées entre ces concepts ;
- des **parcours** (chemins) qui relient plusieurs concepts.

Dans le site, tu peux :

1. Cliquer sur un concept pour lire sa définition.
2. Voir les relations qui arrivent vers ce concept ou qui en repartent.
3. Cliquer sur un parcours pour afficher son chemin dans la carte.
4. Filtrer les relations selon leur nature.

## Où se trouvent les informations ?

Tout est dans :

```text
assets/epistemic-data.js
```

Quatre parties principales :

```text
relationTypes : types de relations
concepts      : idées / nœuds
relations     : flèches entre concepts
documents     : parcours à travers la carte
```

Le fichier livré contient seulement **quelques objets démo** (4 concepts, 5 relations, 2 parcours). Ce ne sont pas des fiches théoriques complètes.

## Ajouter un concept

Dans `concepts` :

```javascript
{
  id: "seuil",
  title: "Seuil",
  kind: "contrainte",
  status: "démo",
  x: 300,
  y: 420,
  definition: "Limite qui sépare une trajectoire viable d'une rupture.",
},
```

Champs :

- `id` : identifiant unique, sans espace ;
- `title` : nom affiché ;
- `kind` : nature du concept ;
- `status` : maturité de l'idée ;
- `x` / `y` : position (environ x 0–1000, y 0–650) ;
- `definition` : texte court.

## Ajouter une relation

Dans `relations` :

```javascript
{
  id: "r06",
  from: "viability",
  to: "seuil",
  type: "regulatory",
  verb: "borne",
},
```

Champs :

- `from` / `to` : ids de concepts existants ;
- `type` : un des types listés dans `relationTypes` ;
- `verb` : formulation lisible.

Types utiles : `causal`, `corrective`, `regulatory`, `constitutive`, `emergent`, `selective`.

## Ajouter un parcours

Dans `documents` :

```javascript
{
  id: "demo-seuil",
  title: "Seuil et viabilité",
  status: "exemple",
  provenance: "Données fictives du MVP",
  thesis: "La viabilité n'a de sens que relativement à un seuil.",
  path: ["perception", "viability", "seuil"],
},
```

Chaque étape consecutive du `path` doit correspondre à une relation existante.

## Voir les modifications

Enregistre `assets/epistemic-data.js`, puis recharge la page.

Test local :

```powershell
python -m http.server 8000
```

Puis ouvre `http://localhost:8000`.

## Limitation actuelle

Les parcours ne sont pas encore des articles. Ils n'ont qu'un titre, une thèse, un statut, une provenance et un chemin.

## Résumé

1. Ajouter un concept.
2. Ajouter ses relations.
3. L'intégrer dans un parcours si besoin.
4. Vérifier que chaque étape du parcours a une relation.
5. Recharger le site.
