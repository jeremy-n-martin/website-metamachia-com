(function (root) {
  "use strict";

  const SAVE_KEY = "metamachia.explore.v1";
  const SAVE_VERSION = 1;

  const LOCATIONS = [
    "overview",
    "sas",
    "distributor",
    "observatory",
    "archives",
    "elevator",
    "chamber",
    "alcove",
    "revelation",
  ];

  const BRANCHES = ["observatory", "archives"];
  const GLYPHS = ["orion", "vecteur", "noyau"];
  const GLYPH_SEQUENCE = ["vecteur", "orion", "noyau"];
  const CONDUCTOR_SOLUTION = [0, 0, 2];
  const RING_COUNT = 8;
  const RING_SOLUTION = [0, 0, 0];

  const DIRS = ["n", "e", "s", "w"];
  const OPP = { n: "s", e: "w", s: "n", w: "e" };

  const defaultState = () => ({
    version: SAVE_VERSION,
    location: "sas",
    previousLocation: "sas",
    viewStack: ["sas"],
    shutterOpen: false,
    conductors: [1, 1, 0],
    circuitSolved: false,
    branch: null,
    rings: [3, 6, 2],
    signalRevealed: false,
    notebook: [],
    sealInput: [],
    sealError: false,
    secretOpen: false,
    chamberAuthorized: false,
    chamberActivated: false,
    elevatorFloor: "mid",
    highlightZone: null,
  });

  const rotateDir = (dir, rot) => DIRS[(DIRS.indexOf(dir) + (rot % 4) + 4) % 4];

  const piecePorts = (type, rot) => {
    const base = type === "straight" ? ["n", "s"] : ["w", "s"];
    return base.map((dir) => rotateDir(dir, rot));
  };

  const getCircuitFlow = (conductors) => {
    const rot = [conductors[0] | 0, conductors[1] | 0, conductors[2] | 0];
    const ports = {
      A: new Set(piecePorts("bend", rot[0])),
      B: new Set(piecePorts("straight", rot[1])),
      C: new Set(piecePorts("bend", rot[2])),
    };

    const links = [
      { from: "IN", fromPort: null, to: "A", toPort: "w" },
      { from: "A", fromPort: "s", to: "B", toPort: "n" },
      { from: "B", fromPort: "s", to: "C", toPort: "n" },
      { from: "C", fromPort: "e", to: "OUT", toPort: null },
    ];

    const adj = { IN: [], A: [], B: [], C: [], OUT: [] };
    links.forEach((link) => {
      adj[link.from].push(link);
      adj[link.to].push({
        from: link.to,
        fromPort: link.toPort,
        to: link.from,
        toPort: link.fromPort,
      });
    });

    const portOk = (node, port) => {
      if (node === "IN" || node === "OUT" || !port) return true;
      return ports[node].has(port);
    };

    const powered = new Set(["IN"]);
    const queue = ["IN"];

    while (queue.length) {
      const node = queue.shift();
      adj[node].forEach((link) => {
        if (!portOk(node, link.fromPort)) return;
        if (!portOk(link.to, link.toPort)) return;
        if (powered.has(link.to)) return;
        powered.add(link.to);
        queue.push(link.to);
      });
    }

    return {
      solved: powered.has("OUT"),
      powered,
      ports: { A: [...ports.A], B: [...ports.B], C: [...ports.C] },
    };
  };

  const ringsAligned = (rings) =>
    rings.length === 3 && rings.every((value, index) => value === RING_SOLUTION[index]);

  const clampInt = (value, min, max, fallback) => {
    const n = Number(value);
    if (!Number.isInteger(n) || n < min || n > max) return fallback;
    return n;
  };

  const cloneState = (state) => JSON.parse(JSON.stringify(state));

  const sanitizeState = (raw) => {
    if (!raw || typeof raw !== "object") return null;
    if (raw.version !== SAVE_VERSION) return null;

    const base = defaultState();
    const location = LOCATIONS.includes(raw.location) ? raw.location : base.location;
    const previousLocation = LOCATIONS.includes(raw.previousLocation)
      ? raw.previousLocation
      : base.previousLocation;
    const viewStack = Array.isArray(raw.viewStack)
      ? raw.viewStack.filter((item) => LOCATIONS.includes(item))
      : base.viewStack;
    const conductors = Array.isArray(raw.conductors)
      ? [0, 1, 2].map((index) => clampInt(raw.conductors[index], 0, 3, base.conductors[index]))
      : base.conductors;
    const rings = Array.isArray(raw.rings)
      ? [0, 1, 2].map((index) => clampInt(raw.rings[index], 0, RING_COUNT - 1, base.rings[index]))
      : base.rings;
    const notebook = Array.isArray(raw.notebook)
      ? raw.notebook.filter((item) => GLYPHS.includes(item))
      : [];
    const sealInput = Array.isArray(raw.sealInput)
      ? raw.sealInput.filter((item) => GLYPHS.includes(item)).slice(0, 3)
      : [];
    const branch = BRANCHES.includes(raw.branch) ? raw.branch : null;
    const elevatorFloor = raw.elevatorFloor === "deep" ? "deep" : "mid";

    const circuitSolved = raw.circuitSolved === true || getCircuitFlow(conductors).solved;
    const signalRevealed = raw.signalRevealed === true || ringsAligned(rings);
    const secretOpen = raw.secretOpen === true;
    const chamberAuthorized = raw.chamberAuthorized === true || secretOpen;
    const chamberActivated = raw.chamberActivated === true;
    const shutterOpen = raw.shutterOpen === true || location !== "sas";

    let safeLocation = location;
    if (safeLocation === "alcove" && !secretOpen) safeLocation = "archives";
    if ((safeLocation === "chamber" || safeLocation === "revelation") && !circuitSolved) {
      safeLocation = shutterOpen ? "overview" : "sas";
    }

    return {
      version: SAVE_VERSION,
      location: safeLocation,
      previousLocation,
      viewStack: (() => {
        const stack = (viewStack.length ? viewStack : [safeLocation]).map((item) =>
          item === location ? safeLocation : item,
        );
        const filtered = stack.filter((item) => {
          if (!LOCATIONS.includes(item)) return false;
          if (item === "alcove" && !secretOpen) return false;
          if ((item === "chamber" || item === "revelation") && !circuitSolved) return false;
          return true;
        });
        return filtered.length ? filtered : [safeLocation];
      })(),
      shutterOpen,
      conductors,
      circuitSolved,
      branch: circuitSolved ? branch : null,
      rings,
      signalRevealed,
      notebook: signalRevealed ? (notebook.length ? notebook : GLYPH_SEQUENCE.slice()) : [],
      sealInput,
      sealError: false,
      secretOpen,
      chamberAuthorized: chamberAuthorized || secretOpen,
      chamberActivated,
      elevatorFloor: chamberActivated ? elevatorFloor : elevatorFloor,
      highlightZone: null,
    };
  };

  const readSave = (storage) => {
    const store = storage || (typeof localStorage === "undefined" ? null : localStorage);
    if (!store) return null;
    try {
      const raw = store.getItem(SAVE_KEY);
      if (!raw) return null;
      return sanitizeState(JSON.parse(raw));
    } catch (error) {
      return null;
    }
  };

  const writeSave = (state, storage) => {
    const store = storage || (typeof localStorage === "undefined" ? null : localStorage);
    if (!store) return false;
    try {
      const payload = {
        version: SAVE_VERSION,
        location: state.location,
        previousLocation: state.previousLocation,
        viewStack: state.viewStack,
        shutterOpen: state.shutterOpen,
        conductors: state.conductors,
        circuitSolved: state.circuitSolved,
        branch: state.branch,
        rings: state.rings,
        signalRevealed: state.signalRevealed,
        notebook: state.notebook,
        sealInput: state.sealInput,
        secretOpen: state.secretOpen,
        chamberAuthorized: state.chamberAuthorized,
        chamberActivated: state.chamberActivated,
        elevatorFloor: state.elevatorFloor,
      };
      store.setItem(SAVE_KEY, JSON.stringify(payload));
      return true;
    } catch (error) {
      return false;
    }
  };

  const clearSave = (storage) => {
    const store = storage || (typeof localStorage === "undefined" ? null : localStorage);
    if (!store) return false;
    try {
      store.removeItem(SAVE_KEY);
      return true;
    } catch (error) {
      return false;
    }
  };

  const createState = (storage) => readSave(storage) || defaultState();

  const blockedReason = (state, action) => {
    if (action === "goto-chamber" || action === "elevator-deep") {
      if (!state.circuitSolved) return "Alimentation absente.";
    }
    if (action === "rings" || action === "goto-observatory-use") {
      if (!state.circuitSolved || state.branch !== "observatory") return "Alimentation absente.";
    }
    if (action === "seal") {
      if (!state.signalRevealed) return "Signal requis.";
    }
    if (action === "chamber-control") {
      if (!state.circuitSolved) return "Alimentation absente.";
      if (!state.chamberAuthorized) return "Autorisation manquante.";
    }
    if (action === "alcove-auth" && !state.secretOpen) return "Signal requis.";
    return null;
  };

  const canVisit = (state, location) => {
    if (location === "alcove") return state.secretOpen;
    if (location === "chamber" || location === "revelation") return state.circuitSolved;
    if (location === "overview") return state.shutterOpen;
    return true;
  };

  const currentTask = (state) => {
    if (!state.shutterOpen) return "sas";
    if (!state.circuitSolved) return "distributor";
    if (!state.signalRevealed) return "observatory";
    if (!state.secretOpen) return "archives";
    if (!state.chamberAuthorized) return "alcove";
    if (!state.chamberActivated) return "chamber";
    return "complete";
  };

  const helpText = (state, level) => {
    const task = currentTask(state);
    const zone = {
      sas: {
        1: "Le sas, en bas à gauche. La commande près de la lampe.",
        2: "Actionner la commande ouvre le volet.",
        3: "Le volet du sas s’ouvre.",
      },
      distributor: {
        1: "Le distributeur, au-dessus du sas. Trois rotors conducteurs.",
        2: "Faire pivoter les rotors jusqu’à relier l’entrée à la sortie.",
        3: "Le circuit d’alimentation est refermé.",
      },
      observatory: {
        1: "L’observatoire, sur la passerelle de droite. Alimenter cette branche.",
        2: "Aligner les trois repères des anneaux sur l’axe marqué.",
        3: "Les anneaux s’alignent. Le récepteur livre la séquence.",
      },
      archives: {
        1: "Les archives, à gauche du puits. La porte scellée porte les glyphes.",
        2: "Activer les glyphes dans l’ordre du carnet.",
        3: "La porte scellée s’ouvre sur l’alcôve.",
      },
      alcove: {
        1: "L’alcôve des archives. Une commande basse.",
        2: "Actionner la commande d’autorisation.",
        3: "La chambre profonde est autorisée.",
      },
      chamber: {
        1: "Descendre par l’ascenseur jusqu’à la chambre.",
        2: "Actionner la commande principale de la machine.",
        3: "La machine se réactive.",
      },
      complete: {
        1: "Le secteur est réactivé. Le lieu reste accessible.",
        2: "Aucune manipulation requise.",
        3: "Rien de plus à résoudre.",
      },
    };
    return zone[task][level];
  };

  const applyHelpSolve = (state) => {
    const next = cloneState(state);
    const task = currentTask(next);
    next.highlightZone = null;
    if (task === "sas") {
      next.shutterOpen = true;
      return next;
    }
    if (task === "distributor") {
      next.conductors = CONDUCTOR_SOLUTION.slice();
      next.circuitSolved = true;
      return next;
    }
    if (task === "observatory") {
      next.branch = "observatory";
      next.rings = RING_SOLUTION.slice();
      next.signalRevealed = true;
      next.notebook = GLYPH_SEQUENCE.slice();
      return next;
    }
    if (task === "archives") {
      next.branch = "archives";
      next.secretOpen = true;
      next.sealInput = GLYPH_SEQUENCE.slice();
      next.location = "alcove";
      next.viewStack = ["overview", "archives", "alcove"];
      return next;
    }
    if (task === "alcove") {
      next.chamberAuthorized = true;
      next.secretOpen = true;
      next.location = "alcove";
      return next;
    }
    if (task === "chamber") {
      next.chamberActivated = true;
      next.elevatorFloor = "deep";
      next.location = "revelation";
      next.viewStack = ["overview", "chamber", "revelation"];
      return next;
    }
    return next;
  };

  const rotateConductor = (state, index) => {
    if (state.circuitSolved) return state;
    if (index < 0 || index > 2) return state;
    const next = cloneState(state);
    next.conductors[index] = (next.conductors[index] + 1) % 4;
    const flow = getCircuitFlow(next.conductors);
    if (flow.solved) next.circuitSolved = true;
    return next;
  };

  const setBranch = (state, branch) => {
    if (!state.circuitSolved) return { state, reason: "Alimentation absente." };
    if (!BRANCHES.includes(branch)) return { state, reason: null };
    const next = cloneState(state);
    next.branch = branch;
    return { state: next, reason: null };
  };

  const rotateRing = (state, index) => {
    if (!state.circuitSolved || state.branch !== "observatory") {
      return { state, reason: "Alimentation absente." };
    }
    if (index < 0 || index > 2) return { state, reason: null };
    const next = cloneState(state);
    next.rings[index] = (next.rings[index] + 1) % RING_COUNT;
    if (ringsAligned(next.rings)) {
      next.signalRevealed = true;
      next.notebook = GLYPH_SEQUENCE.slice();
    }
    return { state: next, reason: null };
  };

  const pressSeal = (state, glyph) => {
    if (!GLYPHS.includes(glyph)) return { state, opened: false, error: false, reason: null };
    if (!state.signalRevealed) return { state, opened: false, error: false, reason: "Signal requis." };
    if (state.secretOpen) return { state, opened: true, error: false, reason: null };

    const next = cloneState(state);
    next.sealError = false;
    next.sealInput = next.sealInput.concat([glyph]);
    const expected = GLYPH_SEQUENCE.slice(0, next.sealInput.length);
    const matches = next.sealInput.every((item, index) => item === expected[index]);
    if (!matches) {
      next.sealInput = [];
      next.sealError = true;
      return { state: next, opened: false, error: true, reason: null };
    }
    if (next.sealInput.length === GLYPH_SEQUENCE.length) {
      next.secretOpen = true;
      return { state: next, opened: true, error: false, reason: null };
    }
    return { state: next, opened: false, error: false, reason: null };
  };

  const authorizeChamber = (state) => {
    if (!state.secretOpen) return { state, reason: "Signal requis." };
    const next = cloneState(state);
    next.chamberAuthorized = true;
    return { state: next, reason: null };
  };

  const activateChamber = (state) => {
    const reason = blockedReason(state, "chamber-control");
    if (reason) return { state, reason };
    const next = cloneState(state);
    next.chamberActivated = true;
    return { state: next, reason: null };
  };

  const goTo = (state, location) => {
    if (!LOCATIONS.includes(location)) return { state, reason: null };
    if (!canVisit(state, location)) {
      if (location === "chamber" || location === "revelation") {
        return { state, reason: "Alimentation absente." };
      }
      if (location === "alcove") return { state, reason: "Signal requis." };
      return { state, reason: null };
    }
    const next = cloneState(state);
    next.previousLocation = next.location;
    next.location = location;
    if (location === "overview") {
      next.viewStack = ["overview"];
    } else if (location === next.viewStack[next.viewStack.length - 1]) {
      /* already there */
    } else {
      next.viewStack = next.viewStack.concat([location]).slice(-6);
    }
    if (location === "chamber" || location === "revelation") next.elevatorFloor = "deep";
    if (location === "elevator") next.elevatorFloor = "mid";
    if (location === "overview") next.elevatorFloor = next.chamberActivated ? "deep" : "mid";
    if (location === "sas" || location === "distributor" || location === "archives" || location === "observatory") {
      next.elevatorFloor = "mid";
    }
    next.highlightZone = null;
    next.sealError = false;
    return { state: next, reason: null };
  };

  const goBack = (state) => {
    const next = cloneState(state);
    if (next.viewStack.length > 1) {
      next.viewStack = next.viewStack.slice(0, -1);
      next.previousLocation = next.location;
      next.location = next.viewStack[next.viewStack.length - 1];
    } else if (next.location !== "overview" && next.shutterOpen) {
      next.previousLocation = next.location;
      next.location = "overview";
      next.viewStack = ["overview"];
    }
    next.highlightZone = null;
    return next;
  };

  const goOverview = (state) => {
    if (!state.shutterOpen) return { state, reason: null };
    return goTo(state, "overview");
  };

  const openShutter = (state) => {
    const next = cloneState(state);
    next.shutterOpen = true;
    return next;
  };

  const persistence = {
    conductors: (state) => state.conductors.slice(),
    circuitSolved: (state) => state.circuitSolved,
    branch: (state) => state.branch,
    rings: (state) => state.rings.slice(),
    signalRevealed: (state) => state.signalRevealed,
    notebook: (state) => state.notebook.slice(),
    secretOpen: (state) => state.secretOpen,
    chamberAuthorized: (state) => state.chamberAuthorized,
    chamberActivated: (state) => state.chamberActivated,
  };

  const ExploreState = {
    SAVE_KEY,
    SAVE_VERSION,
    LOCATIONS,
    BRANCHES,
    GLYPHS,
    GLYPH_SEQUENCE,
    CONDUCTOR_SOLUTION,
    RING_COUNT,
    RING_SOLUTION,
    defaultState,
    cloneState,
    sanitizeState,
    readSave,
    writeSave,
    clearSave,
    createState,
    getCircuitFlow,
    piecePorts,
    ringsAligned,
    blockedReason,
    canVisit,
    currentTask,
    helpText,
    applyHelpSolve,
    rotateConductor,
    setBranch,
    rotateRing,
    pressSeal,
    authorizeChamber,
    activateChamber,
    goTo,
    goBack,
    goOverview,
    openShutter,
    persistence,
  };

  root.ExploreState = ExploreState;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = ExploreState;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
