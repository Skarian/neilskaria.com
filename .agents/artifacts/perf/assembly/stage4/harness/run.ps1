param([string]$Label='candidate',[string]$Kind='phone',[int]$Run=1,[switch]$Brotli)
$ErrorActionPreference='Stop'
$env:PERF_BROTLI=if($Brotli){'1'}else{'0'}
$repo='C:\projects\neilskaria.com-stage4'; $scratch="$env:TEMP\impl\stage4";Set-Location $repo
$env:PATH="$env:LOCALAPPDATA\node24\node-v24.21.0-win-x64;$env:PATH";$node="$env:LOCALAPPDATA\node24\node-v24.21.0-win-x64\node.exe"
$target=[IO.Path]::GetFullPath("$repo\.svelte-kit\output");if($target -ne 'C:\projects\neilskaria.com-stage4\.svelte-kit\output'){throw 'Invalid output path'}
Remove-Item -LiteralPath $target -Recurse -Force;Copy-Item -Recurse "$scratch\$Label-output" $target
if(!$Brotli){Get-ChildItem -LiteralPath "$target/client/_app/immutable/assets" -Filter '*.glb.br' | ForEach-Object {Remove-Item -LiteralPath $_.FullName -Force}}
$server=Start-Process -FilePath $node -ArgumentList @('node_modules/vite/bin/vite.js','preview','--port','4250','--strictPort') -WorkingDirectory $repo -WindowStyle Hidden -PassThru -RedirectStandardOutput "$scratch\server.log" -RedirectStandardError "$scratch\server.err"
try{
$ready=$false;for($i=0;$i -lt 100;$i++){try{if((Invoke-WebRequest -UseBasicParsing http://localhost:4250/lab/boot).StatusCode -eq 200){$ready=$true;break}}catch{};Start-Sleep -Milliseconds 200};if(!$ready){throw 'Preview unavailable'}
if($Kind -eq 'trial'){node "$scratch\trial.mjs" http://localhost:4250/lab/boot "$scratch\trial-$(if($Brotli){"br-"})$Label" phone $Run}
elseif($Kind -eq 'phone'){node "$env:TEMP\perf\baseline.mjs" http://localhost:4250/lab/boot "$scratch\$(if($Brotli){"br-"})$Label" phone $Run}
elseif($Kind -eq 'probe'){node "$scratch\probe.mjs" ($Label.Replace('-visual',''))}
elseif($Kind -eq 'controls'){node "$scratch\motion-controls.mjs"}
elseif($Kind -eq 'settled'){node "$scratch\settled.mjs" ($Label.Replace('-visual',''))}
elseif($Kind -eq 'visual'){node "$scratch\visual-actions.mjs" ($Label.Replace('-visual',''))}
elseif($Kind -eq 'actions'){ $map=Get-ChildItem '.svelte-kit\output\client\_app\immutable\chunks' -Filter '*.js.map' | Where-Object { (Get-Content -LiteralPath $_.FullName -Raw).Contains('/boot/engine.ts') } | Select-Object -First 1;$env:STAGE3_ENGINE=$map.Name.Substring(0,$map.Name.Length-4);node "$scratch\actions.mjs";node "$scratch\early.mjs" }
else{$env:CHROME_PATH='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';$auditArgs=@('http://localhost:4250/lab/boot','--output=json',"--output-path=$scratch/$Label/lh-$Kind-$Run.json",'--quiet','--chrome-flags=--headless=new --use-angle=d3d11 --enable-gpu');if($Kind -eq 'desktop'){$auditArgs+='--preset=desktop'};npx lighthouse@13.5.0 @auditArgs}
if($LASTEXITCODE -ne 0){throw "Harness failed: $Kind"}
}finally{Stop-Process -Id $server.Id -ErrorAction SilentlyContinue}
