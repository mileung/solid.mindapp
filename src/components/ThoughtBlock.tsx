import {
	ArrowTopRightOnSquare,
	ChevronDoubleDown,
	ChevronDoubleUp,
	EllipsisHorizontal,
	Minus,
	Pencil,
	Plus,
	Trash,
	XMark,
} from 'solid-heroicons/solid';
import { AccountBlockBlock } from '@vite/vitejs/es5';
import { ReactNode, useCallback, createMemo, useRef, createSignal } from 'solid-js';
import { A } from 'react-router-dom';
import { tokenNetwork } from '../types/TokenNetwork';
import { Thought, getThoughtId } from '../utils/ClientThought';
import { buildUrl, hostedLocally, makeUrl, ping, post } from '../utils/api';
import { isStringifiedRecord, makeReadable } from '../utils/js';
import {
	useActiveSpace,
	useAuthors,
	useGetMnemonic,
	useGetSignature,
	usePersonas,
	useSendMessage,
} from '../utils/state';
import { minute, second } from '../utils/time';
import ContentParser from './ContentParser';
import ThoughtBlockHeader from './ThoughtBlockHeader';
import { ThoughtWriter } from './ThoughtWriter';
import Voters from './Voters';

export default function ThoughtBlock({
	thought,
	roots,
	onRootsChange,
	onNewRoot = () => {},
	rootsIndices,
	depth = 0,
	initiallyLinking,
	highlightedId,
}: {
	thought: Thought;
	roots: (null | Thought)[];
	onRootsChange: (newRoots: (null | Thought)[]) => void;
	onNewRoot?: () => void;
	rootsIndices: number[];
	depth?: number;
	initiallyLinking?: boolean;
	highlightedId?: string;
}) {
	const [authors] = useAuthors();
	const getMnemonic = useGetMnemonic();

	const getSignature = useGetSignature();

	const sendMessage = useSendMessage();
	const [moreOptionsOpen, moreOptionsOpenSet] = createSignal(false);
	const [editing, editingSet] = createSignal(false);
	const [open, openSet] = createSignal(true);
	const [linking, linkingSet] = createSignal(!!initiallyLinking);
	const [parsed, parsedSet] = createSignal(true);
	const [showVoters, showVotersSet] = createSignal(false);
	const personaId = createMemo(() => personas[0].id, [personas[0].id]);
	const walletAddress = createMemo(() => personas[0].walletAddress, [personas[0].walletAddress]);
	const thoughtId = createMemo(() => getThoughtId(thought), [thought]);
	const highlighted = createMemo(() => highlightedId === thoughtId, [highlightedId, thoughtId]);
	const linkingThoughtId = useRef('');
	const linkingDiv = useRef<HTMLDivElement>(null);
	const xBtn = useRef<HTMLButtonElement>(null);
	const trashBtn = useRef<HTMLButtonElement>(null);
	const pencilBtn = useRef<HTMLButtonElement>(null);
	const votesBtn = useRef<HTMLButtonElement>(null);
	const votesDv = useRef<HTMLDivElement>(null);
	const voteTimer = useRef<NodeJS.Timeout>();
	const [upvoted, upvotedSet] = createSignal<undefined | boolean>(thought.votes?.own);
	const currentVote = useRef<undefined | boolean>(upvoted);
	const [votes, votesSet] = createSignal<undefined | { up?: true; voterId: string }[]>();
	const voteCount = createMemo(() => {
		const votes = { up: thought.votes?.up || 0, down: thought.votes?.down || 0 };
		if (upvoted !== undefined) upvoted ? votes.up++ : votes.down++;
		if (thought.votes?.own !== undefined) {
			thought.votes?.own ? votes.up-- : votes.down--;
		}
		return votes;
	}, [thought.votes, upvoted]);
	const onShowMoreBlur = useCallback(() => {
		setTimeout(() => {
			if (![xBtn, trashBtn, pencilBtn].find((e) => e === document.activeElement)) {
				moreOptionsOpenSet(false);
			}
		}, 0);
	}, []);
	const onShowVotersBlur = useCallback(() => {
		setTimeout(() => {
			if (![xBtn, votesBtn, votesDv].find((e) => e === document.activeElement)) {
				showVotersSet(false);
			}
		}, 0);
	}, []);

	const debouncedSwitchVote = useCallback(
		async (up?: true) => {
			if (!activeSpace.host) return alert('Cannot vote in local space');
			if (!personaId) return alert('Anon cannot vote');
			if (activeSpace.host !== thought.spaceHost) {
				return alert('Cannot vote on thoughts created outside of the current space');
			}
			if (activeSpace.host !== thought.spaceHost) {
				return alert('Cannot vote on thoughts created outside of the current space');
			}
			if (!activeSpace.deletableVotes && currentVote !== undefined) {
				// return alert('Votes are finalized 3 seconds after submitting');
				return alert('Votes cannot be undone');
			}
			clearTimeout(voteTimer);
			let newVote: undefined | boolean;
			if (up) {
				newVote = upvoted === true ? undefined : true;
			} else {
				newVote = upvoted === false ? undefined : false;
			}
			upvotedSet(newVote);
			voteTimer = setTimeout(async () => {
				if (newVote === currentVote) return;
				const lastVote = currentVote;
				currentVote = newVote;
				if (newVote === undefined) {
					return sendMessage({
						from: personaId,
						to: buildUrl({ host: activeSpace.host, path: 'delete-vote' }),
						thoughtId,
					});
				}
				const [createDate, authorId, spaceHost] = thoughtId.split('_', 3);
				const unsignedVote: UnsignedVote = {
					thoughtCreateDate: +createDate,
					thoughtAuthorId: authorId,
					thoughtSpaceHost: spaceHost,
					up: newVote,
					voterId: personaId,
					voteDate: Date.now(),
				};
				// TODO: If the user has no tokens in their wallet, do a weak vote.
				// Else do a strong vote
				// Weak votes are free to make and have 1 chevron colored
				// Strong votes are backed by 1 $VIBE and have 2 chevrons colored
				if (activeSpace.tokenId) {
					if (!walletAddress) return alert('Persona missing walletAddress');
					const toAddress = newVote
						? authors[thought.authorId || '']?.walletAddress
						: activeSpace.downvoteAddress;
					if (!toAddress) {
						return newVote
							? alert('author missing walletAddress')
							: alert('space missing downvoteAddress');
					}
					try {
						if (hostedLocally) {
							const { block } = await ping<{ block: typeof AccountBlockBlock }>(
								makeUrl('send-token-amount'),
								post({
									personaId,
									toAddress,
									tokenId: activeSpace.tokenId,
									amount: '1',
								}),
							);
							unsignedVote.txHash = block.hash;
						} else {
							const privateKey = getMnemonic(personas[0].id);
							const block = await tokenNetwork.sendToken(
								walletAddress,
								privateKey,
								toAddress,
								activeSpace.tokenId,
								'1',
							);
							unsignedVote.txHash = block.hash;
						}
					} catch (error) {
						upvotedSet(lastVote);
						currentVote = lastVote;
						return alert(makeReadable(error));
					}
				}
				const signedVote: SignedVote = {
					...unsignedVote,
					signature: (await getSignature(unsignedVote, unsignedVote.voterId))!,
				};
				// console.log('signedVote:', signedVote);
				sendMessage({
					from: personaId,
					to: buildUrl({ host: activeSpace.host, path: 'vote-on-thought' }),
					replace: lastVote !== undefined,
					signedVote,
				}).catch((err) => {
					alert(JSON.stringify(err));
					upvotedSet(lastVote);
					currentVote = lastVote;
				});
			}, 0 * second);
		},
		[upvoted, thought, personaId, walletAddress, activeSpace, thoughtId, sendMessage],
	);

	return (
		<Highlight on={highlighted} depth={depth}>
			<div
				class={`flex rounded ${!depth ? 'shadow max-w-full' : ''} ${
					depth % 2 === 0 ? 'bg-bg2' : 'bg-bg1'
				}`}
			>
				<button
					class="w-5 z-10 fy transition rounded text-fg2 hover:text-fg1 hover:bg-mg2"
					onClick={() => openSet(!open)}
				>
					<div class="my-0.5 h-5 xy">{open ? <Minus class="w-4" /> : <Plus class="w-4" />}</div>
				</button>
				<div class="mt-0.5 flex-1 max-w-[calc(100%-1.25rem)]">
					<ThoughtBlockHeader thought={thought} parsedSet={parsedSet} parsed={parsed} />
					<div class={`z-10 pb-1 pr-1 ${open ? '' : 'hidden'}`}>
						{editing ? (
							<div class="mt-1">
								<ThoughtWriter
									editId={thoughtId}
									parentId={thought.parentId}
									onContentBlur={() => editingSet(false)}
									initialContent={thought.content}
									initialTags={thought.tags}
									onWrite={({ thought }, ctrlKey, altKey) => {
										editingSet(false);
										moreOptionsOpenSet(false);
										ctrlKey && linkingSet(true);
										altKey && onNewRoot();
										const newRoots = [...roots] as Thought[];
										let pointer = newRoots;
										for (let i = 0; i < rootsIndices.length - 1; i++) {
											pointer = pointer[rootsIndices[i]].children!;
										}
										const editedThought = pointer[rootsIndices.slice(-1)[0]];
										editedThought.content = thought.content;
										editedThought.tags = thought.tags;
										onRootsChange(newRoots);
									}}
								/>
							</div>
						) : (
							<>
								{thought.content ? (
									parsed ? (
										<ContentParser thought={thought} />
									) : (
										<p class="whitespace-pre-wrap break-all font-thin font-mono">
											{isStringifiedRecord(thought.content)
												? JSON.stringify(JSON.parse(thought.content), null, 2)
												: thought.content}
										</p>
									)
								) : (
									<p class="font-semibold text-fg2 italic">No content</p>
								)}
								{!!thought.tags?.length && (
									<div class="flex flex-wrap gap-x-2">
										{thought.tags.map((tag) => (
											<A
												key={tag}
												target="_blank"
												href={`/search?${new URLSearchParams({ q: `[${tag}]` }).toString()}`}
												class="font-bold leading-5 transition text-fg2 hover:text-fg1"
											>
												{tag}
											</A>
										))}
									</div>
								)}
							</>
						)}
						<div class="z-50 mt-2 flex gap-2 text-fg2 max-w-full justify-between">
							{(true || activeSpace.host) && (
								<div class="z-20 fx h-4 relative">
									<button
										// TODO: make click area bigger and overlap with the collapse button.
										class={`xy -ml-2 h-7 w-7 transition hover:text-orange-500 ${
											upvoted ? 'text-orange-500' : ''
										}`}
										onClick={() => debouncedSwitchVote(true)}
									>
										<ChevronDoubleUp class="w-5" />
									</button>
									<button
										class="fx h-7"
										ref={votesBtn}
										onClick={() => showVotersSet(!showVoters)}
										onBlur={onShowVotersBlur}
										onKeyDown={(e) => e.key === 'Escape' && showVotersSet(false)}
									>
										<p class="leading-4 text-sm font-bold font-mono transition hover:text-fg1">
											{voteCount.up}-{voteCount.down}
										</p>
									</button>
									<button
										class={`xy -mr-2 h-7 w-7 transition hover:text-blue-400 ${
											upvoted === false ? 'text-blue-400' : ''
										}`}
										onClick={() => debouncedSwitchVote()}
									>
										<ChevronDoubleDown class="w-5" />
									</button>
									{showVoters && (
										<div
											ref={votesDv}
											tabIndex={0}
											onBlur={onShowVotersBlur}
											onKeyDown={(e) => e.key === 'Escape' && showVotersSet(false)}
											class="z-50 absolute top-4 mt-0.5 left-0 w-48 rounded bg-mg1 shadow"
										>
											<div class="fx justify-between pl-1">
												<p class="font-semibold">Voters</p>
												<button
													ref={xBtn}
													class="h-5 w-5 hover:text-fg1 transition"
													onClick={() => showVotersSet(false)}
												>
													<XMark />
												</button>
											</div>
											<Voters thoughtId={thoughtId} />
										</div>
									)}
								</div>
							)}
							<div class="flex-1 h-4 fx">
								<button
									class="flex-1 min-w-4 h-7 fx hover:text-fg1 transition"
									onClick={() => linkingSet(!linking)}
								>
									<ArrowTopRightOnSquare class="absolute rotate-90 w-5" />
								</button>
							</div>
							<div class="fx gap-1 flex-wrap">{/*  */}</div>
							{(!personas[0].spaceHosts[0] ||
								(thought.authorId === personas[0].id &&
									(thought.spaceHost || !!thought.content))) &&
								(moreOptionsOpen ? (
									<div class="fx gap-2">
										<button
											ref={xBtn}
											class="h-4 w-4 xy hover:text-fg1 transition"
											onClick={() => moreOptionsOpenSet(false)}
											onKeyDown={(e) => e.key === 'Escape' && moreOptionsOpenSet(false)}
											onBlur={onShowMoreBlur}
										>
											<XMark class="absolute h-6 w-6" />
										</button>
										<button
											ref={trashBtn}
											class="h-4 w-4 xy hover:text-fg1 transition"
											onClick={async () => {
												const ok =
													!!thought.spaceHost ||
													Date.now() - thought.createDate < minute ||
													confirm(
														'This thought has already been archived in the Git snapshot history; delete it anyways?',
													);
												if (!ok) return;
												const newRoots = [...roots] as Thought[];
												let pointer = newRoots;
												for (let i = 0; i < rootsIndices.length - 1; i++) {
													pointer = pointer[rootsIndices[i]].children!;
												}
												const deletedThought = pointer[rootsIndices.slice(-1)[0]];
												sendMessage<{ softDelete: true }>({
													from: personas[0]!.id,
													to: buildUrl({ host: activeSpace!.host, path: 'delete-thought' }),
													thoughtId,
												})
													.then(({ softDelete }) => {
														if (softDelete) {
															deletedThought.content = '';
															deletedThought.tags = [];
														} else {
															pointer.splice(rootsIndices.slice(-1)[0], 1);
														}
														onRootsChange(newRoots);
													})
													.catch((err) => alert(err));
											}}
											onKeyDown={(e) => e.key === 'Escape' && moreOptionsOpenSet(false)}
											onBlur={onShowMoreBlur}
										>
											<Trash class="absolute h-4 w-4" />
										</button>
										<button
											ref={pencilBtn}
											class="h-4 w-4 xy hover:text-fg1 transition"
											onClick={() => editingSet(!editing)}
											onKeyDown={(e) => e.key === 'Escape' && moreOptionsOpenSet(false)}
											onBlur={onShowMoreBlur}
										>
											<Pencil class="absolute h-4 w-4" />
										</button>
									</div>
								) : (
									<button
										class="h-4 w-4 xy hover:text-fg1 transition"
										onClick={() => {
											moreOptionsOpenSet(true);
											setTimeout(() => xBtn.focus(), 0);
										}}
									>
										<EllipsisHorizontal class="absolute h-4 w-5" />
									</button>
								))}
						</div>
						{linking && (
							<div ref={linkingDiv} class="bg-bg1 p-1 rounded mt-1">
								<ThoughtWriter
									parentId={thoughtId}
									onContentBlur={() => linkingSet(false)}
									onWrite={({ thought }, ctrlKey, altKey) => {
										altKey ? onNewRoot() : linkingSet(false);
										ctrlKey && (linkingThoughtId = thoughtId);
										const newRoots = [...roots] as Thought[];
										let pointer = newRoots;
										for (let i = 0; i < rootsIndices.length; i++) {
											if (!pointer[rootsIndices[i]].children) {
												pointer[rootsIndices[i]].children = [];
											}
											pointer = pointer[rootsIndices[i]].children!;
										}
										pointer.unshift(thought);
										onRootsChange(newRoots);
									}}
								/>
							</div>
						)}
						{thought.children && (
							<div class="z-0 mt-1 space-y-1">
								{thought.children.map(
									(childThought, i) =>
										childThought && (
											<ThoughtBlock
												key={i}
												initiallyLinking={linkingThoughtId === getThoughtId(childThought)}
												highlightedId={highlightedId}
												roots={roots}
												onRootsChange={onRootsChange}
												rootsIndices={[...rootsIndices, i]}
												thought={childThought}
												depth={depth + 1}
											/>
										),
								)}
							</div>
						)}
					</div>
				</div>
			</div>
		</Highlight>
	);
}

function Highlight({ depth, on, children }: { depth: number; on: boolean; children: ReactNode }) {
	const scrolledTo = useRef(false);
	return on ? (
		<div
			ref={(r) => {
				!scrolledTo &&
					r &&
					setTimeout(() => {
						const yOffset = -50; // so header doesn't cover thought block
						window.scrollTo({ top: r.getBoundingClientRect().top + window.scrollY + yOffset });
						scrolledTo = true;
					}, 0);
			}}
			class={`${
				!depth && 'shadow max-w-full'
			} rounded bg-gradient-to-tr from-red-500 via-green-500 to-blue-500 p-0.5`}
		>
			{children}
		</div>
	) : (
		<>{children}</>
	);
}
type UnsignedVote = {
	thoughtCreateDate: number;
	thoughtAuthorId: string;
	thoughtSpaceHost: string;
	up: boolean;
	voteDate: number;
	voterId: string;
	txHash?: string;
};

type SignedVote = UnsignedVote & {
	signature: string;
};