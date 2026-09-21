import {
  Timeline,
  Block,
  Loop,
  Effect,
  Character,
  KEY,
  MAX_DEPTH,
  LABELS,
  HINTS,
  IDEAS,
  RELATIONS,
  id,
  emptyTimeline,
  demoTimeline,
  entries,
  insertLoop,
  deleteLoop,
  deleteCharacter,
  deleteGroup,
  stateAt,
  outline,
  panels,
  markdown,
  warnings,
  parseTimeline,
} from "../src/timeline.js";

const app = document.querySelector<HTMLDivElement>("#app")!;
const modal = document.querySelector<HTMLDialogElement>("#modal")!;
const toast = document.querySelector<HTMLDivElement>("#toast")!;
const e = (v: unknown) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const button = (action: string, text: string, data = "", cls = "") =>
  `<button type="button" class="${cls}" data-action="${action}" ${data}>${text}</button>`;
let project = emptyTimeline(),
  previous = "",
  blocked = false,
  storageAvailable = true,
  startup = "";
try {
  previous = localStorage.getItem(KEY) || "";
  if (previous) project = parseTimeline(previous);
} catch {
  blocked = true;
  startup =
    "Sauvegarde illisible ou stockage indisponible : aucune donnée ne sera écrasée. Exportez votre travail pour le conserver.";
}
let selected = entries(project)[0]?.block.id || "",
  position = 0,
  playing = false,
  speed = 4,
  direction = 1,
  lastTime = 0,
  frame = 0,
  lastCount = -1;
let history: string[] = [],
  future: string[] = [],
  legacy = "",
  zoom = 1;
let textEditStarted = false;
try {
  legacy = localStorage.getItem("metamachia.library.v1") || "";
} catch {
  storageAvailable = false;
}
const name = (person: string) =>
  project.characters.find((c) => c.id === person)?.name ||
  "Personnage supprimé";
const selectedBlock = () =>
  entries(project).find((x) => x.block.id === selected)?.block;
