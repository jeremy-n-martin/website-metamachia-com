import test from "node:test";
import assert from "node:assert/strict";
import { compile } from "../src/compiler.js";
import {
  createProject,
  demoProject,
  LibraryStore,
  manuscript,
  parseArchive,
  parseProject,
  STORAGE_KEY,
} from "../src/project.js";
import { parseJson } from "../src/json.js";
import { loadStory } from "../src/io.js";
import { Project } from "../src/model.js";

function base(): Project {
  const p = createProject("Test");
  p.entities = [
    { id: "L", name: "Linette", kind: "character" },
    { id: "K", name: "Roi", kind: "character" },
  ];
  p.chapters = [
    {
      id: "CH",
      scenes: [
        { id: "S1", storyTime: 10, version: "1" },
        { id: "S2", storyTime: 30, version: "1" },
        { id: "FLASH", storyTime: 5, version: "1" },
        { id: "END", storyTime: 50, version: "1" },
      ],
    },
  ];
  return p;
}
const run = (p: Project, scene = "S2", options = {}) =>
  compile(p, { chapter: "CH", scene, ...options });
test("free properties, durable transformation and open-world unknowns", () => {
  const p = base();
  p.events = [
    {
      id: "E1",
      title: "Avant",
      storyTime: 1,
      changes: [{ subject: "L", property: "nature", value: "vivante" }],
    },
    {
      id: "E2",
      title: "Transformation",
      storyTime: 20,
      changes: [
        { subject: "L", property: "nature", value: "morte-vivante" },
        { subject: "L", property: "couleurMagique", value: { yeux: "or" } },
      ],
    },
  ];
  assert.equal(run(p, "S1").context.facts["L.nature"], "vivante");
  assert.equal(run(p).context.facts["L.nature"], "morte-vivante");
  assert.equal(run(p).state.facts.has("L.respire"), false);
  assert.deepEqual(run(p).context.facts["L.couleurMagique"], { yeux: "or" });
  assert.equal(run(p).issues.length, 0);
});
test("flashback reconstructs at story time and does not copy the preceding scene state", () => {
  const p = base();
  p.events = [
    {
      id: "E",
      storyTime: 20,
      title: "Mort",
      changes: [{ subject: "K", property: "vivant", value: false }],
    },
  ];
  assert.equal(run(p).state.facts.get("K.vivant"), false);
  assert.equal(run(p, "FLASH").state.facts.has("K.vivant"), false);
});
test("a character's false belief survives reality and neither export leaks truth or author notes", () => {
  const p = base();
  p.events = [
    {
      id: "E",
      title: "Secret",
      storyTime: 1,
      changes: [
        { subject: "K", property: "vivant", value: false },
        { subject: "K", property: "secret", value: "TRAITRE" },
      ],
      beliefs: [{ holder: "L", subject: "K", property: "vivant", value: true }],
    },
  ];
  p.notes = [{ id: "N", scope: "author", text: "SECRET AUTEUR" }];
  const r = run(p, "S2", { view: "character", character: "L" });
  assert.equal(r.context.facts["K.vivant"], true);
  assert.equal(r.context.facts["K.secret"], undefined);
  assert.doesNotMatch(r.markdown, /TRAITRE|SECRET AUTEUR|false/);
  assert.doesNotMatch(
    JSON.stringify(r.context),
    /TRAITRE|SECRET AUTEUR|appliedEvents/,
  );
  assert.equal(run(p).state.facts.get("K.vivant"), false);
});
test("reader revelations follow scene presentation order, even when story time goes backwards", () => {
  const p = base();
  p.events = [
    {
      id: "E",
      title: "Mort secrète",
      storyTime: 1,
      changes: [{ subject: "K", property: "vivant", value: false }],
      readerReveals: [{ subject: "K", property: "vivant", value: false }],
      revealedIn: "FLASH",
    },
  ];
  assert.deepEqual(run(p, "S2", { view: "reader" }).context.facts, {});
  assert.equal(
    run(p, "FLASH", { view: "reader" }).context.facts["K.vivant"],
    false,
  );
  assert.equal(run(p, "FLASH").state.beliefs.size, 0);
});
test("repeated presentations apply a collection effect once", () => {
  const p = base();
  p.events = [
    {
      id: "E",
      title: "Acquisition",
      storyTime: 1,
      changes: [
        { subject: "L", property: "inventaire", mode: "add", value: "clé" },
      ],
    },
  ];
  p.chapters[0].scenes.forEach(
    (s) => (s.presentations = [{ scene: s.id, event: "E" }]),
  );
  const r = run(p, "END");
  assert.deepEqual(r.state.facts.get("L.inventaire"), ["clé"]);
  assert.deepEqual(r.state.applied, ["E"]);
});
test("draft facts feed later scenes only when selected, not flashbacks or earlier scenes", () => {
  const p = base();
  p.events = [
    {
      id: "D",
      title: "Sac perdu",
      storyTime: 10,
      status: "draft",
      source: { chapter: "CH", scene: "S1", version: "1" },
      changes: [{ subject: "L", property: "sac", value: "perdu" }],
    },
  ];
  assert.equal(run(p).state.facts.has("L.sac"), false);
  assert.equal(
    run(p, "S2", { includeDraft: true }).state.facts.get("L.sac"),
    "perdu",
  );
  assert.equal(
    run(p, "FLASH", { includeDraft: true }).state.facts.has("L.sac"),
    false,
  );
  p.events[0].source!.scene = "S2";
  assert.equal(
    run(p, "S1", { includeDraft: true }).state.facts.has("L.sac"),
    false,
  );
});
test("plan never becomes reality, even in draft mode", () => {
  const p = base();
  p.events = [
    {
      id: "P",
      title: "Intention",
      storyTime: 1,
      status: "plan",
      changes: [{ subject: "K", property: "vivant", value: false }],
    },
  ];
  assert.equal(run(p, "S2", { includeDraft: true }).state.facts.size, 0);
});
test("temporary fact expires without restoring an old value", () => {
  const p = base();
  p.events = [
    {
      id: "OLD",
      title: "Avant",
      storyTime: 1,
      changes: [{ subject: "L", property: "statut", value: "normal" }],
    },
    {
      id: "TEMP",
      title: "Masque",
      storyTime: 10,
      changes: [
        { subject: "L", property: "statut", value: "invisible", until: 40 },
      ],
    },
  ];
  assert.equal(run(p, "S2").state.facts.get("L.statut"), "invisible");
  assert.equal(run(p, "END").state.facts.has("L.statut"), false);
});
test("expiry never erases a newer explicit state", () => {
  const p = base();
  p.events = [
    {
      id: "T",
      title: "Temporaire",
      storyTime: 1,
      changes: [
        { subject: "L", property: "statut", value: "masqué", until: 40 },
      ],
    },
    {
      id: "NEW",
      title: "Évolution",
      storyTime: 20,
      changes: [{ subject: "L", property: "statut", value: "transformée" }],
    },
  ];
  assert.equal(run(p, "END").state.facts.get("L.statut"), "transformée");
});
test("simultaneous contradiction is unknown and invariant under loading order", () => {
  const p = base();
  p.events = [
    {
      id: "A",
      title: "A",
      storyTime: 10,
      changes: [{ subject: "K", property: "vivant", value: true }],
    },
    {
      id: "B",
      title: "B",
      storyTime: 10,
      changes: [{ subject: "K", property: "vivant", value: false }],
    },
  ];
  const a = run(p);
  p.events.reverse();
  const b = run(p);
  assert.ok(a.issues.some((i) => i.code === "CONFLICT"));
  assert.equal(a.state.facts.has("K.vivant"), false);
  assert.deepEqual(a.context, b.context);
});
test("scoped Markdown respects reader disclosure and character identity", () => {
  const p = base();
  p.notes = [
    { id: "A", scope: "author", text: "SECRET_A" },
    { id: "R", scope: "reader", text: "SECRET_R", revealedIn: "FLASH" },
    { id: "L_NOTE", scope: "character:L", text: "LINETTE_ONLY" },
    { id: "K_NOTE", scope: "character:K", text: "KING_ONLY" },
  ];
  assert.doesNotMatch(run(p, "S2", { view: "reader" }).markdown, /SECRET/);
  assert.match(run(p, "FLASH", { view: "reader" }).markdown, /SECRET_R/);
  assert.doesNotMatch(
    run(p, "FLASH", { view: "reader" }).markdown,
    /SECRET_A|ONLY/,
  );
  assert.match(
    run(p, "S2", { view: "character", character: "L" }).markdown,
    /LINETTE_ONLY/,
  );
  assert.doesNotMatch(
    run(p, "S2", { view: "character", character: "L" }).markdown,
    /KING_ONLY/,
  );
});
test("collection transfer removes from one subject and adds to another", () => {
  const p = base();
  p.events = [
    {
      id: "A",
      title: "Clé",
      storyTime: 1,
      changes: [
        { subject: "L", property: "inventaire", mode: "add", value: "clé" },
      ],
    },
    {
      id: "B",
      title: "Don",
      storyTime: 20,
      changes: [
        { subject: "L", property: "inventaire", mode: "remove", value: "clé" },
        { subject: "K", property: "inventaire", mode: "add", value: "clé" },
      ],
    },
  ];
  assert.deepEqual(run(p).context.facts["L.inventaire"], []);
  assert.deepEqual(run(p).context.facts["K.inventaire"], ["clé"]);
});
test("duplicate identifiers are errors, not silently reused occurrences", () => {
  const p = base();
  p.events = [
    { id: "E", title: "a", storyTime: 1 },
    { id: "E", title: "b", storyTime: 2 },
  ];
  assert.ok(run(p).issues.some((i) => i.code === "DUPLICATE_ID"));
});
test("editing the source marks extracted facts for review", () => {
  const p = base();
  p.events = [
    {
      id: "E",
      title: "Changement",
      storyTime: 1,
      source: { chapter: "CH", scene: "S1", version: "1" },
    },
  ];
  p.chapters[0].scenes[0].version = "2";
  assert.ok(run(p).issues.some((i) => i.code === "STALE_SOURCE"));
});
test("demo exercises false belief, hidden truth and reader flashback", () => {
  const p = demoProject();
  const a = compile(p, { chapter: "CH_A", scene: "SC_A", view: "reader" });
  assert.equal(a.context.facts["KING.vivant"], undefined);
  assert.equal(a.issues.length, 0);
  const b = compile(p, { chapter: "CH_B", scene: "SC_B", view: "reader" });
  assert.equal(b.context.facts["KING.vivant"], false);
  const c = compile(p, {
    chapter: "CH_B",
    scene: "SC_C",
    view: "character",
    character: "LINETTE",
  });
  assert.equal(c.context.facts["KING.vivant"], true);
});
test("complete project backup round-trips manuscript, notes, arcs and continuity", () => {
  const p = demoProject();
  const restored = parseProject(JSON.stringify(p));
  assert.equal(manuscript(restored), manuscript(p));
  assert.deepEqual(
    compile(restored, { chapter: "CH_B", scene: "SC_B" }).context,
    compile(p, { chapter: "CH_B", scene: "SC_B" }).context,
  );
  assert.deepEqual(restored.arcs, p.arcs);
});
test("malformed import and invalid references are rejected before saving", () => {
  assert.throws(() => parseProject('{"format":"mns-web","version":1}'));
  const p = demoProject();
  (p.events[0] as unknown as { changes: string }).changes = "bad";
  assert.throws(() => parseProject(JSON.stringify(p)));
  const q = demoProject();
  q.events[0].changes![0].subject = "MISSING";
  assert.throws(() => parseProject(JSON.stringify(q)), /absente/);
});
function memory() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, v);
    },
    map,
  };
}
test("autosave survives a new session and keeps an earlier snapshot", () => {
  const storage = memory();
  const store = new LibraryStore(storage);
  const p = demoProject();
  store.save({ projects: [p], activeId: p.id });
  p.title = "Edited";
  store.save({ projects: [p], activeId: p.id });
  assert.equal(new LibraryStore(storage).load().projects[0].title, "Edited");
  assert.ok(
    storage.getItem(`${STORAGE_KEY}.backup`)?.includes("Les lettres de l’aube"),
  );
});
test("simultaneous browser sessions cannot overwrite each other's latest work", () => {
  const storage = memory();
  const a = new LibraryStore(storage),
    b = new LibraryStore(storage);
  const p = demoProject();
  a.save({ projects: [p], activeId: p.id });
  assert.throws(() => b.save({ projects: [], activeId: null }), /autre onglet/);
  assert.equal(new LibraryStore(storage).load().projects.length, 1);
});
test("a failed storage write preserves the committed project", () => {
  const storage = memory();
  const p = demoProject();
  const a = new LibraryStore(storage);
  a.save({ projects: [p], activeId: p.id });
  const original = storage.getItem(STORAGE_KEY);
  storage.setItem = () => {
    throw Error("QuotaExceeded");
  };
  p.title = "Unsaved";
  assert.throws(() => a.save({ projects: [p], activeId: p.id }), /Quota/);
  assert.equal(storage.getItem(STORAGE_KEY), original);
});
test("opening corrupt storage fails without resetting it", () => {
  const storage = memory();
  storage.setItem(STORAGE_KEY, "{broken");
  assert.throws(() => new LibraryStore(storage).load());
  assert.equal(storage.getItem(STORAGE_KEY), "{broken");
});
test("rescue library backup imports every project", () => {
  const p = demoProject(),
    q = createProject("Autre histoire");
  assert.equal(
    parseArchive(JSON.stringify({ projects: [p, q], activeId: p.id })).length,
    2,
  );
});
test("duplicate JSON keys, including escaped names, are rejected", () => {
  assert.throws(() => parseJson('{"id":"a","id":"b"}'), /dupliquée/);
  assert.throws(() => parseJson('{"id":"a","\\u0069d":"b"}'), /dupliquée/);
  assert.deepEqual(parseJson('{"a":{"id":1},"b":{"id":2},"list":[{"id":3}]}'), {
    a: { id: 1 },
    b: { id: 2 },
    list: [{ id: 3 }],
  });
});
test("local source loader excludes plans from chapter records", async () => {
  const s = await loadStory("story");
  assert.equal(s.chapters.length, 2);
  assert.ok(s.chapters.every((c) => c.id && Array.isArray(c.scenes)));
});
