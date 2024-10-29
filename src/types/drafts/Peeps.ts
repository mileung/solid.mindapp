// import Ajv from 'ajv';
// // import { WorkingDirectory } from './WorkingDirectory';
// // import { parseFile, writeObjectFile } from '../utils/files';
// import { Item, createKeyPair, decrypt, encrypt, signItem } from '../utils/security';
// import { validateMnemonic } from '@scure/bip39';
// import { wordlist } from '@scure/bip39/wordlists/english';
// import { wallet } from '@vite/vitejs/es5';
// import { getLocalState } from '../utils/state';
// // import env from '../utils/env';
// // import { inGroup } from '../db';

// const ajv = new Ajv();
// console.log('Ajv:', Ajv);

// const schema = {
// 	type: 'object',
// 	properties: {
// 		list: {
// 			type: 'array',
// 			items: {
// 				type: 'object',
// 				properties: {
// 					encryptedMnemonic: { type: 'string' },
// 					id: { type: 'string' },
// 					name: { type: 'string' },
// 					walletAddress: { type: 'string' },
// 					frozen: { type: 'boolean' },
// 					writeDate: { type: 'number' },
// 					signature: { type: 'string' },
// 					spaceHosts: {
// 						type: 'array',
// 						items: { type: 'string' },
// 					},
// 				},
// 				required: ['id', 'spaceHosts'],
// 			},
// 		},
// 	},
// 	required: ['list'],
// 	additionalProperties: false,
// };

// // export type UnsignedAuthor = {
// // 	writeDate: number;
// // 	id: string;
// // 	name?: string;
// // 	frozen?: true;
// // 	walletAddress?: string;
// // };

// // export type SignedAuthor = UnsignedAuthor & {
// // 	signature: string;
// // };

// // type Peep = Partial<SignedAuthor> & {
// // 	encryptedMnemonic?: string;
// // 	spaceHosts: string[];
// // };

// // let passwords: Record<string, string> = {};

// // export class Peeps {
// // 	public list: Peep[];

// // 	constructor({ list = [{ id: '', spaceHosts: [''] }] }: { list?: Peep[] }) {
// // 		// if (env.GLOBAL_HOST) throw new Error('Global space cannot use Peeps');
// // 		this.list = list;
// // 		// console.log("this:", this);
// // 		if (!ajv.validate(schema, this)) throw new Error('Invalid Peeps: ' + JSON.stringify(this));
// // 	}

// // 	get clientArr() {
// // 		const list = this.list.map((p, i) => {
// // 			return {
// // 				...p,
// // 				encryptedMnemonic: undefined,
// // 				locked: (p.id && passwords[p.id] === undefined) || undefined,
// // 			};
// // 		});
// // 		return list;
// // 	}

// // 	static get() {
// // 		return new Peeps({ list: [getLocalState().peeps] });
// // 	}

// // 	get savedProps() {
// // 		return {
// // 			list: this.list,
// // 		};
// // 	}

// // 	overwrite() {
// // 		// writeObjectFile(WorkingDirectory.personasPath, this.savedProps);
// // 	}

// // 	prioritizePeep(personaId: string, index = 0) {
// // 		const personaIndex = this.findIndex(personaId);
// // 		if (personaIndex === -1) throw new Error('Peep not found');
// // 		this.list.splice(index, 0, this.list.splice(personaIndex, 1)[0]);
// // 		this.overwrite();
// // 	}

// // 	prioritizeSpace(personaId: string, spaceHost: string, index = 0) {
// // 		const personaIndex = this.findIndex(personaId);
// // 		if (personaIndex === -1) throw new Error('persona Peep not found');
// // 		const persona = this.list[personaIndex];
// // 		const spaceIndex = persona.spaceHosts.findIndex((id) => id === spaceHost);
// // 		if (spaceIndex === -1) throw new Error('space persona not found');
// // 		persona.spaceHosts.splice(index, 0, persona.spaceHosts.splice(spaceIndex, 1)[0]);
// // 		this.overwrite();
// // 	}

// // 	addSpace(personaId: string, spaceHost: string) {
// // 		const persona = this.find(personaId);
// // 		if (!persona) throw new Error('Peep not found');
// // 		persona.spaceHosts.unshift(spaceHost);
// // 		this.overwrite();
// // 	}

// // 	removeSpace(personaId: string, spaceHost: string) {
// // 		const persona = this.find(personaId);
// // 		if (!persona) throw new Error('Peep not found');
// // 		persona.spaceHosts.splice(persona.spaceHosts.indexOf(spaceHost), 1);
// // 		this.overwrite();
// // 	}

// // 	addPeep({
// // 		mnemonic,
// // 		password,
// // 		name,
// // 		frozen,
// // 		walletAddress,
// // 	}: {
// // 		mnemonic: string;
// // 		password: string;
// // 		name?: string;
// // 		frozen?: true;
// // 		walletAddress?: string;
// // 	}) {
// // 		const { publicKey, privateKey } = createKeyPair(mnemonic);
// // 		if (this.find(publicKey)) throw new Error('publicKey already used');
// // 		const writeDate = Date.now();
// // 		const unsignedAuthor: UnsignedAuthor = {
// // 			writeDate,
// // 			id: publicKey,
// // 			name,
// // 			frozen,
// // 			walletAddress:
// // 				walletAddress || wallet.deriveAddress({ mnemonics: mnemonic, index: 0 }).address,
// // 		};
// // 		const signedAuthor: SignedAuthor = {
// // 			...unsignedAuthor,
// // 			signature: signItem(unsignedAuthor, privateKey),
// // 		};
// // 		this.list.unshift({
// // 			...signedAuthor,
// // 			encryptedMnemonic: encrypt(mnemonic, password),
// // 			spaceHosts: [''],
// // 		});
// // 		passwords[publicKey] = password;
// // 		this.overwrite();
// // 		return publicKey;
// // 	}

