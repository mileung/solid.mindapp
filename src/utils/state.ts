import { Persona, passwords } from '../types/PersonasPolyfill';
import { Thought } from './ClientThought';
import { hostedLocally, makeUrl, ping, post, testingExternalClientLocally } from './api';
import { createKeyPair, decrypt, signItem } from './security';
import { RootSettings, Space, WorkingDirectory } from './settings';
import { TagTree } from './tags';
import Ajv from 'ajv';
import { validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { SignedAuthor, UnsignedAuthor } from '../types/Author';
import { createSignal } from 'solid-js';
import { createStore } from 'solid-js/store';

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
	return defaultLocalState;
	// const storedLocalState = localStorage.getItem('LocalState');
	// const localState: LocalState = storedLocalState ? JSON.parse(storedLocalState) : {};
	// // console.log('localState:', localState);

	// const validLocalState = ajv.validate(schema, localState);
	// // console.log('validLocalState:', validLocalState);
	// // console.log(new Error().stack);
	// if (!validLocalState) {
	// 	localStorage.setItem('LocalState', JSON.stringify(defaultLocalState));
	// }
	// return validLocalState ? localState : defaultLocalState;
};

export const updateLocalState = (stateUpdate: Partial<LocalState>) => {
	const currentLocalState = getLocalState();
	const mergedState = { ...currentLocalState, ...stateUpdate };
	localStorage.setItem('LocalState', JSON.stringify(mergedState));
	return mergedState;
};

const currentLocalState = getLocalState();
export const [personas, personasSet] = createStore<Persona[]>(
	(() => {
		let arr = currentLocalState.personas;
		if (hostedLocally) return arr;

		arr.forEach((p) => {
			if (p.id && p.encryptedMnemonic) {
				const decryptedMnemonic = decrypt(p.encryptedMnemonic, '');
				if (!validateMnemonic(decryptedMnemonic, wordlist)) return;
				passwords[p.id] = '';
			}
		});
		arr = arr.map((p) => ({ ...p, locked: passwords[p.id] === undefined }));
		if (arr[0].locked) {
			arr.unshift(
				arr.splice(
					arr.findIndex((p) => !p.id),
					1,
				)[0],
			);
		}
		return arr;
	})(),
);
export const [tagMapOpen, tagMapOpenSet] = createSignal<boolean>(false);
export const [fetchedSpaces, fetchedSpacesSet] = createSignal<Record<string, Space>>(
	currentLocalState.fetchedSpaces,
);
export const [savedFileThoughtIds, savedFileThoughtIdsSet] = createSignal<Record<string, boolean>>(
	{},
);
export const [authors, authorsSet] = createSignal<Record<string, SignedAuthor>>({});
export const [mentionedThoughts, mentionedThoughtsSet] = createSignal<Record<string, Thought>>({});
export const [rootSettings, rootSettingsSet] = createSignal<null | RootSettings>(null);
export const [workingDirectory, workingDirectorySet] = createSignal<
	undefined | null | WorkingDirectory
>(undefined);
export const [lastUsedTags, lastUsedTagsSet] = createStore<string[]>([]);
export const [localState, localStateSet] = createSignal<LocalState>(currentLocalState);
export const [tagTree, tagTreeSet] = createStore<TagTree>({
	parents: {},
	loners: [],
});
// TODO: For users hosting mindapp locally, indicate wherever tags are displayed which ones overlap with the local and space tag tree, tags that are specific  to the space, and tags that specific to what's local
// export const [localTagTree,localTagTreeSet] = createSignal<null | TagTree>(null);

type Item = string | Record<string, any> | any[];
export async function getSignature(item: Item, personaId?: string) {
	if (!personaId) return;
	if (hostedLocally) {
		const { signature } = await ping<{ signature?: string }>(
			makeUrl('get-signature'),
			post({ item, personaId }),
		);
		return signature;
	} else {
		// console.log(item, personaId);
		// console.log(new Error().stack);
		const persona = personas.find((p) => p.id === personaId);
		if (!persona) throw new Error('Persona not found');
		if (persona.locked) throw new Error('Persona locked');
		const decryptedMnemonic = decrypt(persona.encryptedMnemonic!, passwords[persona.id]);
		if (!validateMnemonic(decryptedMnemonic, wordlist)) {
			throw new Error('Something went wrong');
		}
		const { publicKey, privateKey } = createKeyPair(decryptedMnemonic);
		if (publicKey !== personaId) {
			throw new Error('Mnemonic on file does not correspond to personaId');
		}
		return signItem(item, privateKey);
	}
}

export async function useGetSignedAuthor(unsignedAuthor: UnsignedAuthor) {
	const signedAuthor: SignedAuthor = {
		...unsignedAuthor,
		signature: (await getSignature(unsignedAuthor, unsignedAuthor.id))!,
	};
	return signedAuthor;
}

type Message = {
	[key: string]: any;
	to: string;
	from?: string;
};
export async function sendMessage<T>(message: Message) {
	return await ping<T>(
		message.to,
		post({ message, fromSignature: await getSignature(message, message.from) }),
	);
}

export const activeSpace = fetchedSpaces()[personas[0].spaceHosts[0]] || {
	host: personas[0].spaceHosts[0],
};

export function getMnemonic(personaId: string) {
	if (!personaId) return '';
	if (hostedLocally) throw new Error('Cannot call this');
	const persona = personas.find((p) => p.id === personaId);
	if (!persona) throw new Error('Persona not found');
	if (persona.locked) throw new Error('Persona locked');
	const decryptedMnemonic = decrypt(persona.encryptedMnemonic!, passwords[persona.id]);
	if (!validateMnemonic(decryptedMnemonic, wordlist)) {
		throw new Error('Something went wrong');
	}
	return decryptedMnemonic;
}
