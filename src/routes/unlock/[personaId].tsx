import { Button } from '~/components/Button';
import DeterministicVisualId from '~/components/DeterministicVisualId';
import TextInput from '~/components/TextInput';
import { decrypt } from '~/utils/security';
import { validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { hostedLocally, makeUrl, ping, post } from '~/utils/api';
import { passwords } from '~/types/PersonasPolyfill';
import { useNavigate, useParams } from '@solidjs/router';
import { personas, personasSet } from '~/utils/state';
import { createEffect, createMemo } from 'solid-js';
import { lockClosed } from 'solid-heroicons/solid';
import { Icon } from 'solid-heroicons';

export default function UnlockPersona({ manage }: { manage?: boolean }) {
	const { personaId } = useParams();
	const navigate = useNavigate();
	let passwordIpt: undefined | HTMLInputElement;

	const selectedPersona = createMemo(() => {
		return !personas ? null : personas.find((p) => p.id === personaId) || null;
	});

	const unlockPersona = async () => {
		if (!selectedPersona()) return;
		let locked = true;
		if (hostedLocally) {
			locked = (
				await ping<{ locked: boolean }>(
					makeUrl('unlock-selectedPersona()'),
					post({ personaId, password: passwordIpt?.value }),
				)
			).locked;
		} else {
			const decryptedMnemonic = decrypt(selectedPersona()?.encryptedMnemonic!, passwordIpt!.value);
			if (validateMnemonic(decryptedMnemonic || '', wordlist)) {
				locked = false;
			}
		}
		if (locked) {
			passwordIpt?.focus();
			// passwordIpt?.error = 'Incorrect password';
			return;
		}
		personasSet((old) => {
			// passwords[selectedPersona()()?.id] = passwordIpt?.value;
			old.splice(
				old.findIndex((p) => p.id === selectedPersona()!.id),
				1,
			);
			!manage && navigate('/');
			return [{ ...selectedPersona()!, locked }, ...old];
		});
	};

	// createEffect(() => passwordIpt?.focus(), [personaId]);

	return (
		<div class={`space-y-3 ${!manage && 'p-3'}`}>
			{personas && !selectedPersona() ? (
				<>
					<p class="font-bold text-2xl">Persona not found</p>
					<Button label="Manage personas" href="/personas" />
				</>
			) : (
				<>
					<div class="fx gap-3">
						<DeterministicVisualId
							input={personaId}
							class="h-14 w-14 flex-shrink-0 overflow-hidden rounded-full"
						/>
						<div>
							<div class="fx gap-1">
								<p class="font-bold text-2xl">{selectedPersona()?.name || 'No name'}</p>
								<Icon path={lockClosed} class="h-6 w-6" />
							</div>
							<p class="text-lg text-fg2 font-semibold break-all">{personaId}</p>
						</div>
					</div>
					<TextInput
						password
						// autoFocus={!manage}
						autofocus
						// _ref={passwordIpt}
						label="Password"
						onSubmit={() => unlockPersona()}
					/>
					{/* TODO: Save password checkbox */}
					<Button label="Unlock selectedPersona()" onClick={() => unlockPersona()} />
				</>
			)}
		</div>
	);
}
