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
