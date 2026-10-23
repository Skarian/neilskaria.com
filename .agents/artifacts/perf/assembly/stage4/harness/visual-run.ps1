$ErrorActionPreference='Stop'
$env:NO_COLOR=$null
$repo='C:\projects\neilskaria.com-stage4';$scratch="$env:TEMP\impl\stage4";Set-Location $repo
$env:PATH="$env:LOCALAPPDATA\node24\node-v24.21.0-win-x64;$env:PATH"
$files=@('src/lib/boot/assets.ts','src/lib/boot/fetches.ts','src/lib/boot/engine.ts')
try{
foreach($label in @('baseline','candidate')){
if($label -eq 'baseline'){git restore --source=fb9ce37 --worktree -- $files src/lib/boot/assets/bedroom.glb}else{git restore --source=HEAD --worktree -- $files}
python "$scratch\visual-hooks.py"
$ErrorActionPreference='Continue'
npx vite build --sourcemap *> "$scratch\build-visual-$label.log"
$ErrorActionPreference='Stop'
if(!(Test-Path '.svelte-kit/output/server/manifest.js')){throw 'Incomplete visual build'}
$snapshot=[IO.Path]::GetFullPath("$scratch\$label-visual-output")
if(!$snapshot.StartsWith([IO.Path]::GetFullPath($scratch))){throw 'Invalid snapshot path'}
if(Test-Path $snapshot){Remove-Item -LiteralPath $snapshot -Recurse -Force}
Copy-Item -Recurse .svelte-kit/output $snapshot
powershell -NoProfile -File "$scratch\run.ps1" -Label "$label-visual" -Kind visual
if($LASTEXITCODE -ne 0){throw 'Visual comparison failed'}
if($label -eq 'candidate'){
powershell -NoProfile -File "$scratch\run.ps1" -Label candidate-visual -Kind actions
if($LASTEXITCODE -ne 0){throw 'Escape/landing checks failed'}
}
}
node "$scratch\pixels.mjs";if($LASTEXITCODE -ne 0){throw 'Pixel check failed'}
node "$scratch\hulls.mjs";if($LASTEXITCODE -ne 0){throw 'Picking check failed'}
}finally{
git restore --source=HEAD --worktree -- $files
Remove-Item -LiteralPath 'C:\projects\neilskaria.com-stage4\src\lib\boot\assets\bedroom.glb' -Force -ErrorAction SilentlyContinue
}
