<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { Canvas, T } from '@threlte/core';
	import { OrbitControls } from '@threlte/extras';
	import * as THREE from 'three';
	import { TurboMeshSDK, type BlockPoints } from '../lib/turbomesh';
	import MonacoEditor from '../lib/components/MonacoEditor.svelte';

	type Bounds = { min: { x: number; y: number }; max: { x: number; y: number } };

	let loading = true;
	let errorMessage = '';
	let blocksCount: number | null = null;
	let sdkSnippet = ``;

	let dpr = 1;
	let span = 1;
	let center: [number, number, number] = [0, 0, 0];
	let cameraPosition: [number, number, number] = [0, 0, 3];
	let geometries: THREE.BufferGeometry[] = [];
	let colors: number[] = [];

	onMount(async () => {
		loadExampleInput();

		dpr = Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);

		try {
			const { blocks, count } = await loadMesh();
			blocksCount = count;

			const bounds = computeBounds(blocks);
			span = Math.max(bounds.max.x - bounds.min.x, bounds.max.y - bounds.min.y) || 1;
			center = [(bounds.min.x + bounds.max.x) / 2, (bounds.min.y + bounds.max.y) / 2, 0];
			cameraPosition = [center[0], center[1], span * 1.5];

			geometries = buildGeometries(blocks);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			errorMessage = `Failed to render turbomesh: ${message}`;
		} finally {
			loading = false;
		}
	});

	onDestroy(() => disposeGeometries());

	async function loadExampleInput() {
		const response = await fetch('/T106.json');
		const string_content = await response.text();
		sdkSnippet = string_content;
	}

	async function loadMesh() {
		const sdk = await TurboMeshSDK.load({ wasmUrl: '/turbomesh.wasm', autoInit: false });
		let blocks: BlockPoints[] = [];
		let count = 0;
		try {
			sdk.run();
			count = sdk.blocksCount();
			blocks = Array.from({ length: count }, (_, i) => sdk.blockPointsCopy(i));
		} finally {
			sdk.free();
		}

		return { blocks, count };
	}

	function computeBounds(blocks: BlockPoints[]): Bounds {
		let minX = Number.POSITIVE_INFINITY;
		let minY = Number.POSITIVE_INFINITY;
		let maxX = Number.NEGATIVE_INFINITY;
		let maxY = Number.NEGATIVE_INFINITY;

		for (const block of blocks) {
			const data = block.values;
			for (let i = 0; i < data.length; i += 2) {
				const x = data[i];
				const y = data[i + 1];
				if (x < minX) minX = x;
				if (y < minY) minY = y;
				if (x > maxX) maxX = x;
				if (y > maxY) maxY = y;
			}
		}

		if (!Number.isFinite(minX)) {
			minX = -1;
			maxX = 1;
			minY = -1;
			maxY = 1;
		}

		return { min: { x: minX, y: minY }, max: { x: maxX, y: maxY } };
	}

	function buildGeometries(blocks: BlockPoints[]) {
		disposeGeometries();
		const nextColors: number[] = [];
		const nextGeometries = blocks.map((block, idx) => {
			nextColors.push(new THREE.Color().setHSL(0.55 + ((idx * 0.12) % 1), 0.75, 0.6).getHex());
			return buildBlockWireframe(block);
		});
		colors = nextColors;
		return nextGeometries;
	}

	function buildBlockWireframe(block: BlockPoints) {
		const { size, values } = block;
		const positions: number[] = [];
		const stride = 2;

		// Points are packed column-major as [x0, y0, x1, y1, ...] where index = j + size.j * i.
		const readPoint = (i: number, j: number) => {
			const idx = stride * (j + size.j * i);
			return { x: values[idx], y: values[idx + 1] };
		};

		for (let i = 0; i < size.i; i += 1) {
			for (let j = 0; j < size.j - 1; j += 1) {
				const a = readPoint(i, j);
				const b = readPoint(i, j + 1);
				positions.push(a.x, a.y, 0, b.x, b.y, 0);
			}
		}

		for (let i = 0; i < size.i - 1; i += 1) {
			for (let j = 0; j < size.j; j += 1) {
				const a = readPoint(i, j);
				const b = readPoint(i + 1, j);
				positions.push(a.x, a.y, 0, b.x, b.y, 0);
			}
		}

		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
		geometry.computeBoundingSphere();
		return geometry;
	}

	function disposeGeometries() {
		geometries.forEach((g) => g.dispose());
		geometries = [];
	}
</script>

