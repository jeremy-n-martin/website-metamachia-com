import { compile, validateStory, View } from "../src/compiler.js";
import {
  Arc,
  Entity,
  Event as StoryEvent,
  FactChange,
  Note,
  Project,
  Scene,
} from "../src/model.js";
import {
  createProject,
  demoProject,
  Library,
  LibraryStore,
  manuscript,
  newScene,
  parseArchive,
  projectWords,
  STORAGE_KEY,
  uid,
  wordCount,
} from "../src/project.js";

import {
  allScenes,
  universeReadiness,
  sceneLocation,
  sceneEvents,
  removeScenes as deleteScenes,
  removeArc,
  DeletionUndo,
} from "../src/narrative.js";
import {
  guide,
  sceneBoard,
  sceneLinks,
  plotMap,
  narrativeTimeline,
  eventCard,
  beats,
} from "./narrative-ui.js";

const app = document.querySelector<HTMLDivElement>("#app")!;
const modal = document.querySelector<HTMLDialogElement>("#modal")!;
const toastEl = document.querySelector<HTMLDivElement>("#toast")!;
const escape = (value: unknown): string =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const e = escape;
const icons: Record<string, string> = {
  book: '<path d="M4 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-3H4z"/><path d="M13 7a3 3 0 0 1 3-3h5v14h-5a3 3 0 0 0-3 3"/>',
  home: '<path d="m3 11 9-8 9 8v10h-7v-7h-4v7H3z"/>',
  pen: '<path d="m15 4 5 5M4 16 16 4a3 3 0 0 1 4 4L8 20l-5 1z"/>',
  world:
    '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18"/>',
  plot: '<circle cx="5" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><circle cx="19" cy="5" r="2"/><path d="M7 5h10M5 7v6a6 6 0 0 0 6 6h6"/>',
  check: '<path d="m5 12 4 4L20 5"/><path d="M21 12v8H3V3h12"/>',
  export: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  plus: '<path d="M12 4v16M4 12h16"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  back: '<path d="M20 12H4m6-6-6 6 6 6"/>',
  chevron: '<path d="m8 5 7 7-7 7"/>',
  close: '<path d="m5 5 14 14M5 19 19 5"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  note: '<path d="M5 3h10l4 4v14H5zM9 11h6M9 15h6"/>',
  spark: '<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/>',
};
const icon = (name: string) =>
  `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${icons[name] ?? icons.book}</svg>`;
const btn = (label: string, action: string, cls = "", attrs = "") =>
  `<button type="button" class="btn ${cls}" data-action="${action}" ${attrs}>${label}</button>`;
const tag = (label: string, kind = "") =>
  `<span class="tag ${kind}">${e(label)}</span>`;
const field = (
  label: string,
  name: string,
  value: unknown,
  type = "text",
  extra = "",
) =>
  `<label class="field">${label}<input name="${name}" type="${type}" value="${e(value)}" ${extra}></label>`;
const area = (label: string, name: string, value: unknown, extra = "") =>
  `<label class="field">${label}<textarea name="${name}" ${extra}>${e(value)}</textarea></label>`;
const option = (value: string, label: string, current?: string) =>
  `<option value="${e(value)}" ${value === current ? "selected" : ""}>${e(label)}</option>`;
const select = (label: string, name: string, options: string) =>
  `<label class="field">${label}<select name="${name}">${options}</select></label>`;
const kinds: Record<string, string> = {
  character: "Personnage",
  place: "Lieu",
  object: "Objet",
  faction: "Faction",
  other: "Autre",
};
const statuses: Record<string, string> = {
  canon: "Canon",
  draft: "Brouillon",
  plan: "Plan",
  open: "Ouvert",
  progress: "En cours",
  resolved: "Résolu",
};
const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);
const date = (s: string) =>
  new Date(s).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
const empty = (title: string, body: string, button = "") =>
  `<div class="empty">${icon("spark")}<h3>${title}</h3><p>${body}</p>${button}</div>`;
function markdown(text: string): string {
  return text
    .split(/\n\s*\n/)
    .map((block) => {
      const safe = e(block)
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>");
      if (/^### /.test(block)) return `<h3>${safe.slice(4)}</h3>`;
      if (/^## /.test(block)) return `<h2>${safe.slice(3)}</h2>`;
      if (/^# /.test(block)) return `<h1>${safe.slice(2)}</h1>`;
      if (/^> /.test(block)) return `<blockquote>${safe.slice(5)}</blockquote>`;
      return `<p>${safe.replaceAll("\n", "<br>")}</p>`;
    })
    .join("");
}

let library: Library = { projects: [], activeId: null };
let store: LibraryStore | undefined;
let saveError = "";
let dirty = false;
let saveTimer: ReturnType<typeof setTimeout> | undefined;
let toastTimer: ReturnType<typeof setTimeout> | undefined;
let route = "overview";
let libraryView = false;
let sceneId = "";
let view: View = "writer";
let character = "";
let includeDraft = false;
let preview = false;
let writingMode: "board" | "editor" = "board";
let timelineOrder = "reading";
let timelineZoom = 1;
let timelineChapter = "";
let continuityScope = "chapter";
const deletionUndo = new DeletionUndo();
let worldFilter = "all";
let eventFilter = "all";
let search = "";
let modalSave: ((data: FormData) => void) | undefined;
let confirmAction: (() => void) | undefined;
let eventRows: {
  layer: string;
  subject: string;
  property: string;
  value: string;
  mode: string;
  holder: string;
  until: string;
}[] = [];
try {
  store = new LibraryStore(localStorage);
  library = store.load();
} catch (error) {
  saveError = `Lecture impossible : ${(error as Error).message} Vos données ne seront pas écrasées. Téléchargez la sauvegarde de secours.`;
  store = undefined;
}

function project(): Project {
  return library.projects.find((p) => p.id === library.activeId)!;
}
function currentScene(): Scene | undefined {
  const p = project();
  const selectedChapter =
    route === "continuity"
      ? p?.chapters.find((c) => c.id === timelineChapter)
      : undefined;
  const all =
    selectedChapter?.scenes ?? p?.chapters.flatMap((c) => c.scenes) ?? [];
  return all.find((s) => s.id === sceneId) ?? all[0];
}
function currentChapter() {
  const s = currentScene();
  return project()?.chapters.find((c) => c.scenes.some((x) => x.id === s?.id));
}
function flash(text: string): void {
  toastEl.textContent = text;
  toastEl.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("visible"), 4500);
}
function save(): void {
  clearTimeout(saveTimer);
  if (!dirty) return;
  if (store)
    try {
      store.save(library);
      dirty = false;
      saveError = "";
    } catch (error) {
      saveError = (error as Error).message;
    }
  else
    saveError ||=
      "Stockage indisponible. Exportez une sauvegarde avant de fermer cette page.";
  document.querySelectorAll<HTMLElement>("[data-save]").forEach((el) => {
    el.textContent = saveError
      ? "Sauvegarde impossible — exportez votre travail"
      : dirty
        ? "Enregistrement…"
        : "Enregistré sur cet appareil";
    el.classList.toggle("error", !!saveError);
  });
  if (saveError) {
    const warning = document.querySelector<HTMLElement>("#save-warning");
    if (warning) {
      warning.hidden = false;
      warning.textContent = saveError;
    }
  }
}
function changed(): void {
  dirty = true;
  document.querySelector("#undo-banner")?.setAttribute("hidden", "");
  if (project()) project().updatedAt = new Date().toISOString();
  document
    .querySelectorAll("[data-save]")
    .forEach((el) => (el.textContent = "Enregistrement…"));
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, 350);
}
function mutate(fn: () => void): void {
  fn();
  changed();
  save();
  render();
}
function download(
  name: string,
  content: string,
  type = "application/json",
): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const filename = (p = project()) =>
  p.title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 70) || "histoire";
function openDialog(
  title: string,
  body: string,
  submitLabel: string,
  onSave: (data: FormData) => void,
): void {
  modalSave = onSave;
  modal.innerHTML = `<form id="dialog-form"><div class="dialog-top"><h2 id="dialog-title">${title}</h2>${btn(icon("close"), "close", "icon-button", 'aria-label="Fermer"')}</div><div class="dialog-body">${body}<p id="form-error" class="error" role="alert"></p></div><div class="dialog-footer">${btn("Annuler", "close", "quiet")}<button class="btn primary" type="submit">${submitLabel}</button></div></form>`;
  modal.showModal();
}
function confirm(title: string, description: string, action: () => void): void {
  confirmAction = action;
  openDialog(title, `<p>${description}</p>`, "Confirmer", () => {
    modal.close();
    confirmAction?.();
    confirmAction = undefined;
  });
}
function createStory(): void {
  openDialog(
    "Une nouvelle histoire",
    field(
      "Titre de l’histoire",
      "title",
      "",
      "text",
      'required maxlength="160" autofocus placeholder="Le titre de votre prochaine aventure"',
    ) +
      field(
        "Genre / ambiance",
        "genre",
        "",
        "text",
        'placeholder="Fantasy, polar, récit de vie…"',
      ),
    "Créer mon histoire",
    (data) => {
      const p = createProject(String(data.get("title")));
      p.genre = String(data.get("genre"));
      modal.close();
      mutate(() => {
        library.projects.push(p);
        library.activeId = p.id;
        libraryView = false;
        route = "overview";
        sceneId = "";
      });
    },
  );
}

