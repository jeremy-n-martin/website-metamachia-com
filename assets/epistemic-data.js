(function () {
  "use strict";

  globalThis.METAMACHIA_DATA = Object.freeze({
    version: "0.1.0-mvp",
    updated: "2026-08-15",
    thesis:
      "Une idée se définit par les relations qu'elle entretient, pas par une fiche isolée.",

    relationTypes: {
      causal: {
        label: "causal",
        family: "dynamique",
        color: "#e8a86a",
        rule: "Direction irréversible ; aucune inversion implicite.",
      },
      corrective: {
        label: "correctif",
        family: "épistémique",
        color: "#78c7c4",
        rule: "Modifie un modèle sous contrainte d'écart.",
      },
      regulatory: {
        label: "régulatoire",
        family: "dynamique",
        color: "#d6c76f",
        rule: "Boucles admises ; la causalité simple ne suffit pas.",
      },
      constitutive: {
        label: "constitutif",
        family: "structure",
        color: "#b6a2df",
        rule: "Relie une fonction à une structure dont elle participe.",
      },
      emergent: {
        label: "émergent",
        family: "structure",
        color: "#d784a6",
        rule: "Hypothèse de dépendance, non identité ontologique.",
      },
      selective: {
        label: "sélectif",
        family: "évolution",
        color: "#8ebd78",
        rule: "Décrit une persistance différentielle, pas une finalité.",
      },
    },

    concepts: [
      {
        id: "real",
        title: "Réel",
        kind: "frontière",
        status: "démo",
        x: 120,
        y: 180,
        definition:
          "Ce qui existe hors du modèle. Objet démo : le nœud-frontière du graphe.",
      },
      {
        id: "model",
        title: "Modèle",
        kind: "représentation",
        status: "démo",
        x: 420,
        y: 180,
        definition:
          "Représentation compressée du réel. Objet démo central du MVP.",
      },
      {
        id: "perception",
        title: "Perception",
        kind: "processus",
        status: "démo",
        x: 720,
        y: 180,
        definition:
          "Hypothèse stabilisée par l'écart entre prédiction et signal.",
      },
      {
        id: "viability",
        title: "Viabilité",
        kind: "variable",
        status: "démo",
        x: 560,
        y: 420,
        definition:
          "Capacité du système à maintenir sa trajectoire sous contrainte.",
      },
    ],

    relations: [
      { id: "r01", from: "real", to: "model", type: "causal", verb: "contraint" },
      { id: "r02", from: "model", to: "perception", type: "constitutive", verb: "stabilise" },
      { id: "r03", from: "perception", to: "model", type: "corrective", verb: "corrige" },
      { id: "r04", from: "perception", to: "viability", type: "regulatory", verb: "informe" },
      { id: "r05", from: "viability", to: "model", type: "regulatory", verb: "oriente" },
    ],

    documents: [
      {
        id: "demo-chaine",
        title: "Chaîne démo",
        status: "exemple",
        provenance: "Données fictives du MVP",
        thesis:
          "Parcours minimal pour illustrer un chemin dans l'atlas : du réel à la viabilité.",
        path: ["real", "model", "perception", "viability"],
      },
      {
        id: "demo-boucle",
        title: "Boucle démo",
        status: "exemple",
        provenance: "Données fictives du MVP",
        thesis:
          "La perception corrige le modèle, qui à son tour configure la perception.",
        path: ["model", "perception", "model"],
      },
    ],

    principles: [
      {
        index: "01",
        title: "Concepts",
        text: "Un nœud est une position dans le graphe, pas un article.",
      },
      {
        index: "02",
        title: "Relations",
        text: "Chaque flèche a un type (causal, correctif, etc.) et un verbe lisible.",
      },
      {
        index: "03",
        title: "Parcours",
        text: "Un document est un chemin à travers des concepts déjà reliés.",
      },
    ],
  });
})();