<main>
	<header class="hero">
		<div>
			<p class="eyebrow">TurboMesh · WASM</p>
			<h1>Three.js mesh viewer</h1>
			<p class="lede">
				The mesh is generated in WebAssembly, extracted block-by-block, and rendered as a wireframe
				grid.
			</p>
		</div>
		<div class="stats">
			<span class="label">Blocks</span>
			<span class="value">{blocksCount ?? '–'}</span>
		</div>
	</header>

	<section class="viewer">
		{#if loading}
			<div class="overlay">Loading turbomesh.wasm and building the mesh…</div>
		{:else if errorMessage}
			<div class="overlay error">{errorMessage}</div>
		{:else if geometries.length}
			<Canvas
				{dpr}
				createRenderer={(canvas) => new THREE.WebGLRenderer({ canvas, antialias: true })}
			>
				<T.Group>
					<T.PerspectiveCamera
						position={cameraPosition}
						up={[0, 0, 1]}
						fov={45}
						near={0.001}
						far={span * 10}
						makeDefault
					>
						<OrbitControls
							target={center}
							maxDistance={span * 5}
							enableRotate={false}
							enableDamping={false}
							panSpeed={2}
							mouseButtons={{
								LEFT: THREE.MOUSE.PAN,
								RIGHT: THREE.MOUSE.PAN,
								MIDDLE: THREE.MOUSE.DOLLY
							}}
						/>
					</T.PerspectiveCamera>
					<T.AmbientLight intensity={0.35} />
					<T.DirectionalLight position={[span * 0.4, -span * 0.4, span]} intensity={0.65} />
					<T.AxesHelper args={[span * 0.35]} position={center} />

					{#each geometries as geometry, idx}
						<T.LineSegments {geometry}>
							<T.LineBasicMaterial color={colors[idx]} transparent opacity={0.95} linewidth={1.5} />
						</T.LineSegments>
					{/each}
				</T.Group>
			</Canvas>
		{/if}
	</section>

	<section class="editor-panel">
		<div class="editor-top">
			<div>
				<p class="eyebrow">Playground</p>
				<h2>Monaco editor</h2>
				<p class="lede">
					Experiment with the TurboMesh SDK from the browser; edits stay local to this session.
				</p>
			</div>
			<span class="pill">Monaco</span>
		</div>
		<MonacoEditor ariaLabel="TurboMesh SDK example" bind:value={sdkSnippet} language="json" />
		<p class="note">Copy the snippet into your own project or tweak it to inspect block data.</p>
	</section>

	<p class="hint">Drag to pan, scroll to zoom. Data is streamed directly from turbomesh.wasm.</p>
</main>

<style>
	:global(body) {
		margin: 0;
		background: radial-gradient(circle at 20% 20%, #0f172a, #05070f 50%);
		color: #e5e7eb;
		font-family: 'Inter', 'Soehne', 'Helvetica Neue', Arial, sans-serif;
	}

	main {
		max-width: 1200px;
		padding: 2rem;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.hero {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		gap: 1rem;
	}

	.eyebrow {
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-size: 0.8rem;
		color: #60a5fa;
		margin: 0 0 0.35rem;
	}

	h1 {
		margin: 0;
		font-size: clamp(1.8rem, 3vw, 2.4rem);
	}

	.lede {
		margin: 0.35rem 0 0;
		color: #cbd5e1;
		max-width: 60ch;
	}

	.stats {
		background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(16, 185, 129, 0.15));
		border: 1px solid rgba(148, 163, 184, 0.4);
		border-radius: 12px;
		padding: 0.85rem 1.2rem;
		display: inline-flex;
		flex-direction: column;
		gap: 0.2rem;
		min-width: 110px;
		text-align: right;
	}

	.stats .label {
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-size: 0.7rem;
		color: #cbd5e1;
	}

	.stats .value {
		font-size: 1.8rem;
		font-weight: 700;
	}

	.viewer {
		position: relative;
		height: 70vh;
		border-radius: 16px;
		overflow: hidden;
		border: 1px solid rgba(148, 163, 184, 0.35);
		background:
			radial-gradient(circle at 30% 10%, rgba(59, 130, 246, 0.08), transparent 30%),
			radial-gradient(circle at 70% 60%, rgba(16, 185, 129, 0.12), transparent 35%), #0a0f1c;
		box-shadow:
			0 30px 80px rgba(0, 0, 0, 0.35),
			inset 0 0 0 1px rgba(255, 255, 255, 0.03);
	}

	:global(.viewer canvas) {
		width: 100%;
		height: 100%;
		display: block;
	}

	.overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(5, 6, 12, 0.7);
		backdrop-filter: blur(4px);
		color: #f8fafc;
		font-weight: 600;
		letter-spacing: 0.02em;
	}

	.overlay.error {
		background: rgba(127, 29, 29, 0.6);
		color: #fee2e2;
	}

	.editor-panel {
		border: 1px solid rgba(148, 163, 184, 0.35);
		border-radius: 16px;
		padding: 1.25rem;
		background: linear-gradient(
			145deg,
			rgba(59, 130, 246, 0.08),
			rgba(16, 185, 129, 0.06) 45%,
			rgba(15, 23, 42, 0.9)
		);
		box-shadow:
			0 25px 60px rgba(0, 0, 0, 0.35),
			inset 0 0 0 1px rgba(255, 255, 255, 0.03);
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
	}

	.editor-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.editor-top h2 {
		margin: 0;
		font-size: clamp(1.3rem, 2vw, 1.5rem);
	}

	.pill {
		padding: 0.4rem 0.85rem;
		background: rgba(59, 130, 246, 0.16);
		border: 1px solid rgba(96, 165, 250, 0.55);
		color: #bfdbfe;
		border-radius: 999px;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		font-size: 0.75rem;
	}

	.note {
		margin: 0;
		color: #cbd5e1;
	}

	.hint {
		color: #94a3b8;
		margin: 0;
	}

	@media (max-width: 800px) {
		main {
			padding: 1.25rem;
		}

		.hero {
			flex-direction: column;
			align-items: flex-start;
		}

		.stats {
			align-self: flex-end;
		}

		.viewer {
			height: 60vh;
		}
	}
</style>
