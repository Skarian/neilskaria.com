import fs from'node:fs';import{execFileSync}from'node:child_process';const repo='C:/projects/neilskaria.com-tbt2';fs.writeFileSync(repo+'/src/lib/boot/baked-material.ts',execFileSync('git',['show','c9be94d:src/lib/boot/baked-material.ts'],{cwd:repo,encoding:'utf8'}));const p=repo+'/src/lib/boot/engine.ts';let s=execFileSync('git',['show','c9be94d:src/lib/boot/engine.ts'],{cwd:repo,encoding:'utf8'});const block=`	// Audio has a native setup cost: give it its own task while the pictures are downloading.
	const sounding = breathe().then(() => createBootSound(files.chime, options.muted));
`;if(!s.includes(block))throw Error('audio block not found');s=s.replace(block,'').replace('\tconst gltf = await new GLTFLoader()',`	// Audio has a native setup cost: give it its own task while the model is still loading.
	const sounding = breathe().then(() => createBootSound(files.chime, options.muted));
	const gltf = await new GLTFLoader()`);fs.writeFileSync(p,s);
