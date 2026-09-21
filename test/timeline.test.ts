import test from "node:test";
import assert from "node:assert/strict";
import {
  emptyTimeline,
  demoTimeline,
  insertLoop,
  entries,
  stateAt,
  deleteLoop,
  deleteCharacter,
  deleteGroup,
  parseTimeline,
  outline,
  panels,
  markdown,
  warnings,
  id,
} from "../src/timeline.js";

test("A loop has exactly four ordered phases and seven levels at most", () => {
  const t = emptyTimeline();
  assert.deepEqual(
    t.loops[0].blocks.map((b) => b.phase),
    ["E", "I", "P", "R"],
  );
  let b = t.loops[0].blocks[0];
  for (let depth = 2; depth <= 7; depth++) b = insertLoop(t, b.id).blocks[0];
  assert.equal(Math.max(...entries(t).map((e) => e.depth)), 7);
  assert.throws(() => insertLoop(t, b.id), /Sept/);
  assert.equal(entries(parseTimeline(JSON.stringify(t))).length, 28);
});
test("Marriage, birth and parenthood reconstruct backwards without repeated effects", () => {
  const t = demoTimeline(),
    all = entries(t),
    marriage =
      all.findIndex((e) =>
        e.block.effects.some(
          (f) => f.type === "relation" && f.kind === "mariage",
        ),
      ) + 1,
    birth =
      all.findIndex((e) => e.block.effects.some((f) => f.type === "presence")) +
      1;
  assert.equal(stateAt(t, 0).links.length, 1);
  assert.equal(
    stateAt(t, marriage - 1).links.some((l) => l.kind === "mariage"),
    false,
  );
  assert.equal(
    stateAt(t, marriage).links.some((l) => l.kind === "mariage"),
    true,
  );
  assert.equal(stateAt(t, birth - 1).present.has(t.characters[2].id), false);
  assert.equal(stateAt(t, birth).present.has(t.characters[2].id), true);
  assert.equal(
    stateAt(t, birth).links.filter((l) => l.kind === "parent de").length,
    2,
  );
  assert.deepEqual(stateAt(t, birth), stateAt(t, birth));
  assert.equal(stateAt(t, 0).present.size, 2);
});
test("Nested traversal consumes parent changes once before children", () => {
  const t = demoTimeline(),
    all = entries(t);
  assert.equal(all[2].depth, 2);
  assert.equal(all[6].block.phase, "P");
  const m = all[1].block.effects[0];
  all[2].block.effects.push({ ...m, id: id() });
  assert.equal(
    stateAt(t, 3).links.filter((l) => l.kind === "mariage").length,
    1,
  );
});
test("Group membership, removal, exit and directed links are explicit", () => {
  const t = demoTimeline(),
    block = t.loops[0].blocks[3],
    p = t.characters[0].id,
    q = t.characters[1].id;
  block.effects.push(
    {
      id: id(),
      type: "membership",
      person: p,
      group: t.groups[0].id,
      join: false,
    },
    { id: id(), type: "presence", person: p, present: false },
    {
      id: id(),
      type: "relation",
      from: q,
      to: p,
      kind: "amitié",
      remove: true,
    },
  );
  const result = stateAt(t, 100);
  assert.equal(result.present.has(p), false);
  assert.equal(result.groups[0].members.includes(p), false);
  assert.equal(
    result.links.some((l) => l.kind === "amitié"),
    false,
  );
  assert.equal(result.links.filter((l) => l.kind === "parent de").length, 2);
});
test("Deleting loops and characters cleans changes and references; archives permit undo", () => {
  const t = demoTimeline(),
    backup = JSON.stringify(t),
    n = entries(t).length;
  deleteLoop(t, t.loops[0].blocks[1].loops[0].id);
  assert.equal(entries(t).length, n - 4);
  deleteCharacter(t, t.characters[0].id);
  deleteGroup(t, t.groups[0].id);
  assert.doesNotThrow(() => parseTimeline(JSON.stringify(t)));
  assert.equal(entries(parseTimeline(backup)).length, n);
  deleteLoop(t, t.loops[0].id);
  assert.equal(entries(t).length, 0);
  insertLoop(t);
  assert.equal(entries(t).length, 4);
});
test("Archive rejects wrong phases, excessive nesting, duplicates and dangling references", () => {
  const mutations = [
    (t: any) => t.loops[0].blocks.reverse(),
    (t: any) => t.characters.push(t.characters[0]),
    (t: any) => t.loops[0].blocks[0].cast.push("missing"),
    (t: any) => (t.settings.panelsPerPage = 0),
    (t: any) => (t.characters[0].color = "red;position:fixed"),
    (t: any) =>
      t.loops[0].blocks[0].effects.push({ id: id(), type: "unknown" }),
    (t: any) => (t.loops[0].blocks[0].loops = null),
  ];
  mutations.forEach((m) => {
    const t = demoTimeline();
    m(t);
    assert.throws(() => parseTimeline(JSON.stringify(t)));
  });
  const t = emptyTimeline();
  let b = t.loops[0].blocks[0];
  for (let i = 0; i < 6; i++) b = insertLoop(t, b.id).blocks[0];
  b.loops.push(emptyTimeline().loops[0]);
  assert.throws(() => parseTimeline(JSON.stringify(t)));
});
test("Neutral suggestions create no facts; page compilation only includes leaf blocks", () => {
  const t = demoTimeline(),
    before = JSON.stringify(stateAt(t, 100));
  const b = t.loops[0].blocks[0];
  b.text = outline(t, b);
  assert.equal(JSON.stringify(stateAt(t, 100)), before);
  assert.equal(panels(t).length, 7);
  assert.match(markdown(t), /Page 2/);
  assert.ok(!panels(t).some((p) => p.block.id === t.loops[0].blocks[1].id));
  assert.match(
    outline(emptyTimeline(), emptyTimeline().loops[0].blocks[0]),
    /personnage principal/,
  );
});
test("Guidance distinguishes an absent character from an entry in the current block", () => {
  const t = demoTimeline();
  const b = t.loops[0].blocks[0];
  b.cast.push(t.characters[2].id);
  assert.ok(warnings(t).some((n) => n.text.includes("avant son entrée")));
  b.effects.push({
    id: id(),
    type: "presence",
    person: t.characters[2].id,
    present: true,
  });
  assert.ok(!warnings(t).some((n) => n.text.includes("avant son entrée")));
});
test("Nested loops inherit cast and place, never parent effects or text", () => {
  const t = demoTimeline(),
    parent = t.loops[0].blocks[1],
    child = insertLoop(t, parent.id);
  assert.deepEqual(child.blocks[0].cast, parent.cast);
  assert.equal(child.blocks[0].place, parent.place);
  assert.equal(child.blocks[0].effects.length, 0);
  assert.equal(child.blocks[0].text, "");
  child.blocks[0].cast.pop();
  assert.equal(parent.cast.length, 2);
});
test("Generated outlines stay marked as proposals in pages and Markdown", () => {
  const t = emptyTimeline(),
    b = t.loops[0].blocks[0];
  b.text = outline(t, b);
  b.generated = true;
  assert.equal(panels(t)[0].drafted, false);
  assert.match(markdown(t), /Proposition à écrire/);
  b.generated = false;
  assert.equal(panels(t)[0].drafted, true);
});
test("Duplicate JSON keys are rejected in the new archive too", () => {
  const raw = JSON.stringify(emptyTimeline()).replace(
    '"version":1',
    '"version":1,"version":1',
  );
  assert.throws(() => parseTimeline(raw), /dupliquée/);
});
test("Single-character prompts agree and repeated symmetric initial links are deduplicated", () => {
  const t = demoTimeline(),
    b = t.loops[0].blocks[0];
  b.cast = [t.characters[0].id];
  assert.match(outline(t, b), /Alma fait une rencontre/);
  assert.doesNotMatch(outline(t, b), /Alma se rencontrent/);
  t.links.push({
    ...t.links[0],
    id: id(),
    from: t.links[0].to,
    to: t.links[0].from,
  });
  assert.equal(stateAt(t, 0).links.length, 1);
});
