export type Scope = "author" | "reader" | `character:${string}`;
export type Status = "draft" | "canon" | "plan";
export interface Entity {
  id: string;
  name: string;
  kind: string;
  description?: string;
}
export interface FactChange {
  subject: string;
  property: string;
  value: unknown;
  mode?: "set" | "end" | "add" | "remove";
  until?: number;
}
export interface Belief extends FactChange {
  holder: string;
  confidence?: number;
}
export interface Event {
  id: string;
  storyTime: number;
  title: string;
  status?: Status;
  changes?: FactChange[];
  beliefs?: Belief[];
  readerReveals?: FactChange[];
  milestone?: boolean;
  arcIds?: string[];
  revealedIn?: string;
  source?: { chapter: string; scene: string; version: string };
}
export interface Presentation {
  scene: string;
  event: string;
}
export interface Scene {
  id: string;
  storyTime: number;
  title?: string;
  text?: string;
  plan?: string;
  version?: string;
  status?: "draft" | "complete";
  participants?: string[];
  location?: string;
  arcIds?: string[];
  beat?: "setup" | "complication" | "turn" | "resolution";
  presentations?: Presentation[];
  draftChanges?: FactChange[];
}
export interface Chapter {
  id: string;
  title?: string;
  brief?: string;
  scenes: Scene[];
}
export interface Note {
  id: string;
  title?: string;
  scope: Scope;
  text: string;
  revealedIn?: string;
}
export interface Arc {
  id: string;
  title: string;
  description: string;
  resolution: string;
  status: "open" | "progress" | "resolved";
}
export interface Story {
  entities: Entity[];
  events: Event[];
  chapters: Chapter[];
  notes: Note[];
  arcs?: Arc[];
}
export interface Project extends Story {
  format: "mns-web";
  version: 1;
  id: string;
  title: string;
  synopsis: string;
  genre: string;
  targetWords: number;
  createdAt: string;
  updatedAt: string;
  arcs: Arc[];
}
export interface State {
  facts: Map<string, unknown>;
  beliefs: Map<string, unknown>;
  reader: Map<string, unknown>;
  applied: string[];
}
export const key = (subject: string, property: string) =>
  `${subject}.${property}`;
