<script lang="ts">
	import loader from '@monaco-editor/loader';
	import { onMount, onDestroy } from 'svelte';
	import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api.d.ts';

	let editor: Monaco.editor.IStandaloneCodeEditor;
	let monaco: typeof Monaco;
	let container: HTMLElement;

	onMount(async () => {
		const monacoEditor = await import('monaco-editor');
		loader.config({ monaco: monacoEditor.default });

		monaco = await loader.init();

		editor = monaco.editor.create(container, {
			value: '',
			language: 'json',
			// theme: 'vs-dark',
			minimap: { enabled: false },
			automaticLayout: true,
			// fontFamily: "'JetBrains Mono', 'Fira Code', 'SFMono-Regular', Menlo, monospace",
			fontLigatures: true,
			scrollBeyondLastLine: false
		});
	});

	onDestroy(() => {
		editor?.dispose();
	});
</script>

<div class="container" bind:this={container} aria-label="Code Editor"></div>

<style>
	.container {
		width: 100%;
		height: 100%;
		overflow: hidden;
		border-radius: var(--radius);
	}
</style>
