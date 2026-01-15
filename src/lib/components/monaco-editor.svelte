<script lang="ts">
	import loader from '@monaco-editor/loader';
	import { onMount, onDestroy } from 'svelte';
	import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api.d.ts';
	import { mode } from 'mode-watcher';

	let editor: Monaco.editor.IStandaloneCodeEditor | undefined;
	let monaco: typeof Monaco | undefined;
	let container: HTMLElement;

	onMount(async () => {
		const monacoEditor = await import('monaco-editor');
		loader.config({ monaco: monacoEditor.default });

		monaco = await loader.init();

		editor = monaco?.editor.create(container, {
			value: '',
			language: 'json',
			theme: mode.current === 'dark' ? 'vs-dark' : 'vs',
			minimap: { enabled: false },
			automaticLayout: true,
			fontLigatures: true,
			scrollBeyondLastLine: false,
			fontFamily: 'Geist Mono'
		});

		await reset();
	});

	$effect(() => {
		const m = mode.current;
		if (m === undefined || !monaco) return;
		monaco.editor.setTheme(m === 'dark' ? 'vs-dark' : 'vs');
	});

	onDestroy(() => {
		editor?.dispose();
	});

	export async function reset() {
		try {
			const response = await fetch('/T106.json');
			if (!response.ok) throw new Error(`Failed to load T106.json (${response.status})`);

			const text = await response.text();
			editor?.setValue(text);
		} catch (error) {
			console.error('Failed to load initial template', error);
		}
	}

	export function getValue() {
		return editor?.getValue() ?? '';
	}
</script>

<div class="container" bind:this={container} aria-label="Code Editor"></div>

<style>
	.container {
		width: 100%;
		height: 100%;
	}
</style>
