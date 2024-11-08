import { Title } from '@solidjs/meta';
import { A, useSearchParams } from '@solidjs/router';
import { matchSorter } from 'match-sorter';
import { Icon } from 'solid-heroicons';
import { bars_3 } from 'solid-heroicons/solid-mini';
import { createEffect, createMemo, createSignal, onMount } from 'solid-js';
import { createStore } from 'solid-js/store';
import Drawer from '~/components/Drawer';
import RecTagLink from '~/components/RecTagLink';
import Results from '~/components/Results';
import { hostedLocally } from '~/utils/api';
import { rootSettings, tagMapOpen, tagMapOpenSet, tagTree } from '~/utils/state';
import {
	getTagRelations,
	listAllTags,
	getParentsMap,
	getTags,
	makeRootTag,
	sortKeysByNodeCount,
} from '~/utils/tags';

const makeTitle = (str: string) => `${str ? `${str} | ` : ''}Mindapp`;
const createTitle = (str: () => string) => {
	createEffect(() => {
		document.title = makeTitle(str());
	});
};
export { createTitle }; // idk y the export can't be inline

export default function Home() {
	const [tagFilter, tagFilterSet] = createSignal('');
	const [searchParams, searchParamsSet] = useSearchParams();
	const q = createMemo(() => searchParams.q?.toString() || '');
	createTitle(q);
	const searchedTags = createMemo(() => getTags(q()));
	let searchIpt: undefined | HTMLInputElement;
	let tagMapDiv: undefined | HTMLDivElement;
	let tagMapDiv2: undefined | HTMLDivElement;

	const allTags = createMemo(() => listAllTags(getTagRelations(tagTree)));
	const defaultTags = createMemo(() => sortKeysByNodeCount(tagTree));
	const filteredTags = createMemo(() => {
		const filter = tagFilter().trim().replace(/\s+/g, ' ');
		return !filter ? defaultTags() : allTags() && matchSorter(allTags(), filter).slice(0, 99);
	});
	const focusedTag = createMemo(() => searchedTags().length === 1 && searchedTags()[0]);
	const parentsMap = createMemo(() => tagTree && getParentsMap(tagTree));
	const rootParents = createMemo(() => {
		const str = focusedTag();
		return (str && parentsMap()?.[str]) || null;
	});
	const rootTag = createMemo(() => {
		const str = focusedTag();
		return tagTree && str ? makeRootTag(tagTree, str) : null;
	});

	const onTagClick = (e: MouseEvent) => {
		if (!e.metaKey && !e.shiftKey) {
			tagFilterSet('');
			tagMapOpenSet(false);
			tagMapDiv!.scrollTop = 0;
			tagMapDiv2!.scrollTop = 0;
		}
	};

	const TagMap = () => {
		return (
			<div class="">
				<div class="sticky bg-bg2 top-0 flex">
					<input
						ref={searchIpt}
						value={tagFilter()}
						class="w-full px-2 h-10 border-b-2 text-lg font-medium transition border-mg1 hover:border-mg2 focus:border-mg2"
						placeholder="Tag filter"
						onInput={(e) => tagFilterSet(e.target.value)}
						onKeyDown={(e) => {
							e.key === 'Escape' && searchIpt?.blur();
						}}
					/>
				</div>
				<div class="flex-1 p-1">
					{focusedTag() && !tagFilter() ? (
						<div class="">
							<div class="fx flex-wrap gap-1 bg-bg2">
								{tagTree && !rootParents() && <p class="xy flex-grow text-fg2">No parent tags</p>}
								{(rootParents() || []).map((name) => {
									return (
										<A
											class="xy flex-grow rounded transition px-1.5 font-medium border-2 text-fg2 border-mg1 hover:text-fg1 hover:border-mg2"
											href={`/?q=[${encodeURIComponent(name)}]`}
											onClick={onTagClick}
										>
											{name}
										</A>
									);
								})}
							</div>
							<div class="mt-1.5">
								{rootTag() && (
									<RecTagLink
										isRoot
										// @ts-ignore // TODO: what's an elegant way to fix this type?
										recTag={rootTag}
										onClick={onTagClick}
									/>
								)}
							</div>
						</div>
					) : (
						<div class="fx flex-wrap gap-1 bg-bg2">
							{filteredTags().map((name) => {
								// if (name.startsWith('YouTube@') || name.startsWith('Twitter@')) return null;
								return (
									<A
										class="xy flex-grow rounded transition px-1.5 font-medium border-2 text-fg2 border-mg1 hover:text-fg1 hover:border-mg2"
										href={`/?q=[${encodeURIComponent(name)}]`}
										onClick={onTagClick}
									>
										{name}
									</A>
								);
							})}
						</div>
					)}
					{/* {!tagFilter() && !focusedTag() && (
						<div class="border-t mt-3 py-1 border-mg1 xy">
							<a
								target="_blank"
								// idk which url to use yet
								href="https://github.com/mileung/solid.mindapp"
								// href="https://github.com/mileung/mindapp"
								class="text-center text-sm transition text-fg2 hover:text-fg1"
							>
								Mindapp source code
							</a>
						</div>
					)} */}
				</div>
			</div>
		);
	};

	return (
		<div class="flex p-1.5 sm:p-3">
			<Title>{makeTitle(q())}</Title>
			<div class="w-full md:w-[calc(100%-30%)]">
				<Results />
			</div>
			<Drawer isOpen={tagMapOpen} onClose={() => tagMapOpenSet(false)}>
				<div ref={tagMapDiv} class="overflow-y-scroll overflow-x-hidden h-screen md:hidden">
					<div class="fx h-12">
						<button
							class="xy mr-2 h-full w-10 text-fg2 transition hover:text-fg1"
							onClick={() => tagMapOpenSet(!tagMapOpen())}
						>
							<Icon path={bars_3} class="h-7 w-7" />
						</button>
						<a href="/" class="fx shrink-0" onClick={() => tagMapOpenSet(!tagMapOpen())}>
							<img
								src={'/mindapp-logo.svg'}
								alt="logo"
								class={`h-6 ${hostedLocally && rootSettings.testWorkingDirectory && 'grayscale'}`}
							/>
							<p class="ml-2 text-xl font-black">Mindapp</p>
						</a>
					</div>
					<TagMap />
				</div>
			</Drawer>
			<div
				ref={tagMapDiv2}
				class="h-[calc(100vh-4.5rem)] sticky top-[3.75rem] hidden pt-0 bg-bg2 w-[70%] flex-col self-start overflow-y-scroll overflow-x-hidden md:block md:ml-1.5 md:rounded md:w-[30%]"
			>
				<TagMap />
			</div>
		</div>
	);
}
