import { A } from '@solidjs/router';
import { Thought, getThoughtId } from '../utils/ClientThought';
import { copyToClipboardAsync } from '../utils/js';
import { formatTimestamp } from '../utils/time';
import DeterministicVisualId from './DeterministicVisualId';
import { localClientHost } from '../utils/api';
import { createEffect, createMemo, Setter } from 'solid-js';
import { authors, fetchedSpaces, savedFileThoughtIds, savedFileThoughtIdsSet } from '~/utils/state';
import { Icon } from 'solid-heroicons';
import { cube, cubeTransparent, fingerPrint } from 'solid-heroicons/solid';

export default function ThoughtBlockHeader(props: {
	thought: Thought;
	parsed: boolean;
	parsedSet: Setter<boolean>;
}) {
	const { thought, parsed, parsedSet } = props;
	const thoughtId = createMemo(() => getThoughtId(thought));
	const spaceUrl = createMemo(() => {
		const { protocol, host } = new URL(
			`http${thought.spaceHost && !thought.spaceHost.startsWith('localhost') ? 's' : ''}:${
				thought.spaceHost || localClientHost
			}`,
		);
		const parts = host.split('.').reverse();
		const tld = parts[0];
		const sld = parts[1];
		return `${protocol}//${
			thought.spaceHost && tld && sld ? `${sld}.${tld}` : localClientHost
		}/${thoughtId()}`;
	});
	const time = createMemo(() => formatTimestamp(thought.createDate));

	return (
		<div class="mr-1 fx h-5 text-fg2 max-w-full">
			<A
				target="_blank"
				href={`/${thoughtId()}`}
				class={`${
					time().length > 9 ? 'truncate' : ''
				} text-sm font-bold transition text-fg2 hover:text-fg1 px-1 -ml-1 h-6 xy`}
			>
				{time()}
			</A>
			<A
				target="_blank"
				href={`/@${thought.authorId || ''}`}
				class={`h-6 px-1 truncate fx text-sm font-bold transition text-fg2 hover:text-fg1 ${
					authors[thought.authorId || ''] ? '' : 'italic'
				}`}
			>
				<DeterministicVisualId
					input={thought.authorId}
					class="rounded-full overflow-hidden h-3 w-3 mr-1"
				/>
				<p class="whitespace-nowrap truncate">
					{thought.authorId ? authors[thought.authorId]?.name || 'No name' : 'Anon'}
				</p>
			</A>
			<a
				target="_blank"
				href={spaceUrl()}
				class={`h-6 px-1 mr-auto truncate fx text-sm font-bold transition text-fg2 hover:text-fg1 ${
					thought.spaceHost ? '' : 'italic'
				}`}
			>
				<DeterministicVisualId
					input={fetchedSpaces[thought.spaceHost || '']}
					class="rounded-sm overflow-hidden h-3 w-3 mr-1"
				/>
				<p class="whitespace-nowrap truncate">
					{thought.spaceHost ? fetchedSpaces[thought.spaceHost]?.name || 'No name' : 'Local'}
				</p>
			</a>
			{/* <button
				class="h-6 px-1 hover:text-fg1 transition"
				// TODO: onClick={() => playTextToSpeechAudio()}
				onClick={() => {
					// Usage example
					textToSpeech('Hello, this is a test of text-to-speech functionality.');
				}}
			>
				<PlayCircleIcon class="h-4 w-4" />
			</button> */}
			{/* <button
				class="h-6 px-1 hover:text-fg1 transition"
				// TODO: onClick={() => Translate()}
				
			>
				<Translate class="h-4 w-4" />
			</button> */}
			<button
				class="h-6 px-1 hover:text-fg1 transition"
				onClick={() => copyToClipboardAsync(`${thoughtId()}`)}
			>
				<Icon path={fingerPrint} class="h-4 w-4" />
			</button>
			<button class="-mr-1 h-6 px-1 hover:text-fg1 transition" onClick={() => parsedSet(!parsed)}>
				{parsed ? (
					<Icon path={cube} class="h-4 w-4" />
				) : (
					<Icon path={cubeTransparent} class="h-4 w-4" />
				)}
			</button>
			{/* <button
				class="h-6 px-1 hover:text-fg1 transition"
				onClick={() => {
					savedFileThoughtIdsSet({ ...savedFileThoughtIds, [thoughtId()]: !filedSaved });
					ping(
						makeUrl('write-local-file'),
						post({ thought })
					);
				}}
			>
				{filedSaved ? (
					<DocumentCheckIcon class="h-4 w-4" />
				) : (
					<ArrowDownTrayIcon class="h-4 w-4 text-" />
				)}
			</button> */}
		</div>
	);
}

function textToSpeech(text: string) {
	if ('speechSynthesis' in window) {
		const utterance = new SpeechSynthesisUtterance(text);

		utterance.rate = 1;
		utterance.pitch = 1;
		utterance.volume = 1;
		const voices = window.speechSynthesis.getVoices();
		utterance.voice = voices[0]; // Choose a specific voice
		window.speechSynthesis.speak(utterance);
		console.log('utterance:', utterance);
	} else {
		alert('Text-to-speech not supported in this browser.');
	}
}