function renderLibrary(): string {
  return `<div class="library-shell"><header class="library-header"><a class="logo" href="#">${icon("book")}<span>metamachia<span class="logo-dot">.</span></span></a>${tag("ATELIER D’ÉCRITURE")}</header><div id="save-warning" class="notice error" ${saveError ? "" : "hidden"}>${e(saveError)}${btn("Sauvegarde de secours", "rescue")}</div><section class="library-hero"><div><p class="eyebrow">LES GRANDES HISTOIRES COMMENCENT PAR UNE LIGNE</p><h1>Tout un monde.<br><em>À vous de l’écrire.</em></h1><p>Vos idées, vos personnages, vos chapitres.<br>Un atelier pour donner vie à votre histoire et en garder le fil.</p><div class="actions">${btn(icon("plus") + "Créer une histoire", "new-project", "primary")}${btn(icon("export") + "Importer une sauvegarde", "import", "secondary")}</div></div><div class="hero-art" aria-hidden="true"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><div class="art-book"><span>LES LETTRES<br>DE L’AUBE</span><div>✧</div><small>UNE HISTOIRE À INVENTER</small></div><span class="art-star">✧</span><span class="art-note">Il était une fois…</span></div></section><section><div class="section-head"><div><p class="eyebrow">VOTRE BIBLIOTHÈQUE</p><h2>Les histoires en chemin <span class="muted">${library.projects.length ? `/ ${library.projects.length}` : ""}</span></h2></div></div><div class="project-grid">${library.projects.map((p, i) => `<article class="project-card"><div class="cover cover-${i % 3}"><span>${e(p.genre || "UNE NOUVELLE HISTOIRE")}</span><h3>${e(p.title)}</h3><div>✧</div></div><div class="project-card-body"><p>${p.chapters.length} chapitre${p.chapters.length > 1 ? "s" : ""} <span>·</span> ${fmt(projectWords(p))} mots</p><small>Modifié le ${date(p.updatedAt)}</small><div class="actions">${btn("Ouvrir l’atelier " + icon("arrow"), "open-project", "wide", `data-id="${p.id}"`)}${btn("Supprimer", "delete-project", "quiet small", `data-id="${p.id}"`)}</div></div></article>`).join("")}<article class="demo-card"><span class="demo-icon">✧</span><h3>Entrez dans une histoire</h3><p>Explorez un exemple avec Linette, une lettre impossible et un roi dont elle ignore le destin.</p>${btn("Ouvrir l’exemple " + icon("arrow"), "demo", "secondary")}<small>Une copie librement modifiable.</small></article></div></section><footer class="library-footer">${icon("check")}Vos textes restent dans ce navigateur. Exportez régulièrement une sauvegarde pour les conserver ou changer d’appareil.</footer></div>`;
}
const navs = [
  ["overview", "home", "Vue d’ensemble"],
  ["world", "world", "Univers"],
  ["write", "pen", "Manuscrit"],
  ["plot", "plot", "Intrigues & notes"],
  ["continuity", "check", "Frise & continuité"],
  ["exports", "export", "Exports & sauvegarde"],
];
function sidebar(): string {
  const p = project();
  return `<aside class="sidebar"><a class="logo" href="#" data-action="library">${icon("book")}<span>metamachia<span class="logo-dot">.</span></span></a>${btn(icon("back") + "Mes histoires", "library", "back-link")}<div class="project-label"><span class="eyebrow">HISTOIRE EN COURS</span><strong>${e(p.title)}</strong><small>${e(p.genre || "Un monde à inventer")}</small></div><nav aria-label="Atelier">${navs.map(([id, i, name]) => `<button class="nav-item ${route === id ? "active" : ""}" data-action="nav" data-id="${id}" ${route === id ? 'aria-current="page"' : ""}>${icon(i)}${name}${route === id ? '<span class="active-dot"></span>' : ""}</button>`).join("")}</nav><div class="sidebar-bottom"><div class="local-note"><span class="green-dot"></span> Votre espace personnel<p>Enregistré sur cet appareil.<br>Pas de compte, pas de synchronisation.</p></div>${btn(icon("export") + "Sauvegarder l’histoire", "backup", "backup-button")}</div></aside>`;
}
function pageHead(
  kicker: string,
  title: string,
  description: string,
  actions = "",
): string {
  return `<div class="page-heading"><div><p class="eyebrow">${kicker}</p><h1>${title}</h1><p>${description}</p></div>${actions ? `<div class="actions">${actions}</div>` : ""}</div>`;
}
function overviewContent(): string {
  const p = project();
  const words = projectWords(p),
    scenes = p.chapters.flatMap((c) => c.scenes);
  return `${pageHead("VOTRE TABLE DE TRAVAIL", "Chaque histoire a son chemin.", "Retrouvez votre intention, puis reprenez le fil.", btn("Reprendre l’écriture " + icon("arrow"), "nav", "primary", 'data-id="write"'))}<section class="overview-grid"><div class="vision card"><div class="section-head"><h2>L’histoire que vous racontez</h2>${tag("VISION")}</div><label class="sr-only" for="story-title">Titre de l’histoire</label><input id="story-title" class="title-input" data-project="title" value="${e(p.title)}" maxlength="160" aria-label="Titre de l’histoire"><label class="field compact">Genre / ambiance<input data-project="genre" value="${e(p.genre)}" placeholder="Fantasy, aventure, roman intime…"></label><label class="field">L’intention & le synopsis<textarea class="synopsis" data-project="synopsis" placeholder="De quoi parle votre histoire ? Quel voyage souhaitez-vous faire vivre au lecteur ?">${e(p.synopsis)}</textarea></label></div><div class="progress-card"><p class="eyebrow">MOT APRÈS MOT</p><div class="word-total" data-total>${fmt(words)}</div><p>mots écrits sur <strong>${fmt(p.targetWords)}</strong></p><div class="progress-track"><span style="width:${Math.min(100, (words / p.targetWords) * 100)}%"></span></div><label class="field">Votre objectif en mots<input type="number" min="1" max="10000000" data-project="targetWords" value="${p.targetWords}"></label><div class="tiny-stats"><span><strong>${p.chapters.length}</strong> chapitres</span><span><strong>${scenes.length}</strong> scènes</span></div><p class="progress-foot">${scenes.filter((s) => s.status === "complete").length} scène(s) terminée(s).<br>La prochaine phrase vous attend.</p></div></section><section class="card chapter-overview"><div class="section-head"><h2>Le chemin de votre récit</h2>${btn(icon("plus") + "Chapitre", "new-chapter", "secondary small")}</div>${p.chapters.length ? p.chapters.map((c, i) => `<div class="chapter-row"><span class="chapter-number">${String(i + 1).padStart(2, "0")}</span><div><h3>${e(c.title || "Sans titre")}</h3><p>${c.scenes.length} scène(s) · ${fmt(c.scenes.reduce((n, s) => n + wordCount(s.text ?? ""), 0))} mots</p></div>${btn("Écrire " + icon("arrow"), "open-chapter", "quiet", `data-id="${c.id}"`)}</div>`).join("") : empty("Le début d’un voyage", "Ajoutez le premier chapitre.")}</section><div class="tip">${icon("spark")} <p><strong>Un repère pour écrire.</strong> Posez votre univers, reliez une intrigue à vos scènes, puis écrivez et vérifiez ce qui change.</p></div>`;
}

function overview(): string {
  return guide(project()) + overviewContent();
}

