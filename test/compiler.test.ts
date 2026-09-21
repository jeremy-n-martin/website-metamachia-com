import test from "node:test";
import assert from "node:assert/strict";
import { compile } from "../src/compiler.js";
import { Story } from "../src/model.js";
const base = (): Story => ({ entities:[], notes:[{id:"a",scope:"author",text:"secret auteur"},{id:"r",scope:"reader",text:"note lecteur"},{id:"c",scope:"character:LINETTE",text:"note Linette"}], events:[
  {id:"transform",storyTime:10,title:"Transformation",changes:[{subject:"LINETTE",property:"nature",value:"morte-vivante"}]},
  {id:"death",storyTime:20,title:"Mort",changes:[{subject:"KING",property:"alive",value:false}],beliefs:[{holder:"LINETTE",subject:"KING",property:"alive",value:true}]},
  {id:"reveal",storyTime:30,title:"Révélation",readerReveals:[{subject:"KING",property:"alive",value:false}]},
  {id:"temporary",storyTime:40,title:"Masque",changes:[{subject:"LINETTE",property:"mask",value:"on"},{subject:"LINETTE",property:"mask",value:null,mode:"end"}]}
], chapters:[{id:"CH",scenes:[{id:"AFTER",storyTime:30},{id:"FLASHBACK",storyTime:5},{id:"DRAFT",storyTime:30,draftChanges:[{subject:"LINETTE",property:"bag",value:"lost"}]}]}] });
test("free property and transformation reconstruct",()=>assert.equal(compile(base(),{chapter:"CH",scene:"AFTER"}).state.facts.get("LINETTE.nature"),"morte-vivante"));
test("flashback uses story time",()=>assert.equal(compile(base(),{chapter:"CH",scene:"FLASHBACK"}).state.facts.has("KING.alive"),false));
test("false belief differs from truth",()=>{const r=compile(base(),{chapter:"CH",scene:"AFTER",view:"character",character:"LINETTE"});assert.equal(r.state.facts.get("KING.alive"),false);assert.equal(r.state.beliefs.get("LINETTE:KING.alive"),true)});
test("reader reveal changes no world fact",()=>{const b=compile(base(),{chapter:"CH",scene:"FLASHBACK",view:"reader"});const a=compile(base(),{chapter:"CH",scene:"AFTER",view:"reader"});assert.equal(b.state.reader.has("KING.alive"),false);assert.equal(a.state.reader.get("KING.alive"),false);assert.equal(a.state.facts.get("KING.alive"),false)});
test("drafts isolated unless selected",()=>{const b=compile(base(),{chapter:"CH",scene:"DRAFT"});const d=compile(base(),{chapter:"CH",scene:"DRAFT",includeDraft:true});assert.equal(b.state.facts.has("LINETTE.bag"),false);assert.equal(d.state.facts.get("LINETTE.bag"),"lost")});
test("event applied once despite repeated presentation",()=>{const s=base();s.events.push({...s.events[0]});const r=compile(s,{chapter:"CH",scene:"AFTER"});assert.equal(r.state.applied.filter(x=>x==="transform").length,1)});
test("temporary information does not invent a later value",()=>assert.equal(compile(base(),{chapter:"CH",scene:"AFTER"}).state.facts.has("LINETTE.mask"),false));
test("markdown notes are scoped",()=>{const r=compile(base(),{chapter:"CH",scene:"AFTER",view:"reader"});const c=compile(base(),{chapter:"CH",scene:"AFTER",view:"character",character:"LINETTE"});assert.match(r.markdown,/note lecteur/);assert.doesNotMatch(r.markdown,/secret auteur/);assert.match(c.markdown,/note Linette/);assert.doesNotMatch(c.markdown,/note lecteur/)});
test("conflict is reported",()=>{const s=base();s.events.push({id:"conflict",storyTime:20,title:"Contradiction",changes:[{subject:"KING",property:"alive",value:true}]});assert.ok(compile(s,{chapter:"CH",scene:"AFTER"}).issues.some(i=>i.code==="CONFLICT"))});
test("invalid reused identifiers are rejected",()=>{const s=base();s.events.push({...s.events[0]});assert.ok(compile(s,{chapter:"CH",scene:"AFTER"}).issues.some(i=>i.code==="DUPLICATE_ID"))});
