<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import { Canvas, T } from '@threlte/core';
	import { OrbitControls } from '@threlte/extras';
	import * as three from 'three';
	import type { BlockPoints } from '$lib/turbomesh';

	const { blocks = [] } = $props<{ blocks?: BlockPoints[] }>();

	const initialPosition: [number, number, number] = [0, 0, 10];
	const initialZoom = 100;
	const minZoom = 5;
	const maxZoom = 500;

	let camera = $state<three.OrthographicCamera | undefined>(undefined);
	let controls: ComponentProps<typeof OrbitControls>['ref'] | undefined = $state(undefined);

	const positions = $derived(blocks.length ? toPosition(blocks) : new Float32Array());
	const linePositions = $derived(blocks.length ? toLinePositions(blocks) : new Float32Array());

	// compute bounds/center/zoom
	const fit = $derived.by(() => {
		if (!camera || positions.length < 3) return null;
		const cam = camera;
		let minX = positions[0],
			maxX = positions[0];
		let minY = positions[1],
			maxY = positions[1];

		for (let i = 0; i < positions.length; i += 3) {
			const x = positions[i];
			const y = positions[i + 1];
			if (x < minX) minX = x;
			if (x > maxX) maxX = x;
			if (y < minY) minY = y;
			if (y > maxY) maxY = y;
		}

		const centerX = (minX + maxX) / 2;
		const centerY = (minY + maxY) / 2;

		const width = Math.max(maxX - minX, 1e-6);
		const height = Math.max(maxY - minY, 1e-6);
		const viewWidth = cam.right - cam.left;
		const viewHeight = cam.top - cam.bottom;
		const padding = 1.1;

		const zoom = Math.min(viewWidth / (width * padding), viewHeight / (height * padding));

		return { minX, maxX, minY, maxY, centerX, centerY, zoom };
	});

	$effect(() => {
		if (!camera || !controls || !fit) return;
		controls.target.set(fit.centerX, fit.centerY, 0);
		camera.position.set(fit.centerX, fit.centerY, camera.position.z);
		camera.zoom = three.MathUtils.clamp(fit.zoom, minZoom, maxZoom);
		camera.updateProjectionMatrix();
		controls.update();
	});

	export function reset() {
		if (!camera || !controls) return;
		console.log('Resetting camera position');
		camera.position.set(...initialPosition);
		camera.zoom = initialZoom;
		camera.updateProjectionMatrix();
		controls.reset();
	}

	function toPosition(blocks: BlockPoints[]): Float32Array {
		const totalPoints = blocks.reduce((sum, block) => sum + block.size.i * block.size.j, 0);
		const pos = new Float32Array(totalPoints * 3);

		let offset = 0;
		for (const block of blocks) {
			const data = block.values;
			for (let i = 0; i < data.length; i += 2) {
				pos[offset++] = data[i];
				pos[offset++] = data[i + 1];
				pos[offset++] = 0;
			}
		}

		return pos;
	}

	function toLinePositions(blocks: BlockPoints[]): Float32Array {
		let totalSegments = 0;
		for (const block of blocks) {
			totalSegments += block.size.i * (block.size.j - 1);
			totalSegments += (block.size.i - 1) * block.size.j;
		}

		const pos = new Float32Array(totalSegments * 2 * 3);
		let offset = 0;

		for (const block of blocks) {
			const { size, values } = block;
			const stride = 2;

			const readPoint = (i: number, j: number) => {
				const idx = stride * (j + size.j * i);
				return { x: values[idx], y: values[idx + 1] };
			};

			for (let i = 0; i < size.i; i += 1) {
				for (let j = 0; j < size.j - 1; j += 1) {
					const a = readPoint(i, j);
					const b = readPoint(i, j + 1);
					pos[offset++] = a.x;
					pos[offset++] = a.y;
					pos[offset++] = 0;
					pos[offset++] = b.x;
					pos[offset++] = b.y;
					pos[offset++] = 0;
				}
			}

			for (let i = 0; i < size.i - 1; i += 1) {
				for (let j = 0; j < size.j; j += 1) {
					const a = readPoint(i, j);
					const b = readPoint(i + 1, j);
					pos[offset++] = a.x;
					pos[offset++] = a.y;
					pos[offset++] = 0;
					pos[offset++] = b.x;
					pos[offset++] = b.y;
					pos[offset++] = 0;
				}
			}
		}

		return pos;
	}
</script>

<Canvas>
	<T.OrthographicCamera makeDefault position={initialPosition} zoom={initialZoom} bind:ref={camera}>
		<OrbitControls
			enableRotate={false}
			enableDamping={false}
			zoomToCursor={true}
			mouseButtons={{
				LEFT: three.MOUSE.PAN,
				MIDDLE: three.MOUSE.DOLLY,
				RIGHT: three.MOUSE.PAN
			}}
			bind:ref={controls}
		/>
	</T.OrthographicCamera>
	<T.LineSegments>
		<T.BufferGeometry>
			<T.BufferAttribute
				args={[linePositions, 3]}
				attach={({ parent, ref }) => {
					(parent as three.BufferGeometry).setAttribute('position', ref);
				}}
			/>
		</T.BufferGeometry>
		<T.LineBasicMaterial color="#e2e8f0" transparent opacity={0.8} />
	</T.LineSegments>
	<!-- <T.AxesHelper args={[2]} /> -->
</Canvas>
