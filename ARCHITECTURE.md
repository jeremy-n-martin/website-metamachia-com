# Metamachia — constitution du noyau v0.1

Metamachia n'est pas organisé comme un blog. Le système sépare trois primitives :

1. **Concept** — position typée dans le réseau épistémique ;
2. **Relation** — transformation orientée possédant une sémantique et une loi de composition ;
3. **Document** — parcours narratif à travers une suite de concepts reliés.

## Invariants

- un identifiant est stable et unique ;
- aucune relation ne pointe vers un concept absent ;
- aucun concept n'est orphelin ;
- chaque étape d'un parcours correspond à une relation orientée existante ;
- une relation générique `related_to` est interdite ;
- statut et provenance sont obligatoires pour chaque document ;
- le Réel reste un nœud-frontière, jamais assimilé à sa représentation.

Ces invariants sont vérifiés avant chaque build par `scripts/validate-epistemic-data.mjs`.

## Sémantique actuelle

Le noyau est un hypergraphe typé implémenté sous une forme minimale. Sa cible formelle est une catégorie monoïdale dirigée : plusieurs prémisses pourront ultérieurement être combinées pour produire une conclusion, tandis que les transformations irréversibles resteront orientées.

La couche homotopique n'est pas simulée prématurément. Elle sera réservée aux équivalences entre formulations, aux comparaisons de chemins et aux cohérences de niveau supérieur.

## Extension prévue

Les futurs ajouts devront enrichir le noyau sans modifier ces séparations :

- **propositions** et **preuves** comme entités distinctes des concepts ;
- relations multi-entrées pour les arguments composés ;
- versions et transformations diachroniques ;
- sources bibliographiques et degrés de corroboration ;
- équivalences de formulation et diagrammes commutatifs ;
- génération des pages éditoriales à partir des parcours.

Le rendu web lit `public/assets/epistemic-data.js`. L'interface est indépendante de la structure des données afin que le stockage puisse migrer plus tard vers JSON-LD, RDF, une base graphe ou une représentation catégorique plus stricte.
