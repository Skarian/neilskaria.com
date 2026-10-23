import fs from 'node:fs';import {execFileSync} from 'node:child_process';const repo='C:/projects/neilskaria.com-tbt2';for(const f of ['engine.ts','baked-material.ts'])fs.writeFileSync(repo+'/src/lib/boot/'+f,execFileSync('git',['show','c9be94d:src/lib/boot/'+f],{cwd:repo}));const p=repo+'/src/lib/boot/engine.ts';let s=fs.readFileSync(p,'utf8').replace('.setDRACOLoader(draco)\n\t\t.parseAsync',`.setDRACOLoader(draco)
		.register((parser) => ({
			name: 'room-textures',
			async beforeRoot() {
				// Start each embedded picture in its own task, before meshes request their materials.
				for (let i = 0; i < parser.json.textures.length; i++) {
					void parser.getDependency('texture', i);
					await breathe();
				}
			}
		}))
		.parseAsync`);fs.writeFileSync(p,s);
