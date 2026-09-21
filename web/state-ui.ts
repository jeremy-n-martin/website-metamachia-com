import {
  Timeline,
  Effect,
  chronology,
  stateAt,
  timeLabel,
  entries,
  objectChoices,
  PROPERTIES,
} from "../src/timeline.js";
export const escapeHtml = (value: unknown) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const e = escapeHtml;
export function effectDescription(t: Timeline, effect: Effect): string {
  const name = (id: string) =>
    t.characters.find((c) => c.id === id)?.name || "Personnage";
  if (effect.type === "inventory")
    return effect.operation === "transfer"
      ? `${name(effect.person)} donne ${effect.quantity} × ${effect.item} à ${name(effect.to!)}`
      : `${name(effect.person)} ${effect.operation === "gain" ? "obtient" : "perd"} ${effect.quantity} × ${effect.item}`;
  if (effect.type === "property")
    return `${name(effect.person)} · ${effect.name} : ${effect.remove ? "information retirée" : effect.value}`;
  if (effect.type === "relation")
    return `${effect.remove ? "Fin du lien" : "Nouveau lien"} : ${name(effect.from)} → ${effect.kind} → ${name(effect.to)}`;
  if (effect.type === "presence")
    return `${name(effect.person)} : ${effect.present ? "entre dans le récit / naît" : "quitte le récit"}`;
  return `${name(effect.person)} ${effect.join ? "rejoint" : "quitte"} ${t.groups.find((g) => g.id === effect.group)?.name || "le groupe"}`;
}
export function choiceField(
  label: string,
  name: string,
  choices: string[],
  customLabel: string,
  selected = "",
): string {
  return `<div class="open-choice"><label>${e(label)}<select name="${name}"><option value="">Choisir dans la liste…</option>${choices.map((v) => `<option value="${e(v)}" ${v === selected ? "selected" : ""}>${e(v)}</option>`).join("")}<option value="__other__" ${selected && !choices.includes(selected) ? "selected" : ""}>Autre — saisir ci-dessous</option></select></label><label>${e(customLabel)}<input name="${name}Custom" value="${e(choices.includes(selected) ? "" : selected)}" maxlength="100" placeholder="Saisie libre, prioritaire sur la liste"></label></div>`;
}
export function inventoryFields(
  t: Timeline,
  person = "",
  operation = "gain",
  initial = false,
): string {
  return `<label>Personnage<select name="person" required>${t.characters.map((c) => `<option value="${c.id}" ${c.id === person ? "selected" : ""}>${e(c.name)}</option>`).join("")}</select></label>${initial ? '<p class="callout">Quantité possédée au début du roman. Pour un gain ultérieur, utilisez un changement dans un bloc.</p>' : `<label>Action<select name="operation" id="inventory-operation"><option value="gain" ${operation === "gain" ? "selected" : ""}>Gain d’un objet</option><option value="loss" ${operation === "loss" ? "selected" : ""}>Perte / utilisation d’un objet</option><option value="transfer" ${operation === "transfer" ? "selected" : ""}>Donner à un autre personnage</option></select></label>`}${choiceField("Objet · exemples et objets de votre histoire", "item", objectChoices(t), "Autre objet / nom personnalisé")}<label>${initial ? "Quantité initiale (0 pour retirer)" : "Quantité"}<input type="number" name="quantity" min="${initial ? 0 : 1}" max="1000000" step="1" value="1" required></label>${initial ? "" : `<label id="transfer-recipient" ${operation === "transfer" ? "" : "hidden"}>Destinataire<select name="to"><option value="">Choisir le destinataire…</option>${t.characters.map((c) => `<option value="${c.id}">${e(c.name)}</option>`).join("")}</select></label>`}`;
}
export function propertyFields(
  t: Timeline,
  person = "",
  initial = false,
): string {
  const names = [
    ...new Set([
      ...PROPERTIES,
      ...t.characters.flatMap((c) => (c.properties || []).map((p) => p.name)),
      ...entries(t).flatMap((e) =>
        e.block.effects
          .filter((f) => f.type === "property")
          .map((f) => (f as Extract<Effect, { type: "property" }>).name),
      ),
    ]),
  ];
  return `<label>Personnage<select name="person" required>${t.characters.map((c) => `<option value="${c.id}" ${c.id === person ? "selected" : ""}>${e(c.name)}</option>`).join("")}</select></label>${initial ? '<p class="callout">Propriété au début du roman. Un changement ultérieur se déclare dans un bloc.</p>' : ""}${choiceField("Propriété · exemples", "property", names, "Autre propriété / nom personnalisé")}<label>Action<select name="operation"><option value="set">Définir / remplacer la valeur</option><option value="remove">Retirer cette information</option></select></label><label>Valeur libre<input name="value" maxlength="2000" placeholder="Ex. guéri, forgeronne, reine, invisible…"></label><p class="muted tiny">Une information retirée devient non documentée ; elle n’est pas automatiquement fausse.</p>`;
}
export function worldHtml(t: Timeline, count: number): string {
  const state = stateAt(t, count),
    all = entries(t),
    name = (id: string) =>
      t.characters.find((c) => c.id === id)?.name || "Personnage";
  return `<p class="moment-label"><strong>${e(timeLabel(t, count))}</strong><br>${count ? `Après « ${e(all[count - 1].block.title)} »` : `DÉBUT DU ROMAN · ${e(chronology(t).origin)}`}</p>${state.characters.map((c) => `<details class="character-state" open><summary><span class="avatar" style="--person:${c.color}">${e(c.name[0])}</span><strong>${e(c.name)}</strong><span class="tiny muted">${state.present.has(c.id) ? "présent" : "absent"}</span></summary><div class="state-content"><h4>Inventaire</h4><div class="inventory-chips">${c.inventory.map((i) => `<span class="chip">${e(i.item)} <b>× ${i.quantity}</b></span>`).join("") || '<span class="muted tiny">Aucun objet déclaré</span>'}</div><h4>Propriétés</h4>${c.properties.map((p) => `<div class="property-row"><span>${e(p.name)}</span><strong>${e(p.value)}</strong></div>`).join("") || '<span class="muted tiny">Non documentées</span>'}${count === 0 ? `<div class="state-edit"><button data-action="initial-inventory" data-id="${c.id}">＋ Inventaire initial</button><button data-action="initial-property" data-id="${c.id}">＋ Propriété initiale</button></div>` : ""}</div></details>`).join("")}<h3 class="state-heading">Relations</h3><div class="relations">${state.links.map((l) => `<div class="relationship"><span>${e(name(l.from))}</span><span class="relation-line">${e(l.kind)} →</span><span>${e(name(l.to))}</span></div>`).join("") || '<p class="muted">Aucun lien déclaré à cet instant.</p>'}</div>${state.groups.map((g) => `<div class="group-card"><span class="eyebrow">${e(g.kind)}</span><button data-action="group" data-id="${g.id}" class="text-button">${e(g.name)}</button><p>${g.members.map((p) => e(name(p))).join(" · ") || "Aucun membre"}</p></div>`).join("")}${state.issues.length ? `<div class="state-warning" role="status"><strong>Changements non appliqués</strong>${state.issues.map((i) => `<p>${e(i.text)}</p>`).join("")}</div>` : ""}`;
}
export function consequenceHtml(t: Timeline, blockId: string): string {
  const index = entries(t).findIndex((e) => e.block.id === blockId),
    b = entries(t)[index]?.block;
  if (!b?.effects.length) return "";
  const before = stateAt(t, index),
    after = stateAt(t, index + 1);
  const summary = (state: typeof before, person: string) => {
    const c = state.characters.find((c) => c.id === person)!;
    return `${state.present.has(person) ? "Présent" : "Absent"} · Inventaire : ${c.inventory.map((i) => `${i.item} × ${i.quantity}`).join(", ") || "vide"} · Propriétés : ${c.properties.map((p) => `${p.name} : ${p.value}`).join(", ") || "non documentées"}`;
  };
  const people = [
    ...new Set(
      b.effects.flatMap((f) =>
        f.type === "relation"
          ? [f.from, f.to]
          : f.type === "inventory" && f.to
            ? [f.person, f.to]
            : [f.person],
      ),
    ),
  ];
  return `<details class="consequence-preview"><summary>Avant → après ce passage</summary>${people.map((p) => `<h4>${e(t.characters.find((c) => c.id === p)?.name)}</h4><p><b>Avant :</b> ${e(summary(before, p))}</p><p><b>Après :</b> ${e(summary(after, p))}</p>`).join("")}${after.issues
    .filter((i) => i.block === blockId)
    .map((i) => `<p class="state-warning">${e(i.text)}</p>`)
    .join(
      "",
    )}<p class="muted tiny">Les relations et appartenances sont visibles dans le panneau de gauche après lecture du passage.</p></details>`;
}
