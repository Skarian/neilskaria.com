"""Validate retained sample and actual downloaded JSON. No external packages."""
import json, math
from pathlib import Path
R=Path(__file__).resolve().parent
schema=json.loads((R/'capture.schema.json').read_text(encoding='utf-8-sig'))
old=json.loads((R.parent/'affected-browser-firstboot/capture.schema.json').read_text())
def validate(v,s,p='$'):
 errors=[]
 t=s.get('type',[]);t=[t] if isinstance(t,str) else t
 types={'object':isinstance(v,dict),'array':isinstance(v,list),'string':isinstance(v,str),'number':type(v) in [int,float],'integer':type(v)==int,'boolean':type(v)==bool,'null':v is None}
 if t and not any(types[x] for x in t):errors.append(p+':type')
 if 'const' in s and (type(v)!=type(s['const']) or v!=s['const']):errors.append(p+':const')
 if 'enum' in s and v not in s['enum']:errors.append(p+':enum')
 if 'oneOf' in s and sum(not validate(v,x,p) for x in s['oneOf'])!=1:errors.append(p+':oneOf')
 for x in s.get('allOf',[]):errors+=validate(v,x,p)
 if 'if' in s:errors+=validate(v,s.get('then' if not validate(v,s['if'],p) else 'else',{}),p)
 if isinstance(v,dict):
  for k in s.get('required',[]):
   if k not in v:errors.append(p+':missing '+k)
  for k,x in s.get('properties',{}).items():
   if k in v:errors+=validate(v[k],x,p+'.'+k)
  if s.get('additionalProperties') is False:
   errors += [p+':extra '+k for k in v if k not in s.get('properties',{})]
 if isinstance(v,list):
  if len(v)>s.get('maxItems',math.inf):errors.append(p+':maxItems')
  for i,x in enumerate(v):errors+=validate(x,s.get('items',{}),p+f'[{i}]')
 if isinstance(v,str) and len(v)>s.get('maxLength',math.inf):errors.append(p+':maxLength')
 return errors
results=[]
selected=list(R.glob('local-*-sample.json'))
for sample in list(selected):
 d=json.loads(sample.read_text())
 selected+=list((R/'downloads'/('local-'+d['experiment']['mode'])).glob('first-boot-diagnostic-'+d['experiment']['mode']+'-'+d['sessionId']+'.json'))
for f in sorted(selected):
 d=json.loads(f.read_text());errors=validate(d,schema);compatible=validate(d,old)
 mode=d['experiment']['mode']
 if f.parent.name in ['default','will-read-frequently']:assert f.parent.name==mode
 if f.parent.parent.name=='downloads':assert f.name.startswith('first-boot-diagnostic-'+mode+'-')
 assert not errors and not compatible,(str(f),errors,compatible)
 assert all(d['completion'].values()) and not d['errors']
 assert d['sessionUnobserved']==[]
 for frame in d['frames']:
  assert all(math.isfinite(frame[k]) and frame[k]>=0 for k in ['paintMs','gpuPrepareMs','submitMs','totalMs','recorderMs'])
 if mode=='gpu-atlas':
  assert all(f['paintMs']==0 for f in d['frames'])
  assert d['experiment']['textureCounts']=={'canvas':{'requests':0,'submissions':0},'atlas':{'requests':1,'submissions':1}}
  assert not any('painted' in e['kind'] or e['kind']=='screen-texture-upload-submitted' for e in d['events'])
  assert any(e['kind']=='solid-return-draw-submitted' for e in d['events'])
 assert d['unobserved']==[{'run':1,'markers':[]},{'run':2,'markers':[]}]
 startup={k:[e['t'] for e in d['events'] if e['kind']==k] for k in ['diagnostic-initialized','create-room','boot-canvas-context-created','atlas-fetch-start','atlas-fetch-end','atlas-decode-start','atlas-decode-end','atlas-ready','atlas-upload-requested','atlas-upload-submitted','fonts-ready','room-ready','START-DOM','START-animation-start','START-animation-complete','START-css-animation-complete','START-gesture']}
 firstStart=next(e['t'] for e in d['events'] if e['kind']=='START-gesture')
 startupTasks=[x for x in d['longtasks'] if x['t']<firstStart]
 callbacks={str(run):next((x for x in d['frames'] if x['run']==run and x['mode']=='booting'),None) for run in [1,2]}
 poweredCallbacks={str(run):next((x for x in d['frames'] if x['run']==run and x['mode']=='booting' and x['phase']!='camera-before-power'),None) for run in [1,2]}
 results.append({'file':str(f.relative_to(R)),'schemaFailures':errors,'originalSchemaCompatibilityFailures':compatible,'experiment':d['experiment'],'startupMarkersMs':startup,'startupLongTasks':startupTasks,'firstBootCallbacks':callbacks,'firstPoweredCallbacks':poweredCallbacks,'navigation':d['navigation']})
assert len(results)==4
(R/'schema-mode-startup-validation.json').write_text(json.dumps({'allPassed':True,'interpretation':'Functional screening only. Startup values are unordered local observations. They do not establish speed, reliability, or affected-device cause.','files':results},indent=2)+'\n')
print(json.dumps({'files':len(results),'allPassed':True,'originalSchemaStructureCompatible':True,'gpuRequiresModeAwareAnalysis':True}))
