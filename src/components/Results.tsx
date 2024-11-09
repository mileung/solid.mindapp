import { A, useLocation, useSearchParams } from '@solidjs/router';
import { Icon } from 'solid-heroicons';
import { barsArrowDown, barsArrowUp } from 'solid-heroicons/solid-mini';
import { createEffect, createMemo, createSignal, onCleanup } from 'solid-js';
import ThoughtBlock from '~/components/ThoughtBlock';
import { ThoughtWriter } from '~/components/ThoughtWriter';
import {
	useActiveSpace,
	authors,
	authorsSet,
	mentionedThoughts,
	mentionedThoughtsSet,
	personas,
	roots,
	rootsSet,
	useTagTree,
} from '~/utils/state';
import { Thought, getThoughtId, isThoughtId } from '../utils/ClientThought';
import { bracketRegex, getAllSubTags, getTags } from '../utils/tags';
import { sendMessage } from '~/utils/signing';
import { SignedAuthor } from '~/types/Author';
import { buildUrl, hostedLocally, localApiHost, ping, post } from '~/utils/api';

// const authorIdRegex = /^@[A-HJ-NP-Za-km-z1-9]{9,}$/;
const authorIdRegex = /^@\w*$/;
function isAuthorId(str = '') {
	return authorIdRegex.test(str);
}

export const modes = ['new', 'old'];
const authorIdsRegex = /\B@\w*/g;
const quoteRegex = /"([^"]+)"/g;

export type search = {
	mode: (typeof modes)[number];
	thoughtId?: string;
	authorIds: string[];
	tags: string[];
	other: string[];
};

