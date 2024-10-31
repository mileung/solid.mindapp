import { A, useLocation, useSearchParams } from '@solidjs/router';
import { Icon } from 'solid-heroicons';
import { barsArrowDown } from 'solid-heroicons/solid';
import { createEffect, createMemo, createSignal } from 'solid-js';
import ThoughtBlock from '~/components/ThoughtBlock';
import { ThoughtWriter } from '~/components/ThoughtWriter';
import {
	activeSpace,
	authors,
	authorsSet,
	mentionedThoughts,
	mentionedThoughtsSet,
	personas,
	tagTree,
} from '~/utils/state';
import { Thought, getThoughtId, isThoughtId } from '../utils/ClientThought';
import { isStringifiedRecord } from '../utils/js';
import { bracketRegex, getAllSubTags, getTags } from '../utils/tags';
import { sendMessage } from '~/utils/signing';
import { SignedAuthor } from '~/types/Author';
import { buildUrl, hostedLocally, localApiHost, ping, post } from '~/utils/api';
const defaultColumnLabels = ['createDate', 'authorId', 'spaceHost', 'content', 'tags', 'parentId'];

// const authorIdRegex = /^@[A-HJ-NP-Za-km-z1-9]{9,}$/;
const authorIdRegex = /^@\w*$/;
function isAuthorId(str = '') {
	return authorIdRegex.test(str);
}

export const modes = ['new', 'old', 'table'];
const authorIdsRegex = /\B@\w*/g;
const quoteRegex = /"([^"]+)"/g;
function getQuotes(q: string) {
	return (q.match(quoteRegex) || []).map((match) => match.slice(1, -1));
}

export type UrlQuery = {
	mode: 'new' | 'old' | 'table';
	thoughtId?: string;
	authorIds?: string[];
	tags?: string[];
	other?: string[];
};

export function deconstructPathname(pathname: string) {
	pathname = pathname.replace(/\/+$/, '');
	if (!pathname.length) pathname = '/';
	const mode = (modes.find((mode) => pathname.endsWith('/' + mode)) ||
		modes[0]) as UrlQuery['mode'];
	const slashModeIndex = pathname.indexOf('/' + mode);
	let thoughtId: undefined | string;
	let authorId: undefined | string;
	const id = pathname.slice(1, mode === modes[0] ? undefined : slashModeIndex);
	if (isThoughtId(id)) {
		thoughtId = id;
	} else if (isAuthorId(id)) authorId = id.slice(1);
	let pathnameWithoutMode = mode === modes[0] ? pathname : pathname.slice(0, slashModeIndex);
	pathnameWithoutMode = pathnameWithoutMode.replace(/\/+$/, '');
	if (!pathnameWithoutMode.length) pathnameWithoutMode = '/';
	return { thoughtId, authorId, mode, pathnameWithoutMode };
}

