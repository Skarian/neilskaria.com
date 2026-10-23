import fs from 'node:fs';const p='C:/projects/neilskaria.com-tbt2/src/lib/boot/engine.ts';let s=fs.readFileSync(p,'utf8');
s=s.replace('lightmapsIn.push(fillLightmap(lighting[group].base, files.lightmaps[`${group}-day`]));',`// Upload each picture as it arrives, before shader submissions can fill the GPU's command buffer.
		lightmapsIn.push(
			fillLightmap(lighting[group].base, files.lightmaps[\x60\x24{group}-day\x60]).then(async () => {
				await breathe();
				renderer.initTexture(lighting[group].base);
			})
		);`);
s=s.replace('lightmapsIn.push(fillLightmap(lighting[group].lamp, files.lightmaps[`${group}-lamp`]));',`lightmapsIn.push(
				fillLightmap(lighting[group].lamp, files.lightmaps[\x60\x24{group}-lamp\x60]).then(async () => {
					await breathe();
					renderer.initTexture(lighting[group].lamp);
				})
			);`);
s=s.replace(`	for (const group of Object.values(lighting)) {
		renderer.initTexture(group.base);
		await breathe();
		renderer.initTexture(group.lamp);
		await breathe();
	}
`,'');fs.writeFileSync(p,s);
