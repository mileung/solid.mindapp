import { Title } from '@solidjs/meta';
import { A, useSearchParams } from '@solidjs/router';
import { matchSorter } from 'match-sorter';
import { createEffect, createMemo, createSignal, onMount } from 'solid-js';
import Drawer from '~/components/Drawer';
import RecTagLink from '~/components/RecTagLink';
import Results from '~/components/Results';
import { tagMapOpen, tagMapOpenSet, tagTree } from '~/utils/state';
import { getNodes, getNodesArr, getParentsMap, getTags, makeRootTag } from '~/utils/tags';

export default function Home() {
	const [tagFilter, tagFilterSet] = createSignal('');
	const [searchParams, searchParamsSet] = useSearchParams();
	const q = searchParams.q?.toString() || '';
	const tags = getTags(q);
	let searchIpt: undefined | HTMLInputElement;
	let tagMapDiv: undefined | HTMLDivElement;
	let tagMapDiv2: undefined | HTMLDivElement;
	const nodes = createMemo(() => tagTree && getNodes(tagTree));
	const nodesArr = createMemo(() => nodes && getNodesArr(nodes()));
	const normalizedTagFilter = createMemo(() => tagFilter().trim().replace(/\s+/g, ''));
	const filteredTags = createMemo(
		() =>
			nodesArr() &&
			(normalizedTagFilter ? matchSorter(nodesArr(), normalizedTagFilter()) : nodesArr()),
	);
	const focusedTag = createMemo(() => tags.length === 1 && tags[0]);
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

	const tagMap = (
		<div class="">
			<div class="sticky bg-bg2 top-0 flex">
				<input
					ref={searchIpt}
					value={tagFilter()}
					class="w-full px-2 h-8 border-b-2 text-lg font-medium transition border-mg1 hover:border-mg2 focus:border-mg2"
					placeholder="Tag filter"
					onChange={(e) => tagFilterSet(e.target.value)}
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
							{(rootParents() || []).map((name, i) => {
								return (
									<A
										class="xy flex-grow rounded transition px-1.5 font-medium border-2 text-fg2 border-mg1 hover:text-fg1 hover:border-mg2"
										href={`/?q=${encodeURIComponent(`[${name}]`)}`}
										onClick={onTagClick}
									>
										{name}
									</A>
								);
							})}
						</div>
						<div class="mt-1.5">
							{rootTag() && <RecTagLink isRoot recTag={rootTag()!} onClick={onTagClick} />}
						</div>
					</div>
				) : (
					<div class="fx flex-wrap gap-1 bg-bg2">
						{(filteredTags() || []).map((name, i) => {
							return (
								<A
									class="xy flex-grow rounded transition px-1.5 font-medium border-2 text-fg2 border-mg1 hover:text-fg1 hover:border-mg2"
									href={`/?q=${encodeURIComponent(`[${name}]`)}`}
									onClick={onTagClick}
								>
									{name}
								</A>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);

	return (
		<div class="flex p-1.5 sm:p-3">
			<Results />
			<Drawer isOpen={tagMapOpen()} onClose={() => tagMapOpenSet(false)}>
				<div ref={tagMapDiv} class="overflow-y-scroll overflow-x-hidden h-screen">
					{tagMap}
				</div>
			</Drawer>
			<div
				ref={tagMapDiv2}
				class="h-[calc(100vh-4.5rem)] sticky top-[3.75rem] hidden md:block md:ml-1.5 md:rounded pt-0 bg-bg2 w-[70%] max-w-lg md:min-w-80 md:w-[30%] flex-col self-start overflow-y-scroll overflow-x-hidden"
			>
				{tagMap}
			</div>
		</div>
	);
}
