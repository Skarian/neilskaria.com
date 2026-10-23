import fs from'node:fs';import{execFileSync}from'node:child_process';const repo='C:/projects/neilskaria.com-tbt2';fs.writeFileSync(repo+'/src/lib/boot/engine.ts',execFileSync('git',['show','c9be94d:src/lib/boot/engine.ts'],{cwd:repo,encoding:'utf8'}));const p=repo+'/src/lib/boot/baked-material.ts';let s=execFileSync('git',['show','c9be94d:src/lib/boot/baked-material.ts'],{cwd:repo,encoding:'utf8'});s=s.replace('const t = new THREE.Texture();',`const t = new THREE.DataTexture();
		t.minFilter = THREE.LinearMipmapLinearFilter;
		t.magFilter = THREE.LinearFilter;
		t.generateMipmaps = true;`);s=s.replace('texture.image = await createImageBitmap(await file, {','const bitmap = await createImageBitmap(await file, {');s=s.replace('\ttexture.needsUpdate = true;\n}',`	// Upload pixels directly: importing an ImageBitmap can make the driver wait for its shared image.
	const picture = new OffscreenCanvas(bitmap.width, bitmap.height);
	const ctx = picture.getContext('2d')!;
	ctx.drawImage(bitmap, 0, 0);
	const { data } = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
	texture.image = { data, width: bitmap.width, height: bitmap.height };
	bitmap.close();
	texture.needsUpdate = true;
}`);fs.writeFileSync(p,s);
