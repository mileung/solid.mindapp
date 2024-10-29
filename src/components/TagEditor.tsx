import { ArrowTopRightOnSquare, A, Trash, XMark } from 'solid-heroicons/solid';
import { useCallback, createEffect, createMemo, useRef, createSignal } from 'solid-js';
import InputAutoWidth from '../components/InputAutoWidth';
import { RecursiveTag, getNodes, getNodesArr } from '../utils/tags';
import { useLastUsedTags, useTagTree } from '../utils/state';
import { matchSorter } from 'match-sorter';
import { A } from 'react-router-dom';

const TagEditor = ({
	_ref,
	subTaggingLineage,
	recTag,
	parentTag,
	onRename,
	onLinkClick,
	onSubtag,
	onRemove,
	onKeyDown,
}: {
	_ref?: ((r: HTMLInputElement | null) => void) | React.MutableRefObject<HTMLInputElement | null>;
	subTaggingLineage: string[];
	recTag: RecursiveTag;
	parentTag?: string;
	onRename: (oldTag: string, newTag: string, newSubTaggingLineage: string[]) => void | Promise<any>;
	onLinkClick: (tag: string, e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
	onSubtag: (tag: string, parentTag: string, newSubTaggingLineage: string[]) => void | Promise<any>;
	onRemove: (currentTagLabel: string, parentTag?: string) => void;
	onKeyDown?: React.DOMAttributes<HTMLInputElement>['onKeyDown'];
}) => {
	const [addingSubtag, addingSubtagSet] = createSignal(
		JSON.stringify(recTag.lineage) === JSON.stringify(subTaggingLineage),
	);
	createEffect(() => {
		addingSubtagSet(JSON.stringify(recTag.lineage) === JSON.stringify(subTaggingLineage));
	}, [recTag.lineage, subTaggingLineage]);
	const [editing, editingSet] = createSignal(false);
	const [tagFilter, tagFilterSet] = createSignal('');
	const [tagIndex, tagIndexSet] = createSignal<number>(0);
	const [suggestTags, suggestTagsSet] = createSignal(false);
	const defaultLabel = useRef(recTag.label);
	const editingIpt = useRef<null | HTMLInputElement>(null);
	const tagLnk = useRef<HTMLAnchorElement>(null);
	const makeSubsetBtn = useRef<HTMLButtonElement>(null);
	const removeBtn = useRef<HTMLButtonElement>(null);
	const addingIpt = useRef<HTMLInputElement>(null);
	const tagSuggestionsRefs = useRef<(null | HTMLButtonElement)[]>([]);

	const nodesArr = createMemo(() => tagTree && getNodesArr(getNodes(tagTree)), [tagTree]);
	const trimmedFilter = createMemo(() => tagFilter.trim(), [tagFilter]);
	const suggestedTags = createMemo(() => {
		if (!nodesArr || !suggestTags) return [];
		let arr = matchSorter(nodesArr, tagFilter);
		trimmedFilter ? arr.push(trimmedFilter) : arr.unshift(...lastUsedTags);
		const ignoredSuggestedTags = new Set(
			recTag.subRecTags?.map((t) => t.label).concat(recTag.label),
		);
		arr = [...new Set(arr)].filter((tag) => !ignoredSuggestedTags.has(tag));
		return arr;
	}, [nodesArr, suggestTags, tagFilter, trimmedFilter, lastUsedTags, recTag]);
	const onEditingBlur = useCallback(() => {
		editingIpt!.value = defaultLabel;
		setTimeout(() => {
			if (
				document.activeElement !== editingIpt &&
				document.activeElement !== tagLnk &&
				document.activeElement !== makeSubsetBtn &&
				document.activeElement !== removeBtn
			) {
				editingSet(false);
			}
		}, 0);
	}, [recTag.label]);
	const addSubTag = useCallback(
		(
			e: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent<HTMLButtonElement, MouseEvent>,
			tagToAdd?: string,
		) => {
			tagToAdd = tagToAdd || suggestedTags?.[tagIndex] || trimmedFilter;
			if (!tagToAdd) return;
			addingIpt!.focus();
			lastUsedTagsSet([...new Set([tagToAdd, ...lastUsedTags])].slice(0, 5));
			onSubtag(
				tagToAdd,
				recTag.label,
				e.ctrlKey ? recTag.lineage.concat(tagToAdd) : e.altKey ? recTag.lineage : [],
			)?.then(() => {
				setTimeout(() => {
					addingIpt && (addingIpt?.value = '');
					tagFilterSet('');
				}, 0);
			});
		},
		[suggestedTags, tagIndex, trimmedFilter, lastUsedTags, recTag],
	);

	createEffect(() => {
		editingIpt!.value = recTag.label;
		defaultLabel = recTag.label;
	}, [recTag.label]);

	return (
		<div>
			<div class="fx">
				<InputAutoWidth
					ref={(r: HTMLInputElement | null) => {
						editingIpt = r;
						if (_ref) {
							// @ts-ignore
							typeof _ref === 'function' ? _ref(r) : (_ref = r);
						}
					}}
					defaultValue={recTag.label}
					placeholder="Edit tag"
					size={1}
					class="h-8 min-w-52 border-b-2 text-xl font-medium transition border-bg1 hover:border-mg2 focus:border-fg2"
					onBlur={onEditingBlur}
					onFocus={() => editingSet(true)}
					onKeyDown={(e) => {
						onKeyDown?.(e);
						e.key === 'Escape' && editingIpt?.blur();
						const newLabel = editingIpt?.value.trim();
						if (!newLabel) return;
						if (e.key === 'Enter') {
							if (e.altKey) {
								addingSubtagSet(true);
							}
							if (newLabel !== recTag.label) {
								editingSet(false);
								defaultLabel = newLabel;
								// editingIpt?.blur();
								onRename(
									recTag.label,
									newLabel,
									e.ctrlKey
										? recTag.lineage.slice(0, -1).concat(newLabel)
										: e.altKey
										? recTag.lineage.slice(0, -1)
										: [],
								);
							}
						}
					}}
				/>
				{editing && (
					<>
						<A
							class="xy h-8 w-8 group"
							ref={tagLnk}
							onBlur={onEditingBlur}
							href={`/tags/${recTag.label}`}
							onClick={(e) => onLinkClick(recTag.label, e)}
						>
							<A class="h-6 w-6 mt-1 rotate-90 transition text-fg2 group-hover:text-fg1" />
						</A>
						<button
							class="xy h-8 w-8 group"
							title="Add subtags"
							ref={makeSubsetBtn}
							onBlur={onEditingBlur}
							onClick={() => {
								addingSubtagSet(true);
								editingSet(false);
							}}
						>
							<ArrowTopRightOnSquare class="h-6 w-6 mt-1 rotate-90 transition text-fg2 group-hover:text-fg1" />
						</button>
						<button
							class="xy h-8 w-8 group"
							ref={removeBtn}
							onBlur={onEditingBlur}
							onKeyDown={(e) => e.key === 'Tab' && !e.shiftKey && editingSet(false)}
							onClick={() => {
								const ok =
									!!parentTag || confirm(`You are about to delete the "${recTag.label}" tag`);
								ok ? onRemove(recTag.label, parentTag) : editingIpt?.focus();
							}}
						>
							{parentTag ? (
								<XMark class="h-7 w-7 transition text-fg2 group-hover:text-fg1" />
							) : (
								<Trash class="h-5 w-5 transition text-fg2 group-hover:text-fg1" />
							)}
						</button>
					</>
				)}
			</div>
			<div class="pl-3 border-l-2 border-fg2 w-fit relative">
				{addingSubtag && (
					<>
						<InputAutoWidth
							ref={addingIpt}
							autoFocus
							placeholder="Subtag"
							size={1}
							class="h-8 min-w-52 border-b-2 text-xl font-medium transition border-mg2 hover:border-fg2 focus:border-fg2"
							onClick={() => suggestTagsSet(true)}
							onFocus={() => suggestTagsSet(true)}
							value={tagFilter}
							onChange={(e) => {
								tagSuggestionsRefs[0]?.focus();
								addingIpt?.focus();
								tagIndexSet(0);
								suggestTagsSet(true);
								tagFilterSet(e.target.value);
							}}
							onKeyDown={(e) => {
								e.key === 'Enter' && addSubTag(e);
								e.key === 'Tab' && suggestTagsSet(false);
								e.key === 'Escape' && (suggestTags ? suggestTagsSet(false) : addingIpt?.blur());
								if (e.key === 'ArrowUp') {
									e.preventDefault();
									const index = Math.max(tagIndex - 1, -1);
									tagSuggestionsRefs[index]?.focus();
									addingIpt?.focus();
									tagIndexSet(index);
								}
								if (e.key === 'ArrowDown') {
									e.preventDefault();
									const index = Math.min(tagIndex + 1, suggestedTags!.length - 1);
									tagSuggestionsRefs[index]?.focus();
									addingIpt?.focus();
									tagIndexSet(index);
								}
							}}
							onBlur={() => {
								setTimeout(() => {
									if (
										document.activeElement !== addingIpt &&
										!tagSuggestionsRefs.find((e) => e === document.activeElement)
									) {
										tagIndexSet(0);
										addingSubtagSet(false);
									}
								}, 0);
							}}
						/>
						{suggestTags && (
							<div class="z-20 flex flex-col overflow-scroll rounded mt-0.5 bg-mg1 absolute min-w-[calc(100%-12px)] max-h-56 shadow">
								{suggestedTags.map((tag, i) => {
									return (
										<button
											key={i}
											ref={(r) => (tagSuggestionsRefs[i] = r)}
											class={`fx px-2 text-nowrap text-xl hover:bg-mg2 ${
												tagIndex === i ? 'bg-mg2' : 'bg-mg1'
											}`}
											onClick={(e) => addSubTag(e, tag)}
										>
											{tag}
										</button>
									);
								})}
							</div>
						)}
					</>
				)}
				{recTag.subRecTags?.map((subRecTag) => (
					<TagEditor
						key={subRecTag.label}
						subTaggingLineage={subTaggingLineage}
						parentTag={recTag.label}
						recTag={subRecTag}
						onRename={onRename}
						onLinkClick={onLinkClick}
						onSubtag={onSubtag}
						onRemove={onRemove}
					/>
				))}
			</div>
		</div>
	);
};

export default TagEditor;
