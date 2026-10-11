// Grows the bonsai's foliage off the page's thread (see bonsai.ts), handing the arrays back without
// copying them.

import { generateBonsai, type BonsaiInput } from './bonsai-generator';

self.onmessage = (event: MessageEvent<BonsaiInput>) => {
	const tree = generateBonsai(event.data);
	self.postMessage(tree, { transfer: Object.values(tree).map((array) => array.buffer) });
};
