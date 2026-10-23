import {mergeConfig} from 'vite';
import config from './source-stage/vite.config';
export default mergeConfig(config,{server:{fs:{allow:["C:\\projects\\neilskaria.com\\.agents\\artifacts\\perf\\affected-browser-firstboot/source-stage","C:\\projects\\neilskaria.com/node_modules"]}}});
