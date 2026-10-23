"""Supplementary checks and review tables. Writes only to this review folder."""
import csv, importlib.util, json, math
from pathlib import Path
P=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('review_analysis',P/'analyze.py')
a=importlib.util.module_from_spec(spec);spec.loader.exec_module(a)
m=a.read(P/'metrics.json');v=a.read(P/'validation.json')
checks={};notes=[]
for name,path in [('control',a.CONTROL),('default',a.DEFAULT)]:
 d=a.read(path);fs=[]
 for row in csv.DictReader((P/(name+'-derived-frames.csv')).open()):
  fs.append({k:(x if k in ['phase','mode'] else None if x=='' else int(x) if k in ['index','previousIndex','run'] else float(x)) for k,x in row.items()})
 check={'negativeFrameDurations':[],'eventAlignment':[],'fadeSegments':{},'slowGapPredecessors':{},'negativeResourceDurations':[r for r in d['resources'] if r['duration']<0]}
 for f in fs:
  assert all(f[k]>=0 for k in ['paintMs','submitMs','totalMs','recorderMs'])
  assert f['paintMs']+f['submitMs']<=f['totalMs']+1e-6
 for e in d['events']:
  if e['kind'].startswith('glyph-painted') or e['kind'] in ['domain-painted','screen-texture-upload-submitted']:
   f=next(f for f in fs if f['t']<=e['t']<=f['t']+f['totalMs'])
   check['eventAlignment'].append({'event':e,'frame':f,'nextFrame':fs[f['index']+1]})
 for r in [1,2]:
  boot=[f for f in fs if f['run']==r and f['mode']=='booting']
  check['fadeSegments'][str(r)]={label:a.group(fs,[f for f in boot if lo<=f['boot']<hi]) for label,lo,hi in [('fade_before_boot4',3.5,4),('tail_at_boot4',4,math.inf)]}
  slow=[f for f in boot if f['gapMs'] is not None and f['gapMs']>=42]
  check['slowGapPredecessors'][str(r)]={k:a.stats(fs[f['previousIndex']][k] for f in slow) for k in ['paintMs','submitMs','totalMs']}
 checks[name]=check
a.write('supplementary-checks.json',checks)
rows=['All values are milliseconds. Quantiles interpolate at (n-1)*p. The phase owns its incoming interval. The first callback of a mode has no interval.','']
def tab(headers,values):
 return '\n'.join(['| '+' | '.join(headers)+' |','| '+' | '.join(['---']*len(headers))+' |']+['| '+' | '.join(str(c) for c in row)+' |' for row in values])
def fmt(x):return f'{x:.2f}'
def rate(g,t):return f"{g[t]}/{g['n']} ({g[t+'_pct']:.1f}%)"
for metric in ['engine','raf']:
 rows += [f'{metric} cadence by source phase and common text window','']
 vals=[]
 for name in ['control','default']:
  for run in ['1','2']:
   for phase in a.PHASES+['text_0.35_to_3.5','powered_return']:
    g=m[name]['runs'][run][phase][metric]
    vals.append([name,'first' if run=='1' else 'replay' if phase!='powered_return' else 'second',phase,g['n'],*[fmt(g[k]) for k in ['mean','p50','p95','max']],rate(g,'ge42'),rate(g,'gt50')])
 rows += [tab(['Capture','Run','Phase','n','Mean','p50','p95','Max','>=42','>50'],vals),'']
for window in ['text_0.35_to_3.5','powered_return']:
 vals=[]
 for name in ['control','default']:
  for run in ['1','2']:
   for metric,g in m[name]['runs'][run][window]['previous_callback'].items():
    vals.append([name,run,metric,g['n'],*[fmt(g[k]) for k in ['mean','p50','p95','max']]])
 rows += [f'Previous measured callback before incoming intervals: {window}','',tab(['Capture','Run','Timer','n','Mean','p50','p95','Max'],vals),'']
(P/'tables.md').write_text('\n'.join(rows),encoding='utf-8')
print('Supplementary checks passed. All paint/upload markers fall inside the expected measured callbacks.')
print('Negative resource durations retained as anomalies:',{k:v['negativeResourceDurations'] for k,v in checks.items()})

