// import Ajv from 'ajv';
// import { createKeyPair, decrypt, encrypt, signItem, verifyItem } from '../utils/security';
// import { generateMnemonic } from '@scure/bip39';
// import { wordlist } from '@scure/bip39/wordlists/english';
// import { wallet } from '@vite/vitejs/es5';

// export type Peep = {
// 	spaceHosts: string[];
// 	id: string;
// 	writeDate?: number;
// 	name?: string;
// 	frozen?: true;
// 	walletAddress?: string;
// 	signature?: string;
// 	encryptedMnemonic?: string;
// };

// let passwords: Record<string, string> = {};

// export function makePeep(
// 	{
// 		spaceHosts = [''],
// 		id,
// 		writeDate = Date.now(),
// 		name,
// 		frozen,
// 		walletAddress,
// 		signature,
// 		encryptedMnemonic,
// 	}: Partial<Peep> = {},
// 	mnemonic?: string,
// 	password = '',
// ): Peep {
// 	const decryptedMnemonic = encryptedMnemonic && decrypt(encryptedMnemonic, password);
// 	if (encryptedMnemonic && mnemonic && decryptedMnemonic !== mnemonic)
// 		throw new Error('decryptedMnemonic !== mnemonic');
// 	mnemonic = mnemonic || decryptedMnemonic || generateMnemonic(wordlist);
// 	const keyPair = createKeyPair(decryptedMnemonic || mnemonic);
// 	const unsignedAuthor = {
// 		writeDate,
// 		id: id || keyPair.publicKey,
// 		name,
// 		frozen,
// 		walletAddress:
// 			walletAddress ||
// 			(mnemonic && (wallet.deriveAddress({ mnemonics: mnemonic, index: 0 }).address as string)),
// 	};
// 	const signedAuthor = {
// 		...unsignedAuthor,
// 		signature: signature || signItem(unsignedAuthor, keyPair.privateKey),
// 	};
// 	const peep = {
// 		...signedAuthor,
// 		encryptedMnemonic: mnemonic && encrypt(mnemonic, password),
// 		spaceHosts,
// 	};
// 	if (!validatePeep(peep)) throw new Error('Invalid peep');
// 	return Object.freeze(peep);
// }

// const ajv = new Ajv();
// const schema = {
// 	type: 'object',
// 	properties: {
// 		encryptedMnemonic: { type: 'string' },
// 		id: { type: 'string' },
// 		name: { type: 'string' },
// 		walletAddress: { type: 'string' },
// 		frozen: { type: 'boolean' },
// 		writeDate: { type: 'number' },
// 		signature: { type: 'string' },
// 		spaceHosts: {
// 			type: 'array',
// 			items: { type: 'string' },
// 		},
// 	},
// 	required: ['id', 'spaceHosts'],
// 	additionalProperties: false,
// };

// export function validatePeep(thing: any) {
// 	return ajv.validate(schema, thing);
// }
