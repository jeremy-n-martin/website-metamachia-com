import test from "node:test";
import assert from "node:assert/strict";
import { createProject, demoProject, parseProject } from "../src/project.js";
import { compile, validateStory } from "../src/compiler.js";
import {
  allScenes,
  universeReadiness,
  sceneEvents,
  sceneArcs,
  eventArcs,
  removeScenes,
  removeArc,
  DeletionUndo,
} from "../src/narrative.js";
import {
  narrativeTimeline,
  sceneBoard,
  eventCard,
  plotMap,
} from "../web/narrative-ui.js";

test("l’univers exige un personnage ET un lieu, sans modifier le récit", () => {
  const p = createProject("Essai"),
    text = JSON.stringify(p.chapters);
  assert.equal(universeReadiness(p).ready, false);
  p.entities.push({ id: "HERO", name: "Élise", kind: "character" });
  assert.equal(universeReadiness(p).ready, false);
  p.entities.push({ id: "GARDEN", name: "Jardin", kind: "place" });
  assert.equal(universeReadiness(p).ready, true);
  assert.equal(JSON.stringify(p.chapters), text);
});
test("les liens scène, lieu, intrigue et jalon survivent à une sauvegarde", () => {
  const p = parseProject(JSON.stringify(demoProject()));
  assert.equal(allScenes(p)[0].location, "CITY");
  assert.equal(allScenes(p)[0].beat, "setup");
  assert.deepEqual(allScenes(p)[0].arcIds, ["ARC_LETTER"]);
  assert.equal(p.events.find((ev) => ev.id === "EV_DEATH")?.milestone, true);
  assert.equal(validateStory(p).filter((i) => i.level === "error").length, 0);
});
test("une ancienne sauvegarde sans relations reste compatible", () => {
  const p = demoProject();
  allScenes(p).forEach((s) => {
    delete s.arcIds;
    delete s.location;
    delete s.beat;
  });
  p.events.forEach((ev) => {
    delete ev.arcIds;
    delete ev.milestone;
  });
  const restored = parseProject(JSON.stringify(p));
  assert.deepEqual(
    allScenes(restored).map((s) => s.text),
    allScenes(p).map((s) => s.text),
  );
  assert.equal(universeReadiness(restored).ready, true);
});
test("les événements liés sont dédupliqués et le fil est partagé", () => {
  const p = demoProject(),
    s = allScenes(p)[0],
    ev = p.events.find((ev) => ev.id === "EV_LETTER")!;
  ev.arcIds = ["ARC_LETTER"];
  assert.equal(
    sceneEvents(p, s).filter((ev) => ev.id === "EV_LETTER").length,
    1,
  );
  assert.deepEqual(eventArcs(p, ev), ["ARC_LETTER"]);
  assert.deepEqual(sceneArcs(p, s), ["ARC_LETTER"]);
});
test("suppression et annulation restaurent texte, sources, révélations, notes et liens", () => {
  const p = demoProject(),
    undo = new DeletionUndo();
  p.notes.push({
    id: "NOTE_LATE",
    scope: "reader",
    text: "Secret tardif",
    revealedIn: "SC_B",
  });
  p.events.find((ev) => ev.id === "EV_LETTER")!.revealedIn = "SC_B";
  const before = structuredClone(p);
  undo.capture(p, () => removeScenes(p, ["SC_B"]));
  assert.equal(
    p.events.some((ev) => ev.id === "EV_DEATH"),
    false,
  );
  assert.equal(p.notes.find((n) => n.id === "NOTE_LATE")!.scope, "author");
  assert.equal(
    p.events.find((ev) => ev.id === "EV_LETTER")!.revealedIn,
    undefined,
  );
  assert.equal(validateStory(p).filter((i) => i.level === "error").length, 0);
  assert.deepEqual(undo.restore(p), before);
  assert.equal(undo.available(p), false);
});
test("annuler une suppression ne peut pas écraser une édition ultérieure", () => {
  const p = demoProject(),
    undo = new DeletionUndo();
  undo.capture(p, () => removeScenes(p, ["SC_C"]));
  allScenes(p)[0].text += " Une phrase nouvelle.";
  assert.equal(undo.available(p), false);
  assert.equal(undo.restore(p), undefined);
});
test("les références d’intrigue invalides et les faux lieux sont refusés", () => {
  const p = demoProject();
  allScenes(p)[0].arcIds = ["MISSING"];
  assert.throws(() => parseProject(JSON.stringify(p)), /Intrigue absente/);
  allScenes(p)[0].arcIds = [];
  allScenes(p)[0].location = "LINETTE";
  assert.throws(
    () => parseProject(JSON.stringify(p)),
    /Lieu absent ou invalide/,
  );
});
test("retirer une intrigue nettoie ses liens mais conserve le manuscrit et les faits", () => {
  const p = demoProject(),
    text = allScenes(p).map((s) => s.text),
    count = p.events.length;
  p.events[0].arcIds = ["ARC_LETTER"];
  removeArc(p, "ARC_LETTER");
  assert.deepEqual(
    allScenes(p).map((s) => s.text),
    text,
  );
  assert.equal(p.events.length, count);
  assert.equal(validateStory(p).filter((i) => i.level === "error").length, 0);
});
test("le marquage macro et les liens éditoriaux ne changent jamais le canon", () => {
  const p = demoProject(),
    query = { chapter: "CH_A", scene: "SC_A", view: "writer" as const };
  const before = compile(p, query).context.facts;
  p.events.forEach((ev) => {
    ev.milestone = !ev.milestone;
    ev.arcIds = ["ARC_LETTER"];
  });
  allScenes(p)[0].beat = "resolution";
  assert.deepEqual(compile(p, query).context.facts, before);
});

