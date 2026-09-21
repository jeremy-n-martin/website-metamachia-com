import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { join, resolve } from "node:path";
import { compile, View } from "./compiler.js";
import { loadStory } from "./io.js";
import { parseProject } from "./project.js";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.shift() !== "compile")
    throw Error(
      "Usage : mns compile [--project histoire.mns.json] [--chapter ID --scene ID --view writer|reader|character --character ID --include-draft --out dossier]",
    );
  const flags = new Map<string, string>();
  const allowed = new Set([
    "--project",
    "--chapter",
    "--scene",
    "--view",
    "--character",
    "--out",
    "--include-draft",
  ]);
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!allowed.has(arg)) throw Error(`Option inconnue : ${arg}`);
    if (arg === "--include-draft") {
      flags.set(arg, "true");
      continue;
    }
    const value = args[++i];
    if (!value || value.startsWith("--"))
      throw Error(`Valeur manquante : ${arg}`);
    flags.set(arg, value);
  }
  const root = join(process.cwd(), "story");
  const story = flags.has("--project")
    ? parseProject(await readFile(resolve(flags.get("--project")!), "utf8"))
    : await loadStory(root);
  const chapter = flags.get("--chapter") ?? story.chapters[0]?.id;
  const scene =
    flags.get("--scene") ??
    story.chapters.find((c) => c.id === chapter)?.scenes[0]?.id;
  const view = flags.get("--view") ?? "writer";
  if (!["writer", "reader", "character"].includes(view))
    throw Error("Vue invalide.");
  if (!chapter || !scene)
    throw Error("Le projet ne contient pas de scène sélectionnable.");
  const result = compile(story, {
    chapter,
    scene,
    view: view as View,
    character: flags.get("--character"),
    includeDraft: flags.has("--include-draft"),
  });
  if (
    result.issues.some(
      (i) => i.code === "SCENE_NOT_FOUND" || i.code === "CHARACTER_REQUIRED",
    )
  )
    throw Error(result.issues.map((i) => i.message).join("\n"));
  const out = resolve(flags.get("--out") ?? join(root, "generated"));
  await mkdir(out, { recursive: true });
  for (const [name, content] of [
    ["context.json", JSON.stringify(result.context, null, 2)],
    ["context.md", result.markdown],
    ["continuity-report.json", JSON.stringify(result.issues, null, 2)],
  ]) {
    const destination = join(out, name),
      temp = destination + `.${process.pid}.tmp`;
    await writeFile(temp, content);
    await rename(temp, destination);
  }
  console.log(
    `Contexte et rapport générés dans ${out} (${result.issues.length} point(s) à vérifier).`,
  );
  if (result.issues.some((i) => i.level === "error")) process.exitCode = 2;
}
main().catch((error) => {
  console.error((error as Error).message);
  process.exitCode = 1;
});
