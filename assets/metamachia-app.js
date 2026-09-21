(function () {
  "use strict";

  const data = globalThis.METAMACHIA_DATA;
  const root = document.getElementById("metamachia-root");

  if (!data || !root) return;

  const state = {
    selectedConcept: "model",
    selectedDocument: null,
    family: "all",
  };

  const conceptById = new Map(data.concepts.map((concept) => [concept.id, concept]));
  const typeById = data.relationTypes;

  const escapeHtml = (value) =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const relationLabel = (relation) => {
    const from = conceptById.get(relation.from);
    const to = conceptById.get(relation.to);
    return `${from.title} — ${relation.verb} → ${to.title}`;
  };

  const activePath = () => {
    const document = data.documents.find((item) => item.id === state.selectedDocument);
    return document ? document.path : [];
  };

  const activeEdges = () => {
    const path = activePath();
    const pairs = new Set();
    for (let index = 0; index < path.length - 1; index += 1) {
      pairs.add(`${path[index]}:${path[index + 1]}`);
      pairs.add(`${path[index + 1]}:${path[index]}`);
    }
    return pairs;
  };

  const renderRelationLegend = () =>
    Object.entries(typeById)
      .map(
        ([, type]) => `
          <button class="legend-chip${state.family === type.family ? " is-active" : ""}"
            type="button" data-family="${escapeHtml(type.family)}" aria-label="Filtrer les relations ${escapeHtml(type.family)}">
            <span style="--legend-color:${escapeHtml(type.color)}"></span>${escapeHtml(type.label)}
          </button>`,
      )
      .join("");

  const renderGraph = () => {
    const path = activePath();
    const highlightedNodes = new Set(path);
    const highlightedEdges = activeEdges();
    const filteredRelations = data.relations.filter(
      (relation) => state.family === "all" || typeById[relation.type].family === state.family,
    );

    const defs = Object.entries(typeById)
      .map(
        ([id, type]) => `
          <marker id="arrow-${id}" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L8,4 L0,8 z" fill="${type.color}"></path>
          </marker>`,
      )
      .join("");

    const edges = filteredRelations
      .map((relation) => {
        const from = conceptById.get(relation.from);
        const to = conceptById.get(relation.to);
        const type = typeById[relation.type];
        const active = highlightedEdges.has(`${relation.from}:${relation.to}`);
        const selected = relation.from === state.selectedConcept || relation.to === state.selectedConcept;
        const bend = Math.min(55, Math.abs(to.x - from.x) * 0.08 + 18);
        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2 - (from.y === to.y ? bend : 0);
        return `
          <path class="graph-edge${active ? " is-path" : ""}${selected ? " is-related" : ""}"
            data-relation="${relation.id}"
            d="M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}"
            stroke="${type.color}"
            marker-end="url(#arrow-${relation.type})">
            <title>${escapeHtml(relationLabel(relation))}</title>
          </path>`;
      })
      .join("");

    const nodes = data.concepts
      .map((concept) => {
        const selected = concept.id === state.selectedConcept;
        const highlighted = highlightedNodes.has(concept.id);
        const faded = path.length > 0 && !highlighted;
        return `
          <button class="graph-node${selected ? " is-selected" : ""}${highlighted ? " is-path" : ""}${faded ? " is-faded" : ""}"
            type="button" data-concept="${concept.id}"
            style="--node-x:${concept.x / 10}%;--node-y:${concept.y / 6.2}%"
            aria-pressed="${selected}" aria-label="Explorer le concept ${escapeHtml(concept.title)}">
            <span class="node-kind">${escapeHtml(concept.kind)}</span>
            <strong>${escapeHtml(concept.title)}</strong>
          </button>`;
      })
      .join("");

    return `
      <div class="graph-stage" aria-label="Carte relationnelle des concepts">
        <svg class="graph-lines" viewBox="0 0 1000 650" role="img" aria-label="Relations orientées entre les concepts">
          <defs>${defs}</defs>
          ${edges}
        </svg>
        ${nodes}
      </div>`;
  };

  const renderInspector = () => {
    const concept = conceptById.get(state.selectedConcept);
    const relations = data.relations.filter(
      (relation) => relation.from === concept.id || relation.to === concept.id,
    );
    const documents = data.documents.filter((document) => document.path.includes(concept.id));

    return `
      <div class="inspector-heading">
        <p class="micro-label">${escapeHtml(concept.kind)}</p>
        <span class="status-pill">${escapeHtml(concept.status)}</span>
      </div>
      <h3>${escapeHtml(concept.title)}</h3>
      <p class="inspector-definition">${escapeHtml(concept.definition)}</p>
      <div class="inspector-block">
        <p class="micro-label">Relations incidentes · ${relations.length}</p>
        <ul class="relation-list">
          ${relations
            .map((relation) => {
              const type = typeById[relation.type];
              return `<li><span style="--relation-color:${type.color}"></span>${escapeHtml(relationLabel(relation))}</li>`;
            })
            .join("")}
        </ul>
      </div>
      <div class="inspector-block">
        <p class="micro-label">Parcours concernés · ${documents.length}</p>
        <div class="mini-routes">
          ${documents
            .map(
              (document) => `<button type="button" data-document="${document.id}">${escapeHtml(document.title)}</button>`,
            )
            .join("")}
        </div>
      </div>`;
  };

  const renderDocuments = () =>
    data.documents
      .map((document, index) => {
        const isActive = document.id === state.selectedDocument;
        const pathTitles = document.path.map((id) => conceptById.get(id).title);
        return `
          <article class="route-card${isActive ? " is-active" : ""}">
            <button type="button" data-document="${document.id}" aria-pressed="${isActive}">
              <div class="route-topline">
                <span>0${index + 1}</span>
                <span>${escapeHtml(document.status)}</span>
              </div>
              <h3>${escapeHtml(document.title)}</h3>
              <p>${escapeHtml(document.thesis)}</p>
              <div class="route-path" aria-label="Chemin conceptuel">
                ${pathTitles.map((title) => `<span>${escapeHtml(title)}</span>`).join("<i>→</i>")}
              </div>
              <footer>${escapeHtml(document.provenance)}</footer>
            </button>
          </article>`;
      })
      .join("");

  const renderPrinciples = () =>
    data.principles
      .map(
        (principle) => `
          <article class="principle">
            <span>${principle.index}</span>
            <h3>${escapeHtml(principle.title)}</h3>
            <p>${escapeHtml(principle.text)}</p>
          </article>`,
      )
      .join("");

  const renderShell = () => {
    root.innerHTML = `
      <div class="site-shell">
        <header class="site-header">
          <a class="brand" href="#top" aria-label="Metamachia, retour au début">
            <span class="brand-mark" aria-hidden="true">M</span>
            <span>METAMACHIA<small>the monodromist</small></span>
          </a>
          <nav aria-label="Navigation principale">
            <a href="explore/">Installation</a>
            <a href="#atlas">Atlas</a>
            <a href="#parcours">Démos</a>
            <a href="#methode">Méthode</a>
          </nav>
          <span class="version">MVP · v${escapeHtml(data.version)}</span>
        </header>

        <main id="top">
          <section class="hero-section">
            <div class="hero-grid" aria-hidden="true"></div>
            <div class="hero-orbit orbit-one" aria-hidden="true"></div>
            <div class="hero-orbit orbit-two" aria-hidden="true"></div>
            <p class="eyebrow">MVP · atlas d’idées</p>
            <h1>Cartographier les<br /><em>structures du réel.</em></h1>
            <p class="hero-thesis">${escapeHtml(data.thesis)}</p>
            <div class="hero-actions">
              <a class="primary-action" href="explore/">Entrer dans l’installation <span>↘</span></a>
              <a class="ghost-action" href="#atlas">Explorer l’atlas</a>
              <span>${data.concepts.length} concepts · ${data.relations.length} relations · ${data.documents.length} démos</span>
            </div>
          </section>

          <section class="atlas-section" id="atlas">
            <div class="section-heading">
              <div>
                <p class="eyebrow">01 · Atlas</p>
                <h2>Quelques objets démo</h2>
              </div>
              <p>Cliquez un concept pour lire sa définition et ses relations. Activez un parcours pour voir son chemin sur la carte.</p>
            </div>

            <div class="legend" aria-label="Filtres des relations">
              <button class="legend-chip${state.family === "all" ? " is-active" : ""}" type="button" data-family="all"><span class="legend-all"></span>toutes</button>
              ${renderRelationLegend()}
            </div>

            <div class="atlas-layout">
              <div id="graph-container" class="graph-container">${renderGraph()}</div>
              <aside id="concept-inspector" class="concept-inspector" aria-live="polite">${renderInspector()}</aside>
            </div>
          </section>

          <section class="routes-section" id="parcours">
            <div class="section-heading">
              <div>
                <p class="eyebrow">02 · Parcours</p>
                <h2>Deux chemins d’exemple</h2>
              </div>
              <p>Un parcours n’est pas un article : c’est une suite de concepts déjà reliés dans le graphe.</p>
            </div>
            <div id="route-grid" class="route-grid">${renderDocuments()}</div>
          </section>

          <section class="method-section" id="methode">
            <div class="section-heading">
              <div>
                <p class="eyebrow">03 · Méthode</p>
                <h2>Trois primitives</h2>
              </div>
              <p>Tout le contenu se configure dans <code>assets/epistemic-data.js</code>. Rechargez la page pour voir les changements.</p>
            </div>
            <div class="principles-grid">${renderPrinciples()}</div>
          </section>
        </main>

        <footer class="site-footer">
          <div class="brand footer-brand"><span class="brand-mark" aria-hidden="true">M</span><span>METAMACHIA</span></div>
          <p>Recherche · intelligence artificielle · mathématiques · systèmes complexes</p>
          <span>Jérémy N. Martin · ${escapeHtml(data.updated)}</span>
        </footer>
      </div>`;
  };

  const refreshGraph = () => {
    document.getElementById("graph-container").innerHTML = renderGraph();
    document.getElementById("concept-inspector").innerHTML = renderInspector();
    document.getElementById("route-grid").innerHTML = renderDocuments();

    document.querySelectorAll("[data-family]").forEach((button) => {
      const family = button.getAttribute("data-family");
      button.classList.toggle("is-active", family === state.family);
    });
  };

  root.addEventListener("click", (event) => {
    const conceptButton = event.target.closest("[data-concept]");
    if (conceptButton) {
      state.selectedConcept = conceptButton.getAttribute("data-concept");
      state.selectedDocument = null;
      refreshGraph();
      return;
    }

    const documentButton = event.target.closest("[data-document]");
    if (documentButton) {
      const documentId = documentButton.getAttribute("data-document");
      state.selectedDocument = state.selectedDocument === documentId ? null : documentId;
      if (state.selectedDocument) {
        const document = data.documents.find((item) => item.id === state.selectedDocument);
        state.selectedConcept = document.path[0];
      }
      refreshGraph();
      document.getElementById("atlas").scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    const familyButton = event.target.closest("[data-family]");
    if (familyButton) {
      state.family = familyButton.getAttribute("data-family");
      refreshGraph();
    }
  });

  renderShell();
})();
