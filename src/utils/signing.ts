import { hostedLocally, makeUrl, ping, post } from './api';
import { createKeyPair, decrypt, signItem } from './security';
import { validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { personas } from './state';
import { passwords } from '~/types/PersonasPolyfill';
import { SignedAuthor, UnsignedAuthor } from '~/types/Author';

type Item = string | Record<string, any> | any[];
export async function getSignature(item: Item, personaId?: string) {
	return '';
	// if (!personaId) return;
	// if (hostedLocally) {
	// 	const { signature } = await ping<{ signature?: string }>(
	// 		makeUrl('get-signature'),
	// 		post({ item, personaId }),
	// 	);
	// 	return signature;
	// } else {
	// 	// console.log(item, personaId);
	// 	// console.log(new Error().stack);
	// 	const persona = personas.find((p) => p.id === personaId);
	// 	if (!persona) throw new Error('Persona not found');
	// 	if (persona.locked) throw new Error('Persona locked');
	// 	const decryptedMnemonic = decrypt(persona.encryptedMnemonic!, passwords[persona.id]);
	// 	if (!validateMnemonic(decryptedMnemonic, wordlist)) {
	// 		throw new Error('Something went wrong');
	// 	}
	// 	const { publicKey, privateKey } = createKeyPair(decryptedMnemonic);
	// 	if (publicKey !== personaId) {
	// 		throw new Error('Mnemonic on file does not correspond to personaId');
	// 	}
	// 	return signItem(item, privateKey);
	// }
}

export async function getSignedAuthor(unsignedAuthor: UnsignedAuthor) {
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

export function getMnemonic(personaId: string) {
	return '';
	// if (!personaId) return '';
	// if (hostedLocally) throw new Error('Cannot call this');
	// const persona = personas.find((p) => p.id === personaId);
	// if (!persona) throw new Error('Persona not found');
	// if (persona.locked) throw new Error('Persona locked');
	// const decryptedMnemonic = decrypt(persona.encryptedMnemonic!, passwords[persona.id]);
	// if (!validateMnemonic(decryptedMnemonic, wordlist)) {
	// 	throw new Error('Something went wrong');
	// }
	// return decryptedMnemonic;
}
