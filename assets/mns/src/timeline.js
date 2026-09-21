import { parseJson } from "./json.js?v=013e2e087482";
/** A chronological, recursive outline. Parent effects occur at block entry. */
export const PHASES = ["E", "I", "P", "R"];
export const LABELS = {
    E: "Mise en place",
    I: "Déclenchement",
    P: "Bascule",
    R: "Retombée",
};
export const HINTS = {
    E: "Qui veut quoi, et où commence-t-on ?",
    I: "Qu’est-ce qui rompt l’équilibre ?",
    P: "Quel choix ou événement change la situation ?",
    R: "Qu’est-ce qui a changé, et que reste-t-il à résoudre ?",
};
export const MAX_DEPTH = 7;
export const KEY = "metamachia.timeline.v1";
export const id = () => globalThis.crypto.randomUUID();
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
export const IDEAS = {
    E: [
        {
            title: "Une rencontre",
            prompt: "{noms} se rencontrent{lieu}. Un désir commun apparaît, mais chacun garde une réserve.",
        },
        {
            title: "Un équilibre fragile",
            prompt: "{noms} tentent de préserver leur quotidien{lieu}. Montrer ce qui compte et ce qui pourrait être perdu.",
        },
        {
            title: "Un secret partagé",
            prompt: "{noms} connaissent un secret{lieu}. Définir qui le sait et ce qu’il risque.",
        },
        {
            title: "Une promesse",
            prompt: "{noms} prennent un engagement{lieu}. Préciser sa valeur et les limites de cette promesse.",
        },
    ],
    I: [
        {
            title: "Un obstacle",
            prompt: "Un obstacle empêche {noms} d’avancer{lieu}. Rendre l’objectif et le risque visibles.",
        },
        {
            title: "Une découverte",
            prompt: "{noms} découvrent un indice{lieu}. Il oblige à reconsidérer une certitude.",
        },
        {
            title: "Une invitation",
            prompt: "{noms} reçoivent une proposition{lieu}. Accepter a un prix, refuser aussi.",
        },
        {
            title: "Une rupture",
            prompt: "Un événement rompt les habitudes de {noms}{lieu}. Choisir une première réaction.",
        },
    ],
    P: [
        {
            title: "Un choix irréversible",
            prompt: "{noms} doivent choisir{lieu}. Montrer la décision, son coût et le changement concret qu’elle produit.",
        },
        {
            title: "Une révélation",
            prompt: "Une vérité éclate pour {noms}{lieu}. Distinguer ce que le lecteur apprend de ce qui change réellement.",
        },
        {
            title: "Une confrontation",
            prompt: "{noms} affrontent l’obstacle{lieu}. L’issue modifie leur pouvoir d’agir.",
        },
        {
            title: "Un sacrifice",
            prompt: "{noms} renoncent à quelque chose{lieu} pour préserver ce qui compte davantage.",
        },
    ],
    R: [
        {
            title: "Un nouvel équilibre",
            prompt: "{noms} découvrent les conséquences de leur choix{lieu}. Montrer ce qui ne sera plus comme avant.",
        },
        {
            title: "Une réconciliation",
            prompt: "{noms} tentent de réparer leur lien{lieu}. Tout n’est pas effacé : préciser ce qui demeure.",
        },
        {
            title: "Un départ",
            prompt: "{noms} quittent une situation{lieu}. Un détail rappelle ce que cette traversée a changé.",
        },
        {
            title: "Une question ouverte",
            prompt: "{noms} obtiennent une réponse{lieu}, mais elle fait naître une nouvelle question.",
        },
    ],
};
export function newLoop(title = "Nouvelle boucle") {
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
export function emptyTimeline() {
    return {
        version: 1,
        title: "Une histoire à déplier",
        settings: {
            genre: "Aventure",
            tone: "Sensible et lumineux",
            premise: "",
            audience: "Tout public",
            panelsPerPage: 4,
        },
        characters: [],
        groups: [],
        links: [],
        loops: [newLoop("Le fil principal")],
    };
}
export function entries(t) {
    const result = [];
    const walk = (loops, depth, path) => loops.forEach((loop, i) => {
        const p = `${path}${i + 1}`;
        loop.blocks.forEach((block) => {
            result.push({ block, loop, depth, path: `${p}.${block.phase}` });
            walk(block.loops, depth + 1, `${p}.${block.phase}.`);
        });
    });
    walk(t.loops, 1, "");
    return result;
}
export function insertLoop(t, parentId) {
    if (entries(t).length >= 396)
        throw new Error("Limite de 400 blocs atteinte. Exportez une partie pour poursuivre.");
    const loop = newLoop();
    if (!parentId)
        t.loops.push(loop);
    else {
        const e = entries(t).find((e) => e.block.id === parentId);
        if (!e)
            throw new Error("Bloc introuvable.");
        if (e.depth >= MAX_DEPTH)
            throw new Error("Sept niveaux maximum.");
        loop.blocks.forEach((b) => {
            b.cast = [...e.block.cast];
            b.place = e.block.place;
        });
        e.block.loops.push(loop);
    }
    return loop;
}
export function deleteLoop(t, loopId) {
    const walk = (loops) => {
        const i = loops.findIndex((l) => l.id === loopId);
        if (i >= 0)
            loops.splice(i, 1);
        else
            loops.forEach((l) => l.blocks.forEach((b) => walk(b.loops)));
    };
    walk(t.loops);
}
export function deleteCharacter(t, person) {
    t.characters = t.characters.filter((c) => c.id !== person);
    t.links = t.links.filter((l) => l.from !== person && l.to !== person);
    t.groups.forEach((g) => (g.members = g.members.filter((m) => m !== person)));
    entries(t).forEach(({ block }) => {
        block.cast = block.cast.filter((c) => c !== person);
        block.effects = block.effects.filter((e) => e.type === "relation"
            ? e.from !== person && e.to !== person
            : e.person !== person);
    });
}
export function deleteGroup(t, group) {
    t.groups = t.groups.filter((g) => g.id !== group);
    entries(t).forEach(({ block }) => (block.effects = block.effects.filter((e) => e.type !== "membership" || e.group !== group)));
}
const symmetric = (kind) => ![
    "parent de",
    "enfant de",
    "mentor de",
    "protège",
    "dépend de",
    "trahit",
].includes(kind);
const same = (a, b) => a.kind === b.kind &&
    ((a.from === b.from && a.to === b.to) ||
        (symmetric(a.kind) && a.from === b.to && a.to === b.from));
export function stateAt(t, count) {
    const links = t.links
        .filter((l, i, all) => all.findIndex((other) => same(l, other)) === i)
        .map((l) => ({ ...l })), groups = t.groups.map((g) => ({ ...g, members: [...g.members] }));
    const present = new Set(t.characters.filter((c) => c.present).map((c) => c.id));
    for (const { block } of entries(t).slice(0, Math.max(0, Math.floor(count))))
        for (const e of block.effects) {
            if (e.type === "presence") {
                if (e.present)
                    present.add(e.person);
                else
                    present.delete(e.person);
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
                    if (i >= 0)
                        links.splice(i, 1);
                }
                else if (i < 0)
                    links.push({ id: e.id, from: e.from, to: e.to, kind: e.kind });
            }
        }
    return { links, groups, present };
}
export function outline(t, b) {
    const names = b.cast
        .map((p) => t.characters.find((c) => c.id === p)?.name)
        .filter(Boolean);
    let prompt = (IDEAS[b.phase].find((i) => i.title === b.situation) || IDEAS[b.phase][0]).prompt;
    if (names.length <= 1) {
        const singular = {
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
    const subject = names.join(" et ") ||
        (prompt.startsWith("{noms}")
            ? "Le personnage principal"
            : "le personnage principal");
    return prompt
        .replace("{noms}", subject)
        .replace("{lieu}", b.place ? ` (lieu : ${b.place})` : "");
}
export function panels(t) {
    return entries(t)
        .filter((e) => !e.block.loops.length)
        .map((e) => ({
        ...e,
        text: e.block.text || outline(t, e.block),
        drafted: !!e.block.text && !e.block.generated,
    }));
}
export function markdown(t) {
    return (`# ${t.title}\n\n${t.settings.premise}\n\n${t.settings.genre} · ${t.settings.tone}\n\n` +
        panels(t)
            .map((e, i) => `## Page ${Math.floor(i / t.settings.panelsPerPage) + 1} · Case ${(i % t.settings.panelsPerPage) + 1}\n\n${e.path} — ${e.block.title}\n\n${e.text}${e.drafted ? "" : "\n\n*Proposition à écrire, non validée.*"}\n`)
            .join("\n"));
}
export function warnings(t) {
    const out = [];
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
        if (b.phase === "P" &&
            !b.text.trim() &&
            !b.effects.length &&
            !b.loops.length)
            out.push({
                block: b.id,
                text: `${b.title} : précisez ce qui change, au-delà de l’amorce.`,
            });
        const before = stateAt(t, i);
        b.cast
            .filter((p) => !before.present.has(p) &&
            !b.effects.some((e) => e.type === "presence" && e.person === p && e.present))
            .forEach((p) => out.push({
            block: b.id,
            text: `${t.characters.find((c) => c.id === p)?.name} intervient avant son entrée dans le récit.`,
        }));
    });
    return out;
}
/** Validate archives before rendering, enforce bounds before recursive descent. */
export function parseTimeline(text) {
    if (text.length > 4_000_000)
        throw new Error("Archive trop volumineuse (4 Mo maximum).");
    const t = parseJson(text);
    const fail = () => {
        throw new Error("Archive de frise invalide ou références manquantes.");
    };
    const obj = (v) => v && typeof v === "object" && !Array.isArray(v);
    const str = (v, max = 20000) => typeof v === "string" && v.length <= max;
    const arr = (v, max) => Array.isArray(v) && v.length <= max;
    const ids = new Set();
    const ident = (v) => {
        if (!str(v, 100) || !/^[a-zA-Z0-9_-]+$/.test(v) || ids.has(v))
            fail();
        ids.add(v);
    };
    if (!obj(t) ||
        t.version !== 1 ||
        !str(t.title, 200) ||
        !obj(t.settings) ||
        !arr(t.characters, 200) ||
        !arr(t.groups, 100) ||
        !arr(t.links, 1000) ||
        !arr(t.loops, 100))
        fail();
    for (const k of ["genre", "tone", "premise", "audience"])
        if (!str(t.settings[k]))
            fail();
    if (!Number.isInteger(t.settings.panelsPerPage) ||
        t.settings.panelsPerPage < 1 ||
        t.settings.panelsPerPage > 6)
        fail();
    for (const c of t.characters) {
        if (!obj(c))
            fail();
        ident(c.id);
        if (!str(c.name, 100) ||
            !str(c.goal) ||
            !/^#[0-9a-f]{6}$/i.test(c.color) ||
            typeof c.present !== "boolean")
            fail();
    }
    const people = new Set(t.characters.map((c) => c.id));
    const members = (v) => arr(v, 200) &&
        new Set(v).size === v.length &&
        v.every((p) => people.has(p));
    for (const g of t.groups) {
        if (!obj(g))
            fail();
        ident(g.id);
        if (!str(g.name, 100) ||
            !["groupe", "faction"].includes(g.kind) ||
            !members(g.members))
            fail();
    }
    const groups = new Set(t.groups.map((g) => g.id));
    const relation = (l) => people.has(l.from) &&
        people.has(l.to) &&
        l.from !== l.to &&
        str(l.kind, 100) &&
        l.kind.trim().length > 0;
    for (const l of t.links) {
        if (!obj(l))
            fail();
        ident(l.id);
        if (!relation(l))
            fail();
    }
    let total = 0;
    const walk = (loops, depth) => {
        if (loops.length && depth > MAX_DEPTH)
            fail();
        for (const l of loops) {
            if (!obj(l))
                fail();
            ident(l.id);
            if (!str(l.title, 200) || !arr(l.blocks, 4) || l.blocks.length !== 4)
                fail();
            l.blocks.forEach((b, i) => {
                if (++total > 400 || !obj(b))
                    fail();
                ident(b.id);
                if (b.phase !== PHASES[i] ||
                    !str(b.title, 200) ||
                    !str(b.situation, 200) ||
                    !str(b.place, 200) ||
                    !str(b.text) ||
                    !members(b.cast) ||
                    !arr(b.effects, 100) ||
                    !arr(b.loops, 100))
                    fail();
                for (const e of b.effects) {
                    if (!obj(e))
                        fail();
                    ident(e.id);
                    if (e.type === "relation") {
                        if (!relation(e) || typeof e.remove !== "boolean")
                            fail();
                    }
                    else if (e.type === "presence") {
                        if (!people.has(e.person) || typeof e.present !== "boolean")
                            fail();
                    }
                    else if (e.type === "membership") {
                        if (!people.has(e.person) ||
                            !groups.has(e.group) ||
                            typeof e.join !== "boolean")
                            fail();
                    }
                    else
                        fail();
                }
                walk(b.loops, depth + 1);
            });
        }
    };
    walk(t.loops, 1);
    return t;
}
export function demoTimeline() {
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
    root.blocks[2].effects.push({ id: id(), type: "presence", person: c, present: true }, {
        id: id(),
        type: "relation",
        from: a,
        to: c,
        kind: "parent de",
        remove: false,
    }, {
        id: id(),
        type: "relation",
        from: n,
        to: c,
        kind: "parent de",
        remove: false,
    });
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
