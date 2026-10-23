// Read-only: count leaf cards (welded-position components of potted_plant_02/1) touched by strict / margin / kept triangle sets.
import fs from 'node:fs';
import { openDoc, targets } from '../room-bed-plant-cut-20261014-r1/tools/decode.mjs';
const R = new URL('../room-bed-plant-cut-20261014-r1/', import.meta.url).pathname.replace(/^\/(\w:)/, '$1');
const { doc } = await openDoc(R + '../room-nonbonsai-preview-deploy-20261014-r1/upload-stage/src/lib/boot/assets/bedroom.glb');
const t = targets(doc)['potted_plant_02/1']; const idx = t.prim.getIndices().getArray(), pos = t.prim.getAttribute('POSITION').getArray(); const n = idx.length / 3;
const seen = new Map(), weld = new Int32Array(pos.length / 3); for (let v = 0; v < weld.length; v++) { const k = pos[v*3]+','+pos[v*3+1]+','+pos[v*3+2]; if (!seen.has(k)) seen.set(k, seen.size); weld[v] = seen.get(k); }
const par = [...Array(seen.size).keys()]; const f = (a) => par[a] === a ? a : (par[a] = f(par[a]));
for (let i = 0; i < n; i++) { const a = f(weld[idx[i*3]]); par[f(weld[idx[i*3+1]])] = a; par[f(weld[idx[i*3+2]])] = a; }
const comp = (i) => f(weld[idx[i*3]]); const all = new Set(); for (let i = 0; i < n; i++) all.add(comp(i));
const U = JSON.parse(fs.readFileSync(R + 'coverage/union.json')).targets['potted_plant_02/1'];
const M = JSON.parse(fs.readFileSync(R + 'accepted/masks.json')).targets['potted_plant_02/1'];
const cs = (list) => new Set(list.map(comp));
const strict = cs(U.strict.map(([i]) => i)), margin = cs(U.margin.map(([i]) => i)), kept = cs(M.keep);
const sizes = {}; for (let i = 0; i < n; i++) sizes[comp(i)] = (sizes[comp(i)] || 0) + 1;
const dropped = [...all].filter((c) => !kept.has(c)).map((c) => ({ tris: sizes[c], strict: strict.has(c), margin: margin.has(c) }));
const out = { tris: n, cards: all.size, strictCards: strict.size, marginCards: margin.size, keptCards: kept.size, keptTris: M.keep.length, csIdx: t.csIdx, csPos: t.csPos, unionCsIdx: U.csIdx, dropped, marginNotKept: [...margin].filter((c) => !kept.has(c)).length, strictNotKept: [...strict].filter((c) => !kept.has(c)).length };
fs.writeFileSync(new URL('./leafcards.json', import.meta.url), JSON.stringify(out, null, 1)); console.log(JSON.stringify(out));
