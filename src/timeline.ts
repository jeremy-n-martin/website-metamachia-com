import { parseJson } from "./json.js";
/** Ordered passages: baseline at t=0, effects at each passage's end, then children. */
export const PHASES = ["E", "I", "P", "R"] as const;
export type Phase = (typeof PHASES)[number];
export const LABELS: Record<Phase, string> = {
  E: "Mise en place",
  I: "Déclenchement",
  P: "Bascule",
  R: "Retombée",
};
export const HINTS: Record<Phase, string> = {
  E: "Qui veut quoi, et où commence-t-on ?",
  I: "Qu’est-ce qui rompt l’équilibre ?",
  P: "Quel choix ou événement change la situation ?",
  R: "Qu’est-ce qui a changé, et que reste-t-il à résoudre ?",
};
export const MAX_DEPTH = 7;
export const KEY = "metamachia.timeline.v1";
export const id = () => globalThis.crypto.randomUUID();
export interface Character {
  id: string;
  name: string;
  goal: string;
  color: string;
  present: boolean;
  inventory?: { item: string; quantity: number }[];
  properties?: { name: string; value: string }[];
}
export interface Chronology {
  origin: string;
  unit: string;
  defaultDuration: number;
  configured: boolean;
}
export const DEFAULT_CHRONOLOGY: Chronology = {
  origin: "Le début du roman",
  unit: "jour",
  defaultDuration: 1,
  configured: false,
};
export const OBJECTS = [
  "Épée légendaire",
  "Clé ancienne",
  "Lettre scellée",
  "Carte du royaume",
  "Potion de soin",
  "Pièce d’or",
  "Téléphone",
  "Carnet",
  "Preuve compromettante",
  "Photographie",
  "Médicament",
  "Bijou de famille",
];
export const PROPERTIES = [
  "Santé",
  "Blessure",
  "Métier",
  "Statut",
  "Pouvoir",
  "Lieu actuel",
  "Objectif",
  "Émotion",
  "Secret",
  "Réputation",
];
export interface Group {
  id: string;
  name: string;
  kind: "groupe" | "faction";
  members: string[];
}
export interface Link {
  id: string;
  from: string;
  to: string;
  kind: string;
}
export type Effect =
  | {
      id: string;
      type: "relation";
      from: string;
      to: string;
      kind: string;
      remove: boolean;
    }
  | { id: string; type: "presence"; person: string; present: boolean }
  | {
      id: string;
      type: "inventory";
      person: string;
      item: string;
      quantity: number;
      operation: "gain" | "loss" | "transfer";
      to?: string;
    }
  | {
      id: string;
      type: "property";
      person: string;
      name: string;
      value: string;
      remove: boolean;
    }
  | {
      id: string;
      type: "membership";
      person: string;
      group: string;
      join: boolean;
    };
export interface Block {
  id: string;
  phase: Phase;
  title: string;
  situation: string;
  place: string;
  text: string;
  generated?: boolean;
  duration?: number;
  cast: string[];
  effects: Effect[];
  loops: Loop[];
}
export interface Loop {
  id: string;
  title: string;
  blocks: Block[];
}
export interface Timeline {
  version: 1;
  title: string;
  settings: {
    genre: string;
    tone: string;
    premise: string;
    audience: string;
    chronology?: Chronology;
  };
  characters: Character[];
  groups: Group[];
  links: Link[];
  loops: Loop[];
}
export interface Entry {
  block: Block;
  loop: Loop;
  depth: number;
  path: string;
}
export const RELATIONS = [
  {
    category: "Vie sociale",
    values: ["connaissance", "amitié", "confiance", "rivalité", "hostilité"],
  },
  {
    category: "Vie affective",
    values: ["attirance", "couple", "mariage", "séparation"],
  },
  {
    category: "Famille · sens de la flèche",
    values: ["parent de", "enfant de", "frère ou sœur de"],
  },
  {
    category: "Pouvoir et entraide",
    values: ["alliance", "mentor de", "protège", "dépend de", "trahit"],
  },
];
export const IDEAS: Record<
  Phase,
  {
    title: string;
    prompt: string;
    action?: "gain" | "loss" | "transfer" | "property";
  }[]
