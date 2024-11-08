import { setCookie } from './cookies';

export const isDarkMode = () => document.documentElement.classList.contains('dark');

export const setTheme = (mode: string) => {
	const systemTheme = mode === 'system';
	const systemThemeIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
	let theme = 'dark';
	if (mode === 'dark' || (systemTheme && systemThemeIsDark)) {
		document.documentElement.classList.add('dark');
	} else if (mode === 'light' || (systemTheme && !systemThemeIsDark)) {
		theme = 'light';
		document.documentElement.classList.remove('dark');
	}
	setCookie('theme', `${systemTheme ? 'system:' : ''}${theme}`);
	return theme;
};
