import fs from'node:fs';import{execFileSync}from'node:child_process';const repo='C:/projects/neilskaria.com-tbt2',p=repo+'/src/lib/boot/engine.ts';let s=execFileSync('git',['show','c9be94d:src/lib/boot/engine.ts'],{cwd:repo,encoding:'utf8'});s=s.replace('.setDRACOLoader(draco)\n\t\t.parseAsync',`.setDRACOLoader(draco)
		.register((parser) => ({
			name: 'room-meshes',
			async beforeRoot() {
				// Start each mesh's decoding and materials in its own task; the loader keeps their results.
				for (let i = 0; i < parser.json.meshes.length; i++) {
					void parser.getDependency('mesh', i);
					await breathe();
				}
			}
		}))
		.parseAsync`);fs.writeFileSync(p,s);
