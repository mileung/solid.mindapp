import { defineConfig } from '@solidjs/start/config';

export default defineConfig({
	vite: {
		resolve: {
			alias: {
				process: 'process/browser',
			},
		},
	},
});