export default function Results() {
	const location = useLocation();
	const [searchParams] = useSearchParams();
	createEffect(() => {
		searchParams.q; // need this for reactivity
		rootsSet([]);
	});
	createEffect(() => {
		search(); // need this for reactivity
		queriedThoughtRootSet(null);
	});

	const search = createMemo(() => {
		const searchedText = searchParams.q?.toString() || '';
		const searchedMode = searchParams.mode?.toString().toLowerCase() || '';
		const mode = modes.includes(searchedMode) ? searchedMode : 'new';
		const searchedTags = getTags(searchedText);
		const allTags: Set<string> = new Set(searchedTags);
		searchedTags.forEach((tag) => {
			const arr = getAllSubTags(useTagTree(), tag);
			arr.forEach((tag) => allTags.add(tag));
		});
		let searchedTextNoTagsOrAuthors = searchedText
			.replace(bracketRegex, ' ')
			.replace(authorIdsRegex, ' ');
		const thoughtId = isThoughtId(searchedText) ? searchedText : undefined;
		const authorIds = searchedText.match(authorIdsRegex)?.map((a) => a.slice(1));
		const quotes = (searchedTextNoTagsOrAuthors.match(quoteRegex) || []).map((match) =>
			match.slice(1, -1),
		);
		const other = [
			...quotes,
			...searchedTextNoTagsOrAuthors
				.replace(quoteRegex, ' ')
				.split(/\s+/g)
				.filter((a) => !!a)
				.map((s) => s.toLowerCase()),
		].filter((str) => str !== thoughtId);

		return {
			searchedText,
			mode,
			tags: [...allTags],
			thoughtId,
			authorIds,
			other,
		} as search & { searchedText: string };
	});
	const { searchedText, mode, thoughtId } = search();

	let thoughtsBeyond = mode === 'old' ? 0 : Number.MAX_SAFE_INTEGER;
	let pinging = false;
	let linkingThoughtId = '';

	const [queriedThoughtRoot, queriedThoughtRootSet] = createSignal<null | Thought>(null);
	createEffect(() => {
		const newQueriedThoughtRoot = (search().thoughtId && roots[0] && roots[0]) || null;
		newQueriedThoughtRoot && queriedThoughtRootSet(newQueriedThoughtRoot);
	});

	const pluggedIn = createMemo(
		() => useActiveSpace().fetchedSelf !== null || !useActiveSpace().host,
	);

	const loadMoreThoughts = async () => {
		if (!pluggedIn() || pinging) return;
		const lastRoot = roots.slice(-1)[0];
		if (lastRoot === null || !useActiveSpace()) return;
		const ignoreRootIds = roots.map((root) => root && getThoughtId(root));
		pinging = true;
		sendMessage<{
			mentionedThoughts: Record<string, Thought>;
			authors: Record<string, SignedAuthor>;
			latestCreateDate: number;
			roots: Thought[];
		}>({
			from: personas[0].id,
			to: buildUrl({ host: useActiveSpace().host || localApiHost, path: 'get-roots' }),
			query: {
				...search(),
				ignoreRootIds,
				thoughtsBeyond,
			},
		})
			.then((data) => {
				// console.log('data:', data);
				authorsSet({ ...authors, ...data.authors });
				mentionedThoughtsSet({ ...mentionedThoughts, ...data.mentionedThoughts });
				const rootsPerLoad = 8;
				const newRoots = roots.concat(data.roots);
				data.roots.length < rootsPerLoad && newRoots.push(null);
				thoughtsBeyond = data.latestCreateDate;
				rootsSet(newRoots);

				if (hostedLocally) {
					ping(buildUrl({ host: localApiHost, path: 'save-roots' }), post({ roots: data.roots }))
						// .then((res) => console.log('res:', res))
						.catch((err) => alert(err));
				}
			})
			.catch((err) => console.error(err))
			.finally(() => (pinging = false));
	};

	createEffect(() => {
		let rootsLengthLastLoad: number;
		const handleScroll = () => {
			const scrollPosition = window.innerHeight + window.scrollY;
			const documentHeight = document.body.offsetHeight;
			if (roots.slice(-1)[0] !== null && scrollPosition >= documentHeight - 2000) {
				if (roots.length !== rootsLengthLastLoad) {
					rootsLengthLastLoad = roots.length;
					loadMoreThoughts();
				}
			}
		};

		window.addEventListener('scroll', handleScroll);
		onCleanup(() => window.removeEventListener('scroll', handleScroll));
	});

	createEffect(() => {
		if (!roots.length && !pinging && pluggedIn()) {
			mentionedThoughtsSet({});
			thoughtsBeyond = search().mode === 'old' ? 0 : Number.MAX_SAFE_INTEGER;
			loadMoreThoughts();
		}
	});

	return (
		<div class="w-full">
			{queriedThoughtRoot() && (
				<div class="mb-1">
					<ThoughtBlock
						highlightedId={thoughtId}
						// @ts-ignore
						thought={queriedThoughtRoot}
						roots={roots}
						rootsIndices={[0]}
						onRootsChange={(newRoots) => {
							if (
								!newRoots[0] ||
								getThoughtId(newRoots[0]) !== getThoughtId(queriedThoughtRoot()!)
							) {
								queriedThoughtRootSet(null);
							} else {
								console.log('test');
								queriedThoughtRootSet(null); // idk y this is needed
								queriedThoughtRootSet(newRoots[0]);
							}
							rootsSet(newRoots);
						}}
					/>
				</div>
			)}
			{!pluggedIn() ? (
				<p class="text-xl text-fg2 text-center font-semibold">Couldn't join space </p>
			) : (
				<div class="space-y-1.5">
					<ThoughtWriter
						initialContent={thoughtId}
						onWrite={({ mentionedThoughts: mentions, thought }, ctrlKey) => {
							ctrlKey && (linkingThoughtId = getThoughtId(thought));
							setTimeout(() => {
								mentionedThoughtsSet({ ...mentionedThoughts, ...mentions });
								rootsSet(
									queriedThoughtRoot()
										? [roots[0], thought, ...roots.slice(1)]
										: [thought, ...roots],
								);
							}, 0);
						}}
					/>
					{/* TODO: To me (Awaiting interaction) */}
					{/* TODO: From me (My interactions) */}

					{/* TODO: Pending response */}
					{/* TODO: Root posts */}
					{/* TODO: Post replies */}
					{/* TODO: Strong upvotes */}
					{/* TODO: Strong downvotes */}
					{/* TODO: Weak upvotes */}
					{/* TODO: Weak downvotes */}
					<div class="fx gap-3">
						{thoughtId && (
							<p class="text-xl leading-4 text-fg2 text-center">
								{roots.length <= 2 ? 'No mentions' : 'Mentions'}
							</p>
						)}
						{(
							[
								// [fire, 'Hot'],
								// [chatBubbleLeftRight, 'Replies'],
								// [trophy, 'Top'],
								[barsArrowDown, 'New'],
								[barsArrowUp, 'Old'],
							] as const
						).map(([iconPath, label], i) => {
							const to = `${searchedText}${i ? `/${label.toLowerCase()}` : ''}`;

							return (
								<A
									replace
									class={`h-4 fx transition hover:text-fg1 ${
										search().mode.toLocaleLowerCase() === label.toLocaleLowerCase()
											? 'text-fg1'
											: 'text-fg2'
									}`}
									href={to}
									// onClick={(e) => !e.metaKey && !e.shiftKey && rootsSet([])}
								>
									<Icon path={iconPath} class="h-5 w-5" />
									<p class="ml-1 font-medium">{label}</p>
								</A>
							);
						})}
					</div>
					{!roots.length ? (
						<div class="xy">
							<p class="text-lg font-semibold">Loading...</p>
						</div>
					) : (
						<div class=" space-y-1.5">
							{roots.slice(thoughtId ? 1 : 0).map((thought, i) => {
								if (!thought) return;
								const thoughtId = getThoughtId(thought);
								return (
									<ThoughtBlock
										initiallyLinking={linkingThoughtId === thoughtId}
										thought={() => thought}
										roots={roots}
										rootsIndices={[i + (queriedThoughtRoot() ? 1 : 0)]}
										onRootsChange={(newRoots) => rootsSet(newRoots)}
									/>
								);
							})}
							{thoughtId && roots[0] === null && (
								<div class="xy h-40">
									<p class="text-2xl">Thought not found</p>
								</div>
							)}
							{/* This is for when the initial 8 roots that load don't extend past the bottom of the screen making scrolling impossible */}
							{roots.length === 8 && <div class="h-screen"></div>}
							{!thoughtId && roots[0] === null && (
								<p class="text-2xl text-center">No thoughts found</p>
							)}
							{roots.length > 1 && roots.slice(-1)[0] === null && (
								<p class="text-xl text-fg2 text-center">End of results </p>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
