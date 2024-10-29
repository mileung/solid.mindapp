import { A } from 'react-router-dom';
import { formatTimestamp } from '../utils/time';

export default function MiniMentionedThought({ thoughtId }: { thoughtId: string }) {
	return (
		<A
			target="_blank"
			href={`/${thoughtId}`}
			class="px-1 my-1 w-fit block border-2 border-mg1 rounded text-sm font-bold transition text-fg2 hover:text-fg1 hover:border-mg2"
		>
			{formatTimestamp(+thoughtId.substring(0, thoughtId.indexOf('_')))}
		</A>
	);
}
