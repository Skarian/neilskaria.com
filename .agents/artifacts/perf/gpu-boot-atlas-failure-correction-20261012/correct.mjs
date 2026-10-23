import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
const out=path.resolve('.agents/artifacts/perf/gpu-boot-atlas-failure-correction-20261012'),prior=path.resolve('.agents/artifacts/perf/gpu-boot-atlas-prototype-20261012'),stage=prior+'/source-stage';
const files=['src/lib/boot/boot-atlas.ts','src/lib/boot/engine.ts','src/lib/boot/diagnostic.ts'];const hash=b=>createHash('sha256').update(b).digest('hex');
if(fs.existsSync(out+'/before'))throw Error('Snapshot already exists');
const snapshot=[];for(const p of files){const b=fs.readFileSync(stage+'/'+p);fs.mkdirSync(path.dirname(out+'/before/'+p),{recursive:true});fs.writeFileSync(out+'/before/'+p,b);snapshot.push({path:p,bytes:b.length,sha256:hash(b)});}
fs.writeFileSync(out+'/snapshot.json',JSON.stringify(snapshot,null,2));fs.copyFileSync(prior+'/source-manifest.json',out+'/original-source-manifest.json');
function edit(p,fn){fs.writeFileSync(stage+'/'+p,fn(fs.readFileSync(stage+'/'+p,'utf8')));}
edit(files[0],s=>s.replace("\tconst ready = fetch('/boot-atlas.png')","\tlet disposed = false;\n\tconst abort = new AbortController();\n\tconst ready = fetch('/boot-atlas.png', { signal: abort.signal })")
.replace('\t\ttexture.image = await createImageBitmap(blob, {','\t\tconst bitmap = await createImageBitmap(blob, {')
.replace("\t\tdiag?.mark('atlas-decode-end');","\t\tif (disposed) {\n\t\t\tbitmap.close();\n\t\t\tthrow Error('Boot atlas disposed before readiness');\n\t\t}\n\t\ttexture.image = bitmap;\n\t\tdiag?.mark('atlas-decode-end');")
.replace('\tfunction prepare(t:',"\t// Own rejection immediately. Readiness still rejects at the asset boundary.\n\tvoid ready.catch((error: unknown) => {\n\t\tdiag?.mark('atlas-readiness-failed', { error: String(error), disposed });\n\t});\n\tfunction prepare(t:")
.replace('\t\tdispose() {\n\t\t\ttexture.dispose();','\t\tdispose() {\n\t\t\tif (disposed) return;\n\t\t\tdisposed = true;\n\t\t\tabort.abort();\n\t\t\ttexture.dispose();'));
edit(files[1],s=>s.replace('\tconst compiling: Promise<unknown>[] = [];','\tconst compiling: Promise<unknown>[] = [];\n\tlet extraScreenMaterial: THREE.MeshBasicMaterial | undefined;').replace('\t\tconst lit = screenMaterial.clone();','\t\tconst lit = screenMaterial.clone();\n\t\textraScreenMaterial = lit;')
.replace('\tawait Promise.all([...lightmapsIn, portraitIn, ...(gpuScreen ? [gpuScreen.ready] : [])]);',`\ttry {
\t\tawait Promise.all([...lightmapsIn, portraitIn, ...(gpuScreen ? [gpuScreen.ready] : [])]);
\t} catch (error) {
\t\t// Sound and the event loop are not initialized. Do not call the returned-room disposer.
\t\tdisposed = true;
\t\tdiag?.mark('room-initialization-failed', { error: String(error) });
\t\tgpuScreen?.dispose();
\t\t// Drain started decodes and compiles before disposal. Success adds no wait.
\t\tconst settled = await Promise.allSettled([...lightmapsIn, portraitIn, envIn, sounding, ...compiling]);
\t\tconst audio = settled[lightmapsIn.length + 2];
\t\tif (audio.status === 'fulfilled') await (audio.value as Awaited<typeof sounding>).close();
\t\tconst textures = new Set<THREE.Texture>([envMap, portraitArt, clockTexture]);
\t\tif (screenTexture) textures.add(screenTexture);
\t\tfor (const group of Object.values(lighting)) { textures.add(group.base); textures.add(group.lamp); }
\t\tscene.traverse((object) => {
\t\t\tif (object instanceof THREE.Mesh || object instanceof THREE.Points) {
\t\t\t\tobject.geometry.dispose();
\t\t\t\tfor (const material of [object.material].flat()) {
\t\t\t\t\tfor (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
\t\t\t\t\tmaterial.dispose();
\t\t\t\t}
\t\t\t}
\t\t});
\t\tfor (const texture of textures) {
\t\t\ttexture.dispose();
\t\t\t(texture.image as ImageBitmap | undefined)?.close?.();
\t\t}
\t\tmask.dispose();
\t\tmaskMaterial.dispose();
\t\toccluderMaterial.dispose();
\t\tshootsMask.material.dispose();
\t\tshootsOccluder.material.dispose();
\t\toutlinePass.geometry.dispose();
\t\toutlinePass.material.dispose();
\t\textraScreenMaterial?.dispose();
\t\trubiks.dispose();
\t\tbonsai.dispose();
\t\tgrower.terminate();
\t\ttrail.remove();
\t\tfor (const picker of pickers) picker.geometry.dispose();
\t\tscreenMaterial.dispose();
\t\tclockMaterial.dispose();
\t\trenderer.setAnimationLoop(null);
\t\trenderer.dispose();
\t\trenderer.forceContextLoss();
\t\tdiag?.mark('room-initialization-disposed');
\t\tthrow error;
\t}`));
edit(files[2],s=>s.replace('canvas-control-93+gpu-atlas-prototype-20261012-mip-grad','canvas-control-93+gpu-atlas-failure-correction-20261012'));
