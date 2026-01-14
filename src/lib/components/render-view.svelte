<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import { Canvas, T } from '@threlte/core';
	import { OrbitControls } from '@threlte/extras';
	import * as three from 'three';

	// Your 2D points (x,y)
	const pts: Array<[number, number]> = [
		[0, 0],
		[1, 2],
		[2, 1],
		[-1, 1]
	];

	const positions = new Float32Array(pts.length * 3);
	pts.forEach(([x, y], i) => {
		positions[i * 3 + 0] = x;
		positions[i * 3 + 1] = y;
		positions[i * 3 + 2] = 0;
	});

	const initialPosition: [number, number, number] = [0, 0, 10];
	const initialZoom = 100;

	let camera: three.OrthographicCamera | undefined = undefined;
	let controls: ComponentProps<typeof OrbitControls>['ref'] | undefined = undefined;

	export function reset() {
		if (!camera || !controls) return;
		console.log('Resetting camera position');
		camera.position.set(...initialPosition);
		camera.zoom = initialZoom;
		camera.updateProjectionMatrix();
		controls.reset();
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
			minZoom={5}
			maxZoom={500}
			bind:ref={controls}
		/>
	</T.OrthographicCamera>
	<T.Points>
		<T.BufferGeometry>
			<T.BufferAttribute
				args={[positions, 3]}
				attach={({ parent, ref }) => {
					(parent as three.BufferGeometry).setAttribute('position', ref);
				}}
			/>
		</T.BufferGeometry>

		<T.PointsMaterial size={10} />
	</T.Points>
	<T.AxesHelper args={[2]} />
</Canvas>
