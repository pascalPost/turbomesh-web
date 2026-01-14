/// <reference lib="webworker" />
import { TurboMeshSDK, type BlockPoints } from '$lib/turbomesh';

type InitMessage = { type: 'init'; wasmUrl: string };
type RunMessage = { type: 'run' };
type DisposeMessage = { type: 'dispose' };
type WorkerMessage = InitMessage | RunMessage | DisposeMessage;

type OutboundMessage =
	| { type: 'ready' }
	| { type: 'log'; message: string }
	| { type: 'result'; blocks: BlockPoints[] }
	| { type: 'error'; message: string };

const ctx = self as DedicatedWorkerGlobalScope;
let sdk: TurboMeshSDK | null = null;

function postMessage(message: OutboundMessage, transfer: Transferable[] = []) {
	ctx.postMessage(message, transfer);
}

function postLog(message: string) {
	postMessage({ type: 'log', message });
}

async function init(wasmUrl: string) {
	try {
		sdk = await TurboMeshSDK.load({ wasmUrl, autoInit: false, onLog: postLog });
		postMessage({ type: 'ready' });
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		postMessage({ type: 'error', message });
	}
}

function run() {
	if (!sdk) {
		postMessage({ type: 'error', message: 'Worker not initialized.' });
		return;
	}

	sdk.run();
	const count = sdk.blocksCount();
	const blocks: BlockPoints[] = [];
	const transfer: Transferable[] = [];

	for (let i = 0; i < count; i += 1) {
		const block = sdk.blockPointsCopy(i);
		blocks.push(block);
		transfer.push(block.values.buffer);
	}

	postMessage({ type: 'result', blocks }, transfer);
}

function dispose() {
	sdk?.free();
	sdk = null;
}

ctx.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
	const data = event.data;
	if (data.type === 'init') {
		void init(data.wasmUrl);
		return;
	}
	if (data.type === 'run') {
		run();
		return;
	}
	if (data.type === 'dispose') {
		dispose();
	}
});