export default function Results() {
	const location = useLocation();
	const [searchParams] = useSearchParams();
	const [queriedThoughtRoot, queriedThoughtRootSet] = createSignal<null | Thought>(null);
	const [roots, rootsSet] = createSignal<(null | Thought)[]>([]);
	const [columnLabels, columnLabelsSet] = createSignal(defaultColumnLabels);

	const q = searchParams.q?.toString() || '';
	const thing = createMemo(() => deconstructPathname(location.pathname));
	const { thoughtId, authorId, mode, pathnameWithoutMode } = thing();
	const tags = getTags(q);
	const urlQuery = createMemo(() => {
		const urlQuery: UrlQuery = {
			mode,
			thoughtId,
			authorIds:
				authorId !== undefined ? [authorId] : q.match(authorIdsRegex)?.map((a) => a.slice(1)),
			other: [
				...getQuotes(q),
				...q
					.replace(bracketRegex, ' ')
					.replace(quoteRegex, ' ')
					.replace(authorIdsRegex, ' ')
					.split(/\s+/g)
					.filter((a) => !!a)
					.map((s) => s.toLowerCase()),
			],
		};
		const allTags: Set<string> = new Set(tags);

		tags.forEach((tag) => {
			if (!tagTree) return;
			const arr = getAllSubTags(tagTree, tag);
			arr.forEach((tag) => allTags.add(tag));
		});

		urlQuery.tags = [...allTags];
		return urlQuery;
	});

	const queriedThoughtId = createMemo(() => urlQuery().thoughtId);
	let thoughtsBeyond = urlQuery().mode === 'old' ? 0 : Number.MAX_SAFE_INTEGER;
	let pinging = false;
	let rootTextArea: undefined | HTMLTextAreaElement;
	let boundingDv: undefined | HTMLDivElement;
	let linkingThoughtId = '';

	createEffect(() => {
		queriedThoughtId() && roots()[0] && queriedThoughtRootSet(roots()[0]);
	});

	const pluggedIn = createMemo(() => activeSpace.fetchedSelf !== null || !activeSpace.host);

	const loadMoreThoughts = async () => {
		if (!pluggedIn || pinging) return;
		const lastRoot = roots().slice(-1)[0];
		if (lastRoot === null || !activeSpace) return;
		const ignoreRootIds =
			urlQuery().mode !== 'table'
				? roots().map((root) => root && getThoughtId(root))
				: roots()
						.filter((r) => r?.createDate === roots().slice(-1)[0]?.createDate)
						.map((r) => getThoughtId(r!));
		pinging = true;

		sendMessage<{
			mentionedThoughts: Record<string, Thought>;
			authors: Record<string, SignedAuthor>;
			latestCreateDate: number;
			roots: Thought[];
		}>({
			from: personas[0].id,
			to: buildUrl({ host: activeSpace.host || localApiHost, path: 'get-roots' }),
			query: {
				...urlQuery,
				ignoreRootIds,
				thoughtsBeyond: thoughtsBeyond,
			},
		})
			.then((data) => {
				// console.log('data:', data);
				authorsSet({ ...authors, ...data.authors });
				mentionedThoughtsSet({ ...mentionedThoughts, ...data.mentionedThoughts });
				const rootsPerLoad = 8;
				const newRoots = roots().concat(data.roots);
				data.roots.length < rootsPerLoad && newRoots.push(null);
				thoughtsBeyond = data.latestCreateDate;
				rootsSet(newRoots);

				data.roots.forEach((root) => {
					if (isStringifiedRecord(root.content)) {
						const newColumnLabels = [...columnLabels()];
						newColumnLabels.unshift(
							...Object.keys(JSON.parse(root.content!)).filter((a) => !columnLabels().includes(a)),
						);
						columnLabelsSet(newColumnLabels);
					}
				});

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
			if (roots().slice(-1)[0] !== null && scrollPosition >= documentHeight - 2000) {
				if (roots.length !== rootsLengthLastLoad) {
					rootsLengthLastLoad = roots.length;
					loadMoreThoughts();
				}
			}
		};

		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	});

	createEffect(() => {
		if (tagTree && !roots().length && !pinging && pluggedIn()) {
			mentionedThoughtsSet({});
			thoughtsBeyond = urlQuery().mode === 'old' ? 0 : Number.MAX_SAFE_INTEGER;
			loadMoreThoughts();
		}
	});

	return (
		<div class="flex-1 max-w-full">
			{pathnameWithoutMode === '/' ||
			urlQuery().thoughtId ||
			urlQuery().authorIds?.length ||
			urlQuery().tags?.length ||
			urlQuery().other?.length ? (
				urlQuery() &&
				(!tags.length || tagTree) &&
				(!pluggedIn() ? (
					<p class="text-xl text-fg2 text-center font-semibold">Couldn't join space </p>
				) : (
					<div class="space-y-1.5">
						{pathnameWithoutMode === '/' && (
							<ThoughtWriter
								parentRef={rootTextArea}
								initialContent={queriedThoughtId()}
								onWrite={({ mentionedThoughts: mentions, thought }, ctrlKey) => {
									ctrlKey && (linkingThoughtId = getThoughtId(thought));
									setTimeout(() => {
										mentionedThoughtsSet({ ...mentionedThoughts, ...mentions });
										rootsSet([thought, ...roots()]);
									}, 0);
								}}
							/>
						)}
						{queriedThoughtRoot() && (
							<ThoughtBlock
								highlightedId={queriedThoughtId()}
								thought={queriedThoughtRoot()!}
								roots={roots()}
								rootsIndices={[0]}
								onNewRoot={() => rootTextArea?.focus()}
								onRootsChange={(newRoots) => {
									if (
										!newRoots[0] ||
										getThoughtId(newRoots[0]) !== getThoughtId(queriedThoughtRoot()!)
									)
										queriedThoughtRootSet(null);
									rootsSet(newRoots);
								}}
							/>
						)}
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
							{queriedThoughtId() && roots.length > 1 && (
								<p class="text-xl leading-4 text-fg2 text-center">
									{roots.length === 2 ? 'No mentions' : 'Mentions'}
								</p>
							)}
							{(
								[
									// [fire, 'Hot'],
									// [chatBubbleLeftRight, 'Replies'],
									// [trophy, 'Top'],
									[barsArrowDown, 'New'],
									// [barsArrowUp, 'Old'],
									// [tableCells, 'Table'],
								] as const
							).map(([iconPath, label], i) => {
								const to = `${pathnameWithoutMode}${pathnameWithoutMode === '/' ? '' : '/'}${
									!i ? '' : label.toLowerCase()
								}`;
								return (
									<A
										replace
										class={`h-4 fx transition hover:text-fg1 ${
											mode.toLocaleLowerCase() === label.toLocaleLowerCase()
												? 'text-fg1'
												: 'text-fg2'
										}`}
										href={to}
										onClick={(e) => !e.metaKey && !e.shiftKey && rootsSet([])}
									>
										<Icon path={iconPath} class="h-5 w-5" />
										<p class="ml-1 font-medium">{label}</p>
									</A>
								);
							})}
						</div>
						{!roots().length ? (
							<div class="xy">
								<p class="text-lg font-semibold">Loading...</p>
							</div>
						) : (
							<div
								class="relative space-y-1.5"
								onClick={() => {
									setTimeout(() => {
										if (boundingDv && boundingDv.clientHeight < window.innerHeight + 500) {
											loadMoreThoughts();
										}
									}, 0);
								}}
								ref={boundingDv}
							>
								{roots()
									.slice(queriedThoughtId() ? 1 : 0)
									.map((thought, i) => {
										if (!thought) return;
										const thoughtId = getThoughtId(thought);
										return (
											<ThoughtBlock
												initiallyLinking={linkingThoughtId === thoughtId}
												thought={thought}
												roots={roots()}
												rootsIndices={[i + (queriedThoughtRoot() ? 1 : 0)]}
												onNewRoot={() => rootTextArea?.focus()}
												onRootsChange={(newRoots) => rootsSet(newRoots)}
											/>
										);
									})}
								{queriedThoughtId() && roots()[0] === null && (
									<div class="xy h-40">
										<p class="text-2xl">Thought not found</p>
									</div>
								)}
								{/* This is for when the initial 8 roots that load don't extend past the bottom of the screen making scrolling impossible */}
								{roots().length === 8 && <div class="h-screen"></div>}
								{!queriedThoughtId() && roots()[0] === null && (
									<p class="text-2xl text-center">No thoughts found</p>
								)}
								{!queriedThoughtId() && roots().length > 1 && roots().slice(-1)[0] === null && (
									<p class="text-xl text-fg2 text-center">End of results </p>
								)}
							</div>
						)}
					</div>
				))
			) : (
				<div class="xy h-40">
					<p class="text-2xl">Invalid URL</p>
				</div>
			)}
		</div>
	);
}
