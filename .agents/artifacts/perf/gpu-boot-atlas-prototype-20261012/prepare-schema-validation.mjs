import fs from 'node:fs';const out='.agents/artifacts/perf/gpu-boot-atlas-prototype-20261012';let s=fs.readFileSync('.agents/artifacts/perf/canvas-context-control-20261012/verify-json.py','utf8');
s=s.replace("for f in sorted(list(R.glob('*-sample.json'))+list((R/'downloads').glob('*/*.json'))):", `selected=list(R.glob('local-*-sample.json'))
for sample in list(selected):
 d=json.loads(sample.read_text())
 selected+=list((R/'downloads'/('local-'+d['experiment']['mode'])).glob('first-boot-diagnostic-'+d['experiment']['mode']+'-'+d['sessionId']+'.json'))
for f in sorted(selected):`);
s=s.replace("assert all(d['completion'].values()) and not d['errors']",`assert all(d['completion'].values()) and not d['errors']
 assert d['sessionUnobserved']==[]
 for frame in d['frames']:
  assert all(math.isfinite(frame[k]) and frame[k]>=0 for k in ['paintMs','gpuPrepareMs','submitMs','totalMs','recorderMs'])
 if mode=='gpu-atlas':
  assert all(f['paintMs']==0 for f in d['frames'])
  assert d['experiment']['textureCounts']=={'canvas':{'requests':0,'submissions':0},'atlas':{'requests':1,'submissions':1}}
  assert not any('painted' in e['kind'] or e['kind']=='screen-texture-upload-submitted' for e in d['events'])
  assert any(e['kind']=='solid-return-draw-submitted' for e in d['events'])`);
s=s.replace("'boot-canvas-context-created','fonts-ready'", "'boot-canvas-context-created','atlas-fetch-start','atlas-fetch-end','atlas-decode-start','atlas-decode-end','atlas-ready','atlas-upload-requested','atlas-upload-submitted','fonts-ready'");
s=s.replace("assert len(results)>=4", "assert len(results)==4");s=s.replace("'originalAnalysisSchemaCompatible':True", "'originalSchemaStructureCompatible':True,'gpuRequiresModeAwareAnalysis':True");fs.writeFileSync(out+'/verify-json.py',s);
