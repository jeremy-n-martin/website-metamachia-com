import {
  emptyTimeline,
  newLoop,
  id,
  type Timeline,
  type Block,
  type Effect,
} from "./timeline.js";

/** Editorial adaptation of the supplied 21-page PDF; no continuation invented. */
export function linetteTimeline(): Timeline {
  const t = emptyTimeline();
  t.title = "Linette au Donjon — La pire apprentie du royaume";
  t.settings = {
    genre: "Fantasy humoristique · aventure · satire administrative",
    tone: "Courage naïf, malchance en cascade et humour absurde",
    audience: "À préciser par l’auteur",
    premise:
      "Linette cherche fortune et devient apprentie dans un donjon bureaucratique. Sa première journée tourne au désastre : elle doit trouver un prêtre noir pour son accompagnateur. Adaptation des pages 3 à 21 de « histoire prod.pdf » de Jeremy Martin (couverture p. 1, p. 2 blanche). Les rôles anonymes portent des noms descriptifs ; le découpage VNG est une proposition éditoriale. Le PDF s’arrête avant la rencontre des prêtres. Les repères ne sont pas des minutes : seuls les horaires explicitement écrits dans les blocs sont attestés.",
    chronology: {
      origin:
        "Départ de Linette dans la forêt, avant l’entretien du lundi à 7 h",
      unit: "repère",
      defaultDuration: 1,
      configured: true,
    },
  };
  const people = [
    [
      "Linette",
      "Trouver fortune, puis obtenir de l’aide pour son accompagnateur",
      "#b89735",
    ],
    [
      "Le troll de la grotte",
      "Rôle : obstacle sur le chemin de Linette",
      "#617b49",
    ],
    ["Le brigand", "Dépouiller Linette", "#796755"],
    [
      "Le directeur",
      "Recruter une apprentie et l’affecter au donjon",
      "#977356",
    ],
    [
      "Le gobelin accompagnateur",
      "Conduire Linette à son affectation malgré ses réticences",
      "#64835c",
    ],
    [
      "Le responsable du nettoyage",
      "Fournir le matériel et envoyer les recrues en formation",
      "#69936b",
    ],
    ["Le formateur squelette", "Assurer la formation incendie", "#948a71"],
    ["Le diablotin", "Participer avec enthousiasme à la formation", "#c27654"],
    [
      "Le squelette de la salle piégée",
      "Présenter la salle, puis rédiger le rapport d’accident",
      "#8a8276",
    ],
    ["La créature à un œil", "Orienter Linette vers un prêtre noir", "#938262"],
    [
      "L’agent d’accueil",
      "Appliquer les procédures de l’intendance",
      "#71815a",
    ],
  ];
  t.characters = people.map(([name, goal, color]) => ({
    id: id(),
    name,
    goal,
    color,
    present: true,
    inventory: [],
    properties: [],
  }));
  const [
    lin,
    troll,
    bandit,
    boss,
    guide,
    clean,
    teacher,
    imp,
    skeleton,
    eye,
    clerk,
  ] = t.characters.map((c) => c.id);
  const person = (who: string) => t.characters.find((c) => c.id === who)!;
  person(lin).inventory = [{ item: "Sac à dos", quantity: 1 }];
  person(lin).properties = [
    { name: "Statut", value: "Aventurière en quête de fortune" },
    { name: "Lieu actuel", value: "Chemin forestier" },
  ];
  person(guide).properties = [{ name: "État vital", value: "Vivant" }];
  person(clerk).inventory = [{ item: "Carte de secours", quantity: 1 }];
  const staff = id(),
    cleaning = id();
  t.groups = [
    {
      id: staff,
      name: "Personnel du donjon",
      kind: "groupe",
      members: [boss, guide, clean, teacher, skeleton, clerk],
    },
    {
      id: cleaning,
      name: "Service de nettoyage",
      kind: "groupe",
      members: [clean],
    },
  ];
  t.links = [];
  const prop = (who: string, name: string, value: string): Effect => ({
    id: id(),
    type: "property",
    person: who,
    name,
    value,
    remove: false,
  });
  const relation = (from: string, to: string, kind: string): Effect => ({
    id: id(),
    type: "relation",
    from,
    to,
    kind,
    remove: false,
  });
  const join = (who: string, group: string): Effect => ({
    id: id(),
    type: "membership",
    person: who,
    group,
    join: true,
  });
  const fill = (
    b: Block,
    title: string,
    place: string,
    cast: string[],
    text: string,
    pages: string,
    effects: Effect[] = [],
  ) => {
    Object.assign(b, {
      title,
      situation: title,
      place,
      cast,
      text: `${text}\n\nSource : histoire prod.pdf, ${pages}.`,
      duration: 1,
      effects,
      generated: false,
    });
  };
  t.loops = [
    "Une aventurière à court de chance",
    "Bienvenue dans l’administration du donjon",
    "Une formation qui met le feu",
    "La salle faussement sécurisée",
    "Vers les prêtres noirs",
  ].map((title) => newLoop(title));
  const [road, job, fire, trap, quest] = t.loops.map((l) => l.blocks);
  fill(
    road[0],
    "En route pour l’aventure",
    "Chemin forestier",
    [lin],
    "Linette avance avec enthousiasme. Elle cherche l’aventure et imagine déjà les trésors cachés dans une grotte, malgré le panneau de danger.",
    "p. 3",
  );
  fill(
    road[1],
    "Le troll garde sa grotte",
    "Entrée de la grotte",
    [lin, troll],
    "Un coup interrompt son exploration. Linette découvre le troll et prend la fuite ; elle croit bientôt l’avoir semé.",
    "p. 3–4",
    [relation(troll, lin, "hostilité")],
  );
  fill(
    road[2],
    "Le filet et les deux pièces",
    "Forêt",
    [lin, bandit],
    "Un filet capture Linette. Le brigand la dépouille ; elle constate ensuite qu’il lui reste deux pièces de cuivre. Le montant antérieur étant inconnu, il n’est pas inventé dans l’inventaire.",
    "p. 4",
    [
      prop(lin, "Argent connu", "Deux pièces de cuivre après le vol"),
      relation(bandit, lin, "a dépouillé"),
    ],
  );
  fill(
    road[3],
    "Une annonce providentielle",
    "Chemin vers le donjon",
    [lin],
    "Linette trébuche contre un panneau de recrutement. L’annonce promet un poste d’apprentie, le gîte et un salaire ; elle y voit un moyen de refaire sa bourse et se rend au donjon.",
    "p. 4–5",
    [
      prop(lin, "Objectif", "Obtenir le poste d’apprentie"),
      prop(lin, "Lieu actuel", "Entrée du donjon"),
    ],
  );
  fill(
    job[0],
    "Lundi 7 h · Un entretien tombé du ciel",
    "Bureau du directeur",
    [lin, boss, guide],
    "Une trappe fait tomber Linette dans le bureau. Le directeur accueille sa candidature, fait apparaître son assistant et lui propose de s’asseoir sur une chaise inexistante. Elle réussit ce premier test, puis est envoyée en zone A362.",
    "p. 5–7",
    [
      prop(lin, "Statut", "Candidature approuvée"),
      relation(boss, lin, "recrute"),
      relation(guide, lin, "accompagne"),
    ],
  );
  fill(
    job[1],
    "7 h 05 · Un portail et trop de flèches",
    "Couloirs du donjon",
    [lin, guide],
    "Le guide fait passer Linette par un portail. Les flèches A362 se contredisent : le trajet se termine au département A363. Les démarches d’inscription commencent dans la sous-boucle.",
    "p. 8–9",
    [prop(lin, "Lieu actuel", "Département A363")],
  );
  const bureaucracy = newLoop("Le formulaire qui mange la matinée");
  job[1].loops.push(bureaucracy);
  fill(
    bureaucracy.blocks[0],
    "7 h 12 · S’enregistrer",
    "Département A363",
    [lin, guide],
    "Un squelette demande l’enregistrement. Linette s’installe devant le formulaire et se demande si cette paperasse fait vraiment partie du travail.",
    "p. 9–10",
  );
  fill(
    bureaucracy.blocks[1],
    "Prévoir sa propre mort",
    "Guichet des formulaires",
    [lin, guide],
    "Le formulaire énumère les morts possibles. Linette hésite devant les poissons géants, l’empoisonnement et les dragons ; son guide lui conseille de tout cocher. Ces risques ne sont pas des événements survenus.",
    "p. 10",
  );
  fill(
    bureaucracy.blocks[2],
    "12 h 18 · Signer sans lire",
    "Validation des formulaires",
    [lin],
    "Après une matinée de démarches, Linette signale une coupure de papier. Le contrat est validé ; son dossier d’apprentie stagiaire souligne ses incidents et l’absence de garantie de survie.",
    "p. 11",
    [
      prop(lin, "Statut", "Apprentie stagiaire"),
      prop(lin, "Blessure", "Coupure de papier"),
      join(lin, staff),
    ],
  );
  fill(
    bureaucracy.blocks[3],
    "Une affectation qui engage aussi le guide",
    "Administration",
    [lin, guide],
    "Linette est affectée au nettoyage. Un message du chef oblige le gobelin à l’accompagner, malgré sa protestation.",
    "p. 12",
    [
      join(lin, cleaning),
      join(guide, cleaning),
      prop(lin, "Affectation", "Service de nettoyage"),
    ],
  );
  fill(
    job[2],
    "12 h 22 · Le déjeuner sert aussi à nettoyer",
    "Section nettoyage",
    [lin, guide, clean],
    "Le responsable présente un slime bleu utilisable comme nettoyant et déjeuner. Linette réagit avec ironie ; le guide s’offusque du manque de respect pour son rang. Aucune consommation ni acquisition du slime n’est montrée.",
    "p. 12",
    [prop(lin, "Lieu actuel", "Section nettoyage")],
  );
  fill(
    job[3],
    "12 h 45 · La formation obligatoire",
    "Salle de formation incendie",
    [lin, guide, teacher, imp],
    "Les recrues rejoignent la formation. Le squelette annonce les bonnes pratiques et demande de repérer une issue de secours qui débouche sur un précipice en feu.",
    "p. 13",
    [prop(lin, "Lieu actuel", "Formation incendie")],
  );
  fill(
    fire[0],
    "La sécurité selon le donjon",
    "Salle de formation incendie",
    [lin, teacher, imp],
    "Le formateur énumère les installations brûlantes. Ses consignes exigent de terminer son travail avant de rejoindre l’endroit prévu pour rôtir.",
    "p. 13",
  );
  fill(
    fire[1],
    "Deux volontaires devant les flammes",
    "Salle d’entraînement",
    [lin, teacher, imp],
    "Linette et le diablotin se portent volontaires. Devant une salle en feu, le diablotin choisit une bouteille étiquetée « Restes de soupe ».",
    "p. 14",
  );
  fill(
    fire[2],
    "Le liquide attise le désastre",
    "Salle d’entraînement",
    [lin, guide, teacher, imp],
    "Le diablotin projette le liquide : les flammes augmentent et touchent un gobelin. Le formateur utilise du terreau ; Linette se retrouve à son tour les cheveux en feu.",
    "p. 14–15",
    [prop(lin, "État physique", "Cheveux en feu")],
  );
  fill(
    fire[3],
    "Éteinte, mais pas rassurée",
    "Salle d’entraînement",
    [lin, teacher, imp],
    "Linette plonge la tête dans un seau. Le formateur clôt l’exercice et demande aux survivants de signer l’attestation. Les planches ne montrent pas sa signature.",
    "p. 15",
    [
      prop(lin, "État physique", "Flammes éteintes après immersion"),
      prop(
        lin,
        "Formation incendie",
        "Exercice terminé ; attestation non montrée",
      ),
    ],
  );
  fill(
    trap[0],
    "13 h · La première tâche",
    "Salle annoncée sécurisée",
    [lin, guide, skeleton],
    "Linette et le guide doivent nettoyer une salle. Le squelette affirme qu’elle est parfaitement sécurisée, alors qu’un énorme marquage annonce un piège.",
    "p. 16",
    [prop(lin, "Lieu actuel", "Salle piégée")],
  );
  fill(
    trap[1],
    "Un ancien piège prétendument inutilisé",
    "Salle piégée",
    [lin, guide, skeleton],
    "Linette relève l’avertissement. Le squelette minimise le danger ; un déclic accompagne le pas du guide.",
    "p. 16",
  );
  fill(
    trap[2],
    "Le gobelin tombe",
    "Fosse de la salle piégée",
    [lin, guide, skeleton, imp],
    "La trappe s’ouvre sous le guide. Linette regarde dans le trou. Le diablotin le déclare mort et indique qu’un rituel noir est nécessaire ; aucune résurrection n’a encore lieu.",
    "p. 16–17",
    [
      prop(guide, "État vital", "Mort annoncé par le diablotin"),
      prop(guide, "Lieu actuel", "Au fond de la fosse"),
      prop(lin, "Objectif", "Trouver un prêtre noir pour le gobelin"),
    ],
  );
  fill(
    trap[3],
    "Un rapport plutôt qu’un sauvetage",
    "Salle piégée",
    [lin, skeleton, eye],
    "Le squelette part rédiger son rapport. La créature à un œil propose de guider Linette vers l’accueil et annonce vouloir pétrifier le corps pour le conserver. L’exécution de cette pétrification n’est pas montrée.",
    "p. 17",
    [relation(eye, lin, "guide vers l’accueil")],
  );
  fill(
    quest[0],
    "14 h 30 · Un secours soumis à procédure",
    "Accueil de l’intendance",
    [lin, eye, clerk],
    "Linette demande un prêtre noir. L’agent réclame un formulaire et une attente en file ; la créature fait valoir que le gobelin avait été envoyé par le directeur. Linette passe derrière le comptoir.",
    "p. 18",
    [prop(lin, "Lieu actuel", "Derrière le comptoir de l’accueil")],
  );
  fill(
    quest[1],
    "L’itinéraire des dangers",
    "Arrière du comptoir",
    [lin, clerk],
    "L’agent décrit une salle au crâne, un levier, un faux mur, la fosse des noyés, les vers géants, l’Abysse infernal et les Catacombes de Non-Retour. Ce sont des étapes annoncées, pas encore traversées.",
    "p. 19",
  );
  fill(
    quest[2],
    "La carte de secours change de mains",
    "Arrière du comptoir",
    [lin, clerk],
    "Avant le départ, l’agent avertit Linette qu’elle doit prouver sa demande de service pour éviter d’être sacrifiée. Il lui remet une carte de secours réservée aux situations désespérées.",
    "p. 20",
    [
      {
        id: id(),
        type: "inventory",
        person: clerk,
        to: lin,
        item: "Carte de secours",
        quantity: 1,
        operation: "transfer",
      },
      relation(clerk, lin, "fournit une carte de secours"),
    ],
  );
  fill(
    quest[3],
    "Le raccourci interdit · Fin de l’extrait",
    "Départ vers les couloirs inférieurs",
    [lin, clerk],
    "Linette remarque un autre chemin qui semble contourner l’abîme. L’agent le refuse : il mène au département B, interdit aux « Non-morts » selon ses paroles. Elle renonce à discuter et part. La recherche du prêtre et le sort du gobelin restent ouverts : aucune suite n’est inventée.",
    "p. 21",
    [prop(lin, "Lieu actuel", "Départ vers les prêtres noirs")],
  );
  return t;
}
