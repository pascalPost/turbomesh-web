<script lang="ts">
	import loader from '@monaco-editor/loader';
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import { base } from '$app/paths';
	import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api.d.ts';
	import { mode } from 'mode-watcher';

	let editor: Monaco.editor.IStandaloneCodeEditor | undefined;
	let monaco: typeof Monaco | undefined;
	let container: HTMLElement;
	const dispatch = createEventDispatcher<{ loaded: void }>();

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

		await loadInitialExample();
		dispatch('loaded');
	});

	$effect(() => {
		const m = mode.current;
		if (m === undefined || !monaco) return;
		monaco.editor.setTheme(m === 'dark' ? 'vs-dark' : 'vs');
	});

	onDestroy(() => {
		editor?.dispose();
	});

	export async function loadFromUrl(url: string): Promise<boolean> {
		try {
			const response = await fetch(url);
			if (!response.ok) throw new Error(`Failed to load ${url} (${response.status})`);
			const text = await response.text();
			editor?.setValue(text);
			return true;
		} catch (error) {
			console.error('Failed to load example', error);
			return false;
		}
	}

	export async function loadInitialExample() {
		await loadFromUrl(`${base}/T106.json`);
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
