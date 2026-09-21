import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { Story } from "./model.js";
import { createProject, parseProject } from "./project.js";
import { parseJson } from "./json.js";

async function jsons(dir: string): Promise<unknown[]> {
  const files = (await readdir(dir))
    .filter(
      (f) =>
        f.endsWith(".json") &&
        !f.endsWith(".plan.json") &&
        !f.endsWith(".proposals.json"),
    )
    .sort();
  return Promise.all(
    files.map(async (f) => parseJson(await readFile(join(dir, f), "utf8"))),
  );
}
export async function loadStory(root: string): Promise<Story> {
  const [entities, events, chapters, notes] = await Promise.all(
    ["entities", "canon", "chapters", "notes"].map((dir) =>
      jsons(join(root, dir)),
    ),
  );
  return parseProject(
    JSON.stringify({
      ...createProject("Sources locales"),
      entities,
      events,
      chapters,
      notes,
    }),
  );
}
