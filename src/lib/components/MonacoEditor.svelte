<script lang="ts">
	import loader from '@monaco-editor/loader';
	import { onDestroy, onMount } from 'svelte';

	export let value = '';
	export let language = 'json';
	export let readOnly = false;
	export let ariaLabel = 'Code editor';

	let container: HTMLDivElement | null = null;
	let editor: import('monaco-editor').editor.IStandaloneCodeEditor | null = null;
	let disposeListener: (() => void) | null = null;

	onMount(async () => {
		loader.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs' } });

		try {
			const monaco = await loader.init();
			if (!container) return;

			const createdEditor = monaco.editor.create(container, {
				value,
				language,
				readOnly,
				theme: 'vs-dark',
				automaticLayout: true,
				minimap: { enabled: false },
				fontSize: 14,
				fontFamily: "'JetBrains Mono', 'Fira Code', 'SFMono-Regular', Menlo, monospace",
				fontLigatures: true,
				scrollBeyondLastLine: false,
				ariaLabel,
				wordWrap: 'on'
			});

			editor = createdEditor;

			const disposable = createdEditor.onDidChangeModelContent(() => {
				const nextValue = createdEditor.getValue();
				if (nextValue !== value) value = nextValue;
			});

			disposeListener = () => disposable.dispose();
		} catch (error) {
			console.error('Failed to initialize Monaco editor', error);
		}
	});

	$: if (editor && editor.getValue() !== value) {
		editor.setValue(value);
	}

	onDestroy(() => {
		disposeListener?.();
		editor?.dispose();
		editor = null;
	});
</script>

<div class="monaco-surface" bind:this={container} aria-label={ariaLabel}></div>

<style>
	.monaco-surface {
		height: 360px;
		width: 100%;
		border: 1px solid rgba(148, 163, 184, 0.35);
		border-radius: 14px;
		overflow: hidden;
		background:
			radial-gradient(circle at 50% 20%, rgba(59, 130, 246, 0.08), rgba(16, 185, 129, 0.05) 40%),
			#0a0f1c;
		box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.02);
	}
</style>
