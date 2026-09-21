(function () {
  "use strict";

  const State = globalThis.ExploreState;
  const Svg = globalThis.ExploreSvg;
  const root = document.getElementById("explore-root");
  if (!State || !Svg || !root) return;

  const LOCATION_LABELS = {
    overview: "Coupe",
    sas: "Sas",
    distributor: "Distributeur",
    observatory: "Observatoire",
    archives: "Archives",
    elevator: "Ascenseur",
    chamber: "Chambre",
    alcove: "Alcôve",
    revelation: "Secteur",
  };

  const HITS_BY_LOCATION = {
    overview: [
      "goto-sas",
      "goto-distributor",
      "goto-archives",
      "goto-observatory",
      "goto-elevator",
      "goto-chamber",
    ],
    sas: ["sas-control", "goto-overview", "goto-distributor"],
    distributor: [
      "conductor-0",
      "conductor-1",
      "conductor-2",
      "branch-archives",
      "branch-observatory",
      "goto-sas",
      "goto-elevator",
      "goto-archives",
    ],
    observatory: ["ring-0", "ring-1", "ring-2", "goto-elevator", "goto-archives"],
    archives: [
      "seal-orion",
      "seal-vecteur",
      "seal-noyau",
      "terminal",
      "goto-alcove",
      "goto-distributor",
      "goto-elevator",
    ],
    elevator: ["elevator-mid", "elevator-deep", "goto-distributor", "goto-chamber"],
    chamber: ["chamber-control", "goto-elevator", "goto-overview"],
    alcove: ["alcove-auth", "goto-archives"],
    revelation: ["goto-overview", "goto-chamber", "goto-elevator"],
  };

  const ACTION_ZONE = {
    "sas-control": "sas",
    "goto-sas": "sas",
    "conductor-0": "distributor",
    "conductor-1": "distributor",
    "conductor-2": "distributor",
    "branch-archives": "distributor",
    "branch-observatory": "distributor",
    "goto-distributor": "distributor",
    "ring-0": "observatory",
    "ring-1": "observatory",
    "ring-2": "observatory",
    "goto-observatory": "observatory",
    "seal-orion": "archives",
    "seal-vecteur": "archives",
    "seal-noyau": "archives",
    terminal: "archives",
    "goto-archives": "archives",
    "goto-alcove": "alcove",
    "alcove-auth": "alcove",
    "goto-elevator": "elevator",
    "elevator-mid": "elevator",
    "elevator-deep": "chamber",
    "goto-chamber": "chamber",
    "chamber-control": "chamber",
    "goto-overview": "overview",
  };

  const reducedMotion = () =>
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const escapeHtml = (value) =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");

  const atlas = globalThis.METAMACHIA_DATA || null;

  let state = State.createState();
  let showHits = false;
  let cameraTimer = 0;
  let toastTimer = 0;
  let pendingReveal = false;

  const shell = () => `
    <div class="explore-shell">
      <a class="skip-link" href="#stage">Aller à l’installation</a>
      <header class="hud-top">
        <a class="hud-brand" href="../index.html">METAMACHIA</a>
        <p class="hud-place" id="hud-place"></p>
        <nav class="hud-links" aria-label="Contenus du site">
          <a href="../index.html#atlas">Atlas</a>
          <a href="../index.html#parcours">Parcours</a>
          <a href="../index.html#methode">Méthode</a>
        </nav>
      </header>
      <div id="stage" class="stage" tabindex="-1"></div>
      <div class="hud-bottom">
        <button type="button" class="hud-btn" data-ui="overview">Vue d’ensemble</button>
        <button type="button" class="hud-btn" data-ui="back">Retour</button>
        <button type="button" class="hud-btn" data-ui="help" aria-expanded="false">Aide</button>
        <button type="button" class="hud-btn" data-ui="hits" aria-pressed="false">Afficher les interactions</button>
        <button type="button" class="hud-btn" data-ui="notebook" aria-expanded="false">Carnet</button>
      </div>
      <p class="toast" id="toast" role="status" aria-live="polite"></p>
      <p class="finale-line" id="finale-line" hidden>Un secteur répond.</p>
      <div class="panel" id="panel-help" hidden role="dialog" aria-labelledby="help-title">
        <div class="panel-card">
          <h2 id="help-title">Aide</h2>
          <p class="panel-lead" id="help-lead"></p>
          <div class="panel-actions">
            <button type="button" data-help="1">Indiquer la zone</button>
            <button type="button" data-help="2">Expliquer</button>
            <button type="button" data-help="3">Résoudre</button>
          </div>
          <button type="button" class="panel-reset" data-ui="reset">Réinitialiser l’exploration</button>
          <button type="button" class="panel-close" data-ui="close">Fermer</button>
        </div>
      </div>
      <div class="panel" id="panel-notebook" hidden role="dialog" aria-labelledby="notebook-title">
        <div class="panel-card">
          <h2 id="notebook-title">Carnet</h2>
          <div id="notebook-body"></div>
          <button type="button" class="panel-close" data-ui="close">Fermer</button>
        </div>
      </div>
      <div class="panel" id="panel-terminal" hidden role="dialog" aria-labelledby="terminal-title">
        <div class="panel-card panel-wide">
          <h2 id="terminal-title">Terminal des archives</h2>
          <div id="terminal-body"></div>
          <button type="button" class="panel-close" data-ui="close">Fermer</button>
        </div>
      </div>
      <div class="panel" id="panel-reset" hidden role="dialog" aria-labelledby="reset-title">
        <div class="panel-card">
          <h2 id="reset-title">Réinitialiser</h2>
          <p>Effacer la sauvegarde de cette exploration ?</p>
          <div class="panel-actions">
            <button type="button" data-ui="close">Annuler</button>
            <button type="button" class="danger" data-ui="reset-confirm">Effacer</button>
          </div>
        </div>
      </div>
    </div>
  `;

  root.innerHTML = shell();
  const stage = document.getElementById("stage");
  stage.innerHTML = Svg.build();
  const svg = document.getElementById("installation");
  const world = svg.querySelector(".world");

  const hudPlace = document.getElementById("hud-place");
  const toastEl = document.getElementById("toast");
  const finaleEl = document.getElementById("finale-line");
  const notebookBody = document.getElementById("notebook-body");
  const terminalBody = document.getElementById("terminal-body");
  const helpLead = document.getElementById("help-lead");

  const viewBoxOf = (view) => `${view.x} ${view.y} ${view.w} ${view.h}`;

  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

  const animateViewBox = (target, duration) => {
    const ms = reducedMotion() ? 0 : duration;
    const next = viewBoxOf(target);
    window.cancelAnimationFrame(cameraTimer);
    if (!ms) {
      svg.setAttribute("viewBox", next);
      return;
    }
    const box = svg.viewBox.baseVal;
    const from = { x: box.x, y: box.y, w: box.width, h: box.height };
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / ms);
      const k = ease(t);
      const x = from.x + (target.x - from.x) * k;
      const y = from.y + (target.y - from.y) * k;
      const w = from.w + (target.w - from.w) * k;
      const h = from.h + (target.h - from.h) * k;
      svg.setAttribute("viewBox", `${x} ${y} ${w} ${h}`);
      if (t < 1) cameraTimer = window.requestAnimationFrame(step);
    };
    cameraTimer = window.requestAnimationFrame(step);
  };

  const showToast = (message) => {
    toastEl.textContent = message || "";
    toastEl.classList.toggle("is-on", Boolean(message));
    window.clearTimeout(toastTimer);
    if (message) {
      toastTimer = window.setTimeout(() => {
        toastEl.classList.remove("is-on");
        toastEl.textContent = "";
      }, 2800);
    }
  };

  const closePanels = () => {
    document.querySelectorAll(".panel").forEach((panel) => {
      panel.hidden = true;
    });
    document.querySelectorAll("[data-ui='help'], [data-ui='notebook']").forEach((button) => {
      button.setAttribute("aria-expanded", "false");
    });
  };

  const openPanel = (id) => {
    closePanels();
    const panel = document.getElementById(id);
    panel.hidden = false;
    const closeBtn = panel.querySelector(".panel-close, [data-ui='close']");
    if (closeBtn) closeBtn.focus();
  };

  const glyphSvg = (name) =>
    `<svg class="glyph" viewBox="0 0 32 32" aria-hidden="true"><path d="${Svg.GLYPH_PATHS[name]}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="square"/></svg>`;

  const renderNotebook = () => {
    if (!state.notebook.length) {
      notebookBody.innerHTML = "<p>Aucune séquence relevée.</p>";
      return;
    }
    notebookBody.innerHTML = `
      <p>Séquence du récepteur</p>
      <ol class="glyph-row">
        ${state.notebook.map((name) => `<li>${glyphSvg(name)}<span>${escapeHtml(name)}</span></li>`).join("")}
      </ol>`;
  };

  const renderTerminal = () => {
    if (!atlas) {
      terminalBody.innerHTML = "<p>Aucune archive liée.</p>";
      return;
    }
    const concepts = atlas.concepts
      .map(
        (concept) =>
          `<article class="archive-item"><h3>${escapeHtml(concept.title)}</h3><p>${escapeHtml(concept.definition)}</p></article>`,
      )
      .join("");
    const documents = atlas.documents
      .map(
        (document) =>
          `<article class="archive-item"><h3>${escapeHtml(document.title)}</h3><p>${escapeHtml(document.thesis)}</p></article>`,
      )
      .join("");
    terminalBody.innerHTML = `
      <p class="panel-lead">Accès direct aux objets démo du site.</p>
      <p class="micro">Concepts</p>
      ${concepts}
      <p class="micro">Parcours</p>
      ${documents}
      <p><a href="../index.html#atlas">Ouvrir l’atlas</a></p>`;
  };

  const applyHits = () => {
    const allowed = new Set(HITS_BY_LOCATION[state.location] || []);
    svg.querySelectorAll(".hit").forEach((node) => {
      const id = node.getAttribute("data-interactive");
      let on = allowed.has(id);
      if (id === "goto-alcove" || id === "alcove-auth") on = on && state.secretOpen;
      if (id === "goto-overview") on = on && state.shutterOpen;
      node.classList.toggle("is-off", !on);
      node.setAttribute("tabindex", on ? "0" : "-1");
      node.setAttribute("aria-hidden", on ? "false" : "true");
    });
  };

  const applyWorld = () => {
    world.classList.toggle("is-shutter-open", state.shutterOpen);
    world.classList.toggle("is-circuit-solved", state.circuitSolved);
    world.classList.toggle("is-branch-observatory", state.branch === "observatory");
    world.classList.toggle("is-branch-archives", state.branch === "archives");
    world.classList.toggle("is-signal-revealed", state.signalRevealed);
    world.classList.toggle("is-secret-open", state.secretOpen);
    world.classList.toggle("is-chamber-authorized", state.chamberAuthorized);
    world.classList.toggle("is-chamber-active", state.chamberActivated);
    world.classList.toggle("is-powered", state.circuitSolved);
    world.classList.toggle("show-hits", showHits);
    world.classList.toggle("has-highlight", Boolean(state.highlightZone));
    world.setAttribute("data-highlight", state.highlightZone || "");
    world.setAttribute("data-location", state.location);

    const flow = State.getCircuitFlow(state.conductors);
    svg.querySelectorAll("[data-flow]").forEach((node) => {
      const key = node.getAttribute("data-flow");
      let live = false;
      if (key === "IN") live = flow.powered.has("A");
      else if (key === "A") live = flow.powered.has("B");
      else if (key === "B") live = flow.powered.has("C");
      else if (key === "OUT") live = flow.powered.has("OUT");
      else if (key === "archives") live = state.circuitSolved && state.branch === "archives";
      else if (key === "observatory") live = state.circuitSolved && state.branch === "observatory";
      node.classList.toggle("is-live", live);
    });

    state.conductors.forEach((rot, index) => {
      const arm = svg.querySelector(`[data-rotor="rotor-${index}"]`);
      if (arm) arm.setAttribute("transform", `rotate(${rot * 90})`);
    });

    state.rings.forEach((pos, index) => {
      const arm = svg.querySelector(`[data-ring="ring-${index}"]`);
      if (arm) arm.setAttribute("transform", `rotate(${pos * 45})`);
    });

    const aligned = state.rings.map((pos, index) => pos === State.RING_SOLUTION[index]);
    ["ring-0", "ring-1", "ring-2"].forEach((id, index) => {
      const node = document.getElementById(id);
      if (node) node.classList.toggle("is-aligned", aligned[index]);
    });

    const cage = document.getElementById("elevator-cage");
    if (cage) {
      cage.setAttribute("transform", state.elevatorFloor === "deep" ? "translate(0 1180)" : "translate(0 0)");
    }

    const knob = document.getElementById("lever-knob");
    if (knob) {
      const x = state.branch === "observatory" ? "574" : state.branch === "archives" ? "500" : "536";
      knob.setAttribute("x", x);
    }

    svg.querySelectorAll(".seal-glyph").forEach((node) => {
      const glyph = node.getAttribute("data-glyph");
      const pressed = state.sealInput.includes(glyph);
      node.classList.toggle("is-pressed", pressed);
    });
    world.classList.toggle("is-seal-error", state.sealError);

    hudPlace.textContent = LOCATION_LABELS[state.location] || "";
    document.querySelector("[data-ui='hits']").setAttribute("aria-pressed", showHits ? "true" : "false");
    document.querySelector("[data-ui='overview']").disabled = !state.shutterOpen;
    finaleEl.hidden = !(state.chamberActivated && state.location === "revelation");
    applyHits();
    renderNotebook();
    helpLead.textContent = State.helpText(state, 1);
  };

  const commit = (next, extra) => {
    state = next;
    if (extra && extra.toast) showToast(extra.toast);
    applyWorld();
    State.writeSave(state);
  };

  const viewFor = (current) => {
    if (current.location === "sas" && current.shutterOpen) return Svg.VIEWS["sas-open"];
    return Svg.VIEWS[current.location];
  };

  const go = (location, duration) => {
    const result = State.goTo(state, location);
    if (result.reason) {
      showToast(result.reason);
      return false;
    }
    commit(result.state);
    const view = viewFor(result.state);
    animateViewBox(view, duration || (location === "revelation" ? 2400 : 900));
    return true;
  };

  const interactOrZoom = (id) => {
    const zone = ACTION_ZONE[id];
    const navigates = id.startsWith("goto-") || id === "elevator-mid" || id === "elevator-deep";
    if (navigates) {
      if (id === "elevator-mid") {
        const next = State.cloneState(state);
        next.elevatorFloor = "mid";
        commit(next);
        go("elevator");
        return;
      }
      if (id === "elevator-deep" || id === "goto-chamber") {
        if (!state.circuitSolved) {
          showToast("Alimentation absente.");
          return;
        }
        const descend = () => {
          const next = State.cloneState(state);
          next.elevatorFloor = "deep";
          commit(next);
          go("chamber", 1200);
        };
        if (id === "goto-chamber" && state.location !== "elevator" && state.location !== "chamber") {
          go("elevator", 800);
          window.setTimeout(descend, reducedMotion() ? 0 : 900);
          return;
        }
        descend();
        return;
      }
      go(zone);
      return;
    }

    if (zone && zone !== state.location) {
      go(zone);
      return;
    }

    if (id === "sas-control") {
      commit(State.openShutter(state));
      animateViewBox(viewFor(state), 1100);
      return;
    }
    if (id.startsWith("conductor-")) {
      const index = Number(id.slice(-1));
      commit(State.rotateConductor(state, index));
      return;
    }
    if (id === "branch-archives" || id === "branch-observatory") {
      const result = State.setBranch(state, id === "branch-archives" ? "archives" : "observatory");
      commit(result.state, { toast: result.reason });
      return;
    }
    if (id.startsWith("ring-")) {
      const index = Number(id.slice(-1));
      const result = State.rotateRing(state, index);
      commit(result.state, { toast: result.reason });
      return;
    }
    if (id.startsWith("seal-")) {
      const glyph = id.slice(5);
      const result = State.pressSeal(state, glyph);
      commit(result.state, { toast: result.reason });
      if (result.opened) {
        window.setTimeout(() => go("alcove", 700), reducedMotion() ? 0 : 500);
      }
      if (result.error) {
        window.setTimeout(() => {
          if (state.sealError) {
            const next = State.cloneState(state);
            next.sealError = false;
            commit(next);
          }
        }, 420);
      }
      return;
    }
    if (id === "alcove-auth") {
      const result = State.authorizeChamber(state);
      commit(result.state, { toast: result.reason });
      return;
    }
    if (id === "chamber-control") {
      const result = State.activateChamber(state);
      if (result.reason) {
        showToast(result.reason);
        return;
      }
      commit(result.state);
      pendingReveal = true;
      window.setTimeout(() => {
        if (!pendingReveal) return;
        go("revelation", 2600);
      }, reducedMotion() ? 0 : 900);
      return;
    }
    if (id === "terminal") {
      renderTerminal();
      openPanel("panel-terminal");
    }
  };

  const onHelp = (level) => {
    if (level === 1) {
      const next = State.cloneState(state);
      next.highlightZone = State.currentTask(state);
      commit(next);
      closePanels();
      const target = next.highlightZone === "complete" ? "overview" : next.highlightZone;
      if (target === "alcove" && state.secretOpen) go("alcove");
      else if (target !== state.location && target !== "complete") go(target === "sas" && !state.shutterOpen ? "sas" : target);
      return;
    }
    if (level === 2) {
      helpLead.textContent = State.helpText(state, 2);
      return;
    }
    const next = State.applyHelpSolve(state);
    commit(next);
    closePanels();
    const view = viewFor(next) || Svg.VIEWS.overview;
    animateViewBox(view, next.location === "revelation" ? 2400 : 700);
  };

  svg.addEventListener("click", (event) => {
    const hit = event.target.closest("[data-interactive]");
    if (!hit) return;
    interactOrZoom(hit.getAttribute("data-interactive"));
  });

  svg.addEventListener("keydown", (event) => {
    const hit = event.target.closest("[data-interactive]");
    if (!hit) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      interactOrZoom(hit.getAttribute("data-interactive"));
    }
  });

  root.addEventListener("click", (event) => {
    const ui = event.target.closest("[data-ui]");
    if (ui) {
      const action = ui.getAttribute("data-ui");
      if (action === "overview") go("overview");
      if (action === "back") {
        const next = State.goBack(state);
        commit(next);
        animateViewBox(viewFor(next), 700);
      }
      if (action === "help") {
        helpLead.textContent = State.helpText(state, 1);
        document.querySelector("[data-ui='help']").setAttribute("aria-expanded", "true");
        openPanel("panel-help");
      }
      if (action === "hits") {
        showHits = !showHits;
        applyWorld();
      }
      if (action === "notebook") {
        renderNotebook();
        document.querySelector("[data-ui='notebook']").setAttribute("aria-expanded", "true");
        openPanel("panel-notebook");
      }
      if (action === "reset") openPanel("panel-reset");
      if (action === "reset-confirm") {
        State.clearSave();
        state = State.defaultState();
        showHits = false;
        closePanels();
        commit(state);
        animateViewBox(viewFor(state), 0);
        showToast("Sauvegarde effacée.");
      }
      if (action === "close") closePanels();
      return;
    }
    const help = event.target.closest("[data-help]");
    if (help) onHelp(Number(help.getAttribute("data-help")));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const open = document.querySelector(".panel:not([hidden])");
    if (open) {
      closePanels();
      return;
    }
    const next = State.goBack(state);
    commit(next);
    animateViewBox(viewFor(next), 700);
  });

  renderTerminal();
  applyWorld();
  animateViewBox(viewFor(state), 0);
})();
