import { Belief, FactChange, State, Story, key } from "./model.js";

export type View = "writer" | "reader" | "character";
export interface CompileRequest {
  chapter: string;
  scene: string;
  view?: View;
  character?: string;
  includeDraft?: boolean;
}
export interface Issue {
  level: "error" | "warning";
  code: string;
  message: string;
}
export interface Context {
  target: { chapter: string; scene: string; storyTime: number };
  view: View;
  facts: Record<string, unknown>;
  knowledge: Record<string, unknown>;
  notes: { id: string; text: string }[];
  appliedEvents?: string[];
  plan?: string;
  brief?: string;
  unknown: string[];
}
export interface Result {
  state: State;
  context: Context;
  markdown: string;
  issues: Issue[];
}
const equal = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);

export function validateStory(story: Story): Issue[] {
  const issues: Issue[] = [];
  const scenes = story.chapters.flatMap((c) => c.scenes);
  const seen = new Set<string>();
  for (const item of [
    ...story.entities,
    ...story.events,
    ...story.chapters,
    ...scenes,
    ...story.notes,
    ...(story.arcs ?? []),
  ]) {
    if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(item.id))
      issues.push({
        level: "error",
        code: "INVALID_ID",
        message: `Identifiant invalide : ${item.id}`,
      });
    if (seen.has(item.id))
      issues.push({
        level: "error",
        code: "DUPLICATE_ID",
        message: `Identifiant utilisé plusieurs fois : ${item.id}`,
      });
    seen.add(item.id);
  }
  const entityIds = new Set(story.entities.map((e) => e.id));
  const sceneIds = new Set(scenes.map((s) => s.id));
  for (const scene of scenes) {
    if (!Number.isFinite(scene.storyTime))
      issues.push({
        level: "error",
        code: "INVALID_TIME",
        message: `Moment invalide : ${scene.id}`,
      });
    for (const id of scene.participants ?? [])
      if (!entityIds.has(id))
        issues.push({
          level: "error",
          code: "MISSING_ENTITY",
          message: `Présence inconnue : ${id} (${scene.id})`,
        });
    for (const p of scene.presentations ?? [])
      if (!story.events.some((e) => e.id === p.event))
        issues.push({
          level: "error",
          code: "MISSING_EVENT",
          message: `Événement absent : ${p.event}`,
        });
  }
  for (const event of story.events) {
    if (!Number.isFinite(event.storyTime))
      issues.push({
        level: "error",
        code: "INVALID_TIME",
        message: `Moment invalide : ${event.id}`,
      });
    for (const change of [
      ...(event.changes ?? []),
      ...(event.beliefs ?? []),
      ...(event.readerReveals ?? []),
    ]) {
      if (!change.subject || !change.property.trim())
        issues.push({
          level: "error",
          code: "INVALID_CHANGE",
          message: `Propriété manquante : ${event.title}`,
        });
      if (!entityIds.has(change.subject))
        issues.push({
          level: "error",
          code: "MISSING_ENTITY",
          message: `Entité absente : ${change.subject} (${event.title})`,
        });
      if (
        change.until !== undefined &&
        (!Number.isFinite(change.until) || change.until <= event.storyTime)
      )
        issues.push({
          level: "error",
          code: "INVALID_INTERVAL",
          message: `La fin doit suivre le début : ${event.title}`,
        });
      if (change.until !== undefined && change.mode && change.mode !== "set")
        issues.push({
          level: "error",
          code: "INVALID_INTERVAL",
          message: `La fin temporaire s'applique à une valeur attribuée : ${event.title}`,
        });
    }
    for (const belief of event.beliefs ?? [])
      if (!entityIds.has(belief.holder))
        issues.push({
          level: "error",
          code: "MISSING_HOLDER",
          message: `Personnage absent : ${belief.holder}`,
        });
    if (event.revealedIn && !sceneIds.has(event.revealedIn))
      issues.push({
        level: "error",
        code: "MISSING_SCENE",
        message: `Scène de révélation absente : ${event.title}`,
      });
    if (event.source) {
      const chapter = story.chapters.find(
        (c) => c.id === event.source!.chapter,
      );
      const scene = chapter?.scenes.find((s) => s.id === event.source!.scene);
      if (!scene)
        issues.push({
          level: "error",
          code: "MISSING_SOURCE",
          message: `Texte source introuvable : ${event.title}`,
        });
      else if (scene.version && scene.version !== event.source.version)
        issues.push({
          level: "warning",
          code: "STALE_SOURCE",
          message: `Texte modifié, événement à revérifier : ${event.title}`,
        });
    }
  }
  for (const note of story.notes) {
    if (
      note.scope.startsWith("character:") &&
      !entityIds.has(note.scope.slice(10))
    )
      issues.push({
        level: "error",
        code: "MISSING_HOLDER",
        message: `Portée inconnue : ${note.title ?? note.id}`,
      });
    if (note.revealedIn && !sceneIds.has(note.revealedIn))
      issues.push({
        level: "error",
        code: "MISSING_SCENE",
        message: `Révélation de note introuvable : ${note.title ?? note.id}`,
      });
  }
  return issues;
}

