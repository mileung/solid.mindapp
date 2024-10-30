import { MetaProvider, Style, Title } from '@solidjs/meta';
import { Router } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import { createEffect, Suspense } from 'solid-js';
import Header from './components/Header';
import '@fontsource-variable/quicksand';
import '@fontsource-variable/fira-code';
import '~/styles/root.css';
import '~/utils/theme';
import { usePrefersDark } from '@solid-primitives/media';

export default function App() {
	const prefersDark = usePrefersDark();
	createEffect(() => {
		prefersDark();
	});

	return (
		<Router
			root={(props) => (
				<MetaProvider>
					<Title>Mindapp</Title>
					<Header />
					<Suspense>{props.children}</Suspense>
				</MetaProvider>
			)}
		>
			<FileRoutes />
		</Router>
	);
}
