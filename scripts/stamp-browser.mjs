import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

// A shared content fingerprint prevents mixed versions of the browser's modules.
const root = "assets/mns";
const names = (await readdir(root, { recursive: true }))
  .filter((n) => n.endsWith(".js"))
  .map((n) => n.replaceAll("\\", "/"))
  .sort();
const files = await Promise.all(
  names.map(async (name) => ({
    name,
    text: (await readFile(join(root, name), "utf8"))
      .replace(/\r\n/g, "\n")
      .replace(/\.js\?v=[a-f0-9]+/g, ".js"),
  })),
);
const hash = createHash("sha256")
  .update(files.map((f) => f.name + "\n" + f.text).join("\n"))
  .digest("hex")
  .slice(0, 12);
for (const file of files) {
  const stamped = file.text.replace(
    /(from\s+["']\.[^"']+\.js)(["'])/g,
    `$1?v=${hash}$2`,
  );
  await writeFile(join(root, file.name), stamped);
}
const cssHash = createHash("sha256")
  .update(
    (await readFile("assets/workshop.css", "utf8")).replace(/\r\n/g, "\n"),
  )
  .digest("hex")
  .slice(0, 12);
const html = (await readFile("index.html", "utf8"))
  .replace(
    /assets\/mns\/web\/app\.js(?:\?v=[^"']+)?/g,
    `assets/mns/web/app.js?v=${hash}`,
  )
  .replace(
    /assets\/workshop\.css(?:\?v=[^"']+)?/g,
    `assets/workshop.css?v=${cssHash}`,
  );
await writeFile("index.html", html);
