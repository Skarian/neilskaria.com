import {mergeConfig} from 'vite';
import config from './source-stage/vite.config';
export default mergeConfig(config,{server:{fs:{allow:["C:\\projects\\neilskaria.com\\.agents\\artifacts\\perf\\canvas-context-control-20261012/source-stage","C:\\projects\\neilskaria.com/node_modules"]}}});
