from pathlib import Path
p=Path('src/lib/boot/engine.ts');s=p.read_text();s=s.replace('const t = time / 1000;', 'const t = 3;')
a=s.index('\tconst moteCount');b=s.index('\tconst moteGeometry',a);block=s[a:b].replace('Math.random()', 'window.__dustRandom()');s=s[:a]+block+s[b:]
s=s.replace('if (import.meta.env.DEV)\n\t\t\tObject.assign(window,', 'if (true)\n\t\t\tObject.assign(window,')
s=s.replace('\tsetMode(mode);\n\temitCube();\n\treturn {', 'window.__room={renderer,scene,camera,bonsai,rubiks,sound,sp,pickers,focus,water:waterBonsai,clumps,state:()=>({mode,focused,clumps:clumps.length})};\n\tsetMode(mode);\n\temitCube();\n\treturn window.__room.controller = {')
p.write_text(s)
