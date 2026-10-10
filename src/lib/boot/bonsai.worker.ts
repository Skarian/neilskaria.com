import { generateBonsai, type BonsaiInput } from './bonsai-generator';

self.onmessage = (event: MessageEvent<BonsaiInput>) => {
	const steps = generateBonsai(event.data);
	let next = steps.next();
	while (!next.done) next = steps.next();
	const buffers = next.value;
	self.postMessage(buffers, { transfer: Object.values(buffers).map((array) => array.buffer) });
};
