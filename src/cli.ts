import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { compile } from "./compiler.js";
import { loadStory } from "./io.js";
const args = process.argv.slice(2); const pick = (name:string, fallback?:string) => args.includes(name) ? args[args.indexOf(name)+1] : fallback;
if (args[0] !== "compile") { console.error("Usage: mns compile [--chapter ID --scene ID --view writer|reader|character --character ID]"); process.exit(1); }
const root = join(process.cwd(), "story"); const story = await loadStory(root); const result = compile(story, { chapter:pick("--chapter",story.chapters[0]?.id)!, scene:pick("--scene",story.chapters[0]?.scenes[0]?.id)!, view:pick("--view","writer") as "writer"|"reader"|"character", character:pick("--character"), includeDraft:args.includes("--include-draft") });
await mkdir(join(root,"generated"),{recursive:true}); await Promise.all([writeFile(join(root,"generated","context.json"),JSON.stringify(result.context,null,2)),writeFile(join(root,"generated","context.md"),result.markdown),writeFile(join(root,"generated","continuity-report.json"),JSON.stringify(result.issues,null,2))]);
console.log(`Generated context and report (${result.issues.length} issue(s)).`);
