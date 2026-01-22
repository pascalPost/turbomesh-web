<script lang="ts">
	import * as Resizable from '$lib/components/ui/resizable/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import SiteHeader from '$lib/components/site-header.svelte';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import Play from '@lucide/svelte/icons/play';
	import type { BlockPoints } from '$lib/turbomesh';
	import TurboMeshWorker from '$lib/workers/turbomesh-worker.ts?worker';
	import { asset } from '$app/paths';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import MonacoEditor from '$lib/components/monaco-editor.svelte';
	import RenderView from '$lib/components/render-view.svelte';
	import { onDestroy, onMount, tick } from 'svelte';

	let monacoEditor: MonacoEditor | null = $state(null);

	let blockPoints = $state<BlockPoints[]>([]);
	type ProfilePoints = { up: [number, number][]; down: [number, number][] };
	let profilePoints = $state<ProfilePoints>({ up: [], down: [] });
	let renderProfileEnabled = $state(true);
	let renderGridEnabled = $state(true);
	let logEntries = $state<string[]>([]);
	let workerReady = $state(false);
	let worker: Worker | null = null;
	let logPane: HTMLDivElement | null = $state(null);
	let examplesOpen = $state(false);
	const meshStats = $derived.by(() => {
		let points = 0;
		let cells = 0;
		for (const block of blockPoints) {
			const countI = block.size.i;
			const countJ = block.size.j;
			points += countI * countJ;
			if (countI > 1 && countJ > 1) {
				cells += (countI - 1) * (countJ - 1);
			}
		}
		return { points, cells };
	});

	type WorkerMessage =
		| { type: 'ready' }
		| { type: 'log'; message: string }
		| { type: 'result'; blocks: BlockPoints[] }
		| { type: 'error'; message: string };

	type ExampleEntry = {
		id: string;
		label: string;
		url: string;
	};

	const examples: ExampleEntry[] = [
		{
			id: 't106',
			label: 'T106',
			url: asset('/T106.json')
		},
		{
			id: 'ls89',
			label: 'LS89',
			url: asset('/LS89.json')
		}
	];

	onMount(async () => {
		worker = new TurboMeshWorker();
		worker.addEventListener('message', handleWorkerMessage);
		worker.postMessage({ type: 'init', wasmUrl: asset('/turbomesh.wasm') });
	});

	onDestroy(() => {
		worker?.postMessage({ type: 'dispose' });
		worker?.terminate();
		worker = null;
	});

	function generateGrid() {
		if (!workerReady || !worker) {
			appendLog('TurboMesh worker not ready yet.');
			return;
		}
		const input = monacoEditor?.getValue() ?? '';
		if (input.length === 0) {
			appendLog('Editor input is empty. Please provide a valid config.');
			return;
		}
		const profile = readProfilePoints(input);
		if (!profile) {
			appendLog('Failed to parse geometry.profile.data for render points.');
			profilePoints = { up: [], down: [] };
		} else {
			profilePoints = profile;
		}
		appendLog('Running turbomesh...');
		worker.postMessage({ type: 'run', input });
	}

	function renderProfile() {
		const input = monacoEditor?.getValue() ?? '';
		if (input.length === 0) {
			appendLog('Editor input is empty. Please provide a valid config.');
			return;
		}
		const profile = readProfilePoints(input);
		if (!profile) {
			appendLog('Failed to parse geometry.profile.data for render points.');
			profilePoints = { up: [], down: [] };
			return;
		}
		profilePoints = profile;
		appendLog(`Rendered profile points (down: ${profile.down.length}, up: ${profile.up.length}).`);
	}

	function handleEditorLoaded() {
		renderProfile();
	}

	function handleRenderGridToggle(checked: boolean) {
		renderGridEnabled = checked;
	}

	function handleRenderProfileToggle(checked: boolean) {
		renderProfileEnabled = checked;
		if (renderProfileEnabled) {
			renderProfile();
		}
	}

	function appendLog(message: string) {
		logEntries = [...logEntries, `[${new Date().toISOString()}] ${message}`];
	}

	$effect(() => {
		if (!logPane || logEntries.length === 0) {
			return;
		}
		void tick().then(() => {
			if (logPane) {
				logPane.scrollTop = logPane.scrollHeight;
			}
		});
	});

	function handleWorkerMessage(event: MessageEvent<WorkerMessage>) {
		const data = event.data;
		if (data.type === 'ready') {
			workerReady = true;
			appendLog('TurboMesh worker ready.');
			return;
		}
		if (data.type === 'log') {
			appendLog(data.message);
			return;
		}
		if (data.type === 'result') {
			blockPoints = data.blocks;
			appendLog(`Generated ${data.blocks.length} blocks.`);
			return;
		}
		if (data.type === 'error') {
			appendLog(`Error: ${data.message}`);
		}
	}

	function toPointPairs(value: unknown): [number, number][] {
		if (!Array.isArray(value)) return [];
		const points: [number, number][] = [];
		for (const entry of value) {
			if (!Array.isArray(entry) || entry.length < 2) continue;
			const [x, y] = entry;
			if (typeof x !== 'number' || !Number.isFinite(x)) continue;
			if (typeof y !== 'number' || !Number.isFinite(y)) continue;
			points.push([x, y]);
		}
		return points;
	}

	function readProfilePoints(input: string): ProfilePoints | null {
		try {
			const parsed = JSON.parse(input) as {
				geometry?: { profile?: { data?: { down?: unknown; up?: unknown } } };
			};
			const data = parsed?.geometry?.profile?.data;
			if (!data) {
				return { down: [], up: [] };
			}
			return {
				down: toPointPairs(data.down),
				up: toPointPairs(data.up)
			};
		} catch {
			return null;
		}
	}

	async function loadExample(example: ExampleEntry) {
		if (!monacoEditor) {
			appendLog('Editor is not ready yet.');
			return;
		}
		const ok = await monacoEditor.loadFromUrl(example.url);
		if (!ok) {
			appendLog(`Failed to load example: ${example.label}.`);
			return;
		}
		examplesOpen = false;
		appendLog(`Loaded example: ${example.label}.`);
		renderProfile();
	}

	let renderView: RenderView;
