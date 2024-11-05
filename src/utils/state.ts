import Ajv from 'ajv';
import { createMemo, createSignal } from 'solid-js';
import { createStore } from 'solid-js/store';
import { isServer } from 'solid-js/web';
import { SignedAuthor } from '../types/Author';
import { Persona } from '../types/PersonasPolyfill';
import { Thought } from './ClientThought';
import { hostedLocally, testingExternalClientLocally } from './api';
import { RootSettings, Space, WorkingDirectory } from './settings';
import { getTagRelations, listAllTags, TagTree } from './tags';

export const defaultSpaceHost = hostedLocally
	? ''
	: testingExternalClientLocally
	? 'localhost:8080'
	: 'api.mindapp.cc';

export type LocalState = {
	theme: 'System' | 'Light' | 'Dark';
	personas: Persona[];
	fetchedSpaces: Record<string, Space>;
};

const defaultLocalState: LocalState = {
	theme: 'System',
	personas: [{ id: '', spaceHosts: [defaultSpaceHost] }],
	fetchedSpaces: {},
};

const ajv = new Ajv({ verbose: true });

const schema = {
	type: 'object',
	properties: {
		theme: { enum: ['System', 'Light', 'Dark'] },
		personas: { type: 'array', items: { type: 'object' } },
		fetchedSpaces: { type: 'object' },
	},
	required: ['theme', 'personas', 'fetchedSpaces'],
	additionalProperties: true,
};

if (!ajv.validate(schema, defaultLocalState)) {
	alert('Invalid defaultLocalState');
}

export const getLocalState = () => {
	if (isServer) return defaultLocalState;
	const storedLocalState = localStorage.getItem('LocalState');
	const localState: LocalState = storedLocalState ? JSON.parse(storedLocalState) : {};
	// console.log('localState:', localState);

	const validLocalState = ajv.validate(schema, localState);
	// console.log('validLocalState:', validLocalState);
	// console.log(new Error().stack);
	if (!validLocalState) {
		localStorage.setItem('LocalState', JSON.stringify(defaultLocalState));
	}
	return validLocalState ? localState : defaultLocalState;
};

export const updateLocalState = (stateUpdate: Partial<LocalState>) => {
	if (isServer) return;
	const currentLocalState = getLocalState();
	const mergedState = { ...localState, ...stateUpdate };
	localStorage.setItem('LocalState', JSON.stringify(mergedState));
	return mergedState;
};

export const [tagMapOpen, tagMapOpenSet] = createSignal<boolean>(false);

export const [personas, personasSet] = createStore<Persona[]>(defaultLocalState.personas);
export const [roots, rootsSet] = createStore<(null | Thought)[]>([]);
export const [fetchedSpaces, fetchedSpacesSet] = createStore<Record<string, Space>>({});
export const [savedFileThoughtIds, savedFileThoughtIdsSet] = createStore<Record<string, boolean>>(
	{},
);
export const [authors, authorsSet] = createStore<Record<string, SignedAuthor>>({});
export const [mentionedThoughts, mentionedThoughtsSet] = createStore<Record<string, Thought>>({});
export const [rootSettings, rootSettingsSet] = createStore<RootSettings>({
	testWorkingDirectory: false,
});
// export const [workingDirectory, workingDirectorySet] = createStore<
// 	{ loading: true } | WorkingDirectory
// >({ loading: true });
export const [lastUsedTags, lastUsedTagsSet] = createStore<string[]>([]);
export const [localState, localStateSet] = createStore<LocalState>(defaultLocalState);
export const [tagTree, tagTreeSet] = createStore<TagTree>({
	// parents: {},
	// loners: [],
	parents: { Music: ['Rock Music', 'K-Pop'] },
	loners: ['Golf Course'],
});
// TODO: For users hosting mindapp locally, indicate wherever tags are displayed which ones overlap with the local and space tag tree, tags that are specific  to the space, and tags that specific to what's local
// export const [localTagTree,localTagTreeSet] = createSignal<null | TagTree>(null);

export const activeSpace = fetchedSpaces[personas[0].spaceHosts[0]] || {
	host: personas[0].spaceHosts[0],
};
