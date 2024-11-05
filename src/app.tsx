import { MetaProvider, Title } from '@solidjs/meta';
import { Router } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import { createEffect, Suspense } from 'solid-js';
import Header from './components/Header';
import '@fontsource-variable/quicksand';
import '@fontsource-variable/fira-code';
import '~/styles/root.css';
import '~/utils/theme';
import {
	activeSpace,
	authorsSet,
	fetchedSpaces,
	fetchedSpacesSet,
	getLocalState,
	localState,
	localStateSet,
	personas,
	rootSettingsSet,
	tagTreeSet,
	updateLocalState,
} from './utils/state';
import { buildUrl, hostedLocally, makeUrl, ping, post } from './utils/api';
import { TagTree } from './utils/tags';
import { getMnemonic, sendMessage } from './utils/signing';
import { tokenNetwork } from './types/TokenNetwork';
import { setTheme } from '~/utils/theme';
import { RootSettings, Space, WorkingDirectory } from './utils/settings';
import { hashItem } from './utils/security';
import { Author } from './types/Author';
import { isServer } from 'solid-js/web';

export default function App() {
	// const prefersDark = usePrefersDark();
	// createEffect(() => {
	// 	console.log('test');
	// });

	let themeRef = localState.theme;

	// createEffect(() => {
	// 	if (!personas[0].id) return;
	// 	if (hostedLocally) {
	// 		ping<TagTree>(
	// 			makeUrl('receive-blocks'), //
	// 			post({ personaId: personas[0].id }),
	// 		).catch((err) => console.error(err));
	// 	} else {
	// 		const mnemonic = getMnemonic(personas[0].id);
	// 		const { walletAddress } = personas[0];
	// 		if (walletAddress && mnemonic) {
	// 			tokenNetwork.receiveBlocks(walletAddress, mnemonic);
	// 		}
	// 	}
	// }, [personas[0].id]);

	// createEffect(() => {
	// 	// does not exist on older browsers
	// 	if (window?.matchMedia('(prefers-color-scheme: dark)')?.addEventListener) {
	// 		window?.matchMedia('(prefers-color-scheme: dark)')?.addEventListener('change', () => {
	// 			setTheme(themeRef);
	// 		});
	// 	}
	// }, []);

	// createEffect(() => {
	// 	themeRef = localState.theme;
	// 	setTheme(localState.theme);
	// }, [localState?.theme]);

	// createEffect(() => {
	// 	if (!hostedLocally) return;
	// 	ping<{ rootSettings: RootSettings; workingDirectory: WorkingDirectory }>(
	// 		makeUrl('get-root-settings'),
	// 	)
	// 		.then(({ rootSettings, workingDirectory }) => {
	// 			rootSettingsSet(rootSettings);
	// 			workingDirectorySet(workingDirectory);
	// 		})
	// 		.catch((err) => console.error(err));
	// 	ping<WorkingDirectory>(makeUrl('get-working-directory'))
	// 		.then((data) => workingDirectorySet(data))
	// 		.catch((err) => console.error(err));
	// 	// ping<Persona[]>(
	// 	// 	makeUrl('get-personas'),
	// 	// 	post({
	// 	// 		order: getLocalState().personas.map(({ id }) => id),
	// 	// 	}),
	// 	// )
	// 	// 	.then((p) => {
	// 	// 		// console.log('p:', p);
	// 	// 		personasSet(p);
	// 	// 		localStateSet((old) => ({ ...old, personas: p }));
	// 	// 	})
	// 	// 	.catch((err) => console.error(err));
	// });

	createEffect(() => {
		const { host } = activeSpace;
		const savedTagTree = fetchedSpaces[host]?.tagTree;
		savedTagTree && tagTreeSet(savedTagTree);
		if (!host) {
			hostedLocally &&
				ping<TagTree>(makeUrl('get-tag-tree'))
					.then((data) => {
						// console.log('data:', data);
						tagTreeSet(data);
					})
					.catch((err) => console.error(err));
		} else {
			const { id, name, frozen, walletAddress, writeDate, signature } = personas[0];
			const tagTreeHash = savedTagTree && hashItem(savedTagTree);
			sendMessage<{ space: Omit<Space, 'host'> }>({
				from: id,
				to: buildUrl({ host, path: 'update-space-author' }),
				tagTreeHash,
				signedAuthor: !id
					? undefined
					: {
							id,
							name,
							frozen,
							walletAddress,
							writeDate,
							signature,
					  },
			})
				.then(({ space }) => {
					if (!id) space.fetchedSelf = new Author({});
					fetchedSpacesSet((old) => ({
						...old,
						[host]: {
							...old[host],
							...space,
							host,
						},
					}));
					space.tagTree && tagTreeSet(space.tagTree);
				})
				.catch((err) => {
					fetchedSpacesSet((old) => ({
						...old,
						[host]: { ...old[host], fetchedSelf: null },
					}));
				});
		}
	});

	// createEffect(() => {
	// 	authorsSet((old) => {
	// 		personas.forEach((p) => {
	// 			if (p.id && p.name) old[p.id] = { ...old[p.id], ...p };
	// 		});
	// 		return { ...old };
	// 	});
	// 	localStateSet((old) => ({ ...old, personas }));
	// 	if (hostedLocally) {
	// 		// TODO: Only update the persona that has its name changed?
	// 		ping(makeUrl('update-personas'), post({ personas: personas.filter((p) => !p.locked) })) //
	// 			.catch((err) => console.error(err));
	// 	}
	// }, [personas]);

	// createEffect(() => {
	// 	localStateSet((old) => ({ ...old, fetchedSpaces }));
	// }, [fetchedSpaces]);

	// createEffect(() => {
	// 	updateLocalState(localState);
	// }, [localState]);

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
