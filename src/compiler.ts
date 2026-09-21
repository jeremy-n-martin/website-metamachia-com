import { Chapter, Event, Note, Scope, State, Story, key } from "./model.js";

export type View = "writer" | "reader" | "character";
export interface CompileRequest { chapter: string; scene: string; view?: View; character?: string; includeDraft?: boolean }
export interface Issue { level: "error" | "warning"; code: string; message: string }
export interface Result { state: State; context: unknown; markdown: string; issues: Issue[] }

function validate(story: Story): Issue[] {
  const issues: Issue[] = [];
  const seen = new Set<string>();
  for (const item of [...story.entities, ...story.events]) {
    if (!item.id || !/^[A-Za-z][A-Za-z0-9_-]*$/.test(item.id)) issues.push({ level:"error", code:"INVALID_ID", message:`Invalid identifier: ${item.id || "(empty)"}` });
    else if (seen.has(item.id)) issues.push({ level:"error", code:"DUPLICATE_ID", message:`Identifier is reused: ${item.id}` });
    else seen.add(item.id);
  }
  for (const event of story.events) for (const change of event.changes ?? []) {
    if (!change.subject || !change.property) issues.push({ level:"error", code:"INVALID_CHANGE", message:`Event ${event.id} has a change without subject or property` });
  }
  return issues;
}

function apply(state: State, event: Event, issues: Issue[]) {
  if (state.applied.includes(event.id)) return;
  for (const change of event.changes ?? []) {
    const k = key(change.subject, change.property);
    if (change.mode === "end") state.facts.delete(k); else {
      if (state.facts.has(k) && state.facts.get(k) !== change.value) issues.push({ level: "warning", code: "CONFLICT", message: `${k} changes from ${JSON.stringify(state.facts.get(k))} to ${JSON.stringify(change.value)} in ${event.id}` });
      state.facts.set(k, change.value);
    }
  }
  for (const belief of event.beliefs ?? []) state.beliefs.set(key(`${belief.holder}:${belief.subject}`, belief.property), belief.value);
  for (const reveal of event.readerReveals ?? []) state.reader.set(key(reveal.subject, reveal.property), reveal.value);
  state.applied.push(event.id);
}
function scoped(notes: Note[], view: View, character?: string) {
  const allowed: Scope[] = view === "writer" ? ["author", "reader"] : view === "reader" ? ["reader"] : [`character:${character}`];
  return notes.filter(n => allowed.includes(n.scope));
}
export function compile(story: Story, request: CompileRequest): Result {
  const chapter = story.chapters.find(c => c.id === request.chapter);
  const scene = chapter?.scenes.find(s => s.id === request.scene);
  const issues: Issue[] = validate(story);
  if (!chapter || !scene) return { state: { facts:new Map(), beliefs:new Map(), reader:new Map(), applied:[] }, context:{}, markdown:"", issues:[{level:"error",code:"SCENE_NOT_FOUND",message:"Chapter or scene not found"}] };
  const state: State = { facts:new Map(), beliefs:new Map(), reader:new Map(), applied:[] };
  const events = [...story.events].sort((a,b) => a.storyTime - b.storyTime || a.id.localeCompare(b.id));
  for (const event of events.filter(e => e.storyTime <= scene.storyTime)) apply(state, event, issues);
  if (request.includeDraft) for (const change of scene.draftChanges ?? []) state.facts.set(key(change.subject, change.property), change.value);
  const view = request.view ?? "writer";
  const facts = Object.fromEntries(state.facts);
  const knowledge = view === "character" ? Object.fromEntries([...state.beliefs].filter(([k]) => k.startsWith(`${request.character}:`))) : view === "reader" ? Object.fromEntries(state.reader) : { reader: Object.fromEntries(state.reader), beliefs: Object.fromEntries(state.beliefs) };
  const notes = scoped(story.notes, view, request.character).map(n => ({ id:n.id, text:n.text }));
  const context = { target: { chapter: chapter.id, scene: scene.id, storyTime: scene.storyTime }, view, facts, knowledge, notes, appliedEvents: state.applied };
  const markdown = `# MNS context — ${chapter.id}/${scene.id}\n\n## View\n${view}${request.character ? ` (${request.character})` : ""}\n\n## Established state\n${Object.entries(facts).map(([k,v]) => `- ${k}: ${JSON.stringify(v)}`).join("\n") || "- No documented fact"}\n\n## Accessible knowledge\n${Object.entries(knowledge).map(([k,v]) => `- ${k}: ${JSON.stringify(v)}`).join("\n") || "- None"}\n\n## Scoped notes\n${notes.map(n => `- ${n.text}`).join("\n") || "- None"}\n`;
  return { state, context, markdown, issues };
}
