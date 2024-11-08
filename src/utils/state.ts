import { createSignal } from 'solid-js';
import { createStore } from 'solid-js/store';
import { SignedAuthor } from '../types/Author';
import { Persona } from '../types/PersonasPolyfill';
import { Thought } from './ClientThought';
import { defaultIdbStore, getIdbStore } from './indexedDb';
import { RootSettings, Space, WorkingDirectory } from './settings';
import { TagTree } from './tags';

export const [tagMapOpen, tagMapOpenSet] = createSignal<boolean>(false);
export const [theme, themeSet] = createSignal<string | 'system' | 'light' | 'dark'>('');

export const [personas, personasSet] = createStore<Persona[]>(defaultIdbStore.personas);
export const [roots, rootsSet] = createStore<(null | Thought)[]>([]);
export const [fetchedSpaces, fetchedSpacesSet] = createStore<Record<string, Space>>(
	defaultIdbStore.fetchedSpaces,
);
export const [authors, authorsSet] = createStore<Record<string, SignedAuthor>>({});
export const [mentionedThoughts, mentionedThoughtsSet] = createStore<Record<string, Thought>>({});
export const [rootSettings, rootSettingsSet] = createStore<RootSettings>({
	testWorkingDirectory: false,
});
export const [workingDirectory, workingDirectorySet] = createStore<WorkingDirectory>({
	gitSnapshotsEnabled: false,
	gitRemoteUrl: '',
	dirPath: '',
});
// export const [workingDirectory, workingDirectorySet] = createStore<
// 	{ loading: true } | WorkingDirectory
// >({ loading: true });

export const [tagTree, tagTreeSet] = createStore<TagTree>(defaultIdbStore.tagTree);
// TODO: For users hosting mindapp locally, indicate wherever tags are displayed which ones overlap with the local and space tag tree, tags that are specific  to the space, and tags that specific to what's local
// export const [localTagTree,localTagTreeSet] = createSignal<null | TagTree>(null);

export const activeSpace = fetchedSpaces[personas[0].spaceHosts[0]] || {
	host: personas[0].spaceHosts[0],
};
