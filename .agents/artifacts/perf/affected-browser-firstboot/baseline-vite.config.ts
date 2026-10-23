import {mergeConfig} from 'vite';
import config from './original-reference/vite.config';
export default mergeConfig(config,{server:{fs:{allow:["C:\\projects\\neilskaria.com\\.agents\\artifacts\\perf\\affected-browser-firstboot/original-reference","C:\\projects\\neilskaria.com/node_modules"]}}});
