from pathlib import Path
import json,hashlib
H=Path(__file__).resolve().parent
s=json.loads((H/'summary.json').read_text());cs=s['captures'];B=H.parent/'gpu-boot-atlas-preview-20261012'
manifest=json.loads((B/'source-manifest.json').read_text(encoding='utf-8-sig'))
checks={}
for name in ['engine.ts','diagnostic.ts','boot-atlas.ts','boot-screen.ts']:
 rel='src/lib/boot/'+name;f=B/'source-stage'/rel;expected=next(x['sha256'] for x in manifest['files'] if x['path']==rel);actual=hashlib.sha256(f.read_bytes()).hexdigest();checks[rel]={'expected':expected,'actual':actual,'matches':actual==expected};assert actual==expected
checks['schemaKeywords']='Validator implements type, required, const, enum, properties, additionalProperties, maxItems, items, maxLength, minimum, allOf, oneOf and if/then used by supplied schema. Annotation keywords ignored.'
checks['modeAndMarkers']={}
for mode,c in cs.items():
 d=json.loads((H/(mode+'.json')).read_text());es=d['events'];ex=d['experiment']
 assert d['reference']=='a796e9aea60def6e0849cb75a151fd6570942339' and d['cameraFix']=='042dc805'
 assert c['validation']['trustedStartCount']==2 and not c['validation']['issues']
 assert d['metadata']['visibility']=='visible' and not c['validation']['visibilityEvents']
 assert len(d['events'])<1000 and len(d['frames'])<3000 and len(d['longtasks'])<500
 if mode=='gpu-atlas':
  assert ex['textureCounts']=={'canvas':{'requests':0,'submissions':0},'atlas':{'requests':1,'submissions':1}}
  assert ex['contextAttributesStatus']=='not-created' and ex['contextAttributes'] is None and ex['requestedContextOptions'] is None and ex['requestedContextOptionsOmitted']
  assert all(f['paintMs']==0 for f in d['frames'])
 else:
  assert ex['textureCounts']['atlas']=={'requests':0,'submissions':0}
  assert ex['requestedContextOptions']==({'willReadFrequently':True} if mode=='will-read-frequently' else None)
  assert ex['requestedContextOptionsOmitted']==(mode=='default')
 for run in [1,2]:
  pre='glyph-draw-submitted-' if mode=='gpu-atlas' else 'glyph-painted-'
  expected=[pre+str(i) for i in range(11) if i!=4]+['domain-draw-submitted' if mode=='gpu-atlas' else 'domain-painted','boot-animation-complete','return-animation-complete']
  assert all(any(e['kind']==k and e['run']==run for e in es) for k in expected)
  assert any(e['kind']=='mode' and e['run']==run and e.get('from')=='room' and e.get('to')=='booting' for e in es)
  assert any(e['kind']=='mode' and e['run']==run and e.get('from')=='booting' and e.get('to')=='site' for e in es)
 checks['modeAndMarkers'][mode]='passed: source, reference, context options, mode-aware per-run and session markers, trusted gestures, completion, array bounds, visibility, dropped/error counts'
(H/'verification.json').write_text(json.dumps(checks,indent=2))
fmt=lambda x:f'{x:.2f}'
lines=['# Recomputed distributions','', 'Run 1 is first full START boot. Run 2 is full replay. All durations are milliseconds.', '', 'Quantiles use linear interpolation. Rates describe intervals, not independent trials or displayed frames.', '','## Engine and rAF intervals','', '| Mode/run/window | n | Engine mean / p50 / p95 / max | >=42 count (%) | >50 count (%) | rAF mean / p50 / p95 / max |','|---|---:|---|---|---|---|']
for mode,c in cs.items():
 for run,rv in c['runs'].items():
  for win,w in rv['windows'].items():
   a=w['gapMs'];r=w['rafGapMs'];lines.append(f"| {mode}/{run}/{win} | {a['n']} | {' / '.join(fmt(a[k]) for k in ['mean','p50','p95','max'])} | {a['ge42']} ({a['ge42Rate']*100:.2f}%) | {a['gt50']} ({a['gt50Rate']*100:.2f}%) | {' / '.join(fmt(r[k]) for k in ['mean','p50','p95','max'])} |")
lines+=['','## Previous callback and elapsed remainder','', 'Each cell is n: mean / p50 / p95 / max. Timings are nested inside total. Solid-return fills have no paint timer.', '', '| Mode/run/window | Paint | GPU prepare | Scene submit | Total | Recorder | Outside previous callback |','|---|---|---|---|---|---|---|']
for mode,c in cs.items():
 for run,rv in c['runs'].items():
  for win,w in rv['windows'].items():
   vals=[w['previousCallback'][k] for k in ['paintMs','gpuPrepareMs','submitMs','totalMs','recorderMs']]+[w['outsidePreviousMs']]
   lines.append('| '+mode+'/'+run+'/'+win+' | '+' | '.join(str(a['n'])+': '+' / '.join(fmt(a[k]) for k in ['mean','p50','p95','max']) for a in vals)+' |')
lines+=['','## Startup local segments','', '| Segment | GPU | Control | Default |','|---|---:|---:|---:|']
for seg in next(iter(cs.values()))['startup']['segments']:
 lines.append('| '+seg+' | '+' | '.join('unobserved / not applicable' if c['startup']['segments'][seg] is None else fmt(c['startup']['segments'][seg]) for c in cs.values())+' |')
lines+=['','## Observed startup timestamps','', '| Milestone (navigation-relative ms) | GPU | Control | Default |','|---|---:|---:|---:|']
for k in ['responseEnd','domContentLoaded','load']:
 lines.append('| '+k+' | '+' | '.join(fmt(c['startup']['navigation'][k]) for c in cs.values())+' |')
for k in next(iter(cs.values()))['startup']['milestones']:
 lines.append('| '+k+' | '+' | '.join('unobserved / not applicable' if c['startup']['milestones'][k] is None else fmt(c['startup']['milestones'][k]) for c in cs.values())+' |')
lines+=['','## Worst gaps and alignment','', '| Mode/run/window | Engine / rAF | Previous paint / prepare / submit / total | Outside | Marker / long task / resource overlap |','|---|---:|---|---:|---|']
for mode,c in cs.items():
 for run,rv in c['runs'].items():
  for win,w in rv['windows'].items():
   x=w['worst'][0];f=x['frame'];p=f['previous'];lines.append('| '+mode+'/'+run+'/'+win+' | '+fmt(f['gapMs'])+' / '+fmt(f['rafGapMs'])+' | '+' / '.join(fmt(p[k]) for k in ['paintMs','gpuPrepareMs','submitMs','totalMs'])+' | '+fmt(f['outsidePreviousMs'])+' | '+', '.join(e['kind'] for e in x['events'])+' / '+str(len(x['overlappingLongtasks']))+' / '+str(len(x['overlappingResources']))+' |')
(H/'metrics.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print('Source and semantic verification passed. Detailed metrics generated.')
