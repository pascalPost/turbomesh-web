<script lang="ts">
	import * as Resizable from '$lib/components/ui/resizable/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import SiteHeader from '$lib/components/site-header.svelte';
	import Play from '@lucide/svelte/icons/play';
	import * as Turbomesh from '$lib/turbomesh';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import MonacoEditor from '$lib/components/monaco-editor.svelte';
	import RenderView from '$lib/components/render-view.svelte';
	import { onDestroy, onMount } from 'svelte';

	let monacoEditor: MonacoEditor | null = null;

	let turbomesh_sdk: Turbomesh.TurboMeshSDK | null = null;

	// TODO: replace with handle to mesh
	let blockCount: number = 0;

	onMount(async () => {
		turbomesh_sdk = await Turbomesh.TurboMeshSDK.load({
			wasmUrl: 'turbomesh.wasm',
			autoInit: false
		});
	});

	onDestroy(() => {
		turbomesh_sdk?.free();
	});

	function generateGrid() {
		if (!turbomesh_sdk) return;
		turbomesh_sdk.run();
		blockCount = turbomesh_sdk.blocksCount();
	}
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
				<RenderView />
				<div class="flex h-10 items-center justify-end border-t pr-2">
					<div>
						blocks: {blockCount}
					</div>
				</div>
			</div>
		</Resizable.Pane>
	</Resizable.PaneGroup>
</div>
