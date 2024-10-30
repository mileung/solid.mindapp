import { A, useLocation, useNavigate, useSearchParams } from '@solidjs/router';
import { Icon } from 'solid-heroicons';
import {
	check,
	ellipsisHorizontal,
	lockClosed,
	magnifyingGlass,
	square_2Stack,
	tag,
	userGroup,
	cog,
} from 'solid-heroicons/solid';
import { matchSorter } from 'match-sorter';
import { hostedLocally, localApiHost, makeUrl, ping } from '../utils/api';
import { shortenString } from '../utils/js';
import { useKeyPress } from '../utils/keyboard';
import { Space } from '../utils/settings';
import {
	activeSpace,
	fetchedSpaces,
	fetchedSpacesSet,
	getLocalState,
	lastUsedTags,
	lastUsedTagsSet,
	localStateSet,
	personas,
	personasSet,
	rootSettings,
	tagMapOpen,
	tagMapOpenSet,
	tagTree,
} from '../utils/state';
import { bracketRegex, getNodes, getNodesArr, getTags } from '../utils/tags';
import DeterministicVisualId from './DeterministicVisualId';
import { passwords, Persona } from '../types/PersonasPolyfill';
import { createEffect, createMemo, createSignal, onMount } from 'solid-js';
import { decrypt } from '~/utils/security';
import { validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';

const setGlobalCssVariable = (variableName: string, value: string) => {
	document.documentElement.style.setProperty(`--${variableName}`, value);
};

let lastScroll = 0;
let initialScrollUpPosition = 0;
let scrollingDown = true;
// window.addEventListener('scroll', () => {
// 	const currentScroll = window.scrollY;
// 	if (currentScroll > lastScroll) {
// 		setGlobalCssVariable('header-opacity', '0.25');
// 		// setGlobalCssVariable('header-opacity', '0.0000000001');
// 		scrollingDown = true;
// 	} else {
// 		if (currentScroll <= 10 || initialScrollUpPosition - currentScroll > 88) {
// 			setGlobalCssVariable('header-opacity', '1');
// 		}
// 		if (scrollingDown) {
// 			initialScrollUpPosition = currentScroll;
// 		}
// 		scrollingDown = false;
// 	}
// 	lastScroll = currentScroll <= 0 ? 0 : currentScroll;
// });

export default function Header() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const searchedKeywords = searchParams.q || '';
	let searchIpt: undefined | HTMLInputElement;
	let searchBtn: undefined | HTMLButtonElement;
	let spaceBtn: undefined | HTMLButtonElement;
	let personaBtn: undefined | HTMLButtonElement;
	const tagSuggestionsRefs: (null | HTMLButtonElement)[] = [];
	const [suggestTags, suggestTagsSet] = createSignal(false);
	const [switchingSpaces, switchingSpacesSet] = createSignal(false);
	const [switchingPersonas, switchingPersonasSet] = createSignal(false);
	const [searchText, searchTextSet] = createSignal('');
	const [tagIndex, tagIndexSet] = createSignal<number>(-1);
	const tags = createMemo(() => getTags(searchText()));
	const tagFilter = createMemo(() =>
		searchText().trim().replace(bracketRegex, '').replace(/\s\s+/g, ' ').trim(),
	);
	const nodesArr = createMemo(() => tagTree && getNodesArr(getNodes(tagTree)));
	const suggestedTags = createMemo(() => {
		if (!nodesArr || !suggestTags) return [];
		let arr = matchSorter(nodesArr() || [], tagFilter());
		!tagFilter().trim() && arr.unshift(...lastUsedTags);
		arr = [...new Set(arr)].filter((tag) => !tags().includes(tag));
		return arr;
	});

	const location = useLocation();
	createEffect(() => {
		if (!searchedKeywords && location.pathname.startsWith('/@')) {
			const nextSlashIndex = location.pathname.indexOf('/', 1);
			searchTextSet(location.pathname.slice(1, nextSlashIndex === -1 ? undefined : nextSlashIndex));
		} else {
			searchTextSet((searchedKeywords + ' ').trimStart());
		}
		window.scrollTo(0, 0);
	});

	useKeyPress(
		'/',
		() => {
			const activeElement = document.activeElement!;
			if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
				setTimeout(() => searchIpt?.focus(), 0); // setTimeout prevents inputting '/' on focus
			}
		},
		[],
	);

	const searchInput = (newTab = false) => {
		const q = searchText().trim();
		if (q) {
			const queryString = new URLSearchParams({ q }).toString();
			searchIpt?.blur();
			setTimeout(() => {
				if (newTab) {
					window.open(`/search?${queryString}`, '_blank');
				} else {
					navigate(`/search?${queryString}`);
				}
			}, 0);
			// setTimeout prevents search from adding new line to contentTextarea on enter
		}
	};

	const addTagToSearchInput = (tag: string) => {
		tagIndexSet(-1);
		lastUsedTagsSet([tag, ...lastUsedTags]);
		searchTextSet(
			`${searchText()
				.replace(/\s\s+/g, ' ')
				.trim()
				.replace(new RegExp(tagFilter + '$'), '')
				.trim()} [${tag}] `.trimStart(),
		);
		setTimeout(() => searchIpt?.scrollTo({ left: Number.MAX_SAFE_INTEGER }), 0);
	};

	const onSwitchingBlur = () => {
		setTimeout(() => {
			if (document.activeElement !== spaceBtn && document.activeElement !== personaBtn) {
				switchingPersonasSet(false);
				switchingSpacesSet(false);
			}
		}, 0);
	};

	return (
		<>
			<div class="h-12" />
			{personas && (
				<header
					class="z-50 fixed top-0 w-full px-2 sm:px-3 flex justify-between py-1 h-12 transition-opacity bg-bg1"
					// Not sure how I feel about this especially now
					// that the tag map is there
					// style={{ opacity: 'var(--header-opacity)' }}
					onMouseMove={() => setGlobalCssVariable('header-opacity', '1')}
				>
					<a href="/" class="fx shrink-0">
						<img
							src={'/mindapp-logo.svg'}
							alt="logo"
							class={`h-7 ${hostedLocally && rootSettings()?.testWorkingDirectory && 'grayscale'}`}
						/>
						<p class="ml-2 text-2xl font-black hidden sm:block">Mindapp</p>
					</a>
					<div class="relative mx-2 w-full max-w-3xl">
						<div class="flex h-full">
							<input
								ref={searchIpt}
								value={searchText()}
								class="w-full pr-12 h-full text-lg px-2 rounded border-2 transition border-mg1 hover:border-mg2 focus:border-mg2"
								placeholder="Search"
								onFocus={() => {
									suggestTagsSet(true);
									tagIndexSet(-1);
								}}
								onBlur={() => {
									document.activeElement !== searchBtn && suggestTagsSet(false);
								}}
								onChange={(e) => {
									suggestTagsSet(true);
									tagIndexSet(-1);
									searchTextSet(e.target.value);
								}}
								onKeyDown={(e) => {
									e.key === 'Escape' && (suggestTags() ? suggestTagsSet(false) : searchIpt?.blur());
									e.key === 'Tab' && !e.shiftKey && suggestTagsSet(false);
									if (e.key === 'Enter') {
										if (suggestedTags()[tagIndex()]) {
											addTagToSearchInput(suggestedTags()[tagIndex()]);
										} else {
											searchInput(e.metaKey);
										}
									}
									if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
										e.preventDefault();
										const index = Math.min(
											Math.max(tagIndex() + (e.key === 'ArrowUp' ? -1 : 1), -1),
											suggestedTags().length - 1,
										);
										tagSuggestionsRefs[index]?.focus();
										searchIpt?.focus();
										tagIndexSet(index);
									}
								}}
							/>
							<button
								ref={searchBtn}
								class="xy -ml-12 w-12 px-2 rounded transition text-fg2 hover:text-fg1"
								onClick={(e) => searchInput(e.metaKey)}
							>
								<Icon path={magnifyingGlass} class="h-7 w-7" />
							</button>
						</div>
						{suggestTags() && (
							<div class="z-20 flex flex-col overflow-scroll rounded mt-0.5 absolute w-full max-h-56 shadow">
								{suggestedTags().map((tag, i) => {
									return (
										<button
											class={`fx px-3 text-xl hover:bg-mg2 ${
												tagIndex() === i ? 'bg-mg2' : 'bg-mg1'
											}`}
											ref={(r) => (tagSuggestionsRefs[i] = r)}
											onMouseDown={(e) => e.preventDefault()}
											onClick={() => addTagToSearchInput(tag)}
										>
											<p class="truncate">{tag}</p>
										</button>
									);
								})}
							</div>
						)}
					</div>
					<div class="fx">
						{/* {hostedLocally ? (
						<a href="/tags" class="xy w-10 text-fg2 transition hover:text-fg1">
							<Tag class="h-7 w-7" />
						</a>
					) : (
					)} */}
						<button
							class="md:invisible xy w-10 text-fg2 transition hover:text-fg1"
							onClick={() => tagMapOpenSet(!tagMapOpen())}
						>
							<Icon path={tag} class="h-7 w-7" />
						</button>
						<a href="/settings" class="xy w-10 text-fg2 transition hover:text-fg1">
							<Icon path={cog} class="h-7 w-7" />
						</a>
						<div class="mr-2 border-l-2 border-mg2 h-8"></div>
						<button
							ref={spaceBtn}
							class="h-8 w-8 xy"
							onBlur={onSwitchingBlur}
							onClick={() => {
								switchingPersonasSet(false);
								switchingSpacesSet(!switchingSpaces());
							}}
							onKeyDown={(e) => {
								if (e.key === 'Escape') {
									switchingPersonasSet(false);
									switchingSpacesSet(false);
								}
							}}
						>
							<DeterministicVisualId
								input={activeSpace.owner ? activeSpace : activeSpace.host}
								class="rounded overflow-hidden h-7 w-7"
							/>
						</button>
						<button
							ref={personaBtn}
							class="ml-2 h-8 w-8 xy"
							onBlur={onSwitchingBlur}
							onClick={() => {
								switchingSpacesSet(false);
								switchingPersonasSet(!switchingPersonas());
							}}
							onKeyDown={(e) => {
								if (e.key === 'Escape') {
									switchingPersonasSet(false);
									switchingSpacesSet(false);
								}
							}}
						>
							<DeterministicVisualId
								input={personas[0].id}
								class="rounded-full overflow-hidden h-7 w-7"
							/>
						</button>
					</div>
					{(switchingSpaces() || switchingPersonas()) && (
						<>
							{/*
							fragment is needed to avoid crashing
							idk y. Without it, refresh the home page, press n, press tab, press f, press enter, switch from anon to a persona and it crashes, unless there's this fragment...
							*/}
							<div
								class={`absolute shadow rounded h-fit overflow-hidden top-12 bg-mg1 ${
									switchingSpaces() ? 'right-12' : 'right-2'
								} mr-0 sm:mr-1`}
							>
								<div class="max-h-48 overflow-scroll">
									{(
										((switchingSpaces()
											? personas[0].spaceHosts.map((host) => fetchedSpaces()[host])
											: personas) || []) as (Space & Persona)[]
									).map((thing, i) => {
										const thingKey = switchingSpaces() ? thing?.host : thing.id;
										const showCheck = !i;
										return (
											<div class="flex transition hover:bg-mg2">
												<button
													onMouseDown={(e) => e.preventDefault()}
													class="w-44 pl-2 h-11 fx"
													onClick={() => {
														switchingSpacesSet(false);
														switchingPersonasSet(false);
														if (switchingPersonas() && thing.id && thing.locked) {
															return navigate(`/unlock/${thingKey}`);
														}
														personasSet((old) => {
															if (switchingSpaces()) {
																old[0].spaceHosts.splice(
																	0,
																	0,
																	old[0].spaceHosts.splice(
																		old[0].spaceHosts.findIndex((h) => h === (thing?.host || '')),
																		1,
																	)[0],
																);
															} else {
																old.splice(
																	0,
																	0,
																	old.splice(
																		old.findIndex((p) => p.id === thing.id),
																		1,
																	)[0],
																);
															}
															return [...old];
														});
													}}
												>
													<DeterministicVisualId
														input={switchingSpaces() ? thing : thingKey}
														class={`h-6 w-6 overflow-hidden ${
															switchingSpaces() ? 'rounded' : 'rounded-full'
														}`}
													/>
													<div class="flex-1 ml-1.5 truncate">
														<p
															class={`max-w-full text-left text-lg font-semibold leading-5  ${
																!thing?.name && 'text-fg2'
															} truncate`}
														>
															{thing?.name ||
																(thingKey ? 'No name' : switchingSpaces() ? 'Local space' : 'Anon')}
														</p>
														<p class="text-left font-mono text-fg2 leading-5 truncate">
															{switchingSpaces()
																? thingKey || localApiHost
																: shortenString(thingKey!)}
														</p>
													</div>
												</button>
												{!thingKey ? (
													<div class="w-8 xy">
														{showCheck && <Icon path={check} class="h-5 w-5" />}
													</div>
												) : (
													<a
														class="xy w-8 group relative"
														aria-disabled={!thingKey}
														href={`/manage-${
															switchingSpaces() ? 'spaces' : 'personas'
														}/${thingKey}`}
														onMouseDown={(e) => e.preventDefault()}
														onClick={() => {
															switchingSpacesSet(false);
															switchingPersonasSet(false);
														}}
													>
														{showCheck ? (
															<Icon path={check} class="h-5 w-5" />
														) : (
															thing.locked &&
															switchingPersonas() && (
																<Icon path={lockClosed} class="h-4 w-4 text-fg2" />
															)
														)}
														<div class="bg-mg2 opacity-0 transition hover:opacity-100 absolute xy inset-0">
															<Icon path={ellipsisHorizontal} class="h-5 w-5" />
														</div>
													</a>
												)}
											</div>
										);
									})}
								</div>
								<a
									href={switchingSpaces() ? '/manage-spaces' : '/manage-personas'}
									class="border-t border-mg2 h-10 fx transition hover:bg-mg2 px-2 py-1"
									onMouseDown={(e) => e.preventDefault()}
									onClick={() => {
										switchingSpacesSet(false);
										switchingPersonasSet(false);
									}}
								>
									<div class="h-6 w-6 xy">
										{switchingSpaces() ? (
											<Icon path={square_2Stack} class="h-6 w-6" />
										) : (
											<Icon path={userGroup} class="h-6 w-6" />
										)}
									</div>
									<p class="ml-1.5 text-lg font-medium">
										{/* TODO: Button should say add space or create persona? */}
										Manage {switchingSpaces() ? 'spaces' : 'personas'}
									</p>
								</a>
								{!switchingSpaces && (
									<button
										class="w-full border-t border-mg2 h-10 fx transition hover:bg-mg2 px-2 py-1"
										onMouseDown={(e) => e.preventDefault()}
										onClick={() => {
											switchingSpacesSet(false);
											switchingPersonasSet(false);
											if (hostedLocally) {
												ping(makeUrl('lock-all-personas')).catch((err) => alert(err));
											}
											personasSet((old) => {
												old.forEach((p) => {
													if (!!p.id) p.locked = true;
												});
												old.splice(
													0,
													0,
													old.splice(
														old.findIndex((p) => !p.id),
														1,
													)[0],
												);
												return [...old];
											});
											navigate('/');
										}}
									>
										<div class="h-6 w-6 xy">
											<Icon path={lockClosed} class="h-6 w-6" />
										</div>
										<p class="ml-1.5 text-lg font-medium">Lock all personas</p>
									</button>
								)}
							</div>
						</>
					)}
				</header>
			)}
		</>
	);
}