> = {
  E: [
    {
      title: "Une rencontre",
      prompt:
        "{noms} se rencontrent{lieu}. Un désir commun apparaît, mais chacun garde une réserve.",
    },
    {
      title: "Un équilibre fragile",
      prompt:
        "{noms} tentent de préserver leur quotidien{lieu}. Montrer ce qui compte et ce qui pourrait être perdu.",
    },
    {
      title: "Un secret partagé",
      prompt:
        "{noms} connaissent un secret{lieu}. Définir qui le sait et ce qu’il risque.",
    },
    {
      title: "Une promesse",
      prompt:
        "{noms} prennent un engagement{lieu}. Préciser sa valeur et les limites de cette promesse.",
    },
  ],
  I: [
    {
      title: "Un obstacle",
      prompt:
        "Un obstacle empêche {noms} d’avancer{lieu}. Rendre l’objectif et le risque visibles.",
    },
    {
      title: "Une découverte",
      prompt:
        "{noms} découvrent un indice{lieu}. Il oblige à reconsidérer une certitude.",
    },
    {
      title: "Une invitation",
      prompt:
        "{noms} reçoivent une proposition{lieu}. Accepter a un prix, refuser aussi.",
    },
    {
      title: "Une rupture",
      prompt:
        "Un événement rompt les habitudes de {noms}{lieu}. Choisir une première réaction.",
    },
  ],
  P: [
    {
      title: "Un choix irréversible",
      prompt:
        "{noms} doivent choisir{lieu}. Montrer la décision, son coût et le changement concret qu’elle produit.",
    },
    {
      title: "Une révélation",
      prompt:
        "Une vérité éclate pour {noms}{lieu}. Distinguer ce que le lecteur apprend de ce qui change réellement.",
    },
    {
      title: "Une confrontation",
      prompt:
        "{noms} affrontent l’obstacle{lieu}. L’issue modifie leur pouvoir d’agir.",
    },
    {
      title: "Un sacrifice",
      prompt:
        "{noms} renoncent à quelque chose{lieu} pour préserver ce qui compte davantage.",
    },
  ],
  R: [
    {
      title: "Un nouvel équilibre",
      prompt:
        "{noms} découvrent les conséquences de leur choix{lieu}. Montrer ce qui ne sera plus comme avant.",
    },
    {
      title: "Une réconciliation",
      prompt:
        "{noms} tentent de réparer leur lien{lieu}. Tout n’est pas effacé : préciser ce qui demeure.",
    },
    {
      title: "Un départ",
      prompt:
        "{noms} quittent une situation{lieu}. Un détail rappelle ce que cette traversée a changé.",
    },
    {
      title: "Une question ouverte",
      prompt:
        "{noms} obtiennent une réponse{lieu}, mais elle fait naître une nouvelle question.",
    },
  ],
};
IDEAS.E.push(
  {
    title: "Un objet convoité",
    prompt:
      "Présenter l’objet désiré par {noms}{lieu}. Pourquoi vaut-il autant à leurs yeux ?",
  },
  {
    title: "Un quotidien singulier",
    prompt:
      "Montrer une habitude de {noms}{lieu}. Un détail révèle une règle de ce monde.",
  },
  {
    title: "Une dette ancienne",
    prompt:
      "Rappeler ce que doit {noms}{lieu}. À qui, depuis quand, et avec quelle contrepartie ?",
  },
  {
    title: "Une absence",
    prompt:
      "Faire ressentir un manque dans la vie de {noms}{lieu}. Un geste en dit plus qu’une explication.",
  },
  {
    title: "Une rivalité",
    prompt:
      "Placer {noms} face à un désir concurrent{lieu}. Que refuse-t-on de partager ?",
  },
  {
    title: "Un lieu interdit",
    prompt:
      "Présenter à {noms} un lieu qu’il ne faut pas franchir{lieu}. Établir la règle avant de la briser.",
  },
  {
    title: "Un héritage",
    prompt:
      "Un héritage arrive entre les mains de {noms}{lieu}. Préciser l’objet reçu et la responsabilité associée.",
    action: "gain",
  },
  {
    title: "Un pouvoir latent",
    prompt:
      "Faire entrevoir une capacité de {noms}{lieu}. Définir ce qu’elle permet et sa limite.",
    action: "property",
  },
);
IDEAS.I.push(
  {
    title: "Le gain d’un objet",
    prompt:
      "Un objet parvient à {noms}{lieu}. Choisir qui le reçoit et pourquoi ce gain ouvre une possibilité.",
    action: "gain",
  },
  {
    title: "Un vol",
    prompt:
      "Un objet disparaît des affaires de {noms}{lieu}. Sa perte impose une action immédiate.",
    action: "loss",
  },
  {
    title: "Un ultimatum",
    prompt:
      "Imposer une échéance à {noms}{lieu}. Que se passera-t-il sans décision ?",
  },
  {
    title: "Un appel à l’aide",
    prompt:
      "Quelqu’un demande l’aide de {noms}{lieu}. Répondre détourne du but initial.",
  },
  {
    title: "Un malentendu",
    prompt:
      "Une parole de {noms} est mal interprétée{lieu}. Distinguer la réalité de la croyance qui déclenche l’action.",
  },
  {
    title: "Une piste trompeuse",
    prompt:
      "Mettre un indice séduisant sur la route de {noms}{lieu}. Prévoir le détail qui permettra de le remettre en question.",
  },
  {
    title: "Une blessure",
    prompt:
      "Une blessure limite les possibilités de {noms}{lieu}. Préciser qui est touché et ce qui devient difficile.",
    action: "property",
  },
  {
    title: "Un passage à franchir",
    prompt:
      "Placer un seuil devant {noms}{lieu}. Franchir ce seuil signifie renoncer à une sécurité.",
  },
);
IDEAS.P.push(
  {
    title: "Un objet transmis",
    prompt:
      "Un objet change de mains entre les personnages{lieu}. Choisir qui donne, qui reçoit et ce que ce geste engage.",
    action: "transfer",
  },
  {
    title: "Une victoire coûteuse",
    prompt:
      "Offrir à {noms} une victoire{lieu}, mais faire payer un prix concret qui pèsera sur la suite.",
  },
  {
    title: "Une trahison",
    prompt:
      "Briser la confiance de {noms}{lieu}. Montrer l’acte précis, pas seulement l’annonce de la trahison.",
  },
  {
    title: "Une transformation",
    prompt:
      "Changer durablement une propriété de {noms}{lieu}. Rendre la différence visible dans une action.",
    action: "property",
  },
  {
    title: "Une preuve décisive",
    prompt:
      "Faire obtenir à {noms} la preuve manquante{lieu}. Cette acquisition change le rapport de force.",
    action: "gain",
  },
  {
    title: "Un sauvetage",
    prompt:
      "Permettre à {noms} d’arracher quelqu’un au danger{lieu}. Quelle autre possibilité faut-il abandonner ?",
  },
  {
    title: "Un refus",
    prompt:
      "Faire refuser à {noms} ce qui semblait indispensable{lieu}. Ce refus révèle une valeur plus profonde.",
  },
  {
    title: "Une perte définitive",
    prompt:
      "Retirer à {noms} un objet précieux{lieu}. Sa disparition impose de trouver une autre voie.",
    action: "loss",
  },
);
IDEAS.R.push(
  {
    title: "Un objet rendu",
    prompt:
      "Rendre un objet à son destinataire{lieu}. Le geste de {noms} clôt-il une dette ou ouvre-t-il une alliance ?",
    action: "transfer",
  },
  {
    title: "Une guérison",
    prompt:
      "Montrer la récupération de {noms}{lieu}. Préciser ce qui guérit et ce qui laisse une trace.",
    action: "property",
  },
  {
    title: "Un deuil",
    prompt:
      "Laisser à {noms} un moment pour mesurer une perte{lieu}. Choisir un geste concret de souvenir.",
  },
  {
    title: "Une récompense",
    prompt:
      "Accorder à {noms} une récompense{lieu}. L’objet reçu répond-il vraiment au désir du départ ?",
    action: "gain",
  },
  {
    title: "Un lien renoué",
    prompt:
      "Faire renouer {noms} avec une personne{lieu}. Définir les nouvelles conditions de cette relation.",
  },
  {
    title: "Une trace durable",
    prompt:
      "Inscrire les conséquences de l’épreuve dans la vie de {noms}{lieu}. Une propriété changée en garde la trace.",
    action: "property",
  },
  {
    title: "Un retour transformé",
    prompt:
      "Ramener {noms} au point de départ{lieu}. Répéter un geste ancien pour montrer ce qui a changé.",
  },
  {
    title: "Une nouvelle mission",
    prompt:
      "Donner à {noms} une prochaine direction{lieu}. Elle doit naître des conséquences de la boucle, pas les effacer.",
  },
);
export function newLoop(title = "Nouvelle boucle"): Loop {
  return {
    id: id(),
    title,
    blocks: PHASES.map((phase) => ({
      id: id(),
      phase,
      title: LABELS[phase],
      situation: IDEAS[phase][0].title,
      place: "",
      text: "",
      cast: [],
      effects: [],
      loops: [],
    })),
  };
}
export function emptyTimeline(): Timeline {
  return {
    version: 1,
    title: "Une histoire à déplier",
    settings: {
      genre: "Aventure",
      tone: "Sensible et lumineux",
      premise: "",
      audience: "Tout public",
      chronology: { ...DEFAULT_CHRONOLOGY },
    },
    characters: [],
    groups: [],
    links: [],
    loops: [newLoop("Le fil principal")],
  };
}
export function entries(t: Timeline): Entry[] {
  const result: Entry[] = [];
  const walk = (loops: Loop[], depth: number, path: string) =>
    loops.forEach((loop, i) => {
      const p = `${path}${i + 1}`;
      loop.blocks.forEach((block) => {
        result.push({ block, loop, depth, path: `${p}.${block.phase}` });
        walk(block.loops, depth + 1, `${p}.${block.phase}.`);
      });
    });
  walk(t.loops, 1, "");
  return result;
}
export function insertLoop(t: Timeline, parentId?: string): Loop {
  if (entries(t).length > 396)
    throw new Error(
      "Limite de 400 blocs atteinte. Exportez une partie pour poursuivre.",
    );
  const loop = newLoop();
  loop.blocks.forEach((b) => (b.duration = chronology(t).defaultDuration));
  if (!parentId) t.loops.push(loop);
  else {
    const e = entries(t).find((e) => e.block.id === parentId);
    if (!e) throw new Error("Bloc introuvable.");
    if (e.depth >= MAX_DEPTH) throw new Error("Sept niveaux maximum.");
    loop.blocks.forEach((b) => {
      b.cast = [...e.block.cast];
      b.place = e.block.place;
    });
    e.block.loops.push(loop);
  }
  return loop;
}
export function deleteLoop(t: Timeline, loopId: string): void {
  const walk = (loops: Loop[]): void => {
    const i = loops.findIndex((l) => l.id === loopId);
    if (i >= 0) loops.splice(i, 1);
    else loops.forEach((l) => l.blocks.forEach((b) => walk(b.loops)));
  };
  walk(t.loops);
}
export function deleteCharacter(t: Timeline, person: string): void {
  t.characters = t.characters.filter((c) => c.id !== person);
  t.links = t.links.filter((l) => l.from !== person && l.to !== person);
  t.groups.forEach((g) => (g.members = g.members.filter((m) => m !== person)));
  entries(t).forEach(({ block }) => {
    block.cast = block.cast.filter((c) => c !== person);
    block.effects = block.effects.filter((e) =>
      e.type === "relation"
        ? e.from !== person && e.to !== person
        : e.person !== person && (e.type !== "inventory" || e.to !== person),
    );
  });
}
export function deleteGroup(t: Timeline, group: string): void {
  t.groups = t.groups.filter((g) => g.id !== group);
  entries(t).forEach(
    ({ block }) =>
      (block.effects = block.effects.filter(
        (e) => e.type !== "membership" || e.group !== group,
      )),
  );
}
const symmetric = (kind: string) =>
  ![
    "parent de",
    "enfant de",
    "mentor de",
    "protège",
    "dépend de",
    "trahit",
  ].includes(kind);
