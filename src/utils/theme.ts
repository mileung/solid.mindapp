import { LocalState, getLocalState, updateLocalState } from './state';
import { isServer } from 'solid-js/web';

export const isDarkMode = () => document.documentElement.classList.contains('dark');

export const setTheme = (theme: LocalState['theme']) => {
	updateLocalState({ theme });
	const systemTheme = theme === 'System';
	const systemThemeIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
	if (theme === 'Dark' || (systemTheme && systemThemeIsDark)) {
		document.documentElement.classList.add('dark');
	} else if (theme === 'Light' || (systemTheme && !systemThemeIsDark)) {
		document.documentElement.classList.remove('dark');
	}
};

if (!isServer) setTheme(getLocalState().theme);

// console.log('test');

// const [theme, themeSet] = createSignal<'light' | 'dark' | 'system'>('system');
// const [isDark, setIsDark] = createSignal(false);

// const initializeTheme = () => {
// 	const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
// 	const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

// 	if (storedTheme) {
// 		setTheme(storedTheme);
// 	}

// 	setIsDark(storedTheme === 'dark' || (!storedTheme && prefersDark));
// };

// const updateTheme = () => {
// 	const currentTheme = theme();
// 	const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

// 	if (currentTheme === 'system') {
// 		setIsDark(prefersDark);
// 	} else {
// 		setIsDark(currentTheme === 'dark');
// 	}

// 	if (isDark()) {
// 		document.documentElement.classList.add('dark');
// 	} else {
// 		document.documentElement.classList.remove('dark');
// 	}

// 	localStorage.setItem('theme', currentTheme);
// };

// onMount(() => {
// 	initializeTheme();

// 	createEffect(() => {
// 		updateTheme();
// 		// Remove the 'theme-not-loaded' class after the theme is applied
// 		document.documentElement.classList.remove('theme-not-loaded');
// 	});

// 	const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
// 	const handler = (e: MediaQueryListEvent) => {
// 		if (theme() === 'system') {
// 			setIsDark(e.matches);
// 		}
// 	};
// 	mediaQuery.addEventListener('change', handler);

// 	return () => mediaQuery.removeEventListener('change', handler);
// });

// onMount(() => {
// 	const currentLocalState = getLocalState();
// 	let arr = currentLocalState.personas;
// 	if (hostedLocally) return arr;
// 	arr.forEach((p) => {
// 		if (p.id && p.encryptedMnemonic) {
// 			const decryptedMnemonic = decrypt(p.encryptedMnemonic, '');
// 			if (!validateMnemonic(decryptedMnemonic, wordlist)) return;
// 			passwords[p.id] = '';
// 		}
// 	});
// 	arr = arr.map((p) => ({ ...p, locked: passwords[p.id] === undefined }));
// 	if (arr[0].locked) {
// 		arr.unshift(
// 			arr.splice(
// 				arr.findIndex((p) => !p.id),
// 				1,
// 			)[0],
// 		);
// 	}
// 	// return arr;
// 	personasSet(arr);
// 	fetchedSpacesSet(currentLocalState.fetchedSpaces);
// 	localStateSet(currentLocalState);
// });