interface Operation {
  time: number;
  id: string;
  change: FactChange;
  expire?: string;
}
// Expiry removes only the value it started; it never restores an older state.
function reconstruct(
  operations: Operation[],
  target: number,
  issues: Issue[],
  label: string,
): Map<string, unknown> {
  const values = new Map<string, unknown>();
  const owners = new Map<string, string>();
  const seenAt = new Map<string, Operation>();
  const conflicts = new Set<string>();
  const queue = operations.flatMap((op) =>
    op.change.until === undefined
      ? [op]
      : [op, { ...op, time: op.change.until, expire: op.id }],
  );
  queue.sort(
    (a, b) =>
      a.time - b.time ||
      Number(!a.expire) - Number(!b.expire) ||
      a.id.localeCompare(b.id),
  );
  for (const op of queue) {
    if (op.time > target) continue;
    const k = key(op.change.subject, op.change.property);
    if (op.expire) {
      if (owners.get(k) === op.expire) {
        values.delete(k);
        owners.delete(k);
      }
      continue;
    }
    const previous = seenAt.get(k);
    const mode = op.change.mode ?? "set";
    const signature = `${k}@${op.time}`;
    if (
      previous?.time === op.time &&
      !(mode === "add" && (previous.change.mode ?? "set") === "add") &&
      !equal(previous.change, op.change)
    ) {
      conflicts.add(signature);
      issues.push({
        level: "error",
        code: "CONFLICT",
        message: `${label} : ${k}, changements incompatibles au moment ${op.time}. Valeur indéterminée.`,
      });
    }
    seenAt.set(k, op);
    if (conflicts.has(signature)) {
      values.delete(k);
      owners.delete(k);
      continue;
    }
    owners.set(k, op.id);
    if (mode === "end") values.delete(k);
    else if (mode === "add" || mode === "remove") {
      const old = values.get(k);
      if (old !== undefined && !Array.isArray(old)) {
        issues.push({
          level: "error",
          code: "COLLECTION_TYPE",
          message: `${k} n'est pas une collection.`,
        });
        values.delete(k);
        continue;
      }
      const list = Array.isArray(old) ? old : [];
      values.set(
        k,
        mode === "remove"
          ? list.filter((x) => !equal(x, op.change.value))
          : list.some((x) => equal(x, op.change.value))
            ? list
            : [...list, op.change.value],
      );
    } else values.set(k, op.change.value);
  }
  return values;
}