const same = (
  a: Pick<Link, "from" | "to" | "kind">,
  b: Pick<Link, "from" | "to" | "kind">,
) =>
  a.kind === b.kind &&
  ((a.from === b.from && a.to === b.to) ||
    (symmetric(a.kind) && a.from === b.to && a.to === b.from));
export const normalizeName = (text: string) =>
  text.normalize("NFC").trim().toLocaleLowerCase("fr");
export function chronology(t: Timeline): Chronology {
  return t.settings.chronology || { ...DEFAULT_CHRONOLOGY };
}
export function duration(t: Timeline, b: Block) {
  return b.duration ?? chronology(t).defaultDuration;
}
export function timeAt(t: Timeline, position: number): number {
  const all = entries(t),
    count = Math.max(0, Math.min(all.length, position));
  const whole = Math.floor(count);
  return (
    all.slice(0, whole).reduce((sum, e) => sum + duration(t, e.block), 0) +
    (all[whole] ? (count - whole) * duration(t, all[whole].block) : 0)
  );
}
export function timeLabel(t: Timeline, position: number) {
  const time = timeAt(t, position),
    unit = chronology(t).unit;
  return `T + ${Number(time.toFixed(3)).toLocaleString("fr")} ${unit}${time > 1 && ["minute", "heure", "jour", "semaine", "année", "repère"].includes(unit) ? "s" : ""}`;
}
export function objectChoices(t: Timeline): string[] {
  const items = [
    ...OBJECTS,
    ...t.characters.flatMap((c) => (c.inventory || []).map((i) => i.item)),
    ...entries(t).flatMap((e) =>
      e.block.effects
        .filter((f) => f.type === "inventory")
        .map((f) => (f as Extract<Effect, { type: "inventory" }>).item),
    ),
  ];
  return items.filter(
    (name, i) =>
      items.findIndex((n) => normalizeName(n) === normalizeName(name)) === i,
  );
}
export function stateAt(t: Timeline, count: number) {
  const links = t.links
      .filter((l, i, all) => all.findIndex((other) => same(l, other)) === i)
      .map((l) => ({ ...l })),
    groups = t.groups.map((g) => ({ ...g, members: [...g.members] }));
  const present = new Set(
    t.characters.filter((c) => c.present).map((c) => c.id),
  );
  const characters = t.characters.map((c) => ({
    ...c,
    inventory: (c.inventory || []).map((i) => ({ ...i })),
    properties: (c.properties || []).map((p) => ({ ...p })),
  }));
  const issues: { block: string; effect: string; text: string }[] = [];
  for (const { block } of entries(t).slice(0, Math.max(0, Math.floor(count))))
    for (const e of block.effects) {
      if (e.type === "inventory") {
        const owner = characters.find((c) => c.id === e.person)!;
        const inventory = owner.inventory;
        const current = inventory.find(
          (i) => normalizeName(i.item) === normalizeName(e.item),
        );
        const receiver =
          e.operation === "transfer"
            ? characters.find((c) => c.id === e.to)
            : undefined;
        if (
          e.operation !== "gain" &&
          (!current || current.quantity < e.quantity)
        ) {
          issues.push({
            block: block.id,
            effect: e.id,
            text: `${owner.name} ne possède pas ${e.quantity} × ${e.item}. ${e.operation === "transfer" ? "Transfert" : "Perte"} non appliqué.`,
          });
          continue;
        }
        if (
          e.operation === "transfer" &&
          (!receiver || receiver.id === owner.id)
        ) {
          issues.push({
            block: block.id,
            effect: e.id,
            text: "Transfert invalide : choisissez deux personnages différents.",
          });
          continue;
        }
        const target = e.operation === "gain" ? owner : receiver;
        const targetItem = target?.inventory.find(
          (i) => normalizeName(i.item) === normalizeName(e.item),
        );
        if (target && (targetItem?.quantity || 0) + e.quantity > 1_000_000) {
          issues.push({
            block: block.id,
            effect: e.id,
            text: `Stock maximal dépassé pour ${e.item} : changement non appliqué.`,
          });
          continue;
        }
        if (e.operation !== "gain" && current) {
          current.quantity -= e.quantity;
          owner.inventory = inventory.filter((i) => i.quantity > 0);
        }
        if (target) {
          if (targetItem) targetItem.quantity += e.quantity;
          else target.inventory.push({ item: e.item, quantity: e.quantity });
        }
      }
      if (e.type === "property") {
        const owner = characters.find((c) => c.id === e.person)!;
        const index = owner.properties.findIndex(
          (p) => normalizeName(p.name) === normalizeName(e.name),
        );
        if (e.remove) {
          if (index >= 0) owner.properties.splice(index, 1);
        } else if (index >= 0)
          owner.properties[index] = { name: e.name, value: e.value };
        else owner.properties.push({ name: e.name, value: e.value });
      }
      if (e.type === "presence") {
        if (e.present) present.add(e.person);
        else present.delete(e.person);
      }
      if (e.type === "membership") {
        const g = groups.find((g) => g.id === e.group);
        if (g)
          g.members = e.join
            ? [...new Set([...g.members, e.person])]
            : g.members.filter((p) => p !== e.person);
      }
      if (e.type === "relation") {
        const i = links.findIndex((l) => same(l, e));
        if (e.remove) {
          if (i >= 0) links.splice(i, 1);
        } else if (i < 0)
          links.push({ id: e.id, from: e.from, to: e.to, kind: e.kind });
      }
    }
  return { links, groups, present, characters, issues };
}
export function outline(t: Timeline, b: Block): string {
  const names = b.cast
    .map((p) => t.characters.find((c) => c.id === p)?.name)
    .filter(Boolean);
  let prompt =
    IDEAS[b.phase].find((i) => i.title === b.situation)?.prompt ||
    `${b.situation || LABELS[b.phase]} : préciser ce qui arrive à {noms}{lieu}, le désir en jeu et les conséquences.`;
  if (names.length <= 1) {
    const singular: Record<string, string> = {
      "se rencontrent": "fait une rencontre",
      tentent: "tente",
      connaissent: "connaît",
      prennent: "prend",
      découvrent: "découvre",
      reçoivent: "reçoit",
      doivent: "doit",
      affrontent: "affronte",
      renoncent: "renonce",
      quittent: "quitte",
      obtiennent: "obtient",
      "chacun garde": "une réserve subsiste",
    };
    for (const [plural, single] of Object.entries(singular))
      prompt = prompt.replace(plural, single);
    prompt = prompt
      .replace("une réserve subsiste une réserve", "une réserve subsiste")
      .replace("leurs", "ses")
      .replace("leur ", "son ");
  }
  const subject =
    names.join(" et ") ||
    (prompt.startsWith("{noms}")
      ? "Le personnage principal"
      : "le personnage principal");
  return prompt
    .replace("{noms}", subject)
    .replace("{lieu}", b.place ? ` (lieu : ${b.place})` : "");
}
export function passages(t: Timeline) {
  return entries(t).map((e) => ({
    ...e,
    text: e.block.text || outline(t, e.block),
    drafted: !!e.block.text && !e.block.generated,
  }));
}
export function markdown(t: Timeline): string {
  return (
    `# ${t.title}\n\n${t.settings.premise}\n\n${t.settings.genre} · ${t.settings.tone}\n\n` +
    passages(t)
      .map(
        (e, i) =>
          `## ${e.path} — ${e.block.title}\n\n${timeLabel(t, i)} → ${timeLabel(t, i + 1)}\n\n${e.text}${e.drafted ? "" : "\n\n*Proposition à écrire, non validée.*"}\n`,
      )
      .join("\n")
  );
}
export function warnings(t: Timeline): { block?: string; text: string }[] {
  const out: { block?: string; text: string }[] = [
    ...stateAt(t, entries(t).length).issues,
  ];
  if (!t.characters.length)
    out.push({ text: "Ajoutez au moins un personnage pour porter le récit." });
  if (!t.settings.premise.trim())
    out.push({
      text: "Dans les réglages, donnez un désir, un obstacle et un enjeu à votre histoire.",
    });
  t.characters
    .filter((c) => !c.goal.trim())
    .forEach((c) => out.push({ text: `${c.name} : quel est son désir ?` }));
  entries(t).forEach(({ block: b }, i) => {
    if (!b.cast.length && !b.loops.length)
      out.push({ block: b.id, text: `${b.title} : qui porte cette étape ?` });
    if (
      b.phase === "P" &&
      !b.text.trim() &&
      !b.effects.length &&
      !b.loops.length
    )
      out.push({
        block: b.id,
        text: `${b.title} : précisez ce qui change, au-delà de l’amorce.`,
      });
    const before = stateAt(t, i);
    b.cast
      .filter(
        (p) =>
          !before.present.has(p) &&
          !b.effects.some(
            (e) => e.type === "presence" && e.person === p && e.present,
          ),
      )
      .forEach((p) =>
        out.push({
          block: b.id,
          text: `${t.characters.find((c) => c.id === p)?.name} intervient avant son entrée dans le récit.`,
        }),
      );
  });
  return out;
}
/** Validate archives before rendering, enforce bounds before recursive descent. */
export function parseTimeline(text: string): Timeline {
  if (text.length > 4_000_000)
    throw new Error("Archive trop volumineuse (4 Mo maximum).");
  const t: any = parseJson(text);
  const fail = () => {
    throw new Error("Archive de frise invalide ou références manquantes.");
  };
  const obj = (v: any) => v && typeof v === "object" && !Array.isArray(v);
  const str = (v: any, max = 20000) => typeof v === "string" && v.length <= max;
  const arr = (v: any, max: number) => Array.isArray(v) && v.length <= max;
  const ids = new Set<string>();
  const ident = (v: any) => {
    if (!str(v, 100) || !/^[a-zA-Z0-9_-]+$/.test(v) || ids.has(v)) fail();
    ids.add(v);
  };
  if (
    !obj(t) ||
    t.version !== 1 ||
    !str(t.title, 200) ||
    !obj(t.settings) ||
    !arr(t.characters, 200) ||
    !arr(t.groups, 100) ||
    !arr(t.links, 1000) ||
    !arr(t.loops, 100)
  )
    fail();
  for (const k of ["genre", "tone", "premise", "audience"])
    if (!str(t.settings[k])) fail();
  // Read old archives without retaining the former block-to-panel assumption.
  delete t.settings.panelsPerPage;
  if (t.settings.chronology === undefined)
    t.settings.chronology = { ...DEFAULT_CHRONOLOGY };
  const chrono = t.settings.chronology;
  const positive = (n: any) =>
    typeof n === "number" && Number.isFinite(n) && n >= 0.001 && n <= 1_000_000;
  const quantity = (n: any) => Number.isInteger(n) && n > 0 && n <= 1_000_000;
  const named = (s: any) => str(s, 100) && s.trim().length > 0;
  if (
    !obj(chrono) ||
    !str(chrono.origin, 200) ||
    !chrono.origin.trim() ||
    !str(chrono.unit, 30) ||
    !chrono.unit.trim() ||
    typeof chrono.configured !== "boolean" ||
    !positive(chrono.defaultDuration)
  )
    fail();
  for (const c of t.characters) {
    if (!obj(c)) fail();
    ident(c.id);
    if (
      !str(c.name, 100) ||
      !str(c.goal) ||
      !/^#[0-9a-f]{6}$/i.test(c.color) ||
      typeof c.present !== "boolean"
    )
      fail();
    if (c.inventory === undefined) c.inventory = [];
    if (c.properties === undefined) c.properties = [];
    if (!arr(c.inventory, 200) || !arr(c.properties, 100)) fail();
    for (const item of c.inventory)
      if (!obj(item) || !named(item.item) || !quantity(item.quantity)) fail();
    for (const prop of c.properties)
      if (
        !obj(prop) ||
        !named(prop.name) ||
        !str(prop.value, 2000) ||
        !prop.value.trim()
      )
        fail();
    if (
      new Set(c.inventory.map((i: any) => normalizeName(i.item))).size !==
        c.inventory.length ||
      new Set(c.properties.map((p: any) => normalizeName(p.name))).size !==
        c.properties.length
    )
      fail();
  }
  const people = new Set(t.characters.map((c: Character) => c.id));
  const members = (v: any) =>
    arr(v, 200) &&
    new Set(v).size === v.length &&
    v.every((p: any) => people.has(p));
  for (const g of t.groups) {
    if (!obj(g)) fail();
    ident(g.id);
    if (
      !str(g.name, 100) ||
      !["groupe", "faction"].includes(g.kind) ||
      !members(g.members)
    )
      fail();
  }
  const groups = new Set(t.groups.map((g: Group) => g.id));
  const relation = (l: any) =>
    people.has(l.from) &&
    people.has(l.to) &&
    l.from !== l.to &&
    str(l.kind, 100) &&
    l.kind.trim().length > 0;
  for (const l of t.links) {
    if (!obj(l)) fail();
    ident(l.id);
    if (!relation(l)) fail();
  }
  let total = 0;
  const walk = (loops: any[], depth: number) => {
    if (loops.length && depth > MAX_DEPTH) fail();
    for (const l of loops) {
      if (!obj(l)) fail();
      ident(l.id);
      if (!str(l.title, 200) || !arr(l.blocks, 4) || l.blocks.length !== 4)
        fail();
      l.blocks.forEach((b: any, i: number) => {
        if (++total > 400 || !obj(b)) fail();
        ident(b.id);
        if (b.duration === undefined) b.duration = chrono.defaultDuration;
        if (
          !positive(b.duration) ||
          (b.generated !== undefined && typeof b.generated !== "boolean")
        )
          fail();
        if (
          b.phase !== PHASES[i] ||
          !str(b.title, 200) ||
          !str(b.situation, 200) ||
          !str(b.place, 200) ||
          !str(b.text) ||
          !members(b.cast) ||
          !arr(b.effects, 100) ||
          !arr(b.loops, 100)
        )
          fail();
        for (const e of b.effects) {
          if (!obj(e)) fail();
          ident(e.id);
          if (e.type === "relation") {
            if (!relation(e) || typeof e.remove !== "boolean") fail();
          } else if (e.type === "presence") {
            if (!people.has(e.person) || typeof e.present !== "boolean") fail();
          } else if (e.type === "membership") {
            if (
              !people.has(e.person) ||
              !groups.has(e.group) ||
              typeof e.join !== "boolean"
            )
              fail();
          } else if (e.type === "inventory") {
            if (
              !people.has(e.person) ||
              !named(e.item) ||
              !quantity(e.quantity) ||
              !["gain", "loss", "transfer"].includes(e.operation)
            )
              fail();
            if (
              e.operation === "transfer" &&
              (!people.has(e.to) || e.to === e.person)
            )
              fail();
          } else if (e.type === "property") {
            if (
              !people.has(e.person) ||
              !named(e.name) ||
              !str(e.value, 2000) ||
              typeof e.remove !== "boolean" ||
              (!e.remove && !e.value.trim())
            )
              fail();
          } else fail();
        }
        walk(b.loops, depth + 1);
      });
    }
  };
  walk(t.loops, 1);
  return t as Timeline;
}
export function demoTimeline(): Timeline {
  const t = emptyTimeline();
  t.title = "Les saisons de nos liens";
  t.settings.premise =
    "Alma veut rouvrir une maison de quartier promise à la vente. Elle devra apprendre à faire confiance sans renoncer à son indépendance.";
  t.characters = [
    {
      id: id(),
      name: "Alma",
      goal: "Sauver la maison de quartier",
      color: "#bd775f",
      present: true,
    },
    {
      id: id(),
      name: "Noé",
      goal: "Trouver sa place dans la ville",
      color: "#578780",
      present: true,
    },
    {
      id: id(),
      name: "Lou",
      goal: "Grandir entouré de ses proches",
      color: "#a48abc",
      present: false,
    },
  ];
  const [a, n, c] = t.characters.map((c) => c.id);
  t.groups.push({
    id: id(),
    name: "Les habitants du quartier",
    kind: "groupe",
    members: [a, n],
  });
  t.links.push({ id: id(), from: a, to: n, kind: "amitié" });
  const root = t.loops[0];
  root.title = "Une maison, trois vies";
  root.blocks.forEach((b) => {
    b.cast = [a, n];
    b.place = "la maison du quartier";
  });
  root.blocks[0].text =
    "Alma et Noé restaurent ensemble une ancienne maison. Amis depuis longtemps, ils ne savent pas encore que ce chantier changera leur vie.";
  root.blocks[1].text =
    "L’annonce d’une vente précipitée les oblige à défendre leur projet devant le quartier. Ils décident aussi de construire leur avenir ensemble.";
  root.blocks[1].effects.push({
    id: id(),
    type: "relation",
    from: a,
    to: n,
    kind: "mariage",
    remove: false,
  });
  root.blocks[2].text =
    "La naissance de Lou bouscule leurs priorités. Ils refusent de porter seuls le projet et ouvrent la maison à un collectif.";
  root.blocks[2].effects.push(
    { id: id(), type: "presence", person: c, present: true },
    {
      id: id(),
      type: "relation",
      from: a,
      to: c,
      kind: "parent de",
      remove: false,
    },
    {
      id: id(),
      type: "relation",
      from: n,
      to: c,
      kind: "parent de",
      remove: false,
    },
  );
  root.blocks[3].cast.push(c);
  root.blocks[3].text =
    "La maison ouvre enfin. Lou s’endort au milieu des voix du quartier. Alma a sauvé le lieu en acceptant qu’il ne lui appartienne pas.";
  const child = insertLoop(t, root.blocks[1].id);
  child.title = "La promesse";
  child.blocks.forEach((b) => {
    b.cast = [a, n];
    b.place = "la mairie";
    b.text = outline(t, b);
  });
  return t;
}
