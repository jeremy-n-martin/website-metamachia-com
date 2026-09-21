import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { Chapter, Entity, Event, Note, Story } from "./model.js";
async function jsons<T>(dir: string): Promise<T[]> { const files = await readdir(dir); return Promise.all(files.filter(f => f.endsWith(".json")).map(async f => JSON.parse(await readFile(join(dir,f), "utf8")))); }
export async function loadStory(root: string): Promise<Story> { return { entities: await jsons<Entity>(join(root,"entities")), events: await jsons<Event>(join(root,"canon")), chapters: await jsons<Chapter>(join(root,"chapters")), notes: await jsons<Note>(join(root,"notes")) }; }
