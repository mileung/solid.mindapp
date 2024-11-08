import { defineConfig } from '@solidjs/start/config';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
	vite: {
		plugins: [
			nodePolyfills({
				include: ['buffer', 'crypto'],
			}),
		],
	},
});
