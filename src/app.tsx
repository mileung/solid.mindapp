import { MetaProvider, Title } from '@solidjs/meta';
import { Router } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import { Suspense } from 'solid-js';
import '~/styles/root.css';
import Header from './components/Header';

export default function App() {
	return (
		<Router
			root={(props) => (
				<MetaProvider>
					<Title>Mindapp</Title>
					<Header />
					{/* <Suspense>{props.children}</Suspense> */}
				</MetaProvider>
			)}
		>
			<FileRoutes />
		</Router>
	);
}
