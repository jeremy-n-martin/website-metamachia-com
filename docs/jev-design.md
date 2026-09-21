# Jev : une aide éditoriale ciblée, pas un second compilateur

État au 21 septembre 2026 : proposition de conception, non connectée au site.
Aucune clé ni requête d’histoire n’est envoyée à TypeSafe dans cette version.

## Le premier usage recommandé : comparer des directions de récit

L’auteur propose 2 à 4 pistes pour un chapitre (ou choisit des amorces locales :
un objectif contrarié, un prix à payer, un secret qui change de détenteur,
un lieu déjà établi qui devient un obstacle). Jev évalue ces candidats ; il ne
génère pas de prose ni de nouvelles possibilités hors de la liste.

L’état envoyé contient l’objectif du chapitre, les fiches pertinentes de l’univers,
les intrigues liées et les faits reconstruits nécessaires. Chaque piste reçoit,
dans UNE requête, trois jugements indépendants :

| Dimension | Primitive | Sens des réponses |
| --- | --- | --- |
| Cohérence | Choice | Compatible / contredit un fait établi / données insuffisantes |
| Progression du fil | Score | Ne change pas la question / ajoute un obstacle ou indice / force un choix ou apporte une résolution |
| Ancrage dans l’univers | Score | Pourrait arriver à n’importe qui / exploite un élément établi / dépend des motivations ou contraintes précises déjà établies |

Maximum initial : 4 pistes × 3 questions = 12 questions, un appel.
Chaque question référence explicitement sa piste dans les instructions : son ID
est destiné au code et n’est pas envoyé au modèle. Les questions d’un lot ne
peuvent pas dépendre des réponses des autres.

Le code affiche les axes séparément. Il peut pondérer les deux Scores normalisés
pour classer les pistes ; un changement de préférences recalcule le classement
sans appel. Une contradiction n’est jamais compensée par un score de créativité.
Les distributions et la confiance sont conservées. Le résultat reste une suggestion,
pas une probabilité de succès littéraire, pas une vérité canonique.

## Deuxième usage : relire une déclaration, sur demande

Une scène et au plus 8 changements proposés par l’auteur : une Choice par changement
juge si le texte le soutient, le contredit, ne l’aborde pas ou ne permet pas de
trancher. Inclure un état explicitement séparé : réalité, croyances, connaissance
du lecteur, plan. Un mensonge dans un dialogue ne prouve pas un fait du monde.
Les passages fournis sont traités comme données, jamais comme instructions.

Les candidats proviennent des déclarations de l’auteur, pas d’une extraction
prétendument exhaustive. Une future extraction libre demanderait un mécanisme
distinct. Les incohérences exactes, dates, références, doublons, intervalles et
révélations restent vérifiés gratuitement par le compilateur TypeScript.
Les suggestions ne modifient jamais automatiquement le canon.

## Un appel volontaire, borné et réutilisable

- Bouton explicite « Comparer mes pistes » ou « Relire ces changements » ; aucun
  appel à la frappe, au déplacement dans la frise ou à la compilation locale.
- Avant envoi : aperçu du contexte transmis et accord de l’auteur, notamment pour
  les secrets de la vue auteur. Jamais toute la bibliothèque par défaut.
- Plafonds contrôlés par le serveur : 12 questions et 24 000 caractères de contexte.
  Pas de découpage automatique d’un roman en centaines d’appels.
- Cache par empreinte du contexte pertinent, des candidats, des questions, du modèle
  et de la version des grilles. Changer les poids n’invalide pas le cache.
- Ignorer un résultat si la version du contexte a changé entre demande et réponse.
- Timeout et panne : conserver le texte, afficher « aide indisponible », compilation
  et édition continuent normalement. Aucun renouvellement automatique en boucle.

## Site public : la clé reste impérativement côté serveur

GitHub Pages sert des fichiers statiques : un secret dans le JavaScript, un fichier
de configuration public ou localStorage ne protège pas une clé partagée.
Il faut un petit service séparé avant d’activer les boutons Jev :

`Navigateur → service d’aide sécurisé → TypeSafe /v1/systemone`

Le service détient TYPESAFE_API_KEY dans son gestionnaire de secrets, construit les
questions autorisées lui-même, valide la taille/type de chaque champ et valide les
réponses. Ce n’est pas un proxy générique permettant des requêtes arbitraires.

Proposition initiale : **100 tentatives sortantes sur toute fenêtre glissante de
60 minutes, globalement pour le site**, pas 100 par onglet. Avant CHAQUE tentative
TypeSafe, réserver atomiquement une place dans un compteur durable partagé entre
toutes les instances. Compter les échecs et les éventuelles relances ; ne pas
rembourser une tentative dont l’issue réseau est inconnue. Une réponse du cache
ne consomme pas d’appel. Si le compteur est indisponible, refuser l’appel.

Ajouter un identifiant de requête pour coalescer les doubles clics et rejouer une
réponse déjà connue, ainsi qu’un petit plafond par visiteur et une limite de
concurrence. Un visiteur anonyme peut épuiser le quota global : protection anti-abus
à choisir selon le service d’hébergement. CORS n’est pas une authentification.
Renvoyer 429 + Retry-After si le budget est épuisé. Ne pas journaliser les manuscrits
ni partager un cache contenant des textes privés entre visiteurs. Ajouter un
plafond de dépense journalier : 100 appels n’est pas un budget monétaire fixe.

Le service d’hébergement et la configuration de son secret restent à choisir ;
ne pas saisir la clé dans le dépôt ou dans cette interface publique.

## Vérifier avant de recommander

Constituer un petit jeu d’histoires annotées : flash-back, rêve, mensonge, croyance
fausse, narrateur non fiable, transformation, retour d’un même événement, silence
du texte, règle d’univers volontairement étrange. Mesurer les faux conflits, les
résultats incertains, les tokens et la latence. Ne pas adopter un seuil universel
de confiance copié d’une démo. Les réponses typées garantissent une forme, pas leur
vérité. L’auteur garde le choix final.

## Documentation officielle consultée

- [API HTTP, types de réponses](https://docs.typesafe.ai/api)
- [Questions Score : niveaux, distributions et confiance](https://docs.typesafe.ai/primitives/score)
- [Questions indépendantes groupées](https://docs.typesafe.ai/cookbooks/parallel_questions)
- [Vérification d’une affirmation contre sa source](https://docs.typesafe.ai/cookbooks/citation_check)

La compétence TypeSafe a guidé la séparation entre calcul déterministe et jugements
sémantiques, le regroupement des questions et la protection serveur de la clé.