</script>

<div class="flex h-screen flex-col pb-1 [--header-height:calc(--spacing(14))]">
	<SiteHeader>
		<div slot="actions">
			<Button class="gap-2" variant="outline" onclick={() => (examplesOpen = true)}>
				<BookOpen />
				Examples
			</Button>
		</div>
	</SiteHeader>
	<Sheet.Root bind:open={examplesOpen}>
		<Sheet.Content side="right" class="w-full sm:max-w-md">
			<Sheet.Header>
				<Sheet.Title>Load an example</Sheet.Title>
				<Sheet.Description>Select a sample config for the editor.</Sheet.Description>
			</Sheet.Header>
			<div class="flex flex-col gap-2">
				{#each examples as example (example.id)}
					<Button
						variant="outline"
						class="h-auto items-start justify-between gap-3 py-3 text-left"
						onclick={() => loadExample(example)}
					>
						<div class="flex flex-col">
							<span class="font-medium">{example.label}</span>
						</div>
					</Button>
				{/each}
			</div>
			<Separator class="my-3" />
			<div class="text-xs text-muted-foreground">
				Loading an example replaces the current editor content.
			</div>
		</Sheet.Content>
	</Sheet.Root>
	<Resizable.PaneGroup direction="horizontal">
		<Resizable.Pane>
			<div class="flex h-full flex-col gap-2">
				<MonacoEditor bind:this={monacoEditor} on:loaded={handleEditorLoaded} />
			</div>
		</Resizable.Pane>
		<Resizable.Handle withHandle />
		<Resizable.Pane>
			<Resizable.PaneGroup direction="vertical">
				<Resizable.Pane defaultSize={75} minSize={30}>
					<div class="flex h-full min-h-0 flex-col gap-1">
						<div class="min-h-0 flex-1">
							<RenderView
								bind:this={renderView}
								blocks={blockPoints}
								profilePoints={renderProfileEnabled ? profilePoints : { up: [], down: [] }}
								renderGrid={renderGridEnabled}
							/>
						</div>
						<div class="mr-1 flex items-center justify-between gap-3">
							<Button class="min-w-48" onclick={generateGrid}><Play />Generate Grid</Button>
							<div class="flex items-center gap-3">
								<label class="flex items-center gap-2 text-sm">
									<Checkbox checked={renderGridEnabled} onCheckedChange={handleRenderGridToggle} />
									<span>Render Grid</span>
								</label>
								<label class="flex items-center gap-2 text-sm">
									<Checkbox
										checked={renderProfileEnabled}
										onCheckedChange={handleRenderProfileToggle}
									/>
									<span>Render Profile</span>
								</label>
								<Button
									onclick={() => {
										renderView.reset();
										appendLog('Reset view.');
									}}
								>
									<RotateCcw /> Reset View
								</Button>
							</div>
						</div>
						<div class="flex h-10 items-center justify-end border-t pr-2">
							<div class="flex items-center gap-2 text-sm">
								<span>blocks: {blockPoints.length}</span>
								<span class="text-muted-foreground">|</span>
								<span>points: {meshStats.points}</span>
								<span class="text-muted-foreground">|</span>
								<span>cells: {meshStats.cells}</span>
							</div>
						</div>
					</div>
				</Resizable.Pane>
				<Resizable.Handle withHandle />
				<Resizable.Pane defaultSize={25} minSize={10}>
					<div class="flex h-full min-h-0 flex-col">
						<div
							class="flex items-center justify-between border-b px-2 py-1 text-xs tracking-wide text-muted-foreground uppercase"
						>
							<span>Log</span>
							<span>{logEntries.length}</span>
						</div>
						<div
							class="min-h-0 flex-1 overflow-auto overflow-x-auto px-2 py-1 font-mono text-xs whitespace-pre"
							bind:this={logPane}
						>
							{#if logEntries.length === 0}
								<div class="text-muted-foreground">No log entries yet.</div>
							{:else}
								{#each logEntries as entry, index (entry + index)}
									<div>{entry}</div>
								{/each}
							{/if}
						</div>
					</div>
				</Resizable.Pane>
			</Resizable.PaneGroup>
		</Resizable.Pane>
	</Resizable.PaneGroup>
</div>