const announce = (text: string) => {
  toast.textContent = text;
  toast.classList.add("visible");
  setTimeout(() => toast.classList.remove("visible"), 6000);
};
function persist() {
  if (blocked || !storageAvailable) return false;
  try {
    if ((localStorage.getItem(KEY) || "") !== previous) {
      blocked = true;
      announce(
        "Une autre fenêtre a modifié la frise. Exportez vos modifications puis rechargez.",
      );
      return false;
    }
    const next = JSON.stringify(project);
    if (previous) localStorage.setItem(`${KEY}.backup`, previous);
    localStorage.setItem(KEY, next);
    previous = next;
    return true;
  } catch {
    storageAvailable = false;
    announce(
      "Stockage plein ou indisponible. Exportez la frise : vos modifications restent en mémoire.",
    );
    return false;
  }
}
function stop() {
  playing = false;
  cancelAnimationFrame(frame);
  const play = document.querySelector('[data-action="play"]');
  if (play) play.textContent = "▶ Lire";
}
function change(fn: () => void) {
  stop();
  const before = JSON.stringify(project);
  try {
    fn();
    parseTimeline(JSON.stringify(project));
    if (JSON.stringify(project) !== before) {
      history.push(before);
      if (history.length > 40) history.shift();
      future = [];
      persist();
    }
  } catch (error) {
    project = parseTimeline(before);
    announce((error as Error).message);
  }
  const all = entries(project);
  if (!all.some((x) => x.block.id === selected))
    selected = all[0]?.block.id || "";
  position = Math.min(position, all.length);
  render();
}
function saveStatus() {
  return blocked || !storageAvailable
    ? "⚠ Non enregistré · exportez votre frise"
    : "● Enregistré sur cet appareil";
}
function render() {
  const scroll = document.querySelector(".canvas-scroll")?.scrollTop || 0;
  const side = document.querySelector(".inspector")?.scrollTop || 0;
  const all = entries(project);
  app.innerHTML = `<header class="topbar"><a class="brand" href="#" aria-label="Metamachia">m<span>·</span></a><div class="project-heading"><span class="eyebrow">METAMACHIA / ATELIER DE RÉCIT</span><h1>${e(project.title)}</h1></div><span class="save-state">${saveStatus()}</span><div class="top-actions">${button("undo", "↶", 'aria-label="Annuler la dernière modification" ' + (!history.length ? "disabled" : ""))}${button("redo", "↷", 'aria-label="Rétablir" ' + (!future.length ? "disabled" : ""))}${button("settings", "Réglages")}${button("pages", "▦ Pages & cases")}${button("export", "Sauvegarder", "", "primary")}</div></header>
  <main class="workspace"><aside class="left-panel"><section class="people-panel"><div class="section-heading"><h2>Les personnages</h2>${button("person", "+ Ajouter", "", "small")}</div><p class="muted">Glissez-les dans un bloc, ou ajoutez-les depuis son panneau.</p><div class="people-list">${project.characters.map((c) => `<div class="person-card" draggable="true" data-person="${c.id}"><span class="avatar" style="--person:${c.color}">${e(c.name.slice(0, 1))}</span><div><strong>${e(c.name)}</strong><small>${e(c.goal || "Un désir à préciser")}</small></div>${button("person", "✎", `data-id="${c.id}" aria-label="Modifier ${e(c.name)}"`, "icon")}</div>`).join("") || `<div class="empty-state">Tout commence avec quelqu’un.<br>Ajoutez votre premier personnage.</div>`}</div></section><section class="world-panel"><div class="section-heading"><h2>Les liens, à cet instant</h2><span class="live-dot"></span></div><div id="world-state"></div><div class="baseline-actions">${button("baseline", "✧ Définir l’état zéro")}${button("group", "+ Groupe / faction")}</div><p class="muted tiny">L’état zéro précède tous les blocs. Les changements prennent effet au début du bloc, avant ses sous-boucles.</p></section></aside>
  <section class="timeline-panel"><div class="transport"><div class="transport-main">${button("start", "↟", 'aria-label="Revenir à l’état zéro"')}${button("play", "▶ Lire", "", "primary")}${button("step", "↓", 'aria-label="Avancer d’un bloc"')}<label class="sr-only" for="scrub">Position de lecture</label><input id="scrub" type="range" min="0" max="${all.length}" step="0.01" value="${position}"><span id="readout"></span></div><div class="transport-options"><label>Vitesse <select id="speed"><option value="8" ${speed === 8 ? "selected" : ""}>Lente</option><option value="4" ${speed === 4 ? "selected" : ""}>Normale</option><option value="1.5" ${speed === 1.5 ? "selected" : ""}>Rapide</option></select></label><label>Sens <select id="direction"><option value="1" ${direction === 1 ? "selected" : ""}>↓ Vers la fin</option><option value="-1" ${direction === -1 ? "selected" : ""}>↑ Vers le début</option></select></label><label>Échelle <select id="zoom"><option value="1" ${zoom === 1 ? "selected" : ""}>Confort</option><option value="0.8" ${zoom === 0.8 ? "selected" : ""}>Compacte</option></select></label></div></div>
  <div class="canvas-scroll"><div class="canvas" style="--density:${zoom}"><div class="canvas-intro"><span class="eyebrow">UNE HISTOIRE, PLUSIEURS PROFONDEURS</span><h2>Dépliez le fil.</h2><p>Quatre temps pour avancer. Des boucles pour approfondir.</p><div class="legend">${Object.entries(
    LABELS,
  )
    .map(
      ([key, value]) =>
        `<span class="legend-item phase-${key}"><i></i>${value}</span>`,
    )
    .join(
      "",
    )}</div></div><div class="timeline-surface"><div class="origin" id="origin">${button("start", "◉ État zéro")}<span>Avant que tout commence</span></div><div id="reading-cursor" aria-hidden="true"><span>LECTURE</span></div>${project.loops.map((l) => loopHtml(l, 1)).join("")}<div class="add-root">${button("root", "+ Ajouter une boucle narrative", "", "outline")}</div><div id="timeline-end">La suite vous appartient.</div></div></div></div><footer class="canvas-footer"><span>${all.length} blocs · ${panels(project).length} cases possibles · 7 niveaux maximum</span>${button("guide", "✧ Repères de cohérence", "", "text-button")}</footer></section><aside class="inspector">${inspectorHtml()}</aside></main>`;
  const scroller = document.querySelector(".canvas-scroll")!;
  scroller.scrollTop = scroll;
  document.querySelector(".inspector")!.scrollTop = side;
  lastCount = -1;
  updateReader();
  (document.querySelector(".canvas") as HTMLElement).style.minWidth =
    `${Math.max(460, 360 + Math.max(1, ...all.map((x) => x.depth)) * 70)}px`;
  document.querySelectorAll<HTMLElement>("[data-select]").forEach((card) => {
    const b = all.find((x) => x.block.id === card.dataset.select)?.block;
    if (b?.generated) {
      const tag = document.createElement("span");
      tag.textContent = "Amorce à personnaliser";
      card.querySelector(".block-meta")?.append(tag);
    }
  });
  updateReader();
}
function loopHtml(loop: Loop, depth: number): string {
  return `<section class="loop" data-loop="${loop.id}" style="--depth:${depth}"><header class="loop-heading"><span class="level">${String(depth).padStart(2, "0")}</span>${button("loop-title", e(loop.title), `data-id="${loop.id}"`, "loop-title")}<span class="depth-label">NIVEAU ${depth}</span>${button("delete-loop", "×", `data-id="${loop.id}" aria-label="Supprimer la boucle ${e(loop.title)}"`, "icon danger")}</header>${loop.blocks.map((b) => `<section class="block phase-${b.phase} ${selected === b.id ? "selected" : ""}" data-block="${b.id}"><div class="block-card" data-select="${b.id}" tabindex="0" role="button" aria-label="Éditer ${e(b.title)}" aria-pressed="${selected === b.id}"><div class="block-top"><span class="phase-badge">${b.phase}</span><span class="phase-name">${LABELS[b.phase]}</span><span class="block-index">${entries(project).findIndex((x) => x.block.id === b.id) + 1}</span></div><h3>${e(b.title === LABELS[b.phase] ? b.situation : b.title)}</h3><p class="block-excerpt ${b.text ? "" : "suggested"}">${e((b.text || outline(project, b)).slice(0, 185))}${(b.text || outline(project, b)).length > 185 ? "…" : ""}</p><div class="cast-chips">${b.cast.map((p) => `<span class="chip">${e(name(p))}</span>`).join("") || `<span class="drop-hint">＋ Déposez un personnage ici</span>`}</div><div class="block-meta"><span>${b.place ? "⌖ " + e(b.place) : "Lieu à préciser"}</span><span>${b.effects.length ? `${b.effects.length} changement(s)` : "Aucun changement déclaré"}</span>${!b.text ? "<span>Amorce à écrire</span>" : ""}</div></div>${b.loops.length ? `<div class="nested">${b.loops.map((l) => loopHtml(l, depth + 1)).join("")}</div>` : ""}<div class="block-tail">${depth < MAX_DEPTH ? button("nest", "+ Déplier une boucle ici", `data-id="${b.id}"`, "text-button") : `<span class="muted tiny">Profondeur maximale atteinte</span>`}</div></section>`).join("")}</section>`;
}
function effectText(effect: Effect): string {
  if (effect.type === "relation")
    return `${effect.remove ? "Fin du lien" : "Nouveau lien"} : ${name(effect.from)} → ${effect.kind} → ${name(effect.to)}`;
  if (effect.type === "presence")
    return `${name(effect.person)} : ${effect.present ? "entre dans le récit / naît" : "quitte le récit"}`;
  return `${name(effect.person)} ${effect.join ? "rejoint" : "quitte"} ${project.groups.find((g) => g.id === effect.group)?.name || "le groupe"}`;
}
function inspectorHtml(): string {
  const b = selectedBlock();
  if (!b)
    return `<div class="inspector-empty"><span class="eyebrow">L’ATELIER</span><h2>Une première boucle ?</h2><p>Créez un mouvement en quatre temps, puis dépliez-le à votre rythme.</p>${button("root", "+ Ajouter une boucle", "", "primary")}</div>`;
  const entry = entries(project).find((x) => x.block.id === b.id)!;
  return `<div class="inspector-title phase-${b.phase}"><span class="eyebrow">${e(entry.path)} / NIVEAU ${entry.depth}</span><h2>${LABELS[b.phase]}</h2><p>${HINTS[b.phase]}</p></div><div class="inspector-body"><label>Titre du bloc<input data-field="title" maxlength="200" value="${e(b.title)}"></label><label>Lieu<input data-field="place" maxlength="200" value="${e(b.place)}" placeholder="Où cela se passe-t-il ?"></label><section><h3>Qui est là ?</h3><div class="cast-picker">${project.characters.map((c) => `<label class="cast-option"><input type="checkbox" data-cast="${c.id}" ${b.cast.includes(c.id) ? "checked" : ""}>${e(c.name)}</label>`).join("") || button("person", "+ Créer un personnage")}</div></section><section><div class="section-heading"><h3>Une direction</h3><span class="tiny muted">Dictionnaire local</span></div><div class="idea-grid">${IDEAS[b.phase].map((v, i) => button("idea", e(v.title), `data-index="${i}" aria-pressed="${v.title === b.situation}"`, v.title === b.situation ? "idea active" : "idea")).join("")}</div><p class="suggestion">${e(outline(project, b))}</p>${button("use-idea", "↓ Utiliser cette amorce", "", "small")}</section><label>Votre scène / intention<textarea data-field="text" maxlength="20000" rows="7" placeholder="Écrivez librement. Le texte ne crée pas automatiquement de relations.">${e(b.text)}</textarea></label><section><div class="section-heading"><h3>Ce qui change</h3>${button("effect", "+ Ajouter", "", "small")}</div><p class="muted tiny">Ces faits font évoluer les liens pendant la lecture. Les amorces, elles, ne changent rien automatiquement.</p><div class="effects">${b.effects.map((f) => `<div class="effect"><span>${e(effectText(f))}</span>${button("remove-effect", "×", `data-id="${f.id}" aria-label="Retirer ce changement"`, "icon")}</div>`).join("") || `<p class="muted">Pas encore de changement.</p>`}</div>${b.cast.length >= 2 ? button("suggest-link", "✧ Proposer un lien entre ces personnages", "", "small") : ""}</section><section class="deepen"><h3>Un récit dans le récit</h3><p class="muted">Décomposez ce temps en quatre nouveaux blocs. Son texte devient une intention d’ensemble ; les feuilles deviennent les cases.</p>${entry.depth < MAX_DEPTH ? button("nest", "+ Imbriquer une boucle", `data-id="${b.id}"`) : "Septième niveau atteint."}</section>${button("at-block", "◎ Lire jusqu’à ce bloc", `data-id="${b.id}"`, "full")}</div>`;
}
function updateReader(follow = false) {
  const all = entries(project),
    count = Math.min(all.length, Math.floor(position));
  const slider = document.querySelector<HTMLInputElement>("#scrub");
  if (slider) slider.value = String(position);
  const readout = document.querySelector("#readout");
  if (readout) readout.textContent = `${count} / ${all.length}`;
  if (count !== lastCount) {
    lastCount = count;
    const state = stateAt(project, count);
    const world = document.querySelector("#world-state")!;
    world.innerHTML = `<p class="moment-label">${count ? `${e(all[count - 1].block.title)} · après l’entrée du bloc ${count}` : "ÉTAT ZÉRO · AVANT LE RÉCIT"}</p><div class="presence">${project.characters.map((c) => `<span class="chip ${state.present.has(c.id) ? "" : "absent"}" title="${state.present.has(c.id) ? "Dans le récit" : "Pas encore / plus dans le récit"}">${e(c.name)}${state.present.has(c.id) ? "" : " · absent"}</span>`).join("")}</div><div class="relations">${state.links.map((l) => `<div class="relationship"><span>${e(name(l.from))}</span><span class="relation-line">${e(l.kind)} →</span><span>${e(name(l.to))}</span></div>`).join("") || `<p class="muted">Aucun lien établi à cet instant.</p>`}</div>${state.groups.map((g) => `<div class="group-card"><div><span class="eyebrow">${g.kind}</span>${button("group", e(g.name), `data-id="${g.id}"`, "text-button")}</div><p>${g.members.map((p) => e(name(p))).join(" · ") || "Aucun membre"}</p></div>`).join("")}`;
    document
      .querySelectorAll(".block-card.reading")
      .forEach((el) => el.classList.remove("reading"));
    if (count)
      document
        .querySelector(`[data-select="${all[count - 1].block.id}"]`)
        ?.classList.add("reading");
  }
  const surface = document.querySelector<HTMLElement>(".timeline-surface"),
    cursor = document.querySelector<HTMLElement>("#reading-cursor");
  if (!surface || !cursor) return;
  const marks = [
    document.querySelector<HTMLElement>("#origin")!,
    ...all.map((x) =>
      document.querySelector<HTMLElement>(`[data-select="${x.block.id}"]`)!,
    ),
  ];
  const y = (el: HTMLElement) =>
    el.getBoundingClientRect().top - surface.getBoundingClientRect().top;
  const start = y(marks[count]),
    end = count < all.length ? y(marks[count + 1]) : start;
  cursor.style.top = `${start + (end - start) * (position - count)}px`;
  if (follow) {
    const container = document.querySelector<HTMLElement>(".canvas-scroll")!,
      bounds = cursor.getBoundingClientRect(),
      area = container.getBoundingClientRect();
    if (bounds.top > area.bottom - 100 || bounds.top < area.top + 30)
      container.scrollTop += bounds.top - area.top - area.height * 0.4;
  }
}
function play() {
  if (playing) {
    stop();
    return;
  }
  const total = entries(project).length;
  if (!total) return;
  if (direction > 0 && position >= total) position = 0;
  if (direction < 0 && position <= 0) position = total;
  playing = true;
  document.querySelector('[data-action="play"]')!.textContent = "Ⅱ Pause";
  lastTime = performance.now();
  const tick = (now: number) => {
    if (!playing) return;
    position = Math.max(
      0,
      Math.min(
        total,
        position + (direction * Math.min(now - lastTime, 100)) / (speed * 1000),
      ),
    );
    lastTime = now;
    updateReader(true);
    if (position === 0 || position === total) stop();
    else frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
}
function show(title: string, content: string, wide = false) {
  stop();
  modal.className = wide ? "wide" : "";
  modal.innerHTML = `<div class="modal-heading"><h2 id="dialog-title">${e(title)}</h2>${button("close", "×", 'aria-label="Fermer"', "icon")}</div>${content}`;
  if (!modal.open) modal.showModal();
}
const field = (
  label: string,
  key: string,
  value = "",
  required = false,
  max = 100,
) =>
  `<label>${label}<input name="${key}" value="${e(value)}" maxlength="${max}" ${required ? "required" : ""}></label>`;
const formEnd = (text = "Enregistrer") =>
  `<div class="form-actions">${button("close", "Annuler")}<button class="primary" type="submit">${text}</button></div></form>`;
const options = (items: { id: string; name: string }[], value = "") =>
  items
    .map(
      (i) =>
        `<option value="${i.id}" ${i.id === value ? "selected" : ""}>${e(i.name)}</option>`,
    )
    .join("");
function personForm(personId?: string) {
  const c = project.characters.find((c) => c.id === personId);
  show(
    c ? "Modifier le personnage" : "Un nouveau personnage",
    `<form data-form="person" data-id="${c?.id || ""}">${field("Nom", "name", c?.name, true)}${field("Que veut ce personnage ?", "goal", c?.goal, false, 20000)}<label>Couleur<input type="color" name="color" value="${c?.color || "#578780"}"></label><label class="check"><input type="checkbox" name="present" ${!c || c.present ? "checked" : ""}>Existe déjà à l’état zéro</label><p class="muted">Pour une naissance future, décochez puis ajoutez « Entrée dans le récit » au bloc concerné.</p>${c ? button("delete-person", "Supprimer le personnage", `data-id="${c.id}"`, "danger") : ""}${formEnd()}`,
  );
}
function groupForm(groupId?: string) {
  const g = project.groups.find((g) => g.id === groupId);
  show(
    g ? "Modifier le groupe à l’état zéro" : "Un groupe ou une faction",
    `<form data-form="group" data-id="${g?.id || ""}">${field("Nom", "name", g?.name, true)}<label>Nature<select name="kind"><option value="groupe">Groupe</option><option value="faction" ${g?.kind === "faction" ? "selected" : ""}>Faction</option></select></label><fieldset><legend>Membres à l’état zéro</legend>${project.characters.map((c) => `<label class="check"><input type="checkbox" name="members" value="${c.id}" ${g?.members.includes(c.id) ? "checked" : ""}>${e(c.name)}</label>`).join("")}</fieldset>${g ? button("delete-group", "Supprimer le groupe", `data-id="${g.id}"`, "danger") : ""}${formEnd()}`,
  );
}
function relationFields(from = "", to = "") {
  return `<div class="form-row"><label>De<select name="from" required>${options(project.characters, from)}</select></label><label>Vers<select name="to" required>${options(project.characters, to || project.characters[1]?.id)}</select></label></div><label>Lien · dictionnaire<select name="kind">${RELATIONS.map((g) => `<optgroup label="${e(g.category)}">${g.values.map((v) => `<option>${e(v)}</option>`).join("")}</optgroup>`).join("")}</select></label>${field("Ou votre propre lien", "custom", "", false)}<p class="muted tiny">Plusieurs liens peuvent coexister. Pour remplacer une amitié par une rivalité, retirez le premier lien puis ajoutez le second. « Parent de » va du parent vers l’enfant.</p>`;
}
function effectForm(type = "relation", suggested = false) {
  const b = selectedBlock();
  if (!b) return;
  if (!project.characters.length) {
    announce("Ajoutez d’abord un personnage.");
    return;
  }
  show(
    suggested ? "Une rencontre, quel lien ?" : "Un changement dans ce bloc",
    `<div class="modal-tabs">${button("effect-type", "Relation", 'data-type="relation"')}${button("effect-type", "Entrée / sortie", 'data-type="presence"')}${button("effect-type", "Groupe / faction", 'data-type="membership"')}</div><form data-form="effect" data-type="${type}">${suggested ? `<p class="callout">Proposition neutre : une connaissance. Vous choisissez le lien ; rien n’est déduit du genre des personnages.</p>` : ""}${type === "relation" ? `${relationFields(b.cast[0], b.cast[1])}<label>Action<select name="operation"><option value="add">Établir ce lien</option><option value="remove">Mettre fin à ce lien</option></select></label>` : type === "presence" ? `<label>Personnage<select name="person">${options(project.characters)}</select></label><label>Action<select name="operation"><option value="add">Entrée dans le récit / naissance</option><option value="remove">Sortie du récit</option></select></label>` : `<label>Personnage<select name="person">${options(project.characters)}</select></label><label>Groupe<select name="group" required>${options(project.groups)}</select></label><label>Action<select name="operation"><option value="add">Rejoindre</option><option value="remove">Quitter</option></select></label>${!project.groups.length ? "<p>Créez d’abord un groupe dans le panneau de gauche.</p>" : ""}`}${formEnd("Ajouter le changement")}`,
  );
}
function baselineForm() {
  position = 0;
  updateReader();
  show(
    "Les relations à l’état zéro",
    `<p class="muted">Les liens ci-dessous existent avant toute action. Les groupes peuvent réunir autant de personnages que nécessaire.</p><div class="effects">${project.links.map((l) => `<div class="effect"><span>${e(name(l.from))} → ${e(l.kind)} → ${e(name(l.to))}</span>${button("delete-link", "×", `data-id="${l.id}" aria-label="Supprimer ce lien initial"`, "icon")}</div>`).join("")}</div><form data-form="baseline">${relationFields()}${formEnd("Ajouter ce lien initial")}`,
  );
}
function settingsForm() {
  show(
    "La boussole de votre histoire",
    `<form data-form="settings">${field("Titre", "title", project.title, true, 200)}${field("Genre", "genre", project.settings.genre, false, 200)}${field("Style / tonalité", "tone", project.settings.tone, false, 200)}${field("Public", "audience", project.settings.audience, false, 200)}<label>Le cœur de l’histoire<textarea name="premise" maxlength="20000" rows="4" placeholder="Quelqu’un veut… mais… et risque de…">${e(project.settings.premise)}</textarea></label><label>Cases par page<select name="panelsPerPage">${[1, 2, 3, 4, 5, 6].map((n) => `<option ${n === project.settings.panelsPerPage ? "selected" : ""}>${n}</option>`).join("")}</select></label><p class="muted">Le style guide votre écriture. Les amorces locales sont des structures à personnaliser, pas un roman généré par IA.</p>${formEnd()}<div class="settings-tools">${button("import", "Importer une frise JSON")}${button("demo", "Explorer un exemple")}${legacy ? button("legacy", "Exporter mes anciennes histoires") : ""}${button("jev", "Comment Jev pourra aider")}</div>`,
  );
}
function pagePreview() {
  const cards = panels(project),
    size = project.settings.panelsPerPage;
  show(
    "Du fil aux pages",
    `<p class="muted">Chaque bloc sans sous-boucle devient une case. Les blocs parents restent des intentions, pas des scènes dupliquées. Les amorces non écrites restent signalées.</p><div class="preview-actions">${button("generate", "Préremplir les cases vides")}${button("markdown", "Exporter le découpage Markdown")}</div><div class="pages">${
      Array.from(
        { length: Math.ceil(cards.length / size) },
        (_, page) =>
          `<section class="paper-page"><h3>Page ${page + 1}</h3><div class="panel-grid">${cards
            .slice(page * size, (page + 1) * size)
            .map(
              (c, i) =>
                `<button class="book-panel phase-${c.block.phase}" data-action="select-page" data-id="${c.block.id}"><span class="eyebrow">CASE ${i + 1} · ${LABELS[c.block.phase]}</span><h4>${e(c.block.title)}</h4><p>${e(c.text)}</p><small>${c.drafted ? "Texte éditable" : "Amorce non validée"} · cliquer pour éditer</small></button>`,
            )
            .join("")}</div></section>`,
      ).join("") || "Ajoutez une boucle pour commencer."
    }</div>`,
    true,
  );
}
function download(filename: string, text: string, type = "application/json") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function confirmAction(
  title: string,
  text: string,
  action: string,
  target = "",
) {
  show(
    title,
    `<p>${e(text)}</p><p class="muted">Vous pourrez annuler cette opération depuis la barre supérieure.</p><div class="form-actions">${button("close", "Conserver")}${button(action, "Confirmer", `data-id="${target}"`, "danger")}</div>`,
  );
}
function selectBlock(block: string) {
  stop();
  selected = block;
  render();
}
document.addEventListener("click", (event) => {
  const target = event.target as HTMLElement,
    b = target.closest<HTMLElement>("[data-action]");
  if (!b) {
    const card = target.closest<HTMLElement>("[data-select]");
    if (card) selectBlock(card.dataset.select!);
    return;
  }
  const action = b.dataset.action!,
    targetId = b.dataset.id!;
  if (action === "close") {
    modal.close();
    return;
  }
  if (action === "play") {
    play();
    return;
  }
  if (action === "start" || action === "step" || action === "at-block") {
    stop();
    position =
      action === "start"
        ? 0
        : action === "step"
          ? Math.min(entries(project).length, Math.floor(position) + 1)
          : entries(project).findIndex((x) => x.block.id === targetId) + 1;
    updateReader(true);
    return;
  }
  if (action === "root" || action === "nest") {
    change(() => {
      const l = insertLoop(project, action === "nest" ? targetId : undefined);
      selected = l.blocks[0].id;
    });
    document
      .querySelector(`[data-select="${selected}"]`)
      ?.scrollIntoView({ block: "center" });
  }
  if (action === "person") personForm(targetId);
  if (action === "group") groupForm(targetId);
  if (action === "baseline") baselineForm();
  if (action === "settings") settingsForm();
  if (action === "effect" || action === "suggest-link")
    effectForm("relation", action === "suggest-link");
  if (action === "effect-type") effectForm(b.dataset.type);
  if (action === "idea")
    change(() => {
      const block = selectedBlock()!;
      block.situation = IDEAS[block.phase][Number(b.dataset.index)].title;
    });
  if (action === "use-idea") {
    const block = selectedBlock()!;
    if (block.text)
      confirmAction(
        "Remplacer le texte ?",
        "Votre texte sera remplacé par l’amorce sélectionnée.",
        "confirm-idea",
      );
    else
      change(() => {
        block.text = outline(project, block);
        block.generated = true;
      });
  }
  if (action === "confirm-idea") {
    modal.close();
    change(() => {
      const block = selectedBlock()!;
      block.text = outline(project, block);
      block.generated = true;
    });
  }
  if (action === "remove-effect")
    change(() => {
      const block = selectedBlock()!;
      block.effects = block.effects.filter((f) => f.id !== targetId);
    });
  if (action === "delete-loop")
    confirmAction(
      "Supprimer cette boucle ?",
      "Ses quatre blocs, leurs textes, leurs changements et toutes leurs sous-boucles seront supprimés.",
      "confirm-loop",
      targetId,
    );
  if (action === "confirm-loop") {
    modal.close();
    change(() => deleteLoop(project, targetId));
  }
  if (action === "delete-person")
    confirmAction(
      "Supprimer ce personnage ?",
      "Ses liens, appartenances et interventions seront retirés. Son nom peut rester dans les textes que vous avez écrits.",
      "confirm-person",
      targetId,
    );
  if (action === "confirm-person") {
    modal.close();
    change(() => deleteCharacter(project, targetId));
  }
  if (action === "delete-group")
    confirmAction(
      "Supprimer ce groupe ?",
      "Le groupe et ses changements d’appartenance seront retirés.",
      "confirm-group",
      targetId,
    );
  if (action === "confirm-group") {
    modal.close();
    change(() => deleteGroup(project, targetId));
  }
  if (action === "delete-link") {
    change(
      () => (project.links = project.links.filter((l) => l.id !== targetId)),
    );
    baselineForm();
  }
  if (action === "loop-title") {
    const loop = entries(project).find((x) => x.loop.id === targetId)?.loop;
    if (loop)
      show(
        "Nommer la boucle",
        `<form data-form="loop" data-id="${targetId}">${field("Titre", "title", loop.title, true, 200)}${formEnd()}`,
      );
  }
  if (action === "undo" || action === "redo") {
    stop();
    const source = action === "undo" ? history : future,
      dest = action === "undo" ? future : history,
      next = source.pop();
    if (next) {
      dest.push(JSON.stringify(project));
      project = parseTimeline(next);
      position = Math.min(position, entries(project).length);
      persist();
      render();
    }
  }
  if (action === "export")
    download("metamachia-frise.json", JSON.stringify(project, null, 2));
  if (action === "legacy")
    download("metamachia-anciennes-histoires.json", legacy);
  if (action === "markdown")
    download("decoupage.md", markdown(project), "text/markdown");
  if (action === "pages") pagePreview();
  if (action === "select-page") {
    modal.close();
    selectBlock(targetId);
    document
      .querySelector(`[data-select="${targetId}"]`)
      ?.scrollIntoView({ block: "center" });
  }
  if (action === "generate") {
    const blanks = panels(project).filter((c) => !c.block.text);
    change(() =>
      blanks.forEach((c) => {
        c.block.text = outline(project, c.block);
        c.block.generated = true;
      }),
    );
    pagePreview();
    announce(
      `${blanks.length} amorce(s) ajoutée(s). Relisez-les et personnalisez-les ; aucun fait n’a été créé.`,
    );
  }
  if (action === "demo")
    confirmAction(
      "Charger l’exemple ?",
      "La frise courante sera remplacée. Sauvegardez-la d’abord si vous souhaitez la conserver au-delà de cette session.",
      "confirm-demo",
    );
  if (action === "confirm-demo") {
    modal.close();
    change(() => {
      project = demoTimeline();
      position = 0;
      selected = project.loops[0].blocks[0].id;
    });
  }
  if (action === "import") {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        if (file.size > 4_000_000) throw new Error("Archive trop volumineuse.");
        const imported = parseTimeline(await file.text());
        show(
          "Remplacer la frise par cette archive ?",
          `<p>${e(imported.title)} · ${entries(imported).length} blocs. Exportez la frise actuelle avant de la remplacer.</p><div class="form-actions">${button("close", "Annuler")}<button id="confirm-import" class="primary">Importer</button></div>`,
        );
        modal
          .querySelector("#confirm-import")!
          .addEventListener("click", () => {
            modal.close();
            change(() => {
              project = imported;
              position = 0;
            });
          });
      } catch (err) {
        announce((err as Error).message);
      }
    };
    input.click();
  }
  if (action === "guide") {
    const notices = warnings(project);
    show(
      "Les repères d’une histoire cohérente",
      `<p>Un personnage désire quelque chose, rencontre un obstacle, agit et en subit les conséquences. Voici les points à préciser — pas un jugement sur la valeur de votre récit.</p><div class="guide-list">${notices.map((n) => (n.block ? button("select-page", e(n.text), `data-id="${n.block}"`) : `<p>${e(n.text)}</p>`)).join("") || "Les repères de base sont renseignés. Cela ne garantit pas la cohérence de tout le texte."}</div><p class="muted">Les vérifications portent sur les déclarations, pas sur l’interprétation automatique du manuscrit. Cette version est un temps du récit linéaire, sans flash-back implicite.</p>`,
    );
  }
  if (action === "jev")
    show(
      "Jev : suggérer, pas décider à votre place",
      `<p>Jev pourrait classer les quatre directions du bloc selon le désir des personnages, les liens déjà établis et l’intention de la boucle.</p><p>Un seul appel volontaire pour comparer les possibilités ; aucun appel pendant la lecture, le glisser-déposer ou l’écriture. Les propositions resteraient à confirmer.</p><p class="callout">Non connecté. Cette version utilise un dictionnaire local et ne transmet aucune histoire. Jev ne génère pas de prose : il évalue des choix structurés.</p><p>La clé doit rester sur un petit service sécurisé, jamais dans le site public. Aucun compte ni paiement n’est nécessaire pour continuer à écrire ici.</p>`,
    );
});
document.addEventListener("submit", (event) => {
  const form = event.target as HTMLFormElement;
  if (!form.dataset.form) return;
  event.preventDefault();
  const data = new FormData(form),
    get = (key: string) => String(data.get(key) || "").trim(),
    type = form.dataset.form,
    targetId = form.dataset.id;
  if (
    ["baseline", "effect"].includes(type) &&
    (type === "baseline" || form.dataset.type === "relation") &&
    (get("from") === get("to") || !get("from") || !get("to"))
  ) {
    announce("Choisissez deux personnages différents.");
    return;
  }
  if (
    type === "effect" &&
    form.dataset.type === "membership" &&
    !get("group")
  ) {
    announce("Créez d’abord un groupe.");
    return;
  }
  modal.close();
  change(() => {
    if (type === "person") {
      const character: Character = {
        id: targetId || id(),
        name: get("name"),
        goal: get("goal"),
        color: get("color"),
        present: data.has("present"),
      };
      const index = project.characters.findIndex((c) => c.id === targetId);
      if (index >= 0) project.characters[index] = character;
      else project.characters.push(character);
    }
    if (type === "group") {
      const group = {
        id: targetId || id(),
        name: get("name"),
        kind: get("kind") as "groupe" | "faction",
        members: data.getAll("members").map(String),
      };
      const index = project.groups.findIndex((g) => g.id === targetId);
      if (index >= 0) project.groups[index] = group;
      else project.groups.push(group);
    }
    if (type === "baseline")
      project.links.push({
        id: id(),
        from: get("from"),
        to: get("to"),
        kind: get("custom") || get("kind"),
      });
    if (type === "effect") {
      const t = form.dataset.type;
      const effect: Effect =
        t === "relation"
          ? {
              id: id(),
              type: "relation",
              from: get("from"),
              to: get("to"),
              kind: get("custom") || get("kind"),
              remove: get("operation") === "remove",
            }
          : t === "presence"
            ? {
                id: id(),
                type: "presence",
                person: get("person"),
                present: get("operation") === "add",
              }
            : {
                id: id(),
                type: "membership",
                person: get("person"),
                group: get("group"),
                join: get("operation") === "add",
              };
      selectedBlock()!.effects.push(effect);
    }
    if (type === "settings") {
      project.title = get("title");
      project.settings = {
        genre: get("genre"),
        tone: get("tone"),
        audience: get("audience"),
        premise: get("premise"),
        panelsPerPage: Number(get("panelsPerPage")),
      };
    }
    if (type === "loop") {
      const loop = entries(project).find((x) => x.loop.id === targetId)?.loop;
      if (loop) loop.title = get("title");
    }
  });
});
document.addEventListener("change", (event) => {
  const input = event.target as HTMLInputElement;
  if (input.dataset.cast)
    change(() => {
      const block = selectedBlock()!;
      block.cast = input.checked
        ? [...new Set([...block.cast, input.dataset.cast!])]
        : block.cast.filter((p) => p !== input.dataset.cast);
    });
  if (input.id === "speed") speed = Number(input.value);
  if (input.id === "direction") direction = Number(input.value);
  if (input.id === "zoom") {
    zoom = Number(input.value);
    render();
  }
});
document.addEventListener("focusin", (event) => {
  if ((event.target as HTMLElement).dataset.field) textEditStarted = false;
});
document.addEventListener("input", (event) => {
  const el = event.target as HTMLInputElement;
  if (el.id === "scrub") {
    stop();
    position = Number(el.value);
    updateReader(true);
  }
  if (el.dataset.field) {
    stop();
    const b = selectedBlock();
    if (!b) return;
    if (!textEditStarted) {
      history.push(JSON.stringify(project));
      if (history.length > 40) history.shift();
      future = [];
      textEditStarted = true;
    }
    b[el.dataset.field as "title" | "text" | "place"] = el.value;
    if (el.dataset.field === "text") b.generated = false;
    persist();
    // Never replace the focused editor on input/blur: doing so loses keystrokes and clicks.
    const card = document.querySelector(`[data-select="${b.id}"]`)!;
    card.querySelector("h3")!.textContent =
      b.title === LABELS[b.phase] ? b.situation : b.title;
    card.querySelector(".block-excerpt")!.textContent = (
      b.text || outline(project, b)
    ).slice(0, 185);
    card
      .querySelector(".block-excerpt")!
      .classList.toggle("suggested", !b.text);
    card.querySelector(".block-meta")!.firstElementChild!.textContent = b.place
      ? "⌖ " + b.place
      : "Lieu à préciser";
    document.querySelector(".suggestion")!.textContent = outline(project, b);
    document.querySelector(".save-state")!.textContent = saveStatus();
    (
      document.querySelector('[data-action="undo"]') as HTMLButtonElement
    ).disabled = false;
    (
      document.querySelector('[data-action="redo"]') as HTMLButtonElement
    ).disabled = true;
    updateReader();
  }
});
document.addEventListener("dragstart", (event) => {
  const target = (event.target as HTMLElement).closest<HTMLElement>(
    "[data-person]",
  );
  if (target) {
    event.dataTransfer?.setData("text/plain", target.dataset.person!);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = "copy";
  }
});
document.addEventListener("dragover", (event) => {
  const card = (event.target as HTMLElement).closest(".block-card");
  if (card) {
    event.preventDefault();
    card.classList.add("drag-over");
  }
});
document.addEventListener("dragleave", (event) => {
  (event.target as HTMLElement)
    .closest(".block-card")
    ?.classList.remove("drag-over");
});
document.addEventListener("drop", (event) => {
  const card = (event.target as HTMLElement).closest<HTMLElement>(
    "[data-select]",
  );
  if (!card) return;
  event.preventDefault();
  const person = event.dataTransfer?.getData("text/plain");
  if (!project.characters.some((c) => c.id === person)) return;
  selected = card.dataset.select!;
  change(() => {
    const b = selectedBlock()!;
    if (!b.cast.includes(person!)) b.cast.push(person!);
  });
  announce(
    "Personnage ajouté. Choisissez une direction ou déclarez un changement de lien.",
  );
});
document.addEventListener("keydown", (event) => {
  if (
    (event.key === "Enter" || event.key === " ") &&
    (event.target as HTMLElement).matches("[data-select]")
  ) {
    event.preventDefault();
    selectBlock((event.target as HTMLElement).dataset.select!);
  }
});
window.addEventListener("storage", (event) => {
  if (event.key === KEY && event.newValue !== previous) {
    stop();
    blocked = true;
    render();
    announce(
      "La frise a changé dans un autre onglet. Exportez votre version puis rechargez pour éviter de l’écraser.",
    );
  }
});
window.addEventListener("resize", () => updateReader());
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stop();
});
render();
if (startup) announce(startup);
