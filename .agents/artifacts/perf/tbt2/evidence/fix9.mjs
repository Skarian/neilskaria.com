import fs from'node:fs';const p='C:/projects/neilskaria.com-tbt2/src/lib/boot/engine.ts';let s=fs.readFileSync(p,'utf8');const a=s.indexOf('\tfor (const group of Object.values(lighting)) {',s.indexOf('const compiling:')),b=s.indexOf('\trenderer.initTexture(envMap);',a);s=s.slice(0,a)+`	for (const group of Object.values(lighting)) {
		// A few rows at a time keep a lightmap's transfer from blocking one task.
		for (const texture of [group.base, group.lamp]) {
			const { width, height } = texture.image;
			for (let y = 0; y < height; y += 64) {
				for (let row = y; row < Math.min(y + 64, height); row++)
					texture.addUpdateRange(row * width * 4, width * 4);
				texture.needsUpdate = true;
				renderer.initTexture(texture);
				await breathe();
			}
		}
	}
`+s.slice(b);fs.writeFileSync(p,s);
