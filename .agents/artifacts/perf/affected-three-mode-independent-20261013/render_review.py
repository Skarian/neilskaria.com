from pathlib import Path
import json
p=Path(__file__).resolve().parent
e=json.loads((p/'evidence.json').read_text(encoding='utf-8'))
d={'method':{'windows':e['method']['windows']},'modes':{k:{'runs':v['runs']} for k,v in e['modes'].items()}}
for mode in d['modes'].values():
    for windows in mode['runs'].values():
        for window in windows.values():
            window.pop('worst')
template=(p/'review.template.html').read_text(encoding='utf-8')
payload=json.dumps(d,separators=(',',':')).replace('<','\\u003c')
assert template.count('__EVIDENCE_JSON__')==1
(p/'review.html').write_text(template.replace('__EVIDENCE_JSON__',payload),encoding='utf-8')
print('Rendered review.html from template and evidence.')
