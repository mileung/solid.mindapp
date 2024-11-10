import { Buffer } from 'buffer/';
import forge from 'node-forge';
import * as bip32 from '@scure/bip32';
import * as bip39 from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { base58 } from '@scure/base';
import { secp256k1 } from '@noble/curves/secp256k1';
import { sortKeysRecursively } from './js';
export type Item = string | Record<string, any> | any[];

export function encrypt(text: string, password = ''): string {
	const iv = forge.random.getBytesSync(16);
	const md = forge.md.sha256.create();
	md.update(password);
	const key = md.digest().data.substring(0, 32);
	const cipher = forge.cipher.createCipher('AES-CTR', key);
	cipher.start({ iv: iv });
	cipher.update(forge.util.createBuffer(text));
	cipher.finish();
	const encrypted = Buffer.from(cipher.output.getBytes(), 'binary');
	const ivBuffer = Buffer.from(iv, 'binary');
	return `${base58.encode(ivBuffer)}:${base58.encode(encrypted)}`;
}

export function decrypt(encrypted: string, password = '') {
	const [ivEncoded, encryptedTextEncoded] = encrypted.split(':');
	const iv = Buffer.from(base58.decode(ivEncoded)).toString('binary');
	const encryptedText = Buffer.from(base58.decode(encryptedTextEncoded)).toString('binary');
	const md = forge.md.sha256.create();
	md.update(password);
	const key = md.digest().data.substring(0, 32);
	const decipher = forge.cipher.createDecipher('AES-CTR', key);
	decipher.start({ iv: iv });
	decipher.update(forge.util.createBuffer(encryptedText));
	decipher.finish();
	try {
		return decipher.output.toString();
	} catch {
		return null;
	}
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
	return base58.encode(signature.toCompactRawBytes());
}

export function verifyItem(item: Item, publicKey: string, signature?: string) {
	if (!signature) return false;
	const publicKeyBuffer = base58.decode(publicKey);
	return secp256k1.verify(base58.decode(signature), bufferItem(item), publicKeyBuffer);
}

export function hashItem(item: Item) {
	return base58.encode(bufferItem(item));
}

// const encrypted = encrypt('testttetetetezzzceeeeoeooeeo', '');
// console.log('encrypted:', encrypted);
// const decrypted = decrypt(encrypted, '');
// console.log('decrypted:', decrypted);

// const kp = createKeyPair();
// const signature = signItem('test', kp.privateKey);
// console.log('signature:', signature);
// const valid = verifyItem('test', kp.publicKey, signature);
// console.log('valid:', valid);
