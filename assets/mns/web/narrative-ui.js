import { allScenes, universeReadiness, sceneLocation, sceneEvents, sceneArcs, eventArcs, } from "../src/narrative.js?v=ea1cead32592";
import { wordCount } from "../src/project.js?v=ea1cead32592";
const e = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const button = (label, action, id = "", cls = "secondary small") => `<button type="button" class="btn ${cls}" data-action="${action}" data-id="${e(id)}">${e(label)}</button>`;
export const beats = {
    setup: "Mise en place",
    complication: "Complication",
    turn: "Bascule",
    resolution: "Résolution",
};
const stages = {
    canon: "Canon",
    draft: "Brouillon",
    plan: "Plan",
    open: "Ouvert",
    progress: "En cours",
    resolved: "Résolu",
};
const name = (p, id) => p.entities.find((x) => x.id === id)?.name ?? id;
const chip = (text, cls = "") => `<span class="tag ${cls}">${e(text)}</span>`;
export function guide(p, gate = false) {
    const ready = universeReadiness(p);
    const steps = [
        {
            done: ready.character,
            title: "Un personnage",
            text: "Qui porte votre histoire ?",
            action: "guided-character",
        },
        {
            done: ready.place,
            title: "Un lieu",
            text: "Où tout commence-t-il ?",
            action: "guided-place",
        },
        {
            done: p.arcs.length > 0,
            title: "Une intrigue",
            text: "Quelle question donne envie de lire ?",
            action: "new-arc",
        },
        {
            done: allScenes(p).some((s) => !!s.text?.trim()),
            title: "Une première scène",
            text: "Mettez votre monde en mouvement.",
            action: "open-writing",
        },
    ];
    return `<section class="story-guide ${gate ? "gate-guide" : ""}" aria-label="Votre parcours d’écriture"><div class="section-head"><div><p class="eyebrow">${ready.ready ? "LES FONDATIONS DE VOTRE HISTOIRE" : "COMMENCEZ PAR VOTRE UNIVERS"}</p><h2>${ready.ready ? "Du monde à la page." : "Un personnage. Un lieu. Un début."}</h2></div>${chip(ready.ready ? "Univers prêt" : "À compléter", ready.ready ? "canon" : "plan")}</div><p class="muted">${ready.ready ? "Reliez une intrigue à vos scènes, écrivez, puis déclarez ce qui change pour vérifier la continuité." : "Créez au moins un personnage et un lieu dans l’Univers avant de préparer le récit. Vos textes et sauvegardes existants sont conservés."}</p><div class="guide-steps">${steps.map((s, i) => `<article class="guide-step ${s.done ? "done" : ""}"><span class="step-number">${s.done ? "✓" : i + 1}</span><h3>${s.title}</h3><p>${s.text}</p>${button(s.done ? "Voir" : "Commencer", s.done ? (i < 2 ? "show-world" : i === 2 ? "show-plot" : "open-writing") : s.action)}</article>`).join("")}</div></section>`;
}
export function sceneLinks(p, s) {
    const arcs = sceneArcs(p, s), events = sceneEvents(p, s), place = sceneLocation(p, s);
    const people = (s.participants ?? []).filter((id) => p.entities.some((en) => en.id === id && en.kind === "character"));
    return `<section class="scene-connections"><div class="connection-node"><span class="eyebrow">01 · UNIVERS</span><strong>${e(place?.name ?? "Lieu à choisir")}</strong><div class="character-chips">${people.map((id) => `<span class="person-chip"><span class="avatar">${e(name(p, id).slice(0, 1))}</span>${e(name(p, id))}</span>`).join("") || '<span class="muted">Personnages à choisir</span>'}</div></div><span class="connection-arrow" aria-hidden="true">→</span><div class="connection-node"><span class="eyebrow">02 · INTRIGUE</span>${arcs.map((id) => button(p.arcs.find((a) => a.id === id)?.title ?? id, "edit-arc", id, "link-chip")).join("") || '<span class="muted">Aucune intrigue reliée</span>'}${s.beat ? chip(beats[s.beat]) : ""}</div><span class="connection-arrow" aria-hidden="true">→</span><div class="connection-node"><span class="eyebrow">03 · CONTINUITÉ</span><strong>${events.length} événement(s) associé(s)</strong>${button("Voir les conséquences", "scene-continuity", s.id, "quiet small")}</div><div class="connection-edit">${button("Relier cette scène", "edit-scene", s.id)}</div></section>`;
}
export function sceneBoard(p) {
    const all = allScenes(p);
    return `<div class="page-heading"><div><p class="eyebrow">LE CHEMIN DU RÉCIT</p><h1>Composez vos scènes.</h1><p>Une carte, un moment, une intention. Ouvrez une scène pour écrire.</p></div>${button("+ Ajouter un chapitre", "new-chapter", "", "primary")}</div><div class="narrative-legend">${chip(`${all.length} scènes`)}${chip(`${p.arcs.length} intrigues`)}${chip(`${p.events.length} événements`)}<span>Ordre de lecture → · Les moments indiquent l’ordre réel des faits.</span></div><div class="scene-board">${p.chapters
        .map((c, i) => `<section class="chapter-lane"><header><div><span class="eyebrow">CHAPITRE ${String(i + 1).padStart(2, "0")}</span><h2>${e(c.title)}</h2></div>${button("Modifier", "edit-chapter", c.id, "quiet small")}</header>${c.brief ? `<p class="muted small">${e(c.brief)}</p>` : ""}<div class="scene-stack">${c.scenes
        .map((s) => {
        const index = all.indexOf(s), previous = all[index - 1], flashback = previous && s.storyTime < previous.storyTime;
        const arcs = sceneArcs(p, s), events = sceneEvents(p, s), place = sceneLocation(p, s);
        return `<article class="scene-card"><div class="section-head"><span class="eyebrow">SCÈNE ${index + 1}</span>${chip(flashback ? `↶ Retour · ${s.storyTime}` : `Moment ${s.storyTime}`, flashback ? "plan" : "")}</div><button class="scene-card-title" data-action="select-scene" data-id="${e(s.id)}">${e(s.title || "Sans titre")}</button><p class="scene-card-plan">${e(s.plan || "Quelle est l’intention de cette scène ?")}</p><div class="scene-card-world"><span>⌖ ${e(place?.name ?? "Choisir un lieu")}</span><span>${e((s.participants ?? [])
            .filter((id) => p.entities.some((en) => en.id === id && en.kind === "character"))
            .map((id) => name(p, id))
            .join(" · ") || "Choisir les personnages")}</span></div><div class="scene-card-arcs">${arcs.map((id) => chip(p.arcs.find((a) => a.id === id)?.title ?? id, "plot-tag")).join("") || chip("Intrigue à relier", "unlinked")}${s.beat ? chip(beats[s.beat]) : ""}</div><div class="card-progress"><span>${s.status === "complete" ? "● Terminée" : "○ En écriture"}</span><span>${wordCount(s.text ?? "")} mots · ${events.length} événement(s)</span></div><div class="scene-card-actions">${button("Écrire →", "select-scene", s.id, "primary small")}${button("Relier", "edit-scene", s.id)}${button("Supprimer", "delete-scene", s.id, "quiet small danger")}</div></article>`;
    })
        .join("") ||
        '<p class="empty-inline">Le prochain moment de votre histoire.</p>'}</div>${button("+ Ajouter une scène", "new-scene", c.id, "add-scene-button")}</section>`)
        .join("") ||
        "<p>Ajoutez votre premier chapitre pour organiser le récit.</p>"}</div><aside class="tip"><p><strong>Une scène fait avancer une question.</strong> Reliez-la à une intrigue, indiquez son rôle, puis déclarez les changements importants. Un retour en arrière change son moment, pas sa place dans le livre.</p></aside>`;
}
export function plotMap(p) {
    return `<section class="plot-map"><div class="section-head"><div><p class="eyebrow">VOS FILS NARRATIFS</p><h2>De la promesse aux conséquences.</h2></div>${button("Voir le tableau des scènes", "writing-board")}</div><p class="muted small">Reliez des scènes à chaque intrigue. Les événements de ces scènes apparaissent automatiquement dans ce fil ; leur statut reste indépendant.</p>${p.arcs
        .map((a, i) => {
        const scenes = allScenes(p).filter((s) => sceneArcs(p, s).includes(a.id));
        const events = p.events.filter((ev) => eventArcs(p, ev).includes(a.id));
        return `<article class="plot-thread"><div class="plot-thread-head"><span class="thread-number">${String(i + 1).padStart(2, "0")}</span><div><h3>${e(a.title)}</h3><p>${e(a.description || "Quelle promesse faites-vous au lecteur ?")}</p></div>${chip(stages[a.status], a.status)}${button("Relier / modifier", "edit-arc", a.id)}</div><div class="plot-track">${scenes.map((s) => `<div class="plot-stop"><span class="plot-stop-dot"></span><span class="eyebrow">${s.beat ? beats[s.beat] : "ÉTAPE À DÉFINIR"}</span>${button(s.title ?? s.id, "select-scene", s.id, "plot-scene-button")}<small>${sceneEvents(p, s).length} événement(s) · moment ${s.storyTime}</small></div>`).join("") || '<p class="empty-inline">Aucune scène reliée. Cliquez sur « Relier / modifier » pour choisir les étapes de ce fil.</p>'}</div>${events.length ? `<div class="plot-event-links"><span class="eyebrow">ÉVÉNEMENTS DU FIL</span>${events.map((ev) => button(ev.title, "edit-event", ev.id, "link-chip")).join("")}</div>` : ""}${a.resolution ? `<details class="plot-resolution"><summary>Résolution envisagée · auteur uniquement</summary><p>${e(a.resolution)}</p></details>` : ""}</article>`;
    })
        .join("") ||
        '<p class="empty-inline">Créez une intrigue, puis reliez les scènes qui la font progresser.</p>'}</section>`;
}
export function changeText(p, ch) {
    const value = ch.value === true
        ? "oui"
        : ch.value === false
            ? "non"
            : typeof ch.value === "string"
                ? ch.value
                : JSON.stringify(ch.value);
    const op = ch.mode === "end"
        ? "n’est plus documenté"
        : ch.mode === "add"
            ? `+ ${value}`
            : ch.mode === "remove"
                ? `− ${value}`
                : `→ ${value}`;
    return `${name(p, ch.subject)} · ${ch.property} ${op}${ch.until !== undefined ? ` (jusqu’au moment ${ch.until}, exclu)` : ""}`;
}
export function narrativeTimeline(p, selectedChapter, order, zoom, filter = "all") {
    const range = (c) => c.scenes.length
        ? [
            Math.min(...c.scenes.map((s) => s.storyTime)),
            Math.max(...c.scenes.map((s) => s.storyTime)),
        ]
        : [0, 0];
    const chapters = [...p.chapters];
    if (order === "story")
        chapters.sort((a, b) => range(a)[0] - range(b)[0]);
    const events = p.events.filter((ev) => ev.milestone && (filter === "all" || (ev.status ?? "canon") === filter));
    const cell = (content, cls = "") => `<div class="time-cell ${cls}">${content}</div>`;
    const width = Math.round(290 * zoom);
    const independent = events.filter((ev) => !ev.source);
    return `<section class="timeline-studio" aria-label="Frise des chapitres et intrigues"><div class="timeline-controls"><div><p class="eyebrow">LA TABLE DU TEMPS · VUE MACRO</p><h2>Le récit dans son ensemble.</h2></div><div class="segmented" aria-label="Ordre de la frise">${button("Temps de l’histoire", "timeline-order", "story", order === "story" ? "active" : "")}${button("Ordre de lecture", "timeline-order", "reading", order === "reading" ? "active" : "")}</div><label class="timeline-zoom">Zoom <input id="timeline-zoom" type="range" min="0.7" max="1.7" step="0.1" value="${zoom}" aria-label="Zoom de la frise"></label></div><p class="timeline-help">Chapitres, fils narratifs et événements marquants. ${order === "story" ? "Les chapitres sont classés par leur premier moment ; leurs périodes peuvent se chevaucher." : "Les chapitres suivent l’ordre du livre, même lorsqu’ils contiennent un flash-back."} Les distances ne représentent pas les durées.</p><div class="timeline-navigation">${button("← Parcourir", "pan-timeline", "-1")}${button("Parcourir →", "pan-timeline", "1")}<span>Ouvrez un chapitre pour descendre au niveau des scènes.</span></div><div class="timeline-scroll" tabindex="0" aria-label="Frise défilante"><div class="timeline-grid" style="grid-template-columns:170px repeat(${Math.max(1, chapters.length)},${width}px)"><div class="time-label time-header">CHAPITRES</div>${chapters
        .map((c) => {
        const [from, to] = range(c), index = p.chapters.indexOf(c);
        return cell(`<button class="time-chapter ${selectedChapter === c.id ? "selected" : ""}" data-action="inspect-chapter" data-id="${e(c.id)}" aria-pressed="${selectedChapter === c.id}"><small>CHAPITRE ${String(index + 1).padStart(2, "0")}</small><strong>${e(c.title)}</strong><span>${c.scenes.length ? `Moments ${from} → ${to}` : "Période à définir"}</span><span>${c.scenes.length} scènes · ${c.scenes.filter((s) => s.status === "complete").length} terminées</span></button>`, "chapter-time-cell");
    })
        .join("")}${p.arcs
        .map((a, i) => `<div class="time-label arc-label"><small>INTRIGUE ${i + 1}</small><strong>${e(a.title)}</strong></div>${chapters
        .map((c) => {
        const linked = c.scenes.filter((s) => sceneArcs(p, s).includes(a.id));
        const roles = [
            ...new Set(linked.flatMap((s) => (s.beat ? [beats[s.beat]] : []))),
        ];
        return cell(linked.length
            ? `<button class="arc-time-beat" data-action="inspect-chapter" data-id="${e(c.id)}"><span>◆</span> ${e(roles.join(" · ") || "Fil en développement")}<small>${linked.length} scène(s) liée(s)</small></button>`
            : '<span class="arc-gap" aria-label="Aucun lien déclaré"></span>', "arc-time-cell");
    })
        .join("")}`)
        .join("")}<div class="time-label event-label"><small>CONTINUITÉ</small><strong>Jalons marquants</strong></div>${chapters
        .map((c) => cell(events
        .filter((ev) => ev.source?.chapter === c.id)
        .map((ev) => `<button class="time-event ${ev.status ?? "canon"}" data-action="edit-event" data-id="${e(ev.id)}"><small>${stages[ev.status ?? "canon"]} · moment ${ev.storyTime}</small><strong>${e(ev.title)}</strong></button>`)
        .join("")))
        .join("")}</div></div>${!chapters.length ? '<p class="empty-inline">Ajoutez votre premier chapitre pour commencer la frise.</p>' : ""}${independent.length ? `<div class="independent-milestones"><span class="eyebrow">JALONS HORS CHAPITRE</span>${independent.map((ev) => button(ev.title, "edit-event", ev.id, "link-chip")).join("")}</div>` : ""}<p class="timeline-help">Seuls les événements cochés « Jalon marquant » apparaissent ici. Tous les faits restent disponibles dans le détail ci-dessous.</p></section>`;
}
export function eventCard(p, ev) {
    const source = allScenes(p).find((s) => s.id === ev.source?.scene);
    const reveal = allScenes(p).find((s) => s.id === ev.revealedIn);
    const presentations = allScenes(p).filter((s) => s.presentations?.some((pr) => pr.event === ev.id));
    const layer = (title, changes, cls) => changes.length
        ? `<div class="effect-layer ${cls}"><span class="eyebrow">${title}</span>${changes.map((ch) => `<p>${e(changeText(p, ch))}</p>`).join("")}</div>`
        : "";
    return `<article class="event-card"><div class="event-card-top"><div><span class="eyebrow">MOMENT ${ev.storyTime}</span><h3>${e(ev.title)}</h3></div>${chip(stages[ev.status ?? "canon"], ev.status ?? "canon")}${button("Modifier", "edit-event", ev.id)}</div><div class="effect-grid">${layer("RÉALITÉ DU MONDE", ev.changes ?? [], "world-effect")}${(ev.beliefs ?? []).map((ch) => layer(`CE QUE CROIT ${e(name(p, ch.holder))}`, [ch], "belief-effect")).join("")}${layer("CE QU’APPREND LE LECTEUR", ev.readerReveals ?? [], "reader-effect")}</div><div class="event-links"><div><small>TEXTE SOURCE</small>${source ? button(source.title ?? source.id, "select-scene", source.id, "link-chip") : '<span class="muted small">Déclaration indépendante</span>'}</div>${ev.readerReveals?.length || reveal ? `<div><small>RÉVÉLATION AU LECTEUR</small>${reveal ? button(reveal.title ?? reveal.id, "select-scene", reveal.id, "link-chip") : '<span class="muted small">Première présentation, sinon non révélé</span>'}</div>` : ""}<div><small>INTRIGUES</small>${eventArcs(p, ev)
        .map((id) => button(p.arcs.find((a) => a.id === id)?.title ?? id, "edit-arc", id, "link-chip"))
        .join("") || '<span class="muted small">Aucun fil relié</span>'}</div></div>${presentations.length ? `<div class="replayed-event"><span>↶ Présenté dans ${presentations.length} scène(s) · effets appliqués une seule fois</span>${presentations.map((s) => button(s.title ?? s.id, "select-scene", s.id, "quiet small")).join("")}</div>` : ""}</article>`;
}