test("la frise macro contient des chapitres et des jalons, pas des cartes de scène", () => {
  const p = demoProject();
  const html = narrativeTimeline(p, "CH_A", "reading", 1);
  assert.equal((html.match(/class="time-chapter /g) ?? []).length, 2);
  assert.doesNotMatch(html, /data-action="inspect-scene"/);
  assert.match(html, /La mort du roi/);
  assert.doesNotMatch(html, /Linette croit le roi vivant/);
  const story = narrativeTimeline(p, "CH_A", "story", 1);
  assert.ok(story.indexOf('data-id="CH_B"') < story.indexOf('data-id="CH_A"'));
  assert.ok(html.indexOf('data-id="CH_A"') < html.indexOf('data-id="CH_B"'));
});
test("les interfaces échappent le texte libre et exposent les actions explicites", () => {
  const p = demoProject();
  p.chapters[0].title = '<script>alert("x")</script>';
  allScenes(p)[0].title = "<img src=x onerror=alert(1)>";
  p.events[0].title = "<svg onload=alert(1)>";
  for (const html of [
    narrativeTimeline(p, "CH_A", "story", 1),
    sceneBoard(p),
    eventCard(p, p.events[0]),
    plotMap(p),
  ]) {
    assert.doesNotMatch(html, /<script>|<img src=x|<svg onload/);
  }
  assert.match(sceneBoard(p), /data-action="delete-scene"/);
  assert.match(sceneBoard(p), /Ajouter une scène/);
});
test("le contexte auteur relie l’univers et l’intrigue sans fuite lecteur/personnage", () => {
  const p = demoProject();
  const writer = compile(p, { chapter: "CH_A", scene: "SC_A", view: "writer" });
  assert.equal(writer.context.narrative?.location?.id, "CITY");
  assert.equal(writer.context.narrative?.arcs[0]?.id, "ARC_LETTER");
  assert.match(writer.markdown, /Repères éditoriaux/);
  assert.ok(writer.markdown.includes(p.arcs[0].resolution));
  for (const view of ["reader", "character"] as const) {
    const result = compile(p, {
      chapter: "CH_A",
      scene: "SC_A",
      view,
      character: "LINETTE",
    });
    assert.equal(result.context.narrative, undefined);
    assert.ok(!JSON.stringify(result.context).includes(p.arcs[0].resolution));
    assert.ok(!result.markdown.includes(p.arcs[0].resolution));
  }
});