export function compile(story: Story, request: CompileRequest): Result {
  const issues = validateStory(story);
  const chapter = story.chapters.find((c) => c.id === request.chapter);
  const scene = chapter?.scenes.find((s) => s.id === request.scene);
  const view = request.view ?? "writer";
  const state: State = {
    facts: new Map(),
    beliefs: new Map(),
    reader: new Map(),
    applied: [],
  };
  const context: Context = {
    target: {
      chapter: request.chapter,
      scene: request.scene,
      storyTime: scene?.storyTime ?? 0,
    },
    view,
    facts: {},
    knowledge: {},
    notes: [],
    unknown: [],
  };
  if (!chapter || !scene)
    return {
      state,
      context,
      markdown: "",
      issues: [
        ...issues,
        {
          level: "error",
          code: "SCENE_NOT_FOUND",
          message: "Chapitre ou scène introuvable.",
        },
      ],
    };
  if (
    view === "character" &&
    !story.entities.some((e) => e.id === request.character)
  )
    return {
      state,
      context,
      markdown: "",
      issues: [
        {
          level: "error",
          code: "CHARACTER_REQUIRED",
          message: "Choisissez un personnage.",
        },
      ],
    };
  const scenes = story.chapters.flatMap((c) => c.scenes);
  const sceneIndex = scenes.indexOf(scene);
  const included = story.events.filter((e) => {
    if (e.status === "plan") return false;
    if (e.status !== "draft") return true;
    const position = scenes.findIndex((s) => s.id === e.source?.scene);
    return request.includeDraft && position >= 0 && position <= sceneIndex;
  });
  const unique = [...new Map(included.map((e) => [e.id, e])).values()];
  const operations = (field: "changes" | "beliefs"): Operation[] =>
    unique.flatMap((e) =>
      (e[field] ?? []).map((change, i) => ({
        time: e.storyTime,
        id: `${e.id}_${field}_${i}`,
        change:
          field === "beliefs"
            ? {
                ...change,
                subject: `${(change as Belief).holder}:${change.subject}`,
              }
            : change,
      })),
    );
  const factOps = operations("changes");
  if (request.includeDraft)
    scenes
      .slice(0, sceneIndex + 1)
      .forEach((s) =>
        (s.draftChanges ?? []).forEach((change, i) =>
          factOps.push({ time: s.storyTime, id: `${s.id}_draft_${i}`, change }),
        ),
      );
  state.facts = reconstruct(factOps, scene.storyTime, issues, "Monde");
  state.beliefs = reconstruct(
    operations("beliefs"),
    scene.storyTime,
    issues,
    "Croyances",
  );
  // The reader advances through presentation order, even during a flashback.
  const revealOps: Operation[] = [];
  for (const event of unique) {
    const positions = event.revealedIn
      ? [scenes.findIndex((s) => s.id === event.revealedIn)]
      : scenes.flatMap((s, i) =>
          s.presentations?.some((p) => p.event === event.id) ? [i] : [],
        );
    const position = positions.filter((i) => i >= 0).sort((a, b) => a - b)[0];
    if (position !== undefined)
      (event.readerReveals ?? []).forEach((change, i) =>
        revealOps.push({
          time: position,
          id: `${event.id}_reader_${i}`,
          change: { ...change, until: undefined },
        }),
      );
  }
  state.reader = reconstruct(revealOps, sceneIndex, issues, "Lecteur");
  state.applied = unique
    .filter((e) => e.storyTime <= scene.storyTime)
    .sort((a, b) => a.storyTime - b.storyTime || a.id.localeCompare(b.id))
    .map((e) => e.id);
  const characterKnowledge = Object.fromEntries(
    [...state.beliefs]
      .filter(([k]) => k.startsWith(`${request.character}:`))
      .map(([k, v]) => [k.slice(request.character!.length + 1), v]),
  );
  context.facts =
    view === "writer"
      ? Object.fromEntries(state.facts)
      : view === "reader"
        ? Object.fromEntries(state.reader)
        : characterKnowledge;
  context.knowledge =
    view === "writer"
      ? {
          reader: Object.fromEntries(state.reader),
          beliefs: Object.fromEntries(state.beliefs),
        }
      : { ...context.facts };
  context.notes = story.notes
    .filter((note) => {
      if (view === "writer") return true;
      if (view === "character")
        return note.scope === `character:${request.character}`;
      const revealAt = note.revealedIn
        ? scenes.findIndex((s) => s.id === note.revealedIn)
        : 0;
      return note.scope === "reader" && revealAt >= 0 && revealAt <= sceneIndex;
    })
    .map((n) => ({ id: n.id, text: n.text }));
  if (view === "writer") {
    context.appliedEvents = state.applied;
    context.plan = scene.plan ?? "";
    context.brief = chapter.brief ?? "";
  }
  context.unknown = [
    "Toute propriété absente est non documentée. Les inventaires peuvent être partiels.",
  ];
  const block = (v: Record<string, unknown>) =>
    Object.entries(v)
      .map(([k, value]) => `- ${k} : ${JSON.stringify(value)}`)
      .join("\n") || "Aucune information documentée.";
  const markdown = `# Contexte — ${chapter.title ?? chapter.id} / ${scene.title ?? scene.id}\n\nVue : ${view}${view === "character" ? ` (${request.character})` : ""} · Moment : ${scene.storyTime}\n\n## ${view === "writer" ? "État du monde" : "Informations accessibles"}\n${block(context.facts)}\n\n## Connaissances\n${block(context.knowledge)}\n\n## Notes autorisées\n${context.notes.map((n) => n.text).join("\n\n") || "Aucune."}${view === "writer" ? `\n\n## Brief\n${context.brief}\n\n## Plan (intention)\n${context.plan}` : ""}\n\n${context.unknown.join("\n")}\n`;
  return { state, context, markdown, issues };
}
