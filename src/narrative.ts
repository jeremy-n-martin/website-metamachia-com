import { Event, Project, Scene, Story } from "./model.js";

export const allScenes = (p: Story) => p.chapters.flatMap((c) => c.scenes);
export function universeReadiness(p: Project) {
  const character = p.entities.some((e) => e.kind === "character");
  const place = p.entities.some((e) => e.kind === "place");
  return { character, place, ready: character && place };
}
export function sceneLocation(p: Story, s: Scene) {
  return (
    p.entities.find((e) => e.id === s.location) ??
    p.entities.find((e) => e.kind === "place" && s.participants?.includes(e.id))
  );
}
export function sceneEvents(p: Story, s: Scene): Event[] {
  return p.events.filter(
    (ev) =>
      ev.source?.scene === s.id ||
      ev.revealedIn === s.id ||
      s.presentations?.some((pr) => pr.event === ev.id),
  );
}
export function eventArcs(p: Story, ev: Event): string[] {
  // A presentation alone does not mean the event belongs to every plot in that scene.
  const source = allScenes(p).find((s) => s.id === ev.source?.scene);
  return [...new Set([...(ev.arcIds ?? []), ...(source?.arcIds ?? [])])];
}
export function sceneArcs(p: Story, s: Scene): string[] {
  return [
    ...new Set([
      ...(s.arcIds ?? []),
      ...sceneEvents(p, s).flatMap((ev) => eventArcs(p, ev)),
    ]),
  ];
}
export function removeScenes(p: Project, ids: string[]): void {
  p.chapters.forEach((c) => {
    c.scenes = c.scenes.filter((s) => !ids.includes(s.id));
  });
  p.events = p.events.filter(
    (ev) => !ev.source || !ids.includes(ev.source.scene),
  );
  p.events.forEach((ev) => {
    if (ev.revealedIn && ids.includes(ev.revealedIn)) ev.revealedIn = undefined;
  });
  p.notes.forEach((n) => {
    if (n.revealedIn && ids.includes(n.revealedIn)) {
      n.revealedIn = undefined;
      n.scope = "author";
    }
  });
  const events = new Set(p.events.map((ev) => ev.id));
  allScenes(p).forEach((s) => {
    s.presentations = s.presentations?.filter((pr) => events.has(pr.event));
  });
}
export function removeArc(p: Project, id: string): void {
  p.arcs = p.arcs.filter((a) => a.id !== id);
  [...allScenes(p), ...p.events].forEach((x) => {
    x.arcIds = x.arcIds?.filter((a) => a !== id);
  });
}
export class DeletionUndo {
  private entry?: { before: Project; after: string };
  capture(p: Project, fn: () => void): void {
    const before = structuredClone(p);
    fn();
    this.entry = { before, after: JSON.stringify(p) };
  }
  available(p: Project): boolean {
    return !!this.entry && this.entry.after === JSON.stringify(p);
  }
  restore(p: Project): Project | undefined {
    if (!this.available(p)) return undefined;
    const before = this.entry!.before;
    this.entry = undefined;
    return before;
  }
}
