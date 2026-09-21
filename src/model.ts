export type Scope = "author" | "reader" | `character:${string}`;
export interface Entity { id: string; name: string; kind: string; description?: string }
export interface FactChange { subject: string; property: string; value: unknown; mode?: "set" | "end" }
export interface Belief { holder: string; subject: string; property: string; value: unknown; confidence?: number }
export interface Event { id: string; storyTime: number; title: string; changes?: FactChange[]; beliefs?: Belief[]; readerReveals?: FactChange[]; source?: { chapter: string; scene: string; version: string } }
export interface Presentation { scene: string; event: string }
export interface Scene { id: string; storyTime: number; participants?: string[]; presentations?: Presentation[]; draftChanges?: FactChange[] }
export interface Chapter { id: string; scenes: Scene[] }
export interface Note { id: string; scope: Scope; text: string }
export interface Story { entities: Entity[]; events: Event[]; chapters: Chapter[]; notes: Note[] }
export interface State { facts: Map<string, unknown>; beliefs: Map<string, unknown>; reader: Map<string, unknown>; applied: string[] }
export const key = (subject: string, property: string) => `${subject}.${property}`;
