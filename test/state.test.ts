import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  demoTimeline,
  entries,
  stateAt,
  id,
  parseTimeline,
  chronology,
  timeAt,
  timeLabel,
  insertLoop,
  deleteCharacter,
  IDEAS,
  objectChoices,
} from "../src/timeline.js";
import {
  worldHtml,
  consequenceHtml,
  choiceField,
  effectDescription,
} from "../web/state-ui.js";

test("Inventory gains apply only after the passage and backwards reading restores baseline", () => {
  const t = demoTimeline(),
    c = t.characters[0],
    b = entries(t)[0].block;
  c.inventory = [{ item: "Carnet", quantity: 1 }];
  b.effects.push({
    id: id(),
    type: "inventory",
    person: c.id,
    item: "Épée légendaire",
    quantity: 1,
    operation: "gain",
  });
  const before = JSON.stringify(t);
  assert.equal(stateAt(t, 0.99).characters[0].inventory.length, 1);
  assert.equal(stateAt(t, 1).characters[0].inventory.length, 2);
  assert.equal(stateAt(t, 0).characters[0].inventory.length, 1);
  assert.equal(JSON.stringify(t), before);
  assert.deepEqual(stateAt(t, 1), stateAt(t, 1));
});
test("Transfers are atomic, quantities never go negative, missing stock is reported", () => {
  const t = demoTimeline(),
    [a, b] = t.characters,
    blocks = entries(t);
  a.inventory = [{ item: "Épée légendaire", quantity: 2 }];
  blocks[0].block.effects.push({
    id: id(),
    type: "inventory",
    person: a.id,
    to: b.id,
    item: "épée légendaire",
    quantity: 1,
    operation: "transfer",
  });
  blocks[1].block.effects.push({
    id: id(),
    type: "inventory",
    person: a.id,
    to: b.id,
    item: "Épée légendaire",
    quantity: 2,
    operation: "transfer",
  });
  const result = stateAt(t, 2);
  assert.equal(result.characters[0].inventory[0].quantity, 1);
  assert.equal(result.characters[1].inventory[0].quantity, 1);
  assert.equal(result.issues.length, 1);
  assert.equal(stateAt(t, 0).characters[0].inventory[0].quantity, 2);
  blocks[1].block.effects[1] = {
    id: id(),
    type: "inventory",
    person: a.id,
    item: "Épée légendaire",
    quantity: 1,
    operation: "loss",
  };
  assert.equal(stateAt(t, 2).characters[0].inventory.length, 0);
});
test("Properties may have arbitrary names, be replaced and become undocumented", () => {
  const t = demoTimeline(),
    c = t.characters[0],
    blocks = entries(t);
  c.properties = [{ name: "Métier", value: "Messagère" }];
  blocks[0].block.effects.push({
    id: id(),
    type: "property",
    person: c.id,
    name: "Métier",
    value: "Capitaine",
    remove: false,
  });
  blocks[1].block.effects.push({
    id: id(),
    type: "property",
    person: c.id,
    name: "Aura des songes",
    value: "Violette",
    remove: false,
  });
  blocks[2].block.effects.push({
    id: id(),
    type: "property",
    person: c.id,
    name: "Métier",
    value: "",
    remove: true,
  });
  assert.equal(stateAt(t, 1).characters[0].properties[0].value, "Capitaine");
  assert.deepEqual(stateAt(t, 3).characters[0].properties, [
    { name: "Aura des songes", value: "Violette" },
  ]);
  assert.equal(stateAt(t, 0).characters[0].properties[0].value, "Messagère");
});
test("Chronology begins at zero, durations sum in display order, children inherit default", () => {
  const t = demoTimeline();
  t.settings.chronology = {
    origin: "Le matin du départ",
    unit: "heure",
    defaultDuration: 2,
    configured: true,
  };
  entries(t)[0].block.duration = 3;
  assert.equal(timeAt(t, 0), 0);
  assert.equal(timeAt(t, 0.5), 1.5);
  assert.equal(timeAt(t, 1), 3);
  const child = insertLoop(t, t.loops[0].blocks[0].id);
  assert.equal(child.blocks[0].duration, 2);
  assert.equal(timeAt(t, 2), 5);
  assert.equal(timeLabel(t, 2), "T + 5 heures");
});
test("Old archives migrate without losing text, people or effects", () => {
  const original = demoTimeline(),
    old: any = JSON.parse(JSON.stringify(original));
  delete old.settings.chronology;
  old.settings.panelsPerPage = 4;
  const migrated = parseTimeline(JSON.stringify(old));
  assert.equal(chronology(migrated).configured, false);
  assert.equal(
    migrated.loops[0].blocks[0].text,
    original.loops[0].blocks[0].text,
  );
  assert.equal(
    stateAt(migrated, 8).links.length,
    stateAt(original, 8).links.length,
  );
  assert.ok(!("panelsPerPage" in migrated.settings));
  assert.deepEqual(migrated.characters[0].inventory, []);
});
test("Invalid quantities, properties, chronology and dangling recipients are rejected", () => {
  const base = () => {
    const t = demoTimeline();
    t.loops[0].blocks[0].effects = [
      {
        id: id(),
        type: "inventory",
        person: t.characters[0].id,
        item: "Objet libre",
        quantity: 1,
        operation: "gain",
      },
    ];
    return t;
  };
  const mutations = [
    (t: any) => (t.loops[0].blocks[0].effects[0].quantity = -1),
    (t: any) => (t.loops[0].blocks[0].effects[0].quantity = 0.5),
    (t: any) => (t.loops[0].blocks[0].duration = 0),
    (t: any) => (t.settings.chronology.unit = ""),
    (t: any) =>
      (t.characters[0].inventory = [
        { item: "Carnet", quantity: 1 },
        { item: "carnet", quantity: 2 },
      ]),
    (t: any) => {
      t.loops[0].blocks[0].effects[0].operation = "transfer";
      t.loops[0].blocks[0].effects[0].to = "missing";
    },
  ];
  mutations.forEach((m) => {
    const t = base();
    m(t);
    assert.throws(() => parseTimeline(JSON.stringify(t)));
  });
});
test("Removing a transfer recipient cleans effects and custom items survive export", () => {
  const t = demoTimeline();
  const [a, b] = t.characters;
  t.loops[0].blocks[0].effects.push({
    id: id(),
    type: "inventory",
    person: a.id,
    to: b.id,
    item: "La clé de verre",
    quantity: 1,
    operation: "transfer",
  });
  assert.ok(objectChoices(t).includes("La clé de verre"));
  const archive = JSON.stringify(t);
  deleteCharacter(t, b.id);
  assert.doesNotThrow(() => parseTimeline(JSON.stringify(t)));
  assert.equal(t.loops[0].blocks[0].effects.length, 0);
  assert.ok(objectChoices(parseTimeline(archive)).includes("La clé de verre"));
});
test("48 seeds remain local and all state HTML escapes author content", async () => {
  assert.equal(
    Object.values(IDEAS).reduce((n, v) => n + v.length, 0),
    48,
  );
  const t = demoTimeline();
  t.characters[0].inventory = [
    { item: "<img src=x onerror=alert(1)>", quantity: 1 },
  ];
  assert.doesNotMatch(worldHtml(t, 0), /<img/);
  assert.match(worldHtml(t, 0), /&lt;img/);
  const choice = choiceField(
    "Objet",
    "item",
    ["Épée légendaire"],
    "Autre objet",
  );
  assert.match(choice, /Autre — saisir/);
  assert.match(choice, /name="itemCustom"/);
  const app = await readFile("web/app.ts", "utf8");
  assert.doesNotMatch(app, /Pages & cases|function pagePreview|panelsPerPage/);
  assert.match(app, /loop-title-rail/);
});
test("Before-after exposes a gain and unchanged baseline without modifying the story", () => {
  const t = demoTimeline(),
    b = entries(t)[0].block;
  b.effects.push({
    id: id(),
    type: "inventory",
    person: t.characters[0].id,
    item: "Épée légendaire",
    quantity: 1,
    operation: "gain",
  });
  const html = consequenceHtml(t, b.id);
  assert.match(html, /Avant/);
  assert.match(html, /Inventaire : vide/);
  assert.match(html, /Épée légendaire × 1/);
  assert.match(effectDescription(t, b.effects[0]), /obtient/);
});
