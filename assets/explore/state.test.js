const assert = require("assert");
const State = require("./state.js");

const storage = () => {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => {
      map.set(key, String(value));
    },
    removeItem: (key) => {
      map.delete(key);
    },
  };
};

let passed = 0;
const test = (name, fn) => {
  fn();
  passed += 1;
  process.stdout.write(`ok  ${name}\n`);
};

test("le circuit par défaut n’est pas résolu", () => {
  const flow = State.getCircuitFlow([1, 1, 0]);
  assert.strictEqual(flow.solved, false);
  assert.strictEqual(flow.powered.has("IN"), true);
  assert.strictEqual(flow.powered.has("OUT"), false);
});

test("la solution relie l’entrée à la sortie", () => {
  const flow = State.getCircuitFlow(State.CONDUCTOR_SOLUTION);
  assert.strictEqual(flow.solved, true);
  assert.strictEqual(flow.powered.has("A"), true);
  assert.strictEqual(flow.powered.has("B"), true);
  assert.strictEqual(flow.powered.has("C"), true);
  assert.strictEqual(flow.powered.has("OUT"), true);
});

test("l’énergie s’arrête aux connexions manquantes", () => {
  const flow = State.getCircuitFlow([0, 1, 2]);
  assert.strictEqual(flow.solved, false);
  assert.strictEqual(flow.powered.has("A"), true);
  assert.strictEqual(flow.powered.has("B"), false);
});

test("le circuit résolu reste acquis après un changement de branche", () => {
  let state = State.defaultState();
  state = State.rotateConductor(state, 0);
  state.conductors = State.CONDUCTOR_SOLUTION.slice();
  state.circuitSolved = true;
  const branched = State.setBranch(state, "observatory");
  assert.strictEqual(branched.reason, null);
  assert.strictEqual(branched.state.circuitSolved, true);
  const other = State.setBranch(branched.state, "archives");
  assert.strictEqual(other.state.branch, "archives");
  assert.strictEqual(other.state.circuitSolved, true);
  const locked = State.rotateConductor(other.state, 0);
  assert.deepStrictEqual(locked.conductors, State.CONDUCTOR_SOLUTION);
});

test("une branche sans alimentation est refusée", () => {
  const result = State.setBranch(State.defaultState(), "observatory");
  assert.strictEqual(result.reason, "Alimentation absente.");
});

test("les anneaux exigent la branche observatoire", () => {
  let state = State.defaultState();
  state.circuitSolved = true;
  state.branch = "archives";
  const result = State.rotateRing(state, 0);
  assert.strictEqual(result.reason, "Alimentation absente.");
});

test("l’alignement des anneaux révèle la séquence", () => {
  let state = State.defaultState();
  state.circuitSolved = true;
  state.branch = "observatory";
  state.rings = [0, 0, 7];
  const result = State.rotateRing(state, 2);
  assert.strictEqual(result.state.signalRevealed, true);
  assert.deepStrictEqual(result.state.notebook, State.GLYPH_SEQUENCE);
});

test("une saisie fausse réinitialise seulement les glyphes", () => {
  let state = State.defaultState();
  state.signalRevealed = true;
  const first = State.pressSeal(state, "noyau");
  assert.strictEqual(first.error, true);
  assert.deepStrictEqual(first.state.sealInput, []);
  assert.strictEqual(first.state.secretOpen, false);
  assert.strictEqual(first.state.signalRevealed, true);
});

test("la bonne séquence ouvre le passage", () => {
  let state = State.defaultState();
  state.signalRevealed = true;
  let result = State.pressSeal(state, "vecteur");
  result = State.pressSeal(result.state, "orion");
  result = State.pressSeal(result.state, "noyau");
  assert.strictEqual(result.opened, true);
  assert.strictEqual(result.state.secretOpen, true);
});

test("la chambre exige alimentation et autorisation", () => {
  const unpowered = State.activateChamber(State.defaultState());
  assert.strictEqual(unpowered.reason, "Alimentation absente.");
  let state = State.defaultState();
  state.circuitSolved = true;
  const unauthorized = State.activateChamber(state);
  assert.strictEqual(unauthorized.reason, "Autorisation manquante.");
});

test("la sauvegarde aller-retour conserve la progression", () => {
  const mem = storage();
  let state = State.defaultState();
  state.shutterOpen = true;
  state.circuitSolved = true;
  state.branch = "observatory";
  state.signalRevealed = true;
  state.notebook = State.GLYPH_SEQUENCE.slice();
  state.secretOpen = true;
  state.chamberAuthorized = true;
  state.location = "archives";
  assert.strictEqual(State.writeSave(state, mem), true);
  const loaded = State.readSave(mem);
  assert.strictEqual(loaded.circuitSolved, true);
  assert.strictEqual(loaded.branch, "observatory");
  assert.deepStrictEqual(loaded.notebook, State.GLYPH_SEQUENCE);
  assert.strictEqual(loaded.secretOpen, true);
  assert.strictEqual(loaded.location, "archives");
});

test("une sauvegarde corrompue ne bloque pas le jeu", () => {
  const mem = storage();
  mem.setItem(State.SAVE_KEY, "{not json");
  assert.strictEqual(State.readSave(mem), null);
  assert.strictEqual(State.createState(mem).location, "sas");
  mem.setItem(State.SAVE_KEY, JSON.stringify({ version: 99, location: "nope" }));
  assert.strictEqual(State.readSave(mem), null);
});

test("une position impossible est corrigée", () => {
  const mem = storage();
  mem.setItem(
    State.SAVE_KEY,
    JSON.stringify({
      version: 1,
      location: "alcove",
      secretOpen: false,
      shutterOpen: true,
      conductors: [9, "x", null],
      rings: [99],
    }),
  );
  const loaded = State.readSave(mem);
  assert.strictEqual(loaded.location, "archives");
  assert.strictEqual(loaded.conductors[0] >= 0 && loaded.conductors[0] <= 3, true);
  assert.strictEqual(loaded.rings.length, 3);
});

test("l’aide peut résoudre le mécanisme courant", () => {
  let state = State.defaultState();
  state = State.applyHelpSolve(state);
  assert.strictEqual(state.shutterOpen, true);
  state = State.applyHelpSolve(state);
  assert.strictEqual(state.circuitSolved, true);
  assert.deepStrictEqual(state.conductors, State.CONDUCTOR_SOLUTION);
  state = State.applyHelpSolve(state);
  assert.strictEqual(state.signalRevealed, true);
  state = State.applyHelpSolve(state);
  assert.strictEqual(state.secretOpen, true);
  state = State.applyHelpSolve(state);
  assert.strictEqual(state.chamberAuthorized, true);
  state = State.applyHelpSolve(state);
  assert.strictEqual(state.chamberActivated, true);
  assert.strictEqual(state.location, "revelation");
});

test("les retours restent possibles", () => {
  let state = State.defaultState();
  state.shutterOpen = true;
  state = State.goTo(state, "overview").state;
  state = State.goTo(state, "distributor").state;
  state = State.goBack(state);
  assert.strictEqual(state.location, "overview");
  const blocked = State.goTo(state, "chamber");
  assert.strictEqual(blocked.reason, "Alimentation absente.");
});

process.stdout.write(`\n${passed} tests ok\n`);