function outline(): string {
  const p = project(),
    s = currentScene();
  return `<aside class="outline"><div class="section-head"><span class="eyebrow">CHAPITRES</span>${btn("+ Chapitre", "new-chapter", "secondary small", 'aria-label="Ajouter un chapitre"')}</div>${p.chapters.map((c, i) => `<section class="outline-chapter"><div class="outline-heading"><button data-action="edit-chapter" data-id="${c.id}" title="Modifier le chapitre">${String(i + 1).padStart(2, "0")} <strong>${e(c.title || c.id)}</strong></button>${btn("+ Scène", "new-scene", "quiet small", `data-id="${c.id}" aria-label="Ajouter une scène à ${e(c.title)}"`)}</div>${c.scenes.map((x, j) => `<button class="scene-link ${s?.id === x.id ? "selected" : ""}" data-action="select-scene" data-id="${x.id}"><span class="scene-dot ${x.status === "complete" ? "done" : ""}"></span><span>${e(x.title || `Scène ${j + 1}`)}<small>${fmt(wordCount(x.text ?? ""))} mots · t ${x.storyTime}</small></span></button>`).join("")}${!c.scenes.length ? '<p class="empty-inline">Ajoutez votre première scène.</p>' : ""}</section>`).join("")}</aside>`;
}
function contextPanel(): string {
  const s = currentScene(),
    c = currentChapter(),
    p = project();
  if (!s || !c) return "";
  const result = compile(p, {
    chapter: c.id,
    scene: s.id,
    view,
    character,
    includeDraft,
  });
  const names = (k: string) => {
    const parts = k.split(".");
    return (
      (p.entities.find((en) => en.id === parts[0])?.name ?? parts[0]) +
      " · " +
      parts.slice(1).join(".")
    );
  };
  return `<aside class="context-panel"><div class="section-head"><h3>${icon("spark")} À cet instant</h3>${tag(`t ${s.storyTime}`)}</div><p class="muted small">Les informations disponibles à cette scène.</p><label class="field">Point de vue<select id="context-view">${option("writer", "Auteur", view)}${option("reader", "Lecteur", view)}${option("character", "Personnage", view)}</select></label>${
    view === "character"
      ? `<label class="field">Personnage<select id="context-character"><option value="">Choisir…</option>${p.entities
          .filter((en) => en.kind === "character")
          .map((en) => option(en.id, en.name, character))
          .join("")}</select></label>`
      : ""
  }<label class="checkbox"><input id="include-draft" type="checkbox" ${includeDraft ? "checked" : ""}> Inclure les faits du brouillon</label><div class="context-facts">${
    Object.keys(result.context.facts).length
      ? Object.entries(result.context.facts)
          .map(
            ([k, v]) =>
              `<div class="fact"><small>${e(names(k))}</small><strong>${e(v === true ? "Oui" : v === false ? "Non" : typeof v === "string" ? v : JSON.stringify(v))}</strong></div>`,
          )
          .join("")
      : empty(
          "Rien de documenté",
          view === "writer"
            ? "Ajoutez un fait de continuité pour commencer."
            : "Aucune information explicite dans cette vue.",
        )
  }</div>${result.context.notes.length ? `<details><summary>${result.context.notes.length} note(s) autorisée(s)</summary>${result.context.notes.map((n) => `<p class="note-excerpt">${e(n.text)}</p>`).join("")}</details>` : ""}${view === "writer" && result.issues.length ? `<button class="issue-link" data-action="nav" data-id="continuity">${result.issues.length} point(s) à vérifier →</button>` : ""}<p class="small muted">Une absence d’information ne signifie pas « faux ».</p>${btn(icon("export") + "Exporter ce contexte", "context-export", "secondary wide")}</aside>`;
}
function writing(): string {
  if (writingMode === "board") return sceneBoard(project());
  const p = project(),
    s = currentScene(),
    c = currentChapter();
  if (!s || !c)
    return `${outline()}<div class="page-pad">${empty("Votre manuscrit commence ici", "Créez un chapitre et sa première scène.", btn("Ajouter un chapitre", "new-chapter", "primary"))}</div>`;
  sceneId = s.id;
  return `${outline()}<section class="editor-column"><div class="editor-toolbar">${btn("← Tableau des scènes", "writing-board", "quiet small")}<span>${e(c.title)} <span class="muted">/ Scène ${c.scenes.indexOf(s) + 1}</span></span><div>${btn(preview ? "Modifier" : "Aperçu", "toggle-preview", "quiet small")}${btn("Relier / préparer", "edit-scene", "secondary small", `data-id="${s.id}"`)}${btn("Supprimer la scène", "delete-scene", "quiet small danger", `data-id="${s.id}"`)}</div></div>${sceneLinks(p, s)}<div class="editor-page"><p class="eyebrow">${s.status === "complete" ? "SCÈNE TERMINÉE" : "EN COURS D’ÉCRITURE"} <span>· MOMENT ${s.storyTime}</span></p><input class="scene-title" data-scene="title" value="${e(s.title)}" placeholder="Le titre de votre scène" aria-label="Titre de la scène"><details class="scene-brief" ${s.plan ? "" : "open"}><summary>L’intention de la scène</summary><textarea data-scene="plan" placeholder="Que doit-il se passer ? Qu’est-ce qui doit rester secret ?" aria-label="Plan de la scène">${e(s.plan)}</textarea></details>${preview ? `<article class="prose">${s.text ? markdown(s.text) : '<p class="muted">La page attend vos premiers mots.</p>'}</article>` : `<textarea class="manuscript-editor" data-scene="text" aria-label="Texte de la scène" placeholder="Tout commence par une phrase…" spellcheck="true">${e(s.text)}</textarea>`}<div class="editor-bottom"><span data-scene-words>${fmt(wordCount(s.text ?? ""))} mots</span><label class="checkbox"><input type="checkbox" id="scene-complete" ${s.status === "complete" ? "checked" : ""}> Scène terminée</label></div></div><section class="scene-events"><div class="section-head"><h3>Ce qui change dans cette scène</h3>${btn(icon("plus") + "Déclarer un événement", "new-event", "secondary small")}</div><p class="muted small">Déclarez les changements importants. Le texte n’est pas analysé automatiquement.</p>${
    sceneEvents(p, s)
      .map(
        (ev) =>
          `<button class="event-chip" data-action="edit-event" data-id="${ev.id}">${tag(statuses[ev.status ?? "canon"], ev.status ?? "canon")}<span>${e(ev.title)}</span>${icon("chevron")}</button>`,
      )
      .join("") ||
    '<p class="empty-inline">Aucun changement déclaré pour cette scène.</p>'
  }</section></section><div id="context-container">${contextPanel()}</div>`;
}

