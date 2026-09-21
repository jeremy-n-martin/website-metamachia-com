import test from "node:test";
import assert from "node:assert/strict";
import { linetteTimeline } from "../src/linette-example.js";
import { entries, parseTimeline, stateAt, markdown } from "../src/timeline.js";
test("Linette example round-trips with filled recursive blocks and source references", () => {
  const t = linetteTimeline(),
    all = entries(t);
  assert.deepEqual(parseTimeline(JSON.stringify(t)), t);
  assert.equal(all.length, 24);
  assert.ok(all.some((e) => e.depth === 2));
  assert.ok(
    all.every(
      (e) =>
        e.block.cast.length &&
        e.block.place &&
        e.block.text.includes("Source : histoire prod.pdf"),
    ),
  );
  assert.equal(t.settings.chronology?.unit, "repère");
  assert.ok(markdown(t).includes("Fin de l’extrait"));
});
test("Linette gets the rescue card once, reversibly, without an invented resurrection", () => {
  const t = linetteTimeline(),
    all = entries(t),
    lin = t.characters.find((c) => c.name === "Linette")!,
    guide = t.characters.find((c) => c.name === "Le gobelin accompagnateur")!;
  const index = all.findIndex((e) =>
    e.block.effects.some((f) => f.type === "inventory"),
  );
  const inventory = (n: number) =>
    stateAt(t, n).characters.find((c) => c.id === lin.id)!.inventory;
  assert.ok(!inventory(index).some((i) => i.item === "Carte de secours"));
  assert.equal(
    inventory(index + 1).find((i) => i.item === "Carte de secours")?.quantity,
    1,
  );
  const end = stateAt(t, all.length);
  assert.equal(end.issues.length, 0);
  assert.equal(
    end.characters
      .find((c) => c.id === guide.id)!
      .properties.find((p) => p.name === "État vital")?.value,
    "Mort annoncé par le diablotin",
  );
  assert.ok(!inventory(0).some((i) => i.item === "Carte de secours"));
  assert.ok(
    !end.characters
      .find((c) => c.id === guide.id)!
      .properties.some((p) => p.value.includes("Pétrifié")),
  );
});
