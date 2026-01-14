<script lang="ts">
	import * as Resizable from '$lib/components/ui/resizable/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import SiteHeader from '$lib/components/site-header.svelte';
	import Play from '@lucide/svelte/icons/play';
	import * as TurboMesh from '$lib/turbomesh';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import MonacoEditor from '$lib/components/monaco-editor.svelte';
	import RenderView from '$lib/components/render-view.svelte';
	import { onDestroy, onMount } from 'svelte';

	let monacoEditor: MonacoEditor | null = $state(null);

	let turbomesh_sdk: TurboMesh.TurboMeshSDK | null = null;

	let blockPoints = $state<TurboMesh.BlockPoints[]>([]);

	onMount(async () => {
		turbomesh_sdk = await TurboMesh.TurboMeshSDK.load({
			wasmUrl: 'turbomesh.wasm',
			autoInit: false
		});
	});

	onDestroy(() => {
		turbomesh_sdk?.free();
	});

	function generateGrid() {
		const sdk = turbomesh_sdk;
		if (!sdk) return;
		sdk.run();
		const count = sdk.blocksCount();
		blockPoints = Array.from({ length: count }, (_, i) => sdk.blockPointsView(i));
	}

	let renderView: RenderView;
</script>

<div class="flex h-screen flex-col pb-1 [--header-height:calc(--spacing(14))]">
	<SiteHeader />
	<Resizable.PaneGroup direction="horizontal">
		<Resizable.Pane>
			<div class="flex h-full flex-col gap-2">
				<MonacoEditor bind:this={monacoEditor} />
				<div class="flex flex-wrap gap-2">
					<Button class="min-w-48 flex-1" onclick={generateGrid}><Play />Generate Grid</Button>
					<Button class="min-w-48 flex-1" onclick={monacoEditor?.reset}><RotateCcw />Reset</Button>
				</div>
			</div>
		</Resizable.Pane>
		<Resizable.Handle withHandle />
		<Resizable.Pane>
			<div class="flex h-full flex-col gap-1">
				<RenderView bind:this={renderView} blocks={blockPoints} />
				<Button class="mr-1 self-end" onclick={() => renderView.reset()}>
					<RotateCcw /> Reset View
				</Button>
				<div class="flex h-10 items-center justify-end border-t pr-2">
					<div>
						blocks: {blockPoints.length}
					</div>
				</div>
			</div>
		</Resizable.Pane>
	</Resizable.PaneGroup>
</div>
