import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access, readdir } from "node:fs/promises";
import { join, dirname, resolve } from "node:path";

test("GitHub Pages keeps its domain, entry page, styles and every browser module",async()=>{
  assert.equal((await readFile("CNAME","utf8")).trim(),"metamachia.com");
  await access(".nojekyll");
  const html=await readFile("index.html","utf8");
  assert.match(html,/<script\s+type="module"/);
  for(const match of html.matchAll(/(?:src|href)="([^"?#]+)(?:[?#][^"]*)?"/g)){
    if(!match[1].startsWith("http"))await access(match[1]);
  }
  const modules=await readdir("assets/mns",{recursive:true});
  for(const name of modules.filter(f=>f.endsWith(".js"))){
    const file=join("assets/mns",name),source=await readFile(file,"utf8");
    for(const match of source.matchAll(/from\s+["'](\.[^"']+)["']/g))await access(resolve(dirname(file),match[1]));
    assert.doesNotMatch(source,/from ["']node:/);
  }
});