// // 	updateLocalPeep(
// // 		personaId: string,
// // 		updates: {
// // 			name?: string;
// // 			// walletAddress: string;
// // 			frozen?: true;
// // 		},
// // 	) {
// // 		if (!personaId) throw new Error('Anon cannot have a name');
// // 		const personaIndex = this.findIndex(personaId);
// // 		const persona = this.list[personaIndex];
// // 		if (!persona) throw new Error('Peep not found');
// // 		Object.assign(persona, updates);
// // 		const writeDate = Date.now();
// // 		if (!persona.walletAddress) throw new Error('Missing persona.walletAddress');
// // 		const unsignedAuthor: UnsignedAuthor = {
// // 			writeDate,
// // 			id: personaId,
// // 			name: updates.name,
// // 			walletAddress: persona.walletAddress,
// // 			frozen: updates.frozen,
// // 		};
// // 		const signedAuthor: SignedAuthor = {
// // 			...unsignedAuthor,
// // 			signature: this.getSignature(unsignedAuthor, personaId),
// // 		};
// // 		this.list[personaIndex] = {
// // 			...persona,
// // 			...signedAuthor,
// // 		};
// // 		this.overwrite();
// // 	}

// // 	deletePeep(personaId: string, mnemonic: string) {
// // 		if (!personaId) throw new Error('Anon cannot be deleted');
// // 		if (passwords[personaId] === undefined) throw new Error('Peep locked');
// // 		const personaIndex = this.findIndex(personaId);
// // 		if (personaIndex === -1) throw new Error('Peep not found');
// // 		const persona = this.list[personaIndex];
// // 		const decryptedMnemonic = decrypt(persona.encryptedMnemonic!, passwords[personaId]);
// // 		const deleted = mnemonic === decryptedMnemonic;
// // 		if (deleted) {
// // 			this.list.splice(personaIndex, 1);
// // 			this.overwrite();
// // 		}
// // 		return deleted;
// // 	}

// // 	unlockPeep(personaId: string, password: string) {
// // 		if (!personaId) throw new Error('Anon is always unlocked');
// // 		const persona = this.find(personaId);
// // 		if (!persona) throw new Error('Peep not found');
// // 		const decryptedMnemonic = decrypt(persona.encryptedMnemonic!, password);
// // 		const valid = validateMnemonic(decryptedMnemonic, wordlist);
// // 		if (valid) passwords[personaId] = password;
// // 		return valid;
// // 	}

// // 	getPeepMnemonic(personaId: string, password: string) {
// // 		if (!personaId) throw new Error('Anon cannot have a mnemonic');
// // 		const persona = this.find(personaId);
// // 		if (!persona) throw new Error('Peep not found');
// // 		const decryptedMnemonic = decrypt(persona.encryptedMnemonic!, password);
// // 		const valid = validateMnemonic(decryptedMnemonic, wordlist);
// // 		if (valid) {
// // 			passwords[personaId] = password;
// // 			return decryptedMnemonic;
// // 		}
// // 		return '';
// // 	}

// // 	updatePeepPassword(personaId: string, oldPassword: string, newPassword: string) {
// // 		if (!personaId) throw new Error('Anon cannot have a password');
// // 		const persona = this.find(personaId);
// // 		if (!personaId || !persona) throw new Error('Peep not found');
// // 		const decryptedMnemonic = decrypt(persona.encryptedMnemonic!, oldPassword);
// // 		const valid = validateMnemonic(decryptedMnemonic, wordlist);
// // 		if (valid) {
// // 			passwords[personaId] = newPassword;
// // 			persona.encryptedMnemonic = encrypt(decryptedMnemonic, newPassword);
// // 			this.overwrite();
// // 		}
// // 		return valid;
// // 	}

// // 	find(personaId: string) {
// // 		return this.list.find((p) => p.id === personaId);
// // 	}

// // 	findIndex(personaId: string) {
// // 		return this.list.findIndex((p) => p.id === personaId);
// // 	}

// // 	getSignature(item: Item, personaId: string) {
// // 		if (!personaId) throw new Error('Anon cannot sign items');
// // 		const locked = passwords[personaId] === undefined;
// // 		if (locked) throw new Error('Peep locked');
// // 		const persona = this.find(personaId);
// // 		if (!persona) throw new Error('Peep not found');
// // 		const decryptedMnemonic = decrypt(persona.encryptedMnemonic!, passwords[personaId]);
// // 		const { publicKey, privateKey } = createKeyPair(decryptedMnemonic);
// // 		if (publicKey !== personaId) {
// // 			throw new Error('Mnemonic on file does not correspond to personaId');
// // 		}
// // 		return signItem(item, privateKey);
// // 	}

// // 	static lockAllPeeps() {
// // 		passwords = {};
// // 	}

// // 	// static async getSignedAuthor(personaId: string, spaceHost?: string) {
// // 	// 	if (!env.GLOBAL_HOST && !spaceHost) {
// // 	// 		const persona = Peeps.get().find(personaId);
// // 	// 		if (persona) return persona.name;
// // 	// 	}
// // 	// 	return (await inGroup(personaId))?.name;
// // 	// }
// // }