function universe(): string {
  const p = project();
  const items = p.entities.filter(
    (en) =>
      (worldFilter === "all" || en.kind === worldFilter) &&
      `${en.name} ${en.description}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return `${pageHead("LA BIBLE DE VOTRE HISTOIRE", "Donnez corps à votre monde.", "Des personnages qui évoluent, des lieux qui restent en mémoire.", btn(icon("plus") + "Ajouter une fiche", "new-entity", "primary"))}<div class="filter-bar"><div class="tabs">${[["all", "Tout"], ...Object.entries(kinds)].map(([k, v]) => btn(v, "world-filter", `tab ${worldFilter === k ? "active" : ""}`, `data-id="${k}"`)).join("")}</div><input id="world-search" type="search" placeholder="Rechercher une fiche…" value="${e(search)}" aria-label="Rechercher dans l’univers"></div><div class="entity-grid">${items.map((en) => `<article class="entity-card"><div class="entity-top"><span class="avatar ${en.kind}">${e(en.name.slice(0, 1).toUpperCase())}</span>${tag(kinds[en.kind] ?? en.kind)}</div><h2>${e(en.name)}</h2><p>${e(en.description || "Une présence à imaginer…")}</p>${btn("Ouvrir la fiche " + icon("arrow"), "edit-entity", "quiet", `data-id="${en.id}"`)}</article>`).join("") || empty("Un monde à peupler", "Ajoutez votre premier personnage, un lieu ou un objet important.", btn("Créer une fiche", "new-entity", "primary"))}</div>`;
}
function plot(): string {
  const p = project();
  return `${pageHead("LE FIL ROUGE", "Tissez votre intrigue.", "Gardez vos promesses narratives, vos secrets et vos idées à portée de main.", btn(icon("plus") + "Intrigue", "new-arc", "primary") + btn(icon("plus") + "Note", "new-note", "secondary"))}${plotMap(p)}<details class="plot-status-board"><summary>Tableau de progression des intrigues</summary><div class="plot-board">${[
    "open",
    "progress",
    "resolved",
  ]
    .map(
      (st) =>
        `<section class="plot-lane"><div class="section-head"><h3><span class="lane-dot ${st}"></span>${statuses[st]}</h3>${tag(String(p.arcs.filter((a) => a.status === st).length))}</div>${
          p.arcs
            .filter((a) => a.status === st)
            .map(
              (a) =>
                `<button class="arc-card" data-action="edit-arc" data-id="${a.id}"><h3>${e(a.title)}</h3><p>${e(a.description || "Précisez les enjeux de cette intrigue.")}</p>${a.resolution ? "<small>Une résolution envisagée ↗</small>" : ""}</button>`,
            )
            .join("") || '<p class="empty-inline">Un fil encore à tisser.</p>'
        }</section>`,
    )
    .join(
      "",
    )}</div></details><section class="notes-section"><div class="section-head"><div><p class="eyebrow">LE CARNET</p><h2>Notes & secrets</h2></div>${btn("Nouvelle note", "new-note", "secondary small")}</div><div class="notes-grid">${p.notes.map((n) => `<button class="note-card" data-action="edit-note" data-id="${n.id}">${tag(n.scope === "author" ? "Auteur uniquement" : n.scope === "reader" ? "Lecteur" : (p.entities.find((en) => en.id === n.scope.slice(10))?.name ?? "Personnage"))}<h3>${e(n.title || "Sans titre")}</h3><p>${e(n.text)}</p></button>`).join("") || empty("Le carnet est ouvert", "Consignez une idée, une règle de votre monde ou un secret réservé à l’auteur.")}</div></section>`;
}
function continuity(): string {
  const p = project(),
    s = currentScene(),
    c = currentChapter();
  const chapter = p.chapters.find((ch) => ch.id === timelineChapter) ?? c;
  timelineChapter = chapter?.id ?? "";
  const result =
    s && c
      ? compile(p, { chapter: c.id, scene: s.id, view: "writer", includeDraft })
      : null;
  const issues = result?.issues ?? validateStory(p);
  const relevant = chapter
    ? new Set(chapter.scenes.flatMap((sc) => sceneEvents(p, sc)))
    : new Set<StoryEvent>();
  const events = p.events
    .filter(
      (ev) =>
        (eventFilter === "all" || (ev.status ?? "canon") === eventFilter) &&
        (continuityScope === "all" || relevant.has(ev)),
    )
    .sort((a, b) => a.storyTime - b.storyTime);
  return `${pageHead("L’ARCHITECTURE DU RÉCIT", "Prenez de la hauteur.", "Parcourez les chapitres et les fils narratifs, puis explorez leurs conséquences.", btn(icon("plus") + "Ajouter un événement", "new-event", "primary"))}
    ${narrativeTimeline(p, timelineChapter, timelineOrder, timelineZoom, eventFilter)}
    <section class="chapter-inspector"><div class="section-head"><div><p class="eyebrow">CHAPITRE SÉLECTIONNÉ</p><h2>${e(chapter?.title ?? "Aucun chapitre")}</h2></div>${chapter ? btn("Modifier le chapitre", "edit-chapter", "secondary small", `data-id="${chapter.id}"`) : ""}</div><p class="muted">${e(chapter?.brief || "Sélectionnez un chapitre sur la frise, puis une scène pour examiner l’état du récit.")}</p><div class="inspector-scenes">${chapter?.scenes.map((sc) => btn(e(sc.title ?? sc.id) + " · moment " + sc.storyTime, "inspect-scene", `scene-inspector-tab ${sc.id === s?.id ? "active" : ""}`, `data-id="${sc.id}"`)).join("") ?? ""}</div></section>
    ${s ? sceneLinks(p, s) : ""}<div class="continuity-workbench"><section><div class="continuity-notice"><span class="check-bubble">${issues.some((i) => i.level === "error") ? "!" : icon("check")}</span><div><h3>${issues.length ? `${issues.length} point(s) à vérifier` : "Aucun conflit explicite détecté"}</h3><p>Scène : ${e(s?.title ?? "aucune")}. Le texte libre n’est pas analysé automatiquement.</p></div>${s ? btn("Ouvrir le texte", "select-scene", "quiet small", `data-id="${s.id}"`) : ""}</div>
    ${issues.length ? `<details class="issues" open><summary>Rapport de continuité</summary>${issues.map((i) => `<p class="issue ${i.level}">${e(i.message)}</p>`).join("")}</details>` : ""}
    <div class="section-head"><h2>Les conséquences</h2><label class="field compact">Périmètre<select id="continuity-scope">${option("chapter", "Ce chapitre", continuityScope)}${option("all", "Tout le récit", continuityScope)}</select></label></div><div class="tabs">${["all", "canon", "draft", "plan"].map((st) => btn(st === "all" ? "Tous les statuts" : statuses[st], "event-filter", `tab ${st === eventFilter ? "active" : ""}`, `data-id="${st}"`)).join("")}</div><p class="muted small">Canon = établi · Brouillon = hypothèse de travail · Plan = intention, sans effet sur l’état.</p>
    <div class="event-cards">${events.map((ev) => eventCard(p, ev)).join("") || empty("Aucun événement dans ce périmètre", "Ajoutez un événement à une scène ou choisissez « Tout le récit ».")}</div></section><div id="context-container">${contextPanel()}</div></div>`;
}
function exportsPage(): string {
  const p = project(),
    s = currentScene();
  return `${pageHead("VOTRE HISTOIRE VOUS APPARTIENT", "Emportez votre travail.", "Sauvegardez le projet complet, partagez le manuscrit ou préparez le contexte d’une scène.")}<div class="export-grid"><article class="export-card">${icon("book")}<h2>Projet complet</h2><p>Tout l’atelier dans un fichier : manuscrit, univers, intrigues, notes et continuité. Réimportable sur un autre navigateur.</p>${tag("JSON · SAUVEGARDE")}${btn("Télécharger la sauvegarde", "backup", "primary wide")}</article><article class="export-card">${icon("pen")}<h2>Manuscrit</h2><p>Les chapitres et les scènes dans leur ordre de lecture, avec les titres. Un document texte prêt à relire et à partager.</p>${tag("MARKDOWN")}${btn("Exporter le manuscrit", "manuscript", "secondary wide")}</article><article class="export-card">${icon("spark")}<h2>Contexte de scène</h2><p>Les informations autorisées selon le point de vue sélectionné dans le manuscrit. Scène : ${e(s?.title ?? "non sélectionnée")}.</p>${tag("MARKDOWN + JSON")}${btn("Choisir la vue et exporter", "nav", "secondary wide", 'data-id="write"')}</article><article class="export-card">${icon("check")}<h2>Rapport de continuité</h2><p>Les références manquantes, sources modifiées et contradictions explicites pour toutes les scènes.</p>${tag("JSON")}${btn("Exporter le rapport", "report", "secondary wide")}</article></div><div class="storage-card"><h2>À propos de vos sauvegardes</h2><p>L’enregistrement automatique est local à ce navigateur. Effacer les données du site peut supprimer vos histoires. Téléchargez régulièrement le projet complet : ce fichier permet de reprendre sur un autre appareil.</p><div class="actions">${btn("Importer une histoire", "import", "secondary")}${btn("Sauvegarde de secours du navigateur", "rescue", "quiet")}</div></div>`;
}
function render(): void {
  const timelineLeft =
    document.querySelector(".timeline-scroll")?.scrollLeft ?? 0;
  const p = project();
  document.title = p
    ? `${p.title} — Metamachia`
    : "Metamachia — Atelier d’écriture";
  if (!p || libraryView) {
    app.innerHTML = renderLibrary();
    return;
  }
  const gated =
    ["write", "plot", "continuity"].includes(route) &&
    !universeReadiness(p).ready;
  const isEditor = route === "write" && writingMode === "editor" && !gated;
  const pages: Record<string, () => string> = {
    overview,
    write: writing,
    world: universe,
    plot,
    continuity,
    exports: exportsPage,
  };
  app.innerHTML = `<div class="workshop ${isEditor ? "writing-layout" : ""}">${sidebar()}<main class="main-panel"><header class="topbar">${btn(icon("menu"), "menu", "icon-button mobile-menu", 'aria-label="Ouvrir le menu"')}<span>${e(navs.find((n) => n[0] === route)?.[2])}</span><span class="save-state ${saveError ? "error" : ""}" data-save>${saveError ? "Sauvegarde impossible — exportez votre travail" : dirty ? "Enregistrement…" : "Enregistré sur cet appareil"}</span></header><div id="save-warning" class="notice error" ${saveError ? "" : "hidden"}>${e(saveError)}</div><div id="undo-banner" class="undo-banner" ${deletionUndo.available(p) ? "" : "hidden"}>Suppression effectuée. Vous pouvez la rétablir avant votre prochaine modification.${btn("Annuler la suppression", "undo-delete", "secondary small")}</div><div class="${isEditor ? "writing-workspace" : route === "continuity" || route === "write" ? "page-pad narrative-page" : "page-pad"}">${gated ? guide(p, true) : (pages[route] ?? overview)()}</div></main></div>`;
  document.querySelector(".timeline-scroll")?.scrollTo({ left: timelineLeft });
}

function editChapter(id?: string): void {
  const p = project();
  const c = p.chapters.find((c) => c.id === id);
  openDialog(
    c ? "Le chapitre" : "Un nouveau chapitre",
    field(
      "Titre",
      "title",
      c?.title ?? `Chapitre ${p.chapters.length + 1}`,
      "text",
      "required maxlength=160",
    ) +
      area(
        "Brief du chapitre",
        "brief",
        c?.brief ?? "",
        'rows="5" placeholder="Objectif, ton, révélations, contraintes…"',
      ) +
      (c
        ? `<div class="actions">${btn("↑ Monter", "move-chapter", "secondary small", `data-id="${c.id}" data-direction="-1"`)}${btn("↓ Descendre", "move-chapter", "secondary small", `data-id="${c.id}" data-direction="1"`)}${btn("Supprimer le chapitre", "delete-chapter", "danger quiet", `data-id="${c.id}"`)}</div>`
        : ""),
    c ? "Enregistrer" : "Créer le chapitre",
    (data) => {
      modal.close();
      mutate(() => {
        if (c) {
          c.title = String(data.get("title"));
          c.brief = String(data.get("brief"));
        } else {
          const sc = newScene(
            Math.max(
              0,
              ...p.chapters.flatMap((c) => c.scenes.map((s) => s.storyTime)),
            ) + 1,
          );
          p.chapters.push({
            id: uid("CH"),
            title: String(data.get("title")),
            brief: String(data.get("brief")),
            scenes: [sc],
          });
          sceneId = sc.id;
          route = "write";
        }
      });
    },
  );
}
function editScene(id: string): void {
  const p = project(),
    c = p.chapters.find((c) => c.scenes.some((s) => s.id === id))!,
    s = c.scenes.find((s) => s.id === id)!;
  openDialog(
    "Préparer et relier la scène",
    field("Titre", "title", s.title, "text", "required") +
      field(
        "Moment dans l’histoire",
        "storyTime",
        s.storyTime,
        "number",
        'required step="any"',
      ) +
      select(
        "Chapitre",
        "chapter",
        p.chapters.map((x) => option(x.id, x.title ?? x.id, c.id)).join(""),
      ) +
      select(
        "Lieu de la scène",
        "location",
        option("", "À définir", sceneLocation(p, s)?.id) +
          p.entities
            .filter((en) => en.kind === "place")
            .map((en) => option(en.id, en.name, sceneLocation(p, s)?.id))
            .join(""),
      ) +
      select(
        "Rôle dans l’intrigue",
        "beat",
        option("", "À définir", s.beat) +
          Object.entries(beats)
            .map(([id, label]) => option(id, label, s.beat))
            .join(""),
      ) +
      arcChoices(s.arcIds) +
      `<fieldset class="participants"><legend>Événements présentés dans cette scène</legend><p class="small muted">Réutiliser un événement le raconte à nouveau sans réappliquer ses effets.</p>${p.events.map((ev) => `<label class="checkbox"><input type="checkbox" name="presentations" value="${ev.id}" ${s.presentations?.some((pr) => pr.event === ev.id) ? "checked" : ""}>${e(ev.title)}</label>`).join("") || '<p class="muted small">Aucun événement déclaré.</p>'}</fieldset>` +
      `<fieldset class="participants"><legend>Présences dans la scène</legend>${p.entities.map((en) => `<label class="checkbox"><input type="checkbox" name="participants" value="${en.id}" ${s.participants?.includes(en.id) ? "checked" : ""}>${e(en.name)}</label>`).join("") || '<p class="muted">Ajoutez d’abord des fiches dans Univers.</p>'}</fieldset><div class="actions">${btn("↑ Monter", "move-scene", "secondary small", `data-id="${id}" data-direction="-1"`)}${btn("↓ Descendre", "move-scene", "secondary small", `data-id="${id}" data-direction="1"`)}${btn("Supprimer la scène", "delete-scene", "danger quiet", `data-id="${id}"`)}</div>`,
    "Enregistrer",
    (data) => {
      modal.close();
      mutate(() => {
        s.title = String(data.get("title"));
        s.storyTime = Number(data.get("storyTime"));
        s.participants = data.getAll("participants").map(String);
        s.location = String(data.get("location")) || undefined;
        s.beat = (String(data.get("beat")) as Scene["beat"]) || undefined;
        s.arcIds = data.getAll("arcIds").map(String);
        s.presentations = data
          .getAll("presentations")
          .map((value) => ({ scene: s.id, event: String(value) }));
        const dest = p.chapters.find((x) => x.id === data.get("chapter"))!;
        if (dest !== c) {
          c.scenes = c.scenes.filter((x) => x.id !== id);
          dest.scenes.push(s);
          p.events.forEach((ev) => {
            if (ev.source?.scene === id) ev.source.chapter = dest.id;
          });
        }
      });
    },
  );
}
function editEntity(id?: string, preset = "character"): void {
  const p = project(),
    en = p.entities.find((x) => x.id === id);
  openDialog(
    en ? "Une présence dans votre monde" : "Une nouvelle fiche",
    field("Nom", "name", en?.name ?? "", "text", "required maxlength=160") +
      select(
        "Type de fiche",
        "kind",
        Object.entries(kinds)
          .map(([k, v]) => option(k, v, en?.kind ?? preset))
          .join(""),
      ) +
      area(
        "Description, apparence, personnalité…",
        "description",
        en?.description ?? "",
        'rows="8" placeholder="Ce qui rend cette présence unique. Les états qui changent au fil du récit sont suivis dans Continuité."',
      ) +
      (en
        ? btn(
            "Supprimer cette fiche",
            "delete-entity",
            "danger quiet",
            `data-id="${id}"`,
          )
        : ""),
    "Enregistrer la fiche",
    (data) => {
      modal.close();
      mutate(() => {
        const value = {
          name: String(data.get("name")),
          kind: String(data.get("kind")),
          description: String(data.get("description")),
        };
        if (en) Object.assign(en, value);
        else p.entities.push({ id: uid("ENT"), ...value });
      });
    },
  );
}
function arcChoices(ids: string[] = []): string {
  return `<fieldset class="participants"><legend>Intrigues reliées</legend>${
    project()
      .arcs.map(
        (a) =>
          `<label class="checkbox"><input type="checkbox" name="arcIds" value="${e(a.id)}" ${ids.includes(a.id) ? "checked" : ""}>${e(a.title)}</label>`,
      )
      .join("") ||
    '<p class="muted small">Créez un fil dans Intrigues & notes, puis reliez-le ici.</p>'
  }</fieldset>`;
}
function editArc(id?: string): void {
  const p = project(),
    a = p.arcs.find((x) => x.id === id);
  openDialog(
    a ? "Le fil d’une intrigue" : "Une nouvelle intrigue",
    field(
      "Titre / question narrative",
      "title",
      a?.title ?? "",
      "text",
      "required",
    ) +
      select(
        "Progression",
        "status",
        ["open", "progress", "resolved"]
          .map((st) => option(st, statuses[st], a?.status ?? "open"))
          .join(""),
      ) +
      area(
        "Enjeux et étapes envisagées",
        "description",
        a?.description ?? "",
        'rows="4"',
      ) +
      area(
        "Résolution envisagée (réservée à l’auteur)",
        "resolution",
        a?.resolution ?? "",
        'rows="3"',
      ) +
      `<fieldset class="participants"><legend>Scènes qui font avancer ce fil</legend><p class="small muted">Ces liens sont partagés avec le manuscrit et la frise.</p>${p.chapters.map((c) => `<strong class="chapter-check-title">${e(c.title)}</strong>${c.scenes.map((s) => `<label class="checkbox"><input type="checkbox" name="scenes" value="${e(s.id)}" ${a && s.arcIds?.includes(a.id) ? "checked" : ""}>${e(s.title)}</label>`).join("")}`).join("")}</fieldset>` +
      (a
        ? btn(
            "Supprimer l’intrigue",
            "delete-arc",
            "danger quiet",
            `data-id="${id}"`,
          )
        : ""),
    "Enregistrer",
    (data) => {
      modal.close();
      mutate(() => {
        const value = {
          title: String(data.get("title")),
          status: String(data.get("status")) as Arc["status"],
          description: String(data.get("description")),
          resolution: String(data.get("resolution")),
        };
        const arcId = a?.id ?? uid("ARC");
        if (a) Object.assign(a, value);
        else p.arcs.push({ id: arcId, ...value });
        const selected = data.getAll("scenes").map(String);
        allScenes(p).forEach((s) => {
          s.arcIds = (s.arcIds ?? []).filter((x) => x !== arcId);
          if (selected.includes(s.id)) s.arcIds.push(arcId);
        });
      });
    },
  );
}
function sceneOptions(selected = "", blank = "Aucune scène"): string {
  return (
    option("", blank, selected) +
    project()
      .chapters.flatMap((c) =>
        c.scenes.map((s) => option(s.id, `${c.title} / ${s.title}`, selected)),
      )
      .join("")
  );
}
function editNote(id?: string): void {
  const p = project(),
    n = p.notes.find((x) => x.id === id);
  openDialog(
    n ? "Une page du carnet" : "Une nouvelle note",
    field("Titre", "title", n?.title ?? "", "text", "required") +
      select(
        "Qui peut recevoir cette note ?",
        "scope",
        option("author", "Auteur uniquement", n?.scope ?? "author") +
          option("reader", "Lecteur", n?.scope) +
          p.entities
            .filter((en) => en.kind === "character")
            .map((en) => option(`character:${en.id}`, en.name, n?.scope))
            .join(""),
      ) +
      select(
        "Pour le lecteur : accessible à partir de…",
        "revealedIn",
        sceneOptions(n?.revealedIn, "Dès le début"),
      ) +
      area(
        "Note (Markdown accepté)",
        "text",
        n?.text ?? "",
        'rows="8" required',
      ) +
      (n
        ? btn(
            "Supprimer la note",
            "delete-note",
            "danger quiet",
            `data-id="${id}"`,
          )
        : ""),
    "Enregistrer",
    (data) => {
      modal.close();
      mutate(() => {
        const value = {
          title: String(data.get("title")),
          scope: String(data.get("scope")) as Note["scope"],
          text: String(data.get("text")),
          revealedIn: String(data.get("revealedIn")) || undefined,
        };
        if (n) Object.assign(n, value);
        else p.notes.push({ id: uid("NOTE"), ...value });
      });
    },
  );
}
function readRows(): void {
  eventRows = [...modal.querySelectorAll<HTMLElement>(".change-row")].map(
    (row) =>
      Object.fromEntries(
        [
          ...row.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
            "[data-row-field]",
          ),
        ].map((el) => [el.dataset.rowField, el.value]),
      ) as (typeof eventRows)[number],
  );
}
function rowMarkup(): string {
  const p = project();
  return eventRows
    .map(
      (r, i) =>
        `<fieldset class="change-row"><legend>Changement ${i + 1}</legend><div class="layer-explainer ${r.layer}">${r.layer === "world" ? "◉ Réalité : ce qui devient vrai dans l’univers." : r.layer === "belief" ? "◈ Croyance : ce que pense un personnage, même s’il se trompe." : "◇ Lecteur : ce qui est révélé dans le livre, sans changer le monde."}</div><div class="form-grid"><label class="field">Nature<select data-row-field="layer">${option("world", "Fait du monde", r.layer)}${option("belief", "Croyance d’un personnage", r.layer)}${option("reader", "Révélation au lecteur", r.layer)}</select></label><label class="field">Sujet<select data-row-field="subject" required><option value="">Choisir…</option>${p.entities.map((en) => option(en.id, en.name, r.subject)).join("")}</select></label><label class="field">Propriété libre<input data-row-field="property" value="${e(r.property)}" required placeholder="vivant, tenue, inventaire…"></label><label class="field">Opération<select data-row-field="mode">${option("set", "Attribuer une valeur", r.mode)}${option("end", "Terminer l’information", r.mode)}${option("add", "Ajouter à une collection", r.mode)}${option("remove", "Retirer d’une collection", r.mode)}</select></label><label class="field" ${r.mode === "end" ? "hidden" : ""}>Nouvelle valeur<input list="truth-values" data-row-field="value" value="${e(r.value)}" placeholder="Ex. manteau vert, true, 42"></label><label class="field" ${r.layer === "belief" ? "" : "hidden"}>Croyance : qui la détient ?<select data-row-field="holder">${option("", "Aucun", r.holder)}${p.entities
          .filter((en) => en.kind === "character")
          .map((en) => option(en.id, en.name, r.holder))
          .join(
            "",
          )}</select></label><label class="field" ${r.layer !== "reader" && r.mode === "set" ? "" : "hidden"}>Fin du fait temporaire (facultatif)<input type="number" step="any" data-row-field="until" value="${e(r.until)}" placeholder="Moment de fin"></label></div>${btn("Retirer ce changement", "remove-row", "quiet danger small", `data-index="${i}"`)}</fieldset>`,
    )
    .join("");
}
function editEvent(id?: string): void {
  const p = project(),
    ev = p.events.find((x) => x.id === id),
    s = currentScene();
  if (!p.entities.length) {
    flash(
      "Créez d’abord une fiche dans Univers pour décrire le sujet du fait.",
    );
    route = "world";
    render();
    return;
  }
  const asRow = (ch: FactChange, layer: string, holder = "") => ({
    layer,
    subject: ch.subject,
    property: ch.property,
    value: typeof ch.value === "string" ? ch.value : JSON.stringify(ch.value),
    mode: ch.mode ?? "set",
    holder,
    until: ch.until === undefined ? "" : String(ch.until),
  });
  eventRows = ev
    ? [
        ...(ev.changes ?? []).map((ch) => asRow(ch, "world")),
        ...(ev.beliefs ?? []).map((ch) => asRow(ch, "belief", ch.holder)),
        ...(ev.readerReveals ?? []).map((ch) => asRow(ch, "reader")),
      ]
    : [
        {
          layer: "world",
          subject: p.entities[0].id,
          property: "",
          value: "",
          mode: "set",
          holder: "",
          until: "",
        },
      ];
  openDialog(
    ev ? "Un événement du récit" : "Un nouvel événement",
    `<div class="notice">Un événement change le monde une seule fois. Déclarez séparément ce qu’un personnage croit et ce qui est révélé au lecteur.</div><div class="form-grid">${field("Titre", "title", ev?.title ?? "", "text", "required")}${field("Moment dans l’histoire", "storyTime", ev?.storyTime ?? s?.storyTime ?? 1, "number", 'required step="any"')}${select("Statut éditorial", "status", ["draft", "canon", "plan"].map((st) => option(st, statuses[st], ev?.status ?? "draft")).join(""))}${select("Texte source", "source", sceneOptions(ev ? (ev.source?.scene ?? "") : s?.id, "Déclaration indépendante"))}${select("Révélation au lecteur dans…", "revealedIn", sceneOptions(ev ? (ev.revealedIn ?? "") : s?.id, "Non révélé"))}</div><label class="checkbox milestone-choice"><input name="milestone" type="checkbox" ${ev?.milestone ? "checked" : ""}> ◆ Jalon marquant : afficher sur la frise macro</label>${arcChoices(ev?.arcIds)}<datalist id="truth-values"><option value="true">Oui / vrai</option><option value="false">Non / faux</option></datalist><div id="event-rows">${rowMarkup()}</div>${btn(icon("plus") + "Ajouter un changement", "add-row", "secondary")}<p class="muted small">Les valeurs true, false et les nombres sont reconnus. Le texte libre reste du texte. Une fin temporaire retire l’information, sans restaurer l’ancienne valeur.</p>${ev ? btn("Supprimer cet événement", "delete-event", "danger quiet", `data-id="${id}"`) : ""}`,
    "Enregistrer l’événement",
    (data) => {
      readRows();
      const time = Number(data.get("storyTime"));
      const changes: FactChange[] = [],
        beliefs: NonNullable<StoryEvent["beliefs"]> = [];
      const readerReveals: FactChange[] = [];
      if (!eventRows.length) throw Error("Ajoutez au moins un changement.");
      for (const row of eventRows) {
        if (!row.subject || !row.property.trim())
          throw Error(
            "Chaque changement doit avoir un sujet et une propriété.",
          );
        let value: unknown = row.value;
        try {
          value = JSON.parse(row.value);
        } catch {
          /* Text values need no quotes. */
        }
        const ch: FactChange = {
          subject: row.subject,
          property: row.property.trim(),
          mode: row.mode as FactChange["mode"],
          value,
        };
        if (row.until !== "") {
          if (row.mode !== "set")
            throw Error(
              "Pour une information temporaire, utilisez l’opération Attribuer une valeur.",
            );
          if (row.layer === "reader")
            throw Error(
              "Une révélation se termine par une nouvelle révélation explicite (opération Terminer).",
            );
          ch.until = Number(row.until);
          if (!Number.isFinite(ch.until) || ch.until <= time)
            throw Error("La fin temporaire doit suivre le début.");
        }
        if (row.layer === "belief") {
          if (!row.holder)
            throw Error("Choisissez le personnage qui détient cette croyance.");
          beliefs.push({ ...ch, holder: row.holder });
        } else if (row.layer === "reader") readerReveals.push(ch);
        else changes.push(ch);
      }
      const sourceId = String(data.get("source")),
        sourceChapter = p.chapters.find((c) =>
          c.scenes.some((sc) => sc.id === sourceId),
        ),
        sourceScene = sourceChapter?.scenes.find((sc) => sc.id === sourceId);
      if (String(data.get("status")) === "draft" && !sourceScene)
        throw Error(
          "Un événement de brouillon doit être rattaché à une scène.",
        );
      const value: StoryEvent = {
        id: ev?.id ?? uid("EV"),
        title: String(data.get("title")),
        storyTime: time,
        status: String(data.get("status")) as StoryEvent["status"],
        changes,
        beliefs,
        readerReveals,
        milestone: data.get("milestone") === "on",
        arcIds: data.getAll("arcIds").map(String),
        revealedIn: String(data.get("revealedIn")) || undefined,
        ...(sourceScene && sourceChapter
          ? {
              source: {
                chapter: sourceChapter.id,
                scene: sourceScene.id,
                version: sourceScene.version ?? "1",
              },
            }
          : {}),
      };
      modal.close();
      mutate(() => {
        if (ev) Object.assign(ev, { source: undefined }, value);
        else p.events.push(value);
      });
      flash(
        value.status === "canon"
          ? "Événement enregistré dans le canon."
          : "Événement enregistré. Le canon reste inchangé.",
      );
    },
  );
}

function removeScenes(ids: string[]): void {
  deleteScenes(project(), ids);
  sceneId = "";
}
function deleteWithUndo(fn: () => void): void {
  deletionUndo.capture(project(), () => {
    fn();
    changed();
  });
  save();
  render();
}
function requireUniverse(): boolean {
  if (universeReadiness(project()).ready) return true;
  route = "overview";
  render();
  flash("Ajoutez d’abord au moins un personnage et un lieu dans l’Univers.");
  return false;
}
function move<T>(arr: T[], index: number, delta: number): void {
  const dest = index + delta;
  if (dest < 0 || dest >= arr.length) return;
  [arr[index], arr[dest]] = [arr[dest], arr[index]];
}
async function importProject(): Promise<void> {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json,application/json";
  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      if (file.size > 10_000_000) throw Error("Le fichier dépasse 10 Mo.");
      const incoming = parseArchive(await file.text());
      if (!incoming.length)
        throw Error("La sauvegarde ne contient aucune histoire.");
      incoming.forEach((p) => {
        p.id = uid("STORY");
        p.title += " (importée)";
      });
      mutate(() => {
        library.projects.push(...incoming);
        library.activeId = incoming[0].id;
        libraryView = false;
        route = "overview";
        sceneId = "";
      });
      flash(
        `${incoming.length} histoire(s) importée(s) dans de nouvelles copies.`,
      );
    } catch (error) {
      flash(`Import impossible : ${(error as Error).message}`);
    }
  });
  input.click();
}

document.addEventListener("click", (event) => {
  const el = (event.target as HTMLElement).closest<HTMLElement>(
    "[data-action]",
  );
  if (!el) return;
  event.preventDefault();
  const action = el.dataset.action,
    id = el.dataset.id,
    p = project();
  if (
    ["new-chapter", "new-scene", "new-arc", "new-event"].includes(
      action ?? "",
    ) &&
    !requireUniverse()
  )
    return;
  const actions: Record<string, () => void> = {
    "guided-character": () => {
      route = "world";
      render();
      editEntity(undefined, "character");
    },
    "guided-place": () => {
      route = "world";
      render();
      editEntity(undefined, "place");
    },
    "show-world": () => {
      route = "world";
      render();
    },
    "show-plot": () => {
      route = "plot";
      render();
    },
    "open-writing": () => {
      route = "write";
      writingMode = "board";
      render();
    },
    "writing-board": () => {
      save();
      route = "write";
      writingMode = "board";
      render();
    },
    "timeline-order": () => {
      timelineOrder = id!;
      render();
    },
    "pan-timeline": () => {
      const sc = document.querySelector(".timeline-scroll");
      sc?.scrollBy({
        left: Number(id) * sc.clientWidth * 0.7,
        behavior: "smooth",
      });
    },
    "inspect-chapter": () => {
      timelineChapter = id!;
      const c = p.chapters.find((c) => c.id === id);
      sceneId = c?.scenes[0]?.id ?? "";
      render();
    },
    "inspect-scene": () => {
      sceneId = id!;
      timelineChapter = currentChapter()?.id ?? "";
      render();
    },
    "scene-continuity": () => {
      save();
      sceneId = id!;
      timelineChapter = currentChapter()?.id ?? "";
      route = "continuity";
      render();
    },
    "undo-delete": () => {
      const restored = deletionUndo.restore(p);
      if (restored)
        mutate(() => {
          library.projects[library.projects.indexOf(p)] = restored;
        });
      else
        flash(
          "Le récit a changé : utilisez votre sauvegarde pour restaurer une version antérieure.",
        );
    },
    "new-project": createStory,
    close: () => modal.close(),
    library: () => {
      save();
      libraryView = true;
      render();
    },
    "open-project": () =>
      mutate(() => {
        library.activeId = id!;
        libraryView = false;
        route = "overview";
        sceneId = "";
        search = "";
      }),
    demo: () =>
      mutate(() => {
        const demo = demoProject();
        library.projects.push(demo);
        library.activeId = demo.id;
        libraryView = false;
        route = "overview";
        sceneId = "";
      }),
    nav: () => {
      save();
      route = id!;
      if (route === "write") writingMode = "board";
      search = "";
      render();
      window.scrollTo(0, 0);
    },
    menu: () => document.querySelector(".sidebar")?.classList.toggle("shown"),
    "new-chapter": () => editChapter(),
    "edit-chapter": () => editChapter(id),
    "open-chapter": () => {
      if (!requireUniverse()) return;
      writingMode = "editor";
      const c = p.chapters.find((c) => c.id === id)!;
      if (!c.scenes.length) {
        mutate(() => {
          c.scenes.push(newScene());
          sceneId = c.scenes[0].id;
          route = "write";
        });
      } else {
        sceneId = c.scenes[0].id;
        route = "write";
        render();
      }
    },
    "new-scene": () =>
      mutate(() => {
        const c = p.chapters.find((c) => c.id === id) ?? currentChapter();
        if (c) {
          const all = p.chapters.flatMap((c) => c.scenes);
          const s = newScene(Math.max(0, ...all.map((s) => s.storyTime)) + 1);
          c.scenes.push(s);
          sceneId = s.id;
          route = "write";
          writingMode = "board";
        }
      }),
    "select-scene": () => {
      save();
      sceneId = id!;
      route = "write";
      writingMode = "editor";
      preview = false;
      render();
    },
    "edit-scene": () => editScene(id!),
    "toggle-preview": () => {
      save();
      preview = !preview;
      render();
    },
    "new-entity": () => editEntity(),
    "edit-entity": () => editEntity(id),
    "world-filter": () => {
      worldFilter = id!;
      render();
    },
    "event-filter": () => {
      eventFilter = id!;
      render();
    },
    "new-arc": () => editArc(),
    "edit-arc": () => editArc(id),
    "new-note": () => editNote(),
    "edit-note": () => editNote(id),
    "new-event": () => editEvent(),
    "edit-event": () => editEvent(id),
    "add-row": () => {
      readRows();
      eventRows.push({
        layer: "world",
        subject: p.entities[0]?.id ?? "",
        property: "",
        value: "",
        mode: "set",
        holder: "",
        until: "",
      });
      modal.querySelector("#event-rows")!.innerHTML = rowMarkup();
    },
    "remove-row": () => {
      readRows();
      eventRows.splice(Number(el.dataset.index), 1);
      modal.querySelector("#event-rows")!.innerHTML = rowMarkup();
    },
    "move-chapter": () => {
      modal.close();
      mutate(() =>
        move(
          p.chapters,
          p.chapters.findIndex((c) => c.id === id),
          Number(el.dataset.direction),
        ),
      );
    },
    "move-scene": () => {
      const c = p.chapters.find((c) => c.scenes.some((s) => s.id === id))!;
      modal.close();
      mutate(() =>
        move(
          c.scenes,
          c.scenes.findIndex((s) => s.id === id),
          Number(el.dataset.direction),
        ),
      );
    },
    "delete-project": () => {
      const target = library.projects.find((p) => p.id === id)!;
      confirm(
        "Supprimer cette histoire ?",
        `${e(target.title)} et tous ses textes seront retirés de ce navigateur. Exportez une sauvegarde avant de continuer.`,
        () =>
          mutate(() => {
            library.projects = library.projects.filter((x) => x.id !== id);
            if (library.activeId === id) library.activeId = null;
          }),
      );
    },
    "delete-chapter": () => {
      modal.close();
      const c = p.chapters.find((c) => c.id === id)!;
      confirm(
        "Supprimer ce chapitre ?",
        "Ses scènes et leurs événements sources seront retirés. Les notes liées redeviennent privées. Vous pourrez annuler avant votre prochaine modification.",
        () =>
          deleteWithUndo(() => {
            removeScenes(c.scenes.map((s) => s.id));
            p.chapters = p.chapters.filter((c) => c.id !== id);
          }),
      );
    },
    "delete-scene": () => {
      modal.close();
      confirm(
        "Supprimer cette scène ?",
        `« ${e(allScenes(p).find((s) => s.id === id)?.title)} » et ses ${p.events.filter((ev) => ev.source?.scene === id).length} événement(s) sources seront retirés. Les notes liées redeviennent privées. Vous pourrez annuler avant votre prochaine modification.`,
        () => deleteWithUndo(() => removeScenes([id!])),
      );
    },
    "delete-entity": () => {
      const referenced =
        p.events.some(
          (ev) =>
            [
              ...(ev.changes ?? []),
              ...(ev.beliefs ?? []),
              ...(ev.readerReveals ?? []),
            ].some((ch) => ch.subject === id) ||
            ev.beliefs?.some((b) => b.holder === id),
        ) || p.notes.some((n) => n.scope === `character:${id}`);
      if (referenced) {
        flash(
          "Cette fiche est utilisée dans la continuité ou les notes. Modifiez ces références avant de la supprimer.",
        );
        return;
      }
      modal.close();
      confirm(
        "Supprimer cette fiche ?",
        "La description sera supprimée. Le texte du manuscrit sera conservé.",
        () =>
          mutate(() => {
            p.entities = p.entities.filter((en) => en.id !== id);
            allScenes(p).forEach((s) => {
              if (s.location === id) s.location = undefined;
            });
            p.chapters
              .flatMap((c) => c.scenes)
              .forEach(
                (s) =>
                  (s.participants = s.participants?.filter((x) => x !== id)),
              );
          }),
      );
    },
    "delete-event": () => {
      modal.close();
      confirm(
        "Supprimer cet événement ?",
        "Ses effets ne seront plus appliqués dans les contextes.",
        () =>
          mutate(() => {
            p.events = p.events.filter((ev) => ev.id !== id);
            p.chapters
              .flatMap((c) => c.scenes)
              .forEach(
                (s) =>
                  (s.presentations = s.presentations?.filter(
                    (pr) => pr.event !== id,
                  )),
              );
          }),
      );
    },
    "delete-arc": () => {
      modal.close();
      confirm(
        "Supprimer cette intrigue ?",
        "Cette intention et sa résolution seront retirées du carnet.",
        () => mutate(() => removeArc(p, id!)),
      );
    },
    "delete-note": () => {
      modal.close();
      confirm(
        "Supprimer cette note ?",
        "Cette note sera retirée du carnet et des contextes.",
        () => mutate(() => (p.notes = p.notes.filter((n) => n.id !== id))),
      );
    },
    backup: () => {
      save();
      download(`${filename()}.mns.json`, JSON.stringify(p, null, 2));
      flash("Sauvegarde téléchargée. Conservez ce fichier.");
    },
    manuscript: () =>
      download(
        `${filename()}.md`,
        manuscript(p),
        "text/markdown;charset=utf-8",
      ),
    "context-export": () => {
      const s = currentScene(),
        c = currentChapter();
      if (!s || !c) return;
      const result = compile(p, {
        chapter: c.id,
        scene: s.id,
        view,
        character,
        includeDraft,
      });
      if (view === "character" && !character) {
        flash("Choisissez un personnage.");
        return;
      }
      openDialog(
        "Exporter le contexte",
        `<p>Vue ${view === "writer" ? "auteur" : view === "reader" ? "lecteur" : "personnage"} · ${e(s.title)}</p><pre class="context-preview">${e(result.markdown)}</pre>${select("Format", "format", option("md", "Markdown (.md)") + option("json", "JSON (.json)"))}`,
        "Télécharger",
        (data) => {
          const json = data.get("format") === "json";
          download(
            `context-${s.id}-${view}.${json ? "json" : "md"}`,
            json ? JSON.stringify(result.context, null, 2) : result.markdown,
            json ? "application/json" : "text/markdown;charset=utf-8",
          );
          modal.close();
        },
      );
    },
    report: () => {
      const report = p.chapters.flatMap((c) =>
        c.scenes.map((s) => ({
          chapter: c.id,
          scene: s.id,
          issues: compile(p, { chapter: c.id, scene: s.id, includeDraft: true })
            .issues,
        })),
      );
      download(
        "continuity-report.json",
        JSON.stringify(
          {
            story: p.title,
            generatedAt: new Date().toISOString(),
            scenes: report,
          },
          null,
          2,
        ),
      );
    },
    import: () => void importProject(),
    rescue: () => {
      try {
        const backup = localStorage.getItem(`${STORAGE_KEY}.backup`);
        if (backup) download("metamachia-secours.json", backup);
        else flash("Pas encore de sauvegarde précédente disponible.");
      } catch {
        flash("Stockage inaccessible.");
      }
    },
  };
  try {
    actions[action ?? ""]?.();
  } catch (error) {
    flash((error as Error).message);
  }
});
modal.addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    modalSave?.(new FormData(modal.querySelector("form")!));
  } catch (error) {
    modal.querySelector("#form-error")!.textContent = (error as Error).message;
  }
});
document.addEventListener("input", (event) => {
  const el = event.target as HTMLInputElement | HTMLTextAreaElement,
    p = project();
  if (!p) return;
  if (el.dataset.project) {
    const key = el.dataset.project;
    if (key === "targetWords") {
      if (!el.validity.valid) return;
      p.targetWords = Math.max(1, Number(el.value));
    } else if (key === "title" || key === "synopsis" || key === "genre")
      p[key] = el.value;
    changed();
  }
  if (el.dataset.scene) {
    const s = currentScene();
    if (!s) return;
    const key = el.dataset.scene;
    if (key === "title" || key === "plan" || key === "text") {
      s[key] = el.value;
      if (key === "text") {
        s.version = String(Number(s.version ?? "1") + 1);
        document.querySelector("[data-scene-words]")!.textContent =
          `${fmt(wordCount(s.text ?? ""))} mots`;
      }
      changed();
    }
  }
  if (el.id === "world-search") {
    search = el.value;
    const pos = el.selectionStart;
    render();
    const input = document.querySelector<HTMLInputElement>("#world-search")!;
    input.focus();
    input.setSelectionRange(pos, pos);
  }
});
document.addEventListener("change", (event) => {
  const el = event.target as HTMLInputElement | HTMLSelectElement;
  if (el.dataset.rowField === "layer" || el.dataset.rowField === "mode") {
    readRows();
    eventRows.forEach((r) => {
      if (r.layer === "reader" || r.mode !== "set") r.until = "";
      if (r.layer !== "belief") r.holder = "";
    });
    modal.querySelector("#event-rows")!.innerHTML = rowMarkup();
  }
  if (el.id === "timeline-zoom") {
    timelineZoom = Number(el.value);
    const left = document.querySelector(".timeline-scroll")?.scrollLeft ?? 0;
    render();
    document.querySelector(".timeline-scroll")?.scrollTo({ left });
  }
  if (el.id === "continuity-scope") {
    continuityScope = el.value;
    render();
  }
  if (el.id === "context-view") {
    view = el.value as View;
    document.querySelector("#context-container")!.innerHTML = contextPanel();
  }
  if (el.id === "context-character") {
    character = el.value;
    document.querySelector("#context-container")!.innerHTML = contextPanel();
  }
  if (el.id === "include-draft") {
    includeDraft = (el as HTMLInputElement).checked;
    if (route === "continuity") render();
    else
      document.querySelector("#context-container")!.innerHTML = contextPanel();
  }
  if (el.id === "scene-complete") {
    const s = currentScene();
    if (s)
      mutate(() => {
        s.status = (el as HTMLInputElement).checked ? "complete" : "draft";
      });
  }
});
window.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "s") {
    event.preventDefault();
    save();
    flash(saveError || "Votre histoire est enregistrée.");
  }
});
window.addEventListener("pagehide", save);
window.addEventListener("beforeunload", (event) => {
  save();
  if (dirty) {
    event.preventDefault();
    event.returnValue = "";
  }
});
window.addEventListener("storage", (event) => {
  if (event.key === STORAGE_KEY) {
    saveError =
      "La bibliothèque a changé dans un autre onglet. Exportez vos modifications avant de recharger cette page.";
    const warning = document.querySelector<HTMLElement>("#save-warning");
    if (warning) {
      warning.hidden = false;
      warning.textContent = saveError;
    }
  }
});
render();
