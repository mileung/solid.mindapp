import { Buffer } from 'buffer/';
import forge from 'node-forge';
import * as bip32 from '@scure/bip32';
import * as bip39 from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { base58 } from '@scure/base';
import * as secp256k1 from '@noble/secp256k1';
import { sortKeysRecursively } from './js';

export type Item = string | Record<string, any> | any[];

export function encrypt(text: string, password: string) {
	const iv = forge.random.getBytesSync(16);
	const key = forge.pkcs5.pbkdf2(password, forge.random.getBytesSync(16), 10000, 32); // PBKDF2 for key derivation
	const cipher = forge.cipher.createCipher('AES-CTR', key);
	cipher.start({ iv });
	cipher.update(forge.util.createBuffer(text));
	cipher.finish();

	const encrypted = cipher.output.getBytes();
	// return `${base58.encode(iv)}:${base58.encode(encrypted)}`;
	return `${iv}:${encrypted}`;
}

export function decrypt(encrypted: string, password: string) {
	const [iv, encryptedText] = encrypted.split(':');
	const key = forge.pkcs5.pbkdf2(password, forge.random.getBytesSync(16), 10000, 32);

	const decipher = forge.cipher.createDecipher('AES-CTR', key);
	// decipher.start({ iv: base58.decode(iv) });
	decipher.start({ iv });
	decipher.update(forge.util.createBuffer(base58.decode(encryptedText)));
	const result = decipher.finish();

	if (!result) {
		throw new Error('Decryption failed');
	}

	return decipher.output.toString();
}

export function createKeyPair(mnemonic?: string) {
	mnemonic = bip39.validateMnemonic(mnemonic!, wordlist)
		? mnemonic!
		: bip39.generateMnemonic(wordlist);

	const seed = bip39.mnemonicToSeedSync(mnemonic);
	const masterKey = bip32.HDKey.fromMasterSeed(seed);
	const address_index = 0;
	const childKey = masterKey.derive(`m/44'/0'/0'/0/${address_index}`);

	return {
		privateKey: base58.encode(childKey.privateKey!),
		publicKey: base58.encode(childKey.publicKey!),
	};
}

function bufferItem(item: Item) {
	item = typeof item === 'string' ? item : JSON.stringify(sortKeysRecursively(item));
	const sha256ItemHash = forge.md.sha256.create().update(item).digest().toHex();
	return Buffer.from(sha256ItemHash, 'hex');
}

export function signItem(item: Item, privateKey: string) {
	const privKeyBuffer = base58.decode(privateKey);
	const signature = secp256k1.sign(bufferItem(item), privKeyBuffer);
	return signature.toCompactHex();
}

export function verifyItem(item: Item, publicKey: string, signature?: string) {
	if (!signature) return false;

	const publicKeyBuffer = base58.decode(publicKey);
	return secp256k1.verify(base58.decode(signature), bufferItem(item), publicKeyBuffer);
}

export function hashItem(item: Item) {
	return base58.encode(bufferItem(item));
}
