import { validateStory } from "./compiler.js?v=528a9284a674";
import { parseJson } from "./json.js?v=528a9284a674";
export const uid = (prefix) => `${prefix}_${crypto.randomUUID().replaceAll("-", "").slice(0, 16)}`;
export const wordCount = (text) => (text.trim().match(/\S+/gu) ?? []).length;
export const projectWords = (p) => p.chapters.reduce((sum, c) => sum + c.scenes.reduce((n, s) => n + wordCount(s.text ?? ""), 0), 0);
export const newScene = (time = 1) => ({
    id: uid("SC"),
    title: "Nouvelle scène",
    storyTime: time,
    text: "",
    plan: "",
    version: "1",
    status: "draft",
    participants: [],
    presentations: [],
});
export function createProject(title) {
    const now = new Date().toISOString();
    return {
        format: "mns-web",
        version: 1,
        id: uid("STORY"),
        title: title.trim() || "Histoire sans titre",
        synopsis: "",
        genre: "",
        targetWords: 30000,
        createdAt: now,
        updatedAt: now,
        entities: [],
        events: [],
        notes: [],
        arcs: [],
        chapters: [
            {
                id: uid("CH"),
                title: "Chapitre 1",
                brief: "",
                scenes: [{ ...newScene(), title: "La première scène" }],
            },
        ],
    };
}
export function demoProject() {
    const p = createProject("Les lettres de l’aube");
    p.genre = "Fantasy · Mystère";
    p.targetWords = 12000;
    p.synopsis =
        "Dans une cité où le courrier voyage dans les rêves, Linette reçoit une lettre du roi. Le cachet porte la date du lendemain. Or, le roi est mort hier.\n\nUne messagère, un secret et une promesse : retrouver l’auteur de cette lettre avant l’aube.";
    p.entities = [
        {
            id: "LINETTE",
            name: "Linette",
            kind: "character",
            description: "Messagère des songes. Manteau vert, doigts tachés d’encre. Elle croit que toute lettre finit par trouver son destinataire.",
        },
        {
            id: "KING",
            name: "Le roi Éloi",
            kind: "character",
            description: "Souverain de la cité. Son sceau est une hirondelle d’argent.",
        },
        {
            id: "CITY",
            name: "La cité des Veilleurs",
            kind: "place",
            description: "Des toits de cuivre, des canaux silencieux et une poste qui n’ouvre qu’à minuit.",
        },
        {
            id: "LETTER",
            name: "La lettre de l’aube",
            kind: "object",
            description: "Une enveloppe scellée à la cire blanche. L’encre scintille dans l’obscurité.",
        },
    ];
    p.chapters = [
        {
            id: "CH_A",
            title: "La lettre impossible",
            brief: "Installer la cité et le métier de Linette. Une lettre inattendue bouleverse sa tournée.",
            scenes: [
                {
                    id: "SC_A",
                    title: "La dernière tournée",
                    storyTime: 10,
                    text: "La cloche de minuit vibra entre les toits.\n\nLinette remonta le col de son manteau et compta les lettres une dernière fois. Onze enveloppes, onze rêves à traverser. La douzième n’était pas là une seconde plus tôt.\n\nSur la cire blanche brillait une hirondelle d’argent.\n\n— Une lettre du roi, murmura-t-elle.",
                    plan: "Montrer la routine de Linette, puis introduire l’enveloppe. Garder le décès du roi secret.",
                    version: "1",
                    status: "complete",
                    participants: ["LINETTE", "CITY", "LETTER"],
                    presentations: [{ scene: "SC_A", event: "EV_LETTER" }],
                },
            ],
        },
        {
            id: "CH_B",
            title: "Ce que la nuit cache",
            brief: "Le lecteur découvre ce que Linette ignore encore.",
            scenes: [
                {
                    id: "SC_B",
                    title: "Hier, au palais",
                    storyTime: 5,
                    text: "Bien avant que la lettre n’apparaisse, le palais avait éteint ses lumières.\n\nSur le bureau du roi, une plume continuait d’écrire. Personne ne la tenait.",
                    plan: "Flash-back : révéler la mort du roi au lecteur, sans changer la croyance de Linette.",
                    version: "1",
                    status: "draft",
                    participants: ["KING"],
                    presentations: [{ scene: "SC_B", event: "EV_DEATH" }],
                },
                {
                    id: "SC_C",
                    title: "Une adresse effacée",
                    storyTime: 20,
                    text: "",
                    plan: "Linette cherche le destinataire de la lettre. Elle doit traverser le quartier des Veilleurs avant l’aube.",
                    version: "1",
                    status: "draft",
                    participants: ["LINETTE", "LETTER"],
                    presentations: [],
                },
            ],
        },
    ];
    p.events = [
        {
            id: "EV_DEATH",
            title: "La mort du roi",
            storyTime: 5,
            status: "canon",
            changes: [{ subject: "KING", property: "vivant", value: false }],
            readerReveals: [{ subject: "KING", property: "vivant", value: false }],
            revealedIn: "SC_B",
            source: { chapter: "CH_B", scene: "SC_B", version: "1" },
        },
        {
            id: "EV_BELIEF",
            title: "Linette croit le roi vivant",
            storyTime: 1,
            status: "canon",
            beliefs: [
                { holder: "LINETTE", subject: "KING", property: "vivant", value: true },
            ],
        },
        {
            id: "EV_LETTER",
            title: "La lettre apparaît",
            storyTime: 10,
            status: "canon",
            changes: [
                {
                    subject: "LINETTE",
                    property: "inventaire",
                    mode: "add",
                    value: "Lettre de l’aube",
                },
            ],
            readerReveals: [
                { subject: "LETTER", property: "sceau", value: "Hirondelle d’argent" },
            ],
            revealedIn: "SC_A",
            source: { chapter: "CH_A", scene: "SC_A", version: "1" },
        },
    ];
    p.notes = [
        {
            id: "N_SECRET",
            title: "Le secret de la plume",
            scope: "author",
            text: "La plume du roi écrit encore parce qu’une promesse le lie à la cité. Ne pas révéler cette cause avant le dernier chapitre.",
        },
        {
            id: "N_TONE",
            title: "Une cité de songes",
            scope: "reader",
            text: "Les lettres traversent les rêves. La poste ouvre à minuit.",
        },
        {
            id: "N_BELIEF",
            title: "Le serment de Linette",
            scope: "character:LINETTE",
            text: "Je porterai chaque lettre jusqu’à son destinataire, même si le chemin disparaît.",
        },
    ];
    p.arcs = [
        {
            id: "ARC_LETTER",
            title: "Qui écrit les lettres ?",
            description: "Une lettre royale apparaît après la mort du roi. Suivre les indices laissés par la plume.",
            resolution: "La promesse du roi explique la lettre. Linette choisira de la délivrer.",
            status: "open",
        },
    ];
    const demoScenes = p.chapters.flatMap((c) => c.scenes);
    demoScenes.forEach((s, i) => {
        s.arcIds = ["ARC_LETTER"];
        s.location = "CITY";
        s.beat = i === 0 ? "setup" : i === 1 ? "turn" : "complication";
    });
    p.events
        .filter((ev) => ev.id === "EV_DEATH" || ev.id === "EV_LETTER")
        .forEach((ev) => {
        ev.milestone = true;
    });
    return p;
}
function obj(v, path) {
    if (!v || typeof v !== "object" || Array.isArray(v))
        throw Error(`${path} : objet attendu.`);
    return v;
}
function str(v, path, fallback) {
    if (v === undefined && fallback !== undefined)
        return fallback;
    if (typeof v !== "string")
        throw Error(`${path} : texte attendu.`);
    return v;
}
function num(v, path, fallback) {
    if (v === undefined && fallback !== undefined)
        return fallback;
    if (typeof v !== "number" || !Number.isFinite(v))
        throw Error(`${path} : nombre attendu.`);
    return v;
}
function list(v, path) {
    if (v === undefined)
        return [];
    if (!Array.isArray(v))
        throw Error(`${path} : liste attendue.`);
    return v;
}
function one(v, choices, fallback) {
    if (v === undefined)
        return fallback;
    if (!choices.includes(v))
        throw Error(`Valeur invalide : ${String(v)}`);
    return v;
}
function change(v) {
    const o = obj(v, "Changement");
    return {
        subject: str(o.subject, "Sujet"),
        property: str(o.property, "Propriété"),
        value: o.value ?? null,
        mode: one(o.mode, ["set", "end", "add", "remove"], "set"),
        ...(o.until !== undefined ? { until: num(o.until, "Fin") } : {}),
    };
}
export function parseProject(text) {
    if (text.length > 10_000_000)
        throw Error("Le fichier dépasse 10 Mo.");
    const o = obj(parseJson(text), "Projet");
    if (o.format !== "mns-web" || o.version !== 1)
        throw Error("Format non reconnu. Importez une sauvegarde MNS (.json), version 1.");
    for (const name of ["entities", "chapters", "events", "notes", "arcs"])
        if (!Array.isArray(o[name]))
            throw Error(`Liste requise : ${name}`);
    const p = {
        format: "mns-web",
        version: 1,
        id: str(o.id, "ID"),
        title: str(o.title, "Titre"),
        synopsis: str(o.synopsis, "Synopsis", ""),
        genre: str(o.genre, "Genre", ""),
        targetWords: Math.max(1, num(o.targetWords, "Objectif", 30000)),
        createdAt: str(o.createdAt, "Création"),
        updatedAt: str(o.updatedAt, "Mise à jour"),
        entities: list(o.entities, "Entités").map((v) => {
            const e = obj(v, "Entité");
            return {
                id: str(e.id, "ID"),
                name: str(e.name, "Nom"),
                kind: str(e.kind, "Type"),
                description: str(e.description, "Description", ""),
            };
        }),
        chapters: list(o.chapters, "Chapitres").map((v) => {
            const c = obj(v, "Chapitre");
            return {
                id: str(c.id, "ID"),
                title: str(c.title, "Titre", ""),
                brief: str(c.brief, "Brief", ""),
                scenes: list(c.scenes, "Scènes").map((v) => {
                    const s = obj(v, "Scène");
                    return {
                        id: str(s.id, "ID"),
                        title: str(s.title, "Titre", ""),
                        text: str(s.text, "Texte", ""),
                        plan: str(s.plan, "Plan", ""),
                        storyTime: num(s.storyTime, "Moment"),
                        version: str(s.version, "Version", "1"),
                        status: one(s.status, ["draft", "complete"], "draft"),
                        ...(s.location ? { location: str(s.location, "Lieu") } : {}),
                        arcIds: list(s.arcIds, "Intrigues").map((v) => str(v, "Intrigue")),
                        ...(s.beat
                            ? {
                                beat: one(s.beat, ["setup", "complication", "turn", "resolution"], "setup"),
                            }
                            : {}),
                        participants: list(s.participants, "Participants").map((v) => str(v, "Participant")),
                        presentations: list(s.presentations, "Présentations").map((v) => {
                            const pr = obj(v, "Présentation");
                            return {
                                scene: str(pr.scene, "Scène"),
                                event: str(pr.event, "Événement"),
                            };
                        }),
                        draftChanges: list(s.draftChanges, "Brouillon").map(change),
                    };
                }),
            };
        }),
        events: list(o.events, "Événements").map((v) => {
            const e = obj(v, "Événement");
            return {
                id: str(e.id, "ID"),
                title: str(e.title, "Titre"),
                storyTime: num(e.storyTime, "Moment"),
                status: one(e.status, ["canon", "draft", "plan"], "canon"),
                ...(e.milestone === true ? { milestone: true } : {}),
                arcIds: list(e.arcIds, "Intrigues").map((v) => str(v, "Intrigue")),
                changes: list(e.changes, "Faits").map(change),
                beliefs: list(e.beliefs, "Croyances").map((v) => {
                    const b = obj(v, "Croyance");
                    return { ...change(v), holder: str(b.holder, "Personnage") };
                }),
                readerReveals: list(e.readerReveals, "Révélations").map(change),
                ...(e.revealedIn
                    ? { revealedIn: str(e.revealedIn, "Révélation") }
                    : {}),
                ...(e.source
                    ? {
                        source: (() => {
                            const s = obj(e.source, "Source");
                            return {
                                chapter: str(s.chapter, "Chapitre"),
                                scene: str(s.scene, "Scène"),
                                version: str(s.version, "Version"),
                            };
                        })(),
                    }
                    : {}),
            };
        }),
        notes: list(o.notes, "Notes").map((v) => {
            const n = obj(v, "Note");
            const scope = str(n.scope, "Portée");
            if (scope !== "author" &&
                scope !== "reader" &&
                !/^character:[A-Za-z][A-Za-z0-9_-]*$/.test(scope))
                throw Error("Portée de note invalide.");
            return {
                id: str(n.id, "ID"),
                title: str(n.title, "Titre", ""),
                scope: scope,
                text: str(n.text, "Texte"),
                ...(n.revealedIn
                    ? { revealedIn: str(n.revealedIn, "Révélation") }
                    : {}),
            };
        }),
        arcs: list(o.arcs, "Arcs").map((v) => {
            const a = obj(v, "Arc");
            return {
                id: str(a.id, "ID"),
                title: str(a.title, "Titre"),
                description: str(a.description, "Description", ""),
                resolution: str(a.resolution, "Résolution", ""),
                status: one(a.status, ["open", "progress", "resolved"], "open"),
            };
        }),
    };
    if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(p.id))
        throw Error("Identifiant de projet invalide.");
    const errors = validateStory(p).filter((i) => i.level === "error");
    if (errors.length)
        throw Error(errors.map((e) => e.message).join("\n"));
    return p;
}
export function parseArchive(text) {
    if (text.length > 10_000_000)
        throw Error("Le fichier dépasse 10 Mo.");
    const value = obj(parseJson(text), "Sauvegarde");
    if (value.format === "mns-web")
        return [parseProject(text)];
    if (Array.isArray(value.projects))
        return value.projects.map((p) => parseProject(JSON.stringify(p)));
    throw Error("Sauvegarde MNS non reconnue.");
}
export function manuscript(p) {
    return `# ${p.title}\n\n${p.chapters.map((c, i) => `## ${i + 1}. ${c.title ?? c.id}\n\n${c.scenes.map((s) => `### ${s.title ?? s.id}\n\n${s.text ?? ""}`).join("\n\n---\n\n")}`).join("\n\n")}\n`;
}
export const STORAGE_KEY = "metamachia.library.v1";
export class LibraryStore {
    storage;
    previous;
    constructor(storage) {
        this.storage = storage;
        this.previous = storage.getItem(STORAGE_KEY);
    }
    load() {
        if (!this.previous)
            return { projects: [], activeId: null };
        const o = obj(JSON.parse(this.previous), "Bibliothèque");
        return {
            projects: list(o.projects, "Histoires").map((v) => parseProject(JSON.stringify(v))),
            activeId: typeof o.activeId === "string" ? o.activeId : null,
        };
    }
    save(library) {
        if (this.storage.getItem(STORAGE_KEY) !== this.previous)
            throw Error("La bibliothèque a changé dans un autre onglet. Exportez votre travail, puis rechargez la page.");
        const next = JSON.stringify(library);
        if (this.previous)
            this.storage.setItem(`${STORAGE_KEY}.backup`, this.previous);
        this.storage.setItem(STORAGE_KEY, next);
        this.previous = next;
    }
}
