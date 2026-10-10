// Short pieces of preparation share a budget, then let the browser handle input and paint.
export function startupYield(): Promise<void> {
	const scheduler = (
		globalThis as typeof globalThis & { scheduler?: { yield?: () => Promise<void> } }
	).scheduler;
	return scheduler?.yield ? scheduler.yield() : new Promise((resolve) => setTimeout(resolve, 0));
}

export async function runStartupSteps<T>(
	steps: Generator<void, T>,
	signal: AbortSignal
): Promise<T> {
	let started = performance.now();
	try {
		for (;;) {
			signal.throwIfAborted();
			const next = steps.next();
			if (next.done) return next.value;
			if (performance.now() - started >= 4) {
				await startupYield();
				started = performance.now();
			}
		}
	} finally {
		steps.return(undefined as T);
	}
}
