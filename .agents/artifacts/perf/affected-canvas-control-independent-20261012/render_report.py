"""Generate the standalone review page from independent metrics."""
import json
from pathlib import Path
P=Path(__file__).resolve().parent
m=json.loads((P/'metrics.json').read_text())
data={n:{r:{w:{k:g[k] for k in ['engine','raf']} for w,g in run.items() if 'engine' in g} for r,run in s['runs'].items()} for n,s in m.items()}
template='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Independent canvas control review</title>
<style>
*{box-sizing:border-box}body{margin:0;font:14px/1.5 var(--font-sans,system-ui);color:var(--foreground,#dce4ec);background:var(--background,#14191f)}p{margin:10px 0}.lead{font-size:20px;font-weight:650;line-height:1.3}.muted,small{color:var(--muted-foreground,#acb7c3)}.status{border-left:3px solid #daac61;padding-left:12px}.controls{display:flex;gap:8px;flex-wrap:wrap;margin:18px 0 8px}button,select{font:inherit;padding:7px 10px;border:1px solid var(--border,#47515e);border-radius:5px;background:var(--secondary,#222b35);color:inherit}button[aria-pressed=true]{background:var(--accent,#256d80);color:var(--accent-foreground,#fff)}.chart{margin:12px 0 18px}.barrow{display:grid;grid-template-columns:132px 1fr 54px;gap:10px;align-items:center;margin:9px 0}.track{height:15px;background:var(--muted,#242e39);border-radius:2px;overflow:hidden}.bar{height:100%;background:#46b9c3}.old .bar{background:#c59563}.num{font-variant-numeric:tabular-nums;text-align:right}table{border-collapse:collapse;width:100%;font-size:12px;font-variant-numeric:tabular-nums}th,td{padding:7px 5px;text-align:right;border-bottom:1px solid var(--border,#38414a)}th:first-child,td:first-child{text-align:left}.scroll{overflow:auto}h2{font-size:16px;margin:24px 0 8px}.two{display:grid;grid-template-columns:1fr 1fr;gap:18px}.line{border-top:1px solid var(--border,#38414a);padding-top:10px}.phase{white-space:nowrap}@media(max-width:500px){.two{grid-template-columns:1fr}.barrow{grid-template-columns:112px 1fr 48px;font-size:12px}.lead{font-size:18px}}
</style>
<p class="lead">Text cadence supports “clearly smoother.” Reliability and startup cost remain unresolved.</p>
<p class="muted">Independent review · one control session versus one historical default session · same reported Chrome154 / Adreno740</p>
<p class="status"><b>Do not promote to production yet.</b> Preserve the one-option preview for a small counterbalanced check. The older default is not a matched contemporaneous baseline.</p>
<div class="controls"><button id="engine" aria-pressed="true">Engine gaps</button><button id="raf" aria-pressed="false">rAF intervals</button><select id="window" aria-label="Source window"><option value="text_0.35_to_3.5">Text: boot 0.35 to 3.5</option><option value="powered_return">Powered solid-fill return</option><option value="all_boot">Whole boot, including handoff</option></select></div>
<p id="chartcaption"></p><div class="chart" id="bars"></div>
<div class="scroll"><table><thead><tr><th>Capture</th><th>n</th><th>Mean</th><th>p50</th><th>p95</th><th>Max</th><th>≥42 ms</th><th>&gt;50 ms</th></tr></thead><tbody id="summary"></tbody></table></div>
<p><small>Durations are ms. Percentiles interpolate at (n−1)×p. Incoming intervals belong to the destination phase. These samples are not independent trials.</small></p>
<div class="two"><div><h2>The strongest evidence</h2><p>Control first boot and replay have nearly identical text cadence. No text-window interval reaches 42 ms on either clock.</p><p>Powered returns improve too, despite drawing no boot text. This supports a contribution from work shared by the canvas and texture path.</p></div><div><h2>Keep the negative result</h2><p>The control has a <b>118.9 ms</b> engine gap late in the first handoff at boot=4. rAF spans 116.7 ms.</p><p>The preceding callback takes 5.3 ms. No recorded long task explains the gap. Its visible impact remains unmeasured.</p></div></div>
<h2>Startup: an earlier response masks more elapsed work</h2>
<div class="scroll"><table><thead><tr><th>Measurement</th><th>Old default</th><th>Control</th><th>Difference</th></tr></thead><tbody>
<tr><td>Navigation → responseEnd</td><td>911.8</td><td>547.1</td><td>−364.7</td></tr>
<tr><td>Navigation → START DOM</td><td>2691.1</td><td>2627.9</td><td>−63.2</td></tr>
<tr><td>create-room → room-ready</td><td>1128.2</td><td>1304.3</td><td>+176.1</td></tr>
<tr><td>responseEnd → START DOM</td><td>1779.3</td><td>2080.8</td><td>+301.5</td></tr>
<tr><td>Separate pre-START long tasks, total</td><td>196</td><td>354</td><td>+158</td></tr>
<tr><td>START DOM → entry complete</td><td>1015.4</td><td>1020.3</td><td>+4.9</td></tr>
</tbody></table></div>
<p class="muted">These are cross-session observations. Network timing, caches, order, thermal state, and a once-only attribute marker prevent causal attribution.</p>
<h2>Submission increases while cadence improves</h2><p>Before text-window gaps, mean callback total is <b>8.94 / 8.94 ms</b> in control first/replay, versus <b>4.35 / 4.39 ms</b> historically. Mean measured render submission rises to about 8 ms. The interval outside the previous measured callback falls to about 7.74 ms.</p><p><small>Paint and submission are nested within total. The remaining interval includes unmeasured work and waiting. It does not prove idle time or CPU/GPU backing.</small></p>
<h2>Source-phase detail</h2><div class="scroll"><table><thead><tr><th>Phase</th><th>Control first</th><th>Control replay</th><th>Old first</th><th>Old replay</th></tr></thead><tbody id="phases"></tbody></table></div><p><small id="phasenote"></small></p>
<h2>One next step</h2><p>On the existing preview and affected browser, capture four fresh-page sessions: <b>default → control → control → default</b>. Each retains first START, BACK, and full replay. Keep similar device conditions and the same wait after START entry completes.</p><p>Require repeat benefit in both orders, informative default slowdown, and no reproducible startup or handoff penalty before promotion. No further Windows matrix.</p>
<p class="line muted">Both hashes and schemas pass. All expected markers are present. No errors, record drops, or visibility changes are recorded. Two negative worker-resource durations remain flagged. Display presentation and exclusive native raster/GPU/compositor cause are unmeasured.</p>
<script>
const data=__DATA__;let metric='engine';const series=[['control','1','Control first'],['control','2','Control replay'],['default','1','Old default first'],['default','2','Old default replay']];
const f=x=>x.toFixed(2);const rate=(g,k)=>g[k]+' ('+g[k+'_pct'].toFixed(1)+'%)';
function draw(){
let w=document.getElementById('window').value;
let groups=series.map(([n,r,l])=>({n,r,l:(w==='powered_return'?l.replace('replay','second return').replace('first','first return'):l),g:data[n][r][w][metric]}));
let max=Math.max(...groups.map(x=>x.g.mean))*1.08;
document.getElementById('bars').innerHTML=groups.map(x=>'<div class="barrow '+(x.n==='default'?'old':'')+'"><span>'+x.l+'</span><div class="track"><div class="bar" style="width:'+x.g.mean/max*100+'%"></div></div><span class="num">'+f(x.g.mean)+'</span></div>').join('');
document.getElementById('chartcaption').textContent='Mean '+(metric==='engine'?'engine start gap':'recorded renderer rAF interval');
document.getElementById('summary').innerHTML=groups.map(({l,g})=>'<tr><td>'+l+'</td><td>'+g.n+'</td><td>'+f(g.mean)+'</td><td>'+f(g.p50)+'</td><td>'+f(g.p95)+'</td><td>'+f(g.max)+'</td><td>'+rate(g,'ge42')+'</td><td>'+rate(g,'gt50')+'</td></tr>').join('');
document.getElementById('phases').innerHTML=['camera-before-power','activation','arrival','drop','colour-glint','fade'].map(p=>'<tr><td class="phase">'+p+'</td>'+series.map(([n,r])=>'<td>'+f(data[n][r][p][metric].mean)+'</td>').join('')+'</tr>').join('');
document.getElementById('phasenote').textContent='Mean '+(metric==='engine'?'engine gaps':'rAF intervals')+' in ms. Fade includes boot=4 and the final handoff.';
document.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.id===metric)));
}
for(let k of ['engine','raf'])document.getElementById(k).onclick=()=>{metric=k;draw()};
document.getElementById('window').onchange=draw;
draw();
for(let k of ['engine','raf'])for(let w of ['text_0.35_to_3.5','powered_return','all_boot']){metric=k;document.getElementById('window').value=w;draw();if(document.querySelectorAll('#summary tr').length!==4)throw Error('Missing table rows');}
metric='engine';document.getElementById('window').value='text_0.35_to_3.5';draw();
console.log('All six metric/window combinations populated four rows.');
</script></html>'''
(P/'comparison.html').write_text(template.replace('__DATA__',json.dumps(data)),encoding='utf-8')
print('Generated comparison.html')

