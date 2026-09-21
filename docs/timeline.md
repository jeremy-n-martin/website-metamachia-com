# Atelier de frise récursive

La page principale est désormais une seule frise verticale, et non une bibliothèque
de livres suivie d’écrans chapitres/scènes. Aucune connexion ni facturation.

## Règles de composition

- Une boucle possède exactement quatre blocs : Mise en place (E), Déclenchement (I),
  Bascule (P), Retombée (R). Une sous-boucle n’existe que dans un bloc. Maximum sept
  niveaux, 400 blocs, 200 personnages et 100 groupes par archive.
- Cette contrainte en quatre temps est une adaptation éditoriale demandée par le
  projet, pas une reproduction exhaustive de la théorie de Neil Cohn. Sa VNG
  comporte d’autres possibilités, dont la prolongation et des catégories optionnelles.
  Référence : https://www.visuallanguagelab.com/P/2019.LC.NC.pdf
- Le temps va du haut vers le bas. Un bloc prend effet à son entrée, puis ses
  sous-boucles sont traversées, puis le bloc suivant. Un bloc parent est une
  intention macro ; ses sous-blocs la détaillent. Pas de seconde application du
  changement parent à la sortie. Ne pas redéclarer le même changement pour le détailler.
- Le lecteur peut avancer, faire pause, reculer, parcourir le curseur ou revenir
  à l’état zéro. La reconstruction repart toujours des faits initiaux, sans
  mutation du document. Les appartenances, présences et relations sont indépendantes.
- Une relation est un lien nommé. Plusieurs liens entre deux personnes peuvent
  coexister ; remplacer un lien exige sa fin explicite et l’ajout du nouveau.
  Les liens parent/enfant, mentor, protection, dépendance et trahison sont dirigés.
  Aucun lien romantique n’est déduit d’un nom, sexe ou glisser-déposer.
- Les groupes et factions réunissent plusieurs personnes à l’état zéro ; les
  changements d’appartenance se déclarent dans les blocs.
- Les feuilles deviennent des cases, regroupées en pages de 1 à 6 cases. Le texte
  parent n’est pas dupliqué. Les amorces sont des canevas à personnaliser, pas du
  texte littéraire généré, ni des faits déduits automatiquement.

## Minimum utile

Un désir, un obstacle, un enjeu ; un personnage porteur ; une bascule et sa
conséquence. Les repères de cohérence signalent les champs manquants et les
interventions avant entrée. Ils ne prouvent pas la cohérence sémantique du texte.
Cette frise représente le temps chronologique, pas encore un second ordre pour
les flash-backs ou une séparation réalité/croyance/révélation. L’ancien moteur MNS
reste disponible en TypeScript/CLI mais n’est pas présenté comme branché à cette UI.

## Données

Nouvelle clé locale `metamachia.timeline.v1`. L’ancienne bibliothèque
`metamachia.library.v1` n’est jamais modifiée ; Réglages permet de l’exporter.
Une seule frise active, export/import JSON. Sauvegarde précédente `.backup`,
annuler/rétablir sur 40 opérations dans la session. Conflit inter-onglets : arrêt
des écritures et invitation à exporter/recharger. Si le stockage est plein ou
illisible, pas d’écrasement silencieux. Les données ne quittent pas l’appareil.

## Jev : classement d’un petit dictionnaire, pas génération d’un roman

Intégration volontairement non activée : aucune clé demandée dans l’interface,
aucun appel distant. Les aides actuelles fonctionnent sans modèle.

Première intégration recommandée : le bouton « Comparer les directions » enverrait
seulement l’intention de la boucle, son bloc, les désirs des personnages présents,
les relations reconstruites et les quatre candidats du dictionnaire. Une requête
groupée, une Choice de compatibilité par candidat (compatible / contradiction /
informations insuffisantes), puis des scores indépendants d’apport à l’objectif.
Les probabilités ne seraient pas présentées comme une mesure du talent littéraire.
Ne jamais convertir une recommandation en fait sans validation de l’auteur.

Le code sélectionne les candidats et assemble les canevas. Jev les compare ; il ne
génère ni nouvelles phrases ni possibilités hors des candidats. Un cache dépend
du contexte pertinent, de la liste des candidats et de la grille. Aucun appel à
la frappe, au déplacement ou à la lecture. Un résultat périmé doit être rejeté.

Pour une clé partagée publique : petit service sécurisé séparé, secret côté
serveur, validation de la requête et de la réponse, quota global atomique de 100
tentatives sur 60 minutes, anti-abus, plafond de taille et de coût. CORS ne suffit
pas. Cette protection n’exige pas de comptes utilisateurs ni de paiements.

Documentation consultée :
https://docs.typesafe.ai/concepts/how-to-build-with-system-one
https://docs.typesafe.ai/primitives/choice
https://docs.typesafe.ai/cookbooks/rerank_typesafe
